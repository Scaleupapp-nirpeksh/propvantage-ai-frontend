// File: src/pages/competitive-analysis/CompetitorFormPage.js
// Description: Multi-step form for creating and editing competitor projects
// Version: 1.0

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Slider,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  NavigateNext,
  NavigateBefore,
  Save,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, CardGridSkeleton } from '../../components/common';

// =============================================================================
// CONSTANTS
// =============================================================================

const STEPS = ['Basic Info & Location', 'Pricing & Unit Mix', 'Amenities & Details'];

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'plotted_development', label: 'Plotted Development' },
];

const PROJECT_STATUSES = [
  { value: 'pre_launch', label: 'Pre Launch' },
  { value: 'newly_launched', label: 'Newly Launched' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'completed', label: 'Completed' },
];

const UNIT_TYPES = [
  '1BHK', '2BHK', '3BHK', '4BHK', '5BHK',
  'Penthouse', 'Studio', 'Villa', 'Shop', 'Office',
];

const PLAN_TYPES = [
  { value: 'construction_linked', label: 'Construction Linked' },
  { value: 'time_based', label: 'Time Based' },
  { value: 'subvention', label: 'Subvention' },
  { value: 'flexi', label: 'Flexi' },
  { value: 'possession_linked', label: 'Possession Linked' },
  { value: 'other', label: 'Other' },
];

const DATA_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'ai_research', label: 'AI Research' },
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'web_research', label: 'Web Research' },
];

const AMENITY_LABELS = {
  gym: 'Gym',
  swimmingPool: 'Swimming Pool',
  clubhouse: 'Clubhouse',
  garden: 'Garden',
  playground: 'Playground',
  powerBackup: 'Power Backup',
  security24x7: '24x7 Security',
  lifts: 'Lifts',
  joggingTrack: 'Jogging Track',
  indoorGames: 'Indoor Games',
  multipurposeHall: 'Multipurpose Hall',
  rainwaterHarvesting: 'Rainwater Harvesting',
  solarPanels: 'Solar Panels',
  evCharging: 'EV Charging',
  concierge: 'Concierge',
  coWorkingSpace: 'Co-Working Space',
};

const initialFormData = {
  projectName: '',
  developerName: '',
  reraNumber: '',
  location: { city: '', area: '', state: '', pincode: '', micromarket: '' },
  projectType: 'residential',
  projectStatus: 'under_construction',
  possessionTimeline: { description: '' },
  totalUnits: '',
  totalTowers: '',
  totalAreaAcres: '',
  pricing: {
    pricePerSqft: { min: '', max: '', avg: '' },
    basePriceRange: { min: '', max: '' },
    floorRiseCharge: '',
    facingPremiums: { parkFacing: '', roadFacing: '', cornerUnit: '' },
    plcCharges: '',
    parkingCharges: { covered: '', open: '' },
    clubMembershipCharges: '',
    maintenanceDeposit: '',
    legalCharges: '',
    gstRate: 5,
    stampDutyRate: '',
  },
  unitMix: [],
  amenities: {
    gym: false, swimmingPool: false, clubhouse: false, garden: false,
    playground: false, powerBackup: false, security24x7: false, lifts: false,
    joggingTrack: false, indoorGames: false, multipurposeHall: false,
    rainwaterHarvesting: false, solarPanels: false, evCharging: false,
    concierge: false, coWorkingSpace: false, other: [],
  },
  paymentPlans: [],
  dataSource: 'manual',
  confidenceScore: 60,
  notes: '',
};

const emptyUnitMixRow = {
  unitType: '2BHK',
  carpetAreaRange: { min: '', max: '' },
  priceRange: { min: '', max: '' },
  totalCount: '',
  availableCount: '',
};

const emptyPaymentPlan = {
  planName: '',
  planType: 'construction_linked',
  bookingPercentage: '',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Deep-clean form data before submission:
 * - Convert numeric strings to numbers
 * - Convert empty strings to undefined so the backend ignores them
 */
const cleanFormData = (data) => {
  const clean = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(clean).filter((item) => {
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).some((v) => v !== undefined && v !== '');
        }
        return item !== undefined && item !== '';
      });
    }
    if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleaned = clean(value);
        if (cleaned !== undefined) {
          result[key] = cleaned;
        }
      }
      return Object.keys(result).length > 0 ? result : undefined;
    }
    if (typeof obj === 'string') {
      if (obj.trim() === '') return undefined;
      const num = Number(obj);
      if (!isNaN(num) && obj.trim() !== '') return num;
      return obj.trim();
    }
    return obj;
  };

  const cleaned = clean(data);
  // Ensure projectName and developerName stay as strings
  if (cleaned.projectName !== undefined) cleaned.projectName = String(data.projectName).trim();
  if (cleaned.developerName !== undefined) cleaned.developerName = String(data.developerName).trim();
  if (cleaned.reraNumber !== undefined) cleaned.reraNumber = String(data.reraNumber).trim();
  if (cleaned.notes !== undefined) cleaned.notes = String(data.notes).trim();
  if (data.location) {
    if (!cleaned.location) cleaned.location = {};
    if (data.location.city) cleaned.location.city = String(data.location.city).trim();
    if (data.location.area) cleaned.location.area = String(data.location.area).trim();
    if (data.location.state) cleaned.location.state = String(data.location.state).trim();
    if (data.location.micromarket) cleaned.location.micromarket = String(data.location.micromarket).trim();
    if (data.location.pincode) cleaned.location.pincode = String(data.location.pincode).trim();
  }
  if (data.possessionTimeline?.description) {
    if (!cleaned.possessionTimeline) cleaned.possessionTimeline = {};
    cleaned.possessionTimeline.description = String(data.possessionTimeline.description).trim();
  }
  // Preserve dataSource as string
  cleaned.dataSource = data.dataSource;
  // Preserve projectType and projectStatus
  cleaned.projectType = data.projectType;
  cleaned.projectStatus = data.projectStatus;
  // Preserve amenities
  cleaned.amenities = { ...data.amenities };
  // Preserve confidenceScore
  cleaned.confidenceScore = data.confidenceScore;

  return cleaned;
};

// =============================================================================
// COMPONENT
// =============================================================================

const CompetitorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(id);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');

  // ── Load existing data in edit mode ──
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    const fetchCompetitor = async () => {
      setFetching(true);
      try {
        const { data } = await competitiveAnalysisAPI.getCompetitor(id);
        const competitor = data.data || data;
        if (cancelled) return;

        setFormData({
          projectName: competitor.projectName || '',
          developerName: competitor.developerName || '',
          reraNumber: competitor.reraNumber || '',
          location: {
            city: competitor.location?.city || '',
            area: competitor.location?.area || '',
            state: competitor.location?.state || '',
            pincode: competitor.location?.pincode || '',
            micromarket: competitor.location?.micromarket || '',
          },
          projectType: competitor.projectType || 'residential',
          projectStatus: competitor.projectStatus || 'under_construction',
          possessionTimeline: {
            description: competitor.possessionTimeline?.description || '',
          },
          totalUnits: competitor.totalUnits ?? '',
          totalTowers: competitor.totalTowers ?? '',
          totalAreaAcres: competitor.totalAreaAcres ?? '',
          pricing: {
            pricePerSqft: {
              min: competitor.pricing?.pricePerSqft?.min ?? '',
              max: competitor.pricing?.pricePerSqft?.max ?? '',
              avg: competitor.pricing?.pricePerSqft?.avg ?? '',
            },
            basePriceRange: {
              min: competitor.pricing?.basePriceRange?.min ?? '',
              max: competitor.pricing?.basePriceRange?.max ?? '',
            },
            floorRiseCharge: competitor.pricing?.floorRiseCharge ?? '',
            facingPremiums: {
              parkFacing: competitor.pricing?.facingPremiums?.parkFacing ?? '',
              roadFacing: competitor.pricing?.facingPremiums?.roadFacing ?? '',
              cornerUnit: competitor.pricing?.facingPremiums?.cornerUnit ?? '',
            },
            plcCharges: competitor.pricing?.plcCharges ?? '',
            parkingCharges: {
              covered: competitor.pricing?.parkingCharges?.covered ?? '',
              open: competitor.pricing?.parkingCharges?.open ?? '',
            },
            clubMembershipCharges: competitor.pricing?.clubMembershipCharges ?? '',
            maintenanceDeposit: competitor.pricing?.maintenanceDeposit ?? '',
            legalCharges: competitor.pricing?.legalCharges ?? '',
            gstRate: competitor.pricing?.gstRate ?? 5,
            stampDutyRate: competitor.pricing?.stampDutyRate ?? '',
          },
          unitMix: (competitor.unitMix || []).map((u) => ({
            unitType: u.unitType || '2BHK',
            carpetAreaRange: { min: u.carpetAreaRange?.min ?? '', max: u.carpetAreaRange?.max ?? '' },
            priceRange: { min: u.priceRange?.min ?? '', max: u.priceRange?.max ?? '' },
            totalCount: u.totalCount ?? '',
            availableCount: u.availableCount ?? '',
          })),
          amenities: {
            gym: competitor.amenities?.gym || false,
            swimmingPool: competitor.amenities?.swimmingPool || false,
            clubhouse: competitor.amenities?.clubhouse || false,
            garden: competitor.amenities?.garden || false,
            playground: competitor.amenities?.playground || false,
            powerBackup: competitor.amenities?.powerBackup || false,
            security24x7: competitor.amenities?.security24x7 || false,
            lifts: competitor.amenities?.lifts || false,
            joggingTrack: competitor.amenities?.joggingTrack || false,
            indoorGames: competitor.amenities?.indoorGames || false,
            multipurposeHall: competitor.amenities?.multipurposeHall || false,
            rainwaterHarvesting: competitor.amenities?.rainwaterHarvesting || false,
            solarPanels: competitor.amenities?.solarPanels || false,
            evCharging: competitor.amenities?.evCharging || false,
            concierge: competitor.amenities?.concierge || false,
            coWorkingSpace: competitor.amenities?.coWorkingSpace || false,
            other: competitor.amenities?.other || [],
          },
          paymentPlans: (competitor.paymentPlans || []).map((p) => ({
            planName: p.planName || '',
            planType: p.planType || 'construction_linked',
            bookingPercentage: p.bookingPercentage ?? '',
          })),
          dataSource: competitor.dataSource || 'manual',
          confidenceScore: competitor.confidenceScore ?? 60,
          notes: competitor.notes || '',
        });
      } catch (err) {
        enqueueSnackbar('Failed to load competitor data', { variant: 'error' });
        navigate('/competitive-analysis/competitors');
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    fetchCompetitor();
    return () => { cancelled = true; };
  }, [id, isEditMode, enqueueSnackbar, navigate]);

  // ── Field change handlers ──
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const handleNestedChange = useCallback((parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [`${parent}.${field}`]: '' }));
  }, []);

  const handleDeepNestedChange = useCallback((parent, child, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: { ...prev[parent][child], [field]: value },
      },
    }));
  }, []);

  // ── Unit mix handlers ──
  const addUnitMixRow = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      unitMix: [...prev.unitMix, { ...emptyUnitMixRow }],
    }));
  }, []);

  const removeUnitMixRow = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      unitMix: prev.unitMix.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUnitMixChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.unitMix];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, unitMix: updated };
    });
  }, []);

  const handleUnitMixNestedChange = useCallback((index, parent, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.unitMix];
      updated[index] = {
        ...updated[index],
        [parent]: { ...updated[index][parent], [field]: value },
      };
      return { ...prev, unitMix: updated };
    });
  }, []);

  // ── Payment plan handlers ──
  const addPaymentPlan = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      paymentPlans: [...prev.paymentPlans, { ...emptyPaymentPlan }],
    }));
  }, []);

  const removePaymentPlan = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      paymentPlans: prev.paymentPlans.filter((_, i) => i !== index),
    }));
  }, []);

  const handlePaymentPlanChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.paymentPlans];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, paymentPlans: updated };
    });
  }, []);

  // ── Amenity handlers ──
  const toggleAmenity = useCallback((key) => {
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }));
  }, []);

  const addCustomAmenity = useCallback(() => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        other: [...prev.amenities.other, trimmed],
      },
    }));
    setCustomAmenity('');
  }, [customAmenity]);

  const removeCustomAmenity = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        other: prev.amenities.other.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ── Validation ──
  const validateStep = useCallback((step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
      if (!formData.developerName.trim()) newErrors.developerName = 'Developer name is required';
      if (!formData.location.city.trim()) newErrors['location.city'] = 'City is required';
      if (!formData.location.area.trim()) newErrors['location.area'] = 'Area is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ── Navigation ──
  const handleNext = useCallback(() => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  }, [activeStep, validateStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    setLoading(true);
    setSubmitError('');

    try {
      const cleaned = cleanFormData(formData);
      if (isEditMode) {
        await competitiveAnalysisAPI.updateCompetitor(id, cleaned);
        enqueueSnackbar('Competitor updated successfully', { variant: 'success' });
      } else {
        await competitiveAnalysisAPI.createCompetitor(cleaned);
        enqueueSnackbar('Competitor created successfully', { variant: 'success' });
      }
      navigate('/competitive-analysis/competitors');
    } catch (err) {
      if (err.response?.status === 409) {
        const msg = err.response?.data?.message || 'A competitor with this name already exists';
        setSubmitError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
      } else {
        const msg = err.response?.data?.message || 'Failed to save competitor';
        setSubmitError(msg);
        enqueueSnackbar(msg, { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state for edit mode ──
  if (fetching) {
    return (
      <Box>
        <PageHeader
          title="Edit Competitor"
          subtitle="Loading competitor data..."
        />
        <CardGridSkeleton count={3} />
      </Box>
    );
  }

  // =====================================================================
  // STEP 1: Basic Info & Location
  // =====================================================================
  const renderStep1 = () => (
    <Grid container spacing={3}>
      {/* Project Details */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Project Details
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Project Name"
          value={formData.projectName}
          onChange={(e) => handleChange('projectName', e.target.value)}
          error={Boolean(errors.projectName)}
          helperText={errors.projectName}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Developer Name"
          value={formData.developerName}
          onChange={(e) => handleChange('developerName', e.target.value)}
          error={Boolean(errors.developerName)}
          helperText={errors.developerName}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="RERA Number"
          value={formData.reraNumber}
          onChange={(e) => handleChange('reraNumber', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small" required>
          <InputLabel>Project Type</InputLabel>
          <Select
            value={formData.projectType}
            label="Project Type"
            onChange={(e) => handleChange('projectType', e.target.value)}
          >
            {PROJECT_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small" required>
          <InputLabel>Project Status</InputLabel>
          <Select
            value={formData.projectStatus}
            label="Project Status"
            onChange={(e) => handleChange('projectStatus', e.target.value)}
          >
            {PROJECT_STATUSES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Possession Timeline"
          placeholder="e.g. June 2028"
          value={formData.possessionTimeline.description}
          onChange={(e) => handleNestedChange('possessionTimeline', 'description', e.target.value)}
        />
      </Grid>

      {/* Counts */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Total Units"
          type="number"
          value={formData.totalUnits}
          onChange={(e) => handleChange('totalUnits', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Total Towers"
          type="number"
          value={formData.totalTowers}
          onChange={(e) => handleChange('totalTowers', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Total Area (Acres)"
          type="number"
          value={formData.totalAreaAcres}
          onChange={(e) => handleChange('totalAreaAcres', e.target.value)}
        />
      </Grid>

      {/* Location */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Location
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="City"
          value={formData.location.city}
          onChange={(e) => handleNestedChange('location', 'city', e.target.value)}
          error={Boolean(errors['location.city'])}
          helperText={errors['location.city']}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Area"
          value={formData.location.area}
          onChange={(e) => handleNestedChange('location', 'area', e.target.value)}
          error={Boolean(errors['location.area'])}
          helperText={errors['location.area']}
          required
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="State"
          value={formData.location.state}
          onChange={(e) => handleNestedChange('location', 'state', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Pincode"
          value={formData.location.pincode}
          onChange={(e) => handleNestedChange('location', 'pincode', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Micromarket"
          value={formData.location.micromarket}
          onChange={(e) => handleNestedChange('location', 'micromarket', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  // =====================================================================
  // STEP 2: Pricing & Unit Mix
  // =====================================================================
  const renderStep2 = () => (
    <Grid container spacing={3}>
      {/* Price Per Sqft */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Price Per Sqft
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Min (per sqft)"
          type="number"
          value={formData.pricing.pricePerSqft.min}
          onChange={(e) => handleDeepNestedChange('pricing', 'pricePerSqft', 'min', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Max (per sqft)"
          type="number"
          value={formData.pricing.pricePerSqft.max}
          onChange={(e) => handleDeepNestedChange('pricing', 'pricePerSqft', 'max', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Avg (per sqft)"
          type="number"
          value={formData.pricing.pricePerSqft.avg}
          onChange={(e) => handleDeepNestedChange('pricing', 'pricePerSqft', 'avg', e.target.value)}
        />
      </Grid>

      {/* Base Price Range */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Base Price Range
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Min Base Price"
          type="number"
          value={formData.pricing.basePriceRange.min}
          onChange={(e) => handleDeepNestedChange('pricing', 'basePriceRange', 'min', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Max Base Price"
          type="number"
          value={formData.pricing.basePriceRange.max}
          onChange={(e) => handleDeepNestedChange('pricing', 'basePriceRange', 'max', e.target.value)}
        />
      </Grid>

      {/* Other Charges */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Additional Charges
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Floor Rise Charge"
          type="number"
          value={formData.pricing.floorRiseCharge}
          onChange={(e) => handleNestedChange('pricing', 'floorRiseCharge', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="PLC Charges"
          type="number"
          value={formData.pricing.plcCharges}
          onChange={(e) => handleNestedChange('pricing', 'plcCharges', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Club Membership Charges"
          type="number"
          value={formData.pricing.clubMembershipCharges}
          onChange={(e) => handleNestedChange('pricing', 'clubMembershipCharges', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Maintenance Deposit"
          type="number"
          value={formData.pricing.maintenanceDeposit}
          onChange={(e) => handleNestedChange('pricing', 'maintenanceDeposit', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Legal Charges"
          type="number"
          value={formData.pricing.legalCharges}
          onChange={(e) => handleNestedChange('pricing', 'legalCharges', e.target.value)}
        />
      </Grid>

      {/* Facing Premiums */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Facing Premiums
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Park Facing"
          type="number"
          value={formData.pricing.facingPremiums.parkFacing}
          onChange={(e) => handleDeepNestedChange('pricing', 'facingPremiums', 'parkFacing', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Road Facing"
          type="number"
          value={formData.pricing.facingPremiums.roadFacing}
          onChange={(e) => handleDeepNestedChange('pricing', 'facingPremiums', 'roadFacing', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          label="Corner Unit"
          type="number"
          value={formData.pricing.facingPremiums.cornerUnit}
          onChange={(e) => handleDeepNestedChange('pricing', 'facingPremiums', 'cornerUnit', e.target.value)}
        />
      </Grid>

      {/* Parking */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Parking Charges
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Covered Parking"
          type="number"
          value={formData.pricing.parkingCharges.covered}
          onChange={(e) => handleDeepNestedChange('pricing', 'parkingCharges', 'covered', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Open Parking"
          type="number"
          value={formData.pricing.parkingCharges.open}
          onChange={(e) => handleDeepNestedChange('pricing', 'parkingCharges', 'open', e.target.value)}
        />
      </Grid>

      {/* Tax Rates */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Tax Rates
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="GST Rate (%)"
          type="number"
          value={formData.pricing.gstRate}
          onChange={(e) => handleNestedChange('pricing', 'gstRate', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Stamp Duty Rate (%)"
          type="number"
          value={formData.pricing.stampDutyRate}
          onChange={(e) => handleNestedChange('pricing', 'stampDutyRate', e.target.value)}
        />
      </Grid>

      {/* Unit Mix */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Unit Mix
          </Typography>
          <Button size="small" startIcon={<Add />} onClick={addUnitMixRow}>
            Add Unit Type
          </Button>
        </Box>
      </Grid>

      {formData.unitMix.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No unit types added yet. Click &quot;Add Unit Type&quot; to begin.
          </Typography>
        </Grid>
      )}

      {formData.unitMix.map((unit, index) => (
        <Grid item xs={12} key={index}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Unit #{index + 1}
              </Typography>
              <IconButton size="small" color="error" onClick={() => removeUnitMixRow(index)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Unit Type</InputLabel>
                  <Select
                    value={unit.unitType}
                    label="Unit Type"
                    onChange={(e) => handleUnitMixChange(index, 'unitType', e.target.value)}
                  >
                    {UNIT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Carpet Area Min"
                  type="number"
                  value={unit.carpetAreaRange.min}
                  onChange={(e) => handleUnitMixNestedChange(index, 'carpetAreaRange', 'min', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Carpet Area Max"
                  type="number"
                  value={unit.carpetAreaRange.max}
                  onChange={(e) => handleUnitMixNestedChange(index, 'carpetAreaRange', 'max', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Price Min"
                  type="number"
                  value={unit.priceRange.min}
                  onChange={(e) => handleUnitMixNestedChange(index, 'priceRange', 'min', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Price Max"
                  type="number"
                  value={unit.priceRange.max}
                  onChange={(e) => handleUnitMixNestedChange(index, 'priceRange', 'max', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total"
                  type="number"
                  value={unit.totalCount}
                  onChange={(e) => handleUnitMixChange(index, 'totalCount', e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Available"
                  type="number"
                  value={unit.availableCount}
                  onChange={(e) => handleUnitMixChange(index, 'availableCount', e.target.value)}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // =====================================================================
  // STEP 3: Amenities & Details
  // =====================================================================
  const renderStep3 = () => (
    <Grid container spacing={3}>
      {/* Amenities */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Amenities
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {Object.entries(AMENITY_LABELS).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              onClick={() => toggleAmenity(key)}
              color={formData.amenities[key] ? 'primary' : 'default'}
              variant={formData.amenities[key] ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Grid>

      {/* Custom Amenities */}
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
          Other Amenities
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TextField
            size="small"
            label="Custom Amenity"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomAmenity();
              }
            }}
            sx={{ minWidth: 200 }}
          />
          <Button size="small" variant="outlined" onClick={addCustomAmenity} disabled={!customAmenity.trim()}>
            Add
          </Button>
        </Box>
        {formData.amenities.other.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.amenities.other.map((amenity, index) => (
              <Chip
                key={index}
                label={amenity}
                onDelete={() => removeCustomAmenity(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Grid>

      {/* Payment Plans */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Payment Plans
          </Typography>
          <Button size="small" startIcon={<Add />} onClick={addPaymentPlan}>
            Add Plan
          </Button>
        </Box>
      </Grid>

      {formData.paymentPlans.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No payment plans added yet. Click &quot;Add Plan&quot; to begin.
          </Typography>
        </Grid>
      )}

      {formData.paymentPlans.map((plan, index) => (
        <Grid item xs={12} key={index}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Plan #{index + 1}
              </Typography>
              <IconButton size="small" color="error" onClick={() => removePaymentPlan(index)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Plan Name"
                  value={plan.planName}
                  onChange={(e) => handlePaymentPlanChange(index, 'planName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plan Type</InputLabel>
                  <Select
                    value={plan.planType}
                    label="Plan Type"
                    onChange={(e) => handlePaymentPlanChange(index, 'planType', e.target.value)}
                  >
                    {PLAN_TYPES.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Booking %"
                  type="number"
                  value={plan.bookingPercentage}
                  onChange={(e) => handlePaymentPlanChange(index, 'bookingPercentage', e.target.value)}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      ))}

      {/* Data Source & Confidence */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Data Quality
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Data Source</InputLabel>
          <Select
            value={formData.dataSource}
            label="Data Source"
            onChange={(e) => handleChange('dataSource', e.target.value)}
          >
            {DATA_SOURCES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Confidence Score: {formData.confidenceScore}%
        </Typography>
        <Slider
          value={formData.confidenceScore}
          onChange={(_, value) => handleChange('confidenceScore', value)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </Grid>

      {/* Notes */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          label="Notes"
          multiline
          rows={4}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          inputProps={{ maxLength: 2000 }}
          helperText={`${formData.notes.length}/2000`}
        />
      </Grid>
    </Grid>
  );

  // =====================================================================
  // RENDER
  // =====================================================================
  const stepContent = [renderStep1, renderStep2, renderStep3];

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Competitor' : 'Add Competitor'}
        subtitle={isEditMode ? 'Update competitor project details' : 'Enter competitor project details'}
        badge="BETA"
        actions={
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/competitive-analysis/competitors')}
          >
            Back to List
          </Button>
        }
      />

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      {/* Form Content */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          {stepContent[activeStep]()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Competitor' : 'Create Competitor'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CompetitorFormPage;

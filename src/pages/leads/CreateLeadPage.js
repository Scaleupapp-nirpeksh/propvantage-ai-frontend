// File: src/pages/leads/CreateLeadPage.js
// Description: Production-grade lead creation page with model-aligned data capture
// Version: 2.0 - 3-tab wizard aligned to the 2026-06 lead model refactor
// Location: src/pages/leads/CreateLeadPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  StepContent,
  Chip,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
  Autocomplete,
  Avatar,
  Breadcrumbs,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  Business,
  Schedule,
  Save,
  CheckCircle,
  NavigateNext,
  Home,
  ContactPhone,
  ExpandMore,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI, amenityAPI } from '../../services/api';
import ChannelPartnerAttributionFields from '../../components/channel-partners/ChannelPartnerAttributionFields';
import { BUDGET_RANGES, budgetRangeToNumbers, priorityFromTimeline } from '../../utils/leadForm';

// =============================================================================
// CONSTANTS - ALIGNED WITH LEAD MODEL (2026-06 refactor)
// =============================================================================

const LEAD_SOURCES = [
  'Channel Partner',
  'Management',
  'Direct',
  'Referral',
  'Marketing',
  'Cold Calling',
];

const PROPERTY_TYPES = [
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  '5+ BHK',
  'Studio',
  'Penthouse',
  'Villa',
  'Plot',
  'Commercial',
  'Office Space',
  'Retail',
  'Warehouse'
];

// Timeline options matching model enum exactly
const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (Within 1 month)' },
  { value: '1-3_months', label: '1-3 Months' },
  { value: '3-6_months', label: '3-6 Months' },
  { value: '6-12_months', label: '6-12 Months' },
  { value: '12+_months', label: 'More than 12 Months' }
];

// Floor preferences — category-only labels (no specific floor number)
const FLOOR_PREFERENCES = [
  { value: 'any', label: 'Any Floor' },
  { value: 'low', label: 'Lower Floors' },
  { value: 'medium', label: 'Mid Floors' },
  { value: 'high', label: 'Higher Floors' },
];

// Facing directions matching model
const FACING_DIRECTIONS = [
  'Any', 'North', 'South', 'East', 'West',
  'North-East', 'North-West', 'South-East', 'South-West'
];

// Budget source options matching model (2 options)
const BUDGET_SOURCES = [
  { value: 'self_funded', label: 'Self Funded' },
  { value: 'bank_loan', label: 'Bank Loan' },
];

// Follow-up types — lowercase values (backend enum is lowercase)
const FOLLOW_UP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'text', label: 'Text' },
];

// Map derived priority → MUI color for the live badge
const PRIORITY_COLORS = {
  High: 'error',
  Medium: 'warning',
  Low: 'info',
  'Very Low': 'default',
};

// Form steps configuration (3 tabs)
const STEPS = [
  {
    label: 'Contact Information',
    description: 'Basic contact details and source',
    icon: <Person />,
  },
  {
    label: 'Requirements',
    description: 'Project, budget, and property preferences',
    icon: <Home />,
  },
  {
    label: 'Lead Summary and Follow up',
    description: 'Review and schedule follow-up',
    icon: <Schedule />,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Determine qualification status based on form data
const determineQualificationStatus = (data) => {
  if (data.budget.min && data.requirements.timeline && data.requirements.unitType) {
    return 'Qualified';
  } else if (data.budget.budgetSource !== 'self_funded') {
    return 'In Progress';
  }
  return 'Not Qualified';
};

// Validation functions
const validateContactInfo = (data) => {
  const errors = {};

  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[+]?[\d\s\-()]{10,}$/.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (data.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.source) {
    errors.source = 'Lead source is required';
  }

  // When sourced via a channel partner and the toggle is on, require a valid split.
  if (data.source === 'Channel Partner' && data.addSourceDetails) {
    const cpa = data.channelPartnerAttribution;
    if (cpa?.viaChannelPartner) {
      const validPartners = (cpa.partners || []).filter(
        (p) => p.channelPartner && Number(p.sharePct) > 0
      );
      const sum = validPartners.reduce((a, p) => a + Number(p.sharePct), 0);
      if (validPartners.length === 0 || Math.abs(sum - 100) > 0.01) {
        errors.channelPartner =
          'Select at least one channel partner with shares totalling 100%.';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateRequirements = (data) => {
  const errors = {};

  if (!data.project) {
    errors.project = 'Primary project interest is required';
  }

  if (!data.interestedPropertyTypes?.length) {
    errors.interestedPropertyTypes = 'Please select at least one property type';
  }

  if (!data.budgetRange) {
    errors.budgetRange = 'Budget range is required';
  }

  if (!data.requirements.timeline) {
    errors.timeline = 'Occupancy timeline is required (it sets the lead priority)';
  }

  if (!data.assignedTo) {
    errors.assignedTo = 'Please assign this lead to a team member';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CreateLeadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [catalogAmenities, setCatalogAmenities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form data - ALIGNED WITH LEAD MODEL
  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: '',

    // Source detail toggle + structured source detail (per source)
    addSourceDetails: false,
    sourceDetail: {
      text: '',
      management: { contactName: '', note: '' },
    },

    // Budget Structure - matching model exactly
    budgetRange: '', // For display purposes; drives budget.min/max
    budget: {
      min: '',
      max: '',
      budgetSource: 'self_funded',
      currency: 'INR'
    },

    // Requirements Structure - matching model exactly
    requirements: {
      timeline: '', // enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', '12+_months']
      unitType: '', // Primary unit type they're interested in
      floor: {
        preference: 'any', // enum: ['low', 'medium', 'high', 'any']
      },
      facing: 'Any', // enum values from model
      amenities: [], // array of preferred amenity names (string[])
    },

    // Additional fields for better capture
    interestedPropertyTypes: [], // For UI purposes - will map to unitType

    // Lead Details
    assignedTo: user?.id || '',
    project: '', // Required by backend
    notes: '',

    // Follow-up (lowercase enum values)
    scheduleFollowUp: false,
    followUpDate: null,
    followUpType: 'call',
    followUpNotes: '',

    // AI enrichment research sources (optional)
    researchSources: {
      linkedinUrl: '',
      companyWebsite: '',
      articleUrls: [''],
    },

    // Channel partner attribution (optional)
    channelPartnerAttribution: { viaChannelPartner: false, partners: [] },
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      const [projectsResponse, amenitiesResponse] = await Promise.allSettled([
        projectAPI.getProjects(),
        amenityAPI.getAmenities(),
      ]);

      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data;
        setProjects(projectsData.data || projectsData || []);
      }

      if (amenitiesResponse.status === 'fulfilled') {
        const amenitiesData = amenitiesResponse.value.data;
        const list = amenitiesData?.data || amenitiesData || [];
        setCatalogAmenities(list.map((a) => a.name).filter(Boolean));
      }

      setSalesTeam([
        {
          _id: user?.id || user?._id,
          firstName: user?.firstName || 'Current',
          lastName: user?.lastName || 'User',
          role: user?.roleRef?.name || user?.role || 'Sales Executive'
        }
      ]);

    } catch (error) {
      console.error('Error loading initial data:', error);
      enqueueSnackbar('Failed to load form data. Please refresh the page.', {
        variant: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    let value;

    if (event?.target) {
      value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    } else {
      value = event;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle array field changes
  const handleArrayFieldChange = (field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: values,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle research source field changes (nested under researchSources)
  const handleResearchSourceChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      researchSources: { ...prev.researchSources, [key]: value },
    }));
  };

  const handleArticleUrlChange = (index, value) => {
    setFormData(prev => {
      const next = [...prev.researchSources.articleUrls];
      next[index] = value;
      return {
        ...prev,
        researchSources: { ...prev.researchSources, articleUrls: next },
      };
    });
  };

  const addArticleUrlField = () => {
    setFormData(prev => ({
      ...prev,
      researchSources: {
        ...prev.researchSources,
        articleUrls: [...prev.researchSources.articleUrls, ''],
      },
    }));
  };

  // Amenities: add a freeSolo value, creating it in the catalog if it's new.
  const handleAmenitiesChange = async (rawValues) => {
    // Normalize the "+ Add \"X\"" affordance back to its plain name, trim, dedupe.
    const normalized = [];
    const seen = new Set();
    rawValues.forEach((val) => {
      const match = typeof val === 'string' ? /^\+ Add "(.*)"$/.exec(val) : null;
      const name = (match ? match[1] : val).trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        normalized.push(name);
      }
    });

    // Find any value that's not already in the catalog (a brand-new amenity).
    const known = new Set(catalogAmenities);
    const created = normalized.find((name) => !known.has(name));

    // Optimistically set the selection.
    setFormData(prev => ({
      ...prev,
      requirements: { ...prev.requirements, amenities: normalized },
    }));

    if (!created) return;

    try {
      const res = await amenityAPI.createAmenity(created);
      const saved = res.data?.data || res.data;
      const savedName = saved?.name || created;

      // Make sure the canonical name is in both the catalog and the selection.
      setCatalogAmenities(prev => (prev.includes(savedName) ? prev : [...prev, savedName]));
      setFormData(prev => {
        const amenities = prev.requirements.amenities.map((a) => (a === created ? savedName : a));
        return { ...prev, requirements: { ...prev.requirements, amenities } };
      });
    } catch (error) {
      console.error('Error creating amenity:', error);
      enqueueSnackbar('Could not save the new amenity to the catalog, but it is added to this lead.', {
        variant: 'warning',
      });
    }
  };

  // Navigation handlers
  const handleNext = () => {
    let validation;

    if (activeStep === 0) {
      validation = validateContactInfo(formData);
    } else if (activeStep === 1) {
      validation = validateRequirements(formData);
    }

    if (validation && !validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };

  // Form submission - ALIGNED WITH LEAD MODEL
  const handleSubmit = async () => {
    const source = formData.source;

    // Validate the channel-partner commission split before submitting.
    const cpa = formData.channelPartnerAttribution;
    if (cpa?.viaChannelPartner) {
      const cpaValid = (cpa.partners || []).filter(
        (p) => p.channelPartner && Number(p.sharePct) > 0
      );
      const cpaSum = cpaValid.reduce((a, p) => a + Number(p.sharePct), 0);
      if (cpaValid.length === 0 || Math.abs(cpaSum - 100) > 0.01) {
        enqueueSnackbar(
          'Channel partner commission split must total 100% across selected partners.',
          { variant: 'error' }
        );
        return;
      }
    }

    setIsLoading(true);
    setErrors({});

    try {
      // AI enrichment research sources — only attached when at least one URL is given
      const enrichmentArticleUrls = formData.researchSources.articleUrls
        .map((u) => u.trim())
        .filter(Boolean);
      const enrichmentSources = {
        linkedinUrl: formData.researchSources.linkedinUrl.trim(),
        companyWebsite: formData.researchSources.companyWebsite.trim(),
        articleUrls: enrichmentArticleUrls,
      };
      const hasResearchSources = Boolean(
        enrichmentSources.linkedinUrl ||
        enrichmentSources.companyWebsite ||
        enrichmentArticleUrls.length
      );

      // Budget min/max derived from the selected range (max may be null for 50Cr+).
      const budgetNumbers = budgetRangeToNumbers(formData.budgetRange);

      // Structured source detail — only what's relevant to the chosen source.
      let sourceDetailPayload;
      if (formData.addSourceDetails) {
        if (source === 'Channel Partner') {
          // CP details flow through channelPartnerAttribution, not sourceDetail.
          sourceDetailPayload = undefined;
        } else if (source === 'Management') {
          const contactName = formData.sourceDetail.management.contactName.trim();
          const note = formData.sourceDetail.management.note.trim();
          sourceDetailPayload =
            contactName || note
              ? {
                  management: {
                    contactName: contactName || undefined,
                    note: note || undefined,
                  },
                }
              : undefined;
        } else {
          const text = formData.sourceDetail.text.trim();
          sourceDetailPayload = text ? { text } : undefined;
        }
      }

      // Prepare lead data matching model structure exactly
      const leadData = {
        // Required fields
        project: formData.project,
        firstName: formData.firstName.trim(),
        phone: formData.phone.trim(),

        // Contact Information
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        source: formData.source,
        sourceDetail: sourceDetailPayload,

        // Assignment (required — no `|| undefined`)
        assignedTo: formData.assignedTo,

        // Budget structure matching model exactly (min/max derived from the range)
        budget: {
          min: budgetNumbers.min === '' ? undefined : budgetNumbers.min,
          max: budgetNumbers.max,
          budgetSource: formData.budget.budgetSource,
          currency: formData.budget.currency,
          isValidated: false,
          lastUpdated: new Date(),
          updatedBy: user?.id || user?._id || undefined
        },

        // Requirements structure matching model exactly
        requirements: {
          timeline: formData.requirements.timeline || undefined,
          unitType: formData.requirements.unitType || undefined,
          floor: {
            preference: formData.requirements.floor.preference,
          },
          facing: formData.requirements.facing,
          amenities: formData.requirements.amenities,
        },

        // Additional notes
        notes: formData.notes.trim() || undefined,

        // Channel partner attribution (only when provided)
        ...((() => {
          const cpaInner = formData.channelPartnerAttribution;
          const validPartners = (cpaInner?.partners || []).filter(
            (p) => p.channelPartner && Number(p.sharePct) > 0
          );
          return cpaInner?.viaChannelPartner && validPartners.length > 0
            ? {
                channelPartnerAttribution: {
                  viaChannelPartner: true,
                  partners: validPartners.map((p) => ({
                    channelPartner: p.channelPartner,
                    agent: p.agent || null,
                    sharePct: Number(p.sharePct) || 0,
                  })),
                },
              }
            : {};
        })()),

        // AI enrichment research sources (only sent when at least one URL is provided)
        ...(hasResearchSources ? { enrichment: { sources: enrichmentSources } } : {}),

        // Follow-up (lowercase enum values sent as-is)
        followUpSchedule: formData.scheduleFollowUp ? {
          nextFollowUpDate: formData.followUpDate,
          followUpType: formData.followUpType,
          notes: formData.followUpNotes.trim() || undefined,
          isOverdue: false,
          overdueBy: 0,
          remindersSent: 0
        } : undefined,

        // Set qualification status based on data completeness
        qualificationStatus: determineQualificationStatus(formData),

        // Initialize engagement metrics
        engagementMetrics: {
          totalInteractions: 0,
          responseRate: 0,
          preferredContactMethod: 'phone'
        }
      };

      console.log('🚀 Creating lead with model-aligned data:', leadData);

      const response = await leadAPI.createLead(leadData);

      console.log('✅ Lead created successfully:', response.data);

      enqueueSnackbar('Lead created successfully!', {
        variant: 'success',
        autoHideDuration: 5000,
      });

      const createdLead = response.data.data || response.data;
      navigate(`/leads/${createdLead._id || createdLead.id}`);

    } catch (error) {
      console.error('❌ Error creating lead:', error);

      let errorMessage = 'Failed to create lead. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  // The source-detail block rendered when "Add source details" is ON.
  const renderSourceDetailFields = () => {
    if (!formData.addSourceDetails) return null;

    if (formData.source === 'Channel Partner') {
      return (
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Channel partner
          </Typography>
          <ChannelPartnerAttributionFields
            value={formData.channelPartnerAttribution}
            onChange={(val) => {
              setFormData((prev) => ({ ...prev, channelPartnerAttribution: val }));
              if (errors.channelPartner) {
                setErrors((prev) => ({ ...prev, channelPartner: '' }));
              }
            }}
          />
          {errors.channelPartner && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {errors.channelPartner}
            </Typography>
          )}
        </Grid>
      );
    }

    if (formData.source === 'Management') {
      return (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Promoter / investor / management contact"
              placeholder="Name of the contact"
              value={formData.sourceDetail.management.contactName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sourceDetail: {
                  ...prev.sourceDetail,
                  management: { ...prev.sourceDetail.management, contactName: e.target.value },
                },
              }))}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Note (optional)"
              placeholder="Any context about this referral"
              value={formData.sourceDetail.management.note}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sourceDetail: {
                  ...prev.sourceDetail,
                  management: { ...prev.sourceDetail.management, note: e.target.value },
                },
              }))}
              disabled={isLoading}
            />
          </Grid>
        </>
      );
    }

    // Any other source → free-text source details
    return (
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Source details"
          placeholder="Specific details about the source (optional)"
          value={formData.sourceDetail.text}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            sourceDetail: { ...prev.sourceDetail, text: e.target.value },
          }))}
          disabled={isLoading}
          multiline
          rows={2}
          helperText="e.g., 'From John's referral' or 'Facebook ad campaign'"
        />
      </Grid>
    );
  };

  const renderContactInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Contact Information
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={handleInputChange('firstName')}
          error={!!errors.firstName}
          helperText={errors.firstName}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color={errors.firstName ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          placeholder="Enter last name (optional)"
          value={formData.lastName}
          onChange={handleInputChange('lastName')}
          error={!!errors.lastName}
          helperText={errors.lastName}
          disabled={isLoading}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone color={errors.phone ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          placeholder="Enter email (optional)"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color={errors.email ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.source}>
          <InputLabel>Lead Source</InputLabel>
          <Select
            value={formData.source}
            onChange={handleInputChange('source')}
            label="Lead Source"
            disabled={isLoading}
          >
            {LEAD_SOURCES.map(source => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>
          {errors.source && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.source}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.addSourceDetails}
              onChange={handleInputChange('addSourceDetails')}
              disabled={isLoading || !formData.source}
            />
          }
          label="Add source details"
        />
      </Grid>

      {renderSourceDetailFields()}

      {/* Research Sources — moved here from the old Lead Details step */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Research sources (optional)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add public links and the AI will build a short brief on this lead in the background.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="LinkedIn profile URL"
                  placeholder="https://www.linkedin.com/in/..."
                  value={formData.researchSources.linkedinUrl}
                  onChange={(e) => handleResearchSourceChange('linkedinUrl', e.target.value)}
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company website URL"
                  placeholder="https://company.com"
                  value={formData.researchSources.companyWebsite}
                  onChange={(e) => handleResearchSourceChange('companyWebsite', e.target.value)}
                  disabled={isLoading}
                />
              </Grid>
              {formData.researchSources.articleUrls.map((url, index) => (
                <Grid item xs={12} key={index}>
                  <TextField
                    fullWidth
                    label={`News article URL ${index + 1}`}
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => handleArticleUrlChange(index, e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button size="small" onClick={addArticleUrlField} disabled={isLoading}>
                  + Add another article
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  const derivedPriority = priorityFromTimeline(formData.requirements.timeline);

  const renderRequirements = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Property Requirements
        </Typography>
      </Grid>

      {/* Primary Project — moved here, required */}
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.project}>
          <Autocomplete
            options={projects}
            value={projects.find(project => project._id === formData.project) || null}
            onChange={(event, newValue) => handleInputChange('project')(newValue?._id || '')}
            getOptionLabel={(option) => option.name || ''}
            disabled={isLoading || loadingData}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Primary Project Interest"
                placeholder="Select the main project they're interested in"
                error={!!errors.project}
                helperText={errors.project || 'Select the primary project this lead is interested in (required)'}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Business />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.location?.city}, {option.location?.state}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />
        </FormControl>
      </Grid>

      {/* Property Types Selection */}
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.interestedPropertyTypes}>
          <Autocomplete
            multiple
            options={PROPERTY_TYPES}
            value={formData.interestedPropertyTypes}
            onChange={(event, newValue) => {
              handleArrayFieldChange('interestedPropertyTypes', newValue);
              // Auto-set primary unitType from first selection
              if (newValue.length > 0 && !formData.requirements.unitType) {
                setFormData(prev => ({
                  ...prev,
                  requirements: {
                    ...prev.requirements,
                    unitType: newValue[0]
                  }
                }));
              }
            }}
            disabled={isLoading}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Interested Property Types"
                placeholder="Select property types"
                error={!!errors.interestedPropertyTypes}
                helperText={errors.interestedPropertyTypes || 'Select all property types the lead is interested in'}
              />
            )}
          />
        </FormControl>
      </Grid>

      {/* Primary Unit Type Selection */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Primary Unit Type</InputLabel>
          <Select
            value={formData.requirements.unitType}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                unitType: e.target.value
              }
            }))}
            label="Primary Unit Type"
            disabled={isLoading}
          >
            {formData.interestedPropertyTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
            Select the main unit type they're most interested in
          </Typography>
        </FormControl>
      </Grid>

      {/* Budget Range Selection */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.budgetRange}>
          <InputLabel>Budget Range</InputLabel>
          <Select
            value={formData.budgetRange}
            onChange={(e) => {
              const range = e.target.value;
              const budgetNumbers = budgetRangeToNumbers(range);
              setFormData(prev => ({
                ...prev,
                budgetRange: range,
                budget: {
                  ...prev.budget,
                  min: budgetNumbers.min,
                  max: budgetNumbers.max,
                },
              }));
              if (errors.budgetRange) {
                setErrors(prev => ({ ...prev, budgetRange: '' }));
              }
            }}
            label="Budget Range"
            disabled={isLoading}
          >
            {BUDGET_RANGES.map(range => (
              <MenuItem key={range} value={range}>
                {range}
              </MenuItem>
            ))}
          </Select>
          {errors.budgetRange && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.budgetRange}
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* Budget Source */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Budget Source</InputLabel>
          <Select
            value={formData.budget.budgetSource}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              budget: {
                ...prev.budget,
                budgetSource: e.target.value
              }
            }))}
            label="Budget Source"
            disabled={isLoading}
          >
            {BUDGET_SOURCES.map(source => (
              <MenuItem key={source.value} value={source.value}>
                {source.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Floor Preferences */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Floor Preference</InputLabel>
          <Select
            value={formData.requirements.floor.preference}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                floor: {
                  ...prev.requirements.floor,
                  preference: e.target.value
                }
              }
            }))}
            label="Floor Preference"
            disabled={isLoading}
          >
            {FLOOR_PREFERENCES.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Occupancy Timeline + live priority badge */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.timeline}>
          <InputLabel>Occupancy Timeline</InputLabel>
          <Select
            value={formData.requirements.timeline}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({
                ...prev,
                requirements: {
                  ...prev.requirements,
                  timeline: value
                }
              }));
              if (errors.timeline) {
                setErrors(prev => ({ ...prev, timeline: '' }));
              }
            }}
            label="Occupancy Timeline"
            disabled={isLoading}
          >
            {TIMELINE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.timeline && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.timeline}
            </Typography>
          )}
        </FormControl>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`Priority: ${derivedPriority}`}
            color={PRIORITY_COLORS[derivedPriority] || 'default'}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Priority is set automatically from the occupancy timeline.
        </Typography>
      </Grid>

      {/* Facing Direction */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Facing Direction</InputLabel>
          <Select
            value={formData.requirements.facing}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                facing: e.target.value
              }
            }))}
            label="Facing Direction"
            disabled={isLoading}
          >
            {FACING_DIRECTIONS.map(direction => (
              <MenuItem key={direction} value={direction}>
                {direction}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Preferred Amenities — catalog autocomplete with "+ add" */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            multiple
            freeSolo
            options={catalogAmenities}
            value={formData.requirements.amenities}
            onChange={(event, newValue) => handleAmenitiesChange(newValue)}
            disabled={isLoading}
            filterOptions={(options, params) => {
              const filtered = options.filter((option) =>
                option.toLowerCase().includes(params.inputValue.toLowerCase())
              );
              const exists = options.some(
                (option) => option.toLowerCase() === params.inputValue.toLowerCase()
              );
              if (params.inputValue !== '' && !exists) {
                filtered.push(`+ Add "${params.inputValue}"`);
              }
              return filtered;
            }}
            getOptionLabel={(option) => {
              // Strip the "+ Add" affordance label when an option is committed.
              const match = /^\+ Add "(.*)"$/.exec(option);
              return match ? match[1] : option;
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Preferred Amenities (Optional)"
                placeholder="Select or add amenities"
                helperText="Pick from the catalog, or type a new one and press Enter to add it"
              />
            )}
          />
        </FormControl>
      </Grid>

      {/* Assign To — moved here, required */}
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.assignedTo}>
          <Autocomplete
            options={salesTeam}
            value={salesTeam.find(member => member._id === formData.assignedTo) || null}
            onChange={(event, newValue) => handleInputChange('assignedTo')(newValue?._id || '')}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.role})`}
            disabled={isLoading || loadingData}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign To"
                placeholder="Select sales team member"
                error={!!errors.assignedTo}
                helperText={errors.assignedTo || 'Assign this lead to a sales team member (required)'}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                  {option.firstName?.charAt(0)}{option.lastName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.role}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        </FormControl>
      </Grid>

      {/* Notes — moved here, optional, at the bottom */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes"
          placeholder="Add any additional notes about this lead..."
          value={formData.notes}
          onChange={handleInputChange('notes')}
          disabled={isLoading}
          multiline
          rows={4}
          helperText="Include any relevant information about the lead's preferences, conversation details, etc."
        />
      </Grid>
    </Grid>
  );

  // Summary helpers
  const selectedProject = projects.find(p => p._id === formData.project);
  const assignee = salesTeam.find(member => member._id === formData.assignedTo);
  const sourceDetailSummary = () => {
    if (!formData.addSourceDetails) return '';
    if (formData.source === 'Channel Partner') return 'Via channel partner';
    if (formData.source === 'Management') return formData.sourceDetail.management.contactName;
    return formData.sourceDetail.text;
  };

  const renderSummaryAndFollowUp = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Lead Summary and Follow up
        </Typography>
      </Grid>

      {/* Read-only summary */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
            <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
            Lead Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Contact:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.firstName} {formData.lastName}
              </Typography>
              <Typography variant="body2">
                {formData.phone} {formData.email && `• ${formData.email}`}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Source:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.source || 'Not selected'}
              </Typography>
              {sourceDetailSummary() && (
                <Typography variant="body2">{sourceDetailSummary()}</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Primary Project:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedProject?.name || 'Not selected'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Budget Range:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.budgetRange || 'Not selected'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Timeline &amp; Priority:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {TIMELINE_OPTIONS.find(t => t.value === formData.requirements.timeline)?.label || 'Not selected'}
                </Typography>
                <Chip
                  size="small"
                  label={derivedPriority}
                  color={PRIORITY_COLORS[derivedPriority] || 'default'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Assigned To:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
              </Typography>
            </Grid>
            {formData.requirements.amenities.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Amenities:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {formData.requirements.amenities.map((a) => (
                    <Chip key={a} size="small" variant="outlined" label={a} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Divider />
      </Grid>

      {/* Follow-up */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.scheduleFollowUp}
              onChange={handleInputChange('scheduleFollowUp')}
              disabled={isLoading}
            />
          }
          label="Schedule follow-up"
        />
      </Grid>

      {formData.scheduleFollowUp && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Follow-up Date & Time"
              type="datetime-local"
              value={formData.followUpDate ?
                new Date(formData.followUpDate.getTime() - formData.followUpDate.getTimezoneOffset() * 60000)
                  .toISOString().slice(0, 16) : ''
              }
              onChange={(e) => handleInputChange('followUpDate')(e.target.value ? new Date(e.target.value) : null)}
              disabled={isLoading}
              helperText="When should the follow-up be done?"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Follow-up Type</InputLabel>
              <Select
                value={formData.followUpType}
                onChange={handleInputChange('followUpType')}
                label="Follow-up Type"
                disabled={isLoading}
              >
                {FOLLOW_UP_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Follow-up Agenda"
              placeholder="What should be covered in the follow-up..."
              value={formData.followUpNotes}
              onChange={handleInputChange('followUpNotes')}
              disabled={isLoading}
              multiline
              rows={3}
            />
          </Grid>
        </>
      )}
    </Grid>
  );

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading form data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
          onClick={() => navigate('/leads')}
        >
          <Person fontSize="small" />
          Leads
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ContactPhone fontSize="small" />
          Create New Lead
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate('/leads')}
            sx={{ bgcolor: 'action.hover' }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Create New Lead
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Capture and manage new leads with comprehensive details
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Progress Stepper */}
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {STEPS.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        index === activeStep ? (
                          <Typography variant="caption">{step.description}</Typography>
                        ) : null
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {step.icon}
                        {step.label}
                      </Box>
                    </StepLabel>
                    {index === activeStep && (
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    )}
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Error Alert */}
              {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  Please fix the errors below before proceeding.
                </Alert>
              )}

              {/* Step Content */}
              {activeStep === 0 && renderContactInformation()}
              {activeStep === 1 && renderRequirements()}
              {activeStep === 2 && renderSummaryAndFollowUp()}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0 || isLoading}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep < STEPS.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={isLoading}
                      endIcon={<NavigateNext />}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                      size="large"
                    >
                      {isLoading ? 'Creating Lead...' : 'Create Lead'}
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateLeadPage;

// File: src/pages/projects/CreateUnitPage.js
// Description: ENHANCED unit creation form with ALL backend fields from CSV
// Version: 2.0 - Complete backend integration with all 34 fields
// Location: src/pages/projects/CreateUnitPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  InputAdornment,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Home,
  NavigateNext,
  Save,
  CheckCircle,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Enhanced configurations based on backend CSV structure
const UNIT_TYPES = [
  'Studio', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', 
  '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', 'Penthouse', 'Duplex',
  'Shop', 'Office'
];

const UNIT_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'sold', label: 'Sold' },
  { value: 'on-hold', label: 'On Hold' },
];

const FACING_OPTIONS = [
  'North', 'South', 'East', 'West', 'North-East', 'North-West', 
  'South-East', 'South-West', 'Park Facing', 'Road Facing', 'Garden Facing'
];

const HANDOVER_STATUS_OPTIONS = [
  { value: 'not-ready', label: 'Not Ready' },
  { value: 'ready', label: 'Ready for Handover' },
  { value: 'handed-over', label: 'Handed Over' },
  { value: 'delayed', label: 'Delayed' },
];

// Breadcrumb Navigation Component
const CreateUnitBreadcrumbs = ({ project, tower, isVillaProject }) => {
  const navigate = useNavigate();

  return (
    <Breadcrumbs 
      separator={<NavigateNext fontSize="small" />} 
      sx={{ mb: 3 }}
    >
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={() => navigate('/projects')}
      >
        <Business fontSize="small" />
        Projects
      </Link>
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: 'pointer' }}
        onClick={() => navigate(`/projects/${project?._id}`)}
      >
        {project?.name || 'Project'}
      </Link>
      {!isVillaProject && tower && (
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/projects/${project?._id}/towers/${tower._id}`)}
        >
          {tower.towerName || tower.towerCode}
        </Link>
      )}
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Home fontSize="small" />
        Create {isVillaProject ? 'Villa Unit' : 'Unit'}
      </Typography>
    </Breadcrumbs>
  );
};

// Main Create Unit Page Component
const CreateUnitPage = () => {
  const { projectId, towerId } = useParams();
  const navigate = useNavigate();
  useAuth();

  // Determine if this is a villa project (no towerId)
  const isVillaProject = !towerId;

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Enhanced form data state with ALL backend fields
  const [formData, setFormData] = useState({
    // Core Information (matches backend exactly)
    project: projectId,
    tower: towerId || null,
    unitNumber: '',
    type: '',                    // Backend field name
    floor: isVillaProject ? 0 : 1,  // Backend field name
    areaSqft: '',               // Backend field name
    basePrice: '',
    currentPrice: '',
    facing: 'North',
    status: 'available',
    
    // Features object (matches backend exactly)
    features: {
      isParkFacing: false,
      isCornerUnit: false,
      hasBalcony: true,
      hasServantRoom: false,
      hasParkingSlot: false,
      hasStudyRoom: false,
      hasUtilityArea: false,
    },
    
    // Specifications object (matches backend exactly)
    specifications: {
      bedrooms: 1,
      bathrooms: 1,
      livingRooms: 1,
      kitchen: 1,
      balconies: 0,
      terraceArea: 0,
      carpetArea: 0,
      builtUpArea: 0,
      superBuiltUpArea: 0,
    },
    
    // Parking object (matches backend exactly)
    parking: {
      covered: 0,
      open: 0,
    },
    
    // Possession object (matches backend exactly)
    possession: {
      handoverStatus: 'not-ready',
    },
    
    // Additional UI fields
    description: '',
  });

  const steps = [
    'Basic Information',
    'Specifications',
    'Features & Amenities',
    'Pricing & Possession'
  ];

  // Fetch project and tower data
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, towerId]);

  const fetchProjectData = async () => {
    try {
      setProjectLoading(true);
      
      // Fetch project details
      const projectResponse = await projectAPI.getProject(projectId);
      
      // Handle different response structures
      let projectData;
      if (projectResponse.data.data) {
        projectData = projectResponse.data.data;
      } else if (projectResponse.data.project) {
        projectData = projectResponse.data.project;
      } else {
        projectData = projectResponse.data;
      }
      
      setProject(projectData);
      console.log('📋 Project loaded:', projectData?.name);

      // Fetch tower details if this is a tower unit
      if (towerId) {
        const towerResponse = await towerAPI.getTower(towerId);
        
        // Handle different response structures
        let towerData;
        if (towerResponse.data.data) {
          towerData = towerResponse.data.data;
        } else if (towerResponse.data.tower) {
          towerData = towerResponse.data.tower;
        } else {
          towerData = towerResponse.data;
        }
        
        setTower(towerData);
        console.log('🏗️ Tower loaded:', towerData?.towerName);

        // Get existing units to auto-generate unit number
        const unitsResponse = await unitAPI.getUnits({ tower: towerId });
        const existingUnits = unitsResponse.data.data || [];
        const nextUnitNumber = generateNextUnitNumber(existingUnits, towerData);
        
        setFormData(prev => ({
          ...prev,
          unitNumber: nextUnitNumber,
          floor: 1,
        }));
      } else {
        // For villa projects, get existing units to auto-generate villa number
        const unitsResponse = await unitAPI.getUnits({ project: projectId, tower: null });
        const existingUnits = unitsResponse.data.data || [];
        const nextVillaNumber = `V${existingUnits.length + 1}`;
        
        setFormData(prev => ({
          ...prev,
          unitNumber: nextVillaNumber,
          floor: 0, // Ground level for villas
        }));
      }
      
    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Failed to load project details');
    } finally {
      setProjectLoading(false);
    }
  };

  const generateNextUnitNumber = (existingUnits, tower) => {
    const floorNumber = 1;
    const unitsOnFloor = existingUnits.filter(unit => unit.floor === floorNumber);
    const nextUnitOnFloor = unitsOnFloor.length + 1;
    return `${tower?.towerCode || 'T'}-${floorNumber}${nextUnitOnFloor.toString().padStart(2, '0')}`;
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested object fields (e.g., 'features.hasBalcony')
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Enhanced form validation
  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        return formData.unitNumber && formData.type && formData.areaSqft;
      case 1: // Specifications
        return formData.specifications.bedrooms && formData.specifications.bathrooms;
      case 2: // Features - always valid (optional)
        return true;
      case 3: // Pricing
        return formData.basePrice;
      default:
        return true;
    }
  };

  // Auto-calculate parking total
  useEffect(() => {
    const total = (formData.parking.covered || 0) + (formData.parking.open || 0);
    if (total !== formData.parking.total) {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          hasParkingSlot: total > 0,
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.parking.covered, formData.parking.open]);

  // Auto-update corner unit based on unit number
  useEffect(() => {
    if (formData.unitNumber && tower) {
      const unitPosition = parseInt(formData.unitNumber.split('-')[1]?.slice(-1)) || 0;
      const isCorner = unitPosition === 1 || unitPosition === (tower.unitsPerFloor || 0);
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          isCornerUnit: isCorner,
        }
      }));
    }
  }, [formData.unitNumber, tower]);

  // Form submission with exact backend structure
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create backend payload with exact structure matching CSV
      const backendPayload = {
        // Core fields (exactly as in backend)
        project: formData.project,
        unitNumber: formData.unitNumber,
        type: formData.type,
        floor: formData.floor,
        areaSqft: parseInt(formData.areaSqft) || 0,
        basePrice: parseInt(formData.basePrice) || 0,
        currentPrice: parseInt(formData.currentPrice) || parseInt(formData.basePrice) || 0,
        facing: formData.facing,
        status: formData.status,
        
        // Include tower only if it exists
        ...(formData.tower && { tower: formData.tower }),
        
        // Features object (exactly as in backend)
        features: {
          isParkFacing: formData.features.isParkFacing,
          isCornerUnit: formData.features.isCornerUnit,
          hasBalcony: formData.features.hasBalcony,
          hasServantRoom: formData.features.hasServantRoom,
          hasParkingSlot: formData.features.hasParkingSlot,
          hasStudyRoom: formData.features.hasStudyRoom,
          hasUtilityArea: formData.features.hasUtilityArea,
        },
        
        // Specifications object (exactly as in backend)
        specifications: {
          bedrooms: parseInt(formData.specifications.bedrooms) || 0,
          bathrooms: parseInt(formData.specifications.bathrooms) || 0,
          livingRooms: parseInt(formData.specifications.livingRooms) || 0,
          kitchen: parseInt(formData.specifications.kitchen) || 0,
          balconies: parseInt(formData.specifications.balconies) || 0,
          terraceArea: parseInt(formData.specifications.terraceArea) || 0,
          carpetArea: parseInt(formData.specifications.carpetArea) || 0,
          builtUpArea: parseInt(formData.specifications.builtUpArea) || 0,
          superBuiltUpArea: parseInt(formData.specifications.superBuiltUpArea) || 0,
        },
        
        // Parking object (exactly as in backend)
        parking: {
          covered: parseInt(formData.parking.covered) || 0,
          open: parseInt(formData.parking.open) || 0,
        },
        
        // Possession object (exactly as in backend)
        possession: {
          handoverStatus: formData.possession.handoverStatus,
        },
      };

      console.log('🚀 Creating unit with exact backend structure:', backendPayload);

      const response = await unitAPI.createUnit(backendPayload);
      
      console.log('✅ Unit created successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate back after success
      setTimeout(() => {
        if (isVillaProject) {
          navigate(`/projects/${projectId}`);
        } else {
          navigate(`/projects/${projectId}/towers/${towerId}`);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Unit creation failed:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to create unit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step content renderers
  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Basic Unit Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Core details for this {isVillaProject ? 'villa' : 'unit'} (Required fields marked with *)
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={`${isVillaProject ? 'Villa' : 'Unit'} Number *`}
          value={formData.unitNumber}
          onChange={(e) => handleInputChange('unitNumber', e.target.value)}
          placeholder={isVillaProject ? 'e.g., V1' : 'e.g., T1-101'}
          helperText="Unique identifier for this unit"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Unit Type *</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            label="Unit Type *"
          >
            {UNIT_TYPES.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Floor Number"
          value={formData.floor}
          onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || 0)}
          placeholder="e.g., 1"
          inputProps={{ min: 0, max: tower?.totalFloors || 100 }}
          helperText={isVillaProject ? "0 for ground level villa" : `Max: ${tower?.totalFloors || 'N/A'} floors`}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Area (sq ft) *"
          value={formData.areaSqft}
          onChange={(e) => handleInputChange('areaSqft', parseInt(e.target.value) || '')}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          placeholder="e.g., 1200"
          helperText="Primary area used by backend"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Facing</InputLabel>
          <Select
            value={formData.facing}
            onChange={(e) => handleInputChange('facing', e.target.value)}
            label="Facing"
          >
            {FACING_OPTIONS.map(facing => (
              <MenuItem key={facing} value={facing}>
                {facing}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            label="Status"
          >
            {UNIT_STATUSES.map(status => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderSpecifications = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Unit Specifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Detailed specifications and room configuration
        </Typography>
      </Grid>
      
      {/* Room Configuration */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Room Configuration
        </Typography>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Bedrooms *"
          value={formData.specifications.bedrooms}
          onChange={(e) => handleInputChange('specifications.bedrooms', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 10 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Bathrooms *"
          value={formData.specifications.bathrooms}
          onChange={(e) => handleInputChange('specifications.bathrooms', parseInt(e.target.value) || 0)}
          inputProps={{ min: 1, max: 10 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Living Rooms"
          value={formData.specifications.livingRooms}
          onChange={(e) => handleInputChange('specifications.livingRooms', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 5 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Kitchen"
          value={formData.specifications.kitchen}
          onChange={(e) => handleInputChange('specifications.kitchen', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 3 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Balconies"
          value={formData.specifications.balconies}
          onChange={(e) => handleInputChange('specifications.balconies', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 10 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Terrace Area"
          value={formData.specifications.terraceArea}
          onChange={(e) => handleInputChange('specifications.terraceArea', parseInt(e.target.value) || 0)}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
        />
      </Grid>
      
      {/* Detailed Area Specifications */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Detailed Area Breakdown
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Carpet Area"
          value={formData.specifications.carpetArea}
          onChange={(e) => handleInputChange('specifications.carpetArea', parseInt(e.target.value) || 0)}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          helperText="Usable floor area"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Built-up Area"
          value={formData.specifications.builtUpArea}
          onChange={(e) => handleInputChange('specifications.builtUpArea', parseInt(e.target.value) || 0)}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          helperText="Carpet + wall area"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Super Built-up Area"
          value={formData.specifications.superBuiltUpArea}
          onChange={(e) => handleInputChange('specifications.superBuiltUpArea', parseInt(e.target.value) || 0)}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          helperText="Built-up + common areas"
        />
      </Grid>
    </Grid>
  );

  const renderFeaturesAndAmenities = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Features & Amenities
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select the features and amenities available in this unit
        </Typography>
      </Grid>
      
      {/* Unit Features */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Unit Features
        </Typography>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.hasBalcony}
                onChange={(e) => handleInputChange('features.hasBalcony', e.target.checked)}
              />
            }
            label="Has Balcony"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.hasServantRoom}
                onChange={(e) => handleInputChange('features.hasServantRoom', e.target.checked)}
              />
            }
            label="Servant Room"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.hasStudyRoom}
                onChange={(e) => handleInputChange('features.hasStudyRoom', e.target.checked)}
              />
            }
            label="Study Room"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.hasUtilityArea}
                onChange={(e) => handleInputChange('features.hasUtilityArea', e.target.checked)}
              />
            }
            label="Utility Area"
          />
        </FormGroup>
      </Grid>
      
      {/* Location Features */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Location Features
        </Typography>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.isParkFacing}
                onChange={(e) => handleInputChange('features.isParkFacing', e.target.checked)}
              />
            }
            label="Park Facing"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.features.isCornerUnit}
                onChange={(e) => handleInputChange('features.isCornerUnit', e.target.checked)}
              />
            }
            label="Corner Unit"
          />
        </FormGroup>
      </Grid>
      
      {/* Parking */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Parking Allocation
        </Typography>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Covered Parking"
          value={formData.parking.covered}
          onChange={(e) => handleInputChange('parking.covered', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 5 }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Open Parking"
          value={formData.parking.open}
          onChange={(e) => handleInputChange('parking.open', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 5 }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
          <Typography variant="body2">
            <strong>Total Parking:</strong> {(formData.parking.covered || 0) + (formData.parking.open || 0)} spaces
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formData.features.hasParkingSlot ? '✅ Has parking allocation' : '❌ No parking allocated'}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPricingAndPossession = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Pricing & Possession Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set pricing information and possession status
        </Typography>
      </Grid>
      
      {/* Pricing */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Pricing Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Base Price *"
          value={formData.basePrice}
          onChange={(e) => handleInputChange('basePrice', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 5000000"
          helperText="Original unit price"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Current Price"
          value={formData.currentPrice}
          onChange={(e) => handleInputChange('currentPrice', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 5500000"
          helperText="Current selling price"
        />
      </Grid>
      
      {/* Auto-calculated fields */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
          <Typography variant="body2" gutterBottom>
            <strong>Price per Sq Ft:</strong>
          </Typography>
          <Typography variant="h6" color="success.main">
            {formData.basePrice && formData.areaSqft ? 
              `₹${Math.round(formData.basePrice / formData.areaSqft).toLocaleString()}` : 
              'Enter price and area'
            }
          </Typography>
        </Paper>
      </Grid>
      
      {/* Possession */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Possession Details
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Handover Status</InputLabel>
          <Select
            value={formData.possession.handoverStatus}
            onChange={(e) => handleInputChange('possession.handoverStatus', e.target.value)}
            label="Handover Status"
          >
            {HANDOVER_STATUS_OPTIONS.map(status => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Complete Unit Summary */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="primary" />
            Complete Unit Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Unit Number</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.unitNumber || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Type</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.type || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Floor</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.floor}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Area</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.areaSqft ? `${formData.areaSqft} sq ft` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Bedrooms</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.specifications.bedrooms}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Bathrooms</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.specifications.bathrooms}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Parking</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {(formData.parking.covered || 0) + (formData.parking.open || 0)} spaces
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">Base Price</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.basePrice ? `₹${formData.basePrice.toLocaleString()}` : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  if (projectLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">
        Project not found
      </Alert>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: 3 }}>
        {/* Breadcrumb Navigation */}
        <CreateUnitBreadcrumbs project={project} tower={tower} isVillaProject={isVillaProject} />

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(isVillaProject ? `/projects/${projectId}` : `/projects/${projectId}/towers/${towerId}`)}
              sx={{ mb: 2 }}
            >
              Back to {isVillaProject ? 'Project' : 'Tower'}
            </Button>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Create New {isVillaProject ? 'Villa Unit' : 'Unit'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add a comprehensive {isVillaProject ? 'villa' : 'unit'} with all specifications to {isVillaProject ? project.name : tower?.towerName || 'the tower'}
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isVillaProject ? 'Villa Unit' : 'Unit'} Created Successfully! 🎉
            </Typography>
            <Typography>
              {isVillaProject ? 'Villa' : 'Unit'} "{formData.unitNumber}" has been created with all specifications. Redirecting...
            </Typography>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Enhanced Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Form */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {activeStep === 0 && renderBasicInformation()}
            {activeStep === 1 && renderSpecifications()}
            {activeStep === 2 && renderFeaturesAndAmenities()}
            {activeStep === 3 && renderPricingAndPossession()}
            
            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || success || !validateStep(activeStep)}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    size="large"
                  >
                    {loading ? `Creating ${isVillaProject ? 'Villa' : 'Unit'}...` : `Create ${isVillaProject ? 'Villa' : 'Unit'}`}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(activeStep)}
                    size="large"
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CreateUnitPage;
// File: src/pages/projects/CreateProjectPage.js
// Description: Professional multi-step project creation wizard with complete backend integration
// Version: 1.0 - Production-grade project creation with all backend fields
// Location: src/pages/projects/CreateProjectPage.js

import React, { useState, useCallback } from 'react';
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
  Chip,
  InputAdornment,
  Alert,
  Paper,
  Divider,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  ExpandMore,
  LocationOn,
  Business,
  AttachMoney,
  Settings,
  CheckCircle,
  Save,
} from '@mui/icons-material';
 import DatePicker from '@mui/lab/DatePicker';
 import LocalizationProvider from '@mui/lab/LocalizationProvider';
 import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { projectAPI } from '../../services/api';

// Project creation steps
const STEPS = [
  {
    label: 'Basic Information',
    description: 'Project name, type, and description',
    icon: <Business />,
  },
  {
    label: 'Location Details',
    description: 'Project location and address',
    icon: <LocationOn />,
  },
  {
    label: 'Project Specifications',
    description: 'Units, area, pricing, and timeline',
    icon: <Settings />,
  },
  {
    label: 'Financial Configuration',
    description: 'Pricing rules and charges',
    icon: <AttachMoney />,
  },
  {
    label: 'Review & Submit',
    description: 'Review all details and create project',
    icon: <CheckCircle />,
  },
];

// Project types and statuses
const PROJECT_TYPES = [
  { value: 'apartment', label: 'Apartment Complex' },
  { value: 'villa', label: 'Villa Community' },
  { value: 'plot', label: 'Plot Development' },
  { value: 'commercial', label: 'Commercial Space' },
];

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning Phase' },
  { value: 'pre-launch', label: 'Pre-Launch' },
  { value: 'launched', label: 'Launched' },
  { value: 'under-construction', label: 'Under Construction' },
];

// Common amenities
const COMMON_AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Club House', 'Children Play Area',
  'Jogging Track', 'Security', 'Power Backup', 'Parking',
  'Landscaped Gardens', 'Community Hall', 'Sports Court',
  'Library', 'Spa', 'Business Center', 'Wi-Fi', 'CCTV Surveillance'
];

// Utility functions
const formatCurrency = (amount) => {
  if (!amount) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CreateProjectPage = () => {
  const navigate = useNavigate();
  useAuth();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    type: '',
    status: 'planning',
    
    // Location Details
    location: {
      city: '',
      area: '',
      pincode: '',
      state: '',
      landmark: '',
    },
    
    // Project Specifications
    totalUnits: '',
    totalArea: '',
    priceRange: {
      min: '',
      max: '',
    },
    targetRevenue: '',
    launchDate: null,
    expectedCompletionDate: null,
    amenities: [],
    configuration: {},
    
    // Approvals
    approvals: {
      rera: { number: '', date: null, validUntil: null },
      environmentClearance: { number: '', date: null },
      buildingPlan: { number: '', date: null },
    },
    
    // Financial Configuration
    pricingRules: {
      gstRate: 5,
      tdsRate: 1,
      floorRiseCharge: 0,
      plcCharges: {
        parkFacing: 0,
        seaFacing: 0,
        roadFacing: 0,
        cornerUnit: 0,
      },
    },
    additionalCharges: [],
    
    // Payment Configuration
    paymentConfiguration: {
      defaultPaymentTerms: {
        gracePeriodDays: 7,
        lateFeeRate: 2,
        interestRate: 0,
        compoundInterest: false,
      },
      defaultCharges: {
        parkingCharges: 0,
        clubMembership: 0,
        maintenanceDeposit: 0,
        legalCharges: 0,
        powerConnectionCharges: 0,
        waterConnectionCharges: 0,
        sewerageConnectionCharges: 0,
      },
      taxConfiguration: {
        gstApplicable: true,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFeeRate: 1,
        tdsApplicable: true,
        tdsRate: 1,
      },
      discountConfiguration: {
        maxDiscountPercentage: 10,
        maxNegotiationDiscount: 5,
        earlyBirdDiscount: { applicable: false, percentage: 0, enabled: false },
        bulkBookingDiscount: { applicable: false, percentage: 0, minimumUnits: 2, enabled: false, minUnits: 1 },
        loyaltyDiscount: { applicable: false, percentage: 0 },
      },
    },
  });

  // Form handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleAmenityToggle = useCallback((amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  const handleAddAdditionalCharge = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: [
        ...prev.additionalCharges,
        { name: '', amount: '', type: 'one-time' }
      ]
    }));
  }, []);

  const handleRemoveAdditionalCharge = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAdditionalChargeChange = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.map((charge, i) =>
        i === index ? { ...charge, [field]: value } : charge
      )
    }));
  }, []);

  // Step navigation
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Form validation
  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        return formData.name && formData.type;
      case 1: // Location Details
        return formData.location.city && formData.location.area;
      case 2: // Project Specifications
        return formData.totalUnits && formData.targetRevenue && 
               formData.priceRange.min && formData.priceRange.max;
      case 3: // Financial Configuration
        return true; // Optional step
      default:
        return true;
    }
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Creating project with data:', formData);

      const response = await projectAPI.createProject(formData);
      
      console.log('✅ Project created successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate to project detail page after success
      setTimeout(() => {
        navigate(`/projects/${response.data.data._id}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Project creation failed:', error);
      setError(error.response?.data?.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic Information
  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Project Basic Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Provide the fundamental details about your project
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          label="Project Name *"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter project name (e.g., Skyline Towers Premium)"
          helperText="Choose a memorable and descriptive name for your project"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Project Type *</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            label="Project Type *"
          >
            {PROJECT_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Project Status</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            label="Project Status"
          >
            {PROJECT_STATUSES.map(status => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Project Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your project, its unique features, and target audience..."
          helperText="Optional: Provide a detailed description of the project"
        />
      </Grid>
    </Grid>
  );

  // Step 2: Location Details
  const renderLocationDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Project Location
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Specify the complete address and location details
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="City *"
          value={formData.location.city}
          onChange={(e) => handleInputChange('location.city', e.target.value)}
          placeholder="e.g., Mumbai"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Area/Locality *"
          value={formData.location.area}
          onChange={(e) => handleInputChange('location.area', e.target.value)}
          placeholder="e.g., Bandra West"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Pincode"
          value={formData.location.pincode}
          onChange={(e) => handleInputChange('location.pincode', e.target.value)}
          placeholder="e.g., 400050"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="State"
          value={formData.location.state}
          onChange={(e) => handleInputChange('location.state', e.target.value)}
          placeholder="e.g., Maharashtra"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Landmark"
          value={formData.location.landmark}
          onChange={(e) => handleInputChange('location.landmark', e.target.value)}
          placeholder="e.g., Near Bandra-Kurla Complex"
        />
      </Grid>
    </Grid>
  );

  // Step 3: Project Specifications
  const renderProjectSpecifications = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Project Specifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Define the size, capacity, and timeline of your project
        </Typography>
      </Grid>
      
      {/* Units and Area */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Total Units *"
          value={formData.totalUnits}
          onChange={(e) => handleInputChange('totalUnits', parseInt(e.target.value) || '')}
          placeholder="e.g., 480"
          helperText="Total number of units in the project"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Total Area (sq ft)"
          value={formData.totalArea}
          onChange={(e) => handleInputChange('totalArea', parseInt(e.target.value) || '')}
          placeholder="e.g., 500000"
          helperText="Total built-up area in square feet"
        />
      </Grid>
      
      {/* Price Range */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Price Range
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Minimum Price *"
          value={formData.priceRange.min}
          onChange={(e) => handleInputChange('priceRange.min', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 5000000"
          helperText="Starting price per unit"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Price *"
          value={formData.priceRange.max}
          onChange={(e) => handleInputChange('priceRange.max', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 50000000"
          helperText="Maximum price per unit"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          type="number"
          label="Target Revenue *"
          value={formData.targetRevenue}
          onChange={(e) => handleInputChange('targetRevenue', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 14400000000"
          helperText={`Total expected revenue: ${formatCurrency(formData.targetRevenue)}`}
        />
      </Grid>
      
      {/* Timeline */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Project Timeline
        </Typography>
      </Grid>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid item xs={12} md={6}>
        <DatePicker
    label="Launch Date"
    value={formData.launchDate}
    onChange={(date) => handleInputChange('launchDate', date)}
    renderInput={(params) => <TextField fullWidth {...params} />}
  />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Expected Completion"
            value={formData.expectedCompletionDate}
            onChange={(date) => handleInputChange('expectedCompletionDate', date)}
            renderInput={(params) => <TextField fullWidth {...params} />}
          />
        </Grid>
      </LocalizationProvider>
      
      {/* Amenities */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Amenities
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {COMMON_AMENITIES.map(amenity => (
              <Chip
                key={amenity}
                label={amenity}
                onClick={() => handleAmenityToggle(amenity)}
                color={formData.amenities.includes(amenity) ? 'primary' : 'default'}
                variant={formData.amenities.includes(amenity) ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  // Step 4: Financial Configuration
  const renderFinancialConfiguration = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Financial Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set up pricing rules, taxes, and additional charges
        </Typography>
      </Grid>
      
      {/* Pricing Rules */}
      <Grid item xs={12}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Pricing Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="GST Rate (%)"
                  value={formData.pricingRules.gstRate}
                  onChange={(e) => handleInputChange('pricingRules.gstRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="TDS Rate (%)"
                  value={formData.pricingRules.tdsRate}
                  onChange={(e) => handleInputChange('pricingRules.tdsRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Floor Rise Charge"
                  value={formData.pricingRules.floorRiseCharge}
                  onChange={(e) => handleInputChange('pricingRules.floorRiseCharge', parseInt(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
      
      {/* PLC Charges */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Preferential Location Charges (PLC)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Park Facing"
                  value={formData.pricingRules.plcCharges.parkFacing}
                  onChange={(e) => handleInputChange('pricingRules.plcCharges.parkFacing', parseInt(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sea Facing"
                  value={formData.pricingRules.plcCharges.seaFacing}
                  onChange={(e) => handleInputChange('pricingRules.plcCharges.seaFacing', parseInt(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Road Facing"
                  value={formData.pricingRules.plcCharges.roadFacing}
                  onChange={(e) => handleInputChange('pricingRules.plcCharges.roadFacing', parseInt(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Corner Unit"
                  value={formData.pricingRules.plcCharges.cornerUnit}
                  onChange={(e) => handleInputChange('pricingRules.plcCharges.cornerUnit', parseInt(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
      
      {/* Additional Charges */}
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              Additional Charges ({formData.additionalCharges.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {formData.additionalCharges.map((charge, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Charge Name"
                      value={charge.name}
                      onChange={(e) => handleAdditionalChargeChange(index, 'name', e.target.value)}
                      placeholder="e.g., Parking"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={charge.amount}
                      onChange={(e) => handleAdditionalChargeChange(index, 'amount', parseInt(e.target.value) || '')}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={charge.type}
                        onChange={(e) => handleAdditionalChargeChange(index, 'type', e.target.value)}
                        label="Type"
                      >
                        <MenuItem value="one-time">One-time</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="yearly">Yearly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton 
                      onClick={() => handleRemoveAdditionalCharge(index)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<Add />}
                onClick={handleAddAdditionalCharge}
                variant="outlined"
                size="small"
              >
                Add Charge
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );

  // Step 5: Review & Submit
  const renderReviewSubmit = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Review Project Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please review all information before creating the project
        </Typography>
      </Grid>
      
      {success ? (
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Created Successfully! 🎉
            </Typography>
            <Typography>
              Your project "{formData.name}" has been created. Redirecting to project details...
            </Typography>
          </Alert>
        </Grid>
      ) : (
        <>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {formData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formData.type} • {formData.status}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography variant="body2">
                    {formData.location.area}, {formData.location.city}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Units</Typography>
                  <Typography variant="body2">{formData.totalUnits}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Price Range</Typography>
                  <Typography variant="body2">
                    {formatCurrency(formData.priceRange.min)} - {formatCurrency(formData.priceRange.max)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Target Revenue</Typography>
                  <Typography variant="body2">
                    {formatCurrency(formData.targetRevenue)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Amenities</Typography>
                  <Box sx={{ mt: 1 }}>
                    {formData.amenities.map(amenity => (
                      <Chip key={amenity} label={amenity} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );

  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderBasicInformation();
      case 1: return renderLocationDetails();
      case 2: return renderProjectSpecifications();
      case 3: return renderFinancialConfiguration();
      case 4: return renderReviewSubmit();
      default: return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate('/projects')} size="large">
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Create New Project
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Set up a new real estate project with complete configuration
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Stepper Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Setup
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {STEPS.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel 
                        onClick={() => handleStepClick(index)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {step.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {step.description}
                          </Typography>
                        </Box>
                      </StepLabel>
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
                {getStepContent(activeStep)}
                
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
                    {activeStep === STEPS.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || success}
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        size="large"
                      >
                        {loading ? 'Creating Project...' : 'Create Project'}
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
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CreateProjectPage;
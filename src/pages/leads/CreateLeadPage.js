// File: src/pages/leads/CreateLeadPage.js
// Description: Production-grade lead creation page with model-aligned data capture
// Version: 1.2 - FIXED Interaction enum values to match backend model
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
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  Business,
  LocationOn,
  Schedule,
  Save,
  CheckCircle,
  NavigateNext,
  Home,
  Assignment,
  ContactPhone,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI } from '../../services/api';

// =============================================================================
// CONSTANTS - ALIGNED WITH LEAD MODEL
// =============================================================================

const LEAD_SOURCES = [
  'Website',
  'Property Portal', 
  'Referral',
  'Walk-in',
  'Social Media',
  'Advertisement',
  'Cold Call',
  'Other'
];

const LEAD_PRIORITIES = [
  'Critical',
  'High', 
  'Medium',
  'Low',
  'Very Low'
];

const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiating',
  'Booked',
  'Lost',
  'Unqualified'
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

const BUDGET_RANGES = [
  'Under ₹25L',
  '₹25L - ₹50L',
  '₹50L - ₹75L', 
  '₹75L - ₹1Cr',
  '₹1Cr - ₹1.5Cr',
  '₹1.5Cr - ₹2Cr',
  '₹2Cr - ₹3Cr',
  '₹3Cr - ₹5Cr',
  'Above ₹5Cr'
];

// Timeline options matching model enum exactly
const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (Within 1 month)' },
  { value: '1-3_months', label: '1-3 Months' },
  { value: '3-6_months', label: '3-6 Months' },
  { value: '6-12_months', label: '6-12 Months' },
  { value: '12+_months', label: 'More than 12 Months' }
];

// Floor preferences matching model
const FLOOR_PREFERENCES = [
  { value: 'any', label: 'Any Floor' },
  { value: 'low', label: 'Lower Floors (1-5)' },
  { value: 'medium', label: 'Middle Floors (6-15)' },
  { value: 'high', label: 'Higher Floors (15+)' }
];

// Facing directions matching model
const FACING_DIRECTIONS = [
  'Any', 'North', 'South', 'East', 'West', 
  'North-East', 'North-West', 'South-East', 'South-West'
];

// Common amenities
const COMMON_AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children\'s Play Area',
  'Landscaped Gardens', 'Security', 'Power Backup', 'Elevator',
  'Parking', 'Intercom', 'Maintenance', 'Water Supply'
];

// Budget source options matching model
const BUDGET_SOURCES = [
  { value: 'self_reported', label: 'Self Reported' },
  { value: 'pre_approved', label: 'Pre-approved by Bank' },
  { value: 'loan_approved', label: 'Loan Already Approved' },
  { value: 'verified', label: 'Verified by Documents' }
];

// FIXED: Follow-up types matching Interaction model enum (Capitalized)
const FOLLOW_UP_TYPES = [
  { value: 'Call', label: 'Phone Call' },
  { value: 'Email', label: 'Email' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Site Visit', label: 'Site Visit' },
  { value: 'Meeting', label: 'In-person Meeting' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Note', label: 'Note/Memo' }
];

// Form steps configuration
const STEPS = [
  {
    label: 'Contact Information',
    description: 'Basic contact details and source',
    icon: <Person />,
  },
  {
    label: 'Requirements',
    description: 'Property preferences and budget',
    icon: <Home />,
  },
  {
    label: 'Lead Details',
    description: 'Priority, project assignment, and notes',
    icon: <Assignment />,
  },
  {
    label: 'Follow-up & Confirmation',
    description: 'Schedule and finalize lead creation',
    icon: <Schedule />,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Extract budget numbers from range string
const extractBudgetNumbers = (range) => {
  const ranges = {
    'Under ₹25L': { min: 0, max: 2500000 },
    '₹25L - ₹50L': { min: 2500000, max: 5000000 },
    '₹50L - ₹75L': { min: 5000000, max: 7500000 },
    '₹75L - ₹1Cr': { min: 7500000, max: 10000000 },
    '₹1Cr - ₹1.5Cr': { min: 10000000, max: 15000000 },
    '₹1.5Cr - ₹2Cr': { min: 15000000, max: 20000000 },
    '₹2Cr - ₹3Cr': { min: 20000000, max: 30000000 },
    '₹3Cr - ₹5Cr': { min: 30000000, max: 50000000 },
    'Above ₹5Cr': { min: 50000000, max: 100000000 }
  };
  
  return ranges[range] || { min: '', max: '' };
};

// Determine qualification status based on form data
const determineQualificationStatus = (data) => {
  if (data.budget.min && data.requirements.timeline && data.requirements.unitType) {
    return 'Qualified';
  } else if (data.budget.budgetSource !== 'self_reported') {
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

  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateRequirements = (data) => {
  const errors = {};

  if (!data.interestedPropertyTypes?.length) {
    errors.interestedPropertyTypes = 'Please select at least one property type';
  }

  if (!data.budgetRange) {
    errors.budgetRange = 'Budget range is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateLeadDetails = (data) => {
  const errors = {};

  if (!data.priority) {
    errors.priority = 'Priority is required';
  }

  if (!data.status) {
    errors.status = 'Initial status is required';
  }

  if (!data.project) {
    errors.project = 'Primary project interest is required';
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
  const [loadingData, setLoadingData] = useState(true);

  // Form data - ALIGNED WITH LEAD MODEL
  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: '',
    sourceDetails: '',
    
    // Budget Structure - matching model exactly
    budgetRange: '', // For display purposes
    budget: {
      min: '',
      max: '',
      budgetSource: 'self_reported',
      currency: 'INR'
    },
    
    // Requirements Structure - matching model exactly
    requirements: {
      timeline: '', // enum: ['immediate', '1-3_months', '3-6_months', '6-12_months', '12+_months']
      unitType: '', // Primary unit type they're interested in
      floor: {
        preference: 'any', // enum: ['low', 'medium', 'high', 'any']
        specific: '' // specific floor number if any
      },
      facing: 'Any', // enum values from model
      amenities: [], // array of preferred amenities
      specialRequirements: '' // any special requirements
    },
    
    // Additional fields for better capture
    interestedPropertyTypes: [], // For UI purposes - will map to unitType
    preferredLocation: '',
    interestedProjects: [],
    
    // Lead Details
    priority: 'Medium',
    status: 'New',
    assignedTo: user?.id || '',
    project: '', // Required by backend
    notes: '',
    
    // FIXED: Follow-up with correct Interaction model enum values (Capitalized)
    scheduleFollowUp: false,
    followUpDate: null,
    followUpType: 'Call', // FIXED: Changed from 'call' to 'Call' to match Interaction model
    followUpNotes: '',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const [projectsResponse] = await Promise.allSettled([
        projectAPI.getProjects()
      ]);

      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data;
        setProjects(projectsData.data || projectsData || []);
      }

      setSalesTeam([
        {
          _id: user?.id || user?._id,
          firstName: user?.firstName || 'Current',
          lastName: user?.lastName || 'User',
          role: user?.role || 'Sales Executive'
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

  // Navigation handlers
  const handleNext = () => {
    let validation;
    
    if (activeStep === 0) {
      validation = validateContactInfo(formData);
    } else if (activeStep === 1) {
      validation = validateRequirements(formData);
    } else if (activeStep === 2) {
      validation = validateLeadDetails(formData);
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
    setIsLoading(true);
    setErrors({});

    try {
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
        sourceDetails: formData.sourceDetails.trim() || undefined,
        
        // Lead Status & Assignment
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || undefined,
        
        // Budget structure matching model exactly
        budget: {
          min: formData.budget.min ? parseInt(formData.budget.min) : undefined,
          max: formData.budget.max ? parseInt(formData.budget.max) : undefined,
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
            specific: formData.requirements.floor.specific ? 
              parseInt(formData.requirements.floor.specific) : undefined
          },
          facing: formData.requirements.facing,
          amenities: formData.requirements.amenities,
          specialRequirements: formData.requirements.specialRequirements.trim() || undefined
        },
        
        // Additional notes
        notes: formData.notes.trim() || undefined,
        
        // FIXED: Follow-up with correct Interaction model enum values (Capitalized)
        followUpSchedule: formData.scheduleFollowUp ? {
          nextFollowUpDate: formData.followUpDate,
          followUpType: formData.followUpType, // Now uses capitalized values like 'Call', 'Meeting'
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
          placeholder="Enter last name"
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

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Source Details"
          placeholder="Specific details about the source (optional)"
          value={formData.sourceDetails}
          onChange={handleInputChange('sourceDetails')}
          disabled={isLoading}
          helperText="e.g., 'From John's referral' or 'Facebook ad campaign'"
        />
      </Grid>
    </Grid>
  );

  const renderRequirements = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Property Requirements
        </Typography>
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

      {/* Timeline Selection with Model Enums */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.timeline}>
          <InputLabel>Occupancy Timeline</InputLabel>
          <Select
            value={formData.requirements.timeline}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                timeline: e.target.value
              }
            }))}
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
      </Grid>

      {/* Budget Range Selection */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.budgetRange}>
          <InputLabel>Budget Range</InputLabel>
          <Select
            value={formData.budgetRange}
            onChange={(e) => {
              const range = e.target.value;
              handleInputChange('budgetRange')(e);
              
              // Auto-extract min/max from range
              const budgetNumbers = extractBudgetNumbers(range);
              setFormData(prev => ({
                ...prev,
                budget: {
                  ...prev.budget,
                  min: budgetNumbers.min,
                  max: budgetNumbers.max
                }
              }));
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

      {/* Specific Budget Min/Max */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Minimum Budget"
          placeholder="Enter minimum budget"
          value={formData.budget.min}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            budget: {
              ...prev.budget,
              min: e.target.value
            }
          }))}
          disabled={isLoading}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Maximum Budget"
          placeholder="Enter maximum budget"
          value={formData.budget.max}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            budget: {
              ...prev.budget,
              max: e.target.value
            }
          }))}
          disabled={isLoading}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />
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

      {/* Specific Floor Number */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Specific Floor (Optional)"
          placeholder="Enter specific floor number"
          value={formData.requirements.floor.specific}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            requirements: {
              ...prev.requirements,
              floor: {
                ...prev.requirements.floor,
                specific: e.target.value
              }
            }
          }))}
          disabled={isLoading}
          type="number"
          helperText="Leave empty if no specific floor preference"
        />
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

      {/* Preferred Location */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Preferred Location"
          placeholder="Enter preferred location"
          value={formData.preferredLocation}
          onChange={handleInputChange('preferredLocation')}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Preferred Amenities */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            multiple
            options={COMMON_AMENITIES}
            value={formData.requirements.amenities}
            onChange={(event, newValue) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                amenities: newValue
              }
            }))}
            disabled={isLoading}
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
                placeholder="Select preferred amenities"
                helperText="Select amenities that are important to the lead"
              />
            )}
          />
        </FormControl>
      </Grid>

      {/* Special Requirements */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Special Requirements"
          placeholder="Any special requirements or preferences..."
          value={formData.requirements.specialRequirements}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            requirements: {
              ...prev.requirements,
              specialRequirements: e.target.value
            }
          }))}
          disabled={isLoading}
          multiline
          rows={2}
          helperText="e.g., Pet-friendly, Vastu compliant, Near Metro, etc."
        />
      </Grid>

      {/* Additional Interested Projects */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            multiple
            options={projects}
            value={formData.interestedProjects}
            onChange={(event, newValue) => handleArrayFieldChange('interestedProjects', newValue)}
            getOptionLabel={(option) => option.name || ''}
            disabled={isLoading || loadingData}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option._id}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Additional Interested Projects (Optional)"
                placeholder="Select other projects they've shown interest in"
                helperText="Besides the primary project, what other projects are they considering?"
              />
            )}
          />
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderLeadDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Lead Management Details
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Select the primary project this lead is most interested in. This is required for lead tracking and assignment.
          </Typography>
        </Alert>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.priority}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={formData.priority}
            onChange={handleInputChange('priority')}
            label="Priority"
            disabled={isLoading}
          >
            {LEAD_PRIORITIES.map(priority => (
              <MenuItem key={priority} value={priority}>
                {priority}
              </MenuItem>
            ))}
          </Select>
          {errors.priority && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.priority}
            </Typography>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.status}>
          <InputLabel>Initial Status</InputLabel>
          <Select
            value={formData.status}
            onChange={handleInputChange('status')}
            label="Initial Status"
            disabled={isLoading}
          >
            {LEAD_STATUSES.map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
          {errors.status && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.status}
            </Typography>
          )}
        </FormControl>
      </Grid>

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
                label="🏢 Primary Project Interest"
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

      <Grid item xs={12}>
        <FormControl fullWidth>
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
                placeholder="Select sales team member (optional)"
                helperText="Assign this lead to a sales team member"
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

  const renderFollowUpConfirmation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Follow-up & Confirmation
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.scheduleFollowUp}
              onChange={handleInputChange('scheduleFollowUp')}
              disabled={isLoading}
            />
          }
          label="Schedule immediate follow-up"
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
            {/* FIXED: Follow-up Type with correct Interaction model enum values */}
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
              label="Follow-up Notes"
              placeholder="Add notes for the follow-up..."
              value={formData.followUpNotes}
              onChange={handleInputChange('followUpNotes')}
              disabled={isLoading}
              multiline
              rows={3}
            />
          </Grid>
        </>
      )}

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
              <Typography variant="body2" color="text.secondary">Requirements:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.budgetRange}
              </Typography>
              <Typography variant="body2">
                {formData.interestedPropertyTypes.join(', ')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Primary Project:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {projects.find(p => p._id === formData.project)?.name || 'Not selected'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Source & Priority:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.source} • {formData.priority} Priority
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Assigned To:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {salesTeam.find(member => member._id === formData.assignedTo)?.firstName || 'Unassigned'} {salesTeam.find(member => member._id === formData.assignedTo)?.lastName || ''}
              </Typography>
            </Grid>
            {formData.scheduleFollowUp && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Follow-up:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {FOLLOW_UP_TYPES.find(type => type.value === formData.followUpType)?.label || formData.followUpType}
                </Typography>
                <Typography variant="body2">
                  {formData.followUpDate ? new Date(formData.followUpDate).toLocaleString() : 'No date set'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
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
              {activeStep === 2 && renderLeadDetails()}
              {activeStep === 3 && renderFollowUpConfirmation()}

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
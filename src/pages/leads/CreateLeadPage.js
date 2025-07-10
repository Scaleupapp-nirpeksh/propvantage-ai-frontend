// File: src/pages/leads/CreateLeadPage.js
// Description: Production-grade lead creation page with multi-step form and complete backend integration
// Version: 1.0 - Complete lead capture system with AI scoring and assignment
// Location: src/pages/leads/CreateLeadPage.js

import React, { useState, useEffect, useCallback } from 'react';
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
  RadioGroup,
  Radio,
  InputAdornment,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Autocomplete,
  Stack,
  Avatar,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  Business,
  LocationOn,
  AttachMoney,
  Schedule,
  Star,
  Save,
  Send,
  CheckCircle,
  Info,
  Warning,
  NavigateNext,
  Home,
  Assignment,
  ContactPhone,
  PriorityHigh,
  Source,
  Psychology,
} from '@mui/icons-material';
// Using native HTML5 datetime inputs instead of @mui/x-date-pickers to avoid dependencies
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI } from '../../services/api';

// Lead configuration constants
const LEAD_SOURCES = [
  'Website',
  'Property Portal',
  'Referral',
  'Walk-in',
  'Social Media',
  'Advertisement',
  'Cold Call',
  'Exhibition',
  'Broker',
  'Direct Marketing',
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
  } else if (!/^[+]?[\d\s\-\(\)]{10,}$/.test(data.phone.trim())) {
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

/**
 * CreateLeadPage Component
 * 
 * Features:
 * - Multi-step lead creation form
 * - Complete backend integration
 * - Project and user assignment
 * - AI scoring preparation
 * - Follow-up scheduling
 * - Comprehensive validation
 * - Professional UI/UX
 */
const CreateLeadPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: '',
    sourceDetails: '',
    
    // Requirements
    interestedPropertyTypes: [],
    budgetRange: '',
    specificBudget: '',
    preferredLocation: '',
    interestedProjects: [],
    occupancyTimeline: '',
    
    // Lead Details
    priority: 'Medium',
    status: 'New',
    assignedTo: user?.id || '',
    project: '', // Required by backend - primary project interest
    notes: '',
    tags: [],
    
    // Follow-up
    scheduleFollowUp: false,
    followUpDate: null,
    followUpType: 'Call',
    followUpNotes: '',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch projects and check if userAPI is available for sales team
      const [projectsResponse] = await Promise.allSettled([
        projectAPI.getProjects()
      ]);

      // Handle projects data
      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data;
        setProjects(projectsData.data || projectsData || []);
      }

      // For now, use current user as default assignee
      // TODO: Implement userAPI.getUsers when user management is ready
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
      value = event; // For Autocomplete and other custom components
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle array field changes (for multi-select)
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

  // Form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Prepare lead data for backend - matching exact API expectations
      const leadData = {
        // Required fields (as per backend validation)
        project: formData.project, // Required: primary project ID
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
        
        // Budget Information (if provided)
        budget: formData.specificBudget ? {
          min: parseInt(formData.specificBudget),
          max: parseInt(formData.specificBudget),
          budgetSource: 'self_reported'
        } : undefined,
        
        // Requirements Object
        requirements: {
          propertyTypes: formData.interestedPropertyTypes,
          budgetRange: formData.budgetRange,
          preferredLocation: formData.preferredLocation.trim() || undefined,
          interestedProjects: formData.interestedProjects,
          occupancyTimeline: formData.occupancyTimeline || undefined,
          timeline: formData.occupancyTimeline ? 
            (formData.occupancyTimeline.toLowerCase().includes('immediate') ? 'immediate' :
             formData.occupancyTimeline.toLowerCase().includes('1') ? '1-3_months' :
             formData.occupancyTimeline.toLowerCase().includes('3') ? '3-6_months' :
             formData.occupancyTimeline.toLowerCase().includes('6') ? '6-12_months' : 
             '12+_months') : undefined
        },
        
        // Additional Notes
        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
        
        // Follow-up Schedule (if enabled)
        followUpSchedule: formData.scheduleFollowUp ? {
          nextFollowUpDate: formData.followUpDate,
          followUpType: formData.followUpType,
          notes: formData.followUpNotes.trim() || undefined,
        } : undefined,
      };

      console.log('🚀 Creating lead with data:', leadData);

      // Create the lead
      const response = await leadAPI.createLead(leadData);
      
      console.log('✅ Lead created successfully:', response.data);

      // Show success message
      enqueueSnackbar('Lead created successfully!', {
        variant: 'success',
        autoHideDuration: 5000,
      });

      // Navigate to the created lead's detail page
      const createdLead = response.data.data || response.data;
      navigate(`/leads/${createdLead._id || createdLead.id}`);

    } catch (error) {
      console.error('❌ Error creating lead:', error);
      
      let errorMessage = 'Failed to create lead. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for validation errors
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

  // Step content renderers
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
            startAdornment={
              <InputAdornment position="start">
                <Source color={errors.source ? 'error' : 'action'} />
              </InputAdornment>
            }
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

      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.interestedPropertyTypes}>
          <Autocomplete
            multiple
            options={PROPERTY_TYPES}
            value={formData.interestedPropertyTypes}
            onChange={(event, newValue) => handleArrayFieldChange('interestedPropertyTypes', newValue)}
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

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.budgetRange}>
          <InputLabel>Budget Range</InputLabel>
          <Select
            value={formData.budgetRange}
            onChange={handleInputChange('budgetRange')}
            label="Budget Range"
            disabled={isLoading}
            startAdornment={
              <InputAdornment position="start">
                <AttachMoney color={errors.budgetRange ? 'error' : 'action'} />
              </InputAdornment>
            }
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

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Specific Budget"
          placeholder="Enter specific budget (optional)"
          value={formData.specificBudget}
          onChange={handleInputChange('specificBudget')}
          disabled={isLoading}
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          helperText="Enter exact budget if known"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Preferred Location"
          placeholder="Enter preferred location (optional)"
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

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Occupancy Timeline"
          placeholder="When do they need the property?"
          value={formData.occupancyTimeline}
          onChange={handleInputChange('occupancyTimeline')}
          disabled={isLoading}
          helperText="e.g., 'Immediate', '6 months', '1 year'"
        />
      </Grid>

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
                label="Additional Interested Projects"
                placeholder="Select any additional projects (optional)"
                helperText="Select other projects the lead has shown interest in (besides the primary project)"
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
            startAdornment={
              <InputAdornment position="start">
                <PriorityHigh color={errors.priority ? 'error' : 'action'} />
              </InputAdornment>
            }
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
            <FormControl fullWidth>
              <InputLabel>Follow-up Type</InputLabel>
              <Select
                value={formData.followUpType}
                onChange={handleInputChange('followUpType')}
                label="Follow-up Type"
                disabled={isLoading}
              >
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="Site Visit">Site Visit</MenuItem>
                <MenuItem value="Meeting">In-person Meeting</MenuItem>
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
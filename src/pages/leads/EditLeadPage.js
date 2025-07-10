// File: src/pages/leads/EditLeadPage.js
// Description: Complete lead editing page with model-aligned data structure
// Version: 1.0 - Production-grade lead editing with pre-population and validation
// Location: src/pages/leads/EditLeadPage.js

import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Save,
  CheckCircle,
  NavigateNext,
  Home,
  Assignment,
  ContactPhone,
  PriorityHigh,
  Source,
  Delete,
  Warning,
  Edit,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI } from '../../services/api';

// =============================================================================
// CONSTANTS - SAME AS CREATE PAGE
// =============================================================================

const LEAD_SOURCES = [
  'Website', 'Property Portal', 'Referral', 'Walk-in', 'Social Media',
  'Advertisement', 'Cold Call', 'Other'
];

const LEAD_PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];

const LEAD_STATUSES = [
  'New', 'Contacted', 'Qualified', 'Site Visit Scheduled', 'Site Visit Completed',
  'Negotiating', 'Booked', 'Lost', 'Unqualified'
];

const PROPERTY_TYPES = [
  '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Studio', 'Penthouse',
  'Villa', 'Plot', 'Commercial', 'Office Space', 'Retail', 'Warehouse'
];

const BUDGET_RANGES = [
  'Under ₹25L', '₹25L - ₹50L', '₹50L - ₹75L', '₹75L - ₹1Cr',
  '₹1Cr - ₹1.5Cr', '₹1.5Cr - ₹2Cr', '₹2Cr - ₹3Cr', '₹3Cr - ₹5Cr', 'Above ₹5Cr'
];

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (Within 1 month)' },
  { value: '1-3_months', label: '1-3 Months' },
  { value: '3-6_months', label: '3-6 Months' },
  { value: '6-12_months', label: '6-12 Months' },
  { value: '12+_months', label: 'More than 12 Months' }
];

const FLOOR_PREFERENCES = [
  { value: 'any', label: 'Any Floor' },
  { value: 'low', label: 'Lower Floors (1-5)' },
  { value: 'medium', label: 'Middle Floors (6-15)' },
  { value: 'high', label: 'Higher Floors (15+)' }
];

const FACING_DIRECTIONS = [
  'Any', 'North', 'South', 'East', 'West', 
  'North-East', 'North-West', 'South-East', 'South-West'
];

const COMMON_AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children\'s Play Area',
  'Landscaped Gardens', 'Security', 'Power Backup', 'Elevator',
  'Parking', 'Intercom', 'Maintenance', 'Water Supply'
];

const BUDGET_SOURCES = [
  { value: 'self_reported', label: 'Self Reported' },
  { value: 'pre_approved', label: 'Pre-approved by Bank' },
  { value: 'loan_approved', label: 'Loan Already Approved' },
  { value: 'verified', label: 'Verified by Documents' }
];

const STEPS = [
  { label: 'Contact Information', description: 'Basic contact details and source', icon: <Person /> },
  { label: 'Requirements', description: 'Property preferences and budget', icon: <Home /> },
  { label: 'Lead Details', description: 'Priority, project assignment, and notes', icon: <Assignment /> },
  { label: 'Follow-up & Save', description: 'Update follow-up and save changes', icon: <Schedule /> },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

const getBudgetRangeFromNumbers = (min, max) => {
  if (!min && !max) return '';
  
  const minNum = parseInt(min) || 0;
  const maxNum = parseInt(max) || 0;
  
  if (maxNum <= 2500000) return 'Under ₹25L';
  if (minNum >= 2500000 && maxNum <= 5000000) return '₹25L - ₹50L';
  if (minNum >= 5000000 && maxNum <= 7500000) return '₹50L - ₹75L';
  if (minNum >= 7500000 && maxNum <= 10000000) return '₹75L - ₹1Cr';
  if (minNum >= 10000000 && maxNum <= 15000000) return '₹1Cr - ₹1.5Cr';
  if (minNum >= 15000000 && maxNum <= 20000000) return '₹1.5Cr - ₹2Cr';
  if (minNum >= 20000000 && maxNum <= 30000000) return '₹2Cr - ₹3Cr';
  if (minNum >= 30000000 && maxNum <= 50000000) return '₹3Cr - ₹5Cr';
  if (minNum >= 50000000) return 'Above ₹5Cr';
  
  return 'Custom Range';
};

const validateContactInfo = (data) => {
  const errors = {};
  if (!data.firstName?.trim()) errors.firstName = 'First name is required';
  if (!data.lastName?.trim()) errors.lastName = 'Last name is required';
  if (!data.phone?.trim()) errors.phone = 'Phone number is required';
  if (data.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!data.source) errors.source = 'Lead source is required';
  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateRequirements = (data) => {
  const errors = {};
  if (!data.interestedPropertyTypes?.length) {
    errors.interestedPropertyTypes = 'Please select at least one property type';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateLeadDetails = (data) => {
  const errors = {};
  if (!data.priority) errors.priority = 'Priority is required';
  if (!data.status) errors.status = 'Status is required';
  if (!data.project) errors.project = 'Primary project interest is required';
  return { isValid: Object.keys(errors).length === 0, errors };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const EditLeadPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // Component state
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [originalLead, setOriginalLead] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data - initialized empty, will be populated from API
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', source: '', sourceDetails: '',
    budgetRange: '',
    budget: { min: '', max: '', budgetSource: 'self_reported', currency: 'INR' },
    requirements: {
      timeline: '', unitType: '',
      floor: { preference: 'any', specific: '' },
      facing: 'Any', amenities: [], specialRequirements: ''
    },
    interestedPropertyTypes: [], preferredLocation: '', interestedProjects: [],
    priority: 'Medium', status: 'New', assignedTo: '', project: '', notes: '',
    scheduleFollowUp: false, followUpDate: null, followUpType: 'call', followUpNotes: '',
  });

  // Load initial data and lead details
  useEffect(() => {
    loadInitialData();
  }, [leadId]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // Load projects and lead data in parallel
      const [projectsResponse, leadResponse] = await Promise.allSettled([
        projectAPI.getProjects(),
        leadAPI.getLead(leadId)
      ]);

      // Handle projects
      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data;
        setProjects(projectsData.data || projectsData || []);
      }

      // Handle lead data
      if (leadResponse.status === 'fulfilled') {
        const leadData = leadResponse.value.data;
        const lead = leadData.data || leadData;
        
        console.log('📥 Loaded lead for editing:', lead);
        setOriginalLead(lead);
        populateFormFromLead(lead);
      } else {
        throw new Error('Failed to load lead data');
      }

      // Set sales team (placeholder)
      setSalesTeam([
        {
          _id: user?.id || user?._id,
          firstName: user?.firstName || 'Current',
          lastName: user?.lastName || 'User',
          role: user?.role || 'Sales Executive'
        }
      ]);

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      enqueueSnackbar('Failed to load lead data. Please try again.', { variant: 'error' });
      navigate('/leads');
    } finally {
      setInitialLoading(false);
    }
  };

  // Populate form from loaded lead data
  const populateFormFromLead = (lead) => {
    console.log('🔄 Populating form with lead data:', lead);
    
    // Extract interested property types from requirements or other fields
    const propertyTypes = lead.requirements?.propertyTypes || 
                         (lead.requirements?.unitType ? [lead.requirements.unitType] : []);
    
    // Determine budget range from min/max values
    const budgetRange = getBudgetRangeFromNumbers(
      lead.budget?.min, 
      lead.budget?.max
    );

    setFormData({
      // Contact Information
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source || '',
      sourceDetails: lead.sourceDetails || '',
      
      // Budget
      budgetRange: budgetRange,
      budget: {
        min: lead.budget?.min || '',
        max: lead.budget?.max || '',
        budgetSource: lead.budget?.budgetSource || 'self_reported',
        currency: lead.budget?.currency || 'INR'
      },
      
      // Requirements
      requirements: {
        timeline: lead.requirements?.timeline || '',
        unitType: lead.requirements?.unitType || '',
        floor: {
          preference: lead.requirements?.floor?.preference || 'any',
          specific: lead.requirements?.floor?.specific || ''
        },
        facing: lead.requirements?.facing || 'Any',
        amenities: lead.requirements?.amenities || [],
        specialRequirements: lead.requirements?.specialRequirements || ''
      },
      
      // Additional fields
      interestedPropertyTypes: propertyTypes,
      preferredLocation: lead.preferredLocation || '',
      interestedProjects: lead.interestedProjects || [],
      
      // Lead Details
      priority: lead.priority || 'Medium',
      status: lead.status || 'New',
      assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
      project: lead.project?._id || lead.project || '',
      notes: lead.notes || '',
      
      // Follow-up
      scheduleFollowUp: !!lead.followUpSchedule?.nextFollowUpDate,
      followUpDate: lead.followUpSchedule?.nextFollowUpDate ? 
        new Date(lead.followUpSchedule.nextFollowUpDate) : null,
      followUpType: lead.followUpSchedule?.followUpType || 'call',
      followUpNotes: lead.followUpSchedule?.notes || '',
    });
  };

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    let value;
    if (event?.target) {
      value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    } else {
      value = event;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayFieldChange = (field, values) => {
    setFormData(prev => ({ ...prev, [field]: values }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Navigation handlers
  const handleNext = () => {
    let validation;
    if (activeStep === 0) validation = validateContactInfo(formData);
    else if (activeStep === 1) validation = validateRequirements(formData);
    else if (activeStep === 2) validation = validateLeadDetails(formData);

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

  // Update lead
  const handleUpdate = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Prepare updated lead data
      const updateData = {
        // Contact Information
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        source: formData.source,
        sourceDetails: formData.sourceDetails.trim() || undefined,
        
        // Lead Status & Assignment
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || undefined,
        project: formData.project,
        
        // Budget structure
        budget: {
          min: formData.budget.min ? parseInt(formData.budget.min) : undefined,
          max: formData.budget.max ? parseInt(formData.budget.max) : undefined,
          budgetSource: formData.budget.budgetSource,
          currency: formData.budget.currency,
          lastUpdated: new Date(),
          updatedBy: user?.id || user?._id || undefined
        },
        
        // Requirements structure
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
        
        // Notes
        notes: formData.notes.trim() || undefined,
        
        // Follow-up schedule
        followUpSchedule: formData.scheduleFollowUp ? {
          nextFollowUpDate: formData.followUpDate,
          followUpType: formData.followUpType,
          notes: formData.followUpNotes.trim() || undefined,
          isOverdue: false,
          overdueBy: 0
        } : undefined,
      };

      console.log('🔄 Updating lead with data:', updateData);

      const response = await leadAPI.updateLead(leadId, updateData);
      
      console.log('✅ Lead updated successfully:', response.data);

      enqueueSnackbar('Lead updated successfully!', { variant: 'success' });
      navigate(`/leads/${leadId}`);

    } catch (error) {
      console.error('❌ Error updating lead:', error);
      
      let errorMessage = 'Failed to update lead. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete lead
  const handleDelete = async () => {
    try {
      await leadAPI.deleteLead(leadId);
      enqueueSnackbar('Lead deleted successfully!', { variant: 'success' });
      navigate('/leads');
    } catch (error) {
      console.error('❌ Error deleting lead:', error);
      enqueueSnackbar('Failed to delete lead. Please try again.', { variant: 'error' });
    }
    setDeleteDialogOpen(false);
  };

  // Render functions (same as CreateLeadPage but with pre-populated data)
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

      {/* Property Types */}
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.interestedPropertyTypes}>
          <Autocomplete
            multiple
            options={PROPERTY_TYPES}
            value={formData.interestedPropertyTypes}
            onChange={(event, newValue) => {
              handleArrayFieldChange('interestedPropertyTypes', newValue);
              if (newValue.length > 0 && !formData.requirements.unitType) {
                setFormData(prev => ({
                  ...prev,
                  requirements: { ...prev.requirements, unitType: newValue[0] }
                }));
              }
            }}
            disabled={isLoading}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
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

      {/* Primary Unit Type */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Primary Unit Type</InputLabel>
          <Select
            value={formData.requirements.unitType}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: { ...prev.requirements, unitType: e.target.value }
            }))}
            label="Primary Unit Type"
            disabled={isLoading}
          >
            {formData.interestedPropertyTypes.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Timeline */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Occupancy Timeline</InputLabel>
          <Select
            value={formData.requirements.timeline}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: { ...prev.requirements, timeline: e.target.value }
            }))}
            label="Occupancy Timeline"
            disabled={isLoading}
          >
            {TIMELINE_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Budget Range */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Budget Range</InputLabel>
          <Select
            value={formData.budgetRange}
            onChange={(e) => {
              const range = e.target.value;
              handleInputChange('budgetRange')(e);
              const budgetNumbers = extractBudgetNumbers(range);
              setFormData(prev => ({
                ...prev,
                budget: { ...prev.budget, min: budgetNumbers.min, max: budgetNumbers.max }
              }));
            }}
            label="Budget Range"
            disabled={isLoading}
          >
            {BUDGET_RANGES.map(range => (
              <MenuItem key={range} value={range}>{range}</MenuItem>
            ))}
          </Select>
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
              budget: { ...prev.budget, budgetSource: e.target.value }
            }))}
            label="Budget Source"
            disabled={isLoading}
          >
            {BUDGET_SOURCES.map(source => (
              <MenuItem key={source.value} value={source.value}>{source.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Budget Min/Max */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Minimum Budget"
          value={formData.budget.min}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            budget: { ...prev.budget, min: e.target.value }
          }))}
          disabled={isLoading}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Maximum Budget"
          value={formData.budget.max}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            budget: { ...prev.budget, max: e.target.value }
          }))}
          disabled={isLoading}
          type="number"
          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        />
      </Grid>

      {/* Floor Preference */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Floor Preference</InputLabel>
          <Select
            value={formData.requirements.floor.preference}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                floor: { ...prev.requirements.floor, preference: e.target.value }
              }
            }))}
            label="Floor Preference"
            disabled={isLoading}
          >
            {FLOOR_PREFERENCES.map(option => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Specific Floor */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Specific Floor (Optional)"
          value={formData.requirements.floor.specific}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            requirements: {
              ...prev.requirements,
              floor: { ...prev.requirements.floor, specific: e.target.value }
            }
          }))}
          disabled={isLoading}
          type="number"
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
              requirements: { ...prev.requirements, facing: e.target.value }
            }))}
            label="Facing Direction"
            disabled={isLoading}
          >
            {FACING_DIRECTIONS.map(direction => (
              <MenuItem key={direction} value={direction}>{direction}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Preferred Location */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Preferred Location"
          value={formData.preferredLocation}
          onChange={handleInputChange('preferredLocation')}
          disabled={isLoading}
        />
      </Grid>

      {/* Amenities */}
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            multiple
            options={COMMON_AMENITIES}
            value={formData.requirements.amenities}
            onChange={(event, newValue) => setFormData(prev => ({
              ...prev,
              requirements: { ...prev.requirements, amenities: newValue }
            }))}
            disabled={isLoading}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} size="small" />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Preferred Amenities (Optional)"
                placeholder="Select preferred amenities"
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
          value={formData.requirements.specialRequirements}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            requirements: { ...prev.requirements, specialRequirements: e.target.value }
          }))}
          disabled={isLoading}
          multiline
          rows={2}
        />
      </Grid>
    </Grid>
  );

  const renderLeadDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Lead Management Details
        </Typography>
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
              <MenuItem key={priority} value={priority}>{priority}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.status}>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={handleInputChange('status')}
            label="Status"
            disabled={isLoading}
          >
            {LEAD_STATUSES.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors.project}>
          <Autocomplete
            options={projects}
            value={projects.find(project => project._id === formData.project) || null}
            onChange={(event, newValue) => handleInputChange('project')(newValue?._id || '')}
            getOptionLabel={(option) => option.name || ''}
            disabled={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="🏢 Primary Project Interest"
                error={!!errors.project}
                helperText={errors.project || 'Primary project this lead is interested in'}
              />
            )}
          />
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notes"
          value={formData.notes}
          onChange={handleInputChange('notes')}
          disabled={isLoading}
          multiline
          rows={4}
        />
      </Grid>
    </Grid>
  );

  const renderFollowUpConfirmation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
          Follow-up & Save Changes
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
          label="Update follow-up schedule"
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
              InputLabelProps={{ shrink: true }}
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
                <MenuItem value="call">Phone Call</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="site_visit">Site Visit</MenuItem>
                <MenuItem value="meeting">In-person Meeting</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Follow-up Notes"
              value={formData.followUpNotes}
              onChange={handleInputChange('followUpNotes')}
              disabled={isLoading}
              multiline
              rows={3}
            />
          </Grid>
        </>
      )}

      {/* Summary */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'warning.main' }}>
            <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
            Changes Summary
          </Typography>
          <Typography variant="body2">
            You are about to update lead: <strong>{formData.firstName} {formData.lastName}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Status: <strong>{formData.status}</strong> • Priority: <strong>{formData.priority}</strong>
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading lead data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
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
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
          onClick={() => navigate(`/leads/${leadId}`)}
        >
          <ContactPhone fontSize="small" />
          {originalLead?.firstName} {originalLead?.lastName}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Edit fontSize="small" />
          Edit Lead
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/leads/${leadId}`)} sx={{ bgcolor: 'action.hover' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Edit Lead: {originalLead?.firstName} {originalLead?.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Update lead information and requirements
              </Typography>
            </Box>
          </Box>

          {/* Delete Button */}
          {canAccess.leadManagement() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Lead
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stepper */}
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {STEPS.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={index === activeStep ? (
                        <Typography variant="caption">{step.description}</Typography>
                      ) : null}
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
                      onClick={handleUpdate}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                      size="large"
                    >
                      {isLoading ? 'Updating Lead...' : 'Update Lead'}
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete Lead
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this lead? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Lead: <strong>{originalLead?.firstName} {originalLead?.lastName}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete Lead
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditLeadPage;
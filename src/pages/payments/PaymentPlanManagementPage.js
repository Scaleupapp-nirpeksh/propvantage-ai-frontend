/**
 * File: src/pages/payments/PaymentPlanManagementPage.js
 * Description: Enhanced Payment Plan Management with project selection and validation in wizard
 * Version: 5.1 - FIXED: Data access patterns and enhanced error handling
 * Location: src/pages/payments/PaymentPlanManagementPage.js
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  FormHelperText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  AccountBalance,
  Receipt,
  Download,
  Refresh,
  FilterList,
  Search,
  Clear,
  Save,
  CheckCircle,
  TrendingUp,
  Assessment,
  ArrowBack,
  ArrowForward,
  BusinessCenter,
  LocationOn,
  Error as ErrorIcon,
} from '@mui/icons-material';

// CORRECTED: Import the actual APIs from our corrected api.js
import { projectPaymentAPI, paymentAPI, projectAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatPercentage = (value) => `${(value || 0).toFixed(1)}%`;

const calculateTemplateStats = (templates) => {
  if (!Array.isArray(templates)) return { total: 0, active: 0, totalUsage: 0, mostPopular: null };
  
  return {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
    mostPopular: templates.length > 0 
      ? templates.reduce((prev, current) => 
          (prev.usageCount || 0) > (current.usageCount || 0) ? prev : current
        ) 
      : null,
  };
};

// Enhanced data extraction utility
const extractApiData = (response, path = 'data') => {
  console.log('🔍 Extracting data from API response:', { response, path });
  
  if (!response) {
    console.warn('⚠️ No response provided');
    return [];
  }

  // Handle different response structures
  const responseData = response.data || response;
  
  if (path === 'data') {
    // For template and project APIs: {success: true, data: [...], count: X}
    if (responseData?.data && Array.isArray(responseData.data)) {
      console.log('✅ Found array at response.data.data:', responseData.data.length, 'items');
      return responseData.data;
    }
    
    // Fallback: Direct array
    if (Array.isArray(responseData)) {
      console.log('✅ Found direct array:', responseData.length, 'items');
      return responseData;
    }
    
    // For statistics API: {success: true, data: {...}}
    if (responseData?.data && typeof responseData.data === 'object') {
      console.log('✅ Found object at response.data.data');
      return responseData.data;
    }
  }
  
  console.warn('⚠️ Could not extract data, returning empty array/object');
  return Array.isArray(responseData?.data) ? [] : {};
};

// Validate if project has all required fields for payment plan templates
const validateProjectForTemplates = (project) => {
  const issues = [];
  
  if (!project.priceRange?.min || project.priceRange.min <= 0) {
    issues.push({ field: 'priceRange.min', message: 'Minimum price is required' });
  }
  
  if (!project.priceRange?.max || project.priceRange.max <= 0) {
    issues.push({ field: 'priceRange.max', message: 'Maximum price is required' });
  }
  
  if (!project.location?.area || project.location.area.trim() === '') {
    issues.push({ field: 'location.area', message: 'Project area is required' });
  }
  
  if (project.priceRange?.min && project.priceRange?.max && project.priceRange.min >= project.priceRange.max) {
    issues.push({ field: 'priceRange', message: 'Maximum price must be greater than minimum price' });
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

const PLAN_TYPES = [
  { value: 'construction_linked', label: 'Construction Linked' },
  { value: 'time_based', label: 'Time Based' },
  { value: 'milestone_based', label: 'Milestone Based' },
  { value: 'custom', label: 'Custom' },
];

const MILESTONE_TYPES = [
  { value: 'booking', label: 'Booking' },
  { value: 'time_based', label: 'Time Based' },
  { value: 'construction', label: 'Construction' },
  { value: 'possession', label: 'Possession' },
  { value: 'custom', label: 'Custom' },
];

// ============================================================================
// ENHANCED TEMPLATE WIZARD COMPONENT WITH PROJECT SELECTION
// ============================================================================

const TemplateWizard = ({ open, onClose, template = null, preSelectedProject, onSave, allProjects }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(preSelectedProject || '');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectValidation, setProjectValidation] = useState({ isValid: true, issues: [] });
  const [projectUpdateData, setProjectUpdateData] = useState({});
  const [updatingProject, setUpdatingProject] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planType: 'construction_linked',
    installments: [
      { 
        installmentNumber: 1, 
        description: 'Booking Amount', 
        percentage: 10, 
        dueAfterDays: 0, 
        milestoneType: 'booking',
        isOptional: false
      }
    ],
    gracePeriodDays: 7,
    lateFeeRate: 0,
    isActive: true
  });
  const [errors, setErrors] = useState({});

  const steps = [
    'Select Project',        // NEW: Step 0
    'Basic Information',     // Step 1
    'Payment Schedule',      // Step 2 
    'Terms & Conditions',    // Step 3
    'Preview & Save'         // Step 4
  ];

  // Load selected project details when project changes
  useEffect(() => {
    if (selectedProjectId && allProjects) {
      const project = allProjects.find(p => p._id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        const validation = validateProjectForTemplates(project);
        setProjectValidation(validation);
        
        // Initialize project update data with current values
        setProjectUpdateData({
          priceRange: {
            min: project.priceRange?.min || '',
            max: project.priceRange?.max || ''
          },
          location: {
            ...project.location,
            area: project.location?.area || ''
          }
        });
      }
    }
  }, [selectedProjectId, allProjects]);

  // Initialize form data when template prop changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        planType: template.planType || 'construction_linked',
        installments: template.installments?.map((inst, index) => ({
          installmentNumber: inst.installmentNumber || index + 1,
          description: inst.description || '',
          percentage: inst.percentage || 0,
          dueAfterDays: inst.dueAfterDays || 0,
          milestoneType: inst.milestoneType || 'time_based',
          isOptional: inst.isOptional || false
        })) || [{ 
          installmentNumber: 1, 
          description: 'Booking Amount', 
          percentage: 10, 
          dueAfterDays: 0, 
          milestoneType: 'booking',
          isOptional: false
        }],
        gracePeriodDays: template.gracePeriodDays || 7,
        lateFeeRate: template.lateFeeRate || 0,
        isActive: template.isActive !== undefined ? template.isActive : true
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        planType: 'construction_linked',
        installments: [{ 
          installmentNumber: 1, 
          description: 'Booking Amount', 
          percentage: 10, 
          dueAfterDays: 0, 
          milestoneType: 'booking',
          isOptional: false
        }],
        gracePeriodDays: 7,
        lateFeeRate: 0,
        isActive: true
      });
    }
    setActiveStep(0);
    setErrors({});
  }, [template, open]);

  // Reset project selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProjectId(preSelectedProject || '');
      setActiveStep(0);
    }
  }, [open, preSelectedProject]);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Project Selection
        if (!selectedProjectId) {
          newErrors.project = 'Please select a project';
        } else if (!projectValidation.isValid) {
          newErrors.project = 'Project validation issues must be resolved';
        }
        break;
        
      case 1: // Basic Information
        if (!formData.name.trim()) newErrors.name = 'Template name is required';
        if (!formData.planType) newErrors.planType = 'Plan type is required';
        break;
        
      case 2: // Payment Schedule
        const totalPercentage = formData.installments.reduce((sum, inst) => sum + (inst.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          newErrors.installments = `Total percentage is ${totalPercentage.toFixed(1)}%. Must equal 100%`;
        }
        formData.installments.forEach((inst, index) => {
          if (!inst.description?.trim()) {
            newErrors[`installment_${index}_description`] = 'Description required';
          }
          if ((inst.percentage || 0) <= 0) {
            newErrors[`installment_${index}_percentage`] = 'Percentage must be greater than 0';
          }
        });
        break;
        
      case 3: // Terms & Conditions
        if ((formData.gracePeriodDays || 0) < 0) {
          newErrors.gracePeriodDays = 'Grace period cannot be negative';
        }
        if ((formData.lateFeeRate || 0) < 0) {
          newErrors.lateFeeRate = 'Late fee rate cannot be negative';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    
    setUpdatingProject(true);
    try {
      const updatePayload = {
        priceRange: {
          min: parseFloat(projectUpdateData.priceRange.min) || 0,
          max: parseFloat(projectUpdateData.priceRange.max) || 0
        },
        location: {
          ...selectedProject.location,
          area: projectUpdateData.location.area.trim()
        }
      };

      await projectAPI.updateProject(selectedProject._id, updatePayload);

      // Update local project data
      const updatedProject = { ...selectedProject, ...updatePayload };
      setSelectedProject(updatedProject);
      
      // Re-validate
      const validation = validateProjectForTemplates(updatedProject);
      setProjectValidation(validation);
      
      if (validation.isValid) {
        setErrors({});
      }
      
    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ project: error.response?.data?.message || 'Failed to update project' });
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleSave = async () => {
    if (!validateStep(3)) return; // Validate the entire form
    
    setLoading(true);
    try {
      const templateData = {
        ...formData,
        totalPercentage: 100 // Ensure total is always 100%
      };

      let response;
      if (template) {
        response = await projectPaymentAPI.updatePaymentPlanTemplate(selectedProjectId, template._id, templateData);
      } else {
        response = await projectPaymentAPI.createPaymentPlanTemplate(selectedProjectId, templateData);
      }
      
      console.log('Template saved successfully:', response.data);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ general: error.response?.data?.message || 'Failed to save template' });
    } finally {
      setLoading(false);
    }
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          installmentNumber: prev.installments.length + 1,
          description: '',
          percentage: 0,
          dueAfterDays: 0,
          milestoneType: 'time_based',
          isOptional: false
        }
      ]
    }));
  };

  const removeInstallment = (index) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, installmentNumber: i + 1 }))
    }));
  };

  const updateInstallment = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.map((inst, i) => 
        i === index ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Project Selection & Validation
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Select Project for Payment Template</Typography>
            
            <FormControl fullWidth error={!!errors.project}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Select Project"
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {allProjects?.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessCenter fontSize="small" />
                      <span>{project.name}</span>
                      <Chip 
                        label={project.type} 
                        size="small" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
            </FormControl>

            {selectedProject && (
              <>
                {/* Project Validation Status */}
                <Card variant="outlined" sx={{ 
                  borderColor: projectValidation.isValid ? 'success.main' : 'error.main',
                  borderWidth: 2 
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {projectValidation.isValid ? (
                        <CheckCircle color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                      <Typography variant="h6">
                        Project Validation {projectValidation.isValid ? 'Passed' : 'Failed'}
                      </Typography>
                    </Box>

                    {!projectValidation.isValid && (
                      <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          This project is missing required information for payment plan templates. 
                          Please complete the missing details below:
                        </Alert>

                        <Grid container spacing={2}>
                          {projectValidation.issues.some(issue => issue.field.includes('priceRange')) && (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" color="error">
                                  Price Range Issues:
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Minimum Price"
                                  type="number"
                                  value={projectUpdateData.priceRange?.min || ''}
                                  onChange={(e) => setProjectUpdateData(prev => ({
                                    ...prev,
                                    priceRange: { ...prev.priceRange, min: e.target.value }
                                  }))}
                                  error={projectValidation.issues.some(issue => issue.field === 'priceRange.min')}
                                  helperText="₹ (e.g., 1000000 for ₹10 Lakh)"
                                  InputProps={{ startAdornment: '₹' }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Maximum Price"
                                  type="number"
                                  value={projectUpdateData.priceRange?.max || ''}
                                  onChange={(e) => setProjectUpdateData(prev => ({
                                    ...prev,
                                    priceRange: { ...prev.priceRange, max: e.target.value }
                                  }))}
                                  error={projectValidation.issues.some(issue => issue.field === 'priceRange.max')}
                                  helperText="₹ (e.g., 5000000 for ₹50 Lakh)"
                                  InputProps={{ startAdornment: '₹' }}
                                />
                              </Grid>
                            </>
                          )}

                          {projectValidation.issues.some(issue => issue.field === 'location.area') && (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" color="error">
                                  Location Issues:
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label="Project Area"
                                  value={projectUpdateData.location?.area || ''}
                                  onChange={(e) => setProjectUpdateData(prev => ({
                                    ...prev,
                                    location: { ...prev.location, area: e.target.value }
                                  }))}
                                  error={projectValidation.issues.some(issue => issue.field === 'location.area')}
                                  helperText="e.g., Electronic City, Whitefield, etc."
                                  InputProps={{ startAdornment: <LocationOn /> }}
                                />
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              onClick={handleUpdateProject}
                              disabled={updatingProject}
                              startIcon={updatingProject ? <CircularProgress size={20} /> : <Save />}
                              color="primary"
                            >
                              {updatingProject ? 'Updating Project...' : 'Update Project'}
                            </Button>
                          </Grid>
                        </Grid>
                      </>
                    )}

                    {projectValidation.isValid && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircle color="success" />
                        <Typography color="success.main">
                          Project is ready for payment plan templates
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Project Summary */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Selected Project Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Project Name</Typography>
                        <Typography variant="body1">{selectedProject.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Type</Typography>
                        <Chip label={selectedProject.type} size="small" />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Location</Typography>
                        <Typography variant="body1">
                          {selectedProject.location?.area || 'Not specified'}, {selectedProject.location?.city || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Price Range</Typography>
                        <Typography variant="body1">
                          {selectedProject.priceRange?.min && selectedProject.priceRange?.max 
                            ? `${formatCurrency(selectedProject.priceRange.min)} - ${formatCurrency(selectedProject.priceRange.max)}`
                            : 'Not specified'
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}
          </Stack>
        );

      case 1: // Basic Information
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g., Standard Construction Linked Plan"
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when and how payments are due..."
            />
            
            <FormControl fullWidth error={!!errors.planType}>
              <InputLabel>Plan Type</InputLabel>
              <Select
                value={formData.planType}
                label="Plan Type"
                onChange={(e) => setFormData(prev => ({ ...prev, planType: e.target.value }))}
              >
                {PLAN_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );

      case 2: // Payment Schedule
        const totalPercentage = formData.installments.reduce((sum, inst) => sum + (inst.percentage || 0), 0);
        
        return (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Payment Schedule</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`Total: ${formatPercentage(totalPercentage)}`}
                  color={Math.abs(totalPercentage - 100) < 0.01 ? 'success' : 'error'}
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addInstallment}
                  size="small"
                >
                  Add Installment
                </Button>
              </Box>
            </Box>
            
            {errors.installments && (
              <Alert severity="error">{errors.installments}</Alert>
            )}
            
            <Stack spacing={2}>
              {formData.installments.map((installment, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={1}>
                        <Typography variant="h6" color="primary">
                          #{installment.installmentNumber}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Description"
                          value={installment.description}
                          onChange={(e) => updateInstallment(index, 'description', e.target.value)}
                          error={!!errors[`installment_${index}_description`]}
                          helperText={errors[`installment_${index}_description`]}
                        />
                      </Grid>
                      
                      <Grid item xs={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Percentage"
                          type="number"
                          value={installment.percentage}
                          onChange={(e) => updateInstallment(index, 'percentage', parseFloat(e.target.value) || 0)}
                          error={!!errors[`installment_${index}_percentage`]}
                          helperText={errors[`installment_${index}_percentage`]}
                          InputProps={{ endAdornment: '%' }}
                        />
                      </Grid>
                      
                      <Grid item xs={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Due After (Days)"
                          type="number"
                          value={installment.dueAfterDays}
                          onChange={(e) => updateInstallment(index, 'dueAfterDays', parseInt(e.target.value) || 0)}
                        />
                      </Grid>
                      
                      <Grid item xs={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Milestone</InputLabel>
                          <Select
                            value={installment.milestoneType}
                            label="Milestone"
                            onChange={(e) => updateInstallment(index, 'milestoneType', e.target.value)}
                          >
                            {MILESTONE_TYPES.map(type => (
                              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeInstallment(index)}
                          disabled={formData.installments.length === 1}
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Stack>
        );

      case 3: // Terms & Conditions
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Grace Period (Days)"
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                error={!!errors.gracePeriodDays}
                helperText={errors.gracePeriodDays || 'Additional days allowed before late fee applies'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Late Fee Rate (% per month)"
                type="number"
                inputProps={{ step: 0.1 }}
                value={formData.lateFeeRate}
                onChange={(e) => setFormData(prev => ({ ...prev, lateFeeRate: parseFloat(e.target.value) || 0 }))}
                error={!!errors.lateFeeRate}
                helperText={errors.lateFeeRate || 'Monthly late fee percentage'}
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Typography sx={{ ml: 1 }}>Activate template immediately</Typography>
                </Box>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 4: // Preview & Save
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Template Preview</Typography>
            
            {/* Selected Project Info */}
            <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Target Project: {selectedProject?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedProject?.location?.area}, {selectedProject?.location?.city} • {selectedProject?.type}
                </Typography>
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Template Name</Typography>
                    <Typography variant="h6">{formData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Plan Type</Typography>
                    <Chip label={PLAN_TYPES.find(t => t.value === formData.planType)?.label} color="primary" variant="outlined" />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Description</Typography>
                    <Typography>{formData.description || 'No description provided'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Milestone</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Due After</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.installments.map((installment, index) => (
                    <TableRow key={index}>
                      <TableCell>{installment.installmentNumber}</TableCell>
                      <TableCell>{installment.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={MILESTONE_TYPES.find(t => t.value === installment.milestoneType)?.label || installment.milestoneType} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{formatPercentage(installment.percentage)}</TableCell>
                      <TableCell align="right">{installment.dueAfterDays} days</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>100%</strong></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip label={`Grace Period: ${formData.gracePeriodDays} days`} variant="outlined" />
              <Chip label={`Late Fee: ${formatPercentage(formData.lateFeeRate)} per month`} variant="outlined" />
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return selectedProjectId && projectValidation.isValid;
      default: return true;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {template ? 'Edit Payment Template' : 'Create Payment Template'}
          </Typography>
          <IconButton onClick={onClose}>
            <Clear />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !canProceed()}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canProceed()}
            endIcon={<ArrowForward />}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// TEMPLATE PREVIEW DIALOG
// ============================================================================

const TemplatePreviewDialog = ({ open, onClose, template }) => {
  const [sampleAmount, setSampleAmount] = useState(5000000);

  const calculateSampleAmounts = useMemo(() => {
    if (!template || !sampleAmount || !template.installments) return [];
    
    return template.installments.map((installment, index) => ({
      ...installment,
      amount: (sampleAmount * (installment.percentage || 0)) / 100,
      dueDate: new Date(Date.now() + (installment.dueAfterDays || 0) * 24 * 60 * 60 * 1000)
    }));
  }, [template, sampleAmount]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Template Preview: {template?.name}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <TextField
            label="Sample Unit Price"
            type="number"
            value={sampleAmount}
            onChange={(e) => setSampleAmount(parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: '₹',
            }}
            helperText="Enter a sample unit price to see payment breakdown"
            sx={{ maxWidth: 300 }}
          />
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Installment</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {calculateSampleAmounts.map((installment, index) => (
                  <TableRow key={index}>
                    <TableCell>#{installment.installmentNumber}</TableCell>
                    <TableCell>{installment.description}</TableCell>
                    <TableCell>{formatDate(installment.dueDate)}</TableCell>
                    <TableCell align="right">{formatPercentage(installment.percentage)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                      {formatCurrency(installment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'primary.50' }}>
                  <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>100%</strong></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    <strong>{formatCurrency(sampleAmount)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {template && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Template Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Plan Type</Typography>
                    <Typography>{PLAN_TYPES.find(t => t.value === template.planType)?.label || template.planType}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Total Installments</Typography>
                    <Typography>{template.installments?.length || 0}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Grace Period</Typography>
                    <Typography>{template.gracePeriodDays || 0} days</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Late Fee Rate</Typography>
                    <Typography>{formatPercentage(template.lateFeeRate)} per month</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// ENHANCED TEMPLATE CARD COMPONENT WITH BETTER ERROR HANDLING
// ============================================================================

const TemplateCard = ({ template, onEdit, onDelete, onPreview }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Validate template data
  if (!template || typeof template !== 'object') {
    console.error('❌ Invalid template passed to TemplateCard:', template);
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ textAlign: 'center', color: 'error.main' }}>
          <Typography>Invalid template data</Typography>
        </CardContent>
      </Card>
    );
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    switch (action) {
      case 'preview':
        onPreview(template);
        break;
      case 'edit':
        onEdit(template);
        break;
      case 'delete':
        onDelete(template._id);
        break;
      default:
        break;
    }
  };

  // Safely access template properties with fallbacks
  const templateName = template.name || 'Unnamed Template';
  const templateDescription = template.description || 'No description provided';
  const planTypeLabel = PLAN_TYPES.find(t => t.value === template.planType)?.label || template.planType || 'Unknown';
  const installmentsCount = template.installments?.length || 0;
  const gracePeriodDays = template.gracePeriodDays || 0;
  const lateFeeRate = template.lateFeeRate || 0;
  const usageCount = template.usageCount || 0;
  const isActive = template.isActive !== undefined ? template.isActive : true;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AccountBalance />
          </Avatar>
        }
        title={
          <Typography variant="h6" component="div" noWrap title={templateName}>
            {templateName}
          </Typography>
        }
        subheader={
          <Chip 
            label={planTypeLabel}
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        }
        action={
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        }
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="textSecondary" paragraph>
          {templateDescription}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${installmentsCount} installments`} 
            size="small" 
            variant="outlined"
          />
          <Chip 
            label={`${gracePeriodDays} days grace`} 
            size="small" 
            variant="outlined"
          />
          {lateFeeRate > 0 && (
            <Chip 
              label={`${formatPercentage(lateFeeRate)} late fee`} 
              size="small" 
              variant="outlined"
              color="warning"
            />
          )}
        </Stack>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Key Installments:
        </Typography>
        {template.installments?.slice(0, 3).map((installment, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>
              {installment.description || `Installment ${index + 1}`}
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {formatPercentage(installment.percentage || 0)}
            </Typography>
          </Box>
        ))}
        {installmentsCount > 3 && (
          <Typography variant="caption" color="textSecondary">
            +{installmentsCount - 3} more installments
          </Typography>
        )}
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" color="textSecondary">
            Used {usageCount} times
          </Typography>
          <br />
          <Chip 
            label={isActive ? 'Active' : 'Inactive'} 
            size="small"
            color={isActive ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
        <Button 
          size="small" 
          startIcon={<Visibility />}
          onClick={() => onPreview(template)}
        >
          Preview
        </Button>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleAction('preview')}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Deactivate</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

// ============================================================================
// MAIN PAYMENT PLAN MANAGEMENT COMPONENT WITH FIXED DATA ACCESS
// ============================================================================

const PaymentPlanManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || '');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [, setPaymentStats] = useState({});
  const [error, setError] = useState(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Dialog states
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('🔄 Fetching projects...');
        const response = await projectAPI.getProjects();
        const projectsData = extractApiData(response, 'data');
        
        console.log('📊 Projects loaded:', {
          count: projectsData.length,
          projects: projectsData.map(p => ({ id: p._id, name: p.name, hasTemplates: p.activePaymentTemplates?.length > 0 }))
        });
        
        setProjects(projectsData);
        
        // Set first project as default if none selected
        if (!selectedProject && projectsData.length > 0) {
          setSelectedProject(projectsData[0]._id);
        }
      } catch (error) {
        console.error('❌ Error fetching projects:', error);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedProject]);

  // FIXED: Enhanced fetch templates function with proper data access
  const fetchTemplates = useCallback(async () => {
    if (!selectedProject) {
      console.log('⚠️ No project selected, skipping template fetch');
      return;
    }
    
    setTemplatesLoading(true);
    try {
      const params = {};
      if (filterActive !== 'all') {
        params.active = filterActive === 'active' ? 'true' : 'false';
      }

      console.log('🔄 Fetching templates for project:', selectedProject, 'with params:', params);
      
      const response = await projectPaymentAPI.getPaymentPlanTemplates(selectedProject, params);
      
      // FIXED: Use enhanced data extraction utility
      const templatesData = extractApiData(response, 'data');
      
      console.log('📊 Templates loaded:', {
        count: templatesData.length,
        templates: templatesData.map(t => ({
          id: t._id,
          name: t.name,
          planType: t.planType,
          installments: t.installments?.length,
          isActive: t.isActive
        }))
      });
      
      setTemplates(templatesData);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError(`Failed to load payment templates: ${error.response?.data?.message || error.message}`);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [selectedProject, filterActive]);

  // FIXED: Enhanced fetch payment statistics
  const fetchPaymentStats = useCallback(async () => {
    try {
      console.log('🔄 Fetching payment statistics...');
      const response = await paymentAPI.getPaymentStatistics();
      const statsData = extractApiData(response, 'data');
      
      console.log('📊 Payment stats loaded:', statsData);
      setPaymentStats(statsData);
    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      setPaymentStats({});
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchPaymentStats();
  }, [fetchTemplates, fetchPaymentStats]);

  // Update URL params when project changes
  useEffect(() => {
    if (selectedProject) {
      setSearchParams({ project: selectedProject });
    }
  }, [selectedProject, setSearchParams]);

  // ENHANCED: Filtered templates with better logging
  const filteredTemplates = useMemo(() => {
    console.log('🔍 Filtering templates:', {
      totalTemplates: templates.length,
      searchQuery,
      filterType,
      templates: templates.map(t => ({ name: t.name, planType: t.planType, isActive: t.isActive }))
    });
    
    const filtered = templates.filter(template => {
      // Ensure template has required properties
      if (!template || typeof template !== 'object') {
        console.warn('⚠️ Invalid template object:', template);
        return false;
      }
      
      const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || template.planType === filterType;
      
      const shouldInclude = matchesSearch && matchesType;
      
      if (!shouldInclude) {
        console.log('🚫 Template filtered out:', {
          name: template.name,
          matchesSearch,
          matchesType,
          searchQuery,
          filterType
        });
      }
      
      return shouldInclude;
    });
    
    console.log('✅ Filtered templates result:', {
      original: templates.length,
      filtered: filtered.length,
      filteredNames: filtered.map(t => t.name)
    });
    
    return filtered;
  }, [templates, searchQuery, filterType]);

  // Calculate analytics
  const analyticsData = useMemo(() => calculateTemplateStats(templates), [templates]);

  // Handle actions
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setWizardOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setWizardOpen(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to deactivate this template?')) return;
    
    try {
      await projectPaymentAPI.deletePaymentPlanTemplate(selectedProject, templateId);
      setSnackbar({ open: true, message: 'Template deactivated successfully', severity: 'success' });
      fetchTemplates();
    } catch (error) {
      console.error('Error deactivating template:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to deactivate template', 
        severity: 'error' 
      });
    }
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleWizardSave = () => {
    fetchTemplates();
    setSnackbar({ 
      open: true, 
      message: selectedTemplate ? 'Template updated successfully' : 'Template created successfully', 
      severity: 'success' 
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterActive('all');
  };

  // ENHANCED: Templates grid rendering with better error handling
  const renderTemplatesGrid = () => {
    console.log('🎨 Rendering templates grid:', {
      filteredCount: filteredTemplates.length,
      totalCount: templates.length,
      loading: templatesLoading
    });
    
    if (filteredTemplates.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <AccountBalance sx={{ fontSize: 40, color: 'grey.500' }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              No templates found
            </Typography>
            
            <Typography variant="body1" color="textSecondary" paragraph>
              {templates.length === 0 
                ? "Create your first payment template to get started"
                : `No templates match your current filters (${filteredTemplates.length}/${templates.length} shown)`
              }
            </Typography>
            
            {/* Debug information for development */}
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold">Debug Info:</Typography>
                <Typography variant="caption" display="block">Total templates: {templates.length}</Typography>
                <Typography variant="caption" display="block">Filtered templates: {filteredTemplates.length}</Typography>
                <Typography variant="caption" display="block">Search query: "{searchQuery}"</Typography>
                <Typography variant="caption" display="block">Filter type: {filterType}</Typography>
                <Typography variant="caption" display="block">Filter active: {filterActive}</Typography>
                <Typography variant="caption" display="block">Selected project: {selectedProject}</Typography>
                {templates.length > 0 && (
                  <Typography variant="caption" display="block">
                    Sample template: {JSON.stringify({
                      name: templates[0]?.name,
                      planType: templates[0]?.planType,
                      isActive: templates[0]?.isActive
                    }, null, 2)}
                  </Typography>
                )}
              </Box>
            )}
            
            {templates.length === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateTemplate}
                size="large"
              >
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredTemplates.map((template) => {
          // Validate template before rendering
          if (!template || !template._id) {
            console.warn('⚠️ Skipping invalid template:', template);
            return null;
          }
          
          return (
            <Grid item xs={12} md={6} lg={4} key={template._id}>
              <TemplateCard
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onPreview={handlePreviewTemplate}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Payment Plan Templates
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage payment schedules and installment plans for your projects
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled={templates.length === 0}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchTemplates}
            disabled={templatesLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateTemplate}
          >
            Create Template
          </Button>
        </Stack>
      </Box>

      {/* Project Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={selectedProject}
                  label="Select Project"
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessCenter fontSize="small" />
                        <span>{project.name}</span>
                        <Chip 
                          label={project.type} 
                          size="small" 
                          variant="outlined" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="textSecondary">
                Payment templates are project-specific. Select a project to view and manage its payment templates.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {/* Analytics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Templates
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold">
                        {analyticsData.total}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <Receipt />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Active Templates
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                        {analyticsData.active}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                      <CheckCircle />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Usage
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                        {analyticsData.totalUsage}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                      <TrendingUp />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Most Popular
                      </Typography>
                      <Typography variant="body1" component="div" fontWeight="medium" noWrap>
                        {analyticsData.mostPopular?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {analyticsData.mostPopular?.usageCount || 0} uses
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                      <Assessment />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters and Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Plan Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Plan Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {PLAN_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterActive}
                      label="Status"
                      onChange={(e) => setFilterActive(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active Only</MenuItem>
                      <MenuItem value="inactive">Inactive Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Clear />}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FilterList />}
                    onClick={fetchTemplates}
                    disabled={templatesLoading}
                  >
                    {templatesLoading ? 'Loading...' : 'Apply Filters'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Progress indicator for loading templates */}
          {templatesLoading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Templates Grid */}
          {renderTemplatesGrid()}
        </>
      )}

      {/* Enhanced Template Wizard Dialog */}
      <TemplateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        template={selectedTemplate}
        preSelectedProject={selectedProject}
        onSave={handleWizardSave}
        allProjects={projects}
      />

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template={previewTemplate}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentPlanManagementPage;
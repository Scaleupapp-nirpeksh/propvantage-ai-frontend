// File: src/pages/projects/EditProjectPage.js
// Description: Production-grade project editing form with comprehensive validation and delete functionality
// Version: 1.0 - Complete project editing with all backend integration
// Location: src/pages/projects/EditProjectPage.js

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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Breadcrumbs,
  Link,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  Business,
  LocationOn,
  Description,
  AttachMoney,
  Warning,
  Info,
  ExpandMore,
  NavigateNext,
  Cancel,
  Edit,
  Apartment,
  Villa,
  Domain,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI } from '../../services/api';

// Project type configurations
const PROJECT_TYPES = [
  { value: 'apartment', label: 'Apartment Complex', icon: Apartment },
  { value: 'villa', label: 'Villa Project', icon: Villa },
  { value: 'township', label: 'Township', icon: Domain },
  { value: 'plot', label: 'Plot Development', icon: Business },
  { value: 'commercial', label: 'Commercial', icon: Business },
  { value: 'mixed', label: 'Mixed Development', icon: Domain },
];

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'info' },
  { value: 'ongoing', label: 'Ongoing', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'on-hold', label: 'On Hold', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

// Utility function to extract ID safely
const extractId = (value, context = 'unknown') => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id;
  return String(value);
};

// Breadcrumb Navigation Component
const EditProjectBreadcrumbs = ({ project }) => {
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
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Edit fontSize="small" />
        Edit Project
      </Typography>
    </Breadcrumbs>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, project, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = project?.name || '';

  const isConfirmValid = confirmText === expectedText;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning />
        Delete Project
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This action cannot be undone. This will permanently delete the project
          <strong> "{project?.name}"</strong> and all associated data including:
        </DialogContentText>
        
        <Box sx={{ ml: 2, mb: 2 }}>
          <Typography variant="body2" component="li">All towers and units</Typography>
          <Typography variant="body2" component="li">All leads and sales data</Typography>
          <Typography variant="body2" component="li">All financial records</Typography>
          <Typography variant="body2" component="li">All documents and media</Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            This action is irreversible!
          </Typography>
          <Typography variant="body2">
            Please type <strong>{expectedText}</strong> below to confirm deletion.
          </Typography>
        </Alert>

        <TextField
          fullWidth
          label="Confirm project name"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={expectedText}
          error={confirmText !== '' && !isConfirmValid}
          helperText={confirmText !== '' && !isConfirmValid ? "Project name doesn't match" : ''}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={!isConfirmValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? 'Deleting...' : 'Delete Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Edit Project Page Component
const EditProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();

  // Validate project ID
  const validProjectId = extractId(projectId);

  // State management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    status: 'planning',
    location: {
      address: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    financials: {
      targetRevenue: '',
      totalInvestment: '',
      expectedROI: '',
    },
    timeline: {
      startDate: '',
      expectedCompletion: '',
      actualCompletion: '',
    },
    specifications: {
      totalArea: '',
      constructedArea: '',
      openArea: '',
      amenities: [],
    },
    approvals: {
      reraNumber: '',
      environmentalClearance: false,
      fireNOC: false,
      occupancyCertificate: false,
    },
  });

  // Fetch project data on component mount
  useEffect(() => {
    if (validProjectId) {
      fetchProject();
    }
  }, [validProjectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await projectAPI.getProject(validProjectId);
      const projectData = response.data.data || response.data;

      setProject(projectData);
      
      // Populate form with existing data
      setFormData({
        name: projectData.name || '',
        type: projectData.type || '',
        description: projectData.description || '',
        status: projectData.status || 'planning',
        location: {
          address: projectData.location?.address || '',
          area: projectData.location?.area || '',
          city: projectData.location?.city || '',
          state: projectData.location?.state || '',
          pincode: projectData.location?.pincode || '',
          country: projectData.location?.country || 'India',
        },
        financials: {
          targetRevenue: projectData.targetRevenue || '',
          totalInvestment: projectData.totalInvestment || '',
          expectedROI: projectData.expectedROI || '',
        },
        timeline: {
          startDate: projectData.startDate ? projectData.startDate.split('T')[0] : '',
          expectedCompletion: projectData.expectedCompletion ? projectData.expectedCompletion.split('T')[0] : '',
          actualCompletion: projectData.actualCompletion ? projectData.actualCompletion.split('T')[0] : '',
        },
        specifications: {
          totalArea: projectData.totalArea || '',
          constructedArea: projectData.constructedArea || '',
          openArea: projectData.openArea || '',
          amenities: projectData.amenities || [],
        },
        approvals: {
          reraNumber: projectData.reraNumber || '',
          environmentalClearance: projectData.environmentalClearance || false,
          fireNOC: projectData.fireNOC || false,
          occupancyCertificate: projectData.occupancyCertificate || false,
        },
      });

    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (field, value) => {
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
  };

  // Form validation
  const validateForm = () => {
    const requiredFields = ['name', 'type'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        return false;
      }
    }

    if (formData.location.pincode && !/^\d{6}$/.test(formData.location.pincode)) {
      setError('PIN code must be 6 digits');
      return false;
    }

    return true;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('🚀 Updating project with data:', formData);

      const response = await projectAPI.updateProject(validProjectId, formData);
      
      console.log('✅ Project updated successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate back to project detail page after success
      setTimeout(() => {
        navigate(`/projects/${validProjectId}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Project update failed:', error);
      setError(error.response?.data?.message || 'Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      console.log('🗑️ Deleting project:', validProjectId);

      await projectAPI.deleteProject(validProjectId);
      
      console.log('✅ Project deleted successfully');
      
      // Navigate back to projects list
      navigate('/projects');

    } catch (error) {
      console.error('❌ Project deletion failed:', error);
      setError(error.response?.data?.message || 'Failed to delete project. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Validation before render
  if (!validProjectId) {
    return (
      <Alert severity="error">
        Invalid project ID in URL. Please check the URL and try again.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error && !project) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchProject}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert severity="warning">
        Project not found
      </Alert>
    );
  }

  const selectedProjectType = PROJECT_TYPES.find(type => type.value === formData.type);
  const selectedStatus = PROJECT_STATUSES.find(status => status.value === formData.status);

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <EditProjectBreadcrumbs project={project} />

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/projects/${validProjectId}`)}
              sx={{ mb: 1 }}
            >
              Back to Project
            </Button>
          </Box>
          
          {canAccess.projectManagement() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={saving || deleting}
            >
              Delete Project
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            {selectedProjectType ? <selectedProjectType.icon sx={{ fontSize: 28 }} /> : <Business sx={{ fontSize: 28 }} />}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit Project
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="text.secondary">
                {project.name}
              </Typography>
              {selectedStatus && (
                <Chip 
                  label={selectedStatus.label} 
                  color={selectedStatus.color} 
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Project Updated Successfully! 🎉
          </Typography>
          <Typography>
            All changes have been saved. Redirecting to project details...
          </Typography>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                Basic Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    error={!formData.name}
                    helperText={!formData.name ? 'Project name is required' : ''}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Project Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      label="Project Type"
                    >
                      {PROJECT_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <type.icon fontSize="small" />
                            {type.label}
                          </Box>
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
                      {PROJECT_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Chip 
                            label={status.label} 
                            color={status.color} 
                            size="small" 
                            sx={{ minWidth: 80 }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Enter project description..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="primary" />
                Location Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    placeholder="Complete address"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Area/Locality"
                    value={formData.location.area}
                    onChange={(e) => handleInputChange('location.area', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location.city', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.location.state}
                    onChange={(e) => handleInputChange('location.state', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    value={formData.location.pincode}
                    onChange={(e) => handleInputChange('location.pincode', e.target.value)}
                    inputProps={{ pattern: '[0-9]{6}', maxLength: 6 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.location.country}
                    onChange={(e) => handleInputChange('location.country', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Financial Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                Financial Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Target Revenue"
                    type="number"
                    value={formData.financials.targetRevenue}
                    onChange={(e) => handleInputChange('financials.targetRevenue', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Total Investment"
                    type="number"
                    value={formData.financials.totalInvestment}
                    onChange={(e) => handleInputChange('financials.totalInvestment', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Expected ROI"
                    type="number"
                    value={formData.financials.expectedROI}
                    onChange={(e) => handleInputChange('financials.expectedROI', e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Timeline Information */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                Timeline
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={formData.timeline.startDate}
                    onChange={(e) => handleInputChange('timeline.startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Expected Completion"
                    type="date"
                    value={formData.timeline.expectedCompletion}
                    onChange={(e) => handleInputChange('timeline.expectedCompletion', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Actual Completion"
                    type="date"
                    value={formData.timeline.actualCompletion}
                    onChange={(e) => handleInputChange('timeline.actualCompletion', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Action Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Actions
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={saving || success}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  fullWidth
                >
                  {saving ? 'Updating...' : 'Update Project'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/projects/${validProjectId}`)}
                  disabled={saving}
                  startIcon={<Cancel />}
                  fullWidth
                >
                  Cancel Changes
                </Button>

                <Divider sx={{ my: 2 }} />
                
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Tips:
                  </Typography>
                  <Typography variant="body2">
                    • All required fields must be filled
                    • Changes are saved immediately
                    • Timeline dates help track progress
                  </Typography>
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        project={project}
        loading={deleting}
      />
    </Box>
  );
};

export default EditProjectPage;
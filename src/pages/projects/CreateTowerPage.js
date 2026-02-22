// File: src/pages/projects/CreateTowerPage.js
// Description: Professional tower creation form with complete backend integration
// Version: 1.0 - Production-grade tower creation with all backend fields
// Location: src/pages/projects/CreateTowerPage.js

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
  Chip,
  Stack,
  Breadcrumbs,
  Link,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Domain,
  NavigateNext,
  Save,
  Delete,
  ExpandMore,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI } from '../../services/api';

// Tower types and configurations
const TOWER_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'parking', label: 'Parking' },
];

const UNIT_TYPES = [
  '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '5 BHK',
  'Studio', 'Penthouse', 'Duplex', 'Shop', 'Office'
];

const COMMON_AMENITIES = [
  'Elevator', 'Power Backup', 'Water Supply', 'Security',
  'CCTV Surveillance', 'Fire Safety', 'Parking', 'Waste Management',
  'Intercom', 'Garden Area', 'Common Toilet', 'Staircase'
];

// Breadcrumb Navigation Component
const CreateTowerBreadcrumbs = ({ project }) => {
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
        <Domain fontSize="small" />
        Create Tower
      </Typography>
    </Breadcrumbs>
  );
};

// Main Create Tower Page Component
const CreateTowerPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  useAuth();

  // State management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    project: projectId,
    towerName: '',
    towerCode: '',
    towerType: 'residential',
    totalFloors: '',
    unitsPerFloor: '',
    description: '',
    
    // Configuration
    configuration: {},
    
    // Amenities
    amenities: [],
    
    // Pricing Configuration
    pricingConfiguration: {
      basePrice: '',
      floorRiseCharge: '',
      plcCharges: {
        parkFacing: '',
        roadFacing: '',
        cornerUnit: '',
      },
    },
    
    // Construction Details
    construction: {
      startDate: '',
      expectedCompletion: '',
      constructionStatus: 'not_started',
    },
    
    // Additional metadata
    metadata: {
      architect: '',
      contractor: '',
      approvals: [],
    },
  });

  // Fetch project data
  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setProjectLoading(true);
      const response = await projectAPI.getProject(projectId);
      const projectData = response.data.data || response.data;
      setProject(projectData);
      
      // Auto-generate tower code based on existing towers
      const towersResponse = await towerAPI.getTowers({ project: projectId });
      const existingTowers = towersResponse.data.data || [];
      const nextTowerNumber = existingTowers.length + 1;
      
      setFormData(prev => ({
        ...prev,
        towerCode: `T${nextTowerNumber}`,
        towerName: `Tower ${nextTowerNumber}`,
      }));
      
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project details');
    } finally {
      setProjectLoading(false);
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

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleConfigurationChange = (unitType, count) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [unitType]: parseInt(count) || 0,
      }
    }));
  };

  const removeConfigurationItem = (unitType) => {
    setFormData(prev => {
      const newConfig = { ...prev.configuration };
      delete newConfig[unitType];
      return {
        ...prev,
        configuration: newConfig,
      };
    });
  };

  // Form validation
  const validateForm = () => {
    const requiredFields = ['towerName', 'towerCode', 'totalFloors', 'unitsPerFloor'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (formData.totalFloors < 1 || formData.totalFloors > 100) {
      setError('Total floors must be between 1 and 100');
      return false;
    }

    if (formData.unitsPerFloor < 1 || formData.unitsPerFloor > 20) {
      setError('Units per floor must be between 1 and 20');
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
      setLoading(true);
      setError(null);

      console.log('🚀 Creating tower with data:', formData);

      const response = await towerAPI.createTower(formData);
      
      console.log('✅ Tower created successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate to project detail page after success
      setTimeout(() => {
        navigate(`/projects/${projectId}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Tower creation failed:', error);
      setError(error.response?.data?.message || 'Failed to create tower. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <CreateTowerBreadcrumbs project={project} />

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/projects/${projectId}`)}
              sx={{ mb: 2 }}
            >
              Back to Project
            </Button>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Create New Tower
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add a new tower to {project.name}
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tower Created Successfully! 🎉
            </Typography>
            <Typography>
              Tower "{formData.towerName}" has been created. Redirecting to project details...
            </Typography>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Basic Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tower Name *"
                      value={formData.towerName}
                      onChange={(e) => handleInputChange('towerName', e.target.value)}
                      placeholder="e.g., Tower A"
                      helperText="Provide a name for this tower"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tower Code *"
                      value={formData.towerCode}
                      onChange={(e) => handleInputChange('towerCode', e.target.value.toUpperCase())}
                      placeholder="e.g., T1"
                      helperText="Unique identifier for this tower"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Tower Type</InputLabel>
                      <Select
                        value={formData.towerType}
                        onChange={(e) => handleInputChange('towerType', e.target.value)}
                        label="Tower Type"
                      >
                        {TOWER_TYPES.map(type => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Floors *"
                      value={formData.totalFloors}
                      onChange={(e) => handleInputChange('totalFloors', parseInt(e.target.value) || '')}
                      placeholder="e.g., 25"
                      inputProps={{ min: 1, max: 100 }}
                      helperText="Number of floors in the tower"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Units Per Floor *"
                      value={formData.unitsPerFloor}
                      onChange={(e) => handleInputChange('unitsPerFloor', parseInt(e.target.value) || '')}
                      placeholder="e.g., 4"
                      inputProps={{ min: 1, max: 20 }}
                      helperText="Number of units on each floor"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the tower features, specifications, etc."
                      helperText="Optional: Provide additional details about this tower"
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Unit Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Unit Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Define the types and quantities of units in this tower
                </Typography>
                
                {Object.entries(formData.configuration).map(([unitType, count]) => (
                  <Box key={unitType} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip label={unitType} color="primary" variant="outlined" />
                    <TextField
                      type="number"
                      label="Count"
                      value={count}
                      onChange={(e) => handleConfigurationChange(unitType, e.target.value)}
                      sx={{ width: 100 }}
                      inputProps={{ min: 0 }}
                    />
                    <IconButton 
                      onClick={() => removeConfigurationItem(unitType)} 
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                
                <FormControl sx={{ minWidth: 200, mr: 2 }}>
                  <InputLabel>Add Unit Type</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !formData.configuration[e.target.value]) {
                        handleConfigurationChange(e.target.value, 1);
                      }
                    }}
                    label="Add Unit Type"
                  >
                    {UNIT_TYPES
                      .filter(type => !formData.configuration[type])
                      .map(type => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Amenities */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Tower Amenities
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

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Pricing Configuration */}
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pricing Configuration (Optional)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Base Price"
                          value={formData.pricingConfiguration.basePrice}
                          onChange={(e) => handleInputChange('pricingConfiguration.basePrice', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          placeholder="e.g., 5000000"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Floor Rise Charge"
                          value={formData.pricingConfiguration.floorRiseCharge}
                          onChange={(e) => handleInputChange('pricingConfiguration.floorRiseCharge', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          placeholder="e.g., 50000"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          PLC Charges
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Park Facing"
                          value={formData.pricingConfiguration.plcCharges.parkFacing}
                          onChange={(e) => handleInputChange('pricingConfiguration.plcCharges.parkFacing', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Road Facing"
                          value={formData.pricingConfiguration.plcCharges.roadFacing}
                          onChange={(e) => handleInputChange('pricingConfiguration.plcCharges.roadFacing', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Corner Unit"
                          value={formData.pricingConfiguration.plcCharges.cornerUnit}
                          onChange={(e) => handleInputChange('pricingConfiguration.plcCharges.cornerUnit', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button
                onClick={() => navigate(`/projects/${projectId}`)}
                startIcon={<ArrowBack />}
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                size="large"
              >
                {loading ? 'Creating Tower...' : 'Create Tower'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CreateTowerPage;
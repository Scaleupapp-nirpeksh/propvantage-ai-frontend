// File: src/pages/projects/CreateUnitPage.js
// Description: Professional unit creation form supporting both tower units and villa units (direct project units)
// Version: 1.0 - Production-grade unit creation with complete backend integration
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
  Divider,
  Chip,
  Stack,
  Breadcrumbs,
  Link,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack,
  Business,
  Domain,
  Home,
  NavigateNext,
  Save,
  ExpandMore,
  Villa,
  Apartment,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Unit types and configurations
const BHK_TYPES = [
  'Studio', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', 
  '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', 'Penthouse', 'Duplex'
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
  const { user } = useAuth();

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

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    project: projectId,
    tower: towerId || null, // null for villa projects
    unitNumber: '',
    floorNumber: isVillaProject ? null : '',
    bhkType: '',
    unitType: isVillaProject ? 'villa' : 'apartment',
    status: 'available',
    
    // Area Information
    carpetArea: '',
    builtupArea: '',
    superBuiltupArea: '',
    
    // Location & Features
    facing: '',
    balconies: '',
    bathrooms: '',
    parkingSpaces: '',
    
    // Pricing
    basePrice: '',
    currentPrice: '',
    pricePerSqFt: '',
    
    // Additional Details
    features: [],
    description: '',
    
    // Villa-specific fields
    ...(isVillaProject && {
      plotArea: '',
      gardenArea: '',
      constructedArea: '',
      villaType: 'independent', // independent, row-house, cluster
    }),
  });

  const steps = [
    'Basic Information',
    'Area & Features',
    'Pricing & Details'
  ];

  // Fetch project and tower data
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, towerId]);

  const fetchProjectData = async () => {
    try {
      setProjectLoading(true);
      
      // Fetch project details
      const projectResponse = await projectAPI.getProject(projectId);
      const projectData = projectResponse.data.data || projectResponse.data;
      setProject(projectData);

      // Fetch tower details if this is a tower unit
      if (towerId) {
        const towerResponse = await towerAPI.getTower(towerId);
        const towerData = towerResponse.data.data || towerResponse.data;
        setTower(towerData);

        // Get existing units to auto-generate unit number
        const unitsResponse = await unitAPI.getUnits({ tower: towerId });
        const existingUnits = unitsResponse.data.data || [];
        const nextUnitNumber = generateNextUnitNumber(existingUnits, towerData);
        
        setFormData(prev => ({
          ...prev,
          unitNumber: nextUnitNumber,
          floorNumber: 1, // Default to first floor
        }));
      } else {
        // For villa projects, get existing units to auto-generate villa number
        const unitsResponse = await unitAPI.getUnits({ project: projectId, tower: null });
        const existingUnits = unitsResponse.data.data || [];
        const nextVillaNumber = `V${existingUnits.length + 1}`;
        
        setFormData(prev => ({
          ...prev,
          unitNumber: nextVillaNumber,
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
    // Simple logic: Floor + Unit (e.g., 101, 102, 201, 202)
    const floorNumber = 1;
    const unitsOnFloor = existingUnits.filter(unit => unit.floorNumber === floorNumber);
    const nextUnitOnFloor = unitsOnFloor.length + 1;
    return `${floorNumber}${nextUnitOnFloor.toString().padStart(2, '0')}`;
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Form validation
  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        return formData.unitNumber && formData.bhkType && 
               (isVillaProject || formData.floorNumber);
      case 1: // Area & Features
        return formData.carpetArea || formData.builtupArea;
      case 2: // Pricing
        return formData.basePrice || formData.currentPrice;
      default:
        return true;
    }
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate price per sq ft if not provided
      const finalFormData = { ...formData };
      if (finalFormData.currentPrice && finalFormData.carpetArea && !finalFormData.pricePerSqFt) {
        finalFormData.pricePerSqFt = Math.round(finalFormData.currentPrice / finalFormData.carpetArea);
      }

      console.log('🚀 Creating unit with data:', finalFormData);

      const response = await unitAPI.createUnit(finalFormData);
      
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
          Provide the fundamental details about this {isVillaProject ? 'villa' : 'unit'}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={`${isVillaProject ? 'Villa' : 'Unit'} Number *`}
          value={formData.unitNumber}
          onChange={(e) => handleInputChange('unitNumber', e.target.value)}
          placeholder={isVillaProject ? 'e.g., V1' : 'e.g., 101'}
          helperText={`Unique identifier for this ${isVillaProject ? 'villa' : 'unit'}`}
        />
      </Grid>
      
      {!isVillaProject && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Floor Number *"
            value={formData.floorNumber}
            onChange={(e) => handleInputChange('floorNumber', parseInt(e.target.value) || '')}
            placeholder="e.g., 1"
            inputProps={{ min: 0, max: tower?.totalFloors || 100 }}
            helperText={`Floor 0 = Ground Floor (Max: ${tower?.totalFloors || 'N/A'})`}
          />
        </Grid>
      )}
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>BHK Type *</InputLabel>
          <Select
            value={formData.bhkType}
            onChange={(e) => handleInputChange('bhkType', e.target.value)}
            label="BHK Type *"
          >
            {BHK_TYPES.map(type => (
              <MenuItem key={type} value={type}>
                {type}
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

      {isVillaProject && (
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Villa Type</InputLabel>
            <Select
              value={formData.villaType}
              onChange={(e) => handleInputChange('villaType', e.target.value)}
              label="Villa Type"
            >
              <MenuItem value="independent">Independent Villa</MenuItem>
              <MenuItem value="row-house">Row House</MenuItem>
              <MenuItem value="cluster">Cluster Villa</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={`Describe this ${isVillaProject ? 'villa' : 'unit'}...`}
          helperText="Optional: Additional details about this unit"
        />
      </Grid>
    </Grid>
  );

  const renderAreaAndFeatures = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Area & Features
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Specify the area measurements and key features
        </Typography>
      </Grid>
      
      {/* Area Information */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Area Details (sq ft)
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Carpet Area"
          value={formData.carpetArea}
          onChange={(e) => handleInputChange('carpetArea', parseInt(e.target.value) || '')}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          placeholder="e.g., 850"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Built-up Area"
          value={formData.builtupArea}
          onChange={(e) => handleInputChange('builtupArea', parseInt(e.target.value) || '')}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          placeholder="e.g., 1000"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Super Built-up Area"
          value={formData.superBuiltupArea}
          onChange={(e) => handleInputChange('superBuiltupArea', parseInt(e.target.value) || '')}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          placeholder="e.g., 1200"
        />
      </Grid>

      {/* Villa-specific areas */}
      {isVillaProject && (
        <>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Plot Area"
              value={formData.plotArea}
              onChange={(e) => handleInputChange('plotArea', parseInt(e.target.value) || '')}
              InputProps={{
                endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
              }}
              placeholder="e.g., 2400"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Garden Area"
              value={formData.gardenArea}
              onChange={(e) => handleInputChange('gardenArea', parseInt(e.target.value) || '')}
              InputProps={{
                endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
              }}
              placeholder="e.g., 500"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Constructed Area"
              value={formData.constructedArea}
              onChange={(e) => handleInputChange('constructedArea', parseInt(e.target.value) || '')}
              InputProps={{
                endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
              }}
              placeholder="e.g., 1800"
            />
          </Grid>
        </>
      )}
      
      {/* Features */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Unit Features
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={3}>
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
      
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Balconies"
          value={formData.balconies}
          onChange={(e) => handleInputChange('balconies', parseInt(e.target.value) || '')}
          inputProps={{ min: 0, max: 10 }}
          placeholder="e.g., 2"
        />
      </Grid>
      
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Bathrooms"
          value={formData.bathrooms}
          onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || '')}
          inputProps={{ min: 1, max: 10 }}
          placeholder="e.g., 2"
        />
      </Grid>
      
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Parking Spaces"
          value={formData.parkingSpaces}
          onChange={(e) => handleInputChange('parkingSpaces', parseInt(e.target.value) || '')}
          inputProps={{ min: 0, max: 5 }}
          placeholder="e.g., 1"
        />
      </Grid>
    </Grid>
  );

  const renderPricingAndDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Pricing & Final Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set the pricing and finalize unit details
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Base Price"
          value={formData.basePrice}
          onChange={(e) => handleInputChange('basePrice', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 5000000"
          helperText="Original price without additional charges"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
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
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          type="number"
          label="Price per Sq Ft"
          value={formData.pricePerSqFt}
          onChange={(e) => handleInputChange('pricePerSqFt', parseInt(e.target.value) || '')}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          placeholder="e.g., 6500"
          helperText="Will be auto-calculated if left empty"
        />
      </Grid>

      {/* Summary */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Unit Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                {isVillaProject ? 'Villa' : 'Unit'} Number
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.unitNumber || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.bhkType || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Carpet Area
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.carpetArea ? `${formData.carpetArea} sq ft` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formData.currentPrice ? `₹${formData.currentPrice.toLocaleString()}` : 'N/A'}
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
            Add a new {isVillaProject ? 'villa' : 'unit'} to {isVillaProject ? project.name : tower?.towerName || 'the tower'}
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isVillaProject ? 'Villa Unit' : 'Unit'} Created Successfully! 🎉
            </Typography>
            <Typography>
              {isVillaProject ? 'Villa' : 'Unit'} "{formData.unitNumber}" has been created. Redirecting...
            </Typography>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
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
            {activeStep === 1 && renderAreaAndFeatures()}
            {activeStep === 2 && renderPricingAndDetails()}
            
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
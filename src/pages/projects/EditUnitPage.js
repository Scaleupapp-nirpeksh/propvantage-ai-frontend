// File: src/pages/projects/EditUnitPage.js
// Description: Production-grade unit editing form with comprehensive validation and delete functionality
// Version: 1.0 - Complete unit editing with all backend integration and stepper form
// Location: src/pages/projects/EditUnitPage.js

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
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  Business,
  Home,
  Warning,
  NavigateNext,
  Edit,
  Villa,
  Apartment,
  AttachMoney,
  Bed,
  Bathtub,
  Kitchen,
  Balcony,
  LocalParking,
  Star,
  CheckCircle,
  ArrowForward,
  ArrowBackIos,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Unit configurations
const UNIT_TYPES = [
  'Studio', '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', 
  '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', 'Penthouse', 'Duplex',
  'Shop', 'Office'
];

const UNIT_STATUSES = [
  { value: 'available', label: 'Available', color: 'success' },
  { value: 'booked', label: 'Booked', color: 'info' },
  { value: 'blocked', label: 'Blocked', color: 'warning' },
  { value: 'sold', label: 'Sold', color: 'error' },
];

const FACING_OPTIONS = [
  'North', 'South', 'East', 'West', 'North-East', 'North-West',
  'South-East', 'South-West',
];

const HANDOVER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'ready', label: 'Ready for Handover', color: 'info' },
  { value: 'handed_over', label: 'Handed Over', color: 'success' },
];

// Utility function to extract ID safely
const extractId = (value, context = 'unknown') => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id;
  return String(value);
};

// Utility function to extract data from API response
const extractDataFromResponse = (response, dataType = 'generic') => {
  try {
    const responseData = response?.data;
    if (!responseData) return null;

    if (responseData.data && typeof responseData.data === 'object') {
      return responseData.data;
    }
    
    if (responseData._id || responseData.id) {
      return responseData;
    }
    
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error extracting ${dataType} from response:`, error);
    return null;
  }
};

// Breadcrumb Navigation Component
const EditUnitBreadcrumbs = ({ project, tower, unit, isVillaProject }) => {
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
        <Edit fontSize="small" />
        Edit {isVillaProject ? 'Villa' : 'Unit'} {unit?.unitNumber}
      </Typography>
    </Breadcrumbs>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, unit, isVillaProject, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = unit?.unitNumber || '';

  const isConfirmValid = confirmText === expectedText;
  const isSold = unit?.status === 'sold';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning />
        Delete {isVillaProject ? 'Villa' : 'Unit'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This action cannot be undone. This will permanently delete the {isVillaProject ? 'villa' : 'unit'}
          <strong> "{unit?.unitNumber}"</strong> and all associated data.
        </DialogContentText>
        
        {isSold ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cannot Delete Sold {isVillaProject ? 'Villa' : 'Unit'}!
            </Typography>
            <Typography variant="body2">
              This {isVillaProject ? 'villa' : 'unit'} is marked as <strong>SOLD</strong>. 
              You cannot delete a sold {isVillaProject ? 'villa' : 'unit'} as it would affect:
            </Typography>
            <Box sx={{ ml: 2, mt: 1 }}>
              <Typography variant="body2" component="li">• Customer booking records</Typography>
              <Typography variant="body2" component="li">• Financial transactions and payments</Typography>
              <Typography variant="body2" component="li">• Legal agreements and contracts</Typography>
              <Typography variant="body2" component="li">• Revenue calculations and reports</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              Please change the status to 'Available' first if you need to delete this {isVillaProject ? 'villa' : 'unit'}.
            </Typography>
          </Alert>
        ) : (
          <>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body2" component="li">{isVillaProject ? 'Villa' : 'Unit'} specifications and pricing</Typography>
              <Typography variant="body2" component="li">Booking history and lead assignments</Typography>
              <Typography variant="body2" component="li">Associated documents and media</Typography>
              <Typography variant="body2" component="li">Customer interaction records</Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Confirm Deletion
              </Typography>
              <Typography variant="body2">
                Please type <strong>{expectedText}</strong> below to confirm deletion.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label={`Confirm ${isVillaProject ? 'villa' : 'unit'} number`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              error={confirmText !== '' && !isConfirmValid}
              helperText={confirmText !== '' && !isConfirmValid ? `${isVillaProject ? 'Villa' : 'Unit'} number doesn't match` : ''}
              sx={{ mt: 1 }}
            />
          </>
        )}
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
          disabled={isSold || !isConfirmValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? 'Deleting...' : `Delete ${isVillaProject ? 'Villa' : 'Unit'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Edit Unit Page Component
const EditUnitPage = () => {
  const { projectId, towerId, unitId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // Determine if this is a villa project (no towerId)
  const isVillaProject = !towerId;

  // Validate IDs
  const validProjectId = extractId(projectId);
  const validTowerId = extractId(towerId);
  const validUnitId = extractId(unitId);

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Form data state with comprehensive unit fields
  const [formData, setFormData] = useState({
    // Basic Information
    unitNumber: '',
    type: '2 BHK',
    floor: isVillaProject ? 0 : 1,
    areaSqft: '',
    basePrice: '',
    currentPrice: '',
    facing: 'North',
    status: 'available',
    description: '',
    
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
  });

  const steps = [
    'Basic Information',
    'Specifications',
    'Features & Amenities',
    'Pricing & Possession'
  ];

  // Fetch unit data on component mount
  useEffect(() => {
    if (validProjectId && validUnitId) {
      fetchUnitData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validProjectId, validTowerId, validUnitId]);

  const fetchUnitData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await projectAPI.getProject(validProjectId);
      const projectData = extractDataFromResponse(projectResponse, 'project data');

      // Fetch tower details if not villa project
      let towerData = null;
      if (!isVillaProject && validTowerId) {
        const towerResponse = await towerAPI.getTower(validTowerId);
        towerData = extractDataFromResponse(towerResponse, 'tower data');
        
        // Handle nested tower structure if needed
        if (towerData && typeof towerData === 'object' && 'tower' in towerData) {
          towerData = towerData.tower;
        }
      }

      // Fetch unit details
      const unitResponse = await unitAPI.getUnit(validUnitId);
      const unitData = extractDataFromResponse(unitResponse, 'unit data');

      setProject(projectData);
      setTower(towerData);
      setUnit(unitData);
      
      // Populate form with existing data
      setFormData({
        // Basic Information
        unitNumber: unitData?.unitNumber || '',
        type: unitData?.type || '2 BHK',
        floor: unitData?.floor || (isVillaProject ? 0 : 1),
        areaSqft: unitData?.areaSqft || '',
        basePrice: unitData?.basePrice || '',
        currentPrice: unitData?.currentPrice || unitData?.basePrice || '',
        facing: unitData?.facing || 'North',
        status: unitData?.status || 'available',
        description: unitData?.description || '',
        
        // Features object
        features: {
          isParkFacing: unitData?.features?.isParkFacing || false,
          isCornerUnit: unitData?.features?.isCornerUnit || false,
          hasBalcony: unitData?.features?.hasBalcony || true,
          hasServantRoom: unitData?.features?.hasServantRoom || false,
          hasParkingSlot: unitData?.features?.hasParkingSlot || false,
          hasStudyRoom: unitData?.features?.hasStudyRoom || false,
          hasUtilityArea: unitData?.features?.hasUtilityArea || false,
        },
        
        // Specifications object
        specifications: {
          bedrooms: unitData?.specifications?.bedrooms || 1,
          bathrooms: unitData?.specifications?.bathrooms || 1,
          livingRooms: unitData?.specifications?.livingRooms || 1,
          kitchen: unitData?.specifications?.kitchen || 1,
          balconies: unitData?.specifications?.balconies || 0,
          terraceArea: unitData?.specifications?.terraceArea || 0,
          carpetArea: unitData?.specifications?.carpetArea || 0,
          builtUpArea: unitData?.specifications?.builtUpArea || 0,
          superBuiltUpArea: unitData?.specifications?.superBuiltUpArea || 0,
        },
        
        // Parking object
        parking: {
          covered: unitData?.parking?.covered || 0,
          open: unitData?.parking?.open || 0,
        },
        
        // Possession object
        possession: {
          handoverStatus: unitData?.possession?.handoverStatus || 'not-ready',
        },
      });

    } catch (error) {
      console.error('Error fetching unit data:', error);
      setError('Failed to load unit details. Please try again.');
    } finally {
      setLoading(false);
    }
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
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Form validation
  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Information
        return formData.unitNumber && formData.type && formData.areaSqft && formData.basePrice;
      case 1: // Specifications
        return formData.specifications.bedrooms > 0 && formData.specifications.bathrooms > 0;
      case 2: // Features
        return true; // Features are optional
      case 3: // Pricing & Possession
        return formData.currentPrice && formData.possession.handoverStatus;
      default:
        return false;
    }
  };

  const validateForm = () => {
    const requiredFields = ['unitNumber', 'type', 'areaSqft', 'basePrice'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (formData.specifications.bedrooms < 0 || formData.specifications.bathrooms < 0) {
      setError('Bedrooms and bathrooms cannot be negative');
      return false;
    }

    if (formData.areaSqft <= 0) {
      setError('Area must be greater than 0');
      return false;
    }

    if (formData.basePrice <= 0) {
      setError('Base price must be greater than 0');
      return false;
    }

    return true;
  };

  // Stepper navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare backend payload with exact structure
      const backendPayload = {
        unitNumber: formData.unitNumber,
        type: formData.type,
        floor: parseInt(formData.floor) || (isVillaProject ? 0 : 1),
        areaSqft: parseInt(formData.areaSqft) || 0,
        basePrice: parseInt(formData.basePrice) || 0,
        currentPrice: parseInt(formData.currentPrice) || parseInt(formData.basePrice) || 0,
        facing: formData.facing,
        status: formData.status,
        description: formData.description,
        
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

      console.log('🚀 Updating unit with data:', backendPayload);

      const response = await unitAPI.updateUnit(validUnitId, backendPayload);
      
      console.log('✅ Unit updated successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate back to appropriate page after success
      setTimeout(() => {
        if (isVillaProject) {
          navigate(`/projects/${validProjectId}`);
        } else {
          navigate(`/projects/${validProjectId}/towers/${validTowerId}`);
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Unit update failed:', error);
      setError(error.response?.data?.message || 'Failed to update unit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete unit
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      console.log('🗑️ Deleting unit:', validUnitId);

      await unitAPI.deleteUnit(validUnitId);
      
      console.log('✅ Unit deleted successfully');
      
      // Navigate back to appropriate page
      if (isVillaProject) {
        navigate(`/projects/${validProjectId}`);
      } else {
        navigate(`/projects/${validProjectId}/towers/${validTowerId}`);
      }

    } catch (error) {
      console.error('❌ Unit deletion failed:', error);
      setError(error.response?.data?.message || 'Failed to delete unit. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Step content renderers
  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Basic {isVillaProject ? 'Villa' : 'Unit'} Information
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
          placeholder={isVillaProject ? 'e.g., V101' : 'e.g., T1-101'}
          required
          error={!formData.unitNumber}
          helperText={!formData.unitNumber ? 'Unit number is required' : ''}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>{isVillaProject ? 'Villa' : 'Unit'} Type</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            label={`${isVillaProject ? 'Villa' : 'Unit'} Type`}
          >
            {UNIT_TYPES.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {!isVillaProject && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Floor *"
            value={formData.floor}
            onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || '')}
            inputProps={{ min: 1, max: tower?.totalFloors || 50 }}
            required
            error={!formData.floor}
            helperText={!formData.floor ? 'Floor is required' : `Tower has ${tower?.totalFloors || 'N/A'} floors`}
          />
        </Grid>
      )}
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Area (sq ft) *"
          value={formData.areaSqft}
          onChange={(e) => handleInputChange('areaSqft', e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
          required
          error={!formData.areaSqft}
          helperText={!formData.areaSqft ? 'Area is required' : ''}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Facing Direction</InputLabel>
          <Select
            value={formData.facing}
            onChange={(e) => handleInputChange('facing', e.target.value)}
            label="Facing Direction"
          >
            {FACING_OPTIONS.map(facing => (
              <MenuItem key={facing} value={facing}>{facing}</MenuItem>
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
                <Chip label={status.label} color={status.color} size="small" sx={{ minWidth: 80 }} />
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
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={`Describe the ${isVillaProject ? 'villa' : 'unit'} features, location benefits, etc.`}
        />
      </Grid>
    </Grid>
  );

  const renderSpecifications = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Home color="primary" />
          {isVillaProject ? 'Villa' : 'Unit'} Specifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Detailed room configuration and area specifications
        </Typography>
      </Grid>
      
      {/* Room Configuration */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Room Configuration
        </Typography>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Bedrooms"
          value={formData.specifications.bedrooms}
          onChange={(e) => handleInputChange('specifications.bedrooms', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 10 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Bed /></InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Bathrooms"
          value={formData.specifications.bathrooms}
          onChange={(e) => handleInputChange('specifications.bathrooms', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 10 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Bathtub /></InputAdornment>,
          }}
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
          InputProps={{
            startAdornment: <InputAdornment position="start"><Home /></InputAdornment>,
          }}
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
          InputProps={{
            startAdornment: <InputAdornment position="start"><Kitchen /></InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Balconies"
          value={formData.specifications.balconies}
          onChange={(e) => handleInputChange('specifications.balconies', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 5 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Balcony /></InputAdornment>,
          }}
        />
      </Grid>
      
      {/* Area Specifications */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
          Area Breakdown (sq ft)
        </Typography>
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Carpet Area"
          value={formData.specifications.carpetArea}
          onChange={(e) => handleInputChange('specifications.carpetArea', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Built-up Area"
          value={formData.specifications.builtUpArea}
          onChange={(e) => handleInputChange('specifications.builtUpArea', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Super Built-up Area"
          value={formData.specifications.superBuiltUpArea}
          onChange={(e) => handleInputChange('specifications.superBuiltUpArea', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Terrace Area"
          value={formData.specifications.terraceArea}
          onChange={(e) => handleInputChange('specifications.terraceArea', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );

  const renderFeaturesAndAmenities = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star color="primary" />
          Features & Amenities
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Special features and amenities for this {isVillaProject ? 'villa' : 'unit'}
        </Typography>
      </Grid>
      
      {/* Features */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {isVillaProject ? 'Villa' : 'Unit'} Features
        </Typography>
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.isParkFacing}
              onChange={(e) => handleInputChange('features.isParkFacing', e.target.checked)}
            />
          }
          label="Park Facing"
        />
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.isCornerUnit}
              onChange={(e) => handleInputChange('features.isCornerUnit', e.target.checked)}
            />
          }
          label="Corner Unit"
        />
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.hasBalcony}
              onChange={(e) => handleInputChange('features.hasBalcony', e.target.checked)}
            />
          }
          label="Has Balcony"
        />
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.hasServantRoom}
              onChange={(e) => handleInputChange('features.hasServantRoom', e.target.checked)}
            />
          }
          label="Servant Room"
        />
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.hasStudyRoom}
              onChange={(e) => handleInputChange('features.hasStudyRoom', e.target.checked)}
            />
          }
          label="Study Room"
        />
      </Grid>
      
      <Grid item xs={6} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.features.hasUtilityArea}
              onChange={(e) => handleInputChange('features.hasUtilityArea', e.target.checked)}
            />
          }
          label="Utility Area"
        />
      </Grid>
      
      {/* Parking */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
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
          inputProps={{ min: 0, max: 10 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LocalParking /></InputAdornment>,
          }}
        />
      </Grid>
      
      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Open Parking"
          value={formData.parking.open}
          onChange={(e) => handleInputChange('parking.open', parseInt(e.target.value) || 0)}
          inputProps={{ min: 0, max: 10 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LocalParking /></InputAdornment>,
          }}
        />
      </Grid>
    </Grid>
  );

  const renderPricingAndPossession = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoney color="primary" />
          Pricing & Possession
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Financial details and possession status
        </Typography>
      </Grid>
      
      {/* Pricing */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Pricing Information
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Base Price *"
          value={formData.basePrice}
          onChange={(e) => handleInputChange('basePrice', e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          required
          error={!formData.basePrice}
          helperText={!formData.basePrice ? 'Base price is required' : 'Original unit price'}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Current Price *"
          value={formData.currentPrice}
          onChange={(e) => handleInputChange('currentPrice', e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
          required
          error={!formData.currentPrice}
          helperText={!formData.currentPrice ? 'Current price is required' : 'Market-adjusted price'}
        />
      </Grid>
      
      {/* Price Per Sq Ft Calculation */}
      {formData.currentPrice && formData.areaSqft && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2">
              <strong>Price per sq ft:</strong> ₹{Math.round(formData.currentPrice / formData.areaSqft).toLocaleString()}
              {formData.basePrice !== formData.currentPrice && (
                <>
                  {' '} • <strong>Price difference:</strong> {formData.currentPrice > formData.basePrice ? '+' : ''}₹{(formData.currentPrice - formData.basePrice).toLocaleString()}
                </>
              )}
            </Typography>
          </Alert>
        </Grid>
      )}
      
      {/* Possession */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>
          Possession Status
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Handover Status</InputLabel>
          <Select
            value={formData.possession.handoverStatus}
            onChange={(e) => handleInputChange('possession.handoverStatus', e.target.value)}
            label="Handover Status"
          >
            {HANDOVER_STATUS_OPTIONS.map(status => (
              <MenuItem key={status.value} value={status.value}>
                <Chip label={status.label} color={status.color} size="small" sx={{ minWidth: 100 }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  // Validation before render
  if (!validProjectId || !validUnitId) {
    return (
      <Alert severity="error">
        Invalid project or unit ID in URL. Please check the URL and try again.
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

  if (error && !unit) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchUnitData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!unit) {
    return (
      <Alert severity="warning">
        {isVillaProject ? 'Villa' : 'Unit'} not found
      </Alert>
    );
  }

  const selectedStatus = UNIT_STATUSES.find(status => status.value === formData.status);

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <EditUnitBreadcrumbs project={project} tower={tower} unit={unit} isVillaProject={isVillaProject} />

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => {
                if (isVillaProject) {
                  navigate(`/projects/${validProjectId}`);
                } else {
                  navigate(`/projects/${validProjectId}/towers/${validTowerId}`);
                }
              }}
              sx={{ mb: 1 }}
            >
              Back to {isVillaProject ? 'Project' : 'Tower'}
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
              Delete {isVillaProject ? 'Villa' : 'Unit'}
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            {isVillaProject ? <Villa sx={{ fontSize: 28 }} /> : <Apartment sx={{ fontSize: 28 }} />}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit {isVillaProject ? 'Villa' : 'Unit'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="text.secondary">
                {unit.unitNumber} • {unit.type}
              </Typography>
              {selectedStatus && (
                <Chip 
                  label={selectedStatus.label} 
                  color={selectedStatus.color} 
                  size="small"
                />
              )}
              <Chip 
                label={`${unit.areaSqft} sq ft`} 
                color="info" 
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {isVillaProject ? 'Villa' : 'Unit'} Updated Successfully! 🎉
          </Typography>
          <Typography>
            All changes have been saved. Redirecting back...
          </Typography>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Warning for Sold Units */}
      {unit?.status === 'sold' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
            This {isVillaProject ? 'villa' : 'unit'} is marked as SOLD
          </Typography>
          <Typography variant="body2">
            Be careful when editing sold {isVillaProject ? 'villas' : 'units'} as it may affect customer records, 
            financial reports, and legal agreements. Consider the impact of any changes.
          </Typography>
        </Alert>
      )}

      {/* Enhanced Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                optional={
                  index === 2 ? (
                    <Typography variant="caption">Optional</Typography>
                  ) : null
                }
              >
                {label}
              </StepLabel>
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
              startIcon={<ArrowBackIos />}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving || success || !validateStep(activeStep)}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  size="large"
                >
                  {saving ? `Updating ${isVillaProject ? 'Villa' : 'Unit'}...` : `Update ${isVillaProject ? 'Villa' : 'Unit'}`}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validateStep(activeStep)}
                  endIcon={<ArrowForward />}
                  size="large"
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        unit={unit}
        isVillaProject={isVillaProject}
        loading={deleting}
      />
    </Box>
  );
};

export default EditUnitPage;
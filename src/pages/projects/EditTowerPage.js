// File: src/pages/projects/EditTowerPage.js
// Description: Production-grade tower editing form with comprehensive validation and delete functionality
// Version: 1.0 - Complete tower editing with unit impact validation and all backend integration
// Location: src/pages/projects/EditTowerPage.js

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  Business,
  Domain,
  Warning,
  Info,
  ExpandMore,
  NavigateNext,
  Cancel,
  Edit,
  Construction,
  Settings,
  AttachMoney,
  Security,
  Elevator,
  LocalParking,
  PowerSettingsNew,
  Water,
  Star,
  Engineering,
  AccountBalance,
  VerifiedUser,
  Architecture,
  CheckCircle,
  ErrorOutline,
  Home,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Tower type configurations
const TOWER_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
];

const TOWER_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'under-construction', label: 'Under Construction', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'on-hold', label: 'On Hold', color: 'error' },
];

const CONSTRUCTION_STATUSES = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'structure', label: 'Structure' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'completed', label: 'Completed' },
];

const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'expired', label: 'Expired', color: 'error' },
];

const UNIT_TYPES = [
  '1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '5 BHK',
  'Studio', 'Penthouse', 'Duplex', 'Shop', 'Office'
];

const COMMON_AMENITIES = [
  'Elevator', 'Power Backup', 'Water Supply', 'Security',
  'CCTV Surveillance', 'Fire Safety', 'Parking', 'Waste Management',
  'Intercom', 'Garden Area', 'Common Toilet', 'Staircase',
  'Generator', 'Water Tank', 'Solar Panels', 'Rainwater Harvesting',
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

    // Handle nested tower structure
    if (responseData.tower && typeof responseData.tower === 'object') {
      return responseData.tower;
    }
    
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
const EditTowerBreadcrumbs = ({ project, tower }) => {
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
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: 'pointer' }}
        onClick={() => navigate(`/projects/${project?._id}/towers/${tower?._id}`)}
      >
        {tower?.towerName || tower?.towerCode || 'Tower'}
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Edit fontSize="small" />
        Edit Tower
      </Typography>
    </Breadcrumbs>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({ open, onClose, onConfirm, tower, unitCount, loading }) => {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = tower?.towerName || tower?.towerCode || '';

  const isConfirmValid = confirmText === expectedText;
  const hasUnits = unitCount > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning />
        Delete Tower
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This action cannot be undone. This will permanently delete the tower
          <strong> "{tower?.towerName || tower?.towerCode}"</strong> and all associated data.
        </DialogContentText>
        
        {hasUnits ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cannot Delete Tower with Units!
            </Typography>
            <Typography variant="body2">
              This tower has <strong>{unitCount} units</strong>. Please delete or reassign all units first before deleting the tower.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Data that will be affected:
            </Typography>
            <Box sx={{ ml: 2, mt: 1 }}>
              <Typography variant="body2" component="li">• {unitCount} units and their bookings</Typography>
              <Typography variant="body2" component="li">• All sales and financial records</Typography>
              <Typography variant="body2" component="li">• Unit-specific documents and media</Typography>
            </Box>
          </Alert>
        ) : (
          <>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body2" component="li">Tower configuration and specifications</Typography>
              <Typography variant="body2" component="li">Financial records and targets</Typography>
              <Typography variant="body2" component="li">Construction progress data</Typography>
              <Typography variant="body2" component="li">All associated documents</Typography>
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
              label="Confirm tower name/code"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
              error={confirmText !== '' && !isConfirmValid}
              helperText={confirmText !== '' && !isConfirmValid ? "Tower name/code doesn't match" : ''}
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
          disabled={hasUnits || !isConfirmValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? 'Deleting...' : 'Delete Tower'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Edit Tower Page Component
const EditTowerPage = () => {
  const { projectId, towerId } = useParams();
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();

  // Validate IDs
  const validProjectId = extractId(projectId);
  const validTowerId = extractId(towerId);

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form data state with comprehensive tower fields
  const [formData, setFormData] = useState({
    // Basic Information
    towerName: '',
    towerCode: '',
    towerType: 'residential',
    status: 'active',
    description: '',
    
    // Building Structure
    totalFloors: '',
    unitsPerFloor: '',
    
    // Configuration
    configuration: {
      elevators: {
        count: 0,
        type: '',
        capacity: '',
      },
      staircases: {
        count: 0,
        type: '',
        emergency: false,
      },
      powerBackup: '',
      waterSupply: '',
      parking: {
        capacity: 0,
        levels: 0,
        type: '',
      },
    },
    
    // Amenities - ensure it's always an array
    amenities: [],
    
    // Pricing Configuration
    pricingConfiguration: {
      basePriceModifier: 0,
      floorPremium: {
        enabled: false,
        premiumPerFloor: 0,
        startFloor: 1,
      },
      penthousePremium: {
        enabled: false,
        premiumPercentage: 0,
        topFloors: 1,
      },
      cornerUnitPremium: {
        enabled: false,
        percentage: 0,
      },
    },
    
    // Financial Details
    financials: {
      constructionCost: {
        budgeted: '',
        actual: '',
      },
      revenueTarget: '',
      revenueAchieved: '',
    },
    
    // Construction Details
    construction: {
      progressPercentage: 0,
      constructionStatus: 'not-started',
      plannedCompletionDate: '',
      actualCompletionDate: '',
    },
    
    // Approvals
    approvals: {
      buildingPlan: {
        status: 'pending',
        approvalDate: '',
        validTill: '',
      },
      fireNOC: {
        status: 'pending',
        approvalDate: '',
        validTill: '',
      },
      elevatorCertificate: {
        status: 'pending',
        approvalDate: '',
        validTill: '',
      },
    },
    
    // Metadata
    metadata: {
      architect: '',
      contractor: '',
      facingDirection: '',
      cornerTower: false,
      premiumLocation: false,
    },
  });

  // Fetch tower data on component mount
  useEffect(() => {
    if (validProjectId && validTowerId) {
      fetchTowerData();
    }
  }, [validProjectId, validTowerId]);

  const fetchTowerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectResponse = await projectAPI.getProject(validProjectId);
      const projectData = extractDataFromResponse(projectResponse, 'project data');

      // Fetch tower details
      const towerResponse = await towerAPI.getTower(validTowerId);
      let towerData = extractDataFromResponse(towerResponse, 'tower data');

      // Handle nested tower structure if needed
      if (towerData && typeof towerData === 'object' && 'tower' in towerData) {
        towerData = towerData.tower;
      }

      // Fetch units to check count for deletion validation
      const unitsResponse = await unitAPI.getUnits({ tower: validTowerId });
      const unitsData = extractDataFromResponse(unitsResponse, 'units data') || [];

      setProject(projectData);
      setTower(towerData);
      setUnits(Array.isArray(unitsData) ? unitsData : []);
      
      // Populate form with existing data
      setFormData({
        // Basic Information
        towerName: towerData?.towerName || '',
        towerCode: towerData?.towerCode || '',
        towerType: towerData?.towerType || 'residential',
        status: towerData?.status || 'active',
        description: towerData?.description || '',
        
        // Building Structure
        totalFloors: towerData?.totalFloors || '',
        unitsPerFloor: towerData?.unitsPerFloor || '',
        
        // Configuration
        configuration: {
          elevators: {
            count: towerData?.configuration?.elevators?.count || 0,
            type: towerData?.configuration?.elevators?.type || '',
            capacity: towerData?.configuration?.elevators?.capacity || '',
          },
          staircases: {
            count: towerData?.configuration?.staircases?.count || 0,
            type: towerData?.configuration?.staircases?.type || '',
            emergency: towerData?.configuration?.staircases?.emergency || false,
          },
          powerBackup: towerData?.configuration?.powerBackup || '',
          waterSupply: towerData?.configuration?.waterSupply || '',
          parking: {
            capacity: towerData?.configuration?.parking?.capacity || 0,
            levels: towerData?.configuration?.parking?.levels || 0,
            type: towerData?.configuration?.parking?.type || '',
          },
        },
        
        // Amenities - ensure it's always an array
        amenities: Array.isArray(towerData?.amenities) ? towerData.amenities : [],
        
        // Pricing Configuration
        pricingConfiguration: {
          basePriceModifier: towerData?.pricingConfiguration?.basePriceModifier || 0,
          floorPremium: {
            enabled: towerData?.pricingConfiguration?.floorPremium?.enabled || false,
            premiumPerFloor: towerData?.pricingConfiguration?.floorPremium?.premiumPerFloor || 0,
            startFloor: towerData?.pricingConfiguration?.floorPremium?.startFloor || 1,
          },
          penthousePremium: {
            enabled: towerData?.pricingConfiguration?.penthousePremium?.enabled || false,
            premiumPercentage: towerData?.pricingConfiguration?.penthousePremium?.premiumPercentage || 0,
            topFloors: towerData?.pricingConfiguration?.penthousePremium?.topFloors || 1,
          },
          cornerUnitPremium: {
            enabled: towerData?.pricingConfiguration?.cornerUnitPremium?.enabled || false,
            percentage: towerData?.pricingConfiguration?.cornerUnitPremium?.percentage || 0,
          },
        },
        
        // Financial Details
        financials: {
          constructionCost: {
            budgeted: towerData?.financials?.constructionCost?.budgeted || '',
            actual: towerData?.financials?.constructionCost?.actual || '',
          },
          revenueTarget: towerData?.financials?.revenueTarget || '',
          revenueAchieved: towerData?.financials?.revenueAchieved || '',
        },
        
        // Construction Details
        construction: {
          progressPercentage: towerData?.construction?.progressPercentage || 0,
          constructionStatus: towerData?.construction?.constructionStatus || 'not-started',
          plannedCompletionDate: towerData?.construction?.plannedCompletionDate ? 
            towerData.construction.plannedCompletionDate.split('T')[0] : '',
          actualCompletionDate: towerData?.construction?.actualCompletionDate ? 
            towerData.construction.actualCompletionDate.split('T')[0] : '',
        },
        
        // Approvals
        approvals: {
          buildingPlan: {
            status: towerData?.approvals?.buildingPlan?.status || 'pending',
            approvalDate: towerData?.approvals?.buildingPlan?.approvalDate ? 
              towerData.approvals.buildingPlan.approvalDate.split('T')[0] : '',
            validTill: towerData?.approvals?.buildingPlan?.validTill ? 
              towerData.approvals.buildingPlan.validTill.split('T')[0] : '',
          },
          fireNOC: {
            status: towerData?.approvals?.fireNOC?.status || 'pending',
            approvalDate: towerData?.approvals?.fireNOC?.approvalDate ? 
              towerData.approvals.fireNOC.approvalDate.split('T')[0] : '',
            validTill: towerData?.approvals?.fireNOC?.validTill ? 
              towerData.approvals.fireNOC.validTill.split('T')[0] : '',
          },
          elevatorCertificate: {
            status: towerData?.approvals?.elevatorCertificate?.status || 'pending',
            approvalDate: towerData?.approvals?.elevatorCertificate?.approvalDate ? 
              towerData.approvals.elevatorCertificate.approvalDate.split('T')[0] : '',
            validTill: towerData?.approvals?.elevatorCertificate?.validTill ? 
              towerData.approvals.elevatorCertificate.validTill.split('T')[0] : '',
          },
        },
        
        // Metadata
        metadata: {
          architect: towerData?.metadata?.architect || '',
          contractor: towerData?.metadata?.contractor || '',
          facingDirection: towerData?.metadata?.facingDirection || '',
          cornerTower: towerData?.metadata?.cornerTower || false,
          premiumLocation: towerData?.metadata?.premiumLocation || false,
        },
      });

    } catch (error) {
      console.error('Error fetching tower data:', error);
      setError('Failed to load tower details. Please try again.');
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

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => {
      // Ensure amenities is always an array
      const currentAmenities = Array.isArray(prev.amenities) ? prev.amenities : [];
      
      return {
        ...prev,
        amenities: currentAmenities.includes(amenity)
          ? currentAmenities.filter(a => a !== amenity)
          : [...currentAmenities, amenity]
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

    // Validate reduction in capacity doesn't affect existing units
    const currentTotalUnits = (formData.totalFloors || 0) * (formData.unitsPerFloor || 0);
    const existingUnitsCount = units.length;
    
    if (existingUnitsCount > currentTotalUnits) {
      setError(`Cannot reduce tower capacity below existing units count (${existingUnitsCount}). New capacity would be ${currentTotalUnits} units.`);
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

      console.log('🚀 Updating tower with data:', formData);

      const response = await towerAPI.updateTower(validTowerId, formData);
      
      console.log('✅ Tower updated successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate back to tower detail page after success
      setTimeout(() => {
        navigate(`/projects/${validProjectId}/towers/${validTowerId}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Tower update failed:', error);
      setError(error.response?.data?.message || 'Failed to update tower. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete tower
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      console.log('🗑️ Deleting tower:', validTowerId);

      await towerAPI.deleteTower(validTowerId);
      
      console.log('✅ Tower deleted successfully');
      
      // Navigate back to project detail page
      navigate(`/projects/${validProjectId}`);

    } catch (error) {
      console.error('❌ Tower deletion failed:', error);
      setError(error.response?.data?.message || 'Failed to delete tower. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Validation before render
  if (!validProjectId || !validTowerId) {
    return (
      <Alert severity="error">
        Invalid project or tower ID in URL. Please check the URL and try again.
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

  if (error && !tower) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchTowerData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!tower) {
    return (
      <Alert severity="warning">
        Tower not found
      </Alert>
    );
  }

  const selectedTowerType = TOWER_TYPES.find(type => type.value === formData.towerType);
  const selectedStatus = TOWER_STATUSES.find(status => status.value === formData.status);

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <EditTowerBreadcrumbs project={project} tower={tower} />

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/projects/${validProjectId}/towers/${validTowerId}`)}
              sx={{ mb: 1 }}
            >
              Back to Tower
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
              Delete Tower
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <Domain sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit Tower
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" color="text.secondary">
                {tower.towerName || tower.towerCode}
              </Typography>
              {selectedStatus && (
                <Chip 
                  label={selectedStatus.label} 
                  color={selectedStatus.color} 
                  size="small"
                />
              )}
              {units.length > 0 && (
                <Chip 
                  label={`${units.length} Units`} 
                  color="info" 
                  size="small"
                  variant="outlined"
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
            Tower Updated Successfully! 🎉
          </Typography>
          <Typography>
            All changes have been saved. Redirecting to tower details...
          </Typography>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Unit Impact Warning */}
      {units.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tower has {units.length} existing units
          </Typography>
          <Typography variant="body2">
            Be careful when changing floor count or units per floor as it may affect existing units.
            You cannot reduce the total capacity below the current unit count.
          </Typography>
        </Alert>
      )}

      {/* Form */}
      <Grid container spacing={3}>
        {/* Main Form Content */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
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
                    label="Tower Name"
                    value={formData.towerName}
                    onChange={(e) => handleInputChange('towerName', e.target.value)}
                    required
                    error={!formData.towerName}
                    helperText={!formData.towerName ? 'Tower name is required' : ''}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tower Code"
                    value={formData.towerCode}
                    onChange={(e) => handleInputChange('towerCode', e.target.value.toUpperCase())}
                    required
                    error={!formData.towerCode}
                    helperText={!formData.towerCode ? 'Tower code is required' : 'Unique identifier for this tower'}
                    placeholder="e.g., T1"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tower Type</InputLabel>
                    <Select
                      value={formData.towerType}
                      onChange={(e) => handleInputChange('towerType', e.target.value)}
                      label="Tower Type"
                    >
                      {TOWER_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
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
                      {TOWER_STATUSES.map((status) => (
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
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Floors"
                    value={formData.totalFloors}
                    onChange={(e) => handleInputChange('totalFloors', parseInt(e.target.value) || '')}
                    required
                    error={!formData.totalFloors}
                    helperText={!formData.totalFloors ? 'Total floors is required' : `Currently: ${tower.totalFloors || 'Not set'}`}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Units Per Floor"
                    value={formData.unitsPerFloor}
                    onChange={(e) => handleInputChange('unitsPerFloor', parseInt(e.target.value) || '')}
                    required
                    error={!formData.unitsPerFloor}
                    helperText={!formData.unitsPerFloor ? 'Units per floor is required' : `Currently: ${tower.unitsPerFloor || 'Not set'}`}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Enter tower description and features..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Building Configuration */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Building Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Elevators */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Elevator fontSize="small" />
                    Elevators
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Count"
                        value={formData.configuration.elevators.count}
                        onChange={(e) => handleInputChange('configuration.elevators.count', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 10 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Type"
                        value={formData.configuration.elevators.type}
                        onChange={(e) => handleInputChange('configuration.elevators.type', e.target.value)}
                        placeholder="e.g., Passenger"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Parking */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalParking fontSize="small" />
                    Parking
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Capacity"
                        value={formData.configuration.parking.capacity}
                        onChange={(e) => handleInputChange('configuration.parking.capacity', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Levels"
                        value={formData.configuration.parking.levels}
                        onChange={(e) => handleInputChange('configuration.parking.levels', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 5 }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Power & Water */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Power Backup"
                    value={formData.configuration.powerBackup}
                    onChange={(e) => handleInputChange('configuration.powerBackup', e.target.value)}
                    placeholder="e.g., 500 KVA Generator"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PowerSettingsNew /></InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Water Supply"
                    value={formData.configuration.waterSupply}
                    onChange={(e) => handleInputChange('configuration.waterSupply', e.target.value)}
                    placeholder="e.g., 24/7 Borewell + Municipal"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Water /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Amenities */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                Tower Amenities
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {COMMON_AMENITIES.map((amenity) => (
                  <Grid item xs={6} sm={4} md={3} key={amenity}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {amenity}
                        </Typography>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Financial Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" />
                Financial Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Construction Budget"
                    type="number"
                    value={formData.financials.constructionCost.budgeted}
                    onChange={(e) => handleInputChange('financials.constructionCost.budgeted', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Actual Construction Cost"
                    type="number"
                    value={formData.financials.constructionCost.actual}
                    onChange={(e) => handleInputChange('financials.constructionCost.actual', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Revenue Target"
                    type="number"
                    value={formData.financials.revenueTarget}
                    onChange={(e) => handleInputChange('financials.revenueTarget', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Revenue Achieved"
                    type="number"
                    value={formData.financials.revenueAchieved}
                    onChange={(e) => handleInputChange('financials.revenueAchieved', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Leave empty for auto-calculation"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Construction Progress */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Construction color="primary" />
                Construction Progress
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Progress Percentage"
                    value={formData.construction.progressPercentage}
                    onChange={(e) => handleInputChange('construction.progressPercentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    inputProps={{ min: 0, max: 100 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Construction Status</InputLabel>
                    <Select
                      value={formData.construction.constructionStatus}
                      onChange={(e) => handleInputChange('construction.constructionStatus', e.target.value)}
                      label="Construction Status"
                    >
                      {CONSTRUCTION_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Planned Completion"
                    type="date"
                    value={formData.construction.plannedCompletionDate}
                    onChange={(e) => handleInputChange('construction.plannedCompletionDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Actual Completion"
                    type="date"
                    value={formData.construction.actualCompletionDate}
                    onChange={(e) => handleInputChange('construction.actualCompletionDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Only set when construction is complete"
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
                  {saving ? 'Updating...' : 'Update Tower'}
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/projects/${validProjectId}/towers/${validTowerId}`)}
                  disabled={saving}
                  startIcon={<Cancel />}
                  fullWidth
                >
                  Cancel Changes
                </Button>

                <Divider sx={{ my: 2 }} />
                
                {/* Quick Stats */}
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Stats:
                  </Typography>
                  <Typography variant="body2">
                    • Current Capacity: {formData.totalFloors * formData.unitsPerFloor || 0} units
                    <br />• Existing Units: {units.length}
                    <br />• Available Slots: {Math.max(0, (formData.totalFloors * formData.unitsPerFloor) - units.length)}
                  </Typography>
                </Alert>

                {/* Tips */}
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quick Tips:
                  </Typography>
                  <Typography variant="body2">
                    • Changes to floors/units require validation
                    • Amenities affect unit pricing automatically
                    • Progress updates trigger notifications
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
        tower={tower}
        unitCount={units.length}
        loading={deleting}
      />
    </Box>
  );
};

export default EditTowerPage;
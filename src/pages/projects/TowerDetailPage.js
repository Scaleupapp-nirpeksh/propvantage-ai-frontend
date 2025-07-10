// File: src/pages/projects/TowerDetailPage.js
// Description: FIXED tower detail page with proper API response handling
// Version: 2.1 - Fixed API response structure handling
// Location: src/pages/projects/TowerDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText as MuiListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Domain,
  Home,
  CheckCircle,
  Warning,
  Block,
  Add,
  Visibility,
  AttachMoney,
  Analytics,
  Settings,
  Download,
  Refresh,
  Timeline,
  People,
  NavigateNext,
  AspectRatio,
  Layers,
  Apartment,
  Business,
  Construction,
  Security,
  Elevator,
  LocalParking,
  PowerSettingsNew,
  Water,
  Assignment,
  AccountBalance,
  Engineering,
  LocationOn,
  Schedule,
  TrendingUp,
  ExpandMore,
  Phone,
  Videocam,
  ElectricalServices,
  SolarPower,
  MailOutline,
  NaturePeople,
  Speed,
  MonetizationOn,
  LocalFireDepartment,
  VerifiedUser,
  Architecture,
  Explore,
  Star,
  Info,
  Bed,
  Bathtub,
  Kitchen,
  Balcony,
  Park,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Utility function to safely extract ID from object or string
const extractId = (value, context = 'unknown') => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id || null;
  return String(value);
};

// Utility function to safely extract data from API response - FIXED VERSION
const extractDataFromResponse = (response, dataType = 'generic') => {
  try {
    console.log(`🔍 Extracting ${dataType} data from response:`, {
      hasResponse: !!response,
      hasData: !!response?.data,
      dataKeys: response?.data ? Object.keys(response.data) : [],
      responseStructure: typeof response?.data
    });

    // Handle different possible response structures
    const responseData = response?.data;
    
    if (!responseData) {
      console.warn(`⚠️ No response data found for ${dataType}`);
      return null;
    }

    // Try different possible structures:
    // 1. Standard: { success: true, data: {...} }
    if (responseData.data && typeof responseData.data === 'object') {
      console.log(`✅ Found ${dataType} in response.data.data`);
      return responseData.data;
    }

    // 2. Direct nested: { tower: {...} } or { project: {...} }
    if (responseData.tower && dataType.includes('tower')) {
      console.log(`✅ Found ${dataType} in response.data.tower`);
      return responseData.tower;
    }

    if (responseData.project && dataType.includes('project')) {
      console.log(`✅ Found ${dataType} in response.data.project`);
      return responseData.project;
    }

    if (responseData.units && dataType.includes('units')) {
      console.log(`✅ Found ${dataType} in response.data.units`);
      return responseData.units;
    }

    // 3. Direct response: { _id: ..., name: ... } (the actual object)
    if (responseData._id || responseData.id) {
      console.log(`✅ Found ${dataType} as direct response object`);
      return responseData;
    }

    // 4. Array response for lists
    if (Array.isArray(responseData)) {
      console.log(`✅ Found ${dataType} as direct array response`);
      return responseData;
    }

    // 5. Success wrapper: { success: true, result: {...} }
    if (responseData.result) {
      console.log(`✅ Found ${dataType} in response.data.result`);
      return responseData.result;
    }

    console.warn(`⚠️ Could not extract ${dataType} from response. Available keys:`, Object.keys(responseData));
    return responseData; // Return as-is as fallback

  } catch (error) {
    console.error(`❌ Error extracting ${dataType} from response:`, error);
    return null;
  }
};

// Utility functions
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount?.toLocaleString() || 0}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available': return 'success';
    case 'sold': return 'error';
    case 'blocked': return 'warning';
    case 'on-hold': return 'info';
    case 'completed': return 'success';
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'in-progress': return 'info';
    case 'rejected': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  const icons = {
    available: CheckCircle,
    sold: Home,
    blocked: Block,
    'on-hold': Warning,
    completed: CheckCircle,
    approved: VerifiedUser,
    pending: Schedule,
    'in-progress': Timeline,
  };
  
  const icon = icons[status?.toLowerCase()];
  return icon || Info || Domain; // Fallback to Info, then Domain if that fails too
};

// Breadcrumb Navigation Component
const TowerBreadcrumbs = ({ project, tower }) => {
  const navigate = useNavigate();

  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
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
        onClick={() => {
          const projectId = extractId(project);
          if (projectId) {
            navigate(`/projects/${projectId}`);
          }
        }}
      >
        {project?.name || 'Project'}
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Domain fontSize="small" />
        {tower?.towerName || tower?.towerCode || `Tower ${tower?._id?.slice(-6) || 'Unknown'}`}
      </Typography>
    </Breadcrumbs>
  );
};

// Enhanced Tower Header Component
const TowerHeader = ({ project, tower, onEdit, onRefresh, isLoading }) => {
  const { canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const constructionProgress = tower?.construction?.progressPercentage || 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <Domain sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {tower?.towerName || tower?.towerCode || `Tower ${tower?._id?.slice(-6) || 'Unknown'}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={tower?.towerCode || 'No Code'} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={tower?.towerType || 'Residential'} 
                  color="info" 
                  size="small"
                />
                <Chip 
                  label={tower?.status || 'Active'} 
                  color={getStatusColor(tower?.status)} 
                  size="small"
                />
                {tower?.metadata?.cornerTower && (
                  <Chip 
                    label="Corner Tower" 
                    color="warning" 
                    size="small"
                    icon={<Star />}
                  />
                )}
                {tower?.metadata?.premiumLocation && (
                  <Chip 
                    label="Premium Location" 
                    color="success" 
                    size="small"
                    icon={<Star />}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Tower Statistics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {tower?.totalFloors || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Floors
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {tower?.unitsPerFloor || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Units/Floor
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {tower?.totalUnits || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Units
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: getProgressColor(constructionProgress) }}>
                {constructionProgress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
            </Grid>
          </Grid>

          {/* Construction Progress Bar */}
          {constructionProgress > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Construction Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {constructionProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={constructionProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: `${getProgressColor(constructionProgress)}.main`,
                  },
                }}
              />
            </Box>
          )}

          {/* Key Dates */}
          {(tower?.construction?.plannedCompletionDate || tower?.construction?.actualCompletionDate) && (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {tower?.construction?.plannedCompletionDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Planned Completion
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower.construction.plannedCompletionDate)}
                  </Typography>
                </Box>
              )}
              {tower?.construction?.actualCompletionDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Actual Completion
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower.construction.actualCompletionDate)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ mr: 1 }}
            >
              Edit Tower
            </Button>
          )}

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Analytics fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Analytics</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Download fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export Details</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Assignment fontSize="small" />
              </ListItemIcon>
              <ListItemText>Generate Report</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// Tower Metrics Component
const TowerMetrics = ({ tower, units, isLoading }) => {
  if (isLoading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={6} md={2} key={i}>
            <Card>
              <CardContent>
                <CircularProgress size={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Calculate metrics from real data
  const totalUnits = units?.length || 0;
  const soldUnits = units?.filter(unit => unit.status === 'sold').length || 0;
  const blockedUnits = units?.filter(unit => unit.status === 'blocked').length || 0;
  const availableUnits = units?.filter(unit => unit.status === 'available').length || 0;
  
  const totalRevenue = units
    ?.filter(unit => unit.status === 'sold')
    .reduce((sum, unit) => sum + (unit.currentPrice || unit.basePrice || 0), 0) || 0;
  
  const averagePrice = totalUnits > 0 
    ? (units?.reduce((sum, unit) => sum + (unit.currentPrice || unit.basePrice || 0), 0) || 0) / totalUnits 
    : 0;
  
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  // Financial metrics from backend
  const revenueTarget = tower?.financials?.revenueTarget || 0;
  const revenueAchieved = tower?.financials?.revenueAchieved || totalRevenue;
  const constructionBudget = tower?.financials?.constructionCost?.budgeted || 0;
  const constructionActual = tower?.financials?.constructionCost?.actual || 0;

  const metrics = [
    {
      title: 'Total Units',
      value: totalUnits,
      subtitle: `${availableUnits} available`,
      color: 'primary',
      icon: Home || Domain,
    },
    {
      title: 'Units Sold',
      value: `${soldUnits} (${salesPercentage}%)`,
      subtitle: `${blockedUnits} blocked`,
      color: 'success',
      icon: CheckCircle || Domain,
    },
    {
      title: 'Revenue Achieved',
      value: formatCurrency(revenueAchieved),
      subtitle: revenueTarget > 0 ? `of ${formatCurrency(revenueTarget)} target` : 'No target set',
      color: 'warning',
      icon: AttachMoney || Domain,
    },
    {
      title: 'Avg Unit Price',
      value: formatCurrency(averagePrice),
      subtitle: 'Current market rate',
      color: 'info',
      icon: MonetizationOn || Domain,
    },
    {
      title: 'Construction Budget',
      value: formatCurrency(constructionBudget),
      subtitle: constructionActual > 0 ? `${formatCurrency(constructionActual)} spent` : 'Budget allocated',
      color: 'secondary',
      icon: Construction || Domain,
    },
    {
      title: 'Progress',
      value: `${tower?.construction?.progressPercentage || 0}%`,
      subtitle: 'Construction complete',
      color: getStatusColor(tower?.construction?.progressPercentage >= 100 ? 'completed' : 'in-progress'),
      icon: Engineering || Domain,
    },
  ];

  // Debug which icons might be undefined
  console.log('🔍 Icon validation:', {
    Home: !!Home,
    CheckCircle: !!CheckCircle,
    AttachMoney: !!AttachMoney,
    MonetizationOn: !!MonetizationOn,
    Construction: !!Construction,
    Engineering: !!Engineering,
    Domain: !!Domain
  });

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {metrics.map((metric, index) => (
        <Grid item xs={6} md={2} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${metric.color}.100`,
                    color: `${metric.color}.700`,
                    width: 36,
                    height: 36,
                    mr: 1,
                  }}
                >
                  {metric.icon && <metric.icon sx={{ fontSize: 20 }} />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {metric.title}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {metric.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Comprehensive Tower Configuration Component
const TowerConfiguration = ({ tower }) => {
  // Safe access to nested properties
  const configuration = tower?.configuration || {};
  const amenities = tower?.amenities || {};
  const pricingConfiguration = tower?.pricingConfiguration || {};
  const construction = tower?.construction || {};
  const financials = tower?.financials || {};
  const approvals = tower?.approvals || {};
  const metadata = tower?.metadata || {};

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                Basic Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tower Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.towerName || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tower Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.towerCode || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tower Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.towerType || 'Residential (default)'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={tower?.status || 'Active'} 
                    color={getStatusColor(tower?.status)} 
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Floors</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.totalFloors || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Units Per Floor</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.unitsPerFloor || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Units</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower?.totalUnits || 'Calculated from floors × units/floor'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Building Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                Building Configuration
              </Typography>
              <Stack spacing={2}>
                {/* Elevators */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Elevator fontSize="small" />
                    Elevators
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {configuration?.elevators?.count || 0} units
                    {configuration?.elevators?.type && ` (${configuration.elevators.type})`}
                  </Typography>
                </Box>

                {/* Staircases */}
                <Box>
                  <Typography variant="body2" color="text.secondary">Staircases</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {configuration?.staircases?.count || 0} units
                    {configuration?.staircases?.type && ` (${configuration.staircases.type})`}
                  </Typography>
                </Box>

                {/* Power Backup */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PowerSettingsNew fontSize="small" />
                    Power Backup
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {configuration?.powerBackup || 'Not specified'}
                  </Typography>
                </Box>

                {/* Water Supply */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Water fontSize="small" />
                    Water Supply
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {configuration?.waterSupply || 'Not specified'}
                  </Typography>
                </Box>

                {/* Parking */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalParking fontSize="small" />
                    Parking
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {configuration?.parking?.capacity || 0} spaces
                    {configuration?.parking?.levels && ` across ${configuration.parking.levels} levels`}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Amenities */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                Tower Amenities
              </Typography>
              
              <Grid container spacing={2}>
                {/* Core Amenities */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Security & Safety
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <Security fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Security" 
                        secondary={amenities?.security || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Videocam fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="CCTV" 
                        secondary={amenities?.cctv || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <LocalFireDepartment fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Fire Safety" 
                        secondary="As per building code" 
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Infrastructure
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ElectricalServices fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Generator" 
                        secondary={amenities?.generator || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Water fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Water Tank" 
                        secondary={amenities?.waterTank || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Intercom" 
                        secondary={amenities?.intercom || 'Not specified'} 
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Environment & Utilities
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <SolarPower fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Solar Panels" 
                        secondary={amenities?.solarPanels || 'Not installed'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <NaturePeople fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Rainwater Harvesting" 
                        secondary={amenities?.rainwaterHarvesting || 'Not available'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Engineering fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Sewage Treatment" 
                        secondary={amenities?.sewageTreatment || 'Connected to main'} 
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Convenience
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <MailOutline fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Mailbox" 
                        secondary={amenities?.mailbox || 'Available'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Lobby" 
                        secondary={amenities?.lobby || 'Standard'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" />
                Financial Overview
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Construction Budget</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(financials?.constructionCost?.budgeted)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Actual Construction Cost</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(financials?.constructionCost?.actual) || 'In progress'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Revenue Target</Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(financials?.revenueTarget)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Revenue Achieved</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(financials?.revenueAchieved) || 'Calculating...'}
                  </Typography>
                </Box>
                {financials?.revenueTarget > 0 && financials?.revenueAchieved > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Revenue Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((financials.revenueAchieved / financials.revenueTarget) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {Math.round((financials.revenueAchieved / financials.revenueTarget) * 100)}% of target achieved
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Construction Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Construction color="primary" />
                Construction Details
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Progress Percentage</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {construction?.progressPercentage || 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={construction?.progressPercentage || 0}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Planned Completion</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(construction?.plannedCompletionDate)}
                  </Typography>
                </Box>
                {construction?.actualCompletionDate && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Actual Completion</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(construction.actualCompletionDate)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Approvals Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" />
                Approvals Status
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Building Plan Approval</Typography>
                  <Chip 
                    label={approvals?.buildingPlan?.status || 'Pending'} 
                    color={getStatusColor(approvals?.buildingPlan?.status)} 
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Fire NOC</Typography>
                  <Chip 
                    label={approvals?.fireNOC?.status || 'Pending'} 
                    color={getStatusColor(approvals?.fireNOC?.status)} 
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Elevator Certificate</Typography>
                  <Chip 
                    label={approvals?.elevatorCertificate?.status || 'Pending'} 
                    color={getStatusColor(approvals?.elevatorCertificate?.status)} 
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Metadata & Additional Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Architecture color="primary" />
                Additional Information
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Architect</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {metadata?.architect || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Facing Direction</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Explore fontSize="small" color="action" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {metadata?.facingDirection || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {metadata?.cornerTower && (
                    <Chip 
                      label="Corner Tower" 
                      color="warning" 
                      size="small"
                      icon={<LocationOn />}
                    />
                  )}
                  {metadata?.premiumLocation && (
                    <Chip 
                      label="Premium Location" 
                      color="success" 
                      size="small"
                      icon={<Star />}
                    />
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Created Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower?.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower?.updatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pricing Configuration */}
      {pricingConfiguration && Object.keys(pricingConfiguration).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonetizationOn color="primary" />
              Pricing Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Base Price Modifier</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {pricingConfiguration.basePriceModifier ? 
                      `${pricingConfiguration.basePriceModifier > 0 ? '+' : ''}${pricingConfiguration.basePriceModifier}%` : 
                      'Standard'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Floor Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {pricingConfiguration.floorPremium?.premiumPerFloor ? 
                      `₹${pricingConfiguration.floorPremium.premiumPerFloor}/floor from ${pricingConfiguration.floorPremium.startFloor}F` : 
                      'None'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Penthouse Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {pricingConfiguration.penthousePremium?.enabled ? 
                      `${pricingConfiguration.penthousePremium.premiumPercentage}% for top ${pricingConfiguration.penthousePremium.topFloors} floors` : 
                      'Not applicable'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Corner Unit Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {pricingConfiguration.cornerUnitPremium?.percentage ? 
                      `${pricingConfiguration.cornerUnitPremium.percentage}%` : 
                      'Standard pricing'
                    }
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Enhanced Units Grid Component using the new EnhancedUnitCard
const UnitsGrid = ({ units, viewMode, onAddUnit, projectId, towerId }) => {
  const { canAccess } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [displayMode, setDisplayMode] = useState('default'); // 'default' | 'detailed' | 'compact'

  const safeUnits = units || [];
  const filteredUnits = selectedStatus === 'all' 
    ? safeUnits 
    : safeUnits.filter(unit => unit.status === selectedStatus);

  const floors = [...new Set(safeUnits.map(unit => unit.floor))]
    .filter(floor => floor !== undefined && floor !== null)
    .sort((a, b) => b - a);

  const statusCounts = {
    all: safeUnits.length,
    available: safeUnits.filter(unit => unit.status === 'available').length,
    sold: safeUnits.filter(unit => unit.status === 'sold').length,
    blocked: safeUnits.filter(unit => unit.status === 'blocked').length,
  };

  // Enhanced Unit Card component that uses all backend fields
  const EnhancedUnitCard = ({ unit }) => {
    const navigate = useNavigate();
    const StatusIcon = getStatusIcon(unit?.status);

    const handleClick = () => {
      const validProjectId = projectId;
      const validTowerId = towerId;
      const validUnitId = unit._id || unit.id;
      
      if (validProjectId && validTowerId && validUnitId) {
        navigate(`/projects/${validProjectId}/towers/${validTowerId}/units/${validUnitId}`);
      }
    };

    const pricePerSqFt = unit?.basePrice && unit?.areaSqft 
      ? Math.round(unit.basePrice / unit.areaSqft) 
      : 0;

    if (displayMode === 'compact') {
      return (
        <Card 
          sx={{ 
            height: 120,
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 2,
            borderColor: `${getStatusColor(unit?.status)}.main`,
            '&:hover': { 
              boxShadow: 4,
              transform: 'scale(1.02)',
            },
          }}
          onClick={handleClick}
        >
          <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {unit?.unitNumber || 'Unit'}
              </Typography>
              <Chip 
                icon={<StatusIcon sx={{ fontSize: 12 }} />}
                label={unit?.status || 'Unknown'}
                size="small"
                color={getStatusColor(unit?.status)}
                sx={{ fontSize: '0.7rem', height: 18 }}
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              {unit?.type || 'Type'} • Floor {unit?.floor || 'N/A'}
            </Typography>
            
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              {unit?.areaSqft || 0} sq ft
            </Typography>
            
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {formatCurrency(unit?.currentPrice || unit?.basePrice)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (displayMode === 'detailed') {
      return (
        <Card 
          sx={{ 
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 1,
            borderColor: `${getStatusColor(unit?.status)}.main`,
            '&:hover': { 
              boxShadow: 6,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={handleClick}
        >
          <CardContent sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {unit?.unitNumber || 'Unit'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unit?.type || 'Type'} • Floor {unit?.floor || 'N/A'}
                </Typography>
              </Box>
              <Chip 
                icon={<StatusIcon sx={{ fontSize: 14 }} />}
                label={unit?.status || 'Unknown'}
                color={getStatusColor(unit?.status)}
                size="small"
              />
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Area
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {unit?.areaSqft || 0} sq ft
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(unit?.basePrice)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Room Details */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {unit?.specifications?.bedrooms && (
                <Chip 
                  icon={<Bed />} 
                  label={`${unit.specifications.bedrooms}BR`} 
                  size="small" 
                  variant="outlined"
                />
              )}
              {unit?.specifications?.bathrooms && (
                <Chip 
                  icon={<Bathtub />} 
                  label={`${unit.specifications.bathrooms}BA`} 
                  size="small" 
                  variant="outlined"
                />
              )}
              {((unit?.parking?.covered || 0) + (unit?.parking?.open || 0)) > 0 && (
                <Chip 
                  icon={<LocalParking />} 
                  label={`${(unit?.parking?.covered || 0) + (unit?.parking?.open || 0)}P`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>

            {/* Features */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {unit?.features?.isCornerUnit && (
                <Chip icon={<Star />} label="Corner" size="small" color="warning" variant="outlined" />
              )}
              {unit?.features?.hasBalcony && (
                <Chip icon={<Balcony />} label="Balcony" size="small" color="info" variant="outlined" />
              )}
              {unit?.features?.isParkFacing && (
                <Chip icon={<Park />} label="Park View" size="small" color="success" variant="outlined" />
              )}
            </Box>

            {/* Possession Status */}
            {unit?.possession?.handoverStatus && (
              <Chip 
                label={`${unit.possession.handoverStatus.replace('-', ' ').toUpperCase()}`}
                color={getHandoverStatusColor(unit.possession.handoverStatus)}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            )}

            {/* Pricing Details */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Base Price
                </Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(unit?.basePrice)}
                </Typography>
              </Box>
              {pricePerSqFt > 0 && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Per Sq Ft
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    ₹{pricePerSqFt.toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      );
    }

    // Default variant
    return (
      <Card 
        sx={{ 
          height: 180,
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: 2,
          borderColor: `${getStatusColor(unit?.status)}.main`,
          '&:hover': { 
            boxShadow: 4,
            transform: 'scale(1.02)',
          },
        }}
        onClick={handleClick}
      >
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {unit?.unitNumber || 'Unit'}
            </Typography>
            <Chip 
              icon={<StatusIcon sx={{ fontSize: 14 }} />}
              label={unit?.status || 'Unknown'}
              size="small"
              color={getStatusColor(unit?.status)}
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          </Box>
          
          {/* Unit Details */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {unit?.type || 'Type'} • Floor {unit?.floor || 'N/A'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {unit?.areaSqft || 0} sq ft • {unit?.facing || 'N/A'} facing
          </Typography>
          
          {/* Room Configuration */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {unit?.specifications?.bedrooms && (
              <Chip 
                icon={<Bed />} 
                label={`${unit.specifications.bedrooms}BR`} 
                size="small" 
                variant="outlined"
              />
            )}
            {unit?.specifications?.bathrooms && (
              <Chip 
                icon={<Bathtub />} 
                label={`${unit.specifications.bathrooms}BA`} 
                size="small" 
                variant="outlined"
              />
            )}
            {((unit?.parking?.covered || 0) + (unit?.parking?.open || 0)) > 0 && (
              <Chip 
                icon={<LocalParking />} 
                label={`${(unit?.parking?.covered || 0) + (unit?.parking?.open || 0)}P`} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>

          {/* Features */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
            {unit?.features?.isCornerUnit && <Star sx={{ fontSize: 14, color: 'warning.main' }} />}
            {unit?.features?.hasBalcony && <Balcony sx={{ fontSize: 14, color: 'info.main' }} />}
            {unit?.features?.isParkFacing && <Park sx={{ fontSize: 14, color: 'success.main' }} />}
            {unit?.features?.hasStudyRoom && <Home sx={{ fontSize: 14, color: 'secondary.main' }} />}
          </Box>
          
          {/* Pricing */}
          <Box sx={{ mt: 'auto' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {formatCurrency(unit?.currentPrice || unit?.basePrice)}
            </Typography>
            {pricePerSqFt > 0 && (
              <Typography variant="caption" color="text.secondary">
                ₹{pricePerSqFt.toLocaleString()}/sq ft
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const getHandoverStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'handed-over': return 'success';
      case 'ready': return 'info';
      case 'delayed': return 'error';
      case 'not-ready': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tower Units ({safeUnits.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'floor' ? 'Floor-wise view' : 'Grid view'} • {displayMode} cards
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Display Mode Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Card Type</InputLabel>
            <Select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
              label="Card Type"
            >
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="default">Standard</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddUnit}
            >
              Add Units
            </Button>
          )}
        </Box>
      </Box>

      {/* Status Filter Chips */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`All (${statusCounts.all})`}
            onClick={() => setSelectedStatus('all')}
            color={selectedStatus === 'all' ? 'primary' : 'default'}
            variant={selectedStatus === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Available (${statusCounts.available})`}
            onClick={() => setSelectedStatus('available')}
            color={selectedStatus === 'available' ? 'success' : 'default'}
            variant={selectedStatus === 'available' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Sold (${statusCounts.sold})`}
            onClick={() => setSelectedStatus('sold')}
            color={selectedStatus === 'sold' ? 'error' : 'default'}
            variant={selectedStatus === 'sold' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Blocked (${statusCounts.blocked})`}
            onClick={() => setSelectedStatus('blocked')}
            color={selectedStatus === 'blocked' ? 'warning' : 'default'}
            variant={selectedStatus === 'blocked' ? 'filled' : 'outlined'}
          />
        </Stack>
      </Box>

      {/* Enhanced Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
              {Math.round((statusCounts.sold / statusCounts.all) * 100) || 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sold
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
            <Typography variant="h6" color="info.main" sx={{ fontWeight: 700 }}>
              {filteredUnits.reduce((sum, unit) => sum + (unit?.specifications?.bedrooms || 0), 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Bedrooms
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
            <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
              {filteredUnits.reduce((sum, unit) => sum + ((unit?.parking?.covered || 0) + (unit?.parking?.open || 0)), 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Parking Spaces
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.50' }}>
            <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 700 }}>
              {filteredUnits.filter(unit => unit?.features?.isParkFacing).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Park Facing
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {filteredUnits.length > 0 ? (
        viewMode === 'floor' ? (
          <Box>
            {floors.map((floor) => {
              const floorUnits = filteredUnits.filter(unit => unit.floor === floor);
              if (floorUnits.length === 0) return null;

              return (
                <Paper key={floor} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.700', width: 40, height: 40 }}>
                      <Layers />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Floor {floor}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {floorUnits.length} units • {floorUnits.filter(u => u.status === 'available').length} available
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={displayMode === 'detailed' ? 3 : displayMode === 'compact' ? 1 : 2}>
                    {floorUnits
                      .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''))
                      .map((unit) => (
                        <Grid 
                          item 
                          xs={displayMode === 'detailed' ? 12 : displayMode === 'compact' ? 4 : 6} 
                          sm={displayMode === 'detailed' ? 6 : displayMode === 'compact' ? 3 : 4} 
                          md={displayMode === 'detailed' ? 4 : displayMode === 'compact' ? 2 : 3} 
                          lg={displayMode === 'detailed' ? 3 : displayMode === 'compact' ? 2 : 2} 
                          key={unit._id}
                        >
                          <EnhancedUnitCard unit={unit} />
                        </Grid>
                      ))}
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <Grid container spacing={displayMode === 'detailed' ? 3 : displayMode === 'compact' ? 1 : 2}>
            {filteredUnits
              .sort((a, b) => {
                if (a.floor !== b.floor) {
                  return (b.floor || 0) - (a.floor || 0);
                }
                return (a.unitNumber || '').localeCompare(b.unitNumber || '');
              })
              .map((unit) => (
                <Grid 
                  item 
                  xs={displayMode === 'detailed' ? 12 : displayMode === 'compact' ? 4 : 6} 
                  sm={displayMode === 'detailed' ? 6 : displayMode === 'compact' ? 3 : 4} 
                  md={displayMode === 'detailed' ? 4 : displayMode === 'compact' ? 2 : 3} 
                  lg={displayMode === 'detailed' ? 3 : displayMode === 'compact' ? 2 : 2} 
                  key={unit._id}
                >
                  <EnhancedUnitCard unit={unit} />
                </Grid>
              ))}
          </Grid>
        )
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Home sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {selectedStatus === 'all' ? 'No units found' : `No ${selectedStatus} units`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {selectedStatus === 'all' 
              ? 'Start by adding units to this tower'
              : `Try selecting a different status filter`
            }
          </Typography>
          {canAccess.projectManagement() && selectedStatus === 'all' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddUnit}
            >
              Add First Unit
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Main Tower Detail Page Component
const TowerDetailPage = () => {
  const { projectId, towerId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('floor');

  // Fetch tower data
  useEffect(() => {
    if (projectId && towerId) {
      fetchTowerData();
    }
  }, [projectId, towerId]);

  const fetchTowerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const validProjectId = extractId(projectId, 'fetchTowerData projectId');
      const validTowerId = extractId(towerId, 'fetchTowerData towerId');

      console.log('🔄 Fetching comprehensive tower data for:', {
        projectId: validProjectId,
        towerId: validTowerId
      });

      // Fetch project details
      console.log('📋 Fetching project details...');
      const projectResponse = await projectAPI.getProject(validProjectId);
      const projectData = extractDataFromResponse(projectResponse, 'project data');

      // Fetch tower details with enhanced error handling
      console.log('🏗️ Fetching tower details...');
      const towerResponse = await towerAPI.getTower(validTowerId);
      
      // Enhanced tower data extraction with detailed debugging
      console.log('🔍 Raw tower response structure:', {
        hasData: !!towerResponse?.data,
        dataKeys: towerResponse?.data ? Object.keys(towerResponse.data) : [],
        dataType: typeof towerResponse?.data,
        fullResponse: towerResponse?.data
      });
      
      let towerData = null;
      const responseData = towerResponse?.data;
      
      // Step-by-step extraction with detailed logging
      console.log('🔄 Starting tower data extraction...');
      console.log('   responseData:', responseData);
      console.log('   responseData keys:', responseData ? Object.keys(responseData) : 'No keys');
      
      if (responseData?.tower && typeof responseData.tower === 'object') {
        // Handle nested tower response: { tower: {...} }
        towerData = responseData.tower;
        console.log('✅ Extracted tower from nested response');
        console.log('   Extracted tower keys:', Object.keys(towerData));
        console.log('   Tower ID check:', {
          '_id': towerData._id,
          'id': towerData.id,
          'towerName': towerData.towerName
        });
      } else if (responseData?.data && typeof responseData.data === 'object') {
        // Handle standard response: { data: {...} }
        towerData = responseData.data;
        console.log('✅ Extracted tower from standard response');
      } else if (responseData?._id || responseData?.id) {
        // Handle direct tower response
        towerData = responseData;
        console.log('✅ Using direct tower response');
      } else {
        console.warn('⚠️ Unexpected response structure, using fallback');
        console.log('   Available keys in responseData:', responseData ? Object.keys(responseData) : 'None');
        towerData = responseData;
      }
      
      console.log('🔍 Final extracted towerData:', towerData);
      console.log('🔍 Final towerData keys:', towerData ? Object.keys(towerData) : 'No keys');

      // CRITICAL FIX: Handle the nested tower structure that we're definitely getting
      if (towerData && typeof towerData === 'object' && 'tower' in towerData) {
        console.log('🚨 CRITICAL FIX: Detected nested tower - extracting now!');
        console.log('   Before extraction - keys:', Object.keys(towerData));
        towerData = towerData.tower;
        console.log('   After extraction - keys:', Object.keys(towerData));
        console.log('   Extracted tower ID:', towerData._id || towerData.id);
        console.log('   Extracted tower name:', towerData.towerName);
      }

      // Debug the complete tower data structure
      console.log('🔍 Complete tower data extracted:', towerData);
      console.log('🔍 Tower data structure analysis:', {
        isObject: typeof towerData === 'object',
        isNull: towerData === null,
        hasId: !!(towerData?._id || towerData?.id),
        towerId: towerData?._id || towerData?.id || 'No ID found',
        hasBasicFields: !!(towerData?.towerName || towerData?.towerCode),
        configuration: !!towerData?.configuration,
        amenities: !!towerData?.amenities,
        pricingConfiguration: !!towerData?.pricingConfiguration,
        construction: !!towerData?.construction,
        financials: !!towerData?.financials,
        approvals: !!towerData?.approvals,
        metadata: !!towerData?.metadata,
        allKeys: towerData ? Object.keys(towerData) : ['No keys - null data']
      });

      // Fetch units for this tower
      console.log('🏠 Fetching units for tower...');
      const unitsResponse = await unitAPI.getUnits({ tower: validTowerId });
      const unitsData = extractDataFromResponse(unitsResponse, 'units data') || [];

      // Enhanced tower data validation with direct extraction fix
      console.log('🔍 DETAILED Tower data validation:');
      console.log('   Raw towerData:', towerData);
      console.log('   Type of towerData:', typeof towerData);
      console.log('   Is null?', towerData === null);
      console.log('   Is undefined?', towerData === undefined);
      console.log('   All keys:', towerData ? Object.keys(towerData) : 'No keys available');
      
      // DIRECT FIX: If we still have nested tower structure, extract it here
      if (towerData && typeof towerData === 'object' && towerData.tower && typeof towerData.tower === 'object') {
        console.log('🔧 FIXING: Detected nested tower structure, extracting...');
        towerData = towerData.tower;
        console.log('   ✅ Extracted tower data:', towerData);
        console.log('   ✅ New keys:', Object.keys(towerData));
      }
      
      console.log('   All values sample:', towerData ? Object.entries(towerData).slice(0, 5) : 'No values');
      
      if (!towerData) {
        console.error('❌ Tower data is null or undefined');
        throw new Error('No tower data received from API');
      }
      
      if (typeof towerData !== 'object') {
        console.error('❌ Tower data is not an object:', typeof towerData, towerData);
        throw new Error('Invalid tower data format received from API');
      }
      
      // More flexible ID extraction - try multiple possible field names
      const extractedTowerId = towerData._id || 
                              towerData.id || 
                              towerData.towerId || 
                              towerData.tower_id ||
                              towerData.objectId ||
                              null;
      
      console.log('🔍 ID field analysis:', {
        '_id': towerData._id,
        'id': towerData.id,
        'towerId': towerData.towerId,
        'tower_id': towerData.tower_id,
        'objectId': towerData.objectId,
        'extractedTowerId': extractedTowerId
      });
      
      if (!extractedTowerId) {
        console.error('❌ Tower missing ID field - detailed analysis:', {
          hasIdField: '_id' in towerData,
          hasIdAlt: 'id' in towerData,
          hasTowerId: 'towerId' in towerData,
          hasSnakeCase: 'tower_id' in towerData,
          hasObjectId: 'objectId' in towerData,
          allKeys: Object.keys(towerData),
          dataStructure: {
            towerName: towerData.towerName,
            towerCode: towerData.towerCode,
            project: towerData.project,
            totalFloors: towerData.totalFloors,
            status: towerData.status
          },
          possibleIdFields: Object.keys(towerData).filter(key => 
            key.toLowerCase().includes('id') || 
            key.toLowerCase().includes('_id') ||
            key === 'pk'
          )
        });
        
        // Instead of throwing an error, let's try to use the tower data anyway
        // Maybe the backend is using a different identifier or this is a created-but-not-saved object
        console.warn('⚠️ Proceeding without ID validation - using tower data as-is');
        
        // Check if we have at least basic tower information
        if (!towerData.towerName && !towerData.towerCode && !towerData.project && !towerData.totalFloors) {
          console.error('❌ No basic tower fields found:', {
            towerName: towerData.towerName,
            towerCode: towerData.towerCode,
            project: towerData.project,
            totalFloors: towerData.totalFloors,
            allFields: Object.keys(towerData)
          });
          throw new Error('Tower data appears to be invalid - missing both ID and basic fields');
        }
        
        console.log('✅ Continuing with tower data (no ID but has basic fields)');
      } else {
        console.log('✅ Tower data validation passed:', {
          id: extractedTowerId,
          name: towerData.towerName || 'Unnamed',
          code: towerData.towerCode || 'No code'
        });
      }

      console.log('✅ Comprehensive tower data loaded successfully:', {
        project: projectData?.name || 'Unknown Project',
        tower: {
          id: towerData._id || towerData.id,
          name: towerData.towerName || 'Unnamed Tower',
          code: towerData.towerCode || 'No Code',
          hasConfiguration: !!towerData.configuration,
          hasAmenities: !!towerData.amenities,
          hasFinancials: !!towerData.financials,
          hasPricing: !!towerData.pricingConfiguration
        },
        unitsCount: Array.isArray(unitsData) ? unitsData.length : 0
      });

      setProject(projectData);
      setTower(towerData);
      setUnits(Array.isArray(unitsData) ? unitsData : []);

    } catch (error) {
      console.error('❌ Error fetching tower data:', error);
      setError(`Failed to load tower details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const validProjectId = extractId(projectId, 'handleEdit projectId');
    const validTowerId = extractId(towerId, 'handleEdit towerId');
    navigate(`/projects/${validProjectId}/towers/${validTowerId}/edit`);
  };
  
  const handleAddUnit = () => {
    const validProjectId = extractId(projectId, 'handleAddUnit projectId');
    const validTowerId = extractId(towerId, 'handleAddUnit towerId');
    navigate(`/projects/${validProjectId}/towers/${validTowerId}/units/create`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
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
        Tower not found or failed to load
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <TowerBreadcrumbs project={project} tower={tower} />

      {/* Data Quality Alert */}
      {tower && (!tower.towerName && !tower.towerCode) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Incomplete Tower Data Detected
          </Typography>
          <Typography variant="body2">
            This tower is missing some basic information (name/code). Please update the tower details to improve data quality.
          </Typography>
        </Alert>
      )}

      {/* Tower Header */}
      <TowerHeader
        project={project}
        tower={tower}
        onEdit={handleEdit}
        onRefresh={fetchTowerData}
        isLoading={loading}
      />

      {/* Tower Metrics */}
      <TowerMetrics
        tower={tower}
        units={units}
        isLoading={false}
      />

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Units (${units?.length || 0})`} />
            <Tab label="Configuration" />
            <Tab label="Analytics" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Button
                variant={viewMode === 'floor' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('floor')}
                sx={{ mr: 1 }}
              >
                Floor View
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('grid')}
              >
                Grid View
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {(!units || units.length === 0) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                No Units Found
              </Typography>
              <Typography variant="body2">
                This tower has no units. This could be because:
                <br />• Units haven't been created yet
                <br />• Units are not properly linked to this tower
                <br />• There's a data synchronization issue
              </Typography>
            </Alert>
          )}
          <UnitsGrid
            units={units}
            viewMode={viewMode}
            onAddUnit={handleAddUnit}
            projectId={projectId}
            towerId={towerId}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <TowerConfiguration tower={tower} />
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Advanced Tower Analytics Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed analytics including sales trends, revenue analysis, and performance metrics
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TowerDetailPage;
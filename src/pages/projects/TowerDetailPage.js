// File: src/pages/projects/TowerDetailPage.js
// Description: COMPREHENSIVE tower detail page showing ALL backend data fields
// Version: 2.0 - Complete tower management with all 54+ fields from backend
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
  switch (status?.toLowerCase()) {
    case 'available': return CheckCircle;
    case 'sold': return Home;
    case 'blocked': return Block;
    case 'on-hold': return Warning;
    case 'completed': return CheckCircle;
    case 'approved': return VerifiedUser;
    case 'pending': return Schedule;
    case 'in-progress': return Timeline;
    default: return Info;
  }
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

  const constructionProgress = tower.construction?.progressPercentage || 0;

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
                {tower.towerName || tower.towerCode || `Tower ${tower._id?.slice(-6) || 'Unknown'}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={tower.towerCode || 'No Code'} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={tower.towerType || 'Residential'} 
                  color="info" 
                  size="small"
                />
                <Chip 
                  label={tower.status || 'Active'} 
                  color={getStatusColor(tower.status)} 
                  size="small"
                />
                {tower.metadata?.cornerTower && (
                  <Chip 
                    label="Corner Tower" 
                    color="warning" 
                    size="small"
                    icon={<Star />}
                  />
                )}
                {tower.metadata?.premiumLocation && (
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
                {tower.totalFloors || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Floors
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {tower.unitsPerFloor || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Units/Floor
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {tower.totalUnits || 0}
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
          {(tower.construction?.plannedCompletionDate || tower.construction?.actualCompletionDate) && (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {tower.construction?.plannedCompletionDate && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Planned Completion
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower.construction.plannedCompletionDate)}
                  </Typography>
                </Box>
              )}
              {tower.construction?.actualCompletionDate && (
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
  const totalUnits = units.length;
  const soldUnits = units.filter(unit => unit.status === 'sold').length;
  const blockedUnits = units.filter(unit => unit.status === 'blocked').length;
  const availableUnits = units.filter(unit => unit.status === 'available').length;
  
  const totalRevenue = units
    .filter(unit => unit.status === 'sold')
    .reduce((sum, unit) => sum + (unit.currentPrice || unit.basePrice || 0), 0);
  
  const averagePrice = units.length > 0 
    ? units.reduce((sum, unit) => sum + (unit.currentPrice || unit.basePrice || 0), 0) / units.length 
    : 0;
  
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  // Financial metrics from backend
  const revenueTarget = tower.financials?.revenueTarget || 0;
  const revenueAchieved = tower.financials?.revenueAchieved || totalRevenue;
  const constructionBudget = tower.financials?.constructionCost?.budgeted || 0;
  const constructionActual = tower.financials?.constructionCost?.actual || 0;

  const metrics = [
    {
      title: 'Total Units',
      value: totalUnits,
      subtitle: `${availableUnits} available`,
      color: 'primary',
      icon: Home,
    },
    {
      title: 'Units Sold',
      value: `${soldUnits} (${salesPercentage}%)`,
      subtitle: `${blockedUnits} blocked`,
      color: 'success',
      icon: CheckCircle,
    },
    {
      title: 'Revenue Achieved',
      value: formatCurrency(revenueAchieved),
      subtitle: revenueTarget > 0 ? `of ${formatCurrency(revenueTarget)} target` : 'No target set',
      color: 'warning',
      icon: AttachMoney,
    },
    {
      title: 'Avg Unit Price',
      value: formatCurrency(averagePrice),
      subtitle: 'Current market rate',
      color: 'info',
      icon: MonetizationOn,
    },
    {
      title: 'Construction Budget',
      value: formatCurrency(constructionBudget),
      subtitle: constructionActual > 0 ? `${formatCurrency(constructionActual)} spent` : 'Budget allocated',
      color: 'secondary',
      icon: Construction,
    },
    {
      title: 'Progress',
      value: `${tower.construction?.progressPercentage || 0}%`,
      subtitle: 'Construction complete',
      color: getStatusColor(tower.construction?.progressPercentage >= 100 ? 'completed' : 'in-progress'),
      icon: Engineering,
    },
  ];

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
                  <metric.icon sx={{ fontSize: 20 }} />
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
                    {tower.towerName || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tower Code</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.towerCode || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tower Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.towerType || 'Residential (default)'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={tower.status || 'Active'} 
                    color={getStatusColor(tower.status)} 
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Floors</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.totalFloors || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Units Per Floor</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.unitsPerFloor || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Units</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.totalUnits || 'Calculated from floors × units/floor'}
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
                    {tower.configuration?.elevators?.count || 0} units
                    {tower.configuration?.elevators?.type && ` (${tower.configuration.elevators.type})`}
                  </Typography>
                </Box>

                {/* Staircases */}
                <Box>
                  <Typography variant="body2" color="text.secondary">Staircases</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.configuration?.staircases?.count || 0} units
                    {tower.configuration?.staircases?.type && ` (${tower.configuration.staircases.type})`}
                  </Typography>
                </Box>

                {/* Power Backup */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PowerSettingsNew fontSize="small" />
                    Power Backup
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.configuration?.powerBackup || 'Not specified'}
                  </Typography>
                </Box>

                {/* Water Supply */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Water fontSize="small" />
                    Water Supply
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.configuration?.waterSupply || 'Not specified'}
                  </Typography>
                </Box>

                {/* Parking */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalParking fontSize="small" />
                    Parking
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.configuration?.parking?.capacity || 0} spaces
                    {tower.configuration?.parking?.levels && ` across ${tower.configuration.parking.levels} levels`}
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
                        secondary={tower.amenities?.security || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Videocam fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="CCTV" 
                        secondary={tower.amenities?.cctv || 'Not specified'} 
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
                        secondary={tower.amenities?.generator || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Water fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Water Tank" 
                        secondary={tower.amenities?.waterTank || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Intercom" 
                        secondary={tower.amenities?.intercom || 'Not specified'} 
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
                        secondary={tower.amenities?.solarPanels || 'Not installed'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <NaturePeople fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Rainwater Harvesting" 
                        secondary={tower.amenities?.rainwaterHarvesting || 'Not available'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Engineering fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Sewage Treatment" 
                        secondary={tower.amenities?.sewageTreatment || 'Connected to main'} 
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
                        secondary={tower.amenities?.mailbox || 'Available'} 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <MuiListItemText 
                        primary="Lobby" 
                        secondary={tower.amenities?.lobby || 'Standard'} 
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
                    {formatCurrency(tower.financials?.constructionCost?.budgeted)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Actual Construction Cost</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(tower.financials?.constructionCost?.actual) || 'In progress'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Revenue Target</Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(tower.financials?.revenueTarget)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Revenue Achieved</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(tower.financials?.revenueAchieved) || 'Calculating...'}
                  </Typography>
                </Box>
                {tower.financials?.revenueTarget > 0 && tower.financials?.revenueAchieved > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Revenue Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((tower.financials.revenueAchieved / tower.financials.revenueTarget) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {Math.round((tower.financials.revenueAchieved / tower.financials.revenueTarget) * 100)}% of target achieved
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
                      {tower.construction?.progressPercentage || 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={tower.construction?.progressPercentage || 0}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Planned Completion</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower.construction?.plannedCompletionDate)}
                  </Typography>
                </Box>
                {tower.construction?.actualCompletionDate && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Actual Completion</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(tower.construction?.actualCompletionDate)}
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
                    label={tower.approvals?.buildingPlan?.status || 'Pending'} 
                    color={getStatusColor(tower.approvals?.buildingPlan?.status)} 
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Fire NOC</Typography>
                  <Chip 
                    label={tower.approvals?.fireNOC?.status || 'Pending'} 
                    color={getStatusColor(tower.approvals?.fireNOC?.status)} 
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Elevator Certificate</Typography>
                  <Chip 
                    label={tower.approvals?.elevatorCertificate?.status || 'Pending'} 
                    color={getStatusColor(tower.approvals?.elevatorCertificate?.status)} 
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
                    {tower.metadata?.architect || 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Facing Direction</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Explore fontSize="small" color="action" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {tower.metadata?.facingDirection || 'Not specified'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {tower.metadata?.cornerTower && (
                    <Chip 
                      label="Corner Tower" 
                      color="warning" 
                      size="small"
                      icon={<LocationOn />}
                    />
                  )}
                  {tower.metadata?.premiumLocation && (
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
                    {formatDate(tower.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(tower.updatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pricing Configuration */}
      {tower.pricingConfiguration && (
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
                    {tower.pricingConfiguration.basePriceModifier ? 
                      `${tower.pricingConfiguration.basePriceModifier > 0 ? '+' : ''}${tower.pricingConfiguration.basePriceModifier}%` : 
                      'Standard'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Floor Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.pricingConfiguration.floorPremium?.premiumPerFloor ? 
                      `₹${tower.pricingConfiguration.floorPremium.premiumPerFloor}/floor from ${tower.pricingConfiguration.floorPremium.startFloor}F` : 
                      'None'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Penthouse Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.pricingConfiguration.penthousePremium?.enabled ? 
                      `${tower.pricingConfiguration.penthousePremium.premiumPercentage}% for top ${tower.pricingConfiguration.penthousePremium.topFloors} floors` : 
                      'Not applicable'
                    }
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Corner Unit Premium</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {tower.pricingConfiguration.cornerUnitPremium?.percentage ? 
                      `${tower.pricingConfiguration.cornerUnitPremium.percentage}%` : 
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

// Unit Card Component for Grid View
const UnitCard = ({ unit, projectId, towerId }) => {
  const navigate = useNavigate();
  const StatusIcon = getStatusIcon(unit.status);

  const handleClick = () => {
    const validProjectId = extractId(projectId, 'UnitCard projectId');
    const validTowerId = extractId(towerId, 'UnitCard towerId');
    const validUnitId = extractId(unit._id || unit.id, 'UnitCard unitId');
    
    if (validProjectId && validTowerId && validUnitId) {
      const url = `/projects/${String(validProjectId)}/towers/${String(validTowerId)}/units/${String(validUnitId)}`;
      navigate(url);
    }
  };

  return (
    <Card 
      sx={{ 
        height: 140,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: 2,
        borderColor: `${getStatusColor(unit.status)}.main`,
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
            {unit.unitNumber}
          </Typography>
          <Chip 
            icon={<StatusIcon sx={{ fontSize: 14 }} />}
            label={unit.status}
            size="small"
            color={getStatusColor(unit.status)}
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {unit.bhkType} • Floor {unit.floorNumber}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {unit.carpetArea || unit.builtupArea || 0} sq ft
        </Typography>
        
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {formatCurrency(unit.currentPrice || unit.basePrice)}
          </Typography>
          {unit.customerName && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {unit.customerName}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Floor View Component
const FloorView = ({ units, floor, projectId, towerId }) => {
  const floorUnits = units.filter(unit => unit.floorNumber === floor);
  
  if (floorUnits.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.700', width: 40, height: 40 }}>
          <Layers />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Floor {floor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {floorUnits.length} units
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={1}>
        {floorUnits
          .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''))
          .map((unit) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={unit._id}>
              <UnitCard 
                unit={unit} 
                projectId={projectId}
                towerId={towerId}
              />
            </Grid>
          ))}
      </Grid>
    </Paper>
  );
};

// Units Grid Component
const UnitsGrid = ({ units, viewMode, onAddUnit, projectId, towerId }) => {
  const { canAccess } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredUnits = selectedStatus === 'all' 
    ? units 
    : units.filter(unit => unit.status === selectedStatus);

  const floors = [...new Set(units.map(unit => unit.floorNumber))]
    .filter(floor => floor !== undefined && floor !== null)
    .sort((a, b) => b - a);

  const statusCounts = {
    all: units.length,
    available: units.filter(unit => unit.status === 'available').length,
    sold: units.filter(unit => unit.status === 'sold').length,
    blocked: units.filter(unit => unit.status === 'blocked').length,
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tower Units ({units.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'floor' ? 'Floor-wise view' : 'Grid view'}
          </Typography>
        </Box>
        
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

      {filteredUnits.length > 0 ? (
        viewMode === 'floor' ? (
          <Box>
            {floors.map((floor) => (
              <FloorView
                key={floor}
                units={filteredUnits}
                floor={floor}
                projectId={projectId}
                towerId={towerId}
              />
            ))}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredUnits
              .sort((a, b) => {
                if (a.floorNumber !== b.floorNumber) {
                  return (b.floorNumber || 0) - (a.floorNumber || 0);
                }
                return (a.unitNumber || '').localeCompare(b.unitNumber || '');
              })
              .map((unit) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={unit._id}>
                  <UnitCard 
                    unit={unit} 
                    projectId={projectId}
                    towerId={towerId}
                  />
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
      const projectResponse = await projectAPI.getProject(validProjectId);
      const projectData = projectResponse.data.data || projectResponse.data;

      // Fetch tower details
      const towerResponse = await towerAPI.getTower(validTowerId);
      const towerData = towerResponse.data.data || towerResponse.data;

      // Debug the complete tower data structure
      console.log('🔍 Complete tower data from backend:', towerData);
      console.log('🔍 Tower data structure analysis:', {
        configuration: !!towerData.configuration,
        amenities: !!towerData.amenities,
        pricingConfiguration: !!towerData.pricingConfiguration,
        construction: !!towerData.construction,
        financials: !!towerData.financials,
        approvals: !!towerData.approvals,
        metadata: !!towerData.metadata,
        allKeys: Object.keys(towerData)
      });

      // Fetch units for this tower
      const unitsResponse = await unitAPI.getUnits({ tower: validTowerId });
      const unitsData = unitsResponse.data.data || [];

      if (!towerData || !towerData._id) {
        throw new Error('Invalid tower data received from API');
      }

      console.log('✅ Comprehensive tower data loaded:', {
        project: projectData.name,
        tower: {
          id: towerData._id,
          name: towerData.towerName,
          code: towerData.towerCode,
          hasConfiguration: !!towerData.configuration,
          hasAmenities: !!towerData.amenities,
          hasFinancials: !!towerData.financials,
          hasPricing: !!towerData.pricingConfiguration
        },
        unitsCount: unitsData.length
      });

      setProject(projectData);
      setTower(towerData);
      setUnits(unitsData);

    } catch (error) {
      console.error('❌ Error fetching tower data:', error);
      setError('Failed to load tower details. Please try again.');
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
        Tower not found
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
            <Tab label={`Units (${units.length})`} />
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
          {units.length === 0 && (
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
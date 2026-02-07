// File: src/pages/projects/UnitDetailPage.js
// Description: Comprehensive unit detail page displaying ALL backend fields from CSV
// Version: 1.0 - Complete backend integration with all 34+ unit fields
// Location: src/pages/projects/UnitDetailPage.js

import React, { useState, useEffect } from 'react';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Breadcrumbs,
  Link,
  LinearProgress,
  List,
  ListItem,
  ListItemText as MuiListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Home,
  CheckCircle,
  Warning,
  Block,
  Schedule,
  Analytics,
  Download,
  Refresh,
  NavigateNext,
  Business,
  Domain,
  Star,
  Park,
  LocalParking,
  Balcony,
  Bathtub,
  Bed,
  Kitchen,
  AspectRatio,
  MonetizationOn,
  AccountBalance,
  Construction,
  VerifiedUser,
  LocationOn,
  Person,
  Info,
  Assignment,
  Apartment,
  Villa,
  Timeline,
  Security,
  Explore,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';
import CostSheetGenerator from '../../components/pricing/CostSheetGenerator';

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    default: return 'default';
  }
};

const getStatusIcon = (status) => {
  const icons = {
    available: CheckCircle,
    sold: Home,
    blocked: Block,
    'on-hold': Warning,
  };
  return icons[status?.toLowerCase()] || Info;
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

// Breadcrumb Navigation Component
const UnitBreadcrumbs = ({ project, tower, unit }) => {
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
        onClick={() => navigate(`/projects/${project?._id}`)}
      >
        {project?.name || 'Project'}
      </Link>
      {tower && (
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
        {unit?.unitNumber || 'Unit'}
      </Typography>
    </Breadcrumbs>
  );
};

// Unit Header Component
const UnitHeader = ({ project, tower, unit, onEdit, onRefresh, isLoading }) => {
  const { canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const StatusIcon = getStatusIcon(unit?.status);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const pricePerSqFt = unit?.basePrice && unit?.areaSqft 
    ? Math.round(unit.basePrice / unit.areaSqft) 
    : 0;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: `${getStatusColor(unit?.status)}.main` }}>
              {tower ? <Apartment sx={{ fontSize: 28 }} /> : <Villa sx={{ fontSize: 28 }} />}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {unit?.unitNumber || 'Unit'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<StatusIcon sx={{ fontSize: 16 }} />}
                  label={unit?.status || 'Unknown'} 
                  color={getStatusColor(unit?.status)} 
                  size="small"
                />
                <Chip 
                  label={unit?.type || 'Unit Type'} 
                  color="info" 
                  size="small"
                />
                <Chip 
                  label={`Floor ${unit?.floor || 0}`} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                {unit?.features?.isCornerUnit && (
                  <Chip 
                    label="Corner Unit" 
                    color="warning" 
                    size="small"
                    icon={<Star />}
                  />
                )}
                {unit?.features?.isParkFacing && (
                  <Chip 
                    label="Park Facing" 
                    color="success" 
                    size="small"
                    icon={<Park />}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Unit Statistics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {unit?.areaSqft || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Area (sq ft)
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {unit?.specifications?.bedrooms || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bedrooms
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {unit?.specifications?.bathrooms || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bathrooms
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {((unit?.parking?.covered || 0) + (unit?.parking?.open || 0)) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Parking Spaces
              </Typography>
            </Grid>
          </Grid>

          {/* Pricing Information */}
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Base Price
              </Typography>
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                {formatCurrency(unit?.basePrice)}
              </Typography>
            </Box>
            {unit?.currentPrice && unit?.currentPrice !== unit?.basePrice && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Price
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(unit?.currentPrice)}
                </Typography>
              </Box>
            )}
            {pricePerSqFt > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Price per Sq Ft
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹{pricePerSqFt.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
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
              Edit Unit
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

// Unit Overview Component
const UnitOverview = ({ unit }) => {
  return (
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
                <Typography variant="body2" color="text.secondary">Unit Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.unitNumber || 'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Unit Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.type || 'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Floor Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.floor || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Facing Direction</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.facing || 'Not specified'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={unit?.status || 'Unknown'} 
                  color={getStatusColor(unit?.status)} 
                  size="small"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Area Specifications */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AspectRatio color="primary" />
              Area Specifications
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Primary Area (Backend)</Typography>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                  {unit?.areaSqft || 0} sq ft
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Carpet Area</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.carpetArea || 0} sq ft
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Built-up Area</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.builtUpArea || 0} sq ft
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Super Built-up Area</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.superBuiltUpArea || 0} sq ft
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Terrace Area</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.terraceArea || 0} sq ft
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Room Configuration */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home color="primary" />
              Room Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Bed color="action" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {unit?.specifications?.bedrooms || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bedrooms
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Bathtub color="action" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {unit?.specifications?.bathrooms || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bathrooms
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Home color="action" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {unit?.specifications?.livingRooms || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Living Rooms
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Kitchen color="action" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {unit?.specifications?.kitchen || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Kitchen
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Balcony color="action" />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {unit?.specifications?.balconies || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Balconies
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Features & Amenities */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="primary" />
              Features & Amenities
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Unit Features
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    icon={<Balcony />}
                    label="Balcony" 
                    size="small" 
                    color={unit?.features?.hasBalcony ? 'success' : 'default'}
                    variant={unit?.features?.hasBalcony ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    icon={<Person />}
                    label="Servant Room" 
                    size="small" 
                    color={unit?.features?.hasServantRoom ? 'success' : 'default'}
                    variant={unit?.features?.hasServantRoom ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    icon={<Home />}
                    label="Study Room" 
                    size="small" 
                    color={unit?.features?.hasStudyRoom ? 'success' : 'default'}
                    variant={unit?.features?.hasStudyRoom ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    icon={<Construction />}
                    label="Utility Area" 
                    size="small" 
                    color={unit?.features?.hasUtilityArea ? 'success' : 'default'}
                    variant={unit?.features?.hasUtilityArea ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Grid>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Location Features
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    icon={<Star />}
                    label="Corner Unit" 
                    size="small" 
                    color={unit?.features?.isCornerUnit ? 'warning' : 'default'}
                    variant={unit?.features?.isCornerUnit ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    icon={<Park />}
                    label="Park Facing" 
                    size="small" 
                    color={unit?.features?.isParkFacing ? 'success' : 'default'}
                    variant={unit?.features?.isParkFacing ? 'filled' : 'outlined'}
                  />
                  <Chip 
                    icon={<LocalParking />}
                    label="Parking Slot" 
                    size="small" 
                    color={unit?.features?.hasParkingSlot ? 'info' : 'default'}
                    variant={unit?.features?.hasParkingSlot ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Parking Details */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalParking color="primary" />
              Parking Allocation
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                    {unit?.parking?.covered || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Covered
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                    {unit?.parking?.open || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                    {((unit?.parking?.covered || 0) + (unit?.parking?.open || 0)) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Possession Status */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedUser color="primary" />
              Possession Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={unit?.possession?.handoverStatus?.replace('-', ' ').toUpperCase() || 'NOT SET'}
                color={getHandoverStatusColor(unit?.possession?.handoverStatus)}
                size="medium"
                sx={{ fontSize: '1rem', px: 2, py: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Current handover status of this unit
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Financial Details Component
const FinancialDetails = ({ unit }) => {
  const pricePerSqFt = unit?.basePrice && unit?.areaSqft 
    ? Math.round(unit.basePrice / unit.areaSqft) 
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MonetizationOn color="primary" />
              Pricing Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Base Price</Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(unit?.basePrice)}
                </Typography>
              </Box>
              {unit?.currentPrice && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Current Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(unit?.currentPrice)}
                  </Typography>
                </Box>
              )}
              {pricePerSqFt > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Price per Sq Ft</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ₹{pricePerSqFt.toLocaleString()}
                  </Typography>
                </Box>
              )}
              {unit?.currentPrice && unit?.basePrice && unit?.currentPrice !== unit?.basePrice && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Price Difference</Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      color: unit?.currentPrice > unit?.basePrice ? 'success.main' : 'error.main'
                    }}
                  >
                    {unit?.currentPrice > unit?.basePrice ? '+' : ''}
                    {formatCurrency(unit?.currentPrice - unit?.basePrice)}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalance color="primary" />
              Investment Analysis
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Price per Sq Ft (Carpet)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.carpetArea && unit?.basePrice
                    ? `₹${Math.round(unit.basePrice / unit.specifications.carpetArea).toLocaleString()}`
                    : 'N/A'
                  }
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Price per Sq Ft (Built-up)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.builtUpArea && unit?.basePrice
                    ? `₹${Math.round(unit.basePrice / unit.specifications.builtUpArea).toLocaleString()}`
                    : 'N/A'
                  }
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Price per Sq Ft (Super Built-up)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {unit?.specifications?.superBuiltUpArea && unit?.basePrice
                    ? `₹${Math.round(unit.basePrice / unit.specifications.superBuiltUpArea).toLocaleString()}`
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Unit History & Metadata Component
const UnitHistory = ({ unit }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="primary" />
              Unit Information
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Field</strong></TableCell>
                    <TableCell><strong>Value</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Unit ID</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{unit?._id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Project ID</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{unit?.project}</TableCell>
                  </TableRow>
                  {unit?.tower && (
                    <TableRow>
                      <TableCell>Tower ID</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{unit?.tower}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell>Organization ID</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{unit?.organization?.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>{unit?.__v || 0}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              Timestamps
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Created At</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(unit?.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(unit?.updatedAt)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Main Unit Detail Page Component
const UnitDetailPage = () => {
  const { projectId, towerId, unitId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch data
  useEffect(() => {
    if (projectId && unitId) {
      fetchUnitData();
    }
  }, [projectId, towerId, unitId]);

  const fetchUnitData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching unit data for:', {
        projectId,
        towerId,
        unitId
      });

      // Fetch project details
      const projectResponse = await projectAPI.getProject(projectId);
      let projectData;
      if (projectResponse.data.data) {
        projectData = projectResponse.data.data;
      } else if (projectResponse.data.project) {
        projectData = projectResponse.data.project;
      } else {
        projectData = projectResponse.data;
      }
      setProject(projectData);

      // Fetch tower details if tower exists
      if (towerId) {
        const towerResponse = await towerAPI.getTower(towerId);
        let towerData;
        if (towerResponse.data.data) {
          towerData = towerResponse.data.data;
        } else if (towerResponse.data.tower) {
          towerData = towerResponse.data.tower;
        } else {
          towerData = towerResponse.data;
        }
        setTower(towerData);
      }

      // Fetch unit details
      const unitResponse = await unitAPI.getUnit(unitId);
      let unitData;
      if (unitResponse.data.data) {
        unitData = unitResponse.data.data;
      } else if (unitResponse.data.unit) {
        unitData = unitResponse.data.unit;
      } else {
        unitData = unitResponse.data;
      }

      console.log('✅ Unit data loaded successfully:', {
        unit: unitData?.unitNumber,
        status: unitData?.status,
        hasFeatures: !!unitData?.features,
        hasSpecifications: !!unitData?.specifications,
        hasPossession: !!unitData?.possession
      });

      setUnit(unitData);

    } catch (error) {
      console.error('❌ Error fetching unit data:', error);
      setError('Failed to load unit details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (towerId) {
      navigate(`/projects/${projectId}/towers/${towerId}/units/${unitId}/edit`);
    } else {
      navigate(`/projects/${projectId}/units/${unitId}/edit`);
    }
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
        Unit not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <UnitBreadcrumbs project={project} tower={tower} unit={unit} />

      {/* Unit Header */}
      <UnitHeader
        project={project}
        tower={tower}
        unit={unit}
        onEdit={handleEdit}
        onRefresh={fetchUnitData}
        isLoading={loading}
      />

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Financial Details" />
          <Tab label="Cost Sheet" />
          <Tab label="History & Metadata" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <UnitOverview unit={unit} />}
      {activeTab === 1 && <FinancialDetails unit={unit} />}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <CostSheetGenerator
              unitId={unitId}
              unitData={unit}
              projectData={project}
              embedded={false}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Info
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Unit</Typography>
                    <Typography variant="body1" fontWeight={600}>{unit?.unitNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography variant="body1" fontWeight={600}>{unit?.type || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Area</Typography>
                    <Typography variant="body1" fontWeight={600}>{unit?.areaSqft || 0} sq ft</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Base Price</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(unit?.basePrice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Floor</Typography>
                    <Typography variant="body1" fontWeight={600}>{unit?.floor || 0}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      {activeTab === 3 && <UnitHistory unit={unit} />}
    </Box>
  );
};

export default UnitDetailPage;
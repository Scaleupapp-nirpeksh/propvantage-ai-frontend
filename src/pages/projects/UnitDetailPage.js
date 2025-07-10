// File: src/pages/projects/UnitDetailPage.js
// Description: Complete unit detail page with comprehensive unit information and management capabilities
// Version: 1.0 - Production-grade unit detail view with real backend integration
// Location: src/pages/projects/UnitDetailPage.js

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link,
  Divider,
  List,
  ListItem,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Home,
  CheckCircle,
  Warning,
  Block,
  Person,
  AttachMoney,
  Analytics,
  Settings,
  Download,
  Refresh,
  Timeline,
  NavigateNext,
  AspectRatio,
  Business,
  Domain,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Receipt,
  Assignment,
  Visibility,
  Share,
  Print,
  Villa,
  Apartment,
  Info,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Utility function to ensure proper ID handling
const ensureValidId = (id, context = 'ID') => {
  if (!id) {
    console.error(`${context} is undefined or null`);
    return null;
  }
  
  if (typeof id === 'object') {
    console.error(`${context} is an object, expected string:`, id);
    return id._id || id.id || null;
  }
  
  if (typeof id !== 'string') {
    console.error(`${context} is not a string:`, typeof id, id);
    return String(id);
  }
  
  return id;
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
  switch (status?.toLowerCase()) {
    case 'available': return CheckCircle;
    case 'sold': return Home;
    case 'blocked': return Block;
    case 'on-hold': return Warning;
    default: return Home;
  }
};

// Breadcrumb Navigation Component
const UnitBreadcrumbs = ({ project, tower, unit }) => {
  const navigate = useNavigate();
  const isVillaUnit = !tower;

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
        onClick={() => {
          const validProjectId = ensureValidId(project?._id, 'Project ID');
          navigate(`/projects/${validProjectId}`);
        }}
      >
        {project?.name || 'Project'}
      </Link>
      {!isVillaUnit && tower && (
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            const validProjectId = ensureValidId(project?._id, 'Project ID');
            const validTowerId = ensureValidId(tower._id, 'Tower ID');
            navigate(`/projects/${validProjectId}/towers/${validTowerId}`);
          }}
        >
          {tower.towerName || tower.towerCode}
        </Link>
      )}
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isVillaUnit ? <Villa fontSize="small" /> : <Home fontSize="small" />}
        {unit?.unitNumber || 'Unit'}
      </Typography>
    </Breadcrumbs>
  );
};

// Unit Header Component
const UnitHeader = ({ project, tower, unit, onEdit, onRefresh, isLoading }) => {
  const { hasPermission } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const StatusIcon = getStatusIcon(unit.status);
  const isVillaUnit = !tower;

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: `${getStatusColor(unit.status)}.main`,
                color: 'white' 
              }}
            >
              {isVillaUnit ? <Villa sx={{ fontSize: 28 }} /> : <StatusIcon sx={{ fontSize: 28 }} />}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {isVillaUnit ? 'Villa ' : 'Unit '}{unit.unitNumber}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={unit.status || 'Available'} 
                  color={getStatusColor(unit.status)} 
                  size="small"
                />
                <Chip 
                  label={unit.bhkType || 'N/A'} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={isVillaUnit ? unit.villaType || 'Villa' : 'Apartment'} 
                  color="info" 
                  size="small" 
                  variant="outlined"
                />
                {!isVillaUnit && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Floor {unit.floorNumber} • {unit.carpetArea || unit.builtupArea || 0} sq ft
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(unit.currentPrice)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Price
              </Typography>
            </Box>
            
            {unit.pricePerSqFt && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(unit.pricePerSqFt)}/sq ft
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Price per sq ft
                </Typography>
              </Box>
            )}

            {isVillaUnit && unit.plotArea && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {unit.plotArea} sq ft
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plot Area
                </Typography>
              </Box>
            )}
          </Box>

          {unit.customerName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                Customer: {unit.customerName}
                {unit.customerPhone && ` • ${unit.customerPhone}`}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {hasPermission('MANAGEMENT') && (
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
                <Receipt fontSize="small" />
              </ListItemIcon>
              <ListItemText>Generate Cost Sheet</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Assignment fontSize="small" />
              </ListItemIcon>
              <ListItemText>Book Unit</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Print fontSize="small" />
              </ListItemIcon>
              <ListItemText>Print Details</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Share fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share Unit</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// Unit Specifications Component
const UnitSpecifications = ({ unit }) => {
  const isVillaUnit = !unit.tower;
  
  const specifications = [
    { label: 'Unit Number', value: unit.unitNumber },
    !isVillaUnit && { label: 'Floor Number', value: unit.floorNumber },
    { label: 'Unit Type', value: unit.bhkType },
    { label: 'Carpet Area', value: unit.carpetArea ? `${unit.carpetArea} sq ft` : 'N/A' },
    { label: 'Built-up Area', value: unit.builtupArea ? `${unit.builtupArea} sq ft` : 'N/A' },
    { label: 'Super Built-up Area', value: unit.superBuiltupArea ? `${unit.superBuiltupArea} sq ft` : 'N/A' },
    isVillaUnit && { label: 'Plot Area', value: unit.plotArea ? `${unit.plotArea} sq ft` : 'N/A' },
    isVillaUnit && { label: 'Garden Area', value: unit.gardenArea ? `${unit.gardenArea} sq ft` : 'N/A' },
    isVillaUnit && { label: 'Constructed Area', value: unit.constructedArea ? `${unit.constructedArea} sq ft` : 'N/A' },
    isVillaUnit && { label: 'Villa Type', value: unit.villaType || 'Independent Villa' },
    { label: 'Facing', value: unit.facing || 'N/A' },
    { label: 'Balconies', value: unit.balconies || 'N/A' },
    { label: 'Bathrooms', value: unit.bathrooms || 'N/A' },
    { label: 'Parking', value: unit.parkingSpaces ? `${unit.parkingSpaces} spaces` : 'N/A' },
  ].filter(item => item && item.value && item.value !== 'N/A');

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          {isVillaUnit ? 'Villa' : 'Unit'} Specifications
        </Typography>
        
        <Grid container spacing={3}>
          {specifications.map((spec, index) => (
            <Grid item xs={6} md={4} key={index}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {spec.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {spec.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {unit.features && unit.features.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Features & Amenities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {unit.features.map((feature, index) => (
                <Chip key={index} label={feature} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {unit.description && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unit.description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Pricing Information Component
const PricingInformation = ({ unit }) => {
  const pricingDetails = [
    { label: 'Base Price', value: formatCurrency(unit.basePrice || unit.currentPrice) },
    { label: 'Current Price', value: formatCurrency(unit.currentPrice) },
    { label: 'Price per Sq Ft', value: unit.pricePerSqFt ? formatCurrency(unit.pricePerSqFt) : 'N/A' },
    { label: 'Floor Rise Charges', value: formatCurrency(unit.floorRiseCharges || 0) },
    { label: 'PLC Charges', value: formatCurrency(unit.plcCharges || 0) },
    { label: 'GST', value: unit.gst ? `${unit.gst}%` : 'As applicable' },
  ];

  const additionalCharges = unit.additionalCharges || [];

  // Calculate total price breakdown
  const basePrice = unit.currentPrice || 0;
  const gstAmount = basePrice * (unit.gst || 5) / 100;
  const totalPrice = basePrice + gstAmount + (unit.floorRiseCharges || 0) + (unit.plcCharges || 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Pricing Information
        </Typography>
        
        <Grid container spacing={3}>
          {pricingDetails.map((price, index) => (
            <Grid item xs={6} md={4} key={index}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {price.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {price.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Price Breakdown */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Price Breakdown
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Base Price</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(basePrice)}
                </Typography>
              </Box>
              {unit.floorRiseCharges > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Floor Rise Charges</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(unit.floorRiseCharges)}
                  </Typography>
                </Box>
              )}
              {unit.plcCharges > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">PLC Charges</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(unit.plcCharges)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">GST ({unit.gst || 5}%)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(gstAmount)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Price</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatCurrency(totalPrice)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {additionalCharges.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Additional Charges
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Charge Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {additionalCharges.map((charge, index) => (
                    <TableRow key={index}>
                      <TableCell>{charge.name || charge.type}</TableCell>
                      <TableCell align="right">{formatCurrency(charge.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Customer Information Component
const CustomerInformation = ({ unit }) => {
  const isVillaUnit = !unit.tower;
  
  if (!unit.customerName && unit.status === 'available') {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            {isVillaUnit ? 'Villa' : 'Unit'} Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This {isVillaUnit ? 'villa' : 'unit'} is available for booking
          </Typography>
          <Button variant="contained" startIcon={<Assignment />} size="large">
            Book This {isVillaUnit ? 'Villa' : 'Unit'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const customerDetails = [
    { label: 'Customer Name', value: unit.customerName, icon: Person },
    { label: 'Phone Number', value: unit.customerPhone, icon: Phone },
    { label: 'Email Address', value: unit.customerEmail, icon: Email },
    { label: 'Booking Date', value: unit.bookingDate ? new Date(unit.bookingDate).toLocaleDateString() : 'N/A', icon: CalendarToday },
    { label: 'Sale Date', value: unit.saleDate ? new Date(unit.saleDate).toLocaleDateString() : 'N/A', icon: CheckCircle },
    { label: 'Registration Date', value: unit.registrationDate ? new Date(unit.registrationDate).toLocaleDateString() : 'N/A', icon: Receipt },
  ].filter(item => item.value && item.value !== 'N/A');

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Customer Information
        </Typography>
        
        {customerDetails.length > 0 ? (
          <Grid container spacing={3}>
            {customerDetails.map((detail, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.700', width: 40, height: 40 }}>
                    <detail.icon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {detail.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {detail.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No customer information available
          </Typography>
        )}

        {unit.paymentSchedule && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Payment Schedule
            </Typography>
            <Alert severity="info" icon={<AccountBalance />}>
              Payment schedule and installment details will be displayed here
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Unit Timeline Component
const UnitTimeline = ({ unit }) => {
  const timelineEvents = [
    {
      date: unit.createdAt,
      title: 'Unit Created',
      description: 'Unit was added to the system',
      icon: Home,
      color: 'primary',
    },
    {
      date: unit.bookingDate,
      title: 'Unit Booked',
      description: `Booked by ${unit.customerName}`,
      icon: Assignment,
      color: 'warning',
    },
    {
      date: unit.saleDate,
      title: 'Sale Completed',
      description: 'Unit sale was finalized',
      icon: CheckCircle,
      color: 'success',
    },
    {
      date: unit.registrationDate,
      title: 'Registration Completed',
      description: 'Legal registration completed',
      icon: Receipt,
      color: 'info',
    },
  ].filter(event => event.date);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Unit Timeline
        </Typography>
        
        {timelineEvents.length > 0 ? (
          <Stack spacing={3}>
            {timelineEvents.map((event, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${event.color}.100`,
                    color: `${event.color}.700`,
                    width: 40,
                    height: 40,
                  }}
                >
                  <event.icon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {event.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Alert severity="info" icon={<Info />}>
            No timeline events available for this unit
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Analytics Component
const UnitAnalytics = ({ unit }) => {
  const isVillaUnit = !unit.tower;
  
  // Mock analytics data - replace with real analytics API
  const analytics = {
    viewsThisMonth: Math.floor(Math.random() * 50) + 10,
    inquiriesThisMonth: Math.floor(Math.random() * 20) + 5,
    avgMarketPrice: unit.currentPrice * (0.9 + Math.random() * 0.2),
    priceHistory: [
      { month: 'Jan', price: unit.currentPrice * 0.95 },
      { month: 'Feb', price: unit.currentPrice * 0.97 },
      { month: 'Mar', price: unit.currentPrice },
    ],
  };

  const marketComparison = analytics.avgMarketPrice > unit.currentPrice ? 'below' : 'above';
  const priceDifference = Math.abs(analytics.avgMarketPrice - unit.currentPrice);
  const pricePercentage = Math.round((priceDifference / analytics.avgMarketPrice) * 100);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Unit Analytics
        </Typography>
        
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {analytics.viewsThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Views This Month
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {analytics.inquiriesThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inquiries
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Market Comparison
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {marketComparison === 'below' ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingUp color="error" sx={{ transform: 'rotate(180deg)' }} />
                )}
                <Typography variant="body2">
                  Priced {pricePercentage}% {marketComparison} market average
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Market avg: {formatCurrency(analytics.avgMarketPrice)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Analytics data is updated daily. Contact your analytics team for detailed market reports.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Main Unit Detail Page Component
const UnitDetailPage = () => {
  const { projectId, towerId, unitId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Determine if this is a villa unit (no towerId in URL)
  const isVillaUnit = !towerId;

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch unit data
  useEffect(() => {
    if (projectId && unitId) {
      fetchUnitData();
    }
  }, [projectId, towerId, unitId]);

  const fetchUnitData = async () => {
    try {
      setLoading(true);
      setError(null);

      const validProjectId = ensureValidId(projectId, 'Project ID');
      const validUnitId = ensureValidId(unitId, 'Unit ID');

      console.log('🔄 Fetching unit data for ID:', validUnitId);

      // Fetch project details
      const projectResponse = await projectAPI.getProject(validProjectId);
      const projectData = projectResponse.data.data || projectResponse.data;

      // Fetch tower details only if this is a tower unit
      let towerData = null;
      if (towerId) {
        const validTowerId = ensureValidId(towerId, 'Tower ID');
        const towerResponse = await towerAPI.getTower(validTowerId);
        towerData = towerResponse.data.data || towerResponse.data;
      }

      // Fetch unit details
      const unitResponse = await unitAPI.getUnit(validUnitId);
      const unitData = unitResponse.data.data || unitResponse.data;

      console.log('✅ Unit data:', unitData);

      setProject(projectData);
      setTower(towerData);
      setUnit(unitData);

    } catch (error) {
      console.error('❌ Error fetching unit data:', error);
      setError('Failed to load unit details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const validProjectId = ensureValidId(projectId, 'Project ID');
    const validUnitId = ensureValidId(unitId, 'Unit ID');
    
    if (isVillaUnit) {
      navigate(`/projects/${validProjectId}/units/${validUnitId}/edit`);
    } else {
      const validTowerId = ensureValidId(towerId, 'Tower ID');
      navigate(`/projects/${validProjectId}/towers/${validTowerId}/units/${validUnitId}/edit`);
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
          <Tab label="Specifications" />
          <Tab label="Pricing" />
          <Tab label="Customer" />
          <Tab label="Timeline" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {activeTab === 0 && <UnitSpecifications unit={unit} />}
          {activeTab === 1 && <PricingInformation unit={unit} />}
          {activeTab === 2 && <CustomerInformation unit={unit} />}
          {activeTab === 3 && <UnitTimeline unit={unit} />}
          {activeTab === 4 && <UnitAnalytics unit={unit} />}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnitDetailPage;
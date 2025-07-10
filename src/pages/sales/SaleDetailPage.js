// File: src/pages/sales/SaleDetailPage.js
// Description: Complete sale detail page with proper API integration and comprehensive features
// Version: 3.0 - Production-ready with all features and proper error handling
// Location: src/pages/sales/SaleDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  Receipt,
  Payment,
  AccountBalance,
  Phone,
  Email,
  LocationOn,
  Business,
  Home,
  Person,
  CalendarToday,
  AttachMoney,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Print,
  Download,
  Share,
  WhatsApp,
  Message,
  FileDownload,
  AssignmentTurnedIn,
  CreditCard,
  AccountBalanceWallet,
  ExpandMore,
  Visibility,
  Assignment,
  Description,
  PictureAsPdf,
  PhotoCamera,
  Refresh,
  Launch,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { salesAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPhoneNumber } from '../../utils/formatters';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; 

// Status configurations
const SALE_STATUSES = [
  { value: 'booked', label: 'Booked', color: 'success', icon: CheckCircle },
  { value: 'agreement_signed', label: 'Agreement Signed', color: 'info', icon: AssignmentTurnedIn },
  { value: 'registration_pending', label: 'Registration Pending', color: 'warning', icon: Schedule },
  { value: 'registration_complete', label: 'Registration Complete', color: 'success', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'error', icon: Warning },
  { value: 'on_hold', label: 'On Hold', color: 'default', icon: Schedule },
  { value: 'pending', label: 'Pending', color: 'default', icon: Schedule },
];

const PAYMENT_STATUSES = [
  { value: 'on_track', label: 'On Track', color: 'success', icon: TrendingUp },
  { value: 'delayed', label: 'Delayed', color: 'warning', icon: Schedule },
  { value: 'overdue', label: 'Overdue', color: 'error', icon: Warning },
  { value: 'advance', label: 'Advance', color: 'info', icon: TrendingUp },
  { value: 'pending', label: 'Pending', color: 'default', icon: Schedule },
];

// Helper functions for populated data
const getStatusConfig = (status, statusArray) => {
  return statusArray.find(s => s.value === status) || statusArray[statusArray.length - 1];
};

const getCustomerName = (sale) => {
  if (!sale.lead) return 'Unknown Customer';
  
  if (typeof sale.lead === 'object') {
    const { firstName, lastName, email, phone } = sale.lead;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
    if (phone) return phone;
  }
  
  return 'Unknown Customer';
};

const getProjectName = (sale) => {
  if (!sale.project) return 'Unknown Project';
  
  if (typeof sale.project === 'object') {
    return sale.project.name || 'Unknown Project';
  }
  
  return 'Unknown Project';
};

const getUnitDisplayName = (sale) => {
  if (!sale.unit) return 'Unknown Unit';
  
  if (typeof sale.unit === 'object') {
    return sale.unit.unitNumber || sale.unit.fullAddress || 'Unknown Unit';
  }
  
  return 'Unknown Unit';
};

const getSalespersonName = (sale) => {
  if (!sale.salesPerson) return 'Unassigned';
  
  if (typeof sale.salesPerson === 'object') {
    const { firstName, lastName, email } = sale.salesPerson;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
  }
  
  return 'Unassigned';
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Stack spacing={3}>
      <Skeleton variant="rectangular" height={200} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  </Box>
);

// Sale Overview Card Component
const SaleOverviewCard = ({ sale, onEdit, onCancel, canEdit }) => {
  const saleStatusConfig = getStatusConfig(sale.status || 'pending', SALE_STATUSES);
  const paymentStatusConfig = getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES);
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(sale._id);
  };
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h2">
              Sale #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}
            </Typography>
            <Chip
              icon={<saleStatusConfig.icon sx={{ fontSize: 18 }} />}
              label={saleStatusConfig.label}
              color={saleStatusConfig.color}
              variant="outlined"
            />
           <IconButton size="small" onClick={handleCopyId} title="Copy Sale ID">
  <ContentCopyIcon fontSize="small" />
</IconButton>
          </Box>
        }
        action={
          canEdit && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={onEdit}
                sx={{ mr: 1 }}
              >
                Edit Sale
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={onCancel}
              >
                Cancel Sale
              </Button>
            </Box>
          )
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(sale.salePrice || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Sale Amount
              </Typography>
              {(sale.discountAmount || 0) > 0 && (
                <Typography variant="body2" color="success.main">
                  Discount: -{formatCurrency(sale.discountAmount || 0)}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Chip
                icon={<paymentStatusConfig.icon sx={{ fontSize: 18 }} />}
                label={paymentStatusConfig.label}
                color={paymentStatusConfig.color}
                size="medium"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                Payment Status
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatDate(sale.bookingDate || sale.createdAt)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sale Date
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Receipt />}
                size="small"
                fullWidth
                onClick={() => {
                  // Generate receipt functionality
                  console.log('Generate receipt for sale:', sale._id);
                }}
              >
                Generate Receipt
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                size="small"
                fullWidth
                onClick={() => {
                  // Navigate to payment plan
                  window.open(`/payments/plans/${sale._id}`, '_blank');
                }}
              >
                Payment Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Customer Information Card Component
const CustomerInfoCard = ({ sale }) => {
  const customerName = getCustomerName(sale);
  const leadData = sale.lead || {};
  
  return (
    <Card>
      <CardHeader
        title="Customer Information"
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {customerName?.[0] || 'C'}
          </Avatar>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {leadData.phone && (
              <IconButton color="primary" href={`tel:${leadData.phone}`} title="Call">
                <Phone />
              </IconButton>
            )}
            {leadData.email && (
              <IconButton color="primary" href={`mailto:${leadData.email}`} title="Email">
                <Email />
              </IconButton>
            )}
            {leadData.phone && (
              <IconButton 
                color="primary" 
                href={`https://wa.me/${leadData.phone?.replace(/\D/g, '')}`} 
                target="_blank"
                title="WhatsApp"
              >
                <WhatsApp />
              </IconButton>
            )}
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Customer Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {customerName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Phone Number
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leadData.phone ? formatPhoneNumber(leadData.phone) : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Email Address
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leadData.email || '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Lead Source
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leadData.source || '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Priority
            </Typography>
            <Chip
              label={leadData.priority || 'Medium'}
              color={leadData.priority === 'High' ? 'error' : leadData.priority === 'Low' ? 'default' : 'warning'}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Requirements
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leadData.requirements || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Fixed Property Details Card Component
const PropertyDetailsCard = ({ sale }) => {
  const projectData = sale.project || {};
  const unitData = sale.unit || {};
  
  // Helper function to safely render values
  const renderValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      // If it's an object, try to extract meaningful data
      if (value && typeof value === 'object') {
        if (value.name) return String(value.name);
        if (value.value) return String(value.value);
        if (value.label) return String(value.label);
        if (value.title) return String(value.title);
        // Safely stringify object as fallback
        try {
          return JSON.stringify(value);
        } catch {
          return '[Object]';
        }
      }
      return '[Object]';
    }
    return String(value);
  };
  
  // Helper function to check if value exists and can be rendered
  const hasValue = (value) => {
    if (!value) return false;
    if (typeof value === 'object') {
      return value.name || value.value || value.label || value.title || Object.keys(value).length > 0;
    }
    return true;
  };
  
  // Helper function to render floor information
  const renderFloor = (floor) => {
    if (!floor) return '-';
    if (typeof floor === 'object') {
      if (floor.number) return `Floor ${String(floor.number)}`;
      if (floor.level) return `Level ${String(floor.level)}`;
      if (floor.name) return String(floor.name);
      try {
        return JSON.stringify(floor);
      } catch {
        return '[Floor Object]';
      }
    }
    return String(floor);
  };
  
  // Helper function to render bedroom information
  const renderBedrooms = (bedrooms) => {
    if (!bedrooms) return '-';
    if (typeof bedrooms === 'object') {
      if (bedrooms.count) return `${String(bedrooms.count)} BHK`;
      if (bedrooms.number) return `${String(bedrooms.number)} BHK`;
      if (bedrooms.value) return `${String(bedrooms.value)} BHK`;
      try {
        return JSON.stringify(bedrooms);
      } catch {
        return '[Bedroom Object]';
      }
    }
    return `${String(bedrooms)} BHK`;
  };
  
  // Helper function to render location
  const renderLocation = (location) => {
    if (!location) return '-';
    if (typeof location === 'object') {
      if (location.city && location.state) return `${String(location.city)}, ${String(location.state)}`;
      if (location.city) return String(location.city);
      if (location.address) return String(location.address);
      if (location.name) return String(location.name);
      try {
        return JSON.stringify(location);
      } catch {
        return '[Location Object]';
      }
    }
    return String(location);
  };
  
  return (
    <Card>
      <CardHeader
        title="Property Details"
        avatar={
          <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
            <Home />
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Project Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getProjectName(sale)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Number
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getUnitDisplayName(sale)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Project Type
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {renderValue(projectData.type)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Area
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {unitData.area ? `${renderValue(unitData.area)} sq ft` : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Floor
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {renderFloor(unitData.floor)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Bedrooms
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {renderBedrooms(unitData.bedrooms)}
            </Typography>
          </Grid>
          
          {/* Additional unit details if available */}
          {hasValue(unitData.unitType) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Unit Type
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {renderValue(unitData.unitType)}
              </Typography>
            </Grid>
          )}
          
          {hasValue(unitData.facing) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                Facing
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {renderValue(unitData.facing)}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Project Location
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {renderLocation(projectData.location)}
            </Typography>
          </Grid>
          
          {/* Amenities if available */}
          {unitData.amenities && Array.isArray(unitData.amenities) && unitData.amenities.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Amenities
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {unitData.amenities.map((amenity, index) => renderValue(amenity)).join(', ')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Enhanced Payment Summary Card Component
const PaymentSummaryCard = ({ sale }) => {
  const totalAmount = sale.salePrice || 0;
  const discountAmount = sale.discountAmount || 0;
  const finalAmount = totalAmount - discountAmount;
  
  return (
    <Card>
      <CardHeader
        title="Payment Summary"
        avatar={
          <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
            <AccountBalanceWallet />
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Base Amount
              </Typography>
            </Box>
          </Grid>
          
          {discountAmount > 0 && (
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  -{formatCurrency(discountAmount)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Discount
                </Typography>
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12} sm={discountAmount > 0 ? 4 : 12}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                {formatCurrency(finalAmount)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Final Amount
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Cost Sheet Details */}
        {sale.costSheetSnapshot && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Cost Breakdown</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {sale.costSheetSnapshot.basePrice && (
                      <TableRow>
                        <TableCell>Base Price</TableCell>
                        <TableCell align="right">{formatCurrency(sale.costSheetSnapshot.basePrice)}</TableCell>
                      </TableRow>
                    )}
                    {sale.costSheetSnapshot.additionalCharges && (
                      <TableRow>
                        <TableCell>Additional Charges</TableCell>
                        <TableCell align="right">{formatCurrency(sale.costSheetSnapshot.additionalCharges)}</TableCell>
                      </TableRow>
                    )}
                    {sale.costSheetSnapshot.gst && (
                      <TableRow>
                        <TableCell>GST</TableCell>
                        <TableCell align="right">{formatCurrency(sale.costSheetSnapshot.gst)}</TableCell>
                      </TableRow>
                    )}
                    {sale.costSheetSnapshot.totalAmount && (
                      <TableRow>
                        <TableCell><strong>Total Amount</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(sale.costSheetSnapshot.totalAmount)}</strong></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Sale Timeline Component
const SaleTimeline = ({ sale }) => {
  const timelineEvents = [
    {
      date: sale.bookingDate || sale.createdAt,
      title: 'Sale Booked',
      description: 'Initial sale booking was created',
      icon: <CheckCircle />,
      color: 'success',
    },
    sale.agreementDate && {
      date: sale.agreementDate,
      title: 'Agreement Signed',
      description: 'Sale agreement was signed by customer',
      icon: <AssignmentTurnedIn />,
      color: 'info',
    },
    sale.registrationDate && {
      date: sale.registrationDate,
      title: 'Registration Complete',
      description: 'Property registration was completed',
      icon: <Assignment />,
      color: 'success',
    },
    sale.cancelledAt && {
      date: sale.cancelledAt,
      title: 'Sale Cancelled',
      description: sale.cancellationReason || 'Sale was cancelled',
      icon: <Warning />,
      color: 'error',
    },
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader title="Sale Timeline" />
      <CardContent>
        <Timeline>
          {timelineEvents.map((event, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="textSecondary">
                {formatDateTime(event.date)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={event.color}>
                  {event.icon}
                </TimelineDot>
                {index < timelineEvents.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  {event.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {event.description}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

// Sales Person Information Card
const SalesPersonCard = ({ sale }) => {
  const salespersonData = sale.salesPerson || {};
  const salespersonName = getSalespersonName(sale);
  
  return (
    <Card>
      <CardHeader
        title="Sales Person"
        avatar={
          <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
            {salespersonName?.[0] || 'S'}
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Name
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {salespersonName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Role
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {salespersonData.role || '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Email
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {salespersonData.email || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Sale Detail Page Component
const SaleDetailPage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSnackbar({ open: true, message: location.state.message, severity: 'success' });
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch sale data
  const fetchSaleData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching sale details for ID:', saleId);
      
      const response = await salesAPI.getSale(saleId);
      console.log('✅ Sale API Response:', response.data);
      
      const saleData = response.data.data || response.data;
      setSale(saleData);
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching sale data:', error);
      
      if (error.response?.status === 404) {
        setError('Sale not found.');
      } else {
        setError('Failed to load sale details. Please try again.');
      }
      
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [saleId]);

  // Initial data load
  useEffect(() => {
    if (saleId) {
      fetchSaleData();
    }
  }, [fetchSaleData, saleId]);

  // Handle actions
  const handleEditSale = () => {
    navigate(`/sales/${saleId}/edit`);
  };

  const handleCancelSale = async () => {
    try {
      await salesAPI.cancelSale(saleId, {
        reason: 'Cancelled by user',
        cancelledBy: user._id,
      });
      setCancelDialog(false);
      setSnackbar({ open: true, message: 'Sale cancelled successfully', severity: 'success' });
      fetchSaleData(true);
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setSnackbar({ open: true, message: 'Failed to cancel sale', severity: 'error' });
    }
  };

  const handleActionMenuClick = (event) => {
    setActionMenu(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenu(null);
  };

  const refreshData = () => {
    fetchSaleData(true);
  };

  const handleGenerateDocuments = async () => {
    try {
      await salesAPI.generateSaleDocuments(saleId);
      setSnackbar({ open: true, message: 'Documents generated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate documents', severity: 'error' });
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={refreshData} sx={{ mr: 2 }}>
          Try Again
        </Button>
        <Button variant="outlined" onClick={() => navigate('/sales')}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Sale not found.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          Back to Sales
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/sales')} size="large">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Sale Details
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {getCustomerName(sale)} • {formatDate(sale.bookingDate || sale.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <IconButton onClick={handleActionMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Progress bar for refreshing */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Sale Overview */}
      <SaleOverviewCard
        sale={sale}
        onEdit={handleEditSale}
        onCancel={() => setCancelDialog(true)}
        canEdit={canAccess.salesPipeline()}
      />

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Customer Information */}
            <CustomerInfoCard sale={sale} />
            
            {/* Property Details */}
            <PropertyDetailsCard sale={sale} />
            
            {/* Sale Timeline */}
            <SaleTimeline sale={sale} />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Payment Summary */}
            <PaymentSummaryCard sale={sale} />
            
            {/* Sales Person Information */}
            <SalesPersonCard sale={sale} />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Receipt />}
                    fullWidth
                    onClick={handleGenerateDocuments}
                  >
                    Generate Documents
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AccountBalance />}
                    fullWidth
                    onClick={() => navigate(`/payments/plans/${saleId}`)}
                  >
                    View Payment Plan
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    fullWidth
                    onClick={() => window.print()}
                  >
                    Print Details
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    fullWidth
                    href={`mailto:${sale.lead?.email || ''}`}
                    disabled={!sale.lead?.email}
                  >
                    Email Customer
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu}
        open={Boolean(actionMenu)}
        onClose={handleActionMenuClose}
      >
        {canAccess.salesPipeline() && (
          <MenuItem onClick={handleEditSale}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Sale</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => navigate(`/payments/plans/${saleId}`)}>
          <ListItemIcon><AccountBalance fontSize="small" /></ListItemIcon>
          <ListItemText>Payment Plan</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGenerateDocuments}>
          <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
          <ListItemText>Generate Documents</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => window.print()}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Print Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const shareData = {
            title: `Sale Details - ${getCustomerName(sale)}`,
            text: `Sale #${sale._id?.slice(-6)?.toUpperCase()} - ${formatCurrency(sale.salePrice)}`,
            url: window.location.href,
          };
          if (navigator.share) {
            navigator.share(shareData);
          } else {
            navigator.clipboard.writeText(window.location.href);
            setSnackbar({ open: true, message: 'Link copied to clipboard', severity: 'success' });
          }
        }}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Share Details</ListItemText>
        </MenuItem>
        <Divider />
        {canAccess.salesPipeline() && (
          <MenuItem onClick={() => setCancelDialog(true)} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Cancel Sale</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Sale Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this sale? This action cannot be undone.
            <br /><br />
            <strong>Sale ID:</strong> #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}<br />
            <strong>Customer:</strong> {getCustomerName(sale)}<br />
            <strong>Amount:</strong> {formatCurrency(sale.salePrice || 0)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Keep Sale
          </Button>
          <Button onClick={handleCancelSale} color="error" variant="contained">
            Cancel Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && canAccess.salesPipeline() && (
        <Fab
          color="primary"
          aria-label="edit sale"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleEditSale}
        >
          <Edit />
        </Fab>
      )}

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

export default SaleDetailPage;
/**
 * File: src/pages/sales/SaleDetailPage.js
 * Description: Ultra-safe sale detail page with NO dynamic components
 * Version: 3.3 - Static icons only, completely bulletproof
 * Location: src/pages/sales/SaleDetailPage.js
 */

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
  LinearProgress,
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
  AccountBalance,
  Phone,
  Email,
  Home,
  CheckCircle,
  Print,
  Download,
  Share,
  WhatsApp,
  AccountBalanceWallet,
  ExpandMore,
  Refresh,
  ContentCopy,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, formatPhoneNumber } from '../../utils/formatters';

// ============================================================================
// SAFE API IMPORT
// ============================================================================
let salesAPI;
try {
  const { salesAPI: api } = require('../../services/api');
  salesAPI = api;
} catch (error) {
  salesAPI = {
    getSale: () => Promise.reject(new Error('API not available')),
    cancelSale: () => Promise.reject(new Error('API not available')),
    generateSaleDocuments: () => Promise.reject(new Error('API not available')),
  };
}

// ============================================================================
// SAFE UTILITY FUNCTIONS
// ============================================================================

const safeString = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value || '-';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value !== null) {
    if (value.name) return String(value.name);
    if (value.value) return String(value.value);
    if (value.label) return String(value.label);
    if (value.title) return String(value.title);
    return '[Object]';
  }
  return String(value);
};

const getCustomerName = (sale) => {
  if (!sale?.lead) return 'Unknown Customer';
  
  if (typeof sale.lead === 'object') {
    const { firstName, lastName, email, phone } = sale.lead;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
    if (phone) return phone;
  }
  
  return typeof sale.lead === 'string' ? sale.lead : 'Unknown Customer';
};

const getProjectName = (sale) => {
  if (!sale?.project) return 'Unknown Project';
  if (typeof sale.project === 'object') {
    return sale.project.name || sale.project.title || 'Unknown Project';
  }
  return typeof sale.project === 'string' ? sale.project : 'Unknown Project';
};

const getUnitDisplayName = (sale) => {
  if (!sale?.unit) return 'Unknown Unit';
  if (typeof sale.unit === 'object') {
    return sale.unit.unitNumber || sale.unit.fullAddress || sale.unit.name || 'Unknown Unit';
  }
  return typeof sale.unit === 'string' ? sale.unit : 'Unknown Unit';
};

const getSalespersonName = (sale) => {
  if (!sale?.salesPerson) return 'Unassigned';
  if (typeof sale.salesPerson === 'object') {
    const { firstName, lastName, email } = sale.salesPerson;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
  }
  return typeof sale.salesPerson === 'string' ? sale.salesPerson : 'Unassigned';
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

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

// ============================================================================
// SALE OVERVIEW CARD - STATIC VERSION
// ============================================================================

const SaleOverviewCard = ({ sale, onEdit, onCancel, canEdit }) => {
  const handleCopyId = () => {
    if (navigator.clipboard && sale._id) {
      navigator.clipboard.writeText(sale._id);
    }
  };

  // Get status color based on sale status
  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'success';
      case 'agreement_signed': return 'info';
      case 'registration_pending': return 'warning';
      case 'registration_complete': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'agreement_signed': return 'Agreement Signed';
      case 'registration_pending': return 'Registration Pending';
      case 'registration_complete': return 'Registration Complete';
      case 'cancelled': return 'Cancelled';
      case 'on_hold': return 'On Hold';
      default: return 'Pending';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'on_track': return 'success';
      case 'delayed': return 'warning';
      case 'overdue': return 'error';
      case 'advance': return 'info';
      default: return 'default';
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'on_track': return 'On Track';
      case 'delayed': return 'Delayed';
      case 'overdue': return 'Overdue';
      case 'advance': return 'Advance';
      default: return 'Pending';
    }
  };
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h2">
              Sale #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase() || 'N/A'}
            </Typography>
            <Chip
              icon={<CheckCircle sx={{ fontSize: 18 }} />}
              label={getStatusLabel(sale.status)}
              color={getStatusColor(sale.status)}
              variant="outlined"
            />
            <IconButton size="small" onClick={handleCopyId} title="Copy Sale ID">
              <ContentCopy fontSize="small" />
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
                icon={<CheckCircle sx={{ fontSize: 18 }} />}
                label={getPaymentStatusLabel(sale.paymentStatus)}
                color={getPaymentStatusColor(sale.paymentStatus)}
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
                onClick={() => console.log('Generate receipt for sale:', sale._id)}
              >
                Generate Receipt
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                size="small"
                fullWidth
                onClick={() => window.open(`/payments/plans/${sale._id}`, '_blank')}
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

// ============================================================================
// CUSTOMER INFO CARD
// ============================================================================

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
              {safeString(leadData.email)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Lead Source
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(leadData.source)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Priority
            </Typography>
            <Chip
              label={safeString(leadData.priority) || 'Medium'}
              color={leadData.priority === 'High' ? 'error' : leadData.priority === 'Low' ? 'default' : 'warning'}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Requirements
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(leadData.requirements)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PROPERTY DETAILS CARD - ULTRA SAFE VERSION
// ============================================================================

const PropertyDetailsCard = ({ sale }) => {
  const projectData = sale.project || {};
  const unitData = sale.unit || {};
  
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
              {safeString(projectData.type)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Area
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {unitData.area ? `${safeString(unitData.area)} sq ft` : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Floor
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {unitData.floor ? `Floor ${safeString(unitData.floor)}` : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Bedrooms
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {unitData.bedrooms ? `${safeString(unitData.bedrooms)} BHK` : '-'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Type
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(unitData.unitType)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Facing
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(unitData.facing)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Project Location
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(projectData.location)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Amenities
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(unitData.amenities)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PAYMENT SUMMARY CARD
// ============================================================================

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
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SALE TIMELINE
// ============================================================================

const SaleTimeline = ({ sale }) => {
  const timelineEvents = [
    {
      date: sale.bookingDate || sale.createdAt,
      title: 'Sale Booked',
      description: 'Initial sale booking was created',
      color: 'success',
    },
    sale.agreementDate && {
      date: sale.agreementDate,
      title: 'Agreement Signed',
      description: 'Sale agreement was signed by customer',
      color: 'info',
    },
    sale.registrationDate && {
      date: sale.registrationDate,
      title: 'Registration Complete',
      description: 'Property registration was completed',
      color: 'success',
    },
    sale.cancelledAt && {
      date: sale.cancelledAt,
      title: 'Sale Cancelled',
      description: safeString(sale.cancellationReason) || 'Sale was cancelled',
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
                  <CheckCircle />
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

// ============================================================================
// SALESPERSON CARD
// ============================================================================

const SalesPersonCard = ({ sale }) => {
  const salespersonName = getSalespersonName(sale);
  const salespersonData = sale.salesPerson || {};
  
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
              {safeString(salespersonData.role)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Email
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(salespersonData.email)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SaleDetailPage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
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
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch sale data
  const fetchSaleData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      const response = await salesAPI.getSale(saleId);
      const saleData = response.data.data || response.data;
      setSale(saleData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching sale data:', error);
      
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

  // Check permissions safely
  const canEditSales = hasPermission && typeof hasPermission === 'function' ? hasPermission('SALES') : false;

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
        canEdit={canEditSales}
      />

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <CustomerInfoCard sale={sale} />
            <PropertyDetailsCard sale={sale} />
            <SaleTimeline sale={sale} />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <PaymentSummaryCard sale={sale} />
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
        {canEditSales && (
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
        <Divider />
        {canEditSales && (
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
      {isMobile && canEditSales && (
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
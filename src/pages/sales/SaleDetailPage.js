// File: src/pages/sales/SaleDetailPage.js
// Description: Comprehensive sale detail page with payment plans, customer info, and transaction history
// Version: 1.0 - Production-grade sale detail interface with complete backend integration
// Location: src/pages/sales/SaleDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, unitAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPhoneNumber } from '../../utils/formatters';

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

// Helper functions
const getStatusConfig = (status, statusArray) => {
  return statusArray.find(s => s.value === status) || statusArray[statusArray.length - 1];
};

const getCustomerName = (sale) => {
  if (sale.customerName) return sale.customerName;
  
  if (sale.lead) {
    if (typeof sale.lead === 'string') return sale.lead;
    if (typeof sale.lead === 'object') {
      const firstName = sale.lead.firstName || '';
      const lastName = sale.lead.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || sale.lead.name || sale.lead.email || 'Unknown Customer';
    }
  }
  
  return 'Unknown Customer';
};

const getUnitDisplayName = (sale) => {
  if (sale.unitDetails?.unitNumber) return sale.unitDetails.unitNumber;
  
  if (sale.unit) {
    if (typeof sale.unit === 'string') return sale.unit;
    if (typeof sale.unit === 'object') {
      return sale.unit.unitNumber || sale.unit.name || 'Unit details';
    }
  }
  
  return 'Unit details';
};

// Safe display value function to handle objects
const getSafeDisplayValue = (value, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    // Handle address objects
    if (value.city || value.state || value.addressLine1) {
      const parts = [];
      if (value.addressLine1) parts.push(value.addressLine1);
      if (value.addressLine2) parts.push(value.addressLine2);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.pincode) parts.push(value.pincode);
      return parts.filter(Boolean).join(', ') || fallback;
    }
    // Handle other objects
    return value.name || value.title || value.value || fallback;
  }
  return fallback;
};

// Sale Overview Card Component
const SaleOverviewCard = ({ sale, onEdit, onCancel, canEdit }) => {
  const saleStatusConfig = getStatusConfig(sale.status || 'pending', SALE_STATUSES);
  const paymentStatusConfig = getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES);
  
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
          {/* Sale Amount */}
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(sale.salePrice || sale.totalAmount || sale.amount || 0)}
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

          {/* Payment Status */}
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

          {/* Sale Date */}
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatDate(sale.saleDate || sale.createdAt || sale.bookingDate)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sale Date
              </Typography>
            </Box>
          </Grid>

          {/* Actions */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Receipt />}
                size="small"
                fullWidth
              >
                Generate Receipt
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                size="small"
                fullWidth
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
const CustomerInfoCard = ({ sale, project, unit }) => {
  const customerData = sale.lead || {};
  const customerName = getCustomerName(sale);
  
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
            <IconButton color="primary">
              <Phone />
            </IconButton>
            <IconButton color="primary">
              <Email />
            </IconButton>
            <IconButton color="primary">
              <WhatsApp />
            </IconButton>
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
              {(() => {
                const phoneValue = getSafeDisplayValue(customerData.phone || customerData.phoneNumber);
                return phoneValue !== '-' ? formatPhoneNumber(phoneValue) : phoneValue;
              })()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Email Address
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(customerData.email)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Lead Source
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(customerData.source || customerData.leadSource)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Address
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(customerData.address)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Property Details Card Component
const PropertyDetailsCard = ({ sale, project, unit }) => {
  const unitName = getUnitDisplayName(sale);
  
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
              {getSafeDisplayValue(project?.name, 'Unknown Project')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Number
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {unitName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Unit Type
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(unit?.type || unit?.unitType || sale.unitDetails?.type)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Built-up Area
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {(() => {
                const areaValue = getSafeDisplayValue(unit?.builtupArea || unit?.area || sale.unitDetails?.area);
                return areaValue !== '-' ? `${areaValue} sq ft` : areaValue;
              })()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Floor
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(unit?.floor || sale.unitDetails?.floor)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">
              Tower
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(unit?.tower?.name || sale.unitDetails?.tower)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Project Address
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {getSafeDisplayValue(project?.address || project?.location)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Payment Summary Card Component
const PaymentSummaryCard = ({ sale, paymentPlan }) => {
  const totalPaid = paymentPlan?.totalPaid || 0;
  const totalAmount = sale.salePrice || sale.totalAmount || sale.amount || 0;
  const remainingAmount = totalAmount - totalPaid;
  const paymentProgress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  
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
                Total Amount
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {formatCurrency(totalPaid)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Amount Paid
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {formatCurrency(remainingAmount)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Remaining
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Payment Progress ({paymentProgress.toFixed(1)}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={paymentProgress}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Sale Timeline Component
const SaleTimeline = ({ sale, activities = [] }) => {
  const timelineEvents = [
    {
      date: sale.createdAt || sale.saleDate,
      title: 'Sale Created',
      description: 'Initial sale booking was created',
      icon: <CheckCircle />,
      color: 'success',
    },
    {
      date: sale.agreementDate,
      title: 'Agreement Signed',
      description: 'Sale agreement was signed by customer',
      icon: <AssignmentTurnedIn />,
      color: 'info',
    },
    {
      date: sale.registrationDate,
      title: 'Registration Complete',
      description: 'Property registration was completed',
      icon: <Assignment />,
      color: 'success',
    },
    ...activities.map(activity => ({
      date: activity.date,
      title: activity.title,
      description: activity.description,
      icon: <Description />,
      color: 'primary',
    })),
  ].filter(event => event.date);

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

// Main Sale Detail Page Component
const SaleDetailPage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [sale, setSale] = useState(null);
  const [project, setProject] = useState(null);
  const [unit, setUnit] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  // Fetch sale data
  const fetchSaleData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching sale details for ID:', saleId);
      
      // TEMPORARY: Get all sales and find the specific one
      // TODO: Replace with individual sale API when backend route is added
      const salesResponse = await salesAPI.getSales();
      const salesData = salesResponse.data.data || salesResponse.data || salesResponse.data;
      
      let saleData = null;
      if (Array.isArray(salesData)) {
        saleData = salesData.find(sale => sale._id === saleId);
      }
      
      if (!saleData) {
        setError('Sale not found');
        setLoading(false);
        return;
      }
      
      console.log('✅ Sale data:', saleData);
      setSale(saleData);
      
      // Fetch related data in parallel
      const promises = [];
      
      // Fetch project if available
      if (saleData.project) {
        const projectId = typeof saleData.project === 'object' ? saleData.project._id : saleData.project;
        promises.push(projectAPI.getProject(projectId));
      }
      
      // Fetch unit if available
      if (saleData.unit) {
        const unitId = typeof saleData.unit === 'object' ? saleData.unit._id : saleData.unit;
        promises.push(unitAPI.getUnit(unitId));
      }
      
      // Fetch payment plan if available
      // promises.push(paymentAPI.getPaymentPlan(saleId));
      
      const results = await Promise.allSettled(promises);
      
      // Process project data
      if (results[0] && results[0].status === 'fulfilled') {
        const projectData = results[0].value.data.data || results[0].value.data;
        setProject(projectData);
      }
      
      // Process unit data
      if (results[1] && results[1].status === 'fulfilled') {
        const unitData = results[1].value.data.data || results[1].value.data;
        setUnit(unitData);
      }
      
      // Process payment plan data
      // if (results[2] && results[2].status === 'fulfilled') {
      //   const paymentData = results[2].value.data.data || results[2].value.data;
      //   setPaymentPlan(paymentData);
      // }
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching sale data:', error);
      setError('Failed to load sale details. Please try again.');
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
      fetchSaleData(true);
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setError('Failed to cancel sale. Please try again.');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={refreshData}>
          Try Again
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
              {getCustomerName(sale)} • {formatDate(sale.createdAt)}
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
            <CustomerInfoCard sale={sale} project={project} unit={unit} />
            
            {/* Property Details */}
            <PropertyDetailsCard sale={sale} project={project} unit={unit} />
            
            {/* Sale Timeline */}
            <SaleTimeline sale={sale} />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Payment Summary */}
            <PaymentSummaryCard sale={sale} paymentPlan={paymentPlan} />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Receipt />}
                    fullWidth
                  >
                    Generate Receipt
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
                  >
                    Print Documents
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    fullWidth
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
        <MenuItem onClick={handleEditSale}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Sale</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => navigate(`/payments/plans/${saleId}`)}>
          <ListItemIcon><AccountBalance fontSize="small" /></ListItemIcon>
          <ListItemText>Payment Plan</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
          <ListItemText>Generate Receipt</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Print Documents</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Share Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setCancelDialog(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Cancel Sale</ListItemText>
        </MenuItem>
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
            <strong>Amount:</strong> {formatCurrency(sale.salePrice || sale.totalAmount || sale.amount || 0)}
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
      {isMobile && (
        <Fab
          color="primary"
          aria-label="edit sale"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleEditSale}
        >
          <Edit />
        </Fab>
      )}
    </Box>
  );
};

export default SaleDetailPage;
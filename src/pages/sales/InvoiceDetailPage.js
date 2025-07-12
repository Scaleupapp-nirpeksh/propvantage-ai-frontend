// File: src/pages/sales/InvoiceDetailPage.js
// Description: Invoice detail page for PropVantage AI - Complete invoice management and viewing
// Version: 1.0 - Complete invoice detail with payment recording and status management
// Location: src/pages/sales/InvoiceDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,

  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  ListItemButton,
} from '@mui/material';

import {
  ArrowBack,
  Receipt,
  Edit,
  Payment,
  Cancel,
  Download,
  Print,
  Share,
  MoreVert,
  CheckCircle,
  Schedule,
  Warning,
  Error as ErrorIcon,
  AttachMoney,
  Person,
  Business,
  CalendarToday,
  AccountBalance,
  Assignment,
  History,
  Note,
  Visibility,
  PictureAsPdf,
  Send,
  MonetizationOn,
  Assessment,
  Info,
  ExpandMore,
  Update,
  AccountBalanceWallet,
} from '@mui/icons-material';

// Timeline components from @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { invoiceAPI, salesAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Invoice status configurations
const INVOICE_STATUS_CONFIG = {
  draft: { 
    label: 'Draft', 
    color: 'default', 
    icon: Edit,
    bgColor: '#f5f5f5',
    textColor: '#757575'
  },
  generated: { 
    label: 'Generated', 
    color: 'info', 
    icon: Receipt,
    bgColor: '#e3f2fd',
    textColor: '#1976d2'
  },
  sent: { 
    label: 'Sent', 
    color: 'primary', 
    icon: CheckCircle,
    bgColor: '#e8f5e8',
    textColor: '#2e7d32'
  },
  paid: { 
    label: 'Paid', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: '#e8f5e8',
    textColor: '#2e7d32'
  },
  overdue: { 
    label: 'Overdue', 
    color: 'error', 
    icon: Warning,
    bgColor: '#ffebee',
    textColor: '#c62828'
  },
  partially_paid: { 
    label: 'Partially Paid', 
    color: 'warning', 
    icon: Schedule,
    bgColor: '#fff3e0',
    textColor: '#ef6c00'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'error', 
    icon: Cancel,
    bgColor: '#ffebee',
    textColor: '#c62828'
  },
};

// Payment methods
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'online', label: 'Online Payment' },
  { value: 'other', label: 'Other' },
];

// Tab configuration
const TAB_CONFIG = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'line-items', label: 'Line Items', icon: Assignment },
  { id: 'payments', label: 'Payment History', icon: Payment },
  { id: 'timeline', label: 'Timeline', icon: History },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get customer display name
const getCustomerName = (customer) => {
  if (!customer) return 'Unknown Customer';
  const { firstName, lastName, email, phone } = customer;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) return email;
  if (phone) return phone;
  return 'Unknown Customer';
};

// Calculate payment progress
const getPaymentProgress = (invoice) => {
  if (!invoice.financialSummary || invoice.financialSummary.totalAmount === 0) return 0;
  return Math.round((invoice.paymentDetails.totalPaid / invoice.financialSummary.totalAmount) * 100);
};

// Get days overdue
const getDaysOverdue = (invoice) => {
  if (invoice.status !== 'overdue' && invoice.status !== 'partially_paid') return 0;
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffTime = today - dueDate;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Data state
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [actionMenu, setActionMenu] = useState({ open: false, anchorEl: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Payment recording state
  const [paymentDialog, setPaymentDialog] = useState({ open: false });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentDate: new Date(),
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Cancel dialog state
  const [cancelDialog, setCancelDialog] = useState({ open: false });
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch invoice details
  const fetchInvoiceDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await invoiceAPI.getInvoice(invoiceId);
      
      if (response.data.success) {
        setInvoice(response.data.data);
        
        // Set default payment amount to pending amount
        if (response.data.data.paymentDetails.pendingAmount > 0) {
          setPaymentData(prev => ({
            ...prev,
            amount: response.data.data.paymentDetails.pendingAmount.toString()
          }));
        }
      } else {
        throw new Error('Failed to fetch invoice details');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load invoice details. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, fetchInvoiceDetails]);

  // Update active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_CONFIG.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const params = new URLSearchParams(searchParams);
    if (newValue === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', newValue);
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  // Handle action menu
  const handleActionMenuOpen = (event) => {
    setActionMenu({ open: true, anchorEl: event.currentTarget });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ open: false, anchorEl: null });
  };

  // Handle payment recording
  const handleRecordPaymentOpen = () => {
    setPaymentDialog({ open: true });
    handleActionMenuClose();
  };

  const handleRecordPaymentClose = () => {
    setPaymentDialog({ open: false });
    setPaymentData({
      amount: invoice?.paymentDetails.pendingAmount?.toString() || '',
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentDate: new Date(),
    });
  };

  const handleRecordPayment = async () => {
    try {
      setRecordingPayment(true);

      const amount = parseFloat(paymentData.amount);
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (amount > invoice.paymentDetails.pendingAmount) {
        throw new Error('Payment amount cannot exceed pending amount');
      }

      await invoiceAPI.recordPayment(invoiceId, {
        amount,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        paymentDate: paymentData.paymentDate.toISOString(),
      });

      setSnackbar({
        open: true,
        message: `Payment of ${formatCurrency(amount)} recorded successfully!`,
        severity: 'success'
      });

      handleRecordPaymentClose();
      fetchInvoiceDetails(true);
    } catch (error) {
      console.error('Error recording payment:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Failed to record payment',
        severity: 'error'
      });
    } finally {
      setRecordingPayment(false);
    }
  };

  // Handle invoice cancellation
  const handleCancelInvoiceOpen = () => {
    setCancelDialog({ open: true });
    handleActionMenuClose();
  };

  const handleCancelInvoiceClose = () => {
    setCancelDialog({ open: false });
    setCancellationReason('');
  };

  const handleCancelInvoice = async () => {
    try {
      setCancelling(true);

      await invoiceAPI.cancelInvoice(invoiceId, {
        reason: cancellationReason || 'Invoice cancelled by user'
      });

      setSnackbar({
        open: true,
        message: 'Invoice cancelled successfully',
        severity: 'success'
      });

      handleCancelInvoiceClose();
      fetchInvoiceDetails(true);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel invoice',
        severity: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Handle navigation
  const handleBackToList = () => {
    navigate('/sales/invoices');
  };

  const handleViewSale = () => {
    if (invoice?.sale?._id) {
      navigate(`/sales/${invoice.sale._id}`);
    }
  };

  const handleDownloadPDF = () => {
    setSnackbar({
      open: true,
      message: 'PDF download feature coming soon',
      severity: 'info'
    });
    handleActionMenuClose();
  };

  const handleRefresh = () => {
    fetchInvoiceDetails(true);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderInvoiceStatusChip = (status) => {
    const config = INVOICE_STATUS_CONFIG[status] || INVOICE_STATUS_CONFIG.draft;
    const StatusIcon = config.icon;
    
    return (
      <Chip
        icon={<StatusIcon sx={{ fontSize: 16 }} />}
        label={config.label}
        size="large"
        sx={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: config.textColor,
          },
        }}
      />
    );
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Invoice Information Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Invoice Information" />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {invoice.invoiceNumber}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Invoice Date</Typography>
                <Typography variant="body1">
                  {formatDate(invoice.invoiceDate)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1">
                  {formatDate(invoice.dueDate)}
                  {getDaysOverdue(invoice) > 0 && (
                    <Chip
                      label={`${getDaysOverdue(invoice)} days overdue`}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {invoice.type.replace('_', ' ')}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Generated By</Typography>
                <Typography variant="body1">
                  {invoice.generatedBy?.firstName} {invoice.generatedBy?.lastName}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Customer Information Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Customer Information" />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {getCustomerName(invoice.customer)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.customer?.email}
                </Typography>
              </Box>
            </Box>
            
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">
                  {invoice.customer?.phone || 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {invoice.customer?.address || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Property Information Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Property Information" />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {invoice.project?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.project?.location}
                </Typography>
              </Box>
            </Box>
            
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">Unit Number</Typography>
                <Typography variant="body1">
                  {invoice.unit?.unitNumber}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Area</Typography>
                <Typography variant="body1">
                  {invoice.unit?.area} sq ft
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {invoice.unit?.fullAddress || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Financial Summary Card */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Financial Summary" />
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(invoice.financialSummary.subtotal)}
                </Typography>
              </Box>
              
              {invoice.financialSummary.discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Discount</Typography>
                  <Typography variant="body1" color="success.main">
                    -{formatCurrency(invoice.financialSummary.discountAmount)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">GST Amount</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(invoice.financialSummary.totalGstAmount)}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">Total Amount</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {formatCurrency(invoice.financialSummary.totalAmount)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
                <Typography variant="body1" fontWeight="medium" color="success.main">
                  {formatCurrency(invoice.paymentDetails.totalPaid)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pending Amount</Typography>
                <Typography variant="body1" fontWeight="medium" color="warning.main">
                  {formatCurrency(invoice.paymentDetails.pendingAmount)}
                </Typography>
              </Box>
              
              {/* Payment Progress */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Payment Progress</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getPaymentProgress(invoice)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={getPaymentProgress(invoice)} 
                  color={getPaymentProgress(invoice) === 100 ? 'success' : getPaymentProgress(invoice) > 50 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Notes Card */}
      {(invoice.notes?.customerNotes || invoice.notes?.paymentInstructions) && (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Notes & Instructions" />
            <CardContent>
              <Grid container spacing={2}>
                {invoice.notes?.customerNotes && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Customer Notes</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {invoice.notes.customerNotes}
                    </Typography>
                  </Grid>
                )}
                
                {invoice.notes?.paymentInstructions && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Payment Instructions</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {invoice.notes.paymentInstructions}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderLineItemsTab = () => (
    <Card>
      <CardHeader title="Invoice Line Items" />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">GST Rate</TableCell>
                <TableCell align="right">GST Amount</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.lineItems?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.description}
                      </Typography>
                      {item.itemCode && (
                        <Typography variant="caption" color="text.secondary">
                          Code: {item.itemCode}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.category.replace('_', ' ')} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell align="right">
                    {item.gstRate}%
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.gstAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderPaymentsTab = () => (
    <Card>
      <CardHeader 
        title="Payment History" 
        action={
          invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button
              variant="contained"
              startIcon={<Payment />}
              onClick={handleRecordPaymentOpen}
              disabled={invoice.paymentDetails.pendingAmount <= 0}
            >
              Record Payment
            </Button>
          )
        }
      />
      <CardContent>
        {/* Payment Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(invoice.financialSummary.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invoice Amount
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {formatCurrency(invoice.paymentDetails.totalPaid)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount Paid
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {formatCurrency(invoice.paymentDetails.pendingAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Amount
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Payment History Table */}
        <Typography variant="h6" gutterBottom>
          Payment Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No payment transactions recorded yet.
        </Typography>
      </CardContent>
    </Card>
  );

  const renderTimelineTab = () => (
    <Card>
      <CardHeader title="Invoice Timeline" />
      <CardContent>
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <Receipt />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6" component="span">
                Invoice Generated
              </Typography>
              <Typography color="text.secondary">
                {formatDateTime(invoice.createdAt)}
              </Typography>
              <Typography variant="body2">
                Invoice {invoice.invoiceNumber} was generated by {invoice.generatedBy?.firstName} {invoice.generatedBy?.lastName}
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {invoice.sentDate && (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <Send />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Invoice Sent
                </Typography>
                <Typography color="text.secondary">
                  {formatDateTime(invoice.sentDate)}
                </Typography>
                <Typography variant="body2">
                  Invoice was sent to customer
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}

          {invoice.paidDate && (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <CheckCircle />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Payment Received
                </Typography>
                <Typography color="text.secondary">
                  {formatDateTime(invoice.paidDate)}
                </Typography>
                <Typography variant="body2">
                  Full payment received
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}

          {invoice.cancellationDetails?.cancelledAt && (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="error">
                  <Cancel />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Invoice Cancelled
                </Typography>
                <Typography color="text.secondary">
                  {formatDateTime(invoice.cancellationDetails.cancelledAt)}
                </Typography>
                <Typography variant="body2">
                  Reason: {invoice.cancellationDetails.cancellationReason}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
        </Timeline>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Invoice not found. Please check the invoice ID and try again.
        </Alert>
      </Box>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBackToList} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Invoice {invoice.invoiceNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {renderInvoiceStatusChip(invoice.status)}
              <Typography variant="body2" color="text.secondary">
                Created {formatDate(invoice.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {invoice.sale && (
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={handleViewSale}
              >
                View Sale
              </Button>
            )}
            
            <IconButton 
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
            >
              <Update />
            </IconButton>
            
            <IconButton onClick={handleActionMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Actions Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Total Amount: {formatCurrency(invoice.financialSummary.totalAmount)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getPaymentProgress(invoice)} 
                  color={getPaymentProgress(invoice) === 100 ? 'success' : 'warning'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {getPaymentProgress(invoice)}% paid • {formatCurrency(invoice.paymentDetails.pendingAmount)} pending
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <Button
                      variant="contained"
                      startIcon={<Payment />}
                      onClick={handleRecordPaymentOpen}
                      disabled={invoice.paymentDetails.pendingAmount <= 0}
                    >
                      Record Payment
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<PictureAsPdf />}
                    onClick={handleDownloadPDF}
                  >
                    Download PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {TAB_CONFIG.map((tab) => (
              <Tab
                key={tab.id}
                label={tab.label}
                value={tab.id}
                icon={<tab.icon />}
                iconPosition="start"
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'line-items' && renderLineItemsTab()}
            {activeTab === 'payments' && renderPaymentsTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
          </Box>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={actionMenu.open}
          onClose={handleActionMenuClose}
          PaperProps={{ sx: { minWidth: 200 } }}
        >
          <MenuItem onClick={handleDownloadPDF}>
            <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => console.log('Edit invoice')}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Invoice</ListItemText>
          </MenuItem>
          
          <Divider />
          
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <MenuItem onClick={handleCancelInvoiceOpen} sx={{ color: 'error.main' }}>
              <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Cancel Invoice</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Record Payment Dialog */}
        <Dialog
          open={paymentDialog.open}
          onClose={handleRecordPaymentClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  inputProps={{ min: 0, max: invoice.paymentDetails.pendingAmount }}
                  helperText={`Maximum: ${formatCurrency(invoice.paymentDetails.pendingAmount)}`}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    label="Payment Method"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Reference"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentReference: e.target.value }))}
                  placeholder="Transaction ID, Cheque Number, etc."
                />
              </Grid>
              
              <Grid item xs={12}>
                <DatePicker
                  label="Payment Date"
                  value={paymentData.paymentDate}
                  onChange={(date) => setPaymentData(prev => ({ ...prev, paymentDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRecordPaymentClose}>Cancel</Button>
            <Button 
              onClick={handleRecordPayment}
              variant="contained"
              disabled={recordingPayment || !paymentData.amount || parseFloat(paymentData.amount) <= 0}
            >
              {recordingPayment ? <CircularProgress size={20} /> : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Invoice Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={handleCancelInvoiceClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to cancel this invoice? This action cannot be undone.
            </DialogContentText>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Cancellation Reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelInvoiceClose}>Cancel</Button>
            <Button 
              onClick={handleCancelInvoice}
              color="error"
              variant="contained"
              disabled={cancelling}
            >
              {cancelling ? <CircularProgress size={20} /> : 'Cancel Invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default InvoiceDetailPage;
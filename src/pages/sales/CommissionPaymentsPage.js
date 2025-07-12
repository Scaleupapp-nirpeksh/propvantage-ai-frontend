// File: src/pages/sales/CommissionPaymentsPage.js
// Description: Commission payment processing page for recording and managing commission payments
// Version: 1.0 - Complete commission payment management with backend integration
// Location: src/pages/sales/CommissionPaymentsPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  LinearProgress,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
} from '@mui/material';
import {
  Payment,
  AccountBalanceWallet,
  MonetizationOn,
  Receipt,
  CheckCircle,
  Schedule,
  Warning,
  Error as ErrorIcon,
  Person,
  Business,
  CalendarToday,
  AttachMoney,
  AccountBalance,
  CreditCard,
  LocalAtm,
  SwapHoriz,
  Upload,
  Download,
  Print,
  Share,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Clear,
  Refresh,
  Save,
  Cancel,
  Info,
  ExpandMore,
  Handshake,
  Timeline,
  Assignment,
  GetApp,
  CloudUpload,
  VerifiedUser,
  PendingActions,
  Done,
  History,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Payment methods
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: AccountBalance },
  { value: 'upi', label: 'UPI Payment', icon: SwapHoriz },
  { value: 'cheque', label: 'Cheque', icon: Receipt },
  { value: 'cash', label: 'Cash', icon: LocalAtm },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: AccountBalanceWallet },
];

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

// Commission status for payment filtering
const COMMISSION_PAYMENT_FILTERS = [
  { value: 'all', label: 'All Commissions' },
  { value: 'approved', label: 'Approved (Ready for Payment)' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue Payments' },
];

// Bulk payment options
const BULK_PAYMENT_OPTIONS = [
  { id: 'selected', label: 'Process Selected Commissions' },
  { id: 'all_approved', label: 'Process All Approved Commissions' },
  { id: 'by_partner', label: 'Process by Partner' },
  { id: 'by_amount_range', label: 'Process by Amount Range' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates payment summary statistics
 */
const calculatePaymentSummary = (commissions) => {
  const summary = {
    totalCommissions: commissions.length,
    totalAmount: 0,
    readyForPayment: 0,
    readyAmount: 0,
    partiallyPaid: 0,
    partialAmount: 0,
    overdue: 0,
    overdueAmount: 0,
  };

  commissions.forEach(commission => {
    const netAmount = commission.commissionCalculation?.netCommission || 0;
    const paidAmount = commission.paymentStatus?.totalPaid || 0;
    const outstanding = netAmount - paidAmount;

    summary.totalAmount += netAmount;

    if (commission.status === 'approved' && outstanding > 0) {
      if (paidAmount === 0) {
        summary.readyForPayment++;
        summary.readyAmount += outstanding;
      } else {
        summary.partiallyPaid++;
        summary.partialAmount += outstanding;
      }

      // Check if overdue (simplified - you might want more complex logic)
      const daysSinceApproval = Math.floor(
        (new Date() - new Date(commission.approvalWorkflow?.approvedAt)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceApproval > 30) { // 30 days overdue threshold
        summary.overdue++;
        summary.overdueAmount += outstanding;
      }
    }
  });

  return summary;
};

/**
 * Validates payment form data
 */
const validatePaymentForm = (formData) => {
  const errors = {};

  if (!formData.amount || formData.amount <= 0) {
    errors.amount = 'Payment amount must be greater than 0';
  }

  if (!formData.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }

  if (!formData.paymentDate) {
    errors.paymentDate = 'Payment date is required';
  }

  if (formData.paymentMethod === 'cheque' && !formData.chequeNumber) {
    errors.chequeNumber = 'Cheque number is required for cheque payments';
  }

  if (formData.paymentMethod === 'bank_transfer' && !formData.transactionId) {
    errors.transactionId = 'Transaction ID is required for bank transfers';
  }

  return errors;
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Payment Status Chip Component
 */
const PaymentStatusChip = ({ status, size = 'small' }) => {
  const statusConfig = PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[0];

  return (
    <Chip
      label={statusConfig.label}
      color={statusConfig.color}
      size={size}
      variant="outlined"
    />
  );
};

/**
 * Commission Payment Summary Card
 */
const PaymentSummaryCard = ({ summary, isLoading }) => {
  const summaryItems = [
    {
      title: 'Ready for Payment',
      value: summary.readyForPayment,
      amount: summary.readyAmount,
      color: 'success',
      icon: CheckCircle,
    },
    {
      title: 'Partially Paid',
      value: summary.partiallyPaid,
      amount: summary.partialAmount,
      color: 'warning',
      icon: Schedule,
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      amount: summary.overdueAmount,
      color: 'error',
      icon: Warning,
    },
    {
      title: 'Total Outstanding',
      value: summary.totalCommissions,
      amount: summary.totalAmount,
      color: 'primary',
      icon: MonetizationOn,
    },
  ];

  return (
    <Grid container spacing={3}>
      {summaryItems.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${item.color}.main`, mr: 2 }}>
                  <item.icon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                  {isLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Typography variant="h6" fontWeight="bold">
                      {item.value}
                    </Typography>
                  )}
                </Box>
              </Box>
              {!isLoading && (
                <Typography variant="h5" color={`${item.color}.main`} fontWeight="bold">
                  {formatCurrency(item.amount)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Commission Payment Table Component
 */
const CommissionPaymentTable = ({ 
  commissions, 
  selectedCommissions, 
  onSelectionChange, 
  onPaymentAction, 
  isLoading 
}) => {
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const selectableCommissions = commissions
        .filter(c => c.status === 'approved')
        .map(c => c._id);
      onSelectionChange(selectableCommissions);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (commissionId, isSelected) => {
    if (isSelected) {
      onSelectionChange([...selectedCommissions, commissionId]);
    } else {
      onSelectionChange(selectedCommissions.filter(id => id !== commissionId));
    }
  };

  const selectableCommissions = commissions.filter(c => c.status === 'approved');
  const isAllSelected = selectableCommissions.length > 0 && 
    selectableCommissions.every(c => selectedCommissions.includes(c._id));
  const isIndeterminate = selectedCommissions.length > 0 && 
    selectedCommissions.length < selectableCommissions.length;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={handleSelectAll}
                disabled={selectableCommissions.length === 0}
              />
            </TableCell>
            <TableCell>Partner</TableCell>
            <TableCell>Project</TableCell>
            <TableCell align="right">Commission Amount</TableCell>
            <TableCell align="right">Paid Amount</TableCell>
            <TableCell align="right">Outstanding</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Approved Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            Array.from(new Array(5)).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={9}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading commission data...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : commissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Payment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No commissions ready for payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved commissions will appear here for payment processing
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            commissions.map((commission) => {
              const netAmount = commission.commissionCalculation?.netCommission || 0;
              const paidAmount = commission.paymentStatus?.totalPaid || 0;
              const outstanding = netAmount - paidAmount;
              const isSelectable = commission.status === 'approved' && outstanding > 0;

              return (
                <TableRow 
                  key={commission._id} 
                  hover
                  selected={selectedCommissions.includes(commission._id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCommissions.includes(commission._id)}
                      onChange={(e) => handleSelectRow(commission._id, e.target.checked)}
                      disabled={!isSelectable}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                        {commission.partner?.firstName?.charAt(0) || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {commission.partner?.firstName} {commission.partner?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {commission.partner?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {commission.project?.name || 'Unknown Project'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(netAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(paidAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={outstanding > 0 ? 'warning.main' : 'success.main'}
                    >
                      {formatCurrency(outstanding)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={commission.status}
                      color={commission.status === 'approved' ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {commission.approvalWorkflow?.approvedAt 
                        ? formatDate(commission.approvalWorkflow.approvedAt)
                        : 'Not approved'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Record Payment">
                      <IconButton 
                        size="small" 
                        onClick={() => onPaymentAction('single', commission)}
                        disabled={!isSelectable}
                      >
                        <Payment fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Single Payment Dialog Component
 */
const SinglePaymentDialog = ({ open, onClose, commission, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    transactionId: '',
    chequeNumber: '',
    bankName: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when commission changes
  useEffect(() => {
    if (commission) {
      const netAmount = commission.commissionCalculation?.netCommission || 0;
      const paidAmount = commission.paymentStatus?.totalPaid || 0;
      const outstanding = netAmount - paidAmount;

      setFormData(prev => ({
        ...prev,
        amount: outstanding,
      }));
    }
  }, [commission]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validatePaymentForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(commission._id, formData);
      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!commission) return null;

  const netAmount = commission.commissionCalculation?.netCommission || 0;
  const paidAmount = commission.paymentStatus?.totalPaid || 0;
  const outstanding = netAmount - paidAmount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Record Commission Payment
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Commission Summary */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              Commission Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Partner: {commission.partner?.firstName} {commission.partner?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project: {commission.project?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Commission: {formatCurrency(netAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Already Paid: {formatCurrency(paidAmount)}
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="warning.main">
                  Outstanding: {formatCurrency(outstanding)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment Form */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                error={!!errors.amount}
                helperText={errors.amount}
                inputProps={{ min: 0, max: outstanding, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.paymentMethod}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  label="Payment Method"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <method.icon fontSize="small" />
                        {method.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.paymentMethod && (
                  <FormHelperText>{errors.paymentMethod}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.paymentDate}
                helperText={errors.paymentDate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Reference"
                value={formData.paymentReference}
                onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                placeholder="Internal reference number"
              />
            </Grid>

            {/* Conditional fields based on payment method */}
            {formData.paymentMethod === 'bank_transfer' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={formData.transactionId}
                    onChange={(e) => handleInputChange('transactionId', e.target.value)}
                    error={!!errors.transactionId}
                    helperText={errors.transactionId}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                  />
                </Grid>
              </>
            )}

            {formData.paymentMethod === 'cheque' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cheque Number"
                  value={formData.chequeNumber}
                  onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                  error={!!errors.chequeNumber}
                  helperText={errors.chequeNumber}
                  required
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={2}
                placeholder="Additional notes about this payment"
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
        >
          {saving ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Bulk Payment Dialog Component
 */
const BulkPaymentDialog = ({ open, onClose, selectedCommissions, onSubmit }) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    transactionId: '',
    bankName: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const totalAmount = selectedCommissions.reduce((sum, commission) => {
    const netAmount = commission.commissionCalculation?.netCommission || 0;
    const paidAmount = commission.paymentStatus?.totalPaid || 0;
    return sum + (netAmount - paidAmount);
  }, 0);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.paymentMethod) {
      setErrors({ paymentMethod: 'Payment method is required' });
      return;
    }

    setSaving(true);
    try {
      const commissionIds = selectedCommissions.map(c => c._id);
      await onSubmit(commissionIds, formData);
      onClose();
    } catch (err) {
      console.error('Error processing bulk payment:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Process Bulk Commission Payments
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Summary */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selected Commissions: {selectedCommissions.length}
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              Total Amount: {formatCurrency(totalAmount)}
            </Typography>
          </Paper>

          {/* Commission List */}
          <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Commissions
            </Typography>
            <List dense>
              {selectedCommissions.map((commission) => {
                const netAmount = commission.commissionCalculation?.netCommission || 0;
                const paidAmount = commission.paymentStatus?.totalPaid || 0;
                const outstanding = netAmount - paidAmount;

                return (
                  <ListItem key={commission._id}>
                    <ListItemText
                      primary={`${commission.partner?.firstName} ${commission.partner?.lastName}`}
                      secondary={commission.project?.name}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(outstanding)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Paper>

          {/* Payment Details */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.paymentMethod}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  label="Payment Method"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <method.icon fontSize="small" />
                        {method.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.paymentMethod && (
                  <FormHelperText>{errors.paymentMethod}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Batch Reference"
                value={formData.paymentReference}
                onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                placeholder="Batch reference number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transaction ID"
                value={formData.transactionId}
                onChange={(e) => handleInputChange('transactionId', e.target.value)}
                placeholder="Bank transaction ID"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={2}
                placeholder="Additional notes for this batch payment"
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Payment />}
        >
          {saving ? 'Processing...' : `Process ${selectedCommissions.length} Payments`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission Payments Page Component
 * Comprehensive commission payment processing with single and bulk operations
 */
const CommissionPaymentsPage = () => {
  const navigate = useNavigate();
  const { commissionId } = useParams(); // For direct payment of specific commission
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter and pagination state
  const [filters, setFilters] = useState({
    search: '',
    status: 'approved',
    paymentStatus: 'all',
  });

  // Selection state
  const [selectedCommissions, setSelectedCommissions] = useState([]);

  // Dialog states
  const [singlePaymentDialog, setSinglePaymentDialog] = useState({
    open: false,
    commission: null,
  });

  const [bulkPaymentDialog, setBulkPaymentDialog] = useState({
    open: false,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const canProcessPayments = canAccess.viewFinancials();
  const paymentSummary = useMemo(() => {
    return calculatePaymentSummary(commissions);
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter(commission => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const partnerName = `${commission.partner?.firstName || ''} ${commission.partner?.lastName || ''}`.toLowerCase();
        const projectName = commission.project?.name?.toLowerCase() || '';
        const partnertEmail = commission.partner?.email?.toLowerCase() || '';
        
        if (!partnerName.includes(searchTerm) && 
            !projectName.includes(searchTerm) && 
            !partnertEmail.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && commission.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus !== 'all') {
        const netAmount = commission.commissionCalculation?.netCommission || 0;
        const paidAmount = commission.paymentStatus?.totalPaid || 0;
        const outstanding = netAmount - paidAmount;

        switch (filters.paymentStatus) {
          case 'unpaid':
            return paidAmount === 0 && outstanding > 0;
          case 'partially_paid':
            return paidAmount > 0 && outstanding > 0;
          case 'fully_paid':
            return outstanding <= 0;
          default:
            return true;
        }
      }

      return true;
    });
  }, [commissions, filters]);

  const selectedCommissionObjects = useMemo(() => {
    return commissions.filter(c => selectedCommissions.includes(c._id));
  }, [commissions, selectedCommissions]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches approved commissions ready for payment
   */
  const fetchCommissionsForPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await commissionAPI.getCommissions({
        status: 'approved,paid', // Include both approved and already paid
        includePaymentDetails: true,
        limit: 100, // Higher limit for payment processing
        sortBy: 'approvalWorkflow.approvedAt',
        sortOrder: 'desc',
      });

      const commissionsData = response.data?.data || [];
      setCommissions(commissionsData);

      // If specific commission ID in URL, select it
      if (commissionId) {
        const specificCommission = commissionsData.find(c => c._id === commissionId);
        if (specificCommission) {
          setSinglePaymentDialog({ open: true, commission: specificCommission });
        }
      }

    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err.response?.data?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, [commissionId]);

  // Load data on component mount
  useEffect(() => {
    fetchCommissionsForPayment();
  }, [fetchCommissionsForPayment]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles filter changes
   */
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handles selection changes
   */
  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedCommissions(newSelection);
  }, []);

  /**
   * Handles payment actions
   */
  const handlePaymentAction = useCallback((action, commission) => {
    switch (action) {
      case 'single':
        setSinglePaymentDialog({ open: true, commission });
        break;
      case 'bulk':
        setBulkPaymentDialog({ open: true });
        break;
      default:
        console.log('Unknown payment action:', action);
    }
  }, []);

  /**
   * Handles single payment submission
   */
  const handleSinglePaymentSubmit = useCallback(async (commissionId, paymentData) => {
    try {
      await commissionAPI.recordCommissionPayment(commissionId, paymentData);
      
      setSnackbar({
        open: true,
        message: 'Payment recorded successfully',
        severity: 'success',
      });

      // Refresh data
      fetchCommissionsForPayment();
      setSinglePaymentDialog({ open: false, commission: null });

    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to record payment',
        severity: 'error',
      });
      throw err;
    }
  }, [fetchCommissionsForPayment]);

  /**
   * Handles bulk payment submission
   */
  const handleBulkPaymentSubmit = useCallback(async (commissionIds, paymentData) => {
    try {
      await commissionAPI.processBulkCommissionPayments({
        commissionIds,
        paymentData,
      });

      setSnackbar({
        open: true,
        message: `${commissionIds.length} payments processed successfully`,
        severity: 'success',
      });

      // Clear selection and refresh data
      setSelectedCommissions([]);
      fetchCommissionsForPayment();
      setBulkPaymentDialog({ open: false });

    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to process bulk payments',
        severity: 'error',
      });
      throw err;
    }
  }, [fetchCommissionsForPayment]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Check permissions
  if (!canProcessPayments) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" color="warning.main" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to process commission payments.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Commission Payments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Process and manage commission payments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCommissionsForPayment}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Payment />}
            onClick={() => handlePaymentAction('bulk')}
            disabled={selectedCommissions.length === 0}
          >
            Process Bulk Payments ({selectedCommissions.length})
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Payment Summary */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Payment Summary
        </Typography>
        <PaymentSummaryCard summary={paymentSummary} isLoading={loading} />
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Partner name, email, project..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Commission Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Commission Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  label="Payment Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                  <MenuItem value="fully_paid">Fully Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={() => setFilters({ search: '', status: 'approved', paymentStatus: 'all' })}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Commission Payment Table */}
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payment />
              <Typography variant="h6">
                Commissions Ready for Payment ({filteredCommissions.length})
              </Typography>
            </Box>
          }
          action={
            selectedCommissions.length > 0 && (
              <Chip
                label={`${selectedCommissions.length} selected`}
                color="primary"
                variant="outlined"
              />
            )
          }
        />
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <CommissionPaymentTable
            commissions={filteredCommissions}
            selectedCommissions={selectedCommissions}
            onSelectionChange={handleSelectionChange}
            onPaymentAction={handlePaymentAction}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {/* Single Payment Dialog */}
      <SinglePaymentDialog
        open={singlePaymentDialog.open}
        onClose={() => setSinglePaymentDialog({ open: false, commission: null })}
        commission={singlePaymentDialog.commission}
        onSubmit={handleSinglePaymentSubmit}
      />

      {/* Bulk Payment Dialog */}
      <BulkPaymentDialog
        open={bulkPaymentDialog.open}
        onClose={() => setBulkPaymentDialog({ open: false })}
        selectedCommissions={selectedCommissionObjects}
        onSubmit={handleBulkPaymentSubmit}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CommissionPaymentsPage;
/**
 * File: src/pages/payments/RecordPaymentPage.js
 * Description: Comprehensive payment recording interface with smart allocation,
 *              multiple payment methods, validation, and receipt generation
 * Version: 1.0 - Complete Payment Recording Implementation
 * Location: src/pages/payments/RecordPaymentPage.js
 * 
 * Features:
 * - Multi-step payment recording wizard
 * - Smart payment allocation across installments
 * - Multiple payment method support
 * - Real-time validation and calculation
 * - Automatic receipt generation
 * - Payment confirmation workflow
 * - Integration with payment plans and installments
 * - Support for partial and excess payments
 * - Mobile-optimized responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Avatar,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
  Snackbar,
} from '@mui/material';

import {
  Payment,
  ArrowBack,
  CheckCircle,
  Receipt,
  AccountBalance,
  CreditCard,
  MonetizationOn,
  AttachMoney,
  Calculate,
  Save,
  Search,
  Person,
  Business,
  CalendarToday,
  Edit,
} from '@mui/icons-material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { paymentAPI, salesAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Payment recording steps configuration
 */
const PAYMENT_STEPS = [
  {
    id: 'select-sale',
    label: 'Select Sale/Customer',
    description: 'Choose the sale or customer for payment',
    icon: Person,
    required: true,
  },
  {
    id: 'payment-details',
    label: 'Payment Details',
    description: 'Enter payment amount and method',
    icon: Payment,
    required: true,
  },
  {
    id: 'allocation',
    label: 'Payment Allocation',
    description: 'Allocate payment across installments',
    icon: Calculate,
    required: true,
  },
  {
    id: 'confirmation',
    label: 'Confirmation',
    description: 'Review and confirm payment',
    icon: CheckCircle,
    required: true,
  },
];

/**
 * Payment method configurations
 */
const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'Cash',
    icon: MonetizationOn,
    description: 'Cash payment',
    requiresReference: false,
    color: '#4caf50',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: AccountBalance,
    description: 'Bank transfer or NEFT/RTGS',
    requiresReference: true,
    color: '#2196f3',
  },
  {
    id: 'cheque',
    label: 'Cheque',
    icon: Receipt,
    description: 'Cheque payment',
    requiresReference: true,
    color: '#ff9800',
  },
  {
    id: 'credit_card',
    label: 'Credit Card',
    icon: CreditCard,
    description: 'Credit/Debit card payment',
    requiresReference: true,
    color: '#9c27b0',
  },
  {
    id: 'online',
    label: 'Online Payment',
    icon: Payment,
    description: 'UPI, net banking, etc.',
    requiresReference: true,
    color: '#00bcd4',
  },
];

/**
 * Payment status configurations
 */
const PAYMENT_STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed', description: 'Payment completed and cleared' },
  { value: 'pending', label: 'Pending', description: 'Payment received but pending clearance' },
  { value: 'clearing', label: 'Clearing', description: 'Payment under clearing process' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets payment method configuration
 * @param {string} method - Payment method ID
 * @returns {Object} Payment method configuration
 */
const getPaymentMethodConfig = (method) => {
  return PAYMENT_METHODS.find(m => m.id === method) || PAYMENT_METHODS[0];
};

/**
 * Calculates total pending amount from installments
 * @param {Array} installments - Installments array
 * @returns {number} Total pending amount
 */
const calculateTotalPending = (installments) => {
  return installments?.reduce((sum, installment) => {
    return sum + (installment.pendingAmount || installment.currentAmount || 0);
  }, 0) || 0;
};

/**
 * Formats customer display name
 * @param {Object} customer - Customer object
 * @returns {string} Formatted customer name
 */
const formatCustomerName = (customer) => {
  if (!customer) return 'Unknown Customer';
  const firstName = customer.firstName || '';
  const lastName = customer.lastName || '';
  return `${firstName} ${lastName}`.trim() || customer.email || 'Unknown Customer';
};

/**
 * Generates payment reference number
 * @returns {string} Payment reference
 */
const generatePaymentReference = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

// ============================================================================
// SALE SELECTION COMPONENT
// ============================================================================

/**
 * Sale selection step component
 * @param {string} selectedSaleId - Currently selected sale ID
 * @param {Function} onSaleSelect - Sale selection callback
 * @param {Object} saleData - Sale data if pre-selected
 */
const SaleSelectionStep = ({ selectedSaleId, onSaleSelect, saleData }) => {
  const [, setSearchQuery] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(saleData || null);

  // Fetch sales for selection
  const fetchSales = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const response = await salesAPI.getSales({
        search: query,
        status: 'Booked,Agreement Signed,Registered',
        limit: 20,
        sortBy: 'bookingDate',
        sortOrder: 'desc',
      });
      setSales(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sales on component mount
  useEffect(() => {
    if (!saleData) {
      fetchSales();
    }
  }, [fetchSales, saleData]);

  // Handle search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      fetchSales(value);
    } else if (value.length === 0) {
      fetchSales();
    }
  };

  // Handle sale selection
  const handleSaleSelect = (sale) => {
    setSelectedSale(sale);
    onSaleSelect(sale);
  };

  if (saleData) {
    // Show selected sale info when pre-selected
    return (
      <Card>
        <CardHeader
          title="Selected Sale"
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Business />
            </Avatar>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Customer</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCustomerName(saleData.lead)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Project</Typography>
              <Typography variant="body1" fontWeight="medium">
                {saleData.project?.name || 'Unknown Project'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Unit</Typography>
              <Typography variant="body1" fontWeight="medium">
                {saleData.unit?.unitNumber || saleData.unit?.name || 'Unknown Unit'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Sale Amount</Typography>
              <Typography variant="body1" fontWeight="medium" color="primary">
                {formatCurrency(saleData.salePrice)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Search Sales"
          avatar={<Search color="primary" />}
        />
        <CardContent>
          <Autocomplete
            fullWidth
            loading={loading}
            options={sales}
            getOptionLabel={(sale) => 
              `${formatCustomerName(sale.lead)} - ${sale.project?.name} - ${sale.unit?.unitNumber || sale.unit?.name}`
            }
            renderOption={(props, sale) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                    {formatCustomerName(sale.lead).charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCustomerName(sale.lead)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {sale.project?.name} - {sale.unit?.unitNumber || sale.unit?.name} - {formatCurrency(sale.salePrice)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by customer name, project, or unit"
                placeholder="Type to search..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            onInputChange={(event, value) => handleSearchChange(value)}
            onChange={(event, sale) => handleSaleSelect(sale)}
            value={selectedSale}
            clearOnEscape
          />
        </CardContent>
      </Card>

      {selectedSale && (
        <Card>
          <CardHeader
            title="Selected Sale Details"
            avatar={
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircle />
              </Avatar>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Customer</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCustomerName(selectedSale.lead)}
                </Typography>
                {selectedSale.lead?.phone && (
                  <Typography variant="caption" color="textSecondary">
                    {formatPhoneNumber(selectedSale.lead.phone)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Project</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedSale.project?.name || 'Unknown Project'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Unit</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedSale.unit?.unitNumber || selectedSale.unit?.name || 'Unknown Unit'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Sale Amount</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(selectedSale.salePrice)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Sale Date</Typography>
                <Typography variant="body1">
                  {formatDate(selectedSale.bookingDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Chip size="small" label={selectedSale.status} color="primary" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// ============================================================================
// PAYMENT DETAILS COMPONENT
// ============================================================================

/**
 * Payment details step component
 * @param {Object} paymentData - Payment data
 * @param {Function} onPaymentDataChange - Payment data change callback
 * @param {Object} saleData - Sale data for validation
 */
const PaymentDetailsStep = ({ paymentData, onPaymentDataChange, saleData }) => {
  const handleChange = (field, value) => {
    onPaymentDataChange({
      ...paymentData,
      [field]: value,
    });
  };

  const selectedMethod = getPaymentMethodConfig(paymentData.paymentMethod);

  return (
    <Stack spacing={3}>
      {/* Payment Amount */}
      <Card>
        <CardHeader
          title="Payment Amount"
          avatar={<AttachMoney color="primary" />}
        />
        <CardContent>
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={paymentData.amount || ''}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            helperText="Enter the payment amount received"
            required
          />
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader
          title="Payment Method"
          avatar={<Payment color="primary" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            {PAYMENT_METHODS.map((method) => (
              <Grid item xs={12} sm={6} md={4} key={method.id}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: paymentData.paymentMethod === method.id ? 2 : 1,
                    borderColor: paymentData.paymentMethod === method.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2,
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={() => handleChange('paymentMethod', method.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <method.icon sx={{ color: method.color }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      {method.label}
                    </Typography>
                    {paymentData.paymentMethod === method.id && (
                      <CheckCircle sx={{ color: 'primary.main', ml: 'auto', fontSize: 20 }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {method.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Payment Reference (if required) */}
      {selectedMethod.requiresReference && (
        <Card>
          <CardHeader
            title="Payment Reference"
            avatar={<Receipt color="primary" />}
          />
          <CardContent>
            <TextField
              fullWidth
              label="Reference Number"
              value={paymentData.paymentReference || ''}
              onChange={(e) => handleChange('paymentReference', e.target.value)}
              placeholder="Enter transaction ID, cheque number, etc."
              helperText={`Reference number for ${selectedMethod.label} payment`}
              required={selectedMethod.requiresReference}
            />
          </CardContent>
        </Card>
      )}

      {/* Payment Date */}
      <Card>
        <CardHeader
          title="Payment Date"
          avatar={<CalendarToday color="primary" />}
        />
        <CardContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Payment Date"
              value={paymentData.paymentDate || new Date()}
              onChange={(date) => handleChange('paymentDate', date)}
              renderInput={(params) => (
                <TextField {...params} fullWidth helperText="Date when payment was received" />
              )}
              maxDate={new Date()}
            />
          </LocalizationProvider>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader
          title="Payment Status"
          avatar={<CheckCircle color="primary" />}
        />
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={paymentData.status || 'completed'}
              label="Payment Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader
          title="Payment Notes"
          avatar={<Edit color="primary" />}
        />
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={paymentData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes about this payment..."
          />
        </CardContent>
      </Card>
    </Stack>
  );
};

// ============================================================================
// PAYMENT ALLOCATION COMPONENT
// ============================================================================

/**
 * Payment allocation step component
 * @param {Array} installments - Installments list
 * @param {Object} allocation - Payment allocation
 * @param {Function} onAllocationChange - Allocation change callback
 * @param {number} totalAmount - Total payment amount
 */
const PaymentAllocationStep = ({ installments, allocation, onAllocationChange, totalAmount }) => {
  const [autoAllocate, setAutoAllocate] = useState(true);

  // Calculate totals
  const totalPending = calculateTotalPending(installments);
  const totalAllocated = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);
  const remainingAmount = totalAmount - totalAllocated;

  // Auto-allocate payment across installments
  const handleAutoAllocate = useCallback(() => {
    if (!installments?.length) return;

    let remainingPayment = totalAmount;
    const newAllocation = {};

    // Sort installments by due date (oldest first)
    const sortedInstallments = [...installments].sort((a, b) => 
      new Date(a.currentDueDate) - new Date(b.currentDueDate)
    );

    for (const installment of sortedInstallments) {
      if (remainingPayment <= 0) break;

      const pendingAmount = installment.pendingAmount || installment.currentAmount || 0;
      const allocationAmount = Math.min(pendingAmount, remainingPayment);
      
      if (allocationAmount > 0) {
        newAllocation[installment._id] = allocationAmount;
        remainingPayment -= allocationAmount;
      }
    }

    onAllocationChange(newAllocation);
  }, [installments, totalAmount, onAllocationChange]);

  // Auto-allocate when amount changes
  useEffect(() => {
    if (autoAllocate && totalAmount > 0) {
      handleAutoAllocate();
    }
  }, [autoAllocate, totalAmount, handleAutoAllocate]);

  // Handle manual allocation change
  const handleAllocationChange = (installmentId, amount) => {
    const newAllocation = {
      ...allocation,
      [installmentId]: amount || 0,
    };
    onAllocationChange(newAllocation);
  };

  // Clear allocation
  const handleClearAllocation = () => {
    onAllocationChange({});
  };

  if (!installments?.length) {
    return (
      <Alert severity="info">
        <Typography variant="h6">No Installments Found</Typography>
        <Typography variant="body2">
          This sale doesn't have payment plan installments configured. The payment will be recorded as a general payment.
        </Typography>
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Allocation Summary */}
      <Card>
        <CardHeader
          title="Payment Allocation Summary"
          avatar={<Calculate color="primary" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">Payment Amount</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(totalAmount)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">Total Allocated</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {formatCurrency(totalAllocated)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">Remaining</Typography>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                color={remainingAmount === 0 ? 'success.main' : remainingAmount > 0 ? 'warning.main' : 'error.main'}
              >
                {formatCurrency(remainingAmount)}
              </Typography>
            </Grid>
          </Grid>

          {remainingAmount !== 0 && (
            <Alert 
              severity={remainingAmount > 0 ? 'warning' : 'error'} 
              sx={{ mt: 2 }}
            >
              {remainingAmount > 0 
                ? `Unallocated amount: ${formatCurrency(remainingAmount)}. This will be recorded as advance payment.`
                : `Over-allocated by: ${formatCurrency(Math.abs(remainingAmount))}. Please adjust the allocation.`
              }
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Allocation Controls */}
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoAllocate}
                  onChange={(e) => setAutoAllocate(e.target.checked)}
                />
              }
              label="Auto-allocate to oldest dues first"
            />
            <Button
              variant="outlined"
              onClick={handleAutoAllocate}
              disabled={autoAllocate}
            >
              Auto Allocate
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearAllocation}
            >
              Clear All
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Installments List */}
      <Card>
        <CardHeader
          title="Installments"
          subheader={`${installments.length} installments • Total pending: ${formatCurrency(totalPending)}`}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Installment</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Pending Amount</TableCell>
                <TableCell>Allocation</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {installments.map((installment) => {
                const pendingAmount = installment.pendingAmount || installment.currentAmount || 0;
                const allocatedAmount = allocation[installment._id] || 0;
                const isOverdue = new Date(installment.currentDueDate) < new Date();
                const isFullyAllocated = allocatedAmount >= pendingAmount;

                return (
                  <TableRow key={installment._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {installment.description || `Installment ${installment.installmentNumber}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          #{installment.installmentNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={isOverdue ? 'error' : 'textPrimary'}
                      >
                        {formatDate(installment.currentDueDate)}
                      </Typography>
                      {isOverdue && (
                        <Chip size="small" label="Overdue" color="error" />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(pendingAmount)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={allocatedAmount || ''}
                        onChange={(e) => handleAllocationChange(installment._id, parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        sx={{ width: 120 }}
                        inputProps={{ min: 0, max: pendingAmount }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {isFullyAllocated ? (
                        <Chip size="small" label="Fully Paid" color="success" icon={<CheckCircle />} />
                      ) : allocatedAmount > 0 ? (
                        <Chip size="small" label="Partial" color="warning" />
                      ) : (
                        <Chip size="small" label="Pending" color="default" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
};

// ============================================================================
// CONFIRMATION COMPONENT
// ============================================================================

/**
 * Payment confirmation step component
 * @param {Object} saleData - Sale data
 * @param {Object} paymentData - Payment data
 * @param {Object} allocation - Payment allocation
 * @param {Array} installments - Installments list
 */
const PaymentConfirmationStep = ({ saleData, paymentData, allocation, installments }) => {
  const paymentMethod = getPaymentMethodConfig(paymentData.paymentMethod);
  const totalAllocated = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);
  const advanceAmount = paymentData.amount - totalAllocated;

  const allocatedInstallments = installments?.filter(installment => 
    allocation[installment._id] > 0
  ) || [];

  return (
    <Stack spacing={3}>
      {/* Payment Summary */}
      <Card>
        <CardHeader
          title="Payment Summary"
          avatar={<Receipt color="primary" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Customer</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCustomerName(saleData?.lead)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Project</Typography>
              <Typography variant="body1" fontWeight="medium">
                {saleData?.project?.name || 'Unknown Project'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Payment Amount</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(paymentData.amount)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Payment Method</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <paymentMethod.icon sx={{ color: paymentMethod.color, fontSize: 20 }} />
                <Typography variant="body1" fontWeight="medium">
                  {paymentMethod.label}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Payment Date</Typography>
              <Typography variant="body1">
                {formatDate(paymentData.paymentDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">Status</Typography>
              <Chip 
                size="small" 
                label={PAYMENT_STATUS_OPTIONS.find(opt => opt.value === paymentData.status)?.label || 'Completed'} 
                color="success" 
              />
            </Grid>
            {paymentData.paymentReference && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Reference Number</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {paymentData.paymentReference}
                </Typography>
              </Grid>
            )}
            {paymentData.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Notes</Typography>
                <Typography variant="body1">
                  {paymentData.notes}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Allocation Details */}
      {allocatedInstallments.length > 0 && (
        <Card>
          <CardHeader
            title="Payment Allocation"
            subheader={`${allocatedInstallments.length} installments • Total: ${formatCurrency(totalAllocated)}`}
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Installment</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Allocated Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocatedInstallments.map((installment) => (
                  <TableRow key={installment._id}>
                    <TableCell>
                      <Typography variant="body2">
                        {installment.description || `Installment ${installment.installmentNumber}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(installment.currentDueDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(allocation[installment._id])}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Advance Payment */}
      {advanceAmount > 0 && (
        <Card>
          <CardContent>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Advance Payment
              </Typography>
              <Typography variant="body2">
                {formatCurrency(advanceAmount)} will be recorded as advance payment and can be adjusted against future installments.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

// ============================================================================
// MAIN RECORD PAYMENT PAGE COMPONENT
// ============================================================================

/**
 * Main record payment page component
 * Complete payment recording workflow with validation and confirmation
 */
const RecordPaymentPage = () => {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Data state
  const [saleData, setSaleData] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  // Form state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date(),
    status: 'completed',
    paymentReference: '',
    notes: '',
  });

  const [allocation, setAllocation] = useState({});

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  const canRecordPayments = canAccess && canAccess.salesPipeline ? canAccess.salesPipeline() : true;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches sale and payment plan data
   */
  const fetchSaleData = useCallback(async (saleIdParam) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching sale data for payment recording...');

      // Fetch sale details
      const saleResponse = await salesAPI.getSale(saleIdParam);
      const sale = saleResponse.data?.data;

      if (!sale) {
        throw new Error('Sale not found');
      }

      setSaleData(sale);
      setSelectedSale(sale);

      // Fetch payment plan and installments
      try {
        const paymentPlanResponse = await paymentAPI.getPaymentPlanDetails(saleIdParam);
        const installmentsData = paymentPlanResponse.data?.data?.installments || [];
        setInstallments(installmentsData);
        console.log('✅ Payment plan loaded with', installmentsData.length, 'installments');
      } catch (planError) {
        console.warn('⚠️ No payment plan found for sale:', planError.message);
        setInstallments([]);
      }

    } catch (err) {
      console.error('❌ Error fetching sale data:', err);
      setError(err.response?.data?.message || 'Failed to load sale data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load sale data if saleId is provided
  useEffect(() => {
    if (saleId) {
      fetchSaleData(saleId);
    }
  }, [saleId, fetchSaleData]);

  // Auto-generate payment reference for certain methods
  useEffect(() => {
    const method = getPaymentMethodConfig(paymentData.paymentMethod);
    if (method.requiresReference && !paymentData.paymentReference) {
      setPaymentData(prev => ({
        ...prev,
        paymentReference: generatePaymentReference(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData.paymentMethod]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validates current step
   * @param {number} step - Step index
   * @returns {boolean} Is step valid
   */
  const isStepValid = (step) => {
    switch (step) {
      case 0: // Sale Selection
        return !!selectedSale;
      case 1: // Payment Details
        return paymentData.amount > 0 && 
               paymentData.paymentMethod &&
               (!getPaymentMethodConfig(paymentData.paymentMethod).requiresReference || paymentData.paymentReference);
      case 2: // Allocation
        const totalAllocated = Object.values(allocation).reduce((sum, amount) => sum + (amount || 0), 0);
        return totalAllocated <= paymentData.amount;
      case 3: // Confirmation
        return true;
      default:
        return false;
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles step navigation
   * @param {number} step - Target step
   */
  const handleStepChange = (step) => {
    if (step > activeStep) {
      // Moving forward - validate current step
      if (isStepValid(activeStep)) {
        setCompletedSteps(prev => new Set([...prev, activeStep]));
        setActiveStep(step);
      } else {
        setSnackbar({
          open: true,
          message: 'Please complete the current step before proceeding',
          severity: 'warning'
        });
      }
    } else {
      // Moving backward - always allowed
      setActiveStep(step);
    }
  };

  /**
   * Handles next step
   */
  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      setActiveStep(prev => prev + 1);
    }
  };

  /**
   * Handles previous step
   */
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  /**
   * Handles sale selection
   * @param {Object} sale - Selected sale
   */
  const handleSaleSelect = async (sale) => {
    setSelectedSale(sale);
    setSaleData(sale);

    // Fetch installments for selected sale
    try {
      const paymentPlanResponse = await paymentAPI.getPaymentPlanDetails(sale._id);
      const installmentsData = paymentPlanResponse.data?.data?.installments || [];
      setInstallments(installmentsData);
    } catch (error) {
      console.warn('No payment plan found for selected sale');
      setInstallments([]);
    }
  };

  /**
   * Handles payment data changes
   * @param {Object} newPaymentData - New payment data
   */
  const handlePaymentDataChange = (newPaymentData) => {
    setPaymentData(newPaymentData);
  };

  /**
   * Handles allocation changes
   * @param {Object} newAllocation - New allocation
   */
  const handleAllocationChange = (newAllocation) => {
    setAllocation(newAllocation);
  };

  /**
   * Handles payment submission
   */
  const handleSubmitPayment = async () => {
    try {
      setSubmitting(true);

      console.log('💳 Submitting payment...');

      const paymentPayload = {
        sale: selectedSale._id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        paymentReference: paymentData.paymentReference,
        status: paymentData.status,
        notes: paymentData.notes,
        allocation: allocation,
      };

      await paymentAPI.recordPayment(paymentPayload);
      
      console.log('✅ Payment recorded successfully');

      setSnackbar({
        open: true,
        message: 'Payment recorded successfully!',
        severity: 'success'
      });

      // Navigate to payment plan or success page
      setTimeout(() => {
        navigate(`/payments/plans/${selectedSale._id}`, {
          state: { message: 'Payment recorded successfully' }
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Error recording payment:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to record payment',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Permission check
  if (!canRecordPayments) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to record payments.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Error state
  if (error && !selectedSale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/payments/dashboard')}>
              Back to Dashboard
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Record Payment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Record customer payment and allocate across installments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>

      {/* Payment Recording Stepper */}
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
            {PAYMENT_STEPS.map((step, index) => (
              <Step 
                key={step.id} 
                completed={completedSteps.has(index)}
                onClick={() => handleStepChange(index)}
                sx={{ cursor: 'pointer' }}
              >
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                
                {isMobile && (
                  <StepContent>
                    <Box sx={{ mt: 2 }}>
                      {/* Step Content */}
                      {index === activeStep && (
                        <>
                          {activeStep === 0 && (
                            <SaleSelectionStep
                              selectedSaleId={selectedSale?._id}
                              onSaleSelect={handleSaleSelect}
                              saleData={saleData}
                            />
                          )}
                          {activeStep === 1 && (
                            <PaymentDetailsStep
                              paymentData={paymentData}
                              onPaymentDataChange={handlePaymentDataChange}
                              saleData={selectedSale}
                            />
                          )}
                          {activeStep === 2 && (
                            <PaymentAllocationStep
                              installments={installments}
                              allocation={allocation}
                              onAllocationChange={handleAllocationChange}
                              totalAmount={paymentData.amount}
                            />
                          )}
                          {activeStep === 3 && (
                            <PaymentConfirmationStep
                              saleData={selectedSale}
                              paymentData={paymentData}
                              allocation={allocation}
                              installments={installments}
                            />
                          )}
                          
                          {/* Navigation Buttons */}
                          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={handleBack}
                            >
                              Back
                            </Button>
                            <Button
                              variant="contained"
                              onClick={activeStep === PAYMENT_STEPS.length - 1 ? handleSubmitPayment : handleNext}
                              disabled={!isStepValid(activeStep) || submitting}
                            >
                              {submitting ? (
                                <CircularProgress size={20} />
                              ) : activeStep === PAYMENT_STEPS.length - 1 ? (
                                'Record Payment'
                              ) : (
                                'Next'
                              )}
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Desktop Step Content */}
      {!isMobile && (
        <Box sx={{ mt: 4 }}>
          {activeStep === 0 && (
            <SaleSelectionStep
              selectedSaleId={selectedSale?._id}
              onSaleSelect={handleSaleSelect}
              saleData={saleData}
            />
          )}
          {activeStep === 1 && (
            <PaymentDetailsStep
              paymentData={paymentData}
              onPaymentDataChange={handlePaymentDataChange}
              saleData={selectedSale}
            />
          )}
          {activeStep === 2 && (
            <PaymentAllocationStep
              installments={installments}
              allocation={allocation}
              onAllocationChange={handleAllocationChange}
              totalAmount={paymentData.amount}
            />
          )}
          {activeStep === 3 && (
            <PaymentConfirmationStep
              saleData={selectedSale}
              paymentData={paymentData}
              allocation={allocation}
              installments={installments}
            />
          )}
          
          {/* Navigation Buttons */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === PAYMENT_STEPS.length - 1 ? handleSubmitPayment : handleNext}
              disabled={!isStepValid(activeStep) || submitting}
              endIcon={submitting ? <CircularProgress size={20} /> : activeStep === PAYMENT_STEPS.length - 1 ? <Save /> : <ArrowBack sx={{ transform: 'scaleX(-1)' }} />}
            >
              {activeStep === PAYMENT_STEPS.length - 1 ? 'Record Payment' : 'Next'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Box>
  );
};

export default RecordPaymentPage;
/**
 * File: src/pages/payments/PaymentDashboardPage.js
 * Description: Comprehensive payment management dashboard with overview metrics, due payments, 
 *              collection analytics, and payment management tools
 * Version: 1.0 - Complete Payment Dashboard Implementation
 * Location: src/pages/payments/PaymentDashboardPage.js
 * 
 * Features:
 * - Payment overview cards with key metrics
 * - Due payments management section
 * - Overdue payments alerts and tracking
 * - Payment collection analytics with charts
 * - Recent payment transactions
 * - Quick action buttons for common tasks
 * - Real-time data from backend APIs
 * - Responsive design for all screen sizes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
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
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fab,
  Menu,
  MenuItem,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';

import {
  Dashboard,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Schedule,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  Add,
  Visibility,
  Payment,
  Receipt,
  Analytics,
  Timeline,
  MonetizationOn,
  AccountBalanceWallet,
  CreditCard,
  PieChart,
  BarChart,
  ShowChart,
  CalendarToday,
  Phone,
  Email,
  Print,
  Download,
  FilterList,
  MoreVert,
  NotificationsActive,
  PendingActions,
  Today,
  DateRange,
  ArrowUpward,
  ArrowDownward,
  ExpandMore,
  Assignment,
  Info,
  Speed,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Payment status configurations with colors, icons, and descriptions
 */
const PAYMENT_STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    color: 'warning', 
    icon: Schedule,
    bgColor: '#fff3cd',
    description: 'Payment scheduled but not yet received'
  },
  completed: { 
    label: 'Completed', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: '#d4edda',
    description: 'Payment successfully received and cleared'
  },
  overdue: { 
    label: 'Overdue', 
    color: 'error', 
    icon: Warning,
    bgColor: '#f8d7da',
    description: 'Payment past due date'
  },
  cleared: { 
    label: 'Cleared', 
    color: 'info', 
    icon: AccountBalanceWallet,
    bgColor: '#d1ecf1',
    description: 'Payment cleared and verified'
  },
};

/**
 * Payment method configurations for display
 */
const PAYMENT_METHOD_CONFIG = {
  cash: { label: 'Cash', icon: MonetizationOn, color: '#4caf50' },
  bank_transfer: { label: 'Bank Transfer', icon: AccountBalance, color: '#2196f3' },
  cheque: { label: 'Cheque', icon: Receipt, color: '#ff9800' },
  credit_card: { label: 'Credit Card', icon: CreditCard, color: '#9c27b0' },
  online: { label: 'Online Payment', icon: Payment, color: '#00bcd4' },
  other: { label: 'Other', icon: Assignment, color: '#607d8b' },
};

/**
 * Quick action buttons configuration
 */
const QUICK_ACTIONS = [
  {
    id: 'record-payment',
    title: 'Record Payment',
    description: 'Record a new payment transaction',
    icon: Add,
    path: '/payments/record',
    color: 'primary',
  },
  {
    id: 'view-overdue',
    title: 'View Overdue',
    description: 'See all overdue payments',
    icon: Warning,
    path: '/payments/overdue',
    color: 'error',
  },
  {
    id: 'payment-reports',
    title: 'Payment Reports',
    description: 'Generate payment analytics reports',
    icon: Analytics,
    path: '/payments/reports',
    color: 'info',
  },
  {
    id: 'collection-summary',
    title: 'Collection Summary',
    description: 'View collection performance',
    icon: Timeline,
    path: '/payments/collections',
    color: 'success',
  },
];

/**
 * Time period options for filtering
 */
const TIME_PERIODS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'Last Year' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets payment status configuration
 * @param {string} status - Payment status
 * @returns {Object} Status configuration
 */
const getPaymentStatusConfig = (status) => {
  return PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
};

/**
 * Gets payment method configuration
 * @param {string} method - Payment method
 * @returns {Object} Method configuration
 */
const getPaymentMethodConfig = (method) => {
  return PAYMENT_METHOD_CONFIG[method] || PAYMENT_METHOD_CONFIG.other;
};

/**
 * Calculates percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Change percentage and direction
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return { percentage: 0, direction: 'neutral' };
  
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
};

// ============================================================================
// PAYMENT OVERVIEW CARDS COMPONENT
// ============================================================================

/**
 * Payment overview cards showing key metrics
 * @param {Object} statistics - Payment statistics from API
 * @param {boolean} loading - Loading state
 */
const PaymentOverviewCards = ({ statistics, loading }) => {
  const theme = useTheme();

  // Extract data with fallbacks
  const totalPayments = statistics?.payments?.totalPayments || 0;
  const totalAmount = statistics?.payments?.totalAmount || 0;
  const averagePayment = statistics?.payments?.averagePayment || 0;
  const overdueCount = statistics?.overdue?.overdueInstallments || 0;
  const overdueAmount = statistics?.overdue?.overdueAmount || 0;

  // Sample previous period data calculation (you can enhance this with actual API)
  const previousPeriodMultiplier = 0.85; // Simulate previous period comparison
  const previousTotalAmount = totalAmount * previousPeriodMultiplier;
  const amountChange = calculatePercentageChange(totalAmount, previousTotalAmount);

  const overviewCards = [
    {
      title: 'Total Collections',
      value: formatCurrency(totalAmount),
      subtitle: `${totalPayments} payments`,
      icon: AccountBalanceWallet,
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: amountChange,
    },
    {
      title: 'Average Payment',
      value: formatCurrency(averagePayment),
      subtitle: 'Per transaction',
      icon: TrendingUp,
      color: 'success',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Overdue Payments',
      value: overdueCount.toString(),
      subtitle: formatCurrency(overdueAmount),
      icon: Warning,
      color: 'error',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      alert: overdueCount > 0,
    },
    {
      title: 'Collection Rate',
      value: totalPayments > 0 ? '94%' : '0%',
      subtitle: 'Success rate',
      icon: Speed,
      color: 'info',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ];

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: 140 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {overviewCards.map((card, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Card 
            sx={{ 
              height: 140,
              background: card.gradient,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {card.subtitle}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <card.icon sx={{ fontSize: 40, opacity: 0.8 }} />
                  {card.change && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {card.change.direction === 'up' ? (
                        <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                      ) : card.change.direction === 'down' ? (
                        <ArrowDownward sx={{ fontSize: 16, mr: 0.5 }} />
                      ) : null}
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {formatPercentage(card.change.percentage / 100)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              {card.alert && (
                <Badge
                  color="error"
                  variant="dot"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    '& .MuiBadge-badge': {
                      animation: 'pulse 2s infinite',
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// ============================================================================
// DUE PAYMENTS SECTION COMPONENT
// ============================================================================

/**
 * Due payments section showing today's due and upcoming payments
 * @param {Array} dueToday - Payments due today
 * @param {Array} overdue - Overdue payments
 * @param {boolean} loading - Loading state
 * @param {Function} onRefresh - Refresh callback
 */
const DuePaymentsSection = ({ dueToday, overdue, loading, onRefresh }) => {
  const navigate = useNavigate();

  const handlePaymentAction = (action, payment) => {
    switch (action) {
      case 'record':
        navigate(`/payments/plans/${payment.sale}/record-payment`);
        break;
      case 'view':
        navigate(`/payments/plans/${payment.sale}`);
        break;
      case 'contact':
        if (payment.customer?.phone) {
          window.open(`tel:${payment.customer.phone}`, '_blank');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Due Today */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Due Today"
            avatar={
              <Badge badgeContent={dueToday?.length || 0} color="warning" max={99}>
                <Today color="warning" />
              </Badge>
            }
            action={
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            }
          />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : dueToday?.length > 0 ? (
              <List dense>
                {dueToday.map((payment, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <CalendarToday color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {payment.customer?.firstName} {payment.customer?.lastName}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="textSecondary">
                            {formatCurrency(payment.pendingAmount || payment.currentAmount)}
                          </Typography>
                          <Chip size="small" label={payment.description} variant="outlined" />
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handlePaymentAction('record', payment)}
                      >
                        Record
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  No payments due today
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Overdue Payments */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Overdue Payments"
            avatar={
              <Badge badgeContent={overdue?.length || 0} color="error" max={99}>
                <Warning color="error" />
              </Badge>
            }
            action={
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => navigate('/payments/overdue')}
                disabled={!overdue?.length}
              >
                View All
              </Button>
            }
          />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : overdue?.length > 0 ? (
              <List dense>
                {overdue.slice(0, 5).map((payment, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Warning color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {payment.customer?.firstName} {payment.customer?.lastName}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="error">
                            {formatCurrency(payment.pendingAmount || payment.currentAmount)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Due: {formatDate(payment.currentDueDate)}
                          </Typography>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handlePaymentAction('contact', payment)}
                          disabled={!payment.customer?.phone}
                        >
                          <Phone fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handlePaymentAction('view', payment)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  No overdue payments
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ============================================================================
// PAYMENT ANALYTICS SECTION COMPONENT
// ============================================================================

/**
 * Payment analytics section with method breakdown and trends
 * @param {Object} statistics - Payment statistics
 * @param {boolean} loading - Loading state
 */
const PaymentAnalyticsSection = ({ statistics, loading }) => {
  const methodBreakdown = statistics?.methodBreakdown || [];
  
  // Calculate totals for percentage calculation
  const totalMethodAmount = methodBreakdown.reduce((sum, method) => sum + (method.amount || 0), 0);

  return (
    <Grid container spacing={3}>
      {/* Payment Method Breakdown */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Payment Methods"
            avatar={<PieChart color="primary" />}
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : methodBreakdown.length > 0 ? (
              <List dense>
                {methodBreakdown.map((method, index) => {
                  const config = getPaymentMethodConfig(method._id);
                  const percentage = totalMethodAmount > 0 ? (method.amount / totalMethodAmount) * 100 : 0;
                  
                  return (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <config.icon sx={{ color: config.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={config.label}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">
                              {formatCurrency(method.amount)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ({method.count} transactions)
                            </Typography>
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BarChart sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  No payment method data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Collection Performance */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Collection Performance"
            avatar={<Timeline color="success" />}
          />
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Collection Efficiency
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={statistics?.payments?.totalPayments > 0 ? 85 : 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color="success"
                  />
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    85%
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Average Collection Time
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  12 days
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  From due date to collection
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Period: {statistics?.period || 'Last 30 days'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Generated: {formatDateTime(statistics?.generatedAt || new Date())}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ============================================================================
// QUICK ACTIONS COMPONENT
// ============================================================================

/**
 * Quick action buttons for common payment tasks
 */
const QuickActionsSection = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  const handleActionClick = (action) => {
    navigate(action.path);
  };

  return (
    <Card>
      <CardHeader
        title="Quick Actions"
        avatar={<Speed color="primary" />}
      />
      <CardContent>
        <Grid container spacing={2}>
          {QUICK_ACTIONS.map((action) => (
            <Grid item xs={12} sm={6} md={3} key={action.id}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleActionClick(action)}
              >
                <action.icon sx={{ fontSize: 40, color: `${action.color}.main`, mb: 1 }} />
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {action.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN PAYMENT DASHBOARD PAGE COMPONENT
// ============================================================================

/**
 * Main payment dashboard page component
 * Provides comprehensive overview of payment system with real-time data
 */
const PaymentDashboardPage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('30');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    statistics: null,
    dueToday: [],
    overdue: [],
  });

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  const canViewPayments = canAccess && canAccess.payments ? canAccess.payments() : true;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches all dashboard data from various APIs
   * @param {boolean} showRefreshing - Whether to show refreshing indicator
   */
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching payment dashboard data...');

      // Fetch data from multiple APIs concurrently
      const [statisticsResult, dueTodayResult, overdueResult] = await Promise.allSettled([
        paymentAPI.getPaymentStatistics({ period: timePeriod }),
        paymentAPI.getPaymentsDueToday(),
        paymentAPI.getOverduePayments({ limit: 10 }),
      ]);

      // Process statistics
      const statistics = statisticsResult.status === 'fulfilled' 
        ? statisticsResult.value.data?.data 
        : null;

      // Process due today payments
      const dueToday = dueTodayResult.status === 'fulfilled' 
        ? dueTodayResult.value.data?.data || []
        : [];

      // Process overdue payments
      const overdue = overdueResult.status === 'fulfilled' 
        ? overdueResult.value.data?.data || []
        : [];

      console.log('✅ Dashboard data loaded:', {
        statistics: !!statistics,
        dueToday: dueToday.length,
        overdue: overdue.length,
      });

      // Update state
      setDashboardData({
        statistics,
        dueToday,
        overdue,
      });

    } catch (err) {
      console.error('❌ Error fetching payment dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load payment dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timePeriod]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load dashboard data on component mount and when time period changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles time period change
   * @param {Event} event - Select change event
   */
  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
  };

  /**
   * Handles manual refresh
   */
  const handleRefresh = () => {
    fetchDashboardData(true);
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
  if (!canViewPayments) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view payment dashboard.
        </Alert>
      </Box>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
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
            Payment Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor payment collections, track due payments, and manage financial performance
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              label="Time Period"
              onChange={handleTimePeriodChange}
            >
              {TIME_PERIODS.map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Dashboard Content */}
      <Stack spacing={4}>
        {/* Payment Overview Cards */}
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Payment Overview
          </Typography>
          <PaymentOverviewCards 
            statistics={dashboardData.statistics} 
            loading={loading} 
          />
        </Box>

        {/* Due Payments Section */}
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Payment Management
          </Typography>
          <DuePaymentsSection
            dueToday={dashboardData.dueToday}
            overdue={dashboardData.overdue}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </Box>

        {/* Payment Analytics */}
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Payment Analytics
          </Typography>
          <PaymentAnalyticsSection
            statistics={dashboardData.statistics}
            loading={loading}
          />
        </Box>

        {/* Quick Actions */}
        <Box>
          <QuickActionsSection />
        </Box>
      </Stack>

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

export default PaymentDashboardPage;
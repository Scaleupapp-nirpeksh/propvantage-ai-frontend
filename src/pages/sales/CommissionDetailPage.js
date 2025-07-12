// File: src/pages/sales/CommissionDetailPage.js
// Description: Detailed commission view page with comprehensive information, actions, and status management
// Version: 1.0 - Complete commission detail page with backend integration
// Location: src/pages/sales/CommissionDetailPage.js

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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  ListItemButton,
} from '@mui/material';

// Timeline components from @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';

import {
  ArrowBack,
  Edit,
  CheckCircle,
  Cancel,
  Schedule,
  Payment,
  AttachMoney,
  Person,
  Business,
  Assignment,
  CalendarToday,
  AccountBalanceWallet,
  TrendingUp,
  Warning,
  Error as ErrorIcon,
  Info,
  Timeline as TimelineIcon,
  Receipt,
  Download,
  Print,
  Share,
  MoreVert,
  Visibility,
  History,
  Calculate,
  AccountBalance,
  Phone,
  Email,
  LocationOn,
  Home,
  ChevronRight,
  ExpandMore,
  MonetizationOn,
  PendingActions,
  Handshake,
  EventNote,
  Description,
  Analytics,
  Settings, // Added missing Settings icon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Commission status configurations
const COMMISSION_STATUS_CONFIG = {
  pending: { 
    label: 'Pending Approval', 
    color: 'warning', 
    icon: Schedule,
    bgColor: '#fff3cd',
    description: 'Awaiting management approval'
  },
  approved: { 
    label: 'Approved', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: '#d4edda',
    description: 'Commission approved for payment'
  },
  paid: { 
    label: 'Paid', 
    color: 'info', 
    icon: AccountBalanceWallet,
    bgColor: '#d1ecf1',
    description: 'Commission payment completed'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'error', 
    icon: ErrorIcon,
    bgColor: '#f8d7da',
    description: 'Commission rejected'
  },
  on_hold: { 
    label: 'On Hold', 
    color: 'default', 
    icon: PendingActions,
    bgColor: '#e2e3e5',
    description: 'Commission temporarily on hold'
  },
};

// Tab panel configuration
const TAB_PANELS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'calculation', label: 'Calculation', icon: Calculate },
  { id: 'payments', label: 'Payments', icon: Payment },
  { id: 'history', label: 'History', icon: History },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets commission status configuration
 */
const getCommissionStatusConfig = (status) => {
  return COMMISSION_STATUS_CONFIG[status] || COMMISSION_STATUS_CONFIG.pending;
};

/**
 * Formats commission timeline events
 */
const formatTimelineEvent = (event) => {
  const eventTypes = {
    created: { icon: Assignment, color: 'primary', label: 'Commission Created' },
    approved: { icon: CheckCircle, color: 'success', label: 'Commission Approved' },
    rejected: { icon: ErrorIcon, color: 'error', label: 'Commission Rejected' },
    paid: { icon: AccountBalanceWallet, color: 'info', label: 'Payment Recorded' },
    on_hold: { icon: PendingActions, color: 'warning', label: 'Put on Hold' },
    recalculated: { icon: Calculate, color: 'secondary', label: 'Recalculated' },
  };
  
  return eventTypes[event.type] || eventTypes.created;
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Commission Status Badge Component
 */
const CommissionStatusBadge = ({ status, size = 'large' }) => {
  const config = getCommissionStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Paper 
      sx={{ 
        p: 2, 
        bgcolor: config.bgColor, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        border: '1px solid',
        borderColor: `${config.color}.200`
      }}
    >
      <Avatar sx={{ bgcolor: `${config.color}.main` }}>
        <StatusIcon />
      </Avatar>
      <Box>
        <Typography variant="h6" fontWeight="bold">
          {config.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {config.description}
        </Typography>
      </Box>
    </Paper>
  );
};

/**
 * Commission Overview Tab Component
 */
const CommissionOverviewTab = ({ commission }) => {
  if (!commission) return null;

  return (
    <Grid container spacing={3}>
      {/* Partner Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Partner Information"
            avatar={<Person />}
          />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon><Person /></ListItemIcon>
                <ListItemText 
                  primary="Name"
                  secondary={`${commission.partner?.firstName || ''} ${commission.partner?.lastName || ''}`.trim() || 'Unknown'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Email /></ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary={commission.partner?.email || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Phone /></ListItemIcon>
                <ListItemText 
                  primary="Phone"
                  secondary={commission.partner?.phone || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Handshake /></ListItemIcon>
                <ListItemText 
                  primary="Partner Type"
                  secondary={commission.partner?.partnerType || 'Channel Partner'}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Sale Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Sale Information"
            avatar={<Business />}
          />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon><Business /></ListItemIcon>
                <ListItemText 
                  primary="Project"
                  secondary={commission.project?.name || 'Unknown Project'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Home /></ListItemIcon>
                <ListItemText 
                  primary="Unit"
                  secondary={commission.unit?.unitNumber || 'Unknown Unit'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><AttachMoney /></ListItemIcon>
                <ListItemText 
                  primary="Sale Amount"
                  secondary={formatCurrency(commission.saleDetails?.salePrice || 0)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CalendarToday /></ListItemIcon>
                <ListItemText 
                  primary="Sale Date"
                  secondary={commission.saleDetails?.saleDate ? formatDate(commission.saleDetails.saleDate) : 'Not specified'}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Commission Summary */}
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Commission Summary"
            avatar={<MonetizationOn />}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {formatCurrency(commission.commissionCalculation?.grossCommission || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gross Commission
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {formatCurrency(commission.commissionCalculation?.totalDeductions || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Deductions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {formatCurrency(commission.commissionCalculation?.netCommission || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Commission
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {formatPercentage(commission.commissionCalculation?.commissionRate || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Commission Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Commission Calculation Tab Component
 */
const CommissionCalculationTab = ({ commission }) => {
  if (!commission?.commissionCalculation) {
    return (
      <Alert severity="info">
        Commission calculation details are not available.
      </Alert>
    );
  }

  const calculation = commission.commissionCalculation;

  return (
    <Grid container spacing={3}>
      {/* Calculation Breakdown */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader 
            title="Calculation Breakdown"
            avatar={<Calculate />}
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Base Sale Amount
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(commission.saleDetails?.salePrice || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Original sale amount
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Commission Rate
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatPercentage(calculation.commissionRate || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Applied commission rate
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        Gross Commission
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        {formatCurrency(calculation.grossCommission || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Before deductions
                      </Typography>
                    </TableCell>
                  </TableRow>
                  
                  {/* Deductions */}
                  {calculation.deductions && Object.entries(calculation.deductions).map(([key, value]) => {
                    if (value > 0) {
                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" color="error.main">
                              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="error.main">
                              -{formatCurrency(value)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              Deduction applied
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}

                  <TableRow sx={{ borderTop: '2px solid', borderColor: 'divider' }}>
                    <TableCell>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        Net Commission
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatCurrency(calculation.netCommission || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        Final payable amount
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Commission Structure */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader 
            title="Commission Structure"
            avatar={<Settings />}
          />
          <CardContent>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Structure Name"
                  secondary={commission.commissionStructure?.structureName || 'Default Structure'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Calculation Method"
                  secondary={commission.commissionStructure?.calculationMethod || 'Percentage'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Unit Type"
                  secondary={commission.saleDetails?.unitType || 'Standard'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Partner Performance"
                  secondary={commission.partnerPerformance?.tier || 'Standard'}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Commission Payments Tab Component
 */
const CommissionPaymentsTab = ({ commission }) => {
  const payments = commission.paymentHistory || [];

  return (
    <Grid container spacing={3}>
      {/* Payment Summary */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader 
            title="Payment Summary"
            avatar={<AccountBalanceWallet />}
          />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Commission
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(commission.commissionCalculation?.netCommission || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Paid Amount
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {formatCurrency(commission.paymentStatus?.totalPaid || 0)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Outstanding
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {formatCurrency((commission.commissionCalculation?.netCommission || 0) - (commission.paymentStatus?.totalPaid || 0))}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment History */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader 
            title="Payment History"
            avatar={<History />}
          />
          <CardContent>
            {payments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No payments recorded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment history will appear here once payments are processed
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {payment.paymentMethod || 'Not specified'}
                        </TableCell>
                        <TableCell>
                          {payment.paymentReference || 'Not provided'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.status || 'Completed'} 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Commission History Tab Component
 */
const CommissionHistoryTab = ({ commission }) => {
  const history = commission.auditTrail || [];

  return (
    <Card>
      <CardHeader 
        title="Commission Timeline"
        avatar={<TimelineIcon />}
      />
      <CardContent>
        {history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No history available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Commission activity timeline will appear here
            </Typography>
          </Box>
        ) : (
          <Timeline>
            {history.map((event, index) => {
              const eventConfig = formatTimelineEvent(event);
              const EventIcon = eventConfig.icon;
              
              return (
                <TimelineItem key={index}>
                  <TimelineSeparator>
                    <TimelineDot color={eventConfig.color}>
                      <EventIcon />
                    </TimelineDot>
                    {index < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {eventConfig.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(event.timestamp)}
                    </Typography>
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                    {event.performedBy && (
                      <Typography variant="caption" color="text.secondary">
                        by {event.performedBy.firstName} {event.performedBy.lastName}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Commission Actions Component
 */
const CommissionActions = ({ 
  commission, 
  canEdit, 
  canApprove, 
  canPayment, 
  onAction 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleAction = (action) => {
    onAction(action);
    handleMenuClose();
  };

  const primaryActions = [];
  const secondaryActions = [];

  // Determine available actions based on status and permissions
  if (commission.status === 'pending' && canApprove) {
    primaryActions.push(
      { id: 'approve', label: 'Approve', icon: CheckCircle, color: 'success', variant: 'contained' },
      { id: 'reject', label: 'Reject', icon: Cancel, color: 'error', variant: 'outlined' }
    );
  }

  if (commission.status === 'approved' && canPayment) {
    primaryActions.push(
      { id: 'payment', label: 'Record Payment', icon: Payment, color: 'primary', variant: 'contained' }
    );
  }

  if (canEdit) {
    secondaryActions.push(
      { id: 'edit', label: 'Edit Commission', icon: Edit },
      { id: 'recalculate', label: 'Recalculate', icon: Calculate }
    );
  }

  if (canApprove && commission.status !== 'on_hold') {
    secondaryActions.push(
      { id: 'hold', label: 'Put on Hold', icon: Schedule }
    );
  }

  secondaryActions.push(
    { id: 'download', label: 'Download Report', icon: Download },
    { id: 'print', label: 'Print Details', icon: Print }
  );

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {/* Primary Actions */}
      {primaryActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          color={action.color}
          startIcon={<action.icon />}
          onClick={() => handleAction(action.id)}
        >
          {action.label}
        </Button>
      ))}

      {/* Secondary Actions Menu */}
      {secondaryActions.length > 0 && (
        <>
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { minWidth: 180 } }}
          >
            {secondaryActions.map((action) => (
              <MenuItem key={action.id} onClick={() => handleAction(action.id)}>
                <ListItemIcon>
                  <action.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{action.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission Detail Page Component
 * Comprehensive commission detail view with tabs, actions, and full information
 */
const CommissionDetailPage = () => {
  const { commissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const canEdit = canAccess.salesPipeline();
  const canApprove = canAccess.projectManagement();
  const canPayment = canAccess.viewFinancials();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches commission details from backend
   */
  const fetchCommissionDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await commissionAPI.getCommission(commissionId);
      const commissionData = response.data?.data;

      if (!commissionData) {
        throw new Error('Commission not found');
      }

      setCommission(commissionData);
    } catch (err) {
      console.error('Error fetching commission details:', err);
      setError(err.response?.data?.message || 'Failed to load commission details');
    } finally {
      setLoading(false);
    }
  }, [commissionId]);

  // Load commission details on component mount
  useEffect(() => {
    if (commissionId) {
      fetchCommissionDetails();
    }
  }, [commissionId, fetchCommissionDetails]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles commission actions
   */
  const handleCommissionAction = useCallback(async (action) => {
    switch (action) {
      case 'approve':
        setConfirmDialog({
          open: true,
          title: 'Approve Commission',
          message: `Are you sure you want to approve this commission of ${formatCurrency(commission?.commissionCalculation?.netCommission || 0)}?`,
          action: 'approve',
        });
        break;
      case 'reject':
        setConfirmDialog({
          open: true,
          title: 'Reject Commission',
          message: 'Are you sure you want to reject this commission? Please provide a reason.',
          action: 'reject',
        });
        break;
      case 'payment':
        navigate(`/sales/commissions/payments/${commissionId}`);
        break;
      case 'edit':
        navigate(`/sales/commissions/list/${commissionId}/edit`);
        break;
      case 'hold':
        setConfirmDialog({
          open: true,
          title: 'Put Commission on Hold',
          message: 'Are you sure you want to put this commission on hold?',
          action: 'hold',
        });
        break;
      case 'recalculate':
        await handleRecalculateCommission();
        break;
      case 'download':
        handleDownloadReport();
        break;
      case 'print':
        window.print();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [commission, navigate, commissionId]);

  /**
   * Handles dialog confirmation
   */
  const handleConfirmAction = useCallback(async () => {
    const { action } = confirmDialog;

    try {
      switch (action) {
        case 'approve':
          await commissionAPI.approveCommission(commissionId);
          setSnackbar({ open: true, message: 'Commission approved successfully', severity: 'success' });
          break;
        case 'reject':
          await commissionAPI.rejectCommission(commissionId, { reason: 'Rejected from detail view' });
          setSnackbar({ open: true, message: 'Commission rejected successfully', severity: 'success' });
          break;
        case 'hold':
          await commissionAPI.putCommissionOnHold(commissionId);
          setSnackbar({ open: true, message: 'Commission put on hold successfully', severity: 'success' });
          break;
        default:
          break;
      }

      // Refresh commission data
      fetchCommissionDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Action failed',
        severity: 'error',
      });
    }

    setConfirmDialog({ open: false, title: '', message: '', action: null });
  }, [confirmDialog, commissionId, fetchCommissionDetails]);

  /**
   * Handles commission recalculation
   */
  const handleRecalculateCommission = useCallback(async () => {
    try {
      await commissionAPI.recalculateCommission(commissionId);
      setSnackbar({ open: true, message: 'Commission recalculated successfully', severity: 'success' });
      fetchCommissionDetails();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Recalculation failed',
        severity: 'error',
      });
    }
  }, [commissionId, fetchCommissionDetails]);

  /**
   * Handles report download
   */
  const handleDownloadReport = useCallback(() => {
    // Implement report download functionality
    setSnackbar({
      open: true,
      message: 'Report download functionality will be implemented',
      severity: 'info',
    });
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error.main" gutterBottom>
          Error Loading Commission
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sales/commissions/list')}
        >
          Back to Commission List
        </Button>
      </Box>
    );
  }

  // Show commission not found
  if (!commission) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Commission Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          The requested commission could not be found.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sales/commissions/list')}
        >
          Back to Commission List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<ChevronRight fontSize="small" />} sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/dashboard')}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            <Home sx={{ mr: 0.5, fontSize: 16 }} />
            Dashboard
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/sales/commissions/list')}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Commission Management
          </Link>
          <Typography variant="body2" color="text.primary">
            Commission Details
          </Typography>
        </Breadcrumbs>

        {/* Header with Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Commission Details
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Commission ID: {commission._id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/sales/commissions/list')}
            >
              Back to List
            </Button>
            <CommissionActions
              commission={commission}
              canEdit={canEdit}
              canApprove={canApprove}
              canPayment={canPayment}
              onAction={handleCommissionAction}
            />
          </Box>
        </Box>

        {/* Status Badge */}
        <CommissionStatusBadge status={commission.status} />
      </Box>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          {TAB_PANELS.map((tab, index) => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={<tab.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && <CommissionOverviewTab commission={commission} />}
        {activeTab === 1 && <CommissionCalculationTab commission={commission} />}
        {activeTab === 2 && <CommissionPaymentsTab commission={commission} />}
        {activeTab === 3 && <CommissionHistoryTab commission={commission} />}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

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

export default CommissionDetailPage;
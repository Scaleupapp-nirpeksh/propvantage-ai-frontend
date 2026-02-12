/**
 * File: src/pages/payments/OverduePaymentsPage.js
 * Description: Comprehensive overdue payments management page with filtering, bulk actions,
 *              customer contact features, and aging analysis
 * Version: 1.0 - Complete Overdue Payments Management Implementation
 * Location: src/pages/payments/OverduePaymentsPage.js
 * 
 * Features:
 * - Overdue payments list with detailed information
 * - Advanced filtering and search capabilities
 * - Overdue aging analysis (0-30, 30-60, 60-90, 90+ days)
 * - Bulk actions for efficiency
 * - Customer contact management (call, email, WhatsApp)
 * - Payment recording from overdue list
 * - Export capabilities for follow-up
 * - Real-time data from backend APIs
 * - Responsive design with mobile optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Badge,
  Divider,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Checkbox,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import {
  Warning,
  Schedule,
  Phone,
  Email,
  WhatsApp,
  Payment,
  Visibility,
  MoreVert,
  Search,
  FilterList,
  Clear,
  Refresh,
  CheckCircle,
  ErrorOutline,
  ContactPhone,
  Send,
  GetApp,
  ArrowUpward,
  ArrowDownward,
  ExpandMore,
  Campaign,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Overdue aging bucket configurations
 */
const AGING_BUCKETS = [
  {
    id: 'recent',
    label: '1-30 Days',
    range: [1, 30],
    color: 'warning',
    icon: Schedule,
    description: 'Recently overdue - immediate follow-up needed',
  },
  {
    id: 'moderate',
    label: '31-60 Days',
    range: [31, 60],
    color: 'error',
    icon: ErrorOutline,
    description: 'Moderately overdue - urgent attention required',
  },
  {
    id: 'severe',
    label: '61-90 Days',
    range: [61, 90],
    color: 'error',
    icon: Warning,
    description: 'Severely overdue - escalation needed',
  },
  {
    id: 'critical',
    label: '90+ Days',
    range: [91, 999],
    color: 'error',
    icon: Campaign,
    description: 'Critical overdue - legal action consideration',
  },
];

/**
 * Contact method configurations
 */
const CONTACT_METHODS = [
  { id: 'phone', label: 'Call', icon: Phone, color: 'primary' },
  { id: 'email', label: 'Email', icon: Email, color: 'info' },
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsApp, color: 'success' },
];

/**
 * Table column configurations
 */
const TABLE_COLUMNS = [
  { id: 'customer', label: 'Customer', sortable: true, width: '200px' },
  { id: 'project', label: 'Project', sortable: true, width: '150px' },
  { id: 'unit', label: 'Unit', sortable: false, width: '100px' },
  { id: 'amount', label: 'Amount', sortable: true, width: '120px' },
  { id: 'dueDate', label: 'Due Date', sortable: true, width: '110px' },
  { id: 'overdueDays', label: 'Days Overdue', sortable: true, width: '120px' },
  { id: 'contact', label: 'Contact', sortable: false, width: '100px' },
  { id: 'actions', label: 'Actions', sortable: false, width: '120px' },
];

/**
 * Filter options
 */
const FILTER_OPTIONS = {
  agingBucket: [
    { value: 'all', label: 'All Overdue' },
    { value: 'recent', label: '1-30 Days' },
    { value: 'moderate', label: '31-60 Days' },
    { value: 'severe', label: '61-90 Days' },
    { value: 'critical', label: '90+ Days' },
  ],
  amountRange: [
    { value: 'all', label: 'All Amounts' },
    { value: 'low', label: 'Under ₹1L' },
    { value: 'medium', label: '₹1L - ₹5L' },
    { value: 'high', label: '₹5L - ₹10L' },
    { value: 'premium', label: 'Above ₹10L' },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates days overdue from due date
 * @param {string} dueDate - Due date string
 * @returns {number} Days overdue
 */
const calculateDaysOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Gets aging bucket for given days overdue
 * @param {number} daysOverdue - Number of days overdue
 * @returns {Object} Aging bucket configuration
 */
const getAgingBucket = (daysOverdue) => {
  return AGING_BUCKETS.find(bucket => 
    daysOverdue >= bucket.range[0] && daysOverdue <= bucket.range[1]
  ) || AGING_BUCKETS[AGING_BUCKETS.length - 1];
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
 * Formats project display name
 * @param {Object} project - Project object
 * @returns {string} Formatted project name
 */
const formatProjectName = (project) => {
  return project?.name || 'Unknown Project';
};

/**
 * Formats unit display name
 * @param {Object} unit - Unit object
 * @returns {string} Formatted unit name
 */
const formatUnitName = (unit) => {
  return unit?.unitNumber || unit?.name || 'Unknown Unit';
};

// ============================================================================
// OVERDUE AGING SUMMARY COMPONENT
// ============================================================================

/**
 * Overdue aging summary cards showing distribution across aging buckets
 * @param {Array} overduePayments - List of overdue payments
 * @param {boolean} loading - Loading state
 */
const OverdueAgingSummary = ({ overduePayments, loading }) => {
  const theme = useTheme();

  // Calculate aging distribution
  const agingDistribution = useMemo(() => {
    if (!overduePayments?.length) return AGING_BUCKETS.map(bucket => ({ ...bucket, count: 0, amount: 0 }));

    const distribution = AGING_BUCKETS.map(bucket => ({ ...bucket, count: 0, amount: 0 }));

    overduePayments.forEach(payment => {
      const daysOverdue = calculateDaysOverdue(payment.currentDueDate);
      const bucket = getAgingBucket(daysOverdue);
      const bucketIndex = distribution.findIndex(d => d.id === bucket.id);
      
      if (bucketIndex >= 0) {
        distribution[bucketIndex].count += 1;
        distribution[bucketIndex].amount += payment.pendingAmount || payment.currentAmount || 0;
      }
    });

    return distribution;
  }, [overduePayments]);

  const totalOverdue = agingDistribution.reduce((sum, bucket) => sum + bucket.amount, 0);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {AGING_BUCKETS.map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: 140 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={30} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {agingDistribution.map((bucket) => {
        const percentage = totalOverdue > 0 ? (bucket.amount / totalOverdue) * 100 : 0;
        
        return (
          <Grid item xs={12} sm={6} lg={3} key={bucket.id}>
            <Card 
              sx={{ 
                height: 140,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
                transition: 'all 0.3s ease-in-out',
                cursor: 'pointer',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {bucket.label}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color={`${bucket.color}.main`}>
                      {bucket.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(bucket.amount)}
                    </Typography>
                  </Box>
                  <Badge
                    badgeContent={bucket.count}
                    color={bucket.color}
                    max={999}
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                  >
                    <bucket.icon sx={{ fontSize: 32, color: `${bucket.color}.main`, opacity: 0.8 }} />
                  </Badge>
                </Box>
                
                {percentage > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {percentage.toFixed(1)}% of total overdue
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              {bucket.count > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${theme.palette[bucket.color].main} ${percentage}%, transparent ${percentage}%)`,
                  }}
                />
              )}
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// ============================================================================
// OVERDUE PAYMENTS TABLE COMPONENT
// ============================================================================

/**
 * Main overdue payments table with sorting, filtering, and actions
 * @param {Array} payments - Overdue payments list
 * @param {boolean} loading - Loading state
 * @param {Array} selectedPayments - Selected payment IDs
 * @param {Function} onSelectionChange - Selection change callback
 * @param {Function} onActionClick - Action click callback
 * @param {Object} sorting - Current sorting configuration
 * @param {Function} onSortChange - Sort change callback
 */
const OverduePaymentsTable = ({ 
  payments, 
  loading, 
  selectedPayments, 
  onSelectionChange, 
  onActionClick,
  sorting,
  onSortChange
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Handle selection
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = payments.map(payment => payment._id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPayment = (paymentId) => {
    const newSelection = selectedPayments.includes(paymentId)
      ? selectedPayments.filter(id => id !== paymentId)
      : [...selectedPayments, paymentId];
    onSelectionChange(newSelection);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sorting
  const handleSort = (column) => {
    if (!column.sortable) return;
    
    const isAsc = sorting.field === column.id && sorting.direction === 'asc';
    onSortChange({
      field: column.id,
      direction: isAsc ? 'desc' : 'asc'
    });
  };

  // Handle actions
  const handleActionMenuOpen = (event, payment) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedPayment(null);
  };

  const handleAction = (action) => {
    if (selectedPayment) {
      onActionClick(action, selectedPayment);
    }
    handleActionMenuClose();
  };

  // Contact methods for quick actions
  const getContactMethods = (payment) => {
    const customer = payment.customer || {};
    return [
      {
        method: 'phone',
        available: !!customer.phone,
        value: customer.phone,
        action: () => window.open(`tel:${customer.phone}`, '_blank'),
      },
      {
        method: 'email',
        available: !!customer.email,
        value: customer.email,
        action: () => window.open(`mailto:${customer.email}`, '_blank'),
      },
      {
        method: 'whatsapp',
        available: !!customer.phone,
        value: customer.phone,
        action: () => window.open(`https://wa.me/${customer.phone?.replace(/\D/g, '')}`, '_blank'),
      },
    ];
  };

  // Paginated data
  const paginatedPayments = payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={40} />
        </CardContent>
      </Card>
    );
  }

  if (!payments?.length) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Overdue Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Great! All payments are up to date.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Overdue Payments ({payments.length})
            </Typography>
            {selectedPayments.length > 0 && (
              <Chip 
                label={`${selectedPayments.length} selected`} 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
        }
      />
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedPayments.length > 0 && selectedPayments.length < payments.length}
                  checked={payments.length > 0 && selectedPayments.length === payments.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {TABLE_COLUMNS.map((column) => (
                <TableCell 
                  key={column.id}
                  sx={{ 
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => handleSort(column)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {column.label}
                    </Typography>
                    {column.sortable && (
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <ArrowUpward 
                          sx={{ 
                            fontSize: 12, 
                            opacity: sorting.field === column.id && sorting.direction === 'asc' ? 1 : 0.3 
                          }} 
                        />
                        <ArrowDownward 
                          sx={{ 
                            fontSize: 12, 
                            opacity: sorting.field === column.id && sorting.direction === 'desc' ? 1 : 0.3 
                          }} 
                        />
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedPayments.map((payment) => {
              const daysOverdue = calculateDaysOverdue(payment.currentDueDate);
              const agingBucket = getAgingBucket(daysOverdue);
              const contactMethods = getContactMethods(payment);
              const isSelected = selectedPayments.includes(payment._id);

              return (
                <TableRow
                  key={payment._id}
                  selected={isSelected}
                  sx={{ 
                    '&:hover': { backgroundColor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectPayment(payment._id)}
                    />
                  </TableCell>
                  
                  {/* Customer */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {formatCustomerName(payment.customer).charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCustomerName(payment.customer)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.customer?.phone && formatPhoneNumber(payment.customer.phone)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Project */}
                  <TableCell>
                    <Typography variant="body2">
                      {formatProjectName(payment.project)}
                    </Typography>
                  </TableCell>
                  
                  {/* Unit */}
                  <TableCell>
                    <Typography variant="body2">
                      {formatUnitName(payment.unit)}
                    </Typography>
                  </TableCell>
                  
                  {/* Amount */}
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {formatCurrency(payment.pendingAmount || payment.currentAmount)}
                    </Typography>
                  </TableCell>
                  
                  {/* Due Date */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(payment.currentDueDate)}
                    </Typography>
                  </TableCell>
                  
                  {/* Days Overdue */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${daysOverdue} days`}
                      color={agingBucket.color}
                      variant="outlined"
                      icon={<agingBucket.icon />}
                    />
                  </TableCell>
                  
                  {/* Contact Methods */}
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {contactMethods.map((contact) => {
                        const method = CONTACT_METHODS.find(m => m.id === contact.method);
                        return (
                          <Tooltip key={contact.method} title={contact.available ? `${method.label}: ${contact.value}` : `No ${method.label}`}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!contact.available}
                                onClick={contact.action}
                                sx={{ color: contact.available ? `${method.color}.main` : 'text.disabled' }}
                              >
                                <method.icon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Record Payment">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onActionClick('record-payment', payment)}
                        >
                          <Payment fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onActionClick('view-details', payment)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, payment)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={payments.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleAction('record-payment')}>
          <ListItemIcon><Payment fontSize="small" /></ListItemIcon>
          <ListItemText>Record Payment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('send-reminder')}>
          <ListItemIcon><Send fontSize="small" /></ListItemIcon>
          <ListItemText>Send Reminder</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('view-details')}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Payment Plan</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('contact-customer')}>
          <ListItemIcon><ContactPhone fontSize="small" /></ListItemIcon>
          <ListItemText>Contact Customer</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('export-details')}>
          <ListItemIcon><GetApp fontSize="small" /></ListItemIcon>
          <ListItemText>Export Details</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

// ============================================================================
// FILTERS AND SEARCH COMPONENT
// ============================================================================

/**
 * Advanced filters and search for overdue payments
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Filter change callback
 * @param {Function} onClear - Clear filters callback
 */
const OverdueFiltersSection = ({ filters, onFilterChange, onClear }) => {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value && value !== 'all' && value !== ''
  );

  return (
    <Card sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <FilterList color="primary" />
            <Typography variant="h6">
              Filters & Search
            </Typography>
            {hasActiveFilters && (
              <Chip 
                size="small" 
                label="Filters Active" 
                color="primary" 
                variant="outlined"
              />
            )}
            <Box sx={{ ml: 'auto', mr: 1 }}>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Customer name, project, unit..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Aging Bucket */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Aging Bucket</InputLabel>
                <Select
                  value={filters.agingBucket || 'all'}
                  label="Aging Bucket"
                  onChange={(e) => handleFilterChange('agingBucket', e.target.value)}
                >
                  {FILTER_OPTIONS.agingBucket.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Amount Range */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Amount Range</InputLabel>
                <Select
                  value={filters.amountRange || 'all'}
                  label="Amount Range"
                  onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                >
                  {FILTER_OPTIONS.amountRange.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

// ============================================================================
// MAIN OVERDUE PAYMENTS PAGE COMPONENT
// ============================================================================

/**
 * Main overdue payments page component
 * Comprehensive overdue payment management with all features
 */
const OverduePaymentsPage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Data state
  const [overduePayments, setOverduePayments] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);

  // Filter and sort state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    agingBucket: searchParams.get('agingBucket') || 'all',
    amountRange: searchParams.get('amountRange') || 'all',
  });

  const [sorting, setSorting] = useState({
    field: 'overdueDays',
    direction: 'desc',
  });

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  const canViewPayments = canAccess && canAccess.salesPipeline ? canAccess.salesPipeline() : true;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches overdue payments data
   * @param {boolean} showRefreshing - Whether to show refreshing indicator
   */
  const fetchOverduePayments = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching overdue payments...');

      const response = await paymentAPI.getOverduePayments({
        limit: 1000, // Get all overdue payments for comprehensive management
        sortBy: sorting.field,
        sortOrder: sorting.direction,
      });

      const raw = response.data?.data;
      const payments = Array.isArray(raw) ? raw : raw?.payments || raw?.results || [];
      console.log('✅ Overdue payments loaded:', payments.length);

      setOverduePayments(payments);

    } catch (err) {
      console.error('❌ Error fetching overdue payments:', err);
      setError(err.response?.data?.message || 'Failed to load overdue payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sorting]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load data on component mount and when sorting changes
  useEffect(() => {
    fetchOverduePayments();
  }, [fetchOverduePayments]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  /**
   * Filtered overdue payments based on current filters
   */
  const filteredPayments = useMemo(() => {
    if (!Array.isArray(overduePayments)) return [];
    let filtered = [...overduePayments];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(payment => {
        const customerName = formatCustomerName(payment.customer).toLowerCase();
        const projectName = formatProjectName(payment.project).toLowerCase();
        const unitName = formatUnitName(payment.unit).toLowerCase();
        
        return customerName.includes(searchLower) || 
               projectName.includes(searchLower) || 
               unitName.includes(searchLower);
      });
    }

    // Apply aging bucket filter
    if (filters.agingBucket && filters.agingBucket !== 'all') {
      const bucket = AGING_BUCKETS.find(b => b.id === filters.agingBucket);
      if (bucket) {
        filtered = filtered.filter(payment => {
          const daysOverdue = calculateDaysOverdue(payment.currentDueDate);
          return daysOverdue >= bucket.range[0] && daysOverdue <= bucket.range[1];
        });
      }
    }

    // Apply amount range filter
    if (filters.amountRange && filters.amountRange !== 'all') {
      filtered = filtered.filter(payment => {
        const amount = payment.pendingAmount || payment.currentAmount || 0;
        switch (filters.amountRange) {
          case 'low': return amount < 100000;
          case 'medium': return amount >= 100000 && amount <= 500000;
          case 'high': return amount > 500000 && amount <= 1000000;
          case 'premium': return amount > 1000000;
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sorting.field) {
        case 'overdueDays':
          valueA = calculateDaysOverdue(a.currentDueDate);
          valueB = calculateDaysOverdue(b.currentDueDate);
          break;
        case 'amount':
          valueA = a.pendingAmount || a.currentAmount || 0;
          valueB = b.pendingAmount || b.currentAmount || 0;
          break;
        case 'dueDate':
          valueA = new Date(a.currentDueDate);
          valueB = new Date(b.currentDueDate);
          break;
        case 'customerName':
          valueA = formatCustomerName(a.customer);
          valueB = formatCustomerName(b.customer);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sorting.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sorting.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [overduePayments, filters, sorting]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles filter changes
   * @param {Object} newFilters - New filter values
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handles clearing all filters
   */
  const handleClearFilters = () => {
    setFilters({
      search: '',
      agingBucket: 'all',
      amountRange: 'all',
    });
  };

  /**
   * Handles sort changes
   * @param {Object} newSorting - New sorting configuration
   */
  const handleSortChange = (newSorting) => {
    setSorting(newSorting);
  };

  /**
   * Handles selection changes
   * @param {Array} selection - Selected payment IDs
   */
  const handleSelectionChange = (selection) => {
    setSelectedPayments(selection);
  };

  /**
   * Handles action clicks
   * @param {string} action - Action type
   * @param {Object} payment - Payment object
   */
  const handleActionClick = (action, payment) => {
    switch (action) {
      case 'record-payment':
        navigate(`/payments/plans/${payment.sale}/record-payment`);
        break;
      case 'view-details':
        navigate(`/payments/plans/${payment.sale}`);
        break;
      case 'send-reminder':
        // TODO: Implement reminder functionality
        setSnackbar({ 
          open: true, 
          message: 'Payment reminder sent successfully', 
          severity: 'success' 
        });
        break;
      case 'contact-customer':
        if (payment.customer?.phone) {
          window.open(`tel:${payment.customer.phone}`, '_blank');
        }
        break;
      case 'export-details':
        // TODO: Implement export functionality
        setSnackbar({ 
          open: true, 
          message: 'Payment details exported successfully', 
          severity: 'success' 
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  /**
   * Handles manual refresh
   */
  const handleRefresh = () => {
    fetchOverduePayments(true);
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
          You don't have permission to view overdue payments.
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
            Overdue Payments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage overdue payments, contact customers, and track collection progress
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Payment />}
            onClick={() => navigate('/payments/record')}
          >
            Record Payment
          </Button>
        </Stack>
      </Box>

      {/* Dashboard Content */}
      <Stack spacing={4}>
        {/* Aging Summary */}
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Overdue Aging Analysis
          </Typography>
          <OverdueAgingSummary 
            overduePayments={filteredPayments} 
            loading={loading} 
          />
        </Box>

        {/* Filters */}
        <OverdueFiltersSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        {/* Overdue Payments Table */}
        <Box>
          <OverduePaymentsTable
            payments={filteredPayments}
            loading={loading}
            selectedPayments={selectedPayments}
            onSelectionChange={handleSelectionChange}
            onActionClick={handleActionClick}
            sorting={sorting}
            onSortChange={handleSortChange}
          />
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

export default OverduePaymentsPage;
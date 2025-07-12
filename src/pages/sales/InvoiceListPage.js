// File: src/pages/sales/InvoiceListPage.js
// Description: Invoice list and management page for PropVantage AI
// Version: 1.0 - Complete invoice management with filtering, pagination, and actions
// Location: src/pages/sales/InvoiceListPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Tooltip,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';

import {
  Receipt,
  Add,
  Search,
  FilterList,
  Clear,
  Refresh,
  FileDownload,
  Visibility,
  Edit,
  Payment,
  Cancel,
  Warning,
  CheckCircle,
  Schedule,
  MoreVert,
  PictureAsPdf,
  AttachMoney,
  CalendarToday,
  Business,
  Person,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Download,
} from '@mui/icons-material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { invoiceAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Invoice status configurations with colors and icons
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

// Invoice type configurations
const INVOICE_TYPE_CONFIG = {
  booking_invoice: { label: 'Booking Invoice', color: 'primary' },
  milestone_invoice: { label: 'Milestone Invoice', color: 'info' },
  final_invoice: { label: 'Final Invoice', color: 'success' },
  adjustment_invoice: { label: 'Adjustment Invoice', color: 'warning' },
  cancellation_invoice: { label: 'Cancellation Invoice', color: 'error' },
  additional_charges: { label: 'Additional Charges', color: 'secondary' },
};

// Filter options
const SORT_OPTIONS = [
  { value: 'invoiceDate', label: 'Invoice Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'financialSummary.totalAmount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get customer name
const getCustomerName = (invoice) => {
  if (!invoice.customer) return 'Unknown Customer';
  
  const { firstName, lastName, email, phone } = invoice.customer;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) return email;
  if (phone) return phone;
  return 'Unknown Customer';
};

// Helper function to calculate payment progress
const getPaymentProgress = (invoice) => {
  if (!invoice.financialSummary || invoice.financialSummary.totalAmount === 0) return 0;
  return Math.round((invoice.paymentDetails.totalPaid / invoice.financialSummary.totalAmount) * 100);
};

// Helper function to get days overdue
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

const InvoiceListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Data state
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    project: searchParams.get('project') || 'all',
    customer: searchParams.get('customer') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
    overdue: searchParams.get('overdue') || 'false',
    sortBy: searchParams.get('sortBy') || 'invoiceDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // UI state
  const [searchInput, setSearchInput] = useState(filters.search);
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 25,
    totalPages: 0,
    totalInvoices: 0,
  });

  // Summary state
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  // Dialog and menu state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionMenu, setActionMenu] = useState({ open: false, anchorEl: null, invoice: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, invoice: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch all required data
  const fetchAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Build query parameters
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status !== 'all' ? filters.status : '',
        type: filters.type !== 'all' ? filters.type : '',
        project: filters.project !== 'all' ? filters.project : '',
        customer: filters.customer !== 'all' ? filters.customer : '',
        dateFrom: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : '',
        dateTo: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : '',
        overdue: filters.overdue,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      // Remove empty parameters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      // Fetch invoices
      const [invoicesResponse, projectsResponse, usersResponse] = await Promise.all([
        invoiceAPI.getInvoices(queryParams),
        projectAPI.getProjects({ limit: 1000 }),
        userAPI.getUsers({ limit: 1000 }),
      ]);

      if (invoicesResponse.data.success) {
        setInvoices(invoicesResponse.data.data.invoices);
        setPagination(prev => ({
          ...prev,
          totalPages: invoicesResponse.data.data.pagination.totalPages,
          totalInvoices: invoicesResponse.data.data.pagination.totalInvoices,
        }));
        setSummary(invoicesResponse.data.data.summary);
      }

      if (projectsResponse.data.success) {
        setProjects(projectsResponse.data.data.projects || projectsResponse.data.data);
      }

      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users || usersResponse.data.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch invoices. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'false') {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    
    setSearchParams(params);
  }, [filters, pagination.page, pagination.limit, setSearchParams]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle search
  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchInput]);

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value);
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle action menu
  const handleActionMenuOpen = (event, invoice) => {
    setActionMenu({ open: true, anchorEl: event.currentTarget, invoice });
  };

  const handleActionMenuClose = () => {
    setActionMenu({ open: false, anchorEl: null, invoice: null });
  };

  // Handle invoice actions
  const handleViewInvoice = (invoice) => {
    navigate(`/sales/invoices/${invoice._id}`);
    handleActionMenuClose();
  };

  const handleRecordPayment = (invoice) => {
    navigate(`/sales/invoices/${invoice._id}?tab=payment`);
    handleActionMenuClose();
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      // This would be implemented when PDF generation is added
      setSnackbar({ 
        open: true, 
        message: 'PDF download feature coming soon', 
        severity: 'info' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to download invoice', 
        severity: 'error' 
      });
    }
    handleActionMenuClose();
  };

  const handleCancelInvoice = (invoice) => {
    setCancelDialog({ open: true, invoice });
    handleActionMenuClose();
  };

  // Confirm cancel invoice
  const confirmCancelInvoice = async () => {
    try {
      await invoiceAPI.cancelInvoice(cancelDialog.invoice._id, {
        reason: 'Cancelled by user'
      });
      
      setCancelDialog({ open: false, invoice: null });
      setSnackbar({ 
        open: true, 
        message: 'Invoice cancelled successfully', 
        severity: 'success' 
      });
      fetchAllData(true);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to cancel invoice', 
        severity: 'error' 
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      project: 'all',
      customer: 'all',
      dateFrom: null,
      dateTo: null,
      overdue: 'false',
      sortBy: 'invoiceDate',
      sortOrder: 'desc',
    });
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh data
  const refreshData = () => {
    fetchAllData(true);
  };

  // Export data
  const exportData = async () => {
    try {
      const queryParams = {
        status: filters.status !== 'all' ? filters.status : '',
        type: filters.type !== 'all' ? filters.type : '',
        project: filters.project !== 'all' ? filters.project : '',
        dateFrom: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : '',
        dateTo: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : '',
        format: 'csv'
      };

      // Create download link
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/invoices/export?${params.toString()}`;
      window.open(downloadUrl, '_blank');
      
      setSnackbar({ 
        open: true, 
        message: 'Export started successfully', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Export failed. Please try again.', 
        severity: 'error' 
      });
    }
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
        color={config.color}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          fontWeight: 500,
          '& .MuiChip-icon': {
            color: config.textColor,
          },
        }}
      />
    );
  };

  const renderInvoiceTypeChip = (type) => {
    const config = INVOICE_TYPE_CONFIG[type] || INVOICE_TYPE_CONFIG.booking_invoice;
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderPaymentProgress = (invoice) => {
    const progress = getPaymentProgress(invoice);
    const color = progress === 100 ? 'success' : progress > 50 ? 'warning' : 'error';
    
    return (
      <Box sx={{ minWidth: 120 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
            {progress}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={color}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(invoice.paymentDetails.totalPaid)} / {formatCurrency(invoice.financialSummary.totalAmount)}
        </Typography>
      </Box>
    );
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Invoice Management
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage and track all your invoices
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={exportData}
              disabled={invoices.length === 0}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Receipt />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Invoices
                    </Typography>
                    <Typography variant="h6">
                      {pagination.totalInvoices}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Amount
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Paid
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(summary.totalPaid)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Pending Amount
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(summary.totalPending)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Filters" 
            action={
              <Button 
                startIcon={<Clear />} 
                onClick={clearFilters}
                size="small"
              >
                Clear All
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              {/* Search */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Invoice number, customer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleSearch} size="small">
                        <Search />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    {Object.entries(INVOICE_STATUS_CONFIG).map(([status, config]) => (
                      <MenuItem key={status} value={status}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Type Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {Object.entries(INVOICE_TYPE_CONFIG).map(([type, config]) => (
                      <MenuItem key={type} value={type}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Project Filter */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={filters.project}
                    onChange={(e) => handleFilterChange('project', e.target.value)}
                    label="Project"
                  >
                    <MenuItem value="all">All Projects</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project._id} value={project._id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date From */}
              <Grid item xs={12} md={1.5}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => handleFilterChange('dateFrom', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {/* Date To */}
              <Grid item xs={12} md={1.5}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => handleFilterChange('dateTo', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card>
          <CardHeader 
            title={`Invoices (${pagination.totalInvoices})`}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    label="Sort By"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  size="small"
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  startIcon={filters.sortOrder === 'asc' ? <TrendingUp /> : <TrendingDown />}
                >
                  {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </Box>
            }
          />
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Details</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Project/Unit</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="textSecondary">
                        No invoices found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow 
                      key={invoice._id} 
                      hover 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      {/* Invoice Details */}
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {invoice.invoiceNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(invoice.invoiceDate)}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {renderInvoiceTypeChip(invoice.type)}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {getCustomerName(invoice)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {invoice.customer?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Project/Unit */}
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {invoice.project?.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Unit: {invoice.unit?.unitNumber}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {formatCurrency(invoice.financialSummary.totalAmount)}
                        </Typography>
                        {invoice.financialSummary.discountAmount > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Discount: {formatCurrency(invoice.financialSummary.discountAmount)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Payment Progress */}
                      <TableCell>
                        {renderPaymentProgress(invoice)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box>
                          {renderInvoiceStatusChip(invoice.status)}
                          {invoice.status === 'overdue' && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                              {getDaysOverdue(invoice)} days overdue
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.dueDate)}
                        </Typography>
                        {new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                          <Chip
                            label="Overdue"
                            color="error"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <IconButton 
                          onClick={(e) => handleActionMenuOpen(e, invoice)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={pagination.totalInvoices}
            page={pagination.page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            showFirstButton
            showLastButton
          />
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={actionMenu.open}
          onClose={handleActionMenuClose}
          PaperProps={{ sx: { minWidth: 180 } }}
        >
          <MenuItem onClick={() => handleViewInvoice(actionMenu.invoice)}>
            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          
          {actionMenu.invoice?.status !== 'paid' && actionMenu.invoice?.status !== 'cancelled' && (
            <MenuItem onClick={() => handleRecordPayment(actionMenu.invoice)}>
              <ListItemIcon><Payment fontSize="small" /></ListItemIcon>
              <ListItemText>Record Payment</ListItemText>
            </MenuItem>
          )}
          
          <MenuItem onClick={() => handleDownloadInvoice(actionMenu.invoice)}>
            <ListItemIcon><PictureAsPdf fontSize="small" /></ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          
          <Divider />
          
          {actionMenu.invoice?.status !== 'paid' && actionMenu.invoice?.status !== 'cancelled' && (
            <MenuItem 
              onClick={() => handleCancelInvoice(actionMenu.invoice)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Cancel Invoice</ListItemText>
            </MenuItem>
          )}
        </Menu>

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, invoice: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel invoice <strong>{cancelDialog.invoice?.invoiceNumber}</strong>? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog({ open: false, invoice: null })}>
              Cancel
            </Button>
            <Button 
              onClick={confirmCancelInvoice} 
              color="error" 
              variant="contained"
            >
              Cancel Invoice
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

export default InvoiceListPage;
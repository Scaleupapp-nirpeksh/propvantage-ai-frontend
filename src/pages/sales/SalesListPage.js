// File: src/pages/sales/SalesListPage.js
// Description: Complete sales list page with full pagination, search, and filtering
// Version: 3.0 - Production-ready with comprehensive features and proper API integration
// Location: src/pages/sales/SalesListPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Fab,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  AttachMoney,
  Receipt,
  FileDownload,
  Refresh,
  Clear,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  Business,
  LocationOn,
  CalendarToday,
  ExpandMore,
  GetApp,
  Print,
  Email,
  Phone,
  Assessment,
  AccountBalance,
  CreditCard,
  Sort,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// Constants for sales status and priorities
const SALE_STATUSES = [
  { value: 'booked', label: 'Booked', color: 'success' },
  { value: 'agreement_signed', label: 'Agreement Signed', color: 'info' },
  { value: 'registration_pending', label: 'Registration Pending', color: 'warning' },
  { value: 'registration_complete', label: 'Registration Complete', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
  { value: 'on_hold', label: 'On Hold', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'default' },
];

const PAYMENT_STATUSES = [
  { value: 'on_track', label: 'On Track', color: 'success' },
  { value: 'delayed', label: 'Delayed', color: 'warning' },
  { value: 'overdue', label: 'Overdue', color: 'error' },
  { value: 'advance', label: 'Advance', color: 'info' },
  { value: 'pending', label: 'Pending', color: 'default' },
];

const SORT_OPTIONS = [
  { value: 'bookingDate', label: 'Booking Date' },
  { value: 'salePrice', label: 'Sale Amount' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Helper functions for populated data
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

const getUnitDisplayName = (sale) => {
  if (!sale.unit) return 'Unknown Unit';
  
  if (typeof sale.unit === 'object') {
    const { unitNumber, fullAddress } = sale.unit;
    return unitNumber || fullAddress || 'Unknown Unit';
  }
  
  return 'Unknown Unit';
};

const getProjectName = (sale) => {
  if (!sale.project) return 'Unknown Project';
  
  if (typeof sale.project === 'object') {
    return sale.project.name || 'Unknown Project';
  }
  
  return 'Unknown Project';
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

const getStatusConfig = (status, statusArray) => {
  return statusArray.find(s => s.value === status) || { label: status, color: 'default' };
};

// Enhanced Stats Cards Component
const SalesStatsCards = ({ stats, loading, onRefresh }) => {
  const navigate = useNavigate();

  const statsConfig = [
    {
      title: 'Total Sales',
      value: stats?.totalSales || 0,
      icon: AttachMoney,
      color: 'primary',
      subtitle: 'All time bookings',
      onClick: () => {},
    },
    {
      title: 'Revenue Generated',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'success',
      subtitle: 'Total sales value',
      onClick: () => navigate('/analytics/revenue'),
    },
    {
      title: 'This Month',
      value: stats?.monthlyStats?.count || 0,
      icon: CalendarToday,
      color: 'info',
      subtitle: `${formatCurrency(stats?.monthlyStats?.revenue || 0)}`,
      onClick: () => {},
    },
    {
      title: 'Avg. Sale Value',
      value: formatCurrency(stats?.averageSaleValue || 0),
      icon: Assessment,
      color: 'warning',
      subtitle: 'Per unit average',
      onClick: () => navigate('/analytics/sales'),
    },
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2">Loading...</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statsConfig.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
            onClick={stat.onClick}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stat.subtitle}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 56, height: 56 }}>
                  <stat.icon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Enhanced Sales Table Row Component
const SalesTableRow = ({ sale, onAction, index }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    onAction(action, sale);
    handleMenuClose();
  };

  const customerName = getCustomerName(sale);
  const unitName = getUnitDisplayName(sale);
  const projectName = getProjectName(sale);
  const salespersonName = getSalespersonName(sale);
  const salespersonInitials = salespersonName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <>
      <TableRow hover sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
        {/* Sale ID and Customer */}
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {customerName}
            </Typography>
          </Box>
        </TableCell>

        {/* Project and Unit */}
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {projectName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {unitName}
            </Typography>
          </Box>
        </TableCell>

        {/* Sale Amount */}
        <TableCell>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {formatCurrency(sale.salePrice || 0)}
          </Typography>
          {(sale.discountAmount || 0) > 0 && (
            <Typography variant="caption" color="success.main">
              -{formatCurrency(sale.discountAmount)}
            </Typography>
          )}
        </TableCell>

        {/* Sale Status */}
        <TableCell>
          <Chip 
            label={getStatusConfig(sale.status || 'pending', SALE_STATUSES).label} 
            color={getStatusConfig(sale.status || 'pending', SALE_STATUSES).color}
            size="small"
            variant="outlined"
          />
        </TableCell>

        {/* Payment Status */}
        <TableCell>
          <Chip 
            label={getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES).label} 
            color={getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES).color}
            size="small"
          />
        </TableCell>

        {/* Salesperson */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 28, height: 28, mr: 1, fontSize: '0.75rem' }}>
              {salespersonInitials || 'U'}
            </Avatar>
            <Typography variant="body2">
              {salespersonName}
            </Typography>
          </Box>
        </TableCell>

        {/* Sale Date */}
        <TableCell>
          <Typography variant="body2">
            {formatDate(sale.bookingDate || sale.createdAt)}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Sale</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('payment')}>
          <ListItemIcon><AccountBalance fontSize="small" /></ListItemIcon>
          <ListItemText>Payment Plan</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('receipt')}>
          <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
          <ListItemText>Generate Receipt</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('contact')}>
          <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
          <ListItemText>Contact Customer</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('email')}>
          <ListItemIcon><Email fontSize="small" /></ListItemIcon>
          <ListItemText>Send Email</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('cancel')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Cancel Sale</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// Main Sales List Page Component
const SalesListPage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [sales, setSales] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    paymentStatus: searchParams.get('paymentStatus') || 'all',
    project: searchParams.get('project') || 'all',
    salesperson: searchParams.get('salesperson') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
    sortBy: searchParams.get('sortBy') || 'bookingDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, sale: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Handle search input with debounce
  const handleSearchInput = (value) => {
    setSearchInput(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Cleanup search timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Memoized filtered data info
  const filteredDataInfo = useMemo(() => {
    return {
      total: pagination.total,
      showing: sales.length,
      start: (pagination.page - 1) * pagination.limit + 1,
      end: Math.min(pagination.page * pagination.limit, pagination.total)
    };
  }, [pagination, sales]);

  // Fetch all data with comprehensive error handling
  const fetchAllData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching sales data...');
      
      // Build query parameters
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        project: filters.project !== 'all' ? filters.project : undefined,
        salesperson: filters.salesperson !== 'all' ? filters.salesperson : undefined,
        dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
        dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      console.log('📋 Query params:', queryParams);

      // Fetch data in parallel
      const [salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        projectAPI.getProjects(),
        canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      // Process sales data
      if (salesResult.status === 'fulfilled') {
        console.log('✅ Sales API Response:', salesResult.value.data);
        const response = salesResult.value.data;
        
        if (response.success) {
          setSales(response.data || []);
          setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
          setStats(response.stats || {});
        } else {
          // Fallback for different response structure
          setSales(response.data || response || []);
          setPagination(prev => ({ ...prev, total: response.count || 0 }));
        }
      } else {
        console.error('❌ Sales API failed:', salesResult.reason);
        setSales([]);
        setPagination(prev => ({ ...prev, total: 0 }));
        setError('Failed to load sales data. Please try again.');
      }

      // Process projects data
      if (projectsResult.status === 'fulfilled') {
        const response = projectsResult.value.data;
        const projectsData = response.data || response || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } else {
        console.error('❌ Projects API failed:', projectsResult.reason);
        setProjects([]);
      }

      // Process users data
      if (usersResult.status === 'fulfilled') {
        const response = usersResult.value.data;
        const usersData = response.data || response || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        console.error('❌ Users API failed:', usersResult.reason);
        setUsers([]);
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching sales data:', error);
      setError('Failed to load sales data. Please try refreshing.');
      setLoading(false);
      setSales([]);
      setSnackbar({ open: true, message: 'Failed to load sales data', severity: 'error' });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, filters, canAccess]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value);
        }
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sorting
  const handleSortChange = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: newOrder,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, page: 1, limit: newLimit }));
  };

  // Handle actions
  const handleSaleAction = async (action, sale) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/sales/${sale._id}`);
          break;
        case 'edit':
          navigate(`/sales/${sale._id}/edit`);
          break;
        case 'payment':
          navigate(`/payments/plans/${sale._id}`);
          break;
        case 'receipt':
          // Generate receipt
          await salesAPI.generateSaleDocuments(sale._id);
          setSnackbar({ open: true, message: 'Receipt generated successfully', severity: 'success' });
          break;
        case 'contact':
          if (sale.lead?.phone) {
            window.open(`tel:${sale.lead.phone}`, '_blank');
          }
          break;
        case 'email':
          if (sale.lead?.email) {
            window.open(`mailto:${sale.lead.email}`, '_blank');
          }
          break;
        case 'cancel':
          setCancelDialog({ open: true, sale });
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      setSnackbar({ open: true, message: 'Action failed. Please try again.', severity: 'error' });
    }
  };

  // Handle cancel sale
  const handleCancelSale = async () => {
    try {
      await salesAPI.cancelSale(cancelDialog.sale._id, {
        reason: 'Cancelled by user',
        cancelledBy: user._id,
      });
      setCancelDialog({ open: false, sale: null });
      setSnackbar({ open: true, message: 'Sale cancelled successfully', severity: 'success' });
      fetchAllData(true);
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setSnackbar({ open: true, message: 'Failed to cancel sale', severity: 'error' });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      project: 'all',
      salesperson: 'all',
      dateFrom: null,
      dateTo: null,
      sortBy: 'bookingDate',
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
      // This would typically call an export API
      setSnackbar({ open: true, message: 'Export feature coming soon', severity: 'info' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Sales Management
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage all your property sales and bookings
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={exportData}
              disabled={sales.length === 0}
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
            
            {canAccess.salesPipeline() && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/sales/create')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                New Sale
              </Button>
            )}
          </Box>
        </Box>

        {/* Progress bar for refreshing */}
        {refreshing && <LinearProgress sx={{ mb: 2 }} />}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <SalesStatsCards stats={stats} loading={loading} onRefresh={refreshData} />

        {/* Filters Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filters & Search</Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  sx={{ mr: 1 }}
                >
                  Clear All
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </Box>
            </Box>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search by customer name, sale number, unit number..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: showFilters ? 2 : 0 }}
            />

            {/* Advanced Filters */}
            {showFilters && (
              <Accordion expanded sx={{ boxShadow: 'none' }}>
                <AccordionDetails sx={{ p: 0, pt: 2 }}>
                  <Grid container spacing={2}>
                    {/* Status Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Sale Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Sale Status"
                          onChange={handleFilterChange('status')}
                        >
                          <MenuItem value="all">All Statuses</MenuItem>
                          {SALE_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Payment Status Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                          value={filters.paymentStatus}
                          label="Payment Status"
                          onChange={handleFilterChange('paymentStatus')}
                        >
                          <MenuItem value="all">All Payment Status</MenuItem>
                          {PAYMENT_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Project Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Project</InputLabel>
                        <Select
                          value={filters.project}
                          label="Project"
                          onChange={handleFilterChange('project')}
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

                    {/* Salesperson Filter */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Salesperson</InputLabel>
                        <Select
                          value={filters.salesperson}
                          label="Salesperson"
                          onChange={handleFilterChange('salesperson')}
                        >
                          <MenuItem value="all">All Salespeople</MenuItem>
                          {users.filter(u => u.role?.includes('Sales')).map((user) => (
                            <MenuItem key={user._id} value={user._id}>
                              {user.firstName} {user.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Sort Options */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={filters.sortBy}
                          label="Sort By"
                          onChange={handleFilterChange('sortBy')}
                        >
                          {SORT_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Sort Order */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Sort Order</InputLabel>
                        <Select
                          value={filters.sortOrder}
                          label="Sort Order"
                          onChange={handleFilterChange('sortOrder')}
                        >
                          <MenuItem value="desc">Descending</MenuItem>
                          <MenuItem value="asc">Ascending</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Date Range Filters */}
                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="From Date"
                        value={filters.dateFrom}
                        onChange={handleFilterChange('dateFrom')}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <DatePicker
                        label="To Date"
                        value={filters.dateTo}
                        onChange={handleFilterChange('dateTo')}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {/* Table Header with count and pagination info */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    Sales List ({pagination.total?.toLocaleString() || 0})
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Showing {filteredDataInfo.start}-{filteredDataInfo.end} of {filteredDataInfo.total} sales
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Page {pagination.page} of {pagination.totalPages}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Sale ID / Customer
                        <IconButton size="small" onClick={() => handleSortChange('createdAt')}>
                          {filters.sortBy === 'createdAt' ? (
                            filters.sortOrder === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />
                          ) : (
                            <Sort fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>Project / Unit</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Sale Amount
                        <IconButton size="small" onClick={() => handleSortChange('salePrice')}>
                          {filters.sortBy === 'salePrice' ? (
                            filters.sortOrder === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />
                          ) : (
                            <Sort fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Sale Status
                        <IconButton size="small" onClick={() => handleSortChange('status')}>
                          {filters.sortBy === 'status' ? (
                            filters.sortOrder === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />
                          ) : (
                            <Sort fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Salesperson</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Sale Date
                        <IconButton size="small" onClick={() => handleSortChange('bookingDate')}>
                          {filters.sortBy === 'bookingDate' ? (
                            filters.sortOrder === 'desc' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />
                          ) : (
                            <Sort fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          {filters.search || filters.status !== 'all' || filters.project !== 'all'
                            ? 'No sales found matching your filters.'
                            : 'No sales recorded yet.'}
                        </Typography>
                        {canAccess.salesPipeline() && (
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/sales/create')}
                            sx={{ mt: 2 }}
                          >
                            Create First Sale
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale, index) => (
                      <SalesTableRow
                        key={sale._id}
                        sale={sale}
                        onAction={handleSaleAction}
                        index={index}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Enhanced Pagination */}
            {pagination.total > 0 && (
              <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                <TablePagination
                  rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                  component="div"
                  count={pagination.total}
                  rowsPerPage={pagination.limit}
                  page={pagination.page - 1}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  showFirstButton
                  showLastButton
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Floating Action Button for Mobile */}
        {isMobile && canAccess.salesPipeline() && (
          <Fab
            color="primary"
            aria-label="add sale"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => navigate('/sales/create')}
          >
            <Add />
          </Fab>
        )}

        {/* Cancel Sale Dialog */}
        <Dialog
          open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, sale: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Sale</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this sale? This action cannot be undone.
              {cancelDialog.sale && (
                <>
                  <br /><br />
                  <strong>Sale ID:</strong> #{cancelDialog.sale.saleNumber || cancelDialog.sale._id?.slice(-6)?.toUpperCase() || 'Unknown'}<br />
                  <strong>Customer:</strong> {getCustomerName(cancelDialog.sale)}<br />
                  <strong>Amount:</strong> {formatCurrency(cancelDialog.sale.salePrice || 0)}
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog({ open: false, sale: null })}>
              Keep Sale
            </Button>
            <Button onClick={handleCancelSale} color="error" variant="contained">
              Cancel Sale
            </Button>
          </DialogActions>
        </Dialog>

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
    </LocalizationProvider>
  );
};

export default SalesListPage;
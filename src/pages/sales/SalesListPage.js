// File: src/pages/sales/SalesListPage.js
// Description: Comprehensive sales management page with filtering, search, analytics, and actions
// Version: 1.0 - Production-grade sales management interface with complete backend integration
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

// Helper function to safely extract display values from objects
const getDisplayValue = (value, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // Try common display properties
    return value.name || value.title || value.unitNumber || value.displayName || fallback;
  }
  return String(value);
};

// Helper function to get customer name from lead object
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

// Helper function to get unit display name
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

// Helper function to get status configuration
const getStatusConfig = (status, statusArray) => {
  return statusArray.find(s => s.value === status) || { label: status, color: 'default' };
};

// Quick stats cards component
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
      subtitle: `₹${formatCurrency(stats?.monthlyStats?.revenue || 0)}`,
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

// Sales table row component
const SalesTableRow = ({ sale, onAction, projects, users }) => {
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

  // Get project and user details with safety checks
  const project = projects.find(p => p._id === (typeof sale.project === 'object' ? sale.project._id : sale.project)) || {};
  const salesperson = users.find(u => u._id === (typeof sale.salesperson === 'object' ? sale.salesperson._id : sale.salesperson)) || {};

  return (
    <>
      <TableRow hover>
        {/* Sale ID and Customer */}
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {getCustomerName(sale)}
            </Typography>
          </Box>
        </TableCell>

        {/* Project and Unit */}
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {project.name || 'Unknown Project'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {getUnitDisplayName(sale)}
            </Typography>
          </Box>
        </TableCell>

        {/* Sale Amount */}
        <TableCell>
          <Typography variant="body2" fontWeight="bold" color="primary">
            {formatCurrency(sale.salePrice || sale.totalAmount || sale.amount || 0)}
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
              {salesperson.firstName?.[0] || salesperson.name?.[0] || 'U'}
            </Avatar>
            <Typography variant="body2">
              {salesperson.firstName && salesperson.lastName 
                ? `${salesperson.firstName} ${salesperson.lastName}`
                : salesperson.name || 'Unassigned'}
            </Typography>
          </Box>
        </TableCell>

        {/* Sale Date */}
        <TableCell>
          <Typography variant="body2">
            {formatDate(sale.saleDate || sale.createdAt || sale.bookingDate)}
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
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    paymentStatus: searchParams.get('paymentStatus') || 'all',
    project: searchParams.get('project') || 'all',
    salesperson: searchParams.get('salesperson') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
  });

  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, sale: null });

  // Memoized filtered data count
  const filteredDataInfo = useMemo(() => {
    return {
      total: totalCount,
      showing: Math.min(rowsPerPage, totalCount - page * rowsPerPage),
      start: page * rowsPerPage + 1,
      end: Math.min((page + 1) * rowsPerPage, totalCount)
    };
  }, [totalCount, page, rowsPerPage]);

  // Fetch all data
  const fetchAllData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching sales data...');
      
      // Build query parameters
      const queryParams = {
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        project: filters.project !== 'all' ? filters.project : undefined,
        salesperson: filters.salesperson !== 'all' ? filters.salesperson : undefined,
        dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
        dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      // Fetch data in parallel
      const [salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        projectAPI.getProjects(),
        canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: [] }),
      ]);

      // Process sales data
      if (salesResult.status === 'fulfilled') {
        console.log('✅ Sales API Response:', salesResult.value.data);
        const salesData = salesResult.value.data;
        
        // Handle different response structures
        if (salesData.data && Array.isArray(salesData.data)) {
          setSales(salesData.data);
          setTotalCount(salesData.total || salesData.data.length);
          setStats(salesData.stats || {});
        } else if (Array.isArray(salesData)) {
          setSales(salesData);
          setTotalCount(salesData.length);
        } else {
          setSales([]);
          setTotalCount(0);
        }
      } else {
        console.error('❌ Sales API failed:', salesResult.reason);
        setSales([]);
      }

      // Process projects data
      if (projectsResult.status === 'fulfilled') {
        const projectsData = projectsResult.value.data.data || projectsResult.value.data || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } else {
        console.error('❌ Projects API failed:', projectsResult.reason);
        setProjects([]);
      }

      // Process users data
      if (usersResult.status === 'fulfilled') {
        const usersData = usersResult.value.data.data || usersResult.value.data || [];
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
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [page, rowsPerPage, filters, canAccess]);

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
    setPage(0); // Reset to first page when filtering
  };

  // Handle pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle actions
  const handleSaleAction = (action, sale) => {
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
        // TODO: Generate receipt
        console.log('Generate receipt for sale:', sale._id);
        break;
      case 'contact':
        // TODO: Open contact modal
        console.log('Contact customer for sale:', sale._id);
        break;
      case 'email':
        // TODO: Open email modal
        console.log('Send email for sale:', sale._id);
        break;
      case 'cancel':
        setCancelDialog({ open: true, sale });
        break;
      default:
        console.log('Unknown action:', action);
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
      fetchAllData(true);
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setError('Failed to cancel sale. Please try again.');
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
    });
    setPage(0);
  };

  // Refresh data
  const refreshData = () => {
    fetchAllData(true);
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
              value={filters.search}
              onChange={handleFilterChange('search')}
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
            {/* Table Header with count */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Sales List ({totalCount.toLocaleString()})
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredDataInfo.start}-{filteredDataInfo.end} of {filteredDataInfo.total} sales
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sale ID / Customer</TableCell>
                    <TableCell>Project / Unit</TableCell>
                    <TableCell>Sale Amount</TableCell>
                    <TableCell>Sale Status</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell>Salesperson</TableCell>
                    <TableCell>Sale Date</TableCell>
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
                    sales.map((sale) => (
                      <SalesTableRow
                        key={sale._id}
                        sale={sale}
                        onAction={handleSaleAction}
                        projects={projects}
                        users={users}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalCount > 0 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
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
                  <strong>Amount:</strong> {formatCurrency(cancelDialog.sale.salePrice || cancelDialog.sale.totalAmount || cancelDialog.sale.amount || 0)}
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
      </Box>
    </LocalizationProvider>
  );
};

export default SalesListPage;
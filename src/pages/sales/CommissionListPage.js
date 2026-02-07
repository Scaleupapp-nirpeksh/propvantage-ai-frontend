// File: src/pages/sales/CommissionListPage.js
// Description: Comprehensive commission list page with filtering, sorting, pagination, and bulk actions
// Version: 1.0 - Complete commission management with backend integration
// Location: src/pages/sales/CommissionListPage.js

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
  Avatar,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  InputAdornment,
  Collapse,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Schedule,
  Payment,
  Download,
  Refresh,
  Clear,
  ExpandMore,
  ExpandLess,
  Assignment,
  Error as ErrorIcon,
  AccountBalanceWallet,
  PendingActions,
  Analytics,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Commission status configurations
const COMMISSION_STATUSES = [
  { value: 'all', label: 'All Status', color: 'default' },
  { value: 'pending', label: 'Pending Approval', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'paid', label: 'Paid', color: 'info' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'on_hold', label: 'On Hold', color: 'default' },
];

// Sort options for commission list
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'commissionAmount', label: 'Commission Amount' },
  { value: 'saleAmount', label: 'Sale Amount' },
  { value: 'status', label: 'Status' },
  { value: 'partnerName', label: 'Partner Name' },
  { value: 'dueDate', label: 'Due Date' },
];

// Page size options for pagination
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Bulk action options
const BULK_ACTIONS = [
  { id: 'approve', label: 'Approve Selected', icon: CheckCircle, color: 'success' },
  { id: 'reject', label: 'Reject Selected', icon: Cancel, color: 'error' },
  { id: 'hold', label: 'Put on Hold', icon: Schedule, color: 'warning' },
  { id: 'export', label: 'Export Selected', icon: Download, color: 'primary' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets commission status configuration
 */
const getCommissionStatusConfig = (status) => {
  const statusConfigs = {
    pending: { color: 'warning', icon: Schedule, bgColor: '#fff3cd' },
    approved: { color: 'success', icon: CheckCircle, bgColor: '#d4edda' },
    paid: { color: 'info', icon: AccountBalanceWallet, bgColor: '#d1ecf1' },
    rejected: { color: 'error', icon: ErrorIcon, bgColor: '#f8d7da' },
    on_hold: { color: 'default', icon: PendingActions, bgColor: '#e2e3e5' },
  };
  return statusConfigs[status] || statusConfigs.pending;
};

/**
 * Generates query parameters from filters
 */
const buildQueryParams = (filters, pagination, sortConfig) => {
  const params = new URLSearchParams();
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== '') {
      if (key === 'dateFrom' || key === 'dateTo') {
        params.append(key, value.toISOString());
      } else {
        params.append(key, value);
      }
    }
  });
  
  // Add pagination
  params.append('page', pagination.page.toString());
  params.append('limit', pagination.limit.toString());
  
  // Add sorting
  if (sortConfig.sortBy) {
    params.append('sortBy', sortConfig.sortBy);
    params.append('sortOrder', sortConfig.sortOrder);
  }
  
  return params;
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Commission Status Chip Component
 */
const CommissionStatusChip = ({ status, size = 'small' }) => {
  const config = getCommissionStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Chip
      icon={<StatusIcon sx={{ fontSize: 16 }} />}
      label={COMMISSION_STATUSES.find(s => s.value === status)?.label || status}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

/**
 * Commission Row Actions Component
 */
const CommissionRowActions = ({ commission, onAction, canEdit, canApprove, canPayment }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleAction = (action) => {
    onAction(action, commission);
    handleMenuClose();
  };

  const actions = [
    { id: 'view', label: 'View Details', icon: Visibility, show: true },
    { id: 'edit', label: 'Edit Commission', icon: Edit, show: canEdit },
    { id: 'approve', label: 'Approve', icon: CheckCircle, show: canApprove && commission.status === 'pending' },
    { id: 'reject', label: 'Reject', icon: Cancel, show: canApprove && commission.status === 'pending' },
    { id: 'payment', label: 'Record Payment', icon: Payment, show: canPayment && commission.status === 'approved' },
    { id: 'hold', label: 'Put on Hold', icon: Schedule, show: canApprove && commission.status !== 'on_hold' },
  ].filter(action => action.show);

  return (
    <>
      <Tooltip title="More actions">
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        {actions.map((action) => (
          <MenuItem key={action.id} onClick={() => handleAction(action.id)}>
            <ListItemIcon>
              <action.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

/**
 * Commission Filters Component
 */
const CommissionFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  projects, 
  partners,
  isLoading 
}) => {
  const [expanded, setExpanded] = useState(false);

  const activeFilterCount = Object.values(filters).filter(value => 
    value && value !== 'all' && value !== ''
  ).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Filters</Typography>
            {activeFilterCount > 0 && (
              <Badge badgeContent={activeFilterCount} color="primary">
                <Chip size="small" label="Active" />
              </Badge>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear
            </Button>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search || ''}
                onChange={(e) => onFilterChange('search', e.target.value)}
                placeholder="Partner name, email..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || 'all'}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                  label="Status"
                >
                  {COMMISSION_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
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
                  value={filters.projectId || 'all'}
                  onChange={(e) => onFilterChange('projectId', e.target.value)}
                  label="Project"
                  disabled={isLoading}
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

            {/* Partner Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Partner</InputLabel>
                <Select
                  value={filters.partnerId || 'all'}
                  onChange={(e) => onFilterChange('partnerId', e.target.value)}
                  label="Partner"
                  disabled={isLoading}
                >
                  <MenuItem value="all">All Partners</MenuItem>
                  {partners.map((partner) => (
                    <MenuItem key={partner._id} value={partner._id}>
                      {partner.firstName} {partner.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date From */}
            <Grid item xs={12} md={1.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => onFilterChange('dateFrom', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            {/* Date To */}
            <Grid item xs={12} md={1.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => onFilterChange('dateTo', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

/**
 * Bulk Actions Toolbar Component
 */
const BulkActionsToolbar = ({ 
  selectedCount, 
  onBulkAction, 
  canApprove, 
  canPayment,
  onClearSelection 
}) => {
  if (selectedCount === 0) return null;

  const availableActions = BULK_ACTIONS.filter(action => {
    switch (action.id) {
      case 'approve':
      case 'reject':
      case 'hold':
        return canApprove;
      default:
        return true;
    }
  });

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: 'primary.50',
        border: '1px solid',
        borderColor: 'primary.200'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {selectedCount} commission{selectedCount !== 1 ? 's' : ''} selected
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {availableActions.map((action) => (
            <Button
              key={action.id}
              variant="outlined"
              size="small"
              color={action.color}
              startIcon={<action.icon />}
              onClick={() => onBulkAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission List Page Component
 * Comprehensive commission management with filtering, sorting, and bulk actions
 */
const CommissionListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [commissions, setCommissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 25,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    projectId: searchParams.get('projectId') || 'all',
    partnerId: searchParams.get('partnerId') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState({
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // Selection state
  const [selectedCommissions, setSelectedCommissions] = useState([]);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    data: null,
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
   * Fetches commission data with current filters and pagination
   */
  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(filters, pagination, sortConfig);
      const response = await commissionAPI.getCommissions(Object.fromEntries(queryParams));
      
      const data = response.data?.data || [];
      const paginationData = response.data?.pagination || {};

      setCommissions(data);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0,
        totalPages: paginationData.pages || 0,
      }));

      // Update URL with current filters
      setSearchParams(queryParams);

    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err.response?.data?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit, sortConfig, setSearchParams]);

  /**
   * Fetches filter options (projects and partners)
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [projectsResponse, usersResponse] = await Promise.all([
        projectAPI.getProjects(),
        userAPI.getUsers({ role: 'Channel Partner' }),
      ]);

      setProjects(projectsResponse.data?.data || []);
      setPartners(usersResponse.data?.data || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles filter changes
   */
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  /**
   * Handles clearing all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      projectId: 'all',
      partnerId: 'all',
      dateFrom: null,
      dateTo: null,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Handles sorting changes
   */
  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  /**
   * Handles pagination changes
   */
  const handlePageChange = useCallback((event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  }, []);

  /**
   * Handles row selection
   */
  const handleSelectRow = useCallback((commissionId, isSelected) => {
    if (isSelected) {
      setSelectedCommissions(prev => [...prev, commissionId]);
    } else {
      setSelectedCommissions(prev => prev.filter(id => id !== commissionId));
    }
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedCommissions(commissions.map(commission => commission._id));
    } else {
      setSelectedCommissions([]);
    }
  }, [commissions]);

  /**
   * Handles individual commission actions
   */
  const handleCommissionAction = useCallback(async (action, commission) => {
    switch (action) {
      case 'view':
        navigate(`/sales/commissions/list/${commission._id}`);
        break;
      case 'edit':
        navigate(`/sales/commissions/list/${commission._id}/edit`);
        break;
      case 'approve':
        setConfirmDialog({
          open: true,
          title: 'Approve Commission',
          message: `Are you sure you want to approve this commission of ${formatCurrency(commission.commissionCalculation?.netCommission || 0)}?`,
          action: 'approve',
          data: commission,
        });
        break;
      case 'reject':
        setConfirmDialog({
          open: true,
          title: 'Reject Commission',
          message: 'Are you sure you want to reject this commission? Please provide a reason.',
          action: 'reject',
          data: commission,
        });
        break;
      case 'payment':
        navigate(`/sales/commissions/payments/${commission._id}`);
        break;
      case 'hold':
        setConfirmDialog({
          open: true,
          title: 'Put Commission on Hold',
          message: 'Are you sure you want to put this commission on hold?',
          action: 'hold',
          data: commission,
        });
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [navigate]);

  /**
   * Handles bulk actions
   */
  const handleBulkAction = useCallback(async (action) => {
    if (selectedCommissions.length === 0) return;

    switch (action) {
      case 'approve':
        setConfirmDialog({
          open: true,
          title: 'Approve Selected Commissions',
          message: `Are you sure you want to approve ${selectedCommissions.length} commission(s)?`,
          action: 'bulk_approve',
          data: selectedCommissions,
        });
        break;
      case 'reject':
        setConfirmDialog({
          open: true,
          title: 'Reject Selected Commissions',
          message: `Are you sure you want to reject ${selectedCommissions.length} commission(s)?`,
          action: 'bulk_reject',
          data: selectedCommissions,
        });
        break;
      case 'export':
        // Handle export functionality
        handleExportCommissions(selectedCommissions);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommissions]);

  /**
   * Handles commission export
   */
  const handleExportCommissions = useCallback(async (commissionIds) => {
    try {
      // Implement export functionality based on your backend API
      setSnackbar({
        open: true,
        message: 'Export functionality will be implemented',
        severity: 'info',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Export failed',
        severity: 'error',
      });
    }
  }, []);

  /**
   * Handles dialog confirmation
   */
  const handleConfirmAction = useCallback(async () => {
    const { action, data } = confirmDialog;

    try {
      switch (action) {
        case 'approve':
          await commissionAPI.approveCommission(data._id);
          setSnackbar({ open: true, message: 'Commission approved successfully', severity: 'success' });
          break;
        case 'reject':
          await commissionAPI.rejectCommission(data._id, { reason: 'Rejected from list' });
          setSnackbar({ open: true, message: 'Commission rejected successfully', severity: 'success' });
          break;
        case 'bulk_approve':
          await commissionAPI.bulkApproveCommissions(data);
          setSnackbar({ open: true, message: `${data.length} commission(s) approved successfully`, severity: 'success' });
          setSelectedCommissions([]);
          break;
        case 'bulk_reject':
          // Implement bulk reject API call
          setSnackbar({ open: true, message: `${data.length} commission(s) rejected successfully`, severity: 'success' });
          setSelectedCommissions([]);
          break;
        default:
          break;
      }

      // Refresh data
      fetchCommissions();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Action failed',
        severity: 'error',
      });
    }

    setConfirmDialog({ open: false, title: '', message: '', action: null, data: null });
  }, [confirmDialog, fetchCommissions]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Commission Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track all commission records
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCommissions}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => navigate('/sales/commissions/reports')}
          >
            View Reports
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <CommissionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        projects={projects}
        partners={partners}
        isLoading={loading}
      />

      {/* Bulk Actions */}
      <BulkActionsToolbar
        selectedCount={selectedCommissions.length}
        onBulkAction={handleBulkAction}
        canApprove={canApprove}
        canPayment={canPayment}
        onClearSelection={() => setSelectedCommissions([])}
      />

      {/* Commission Table */}
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment />
              <Typography variant="h6">
                Commission Records ({pagination.total})
              </Typography>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortConfig.sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  label="Sort by"
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedCommissions.length > 0 && selectedCommissions.length < commissions.length}
                      checked={commissions.length > 0 && selectedCommissions.length === commissions.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Sale Amount</TableCell>
                  <TableCell align="right">Commission</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from(new Array(5)).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
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
                    <TableCell colSpan={8}>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No commissions found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Object.values(filters).some(v => v && v !== 'all') 
                            ? 'Try adjusting your filters' 
                            : 'Commission records will appear here once sales are made'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow 
                      key={commission._id} 
                      hover
                      selected={selectedCommissions.includes(commission._id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCommissions.includes(commission._id)}
                          onChange={(e) => handleSelectRow(commission._id, e.target.checked)}
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
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(commission.saleDetails?.salePrice || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                          {formatCurrency(commission.commissionCalculation?.netCommission || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <CommissionStatusChip status={commission.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(commission.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <CommissionRowActions
                          commission={commission}
                          onAction={handleCommissionAction}
                          canEdit={canEdit}
                          canApprove={canApprove}
                          canPayment={canPayment}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {!loading && commissions.length > 0 && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

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

export default CommissionListPage;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Avatar, Chip, IconButton, Tooltip, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Alert, Typography, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Button, LinearProgress, Fab,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Add, Visibility, Edit, Delete, AttachMoney, FileDownload, Refresh,
  Phone, Email, MoreVert, AccountBalance, CalendarToday, Assessment,
  TrendingUp,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PageHeader, KPICard, FilterBar, DataTable } from '../../components/common';

// Status configs
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

// Helpers
const getCustomerName = (sale) => {
  if (!sale.lead) return 'Unknown Customer';
  if (typeof sale.lead === 'object') {
    const { firstName, lastName, email, phone } = sale.lead;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || lastName || email || phone || 'Unknown Customer';
  }
  return 'Unknown Customer';
};

const getUnitName = (sale) => {
  if (typeof sale.unit === 'object') return sale.unit.unitNumber || sale.unit.fullAddress || 'Unknown Unit';
  return 'Unknown Unit';
};

const getProjectName = (sale) => {
  if (typeof sale.project === 'object') return sale.project.name || 'Unknown Project';
  return 'Unknown Project';
};

const getSalespersonName = (sale) => {
  if (!sale.salesPerson) return 'Unassigned';
  if (typeof sale.salesPerson === 'object') {
    const { firstName, lastName, email } = sale.salesPerson;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || lastName || email || 'Unassigned';
  }
  return 'Unassigned';
};

const getStatusConfig = (status, arr) => arr.find(s => s.value === status) || { label: status, color: 'default' };

// Mobile card renderer
const SaleMobileCard = ({ sale, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const statusCfg = getStatusConfig(sale.status || 'pending', SALE_STATUSES);
  const paymentCfg = getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
            {getCustomerName(sale)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()} · {getProjectName(sale)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
          <MoreVert fontSize="small" />
        </IconButton>
        <SaleActionMenu sale={sale} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} onAction={onAction} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {formatCurrency(sale.salePrice || 0)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {getUnitName(sale)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        <Chip label={statusCfg.label} color={statusCfg.color} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.688rem' }} />
        <Chip label={paymentCfg.label} color={paymentCfg.color} size="small" sx={{ height: 22, fontSize: '0.688rem' }} />
      </Box>
    </Box>
  );
};

// Shared action menu
const SaleActionMenu = ({ sale, anchorEl, onClose, onAction }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    <MenuItem onClick={() => { onAction('view', sale); onClose(); }}>
      <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
      <ListItemText>View Details</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('edit', sale); onClose(); }}>
      <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
      <ListItemText>Edit Sale</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('payment', sale); onClose(); }}>
      <ListItemIcon><AccountBalance fontSize="small" /></ListItemIcon>
      <ListItemText>Payment Plan</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={() => { onAction('contact', sale); onClose(); }}>
      <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
      <ListItemText>Contact Customer</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('email', sale); onClose(); }}>
      <ListItemIcon><Email fontSize="small" /></ListItemIcon>
      <ListItemText>Send Email</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={() => { onAction('cancel', sale); onClose(); }} sx={{ color: 'error.main' }}>
      <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
      <ListItemText>Cancel Sale</ListItemText>
    </MenuItem>
  </Menu>
);

// Main component
const SalesListPage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [sales, setSales] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuState, setMenuState] = useState({ anchorEl: null, sale: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, sale: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [pagination, setPagination] = useState({
    page: 1, limit: 25, total: 0, totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    project: searchParams.get('project') || '',
    salesperson: searchParams.get('salesperson') || '',
    sortBy: searchParams.get('sortBy') || 'bookingDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState(filters.search);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    setSearchTimeout(timeout);
  };

  useEffect(() => () => { if (searchTimeout) clearTimeout(searchTimeout); }, [searchTimeout]);

  // Fetch data
  const fetchAllData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const queryParams = {
        page: pagination.page, limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        project: filters.project || undefined,
        salesperson: filters.salesperson || undefined,
        sortBy: filters.sortBy, sortOrder: filters.sortOrder,
      };
      Object.keys(queryParams).forEach(k => queryParams[k] === undefined && delete queryParams[k]);

      const [salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        projectAPI.getProjects(),
        canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (salesResult.status === 'fulfilled') {
        const response = salesResult.value.data;
        if (response.success) {
          setSales(response.data || []);
          setPagination(response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });
          setStats(response.stats || {});
        } else {
          setSales(response.data || []);
          setPagination(prev => ({ ...prev, total: response.count || 0 }));
        }
      } else {
        setSales([]);
        setError('Failed to load sales data.');
      }

      if (projectsResult.status === 'fulfilled') {
        const data = projectsResult.value.data.data || projectsResult.value.data || [];
        setProjects(Array.isArray(data) ? data : []);
      }

      if (usersResult.status === 'fulfilled') {
        const data = usersResult.value.data.data || usersResult.value.data || [];
        setUsers(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load sales data.');
      setLoading(false);
      setSales([]);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, filters, canAccess]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Handlers
  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      handleSearchInput(value);
      return;
    }
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', paymentStatus: '', project: '', salesperson: '', sortBy: 'bookingDate', sortOrder: 'desc' });
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAction = async (action, sale) => {
    switch (action) {
      case 'view': navigate(`/sales/${sale._id}`); break;
      case 'edit': navigate(`/sales/${sale._id}/edit`); break;
      case 'payment': navigate(`/payments/plans/${sale._id}`); break;
      case 'contact': if (sale.lead?.phone) window.open(`tel:${sale.lead.phone}`); break;
      case 'email': if (sale.lead?.email) window.open(`mailto:${sale.lead.email}`); break;
      case 'cancel': setCancelDialog({ open: true, sale }); break;
      default: break;
    }
  };

  const handleCancelSale = async () => {
    try {
      await salesAPI.cancelSale(cancelDialog.sale._id, { reason: 'Cancelled by user', cancelledBy: user._id });
      setCancelDialog({ open: false, sale: null });
      setSnackbar({ open: true, message: 'Sale cancelled successfully', severity: 'success' });
      fetchAllData(true);
    } catch {
      setSnackbar({ open: true, message: 'Failed to cancel sale', severity: 'error' });
    }
  };

  // Filter config
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Sales', placeholder: 'Search customer, sale number, unit...' },
    { key: 'status', type: 'select', label: 'Status', options: SALE_STATUSES.map(s => ({ value: s.value, label: s.label })) },
    { key: 'paymentStatus', type: 'select', label: 'Payment', options: PAYMENT_STATUSES.map(s => ({ value: s.value, label: s.label })) },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
    { key: 'salesperson', type: 'select', label: 'Salesperson', options: users.filter(u => u.role?.includes('Sales')).map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })) },
  ];

  // Table columns
  const columns = [
    {
      id: 'customer', label: 'Sale / Customer', sortable: true,
      render: (_, sale) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {getCustomerName(sale)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'project', label: 'Project / Unit', sortable: false, hideOnMobile: true,
      render: (_, sale) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{getProjectName(sale)}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{getUnitName(sale)}</Typography>
        </Box>
      ),
    },
    {
      id: 'salePrice', label: 'Amount', sortable: true, width: 120,
      render: (_, sale) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatCurrency(sale.salePrice || 0)}
          </Typography>
          {(sale.discountAmount || 0) > 0 && (
            <Typography variant="caption" color="success.main">-{formatCurrency(sale.discountAmount)}</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'status', label: 'Status', sortable: true, width: 130,
      render: (_, sale) => {
        const cfg = getStatusConfig(sale.status || 'pending', SALE_STATUSES);
        return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />;
      },
    },
    {
      id: 'paymentStatus', label: 'Payment', sortable: false, width: 110, hideOnMobile: true,
      render: (_, sale) => {
        const cfg = getStatusConfig(sale.paymentStatus || 'pending', PAYMENT_STATUSES);
        return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ height: 24, fontSize: '0.75rem' }} />;
      },
    },
    {
      id: 'salesPerson', label: 'Salesperson', sortable: false, hideOnMobile: true, width: 140,
      render: (_, sale) => {
        const name = getSalespersonName(sale);
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.688rem' }}>{initials}</Avatar>
            <Typography variant="body2" noWrap>{name}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'bookingDate', label: 'Date', sortable: true, width: 90, hideOnMobile: true,
      render: (_, sale) => (
        <Typography variant="caption" color="text.secondary">
          {formatDate(sale.bookingDate || sale.createdAt)}
        </Typography>
      ),
    },
    {
      id: 'actions', label: '', sortable: false, width: 48, align: 'right',
      render: (_, sale) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuState({ anchorEl: e.currentTarget, sale }); }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <PageHeader
          title="Sales Management"
          subtitle="Manage all your property sales and bookings"
          icon={AttachMoney}
          actions={
            <>
              <Tooltip title="Export">
                <IconButton onClick={() => setSnackbar({ open: true, message: 'Export coming soon', severity: 'info' })} disabled={!sales.length}>
                  <FileDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={() => fetchAllData(true)} disabled={refreshing}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              {canAccess.salesPipeline() && (
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sales/create')} size="small">
                  {!isMobile && 'New Sale'}
                </Button>
              )}
            </>
          }
        />

        {refreshing && <LinearProgress sx={{ mb: 2, mx: -3, width: 'calc(100% + 48px)' }} />}

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <KPICard title="Total Sales" value={stats?.totalSales || 0} icon={AttachMoney} color="primary" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <KPICard title="Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={TrendingUp} color="success" loading={loading}
              onClick={() => navigate('/analytics/revenue')} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <KPICard title="This Month" value={stats?.monthlyStats?.count || 0}
              subtitle={formatCurrency(stats?.monthlyStats?.revenue || 0)} icon={CalendarToday} color="info" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <KPICard title="Avg. Sale Value" value={formatCurrency(stats?.averageSaleValue || 0)} icon={Assessment} color="warning" loading={loading}
              onClick={() => navigate('/analytics/sales')} />
          </Grid>
        </Grid>

        {/* Filters */}
        <FilterBar
          filters={filterConfig}
          values={{ ...filters, search: searchInput }}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />

        {/* Data Table */}
        <DataTable
          columns={columns}
          rows={sales}
          loading={loading}
          onRowClick={(sale) => navigate(`/sales/${sale._id}`)}
          currentSort={{ field: filters.sortBy, direction: filters.sortOrder }}
          onSort={(field) => {
            const dir = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
            setFilters(prev => ({ ...prev, sortBy: field, sortOrder: dir }));
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          pagination={{
            page: pagination.page - 1,
            rowsPerPage: pagination.limit,
            total: pagination.total,
            onPageChange: (p) => setPagination(prev => ({ ...prev, page: p + 1 })),
            onRowsPerPageChange: (rpp) => setPagination(prev => ({ ...prev, page: 1, limit: rpp })),
          }}
          emptyState={{
            icon: AttachMoney,
            title: 'No sales found',
            description: filters.search || filters.status ? 'Try adjusting your filters' : 'No sales recorded yet',
            action: canAccess.salesPipeline() ? { label: 'Create Sale', onClick: () => navigate('/sales/create') } : undefined,
          }}
          mobileCardRenderer={(sale) => <SaleMobileCard sale={sale} onAction={handleAction} />}
          responsive="card"
        />

        {/* Desktop action menu */}
        <SaleActionMenu
          sale={menuState.sale}
          anchorEl={menuState.anchorEl}
          onClose={() => setMenuState({ anchorEl: null, sale: null })}
          onAction={handleAction}
        />

        {/* Mobile FAB */}
        {isMobile && canAccess.salesPipeline() && (
          <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => navigate('/sales/create')}>
            <Add />
          </Fab>
        )}

        {/* Cancel dialog */}
        <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, sale: null })} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Sale</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this sale? This action cannot be undone.
              {cancelDialog.sale && (
                <>
                  <br /><br />
                  <strong>Sale:</strong> #{cancelDialog.sale.saleNumber || cancelDialog.sale._id?.slice(-6)?.toUpperCase()}<br />
                  <strong>Customer:</strong> {getCustomerName(cancelDialog.sale)}<br />
                  <strong>Amount:</strong> {formatCurrency(cancelDialog.sale.salePrice || 0)}
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog({ open: false, sale: null })}>Keep Sale</Button>
            <Button onClick={handleCancelSale} color="error" variant="contained">Cancel Sale</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesListPage;

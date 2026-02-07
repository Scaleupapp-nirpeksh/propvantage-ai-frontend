import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Typography, Button, IconButton, Tooltip, Avatar, Chip,
  Paper, Menu, MenuItem, Skeleton, Stack, Alert, LinearProgress,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  Add, Refresh, Visibility, Edit, ArrowForward, MoreVert,
  PlayArrow, Assignment, CheckCircle, Cancel, Assessment,
  MonetizationOn, TrendingUp, Timeline as TimelineIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PageHeader, KPICard, FilterBar } from '../../components/common';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  { key: 'Booked',           label: 'Booked',           color: 'info',    icon: PlayArrow },
  { key: 'Agreement Signed', label: 'Agreement Signed', color: 'primary', icon: Assignment },
  { key: 'Registered',       label: 'Registered',       color: 'warning', icon: CheckCircle },
  { key: 'Completed',        label: 'Completed',        color: 'success', icon: CheckCircle },
  { key: 'Cancelled',        label: 'Cancelled',        color: 'error',   icon: Cancel },
];

const TIME_PERIODS = [
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: '90',  label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getCustomerName = (sale) => {
  if (!sale?.lead) return 'Unknown Customer';
  const { firstName, lastName, email, phone } = sale.lead;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || email || phone || 'Unknown Customer';
};

const getProjectName = (sale) => sale?.project?.name || sale?.project?.title || 'Unknown Project';
const getUnitName = (sale) => sale?.unit?.unitNumber || sale?.unit?.fullAddress || 'Unknown Unit';

// ---------------------------------------------------------------------------
// Sale Card
// ---------------------------------------------------------------------------

const SaleCard = ({ sale, onClick }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Paper
        onClick={() => onClick(sale)}
        elevation={0}
        sx={{
          p: 1.5,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
            transform: 'translateY(-1px)',
          },
        }}
      >
        {/* Customer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0, flex: 1 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'primary.main' }}>
              {getCustomerName(sale)[0]}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {getCustomerName(sale)}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
            sx={{ width: 24, height: 24 }}
          >
            <MoreVert sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Project & Unit */}
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 0.75 }}>
          {getProjectName(sale)} &middot; {getUnitName(sale)}
        </Typography>

        {/* Price & Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatCurrency(sale.salePrice || 0)}
          </Typography>
          {sale.bookingDate && (
            <Typography variant="caption" color="text.disabled">
              {formatDate(sale.bookingDate)}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { onClick(sale); setAnchorEl(null); }}>
          <Visibility sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Edit sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} /> Edit Sale
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ArrowForward sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} /> Move Stage
        </MenuItem>
      </Menu>
    </>
  );
};

// ---------------------------------------------------------------------------
// Pipeline Column
// ---------------------------------------------------------------------------

const PipelineColumn = ({ stage, sales, totalValue, loading, onSaleClick }) => {
  const theme = useTheme();
  const paletteColor = theme.palette[stage.color]?.main || theme.palette.grey[500];
  const StageIcon = stage.icon;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Skeleton variant="rounded" height={56} sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={80} />)}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Column header */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(paletteColor, 0.06),
          borderTop: `3px solid ${paletteColor}`,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StageIcon sx={{ fontSize: 18, color: paletteColor }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {stage.label}
            </Typography>
          </Box>
          <Chip
            label={sales.length}
            size="small"
            sx={{
              height: 22,
              minWidth: 28,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: alpha(paletteColor, 0.12),
              color: paletteColor,
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: paletteColor }}>
          {formatCurrency(totalValue)}
        </Typography>
      </Box>

      {/* Cards */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(paletteColor, 0.2),
            borderRadius: 2,
          },
        }}
      >
        {sales.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 1 }}>
            <StageIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="caption" color="text.disabled" display="block">
              No sales in this stage
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {sales.map((sale) => (
              <SaleCard key={sale._id} sale={sale} onClick={onSaleClick} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const SalesPipelinePage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [pipelineData, setPipelineData] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    timePeriod: searchParams.get('timePeriod') || 'all',
    project: searchParams.get('project') || '',
    salesperson: searchParams.get('salesperson') || '',
  });

  const canViewPipeline = canAccess?.salesPipeline ? canAccess.salesPipeline() : true;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchPipelineData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const queryParams = {
        project: filters.project || undefined,
        salesperson: filters.salesperson || undefined,
        period: filters.timePeriod !== 'all' ? filters.timePeriod : undefined,
      };
      Object.keys(queryParams).forEach(k => queryParams[k] === undefined && delete queryParams[k]);

      const [pipelineResult, salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSalesPipeline(queryParams),
        salesAPI.getSales({ ...queryParams, limit: 1000, sortBy: 'bookingDate', sortOrder: 'desc' }),
        projectAPI.getProjects(),
        canAccess?.userManagement?.() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (pipelineResult.status === 'fulfilled') {
        setPipelineData(pipelineResult.value.data?.data || []);
      } else {
        setPipelineData([]);
      }

      if (salesResult.status === 'fulfilled') {
        const sales = salesResult.value.data?.data || [];
        const grouped = sales.reduce((acc, sale) => {
          const status = sale.status || 'Booked';
          if (!acc[status]) acc[status] = [];
          acc[status].push(sale);
          return acc;
        }, {});
        setSalesData(grouped);
      } else {
        setSalesData({});
      }

      if (projectsResult.status === 'fulfilled') {
        const d = projectsResult.value.data?.data || projectsResult.value.data || [];
        setProjects(Array.isArray(d) ? d : []);
      }

      if (usersResult.status === 'fulfilled') {
        const d = usersResult.value.data?.data || usersResult.value.data || [];
        setUsers(Array.isArray(d) ? d : []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load pipeline data. Please try again.');
      setLoading(false);
      setPipelineData([]);
      setSalesData({});
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters.project, filters.salesperson, filters.timePeriod, canAccess]);

  useEffect(() => { if (canViewPipeline) fetchPipelineData(); }, [fetchPipelineData, canViewPipeline]);

  // Sync non-search filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.timePeriod && filters.timePeriod !== 'all') params.set('timePeriod', filters.timePeriod);
    if (filters.project) params.set('project', filters.project);
    if (filters.salesperson) params.set('salesperson', filters.salesperson);
    setSearchParams(params, { replace: true });
  }, [filters.timePeriod, filters.project, filters.salesperson, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: '', timePeriod: 'all', project: '', salesperson: '' });
  const handleSaleClick = (sale) => navigate(`/sales/${sale._id}`);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const filteredSalesData = useMemo(() => {
    if (!filters.search) return salesData;
    const q = filters.search.toLowerCase();
    const filtered = {};
    Object.entries(salesData).forEach(([status, sales]) => {
      filtered[status] = sales.filter(sale =>
        getCustomerName(sale).toLowerCase().includes(q) ||
        getProjectName(sale).toLowerCase().includes(q) ||
        getUnitName(sale).toLowerCase().includes(q)
      );
    });
    return filtered;
  }, [salesData, filters.search]);

  const stages = useMemo(() =>
    PIPELINE_STAGES.map(stage => {
      const pipeline = pipelineData.find(p => p.status === stage.key) || {};
      const sales = filteredSalesData[stage.key] || [];
      return {
        ...stage,
        count: pipeline.count || sales.length,
        totalValue: pipeline.totalValue || sales.reduce((s, sale) => s + (sale.salePrice || 0), 0),
        sales,
      };
    }),
  [pipelineData, filteredSalesData]);

  // KPI metrics
  const totalSales = stages.reduce((s, st) => s + st.count, 0);
  const totalValue = stages.reduce((s, st) => s + st.totalValue, 0);
  const avgValue = totalSales > 0 ? totalValue / totalSales : 0;
  const completedCount = stages.find(s => s.key === 'Completed')?.count || 0;
  const completionRate = totalSales > 0 ? ((completedCount / totalSales) * 100).toFixed(1) : '0';

  // FilterBar config
  const salespeople = users.filter(u => u.role?.includes('Sales'));
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Sales', placeholder: 'Search sales...' },
    { key: 'timePeriod', type: 'select', label: 'Period', options: TIME_PERIODS },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
    ...(salespeople.length > 0 ? [{
      key: 'salesperson', type: 'select', label: 'Salesperson',
      options: salespeople.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
    }] : []),
  ];

  // ---------------------------------------------------------------------------
  // Permission guard
  // ---------------------------------------------------------------------------

  if (!canViewPipeline) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view the sales pipeline.</Alert>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Sales Pipeline"
        subtitle="Track sales progress across every stage"
        icon={TimelineIcon}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchPipelineData(true)} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/sales/create')}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              {!isMobile && 'New Sale'}
            </Button>
          </>
        }
      />

      {/* Refreshing indicator */}
      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Total Sales" value={totalSales} icon={Assessment} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Pipeline Value" value={formatCurrency(totalValue)} icon={MonetizationOn} color="success" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Average Value" value={formatCurrency(avgValue)} icon={TrendingUp} color="info" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Completion Rate" value={`${completionRate}%`} icon={CheckCircle} color="warning" loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Kanban Board */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: isMobile ? 400 : 500,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'action.hover',
            borderRadius: 3,
          },
        }}
      >
        {stages.map((stage) => (
          <Box
            key={stage.key}
            sx={{
              minWidth: { xs: 260, md: 0 },
              flex: { xs: '0 0 260px', md: 1 },
            }}
          >
            <PipelineColumn
              stage={stage}
              sales={stage.sales}
              totalValue={stage.totalValue}
              loading={loading}
              onSaleClick={handleSaleClick}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SalesPipelinePage;

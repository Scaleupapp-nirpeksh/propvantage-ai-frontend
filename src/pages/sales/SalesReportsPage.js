import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography, Button,
  IconButton, Avatar, Alert, Chip, Stack, Tabs, Tab, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Skeleton, ToggleButton, ToggleButtonGroup,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  Assessment, Refresh, FileDownload, Print, Person, Business,
  MonetizationOn, CheckCircle, TrendingUp, ShowChart, BarChart,
  Timeline as TimelineIcon, Visibility, CloudDownload,
  PictureAsPdf, TableView, Analytics,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart as RechartsPieChart,
  Pie, Cell, ComposedChart, LineChart, Line,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PageHeader, KPICard, FilterBar, StatusChip } from '../../components/common';
import { CHART_COLORS } from '../../constants/statusConfig';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: '90',  label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateDateRange = (period) => {
  if (!period || period === 'all') return { startDate: null, endDate: null };
  const days = parseInt(period, 10);
  if (isNaN(days)) return { startDate: null, endDate: null };
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  return { startDate, endDate };
};

const aggregateByPeriod = (data, periodDays) => {
  const grouped = {};
  data.forEach(item => {
    const date = new Date(item.bookingDate || item.createdAt);
    let key;
    if (periodDays <= 30) {
      key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else if (periodDays <= 180) {
      const ws = new Date(date);
      ws.setDate(date.getDate() - date.getDay());
      key = ws.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else {
      key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    if (!grouped[key]) grouped[key] = { period: key, sales: 0, revenue: 0 };
    grouped[key].sales += 1;
    grouped[key].revenue += item.salePrice || 0;
  });
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
};

const getCustomerName = (sale) => {
  const l = sale?.lead;
  if (!l) return 'Unknown';
  if (l.firstName && l.lastName) return `${l.firstName} ${l.lastName}`;
  return l.firstName || l.lastName || l.email || l.phone || 'Unknown';
};

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

const exportToCSV = (salesData) => {
  const headers = ['Customer', 'Project', 'Unit', 'Sale Price', 'Status', 'Booking Date', 'Salesperson'];
  const rows = salesData.map(s => [
    getCustomerName(s),
    s.project?.name || 'Unknown',
    s.unit?.unitNumber || s.unit?.fullAddress || 'Unknown',
    s.salePrice || 0,
    s.status || 'Unknown',
    s.bookingDate ? formatDate(s.bookingDate) : '',
    s.salesPerson ? `${s.salesPerson.firstName || ''} ${s.salesPerson.lastName || ''}`.trim() : 'Unassigned',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

const ChartTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1.5, minWidth: 160 }} elevation={3}>
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" sx={{ color: p.color }}>{p.name}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
          </Typography>
        </Box>
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

const OverviewTab = ({ salesData, period, loading }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const trendData = useMemo(() =>
    aggregateByPeriod(salesData, parseInt(period) || 365),
  [salesData, period]);

  const statusBreakdown = useMemo(() => {
    const counts = {};
    salesData.forEach(s => { counts[s.status || 'Unknown'] = (counts[s.status || 'Unknown'] || 0) + 1; });
    return Object.entries(counts).map(([name, value], i) => ({
      name, value, fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [salesData]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}><Skeleton variant="rounded" height={380} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={380} /></Grid>
      </Grid>
    );
  }

  const renderChart = () => {
    const common = {
      data: trendData,
      children: [
        <CartesianGrid key="g" strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />,
        <XAxis key="x" dataKey="period" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />,
        <YAxis key="y" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />,
        <RechartsTooltip key="t" content={<ChartTooltipContent />} />,
        <Legend key="l" />,
      ],
    };

    if (chartType === 'area') {
      return (
        <ComposedChart data={trendData}>
          {common.children}
          <Area type="monotone" dataKey="sales" name="Sales" fill={theme.palette.primary.main} fillOpacity={0.15} stroke={theme.palette.primary.main} strokeWidth={2} />
          <Bar dataKey="revenue" name="Revenue" fill={alpha(theme.palette.success.main, 0.7)} radius={[3, 3, 0, 0]} />
        </ComposedChart>
      );
    }
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={trendData}>
          {common.children}
          <Bar dataKey="sales" name="Sales" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
          <Bar dataKey="revenue" name="Revenue" fill={theme.palette.success.main} radius={[3, 3, 0, 0]} />
        </RechartsBarChart>
      );
    }
    return (
      <LineChart data={trendData}>
        {common.children}
        <Line type="monotone" dataKey="sales" name="Sales" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Trend chart */}
      <Grid item xs={12} md={8}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Sales Trend</Typography>}
            action={
              <ToggleButtonGroup value={chartType} exclusive onChange={(e, v) => v && setChartType(v)} size="small">
                <ToggleButton value="area"><Tooltip title="Area"><ShowChart sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
                <ToggleButton value="bar"><Tooltip title="Bar"><BarChart sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
                <ToggleButton value="line"><Tooltip title="Line"><TimelineIcon sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent sx={{ height: 320 }}>
            {trendData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No trend data for this period</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Status pie */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Status Breakdown</Typography>} />
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {statusBreakdown.map(s => (
                    <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.fill }} />
                        <Typography variant="caption">{s.name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Performance Tab
// ---------------------------------------------------------------------------

const PerformanceTab = ({ salesData, loading }) => {
  const theme = useTheme();
  const [view, setView] = useState('salesperson');

  const aggregate = useCallback((keyFn, nameFn) => {
    const map = {};
    salesData.forEach(sale => {
      const id = keyFn(sale);
      const name = nameFn(sale);
      if (!map[id]) map[id] = { id, name, sales: 0, revenue: 0 };
      map[id].sales += 1;
      map[id].revenue += sale.salePrice || 0;
    });
    return Object.values(map)
      .map(p => ({ ...p, avg: p.sales > 0 ? p.revenue / p.sales : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData]);

  const data = useMemo(() =>
    view === 'salesperson'
      ? aggregate(
          s => s.salesPerson?._id || 'unassigned',
          s => s.salesPerson ? `${s.salesPerson.firstName || ''} ${s.salesPerson.lastName || ''}`.trim() || 'Unassigned' : 'Unassigned',
        )
      : aggregate(
          s => s.project?._id || 'unknown',
          s => s.project?.name || 'Unknown Project',
        ),
  [view, aggregate]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Performance Comparison</Typography>}
            action={
              <ToggleButtonGroup value={view} exclusive onChange={(e, v) => v && setView(v)} size="small">
                <ToggleButton value="salesperson"><Person sx={{ fontSize: 18, mr: 0.5 }} /> People</ToggleButton>
                <ToggleButton value="project"><Business sx={{ fontSize: 18, mr: 0.5 }} /> Projects</ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent sx={{ height: 380 }}>
            {data.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No performance data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={data.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" name="Revenue" fill={view === 'salesperson' ? theme.palette.primary.main : theme.palette.success.main} radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Rankings</Typography>} />
          <CardContent sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>
            {data.slice(0, 10).map((p, i) => (
              <Box key={p.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: i < 3 ? 'primary.main' : 'grey.400' }}>{i + 1}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.sales} sale{p.sales !== 1 ? 's' : ''}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 5.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatCurrency(p.revenue)}</Typography>
                  <Typography variant="caption" color="text.secondary">Avg: {formatCurrency(p.avg)}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------

const DetailsTab = ({ salesData, loading, onSaleClick }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  const paginated = salesData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card variant="outlined">
      <CardHeader
        title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Detailed Sales Data</Typography>}
        subheader={`${salesData.length} records`}
      />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Sale Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Salesperson</TableCell>
              <TableCell align="center" width={48}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No sales data for this period</Typography>
                </TableCell>
              </TableRow>
            ) : paginated.map((sale) => (
              <TableRow key={sale._id} hover sx={{ cursor: 'pointer' }} onClick={() => onSaleClick(sale)}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{getCustomerName(sale)}</Typography>
                </TableCell>
                <TableCell>{sale.project?.name || 'Unknown'}</TableCell>
                <TableCell>{sale.unit?.unitNumber || sale.unit?.fullAddress || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(sale.salePrice || 0)}
                </TableCell>
                <TableCell><StatusChip status={sale.status} type="sale" size="small" /></TableCell>
                <TableCell>{sale.bookingDate ? formatDate(sale.bookingDate) : '-'}</TableCell>
                <TableCell>
                  {sale.salesPerson
                    ? `${sale.salesPerson.firstName || ''} ${sale.salesPerson.lastName || ''}`.trim()
                    : 'Unassigned'}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small"><Visibility sx={{ fontSize: 16 }} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={salesData.length}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const SalesReportsPage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exportAnchor, setExportAnchor] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    period: searchParams.get('period') || 'all',
    project: searchParams.get('project') || '',
    salesperson: searchParams.get('salesperson') || '',
  });

  const canViewReports = canAccess?.salesPipeline ? canAccess.salesPipeline() : true;

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const dateRange = generateDateRange(filters.period);
      const queryParams = {
        limit: 1000,
        project: filters.project || undefined,
        salesperson: filters.salesperson || undefined,
        dateFrom: dateRange.startDate?.toISOString() || undefined,
        dateTo: dateRange.endDate?.toISOString() || undefined,
        sortBy: 'bookingDate',
        sortOrder: 'desc',
      };
      Object.keys(queryParams).forEach(k => queryParams[k] === undefined && delete queryParams[k]);

      const [salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        projectAPI.getProjects(),
        canAccess?.userManagement?.() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (salesResult.status === 'fulfilled') {
        const resp = salesResult.value.data;
        setSalesData(resp.data || []);
        setApiStats(resp.stats || null);
      } else {
        setSalesData([]);
        setApiStats(null);
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
      setError('Failed to load reports data. Please try again.');
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters.period, filters.project, filters.salesperson, canAccess]);

  useEffect(() => { if (canViewReports) fetchData(); }, [fetchData, canViewReports]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.period && filters.period !== 'all') params.set('period', filters.period);
    if (filters.project) params.set('project', filters.project);
    if (filters.salesperson) params.set('salesperson', filters.salesperson);
    setSearchParams(params, { replace: true });
  }, [filters.period, filters.project, filters.salesperson, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: '', period: 'all', project: '', salesperson: '' });
  const handleSaleClick = (sale) => navigate(`/sales/${sale._id}`);

  // Search filter (client-side)
  const filteredSales = useMemo(() => {
    if (!filters.search) return salesData;
    const q = filters.search.toLowerCase();
    return salesData.filter(s =>
      getCustomerName(s).toLowerCase().includes(q) ||
      (s.project?.name || '').toLowerCase().includes(q) ||
      (s.unit?.unitNumber || '').toLowerCase().includes(q)
    );
  }, [salesData, filters.search]);

  // KPIs: use filtered data if available, fall back to API stats
  const totalSales = filteredSales.length || apiStats?.totalSales || 0;
  const totalRevenue = filteredSales.reduce((s, sale) => s + (sale.salePrice || 0), 0) || apiStats?.totalRevenue || 0;
  const avgValue = totalSales > 0 ? totalRevenue / totalSales : apiStats?.averageSaleValue || 0;
  const completedCount = filteredSales.filter(s => s.status === 'Completed').length;
  const completionRate = totalSales > 0 ? ((completedCount / totalSales) * 100).toFixed(1) : '0';

  // FilterBar config
  const salespeople = users.filter(u => u.role?.includes('Sales'));
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Sales', placeholder: 'Search sales...' },
    { key: 'period', type: 'select', label: 'Period', options: TIME_PERIODS },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
    ...(salespeople.length > 0 ? [{
      key: 'salesperson', type: 'select', label: 'Salesperson',
      options: salespeople.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` })),
    }] : []),
  ];

  // ---------------------------------------------------------------------------
  // Permission guard
  // ---------------------------------------------------------------------------

  if (!canViewReports) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view sales reports.</Alert>
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
        title="Sales Reports"
        subtitle="Analytics and performance insights"
        icon={Analytics}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchData(true)} disabled={refreshing}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudDownload />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              sx={{ borderRadius: 2 }}
            >
              {!isMobile && 'Export'}
            </Button>
          </>
        }
      />

      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Total Sales" value={totalSales} icon={Assessment} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={MonetizationOn} color="success" loading={loading} />
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

      {/* Report Tabs */}
      <Card variant="outlined" sx={{ mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Performance" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Details" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <OverviewTab salesData={filteredSales} period={filters.period} loading={loading} />
          )}
          {activeTab === 1 && (
            <PerformanceTab salesData={filteredSales} loading={loading} />
          )}
          {activeTab === 2 && (
            <DetailsTab salesData={filteredSales} loading={loading} onSaleClick={handleSaleClick} />
          )}
        </Box>
      </Card>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
        <MenuItem onClick={() => { exportToCSV(filteredSales); setExportAnchor(null); }}>
          <ListItemIcon><TableView fontSize="small" /></ListItemIcon>
          <ListItemText primary="Export CSV" secondary="Spreadsheet data" />
        </MenuItem>
        <MenuItem onClick={() => { window.print(); setExportAnchor(null); }}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print Report" secondary="Print-friendly view" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SalesReportsPage;

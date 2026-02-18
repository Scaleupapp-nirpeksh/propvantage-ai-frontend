import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  IconButton, Avatar, Alert, Stack, Tabs, Tab, Tooltip,
  LinearProgress, Skeleton, ToggleButton, ToggleButtonGroup,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  TrendingUp, Refresh, MonetizationOn, CheckCircle, Assessment,
  ShowChart, BarChart, Timeline as TimelineIcon, Business,
  Analytics, EmojiEvents,
} from '@mui/icons-material';
import {
  Area, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart as RechartsPieChart,
  Pie, Cell, ComposedChart, LineChart, Line,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, fmtCurrency } from '../../utils/formatters';
import { PageHeader, KPICard, FilterBar } from '../../components/common';
import { useProjectContext } from '../../context/ProjectContext';
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

const getMonthLabel = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const getWeekLabel = (dateStr) => {
  const d = new Date(dateStr);
  const ws = new Date(d);
  ws.setDate(d.getDate() - d.getDay());
  return ws.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getDayLabel = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getSalespersonName = (sale) => {
  const sp = sale?.salesPerson;
  if (!sp) return 'Unassigned';
  return `${sp.firstName || ''} ${sp.lastName || ''}`.trim() || 'Unassigned';
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
            {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('avg')
              ? formatCurrency(p.value)
              : p.value}
          </Typography>
        </Box>
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab — trend chart + status pie
// ---------------------------------------------------------------------------

const OverviewTab = ({ salesData, period, loading }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const trendData = useMemo(() => {
    const grouped = {};
    const periodDays = parseInt(period) || 999;
    salesData.forEach(item => {
      const dateStr = item.bookingDate || item.createdAt;
      let key;
      if (periodDays <= 30) key = getDayLabel(dateStr);
      else if (periodDays <= 180) key = getWeekLabel(dateStr);
      else key = getMonthLabel(dateStr);
      if (!grouped[key]) grouped[key] = { period: key, sales: 0, revenue: 0 };
      grouped[key].sales += 1;
      grouped[key].revenue += item.salePrice || 0;
    });
    return Object.values(grouped);
  }, [salesData, period]);

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
    const gridLine = <CartesianGrid key="g" strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />;
    const xAxis = <XAxis key="x" dataKey="period" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />;
    const yAxis = <YAxis key="y" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />;
    const tip = <RechartsTooltip key="t" content={<ChartTooltipContent />} />;
    const leg = <Legend key="l" />;
    const common = [gridLine, xAxis, yAxis, tip, leg];

    if (chartType === 'area') {
      return (
        <ComposedChart data={trendData}>
          {common}
          <Area type="monotone" dataKey="sales" name="Sales" fill={theme.palette.primary.main} fillOpacity={0.15} stroke={theme.palette.primary.main} strokeWidth={2} />
          <Bar dataKey="revenue" name="Revenue" fill={alpha(theme.palette.success.main, 0.7)} radius={[3, 3, 0, 0]} />
        </ComposedChart>
      );
    }
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={trendData}>
          {common}
          <Bar dataKey="sales" name="Sales" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
          <Bar dataKey="revenue" name="Revenue" fill={theme.palette.success.main} radius={[3, 3, 0, 0]} />
        </RechartsBarChart>
      );
    }
    return (
      <LineChart data={trendData}>
        {common}
        <Line type="monotone" dataKey="sales" name="Sales" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    );
  };

  return (
    <Grid container spacing={3}>
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
          <CardContent sx={{ height: 340 }}>
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
// Team Performance Tab
// ---------------------------------------------------------------------------

const TeamPerformanceTab = ({ salesData, loading }) => {
  const theme = useTheme();

  const performers = useMemo(() => {
    const map = {};
    salesData.forEach(sale => {
      const id = sale.salesPerson?._id || 'unassigned';
      const name = getSalespersonName(sale);
      if (!map[id]) map[id] = { id, name, sales: 0, revenue: 0, completed: 0 };
      map[id].sales += 1;
      map[id].revenue += sale.salePrice || 0;
      if (sale.status === 'Completed') map[id].completed += 1;
    });
    return Object.values(map)
      .map(p => ({ ...p, avg: p.sales > 0 ? p.revenue / p.sales : 0, rate: p.sales > 0 ? ((p.completed / p.sales) * 100) : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Bar chart */}
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue by Salesperson</Typography>} />
          <CardContent sx={{ height: 380 }}>
            {performers.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No performance data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={performers.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" name="Revenue" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Rankings */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Leaderboard</Typography>} />
          <CardContent sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>
            {performers.slice(0, 10).map((p, i) => (
              <Box key={p.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: i < 3 ? 'primary.main' : 'grey.400' }}>
                    {i < 3 ? <EmojiEvents sx={{ fontSize: 16 }} /> : i + 1}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.sales} sale{p.sales !== 1 ? 's' : ''} &middot; {p.rate.toFixed(0)}% completion</Typography>
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
// Project Breakdown Tab
// ---------------------------------------------------------------------------

const ProjectBreakdownTab = ({ salesData, loading }) => {
  const theme = useTheme();

  const projectData = useMemo(() => {
    const map = {};
    salesData.forEach(sale => {
      const id = sale.project?._id || 'unknown';
      const name = sale.project?.name || 'Unknown Project';
      if (!map[id]) map[id] = { id, name, sales: 0, revenue: 0, completed: 0 };
      map[id].sales += 1;
      map[id].revenue += sale.salePrice || 0;
      if (sale.status === 'Completed') map[id].completed += 1;
    });
    return Object.values(map)
      .map(p => ({ ...p, avg: p.sales > 0 ? p.revenue / p.sales : 0, fill: CHART_COLORS[Object.keys(map).indexOf(p.id) % CHART_COLORS.length] }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Bar chart */}
      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue by Project</Typography>} />
          <CardContent sx={{ height: 380 }}>
            {projectData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No project data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={projectData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                    {projectData.slice(0, 10).map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Pie chart */}
      <Grid item xs={12} md={5}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue Share</Typography>} />
          <CardContent>
            {projectData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie data={projectData} cx="50%" cy="50%" outerRadius={80} dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {projectData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {projectData.map(p => (
                    <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: p.fill }} />
                        <Typography variant="caption">{p.name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(p.revenue)}</Typography>
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
// Main Page
// ---------------------------------------------------------------------------

const SalesAnalytics = () => {
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProjectContext();

  const [activeTab, setActiveTab] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    period: searchParams.get('period') || 'all',
    project: searchParams.get('project') || activeProjectId || '',
    salesperson: searchParams.get('salesperson') || '',
  });

  const canView = canAccess?.salesReports ? canAccess.salesReports() : true;

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
        const raw = usersResult.value.data?.data;
        const d = raw?.users || raw || [];
        setUsers(Array.isArray(d) ? d : []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters.period, filters.project, filters.salesperson, canAccess]);

  useEffect(() => { if (canView) fetchData(); }, [fetchData, canView]);

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

  // Search filter (client-side)
  const filteredSales = useMemo(() => {
    if (!filters.search) return salesData;
    const q = filters.search.toLowerCase();
    return salesData.filter(s =>
      getSalespersonName(s).toLowerCase().includes(q) ||
      (s.project?.name || '').toLowerCase().includes(q) ||
      (s.unit?.unitNumber || '').toLowerCase().includes(q) ||
      (s.lead?.firstName || '').toLowerCase().includes(q) ||
      (s.lead?.lastName || '').toLowerCase().includes(q)
    );
  }, [salesData, filters.search]);

  // KPIs
  const totalSales = filteredSales.length || apiStats?.totalSales || 0;
  const totalRevenue = filteredSales.reduce((s, sale) => s + (sale.salePrice || 0), 0) || apiStats?.totalRevenue || 0;
  const avgValue = totalSales > 0 ? totalRevenue / totalSales : apiStats?.averageSaleValue || 0;
  const completedCount = filteredSales.filter(s => s.status === 'Completed').length;
  const completionRate = totalSales > 0 ? ((completedCount / totalSales) * 100).toFixed(1) : '0';

  // Top project
  const topProject = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const name = s.project?.name || 'Unknown';
      map[name] = (map[name] || 0) + (s.salePrice || 0);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : '-';
  }, [filteredSales]);

  // Top salesperson
  const topSalesperson = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const name = getSalespersonName(s);
      map[name] = (map[name] || 0) + (s.salePrice || 0);
    });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : '-';
  }, [filteredSales]);

  // FilterBar config
  const salespeople = users.filter(u => u.role?.includes('Sales'));
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Search', placeholder: 'Search sales...' },
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

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view sales analytics.</Alert>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      <PageHeader
        title="Sales Analytics"
        subtitle="Performance insights and trends"
        icon={Analytics}
        actions={
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchData(true)} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />

      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Total Sales" value={totalSales} icon={Assessment} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Revenue" value={fmtCurrency(totalRevenue)} icon={MonetizationOn} color="success" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Avg Deal" value={fmtCurrency(avgValue)} icon={TrendingUp} color="info" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Completion" value={`${completionRate}%`} icon={CheckCircle} color="warning" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Top Project" value={topProject} icon={Business} color="secondary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Top Seller" value={topSalesperson} icon={EmojiEvents} color="primary" loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Analytics Tabs */}
      <Card variant="outlined" sx={{ mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Team Performance" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Projects" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <OverviewTab salesData={filteredSales} period={filters.period} loading={loading} />
          )}
          {activeTab === 1 && (
            <TeamPerformanceTab salesData={filteredSales} loading={loading} />
          )}
          {activeTab === 2 && (
            <ProjectBreakdownTab salesData={filteredSales} loading={loading} />
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default SalesAnalytics;

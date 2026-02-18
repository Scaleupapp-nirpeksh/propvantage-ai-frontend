import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  IconButton, Alert, Stack, Tabs, Tab, Tooltip, LinearProgress,
  Skeleton, ToggleButton, ToggleButtonGroup, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  TrendingUp, Refresh, MonetizationOn, CheckCircle, Assessment,
  ShowChart, BarChart, Timeline as TimelineIcon, Business,
  AccountBalance, Speed,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart as RechartsPieChart,
  Pie, Cell, LineChart, Line,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI } from '../../services/api';
import { formatCurrency, fmtCurrency } from '../../utils/formatters';
import { useProjectContext } from '../../context/ProjectContext';
import { PageHeader, KPICard, FilterBar } from '../../components/common';
import { CHART_COLORS } from '../../constants/statusConfig';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
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
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(p.value)}</Typography>
        </Box>
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab — revenue trend + status pie
// ---------------------------------------------------------------------------

const OverviewTab = ({ salesData, loading }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const trendData = useMemo(() => {
    const grouped = {};
    salesData.forEach(item => {
      const key = getMonthLabel(item.bookingDate || item.createdAt);
      if (!grouped[key]) grouped[key] = { period: key, revenue: 0, sales: 0 };
      grouped[key].revenue += item.salePrice || 0;
      grouped[key].sales += 1;
    });
    return Object.values(grouped);
  }, [salesData]);

  const statusBreakdown = useMemo(() => {
    const map = {};
    salesData.forEach(s => {
      const status = s.status || 'Unknown';
      if (!map[status]) map[status] = { name: status, value: 0, revenue: 0 };
      map[status].value += 1;
      map[status].revenue += s.salePrice || 0;
    });
    return Object.values(map).map((item, i) => ({
      ...item, fill: CHART_COLORS[i % CHART_COLORS.length],
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
        <AreaChart data={trendData}>
          {common}
          <Area type="monotone" dataKey="revenue" name="Revenue" fill={theme.palette.success.main} fillOpacity={0.15} stroke={theme.palette.success.main} strokeWidth={2} />
        </AreaChart>
      );
    }
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={trendData}>
          {common}
          <Bar dataKey="revenue" name="Revenue" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      );
    }
    return (
      <LineChart data={trendData}>
        {common}
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue Trend</Typography>}
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
                <Typography color="text.secondary">No revenue data for this period</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue by Status</Typography>} />
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
                      <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {statusBreakdown.map(s => (
                    <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.fill }} />
                        <Typography variant="caption">{s.name} ({s.value})</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(s.revenue)}</Typography>
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
// Project Performance Tab — target vs actual + table
// ---------------------------------------------------------------------------

const ProjectPerformanceTab = ({ salesData, projects, loading }) => {
  const theme = useTheme();

  const projectPerf = useMemo(() => {
    // Aggregate actual revenue per project from sales data
    const actualMap = {};
    salesData.forEach(sale => {
      const id = sale.project?._id || 'unknown';
      if (!actualMap[id]) actualMap[id] = { revenue: 0, sales: 0 };
      actualMap[id].revenue += sale.salePrice || 0;
      actualMap[id].sales += 1;
    });

    return projects.map((p, i) => {
      const actual = actualMap[p._id] || { revenue: 0, sales: 0 };
      const target = p.targetRevenue || 0;
      const achievement = target > 0 ? ((actual.revenue / target) * 100) : 0;
      return {
        id: p._id,
        name: p.name,
        type: p.type,
        city: p.location?.city || '-',
        totalUnits: p.totalUnits || 0,
        target,
        actual: actual.revenue,
        sales: actual.sales,
        achievement,
        variance: actual.revenue - target,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [salesData, projects]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Target vs Actual bar chart */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Target vs Actual Revenue</Typography>} />
          <CardContent sx={{ height: 360 }}>
            {projectPerf.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No project data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={projectPerf} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="target" name="Target" fill={alpha(theme.palette.grey[500], 0.3)} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Project table */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Project Revenue Details</Typography>} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">Target Revenue</TableCell>
                  <TableCell align="right">Actual Revenue</TableCell>
                  <TableCell align="right">Achievement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projectPerf.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No projects found</Typography>
                    </TableCell>
                  </TableRow>
                ) : projectPerf.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                    </TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>
                      <Chip label={p.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell align="right">{p.totalUnits}</TableCell>
                    <TableCell align="right">{p.sales}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(p.target)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{formatCurrency(p.actual)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Box sx={{ width: 60, mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(p.achievement, 100)}
                            color={p.achievement >= 100 ? 'success' : p.achievement >= 50 ? 'warning' : 'error'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                          {p.achievement.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Inventory Tab — units breakdown per project
// ---------------------------------------------------------------------------

const InventoryTab = ({ salesData, projects, loading }) => {
  const theme = useTheme();

  const inventoryData = useMemo(() => {
    // Count sold units per project from sales data
    const soldMap = {};
    salesData.forEach(sale => {
      const id = sale.project?._id || 'unknown';
      soldMap[id] = (soldMap[id] || 0) + 1;
    });

    return projects.map((p, i) => {
      const sold = soldMap[p._id] || 0;
      const total = p.totalUnits || 0;
      const available = Math.max(total - sold, 0);
      return {
        id: p._id,
        name: p.name,
        total,
        sold,
        available,
        soldPct: total > 0 ? ((sold / total) * 100) : 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  }, [salesData, projects]);

  const totals = useMemo(() => {
    return inventoryData.reduce((acc, p) => ({
      total: acc.total + p.total,
      sold: acc.sold + p.sold,
      available: acc.available + p.available,
    }), { total: 0, sold: 0, available: 0 });
  }, [inventoryData]);

  const pieData = useMemo(() => [
    { name: 'Sold', value: totals.sold, fill: theme.palette.success.main },
    { name: 'Available', value: totals.available, fill: theme.palette.primary.main },
  ], [totals, theme]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Pie chart */}
      <Grid item xs={12} md={5}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Overall Inventory</Typography>} />
          <CardContent>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Box>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Units</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{totals.total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'success.main' }}>Sold</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{totals.sold}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'primary.main' }}>Available</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{totals.available}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Sell-through Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {totals.total > 0 ? ((totals.sold / totals.total) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Per-project inventory bars */}
      <Grid item xs={12} md={7}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Units by Project</Typography>} />
          <CardContent sx={{ height: 360 }}>
            {inventoryData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={inventoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="sold" name="Sold" stackId="a" fill={theme.palette.success.main} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" name="Available" stackId="a" fill={alpha(theme.palette.primary.main, 0.4)} radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
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

const RevenueAnalytics = () => {
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProjectContext();

  const [activeTab, setActiveTab] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    period: searchParams.get('period') || 'all',
    project: searchParams.get('project') || activeProjectId || '',
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
        dateFrom: dateRange.startDate?.toISOString() || undefined,
        dateTo: dateRange.endDate?.toISOString() || undefined,
        sortBy: 'bookingDate',
        sortOrder: 'desc',
      };
      Object.keys(queryParams).forEach(k => queryParams[k] === undefined && delete queryParams[k]);

      const [salesResult, projectsResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        projectAPI.getProjects(),
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

      setLoading(false);
    } catch (err) {
      setError('Failed to load revenue data. Please try again.');
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters.period, filters.project]);

  useEffect(() => { if (canView) fetchData(); }, [fetchData, canView]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.period && filters.period !== 'all') params.set('period', filters.period);
    if (filters.project) params.set('project', filters.project);
    setSearchParams(params, { replace: true });
  }, [filters.period, filters.project, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: '', period: 'all', project: '' });

  // Search filter (client-side)
  const filteredSales = useMemo(() => {
    if (!filters.search) return salesData;
    const q = filters.search.toLowerCase();
    return salesData.filter(s =>
      (s.project?.name || '').toLowerCase().includes(q) ||
      (s.unit?.unitNumber || '').toLowerCase().includes(q) ||
      (s.lead?.firstName || '').toLowerCase().includes(q) ||
      (s.lead?.lastName || '').toLowerCase().includes(q)
    );
  }, [salesData, filters.search]);

  // KPIs
  const totalRevenue = filteredSales.reduce((s, sale) => s + (sale.salePrice || 0), 0) || apiStats?.totalRevenue || 0;
  const totalSales = filteredSales.length || apiStats?.totalSales || 0;
  const targetRevenue = projects.reduce((s, p) => s + (p.targetRevenue || 0), 0);
  const avgDeal = totalSales > 0 ? totalRevenue / totalSales : 0;
  const achievementPct = targetRevenue > 0 ? ((totalRevenue / targetRevenue) * 100).toFixed(2) : '0';
  const totalUnits = projects.reduce((s, p) => s + (p.totalUnits || 0), 0);

  // FilterBar config
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Search', placeholder: 'Search...' },
    { key: 'period', type: 'select', label: 'Period', options: TIME_PERIODS },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
  ];

  // ---------------------------------------------------------------------------
  // Permission guard
  // ---------------------------------------------------------------------------

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view revenue analytics.</Alert>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      <PageHeader
        title="Revenue Analytics"
        subtitle="Revenue performance, targets and inventory"
        icon={AccountBalance}
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
          <KPICard title="Revenue" value={fmtCurrency(totalRevenue)} icon={MonetizationOn} color="success" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Target" value={fmtCurrency(targetRevenue)} icon={Assessment} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Achievement" value={`${achievementPct}%`} icon={CheckCircle} color="warning" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Avg Deal" value={fmtCurrency(avgDeal)} icon={TrendingUp} color="info" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Sales" value={totalSales} icon={Speed} color="secondary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Total Units" value={totalUnits} icon={Business} color="primary" loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Tabs */}
      <Card variant="outlined" sx={{ mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Projects" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Inventory" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <OverviewTab salesData={filteredSales} loading={loading} />
          )}
          {activeTab === 1 && (
            <ProjectPerformanceTab salesData={filteredSales} projects={projects} loading={loading} />
          )}
          {activeTab === 2 && (
            <InventoryTab salesData={filteredSales} projects={projects} loading={loading} />
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default RevenueAnalytics;

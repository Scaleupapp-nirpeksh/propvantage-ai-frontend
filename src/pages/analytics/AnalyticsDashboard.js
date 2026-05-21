// File: src/pages/analytics/AnalyticsDashboard.js
// Description: Analytics Dashboard — fully responsive, mobile-first
// Version: 2.0 - Responsive redesign, single API fetch, mobile-friendly
// Location: src/pages/analytics/AnalyticsDashboard.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Skeleton,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  AttachMoney,
  People,
  Assignment,
  MonetizationOn,
  FilterList,
  Timeline,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { analyticsAPI, projectAPI } from '../../services/api';
import { useProjectContext } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────
const TIME_PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const CHART_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1'];

// Convert the dashboard's named period into an ISO date range for CP analytics.
const periodToRange = (period) => {
  const now = new Date();
  let start;
  if (period === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === 'quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else start = new Date(now.getFullYear(), 0, 1); // 'year'
  return { dateFrom: start.toISOString(), dateTo: now.toISOString() };
};

// ─── Utility ─────────────────────────────────────────────────────────────────
const fmtCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPICard = ({ title, value, prevValue, unit, icon: Icon, color, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const trend = useMemo(() => {
    if (!prevValue || prevValue === 0 || loading) return null;
    const pct = ((value - prevValue) / prevValue) * 100;
    return { dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat', pct: Math.abs(pct) };
  }, [value, prevValue, loading]);

  const display = () => {
    if (loading) return <Skeleton width={70} height={32} />;
    const v = value || 0;
    if (unit === 'currency') return fmtCurrency(v);
    if (unit === '%') return `${v.toFixed(1)}%`;
    return v.toLocaleString('en-IN');
  };

  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : TrendingFlat;
  const trendColor = trend?.dir === 'up' ? 'success.main' : trend?.dir === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.100`,
              color: `${color}.700`,
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
            }}
          >
            <Icon sx={{ fontSize: isMobile ? 18 : 22 }} />
          </Avatar>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
              <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600, fontSize: '0.65rem' }}>
                {trend.pct.toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
          {display()}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

// ─── Chart Wrapper ───────────────────────────────────────────────────────────
const ChartCard = ({ title, loading, children, minHeight = 260, action }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const h = isMobile ? Math.min(minHeight, 220) : minHeight;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {action}
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: h }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ width: '100%', minHeight: h }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeProjectId } = useProjectContext();
  const { canAccess } = useAuth();

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('year');
  const [projectFilter, setProjectFilter] = useState(() => activeProjectId || 'all');
  const [projects, setProjects] = useState([]);
  const [data, setData] = useState({
    overview: {},
    salesTrend: [],
    funnel: [],
    revenueByProject: [],
    teamPerformance: [],
  });
  const [recentSales, setRecentSales] = useState([]);
  const [cpVolume, setCpVolume] = useState(null);
  const [cpCommission, setCpCommission] = useState(null);

  // Stable boolean derived from canAccess to avoid re-running the CP effect
  // on every AuthContext render (canAccess is a plain object rebuilt each time).
  const canViewCommission = canAccess?.channelPartners?.() || false;

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { period };
      if (projectFilter !== 'all') params.project = projectFilter;

      // Single API call for dashboard summary + optional sales report
      const [summaryRes, salesRes, projRes] = await Promise.allSettled([
        analyticsAPI.getDashboardSummary(params),
        analyticsAPI.getSalesReport({ ...params, limit: 5 }),
        projectAPI.getProjects(),
      ]);

      // Process dashboard summary
      if (summaryRes.status === 'fulfilled') {
        const d = summaryRes.value.data || {};
        const overview = d.overview || {};
        const charts = d.charts || {};

        const salesTrend = (charts.monthlySalesTrend || []).map((item) => ({
          date: `${item._id?.year || ''}-${String(item._id?.month || 1).padStart(2, '0')}`,
          revenue: Number(item.revenue) || 0,
          count: Number(item.salesCount) || 0,
        }));

        const funnel = (charts.conversionFunnel || []).map((item) => ({
          stage: item._id || 'Unknown',
          count: Number(item.count) || 0,
        }));

        const revenueByProject = (charts.salesByProject || []).map((item) => ({
          name: item.projectName || 'Unknown',
          revenue: Number(item.totalRevenue) || 0,
          sales: Number(item.totalSales) || 0,
          avgPrice: Number(item.averagePrice) || 0,
        }));

        const teamPerformance = (charts.teamPerformance || []).map((m) => ({
          name: m.salesPersonName || 'Unknown',
          revenue: Number(m.totalRevenue) || 0,
          sales: Number(m.totalSales) || 0,
        }));

        setData({ overview, salesTrend, funnel, revenueByProject, teamPerformance });
      }

      // Recent sales
      if (salesRes.status === 'fulfilled') {
        const sales = salesRes.value.data?.sales || [];
        setRecentSales(
          sales.slice(0, 5).map((s) => ({
            id: s._id,
            unit: s.unitNumber || 'N/A',
            customer: s.customerName || 'N/A',
            salesperson: s.salesPersonName || 'N/A',
            date: s.bookingDate ? new Date(s.bookingDate).toLocaleDateString('en-IN') : 'N/A',
            amount: Number(s.salePrice) || 0,
          }))
        );
      }

      // Projects for filter
      if (projRes.status === 'fulfilled') {
        const p = projRes.value.data?.data || projRes.value.data || [];
        setProjects(Array.isArray(p) ? p : []);
      }
    } catch (err) {
      console.error('Analytics dashboard error:', err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [period, projectFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    const range = periodToRange(period);
    const params = { ...range };
    if (projectFilter !== 'all') params.project = projectFilter;

    analyticsAPI.getChannelPartnerVolume(params)
      .then((res) => { if (!cancelled) setCpVolume(res.data?.data || null); })
      .catch(() => { if (!cancelled) setCpVolume(null); });

    if (canViewCommission) {
      analyticsAPI.getChannelPartnerCommission(params)
        .then((res) => { if (!cancelled) setCpCommission(res.data?.data || null); })
        .catch(() => { if (!cancelled) setCpCommission(null); });
    } else {
      setCpCommission(null);
    }

    return () => { cancelled = true; };
  }, [period, projectFilter, canViewCommission]);

  // ── Derived KPIs ──
  const kpis = useMemo(() => {
    const o = data.overview;
    const trend0 = data.salesTrend[0];
    return {
      totalRevenue: Number(o.totalRevenue) || 0,
      prevRevenue: Number(trend0?.revenue) || 0,
      totalSales: Number(o.totalSales) || 0,
      prevSales: Number(trend0?.count) || 0,
      totalLeads: Number(o.totalLeads) || 0,
      conversionRate: Number(o.conversionRate) || 0,
      avgDealSize: Number(o.averageSalePrice) || 0,
      pipeline: (Number(o.totalLeads) || 0) * (Number(o.averageSalePrice) || 0) * 0.1,
    };
  }, [data]);

  // ── Render ──
  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700}>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time insights across projects, sales, and leads
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} disabled={loading} size={isMobile ? 'small' : 'medium'}>
            <Refresh
              sx={{
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Filters — compact inline row ───────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: { xs: 2, sm: 3 },
          alignItems: 'center',
        }}
      >
        <FilterList sx={{ color: 'text.secondary', fontSize: 20 }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
            {TIME_PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Project</InputLabel>
          <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} label="Project">
            <MenuItem value="all">All Projects</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {[
          { title: 'Total Revenue', value: kpis.totalRevenue, prev: kpis.prevRevenue, unit: 'currency', icon: MonetizationOn, color: 'success' },
          { title: 'Total Sales', value: kpis.totalSales, prev: kpis.prevSales, unit: 'number', icon: Assignment, color: 'primary' },
          { title: 'Total Leads', value: kpis.totalLeads, prev: null, unit: 'number', icon: People, color: 'info' },
          { title: 'Conversion Rate', value: kpis.conversionRate, prev: null, unit: '%', icon: TrendingUp, color: 'warning' },
          { title: 'Avg Deal Size', value: kpis.avgDealSize, prev: null, unit: 'currency', icon: AttachMoney, color: 'secondary' },
          { title: 'Pipeline Value', value: kpis.pipeline, prev: null, unit: 'currency', icon: Timeline, color: 'info' },
        ].map((kpi) => (
          <Grid item xs={6} sm={4} md={2} key={kpi.title}>
            <KPICard {...kpi} prevValue={kpi.prev} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Sales Trend + Lead Funnel ──────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} md={8}>
          <ChartCard title="Sales Trend" loading={loading} minHeight={280}>
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <AreaChart data={data.salesTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: isMobile ? 10 : 12 }} width={55} />
                <RechartsTooltip formatter={(v) => [fmtCurrency(v), 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  fill="url(#gradRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <ChartCard title="Lead Funnel" loading={loading} minHeight={280}>
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <BarChart
                data={data.funnel}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={isMobile ? 70 : 90}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <RechartsTooltip formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" fill={theme.palette.info.main} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Revenue by Project (pie) + Top Projects + Recent Sales ──── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Revenue Pie */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Revenue by Project" loading={loading} minHeight={280}>
            {data.revenueByProject.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  No data for selected filters
                </Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <PieChart>
                    <Pie
                      data={data.revenueByProject}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 35 : 45}
                      outerRadius={isMobile ? 65 : 80}
                      paddingAngle={2}
                      dataKey="revenue"
                    >
                      {data.revenueByProject.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => [fmtCurrency(v), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, justifyContent: 'center' }}>
                  {data.revenueByProject.map((p, i) => (
                    <Chip
                      key={p.name}
                      size="small"
                      label={p.name}
                      sx={{ bgcolor: CHART_COLORS[i % CHART_COLORS.length], color: 'white', fontWeight: 600, fontSize: '0.65rem' }}
                    />
                  ))}
                </Box>
              </>
            )}
          </ChartCard>
        </Grid>

        {/* Top Projects */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Top Projects
              </Typography>
              {loading ? (
                <Stack spacing={1}>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} height={52} />
                  ))}
                </Stack>
              ) : data.revenueByProject.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No project data available.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {data.revenueByProject.slice(0, 5).map((project, idx) => (
                    <Box
                      key={project.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: idx === 0 ? 'primary.50' : 'transparent',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          bgcolor: idx === 0 ? 'primary.main' : 'grey.300',
                          color: idx === 0 ? 'white' : 'text.primary',
                        }}
                      >
                        {idx + 1}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.sales} sales
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} color="success.main" noWrap>
                        {fmtCurrency(project.revenue)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Recent Sales
              </Typography>
              {loading ? (
                <Stack spacing={1}>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} height={52} />
                  ))}
                </Stack>
              ) : recentSales.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent sales.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {recentSales.map((sale) => (
                    <Box
                      key={sale.id}
                      sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {sale.unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {sale.customer} &middot; {sale.salesperson}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {fmtCurrency(sale.amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sale.date}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Team Performance ───────────────────────────────────────────── */}
      {data.teamPerformance.length > 0 && (
        <ChartCard title="Team Performance" loading={loading} minHeight={260}>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
            <BarChart
              data={data.teamPerformance}
              margin={{ top: 5, right: 5, left: 0, bottom: isMobile ? 60 : 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: isMobile ? 9 : 12 }}
              />
              <YAxis tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: isMobile ? 10 : 12 }} width={55} />
              <RechartsTooltip formatter={(v) => [fmtCurrency(v), 'Revenue']} />
              <Bar dataKey="revenue" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ─── Channel Partner Contribution ─────────────────────────────────────── */}
      {cpVolume && cpVolume.sales && cpVolume.sales.channelPartner?.count > 0 && (
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
          <Grid item xs={12} md={cpCommission ? 4 : 12}>
            <ChartCard title="Channel Partner Contribution" loading={false} minHeight={160}>
              <Box sx={{ p: 1 }}>
                <Typography variant="body2" color="text.secondary">Share of revenue via channel partners</Typography>
                <Typography variant="h4">{cpVolume.sales.cpSharePct || 0}%</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Share of leads via channel partners
                </Typography>
                <Typography variant="h5">{cpVolume.leads?.cpSharePct || 0}%</Typography>
              </Box>
            </ChartCard>
          </Grid>

          {cpCommission && (
            <>
              <Grid item xs={12} md={4}>
                <ChartCard title="Commission & Payouts" loading={false} minHeight={300}>
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" color="text.secondary">Net commission accrued</Typography>
                    <Typography variant="h5">{fmtCurrency(cpCommission.summary?.netAccrued || 0)}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Paid: {fmtCurrency(cpCommission.summary?.paid || 0)} &nbsp;•&nbsp;
                      Pending: {fmtCurrency(cpCommission.summary?.pending || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Effective commission rate
                    </Typography>
                    <Typography variant="h6">{cpCommission.effectiveCommissionRate || 0}%</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Payment status (₹ net)
                    </Typography>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        data={(cpCommission.paymentStatus || []).map((p) => ({
                          name: { accrued: 'Accrued', partially_paid: 'Partially Paid', paid: 'Paid' }[p.status] || p.status,
                          amount: p.netAmount || 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: 10 }} width={55} />
                        <RechartsTooltip formatter={(v) => fmtCurrency(v)} />
                        <Bar dataKey="amount" fill="#1976d2" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartCard title="Top Channel Partners" loading={false} minHeight={160}>
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell>Firm</TableCell>
                      <TableCell align="right">Booked</TableCell>
                      <TableCell align="right">Commission</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {(cpCommission.topPerformers || []).slice(0, 5).map((partner) => (
                        <TableRow key={partner.channelPartnerId}>
                          <TableCell>{partner.firmName}</TableCell>
                          <TableCell align="right">{fmtCurrency(partner.bookedRevenue)}</TableCell>
                          <TableCell align="right">{fmtCurrency(partner.netCommission)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ChartCard>
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;

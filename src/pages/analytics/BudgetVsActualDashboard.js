// src/pages/analytics/BudgetVsActualDashboard.js
// Budget vs Actual — comprehensive budget tracking and variance analysis

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Chip,
  IconButton, Tooltip, LinearProgress,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, People, ShowChart, Assessment,
  Refresh, Flag, Insights as InsightsIcon, Warning,
  CheckCircle, Error as ErrorIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { PageHeader, KPICard, FilterBar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PERIODS = [
  { value: 'current_month', label: 'This Month' },
  { value: 'current_quarter', label: 'This Quarter' },
  { value: 'current_year', label: 'This Year' },
  { value: 'ytd', label: 'Year to Date' },
];

const KPI_ICONS = {
  'Revenue Achievement': AccountBalance,
  'Sales Conversion': ShowChart,
  'Lead Quality': People,
  'Marketing ROI': TrendingUp,
};

const STATUS_COLOR = { behind: 'error', ahead: 'success', on_track: 'info' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BudgetVsActualDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canAccess } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('current_month');

  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);

  const canView = canAccess?.viewFinancials ? canAccess.viewFinancials() : true;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params = { period };
      const [dashRes, reportRes] = await Promise.allSettled([
        budgetVsActualAPI.getBudgetDashboard(params),
        budgetVsActualAPI.getBudgetVsActual({ ...params, include: 'variance,analysis' }),
      ]);
      setDashboard(dashRes.status === 'fulfilled' ? dashRes.value.data?.data : null);
      setReport(reportRes.status === 'fulfilled' ? reportRes.value.data?.data : null);
    } catch {
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { if (canView) fetchData(); }, [fetchData, canView]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    if (!dashboard?.kpis) return [];
    return dashboard.kpis.map(k => ({
      title: k.name,
      value: `${(k.value ?? 0).toFixed(1)}${k.unit}`,
      icon: KPI_ICONS[k.name] || Assessment,
      color: theme.palette[STATUS_COLOR[k.status] || 'warning'].main,
      subtitle: `Target: ${k.target}${k.unit}`,
    }));
  }, [dashboard, theme]);

  const revenue = report?.revenue || {};
  const sales = report?.sales || {};
  const projects = report?.projects || [];
  const alerts = dashboard?.alerts || [];
  const insights = dashboard?.topInsights || [];
  const actions = dashboard?.quickActions || [];

  const projectChartData = useMemo(() =>
    projects.map(p => ({
      name: p.name?.length > 16 ? p.name.slice(0, 16) + '\u2026' : p.name,
      fullName: p.name,
      target: p.targetRevenue || 0,
      actual: p.actualRevenue || 0,
      achievement: p.revenueAchievement || 0,
    })),
  [projects]);

  const inventory = useMemo(() => {
    if (!sales.actual?.inventoryStatus) return [];
    return sales.actual.inventoryStatus.map(s => ({
      status: s._id,
      count: s.count,
      color: s._id === 'available' ? theme.palette.success.main
        : s._id === 'sold' ? theme.palette.primary.main
        : s._id === 'booked' ? theme.palette.info.main
        : theme.palette.warning.main,
    }));
  }, [sales, theme]);

  const totalUnits = inventory.reduce((s, i) => s + i.count, 0);

  // ---------------------------------------------------------------------------
  // Chart tooltip
  // ---------------------------------------------------------------------------

  const ChartTooltipContent = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', minWidth: 180 }}>
        <Typography variant="subtitle2" gutterBottom>{d.fullName}</Typography>
        <Typography variant="body2" color="text.secondary">Target: {formatCurrency(d.target)}</Typography>
        <Typography variant="body2" color="text.secondary">Actual: {formatCurrency(d.actual)}</Typography>
        <Typography variant="body2" fontWeight={600}>
          Achievement: {d.achievement.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!canView) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        You don&apos;t have permission to view financial data.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Budget vs Actual"
        subtitle="Comprehensive budget tracking and variance analysis"
        icon={Assessment}
        actions={
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
              }} />
            </IconButton>
          </Tooltip>
        }
      />

      {/* Critical alerts at top */}
      {!loading && alerts.filter(a => a.type === 'critical').map((a, i) => (
        <Alert key={i} severity="error" sx={{ mb: 2 }}>
          <strong>{a.category?.toUpperCase()}:</strong> {a.message}
        </Alert>
      ))}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Period Filter */}
      <FilterBar
        filters={[
          { key: 'period', label: 'Period', type: 'select', options: PERIODS },
        ]}
        values={{ period }}
        onChange={(k, v) => setPeriod(v)}
        onClear={() => setPeriod('current_month')}
      />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((k, i) => (
          <Grid item xs={6} md={3} key={i}>
            <KPICard {...k} loading={loading} />
          </Grid>
        ))}
        {loading && kpis.length === 0 && [0, 1, 2, 3].map(i => (
          <Grid item xs={6} md={3} key={`sk-${i}`}>
            <KPICard title="" value="" loading />
          </Grid>
        ))}
      </Grid>

      {!loading && (
        <>
          {/* Revenue + Inventory Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Revenue Overview */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Revenue Overview
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Target</Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(revenue.target?.totalRevenue || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {revenue.target?.projectCount || 0} projects
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Actual</Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={(revenue.actual?.totalRevenue || 0) > 0 ? 'success.main' : 'text.secondary'}
                      >
                        {formatCurrency(revenue.actual?.totalRevenue || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {revenue.actual?.salesCount || 0} sales
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Variance</Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={(revenue.variance?.percentage || 0) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {(revenue.variance?.percentage || 0) >= 0 ? '+' : ''}
                        {(revenue.variance?.percentage || 0).toFixed(1)}%
                      </Typography>
                      <Chip
                        size="small"
                        label={revenue.variance?.status || 'behind'}
                        color={revenue.variance?.status === 'ahead' ? 'success' : 'error'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Grid>
                  </Grid>

                  {/* Progress bar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Revenue Progress</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(revenue.performance?.achievementRate || 0).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(revenue.performance?.achievementRate || 0, 100)}
                    color={(revenue.performance?.achievementRate || 0) >= 50 ? 'success' : 'error'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Inventory Status */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Inventory Status
                  </Typography>

                  {inventory.length > 0 ? (
                    <>
                      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                        {totalUnits} Units
                      </Typography>
                      {inventory.map((inv, i) => (
                        <Box key={i} sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {inv.status}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>{inv.count}</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={totalUnits > 0 ? (inv.count / totalUnits) * 100 : 0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(inv.color, 0.1),
                              '& .MuiLinearProgress-bar': { bgcolor: inv.color },
                            }}
                          />
                        </Box>
                      ))}
                      {/* Pie summary */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {inventory.map((inv, i) => (
                          <Chip
                            key={i}
                            size="small"
                            label={`${inv.status}: ${inv.count}`}
                            sx={{
                              bgcolor: alpha(inv.color, 0.1),
                              color: inv.color,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No inventory data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Sales Metrics Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Target Sales</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {sales.target?.targetSales || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">units</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Units Sold</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {sales.actual?.soldUnits || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {sales.target?.totalUnits || 0} total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Sell-Through Rate</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {(sales.performance?.sellThroughRate || 0).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    target: {((sales.target?.targetSalesRate || 0) * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Remaining</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {sales.target?.remainingUnits || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">units unsold</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Project Comparison Chart */}
          {projectChartData.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Budget Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 320}>
                  <BarChart
                    data={projectChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 70 : 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={alpha(theme.palette.text.primary, 0.08)}
                    />
                    <XAxis
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      fontSize={11}
                      height={isMobile ? 80 : 60}
                    />
                    <YAxis tickFormatter={v => formatCurrency(v)} fontSize={11} />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="target"
                      name="Target"
                      fill={alpha(theme.palette.primary.main, 0.3)}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actual"
                      name="Actual"
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Insights & Actions */}
          {(insights.length > 0 || actions.length > 0) && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {insights.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <InsightsIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Key Insights
                        </Typography>
                      </Box>
                      {insights.map((insight, i) => (
                        <Box
                          key={i}
                          sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mt: 0.8,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2">{insight}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {actions.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Flag fontSize="small" color="warning" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Recommended Actions
                        </Typography>
                      </Box>
                      {actions.map((action, i) => (
                        <Alert key={i} severity="info" sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {action.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Priority: {action.priority} · Est. Impact: {action.estimatedImpact}
                          </Typography>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Warning alerts */}
          {alerts.filter(a => a.type === 'warning').length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Warnings
                </Typography>
                {alerts.filter(a => a.type === 'warning').map((a, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1 }}>
                    {a.message}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default BudgetVsActualDashboard;

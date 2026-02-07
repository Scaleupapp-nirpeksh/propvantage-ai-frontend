// src/pages/analytics/RealTimeFinancialDashboard.js
// Financial Overview — holistic view across revenue, costs, sales, and leads

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Chip,
  IconButton, Tooltip, LinearProgress,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  AccountBalance, TrendingUp, People, Storefront, Assessment,
  Refresh, Flag, Insights as InsightsIcon, Warning,
  CheckCircle, Speed,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pct = (v) => `${(v ?? 0).toFixed(1)}%`;

const MetricRow = ({ label, actual, target, unit = '', color }) => {
  const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>
          {unit === '₹' ? formatCurrency(actual) : actual}{!unit || unit === '₹' ? '' : unit}
          <Typography component="span" variant="caption" color="text.secondary">
            {' '}/ {unit === '₹' ? formatCurrency(target) : target}{!unit || unit === '₹' ? '' : unit}
          </Typography>
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={color || (progress >= 70 ? 'success' : progress >= 40 ? 'warning' : 'error')}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RealTimeFinancialDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canAccess } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('current_month');
  const [report, setReport] = useState(null);
  const [dashboard, setDashboard] = useState(null);

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
      setError('Failed to load financial data');
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

  const revenue = report?.revenue || {};
  const sales = report?.sales || {};
  const leads = report?.leads || {};
  const costs = report?.costs || {};
  const projects = report?.projects || [];
  const alerts = dashboard?.alerts || [];
  const projections = dashboard?.projections || {};
  const insights = dashboard?.topInsights || [];
  const actions = dashboard?.quickActions || [];

  const kpis = useMemo(() => [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue.actual?.totalRevenue || 0),
      icon: AccountBalance,
      color: theme.palette.primary.main,
      subtitle: `Target: ${formatCurrency(revenue.target?.totalRevenue || 0)}`,
    },
    {
      title: 'Sell-Through Rate',
      value: pct(sales.performance?.sellThroughRate),
      icon: Storefront,
      color: (sales.performance?.sellThroughRate || 0) >= 50
        ? theme.palette.success.main
        : theme.palette.warning.main,
      subtitle: `${sales.actual?.soldUnits || 0} of ${sales.target?.totalUnits || 0} units`,
    },
    {
      title: 'Lead Conversion',
      value: pct(leads.performance?.conversionRate),
      icon: People,
      color: (leads.performance?.conversionRate || 0) >= 5
        ? theme.palette.success.main
        : theme.palette.error.main,
      subtitle: `${leads.actual?.totalLeads || 0} total leads`,
    },
    {
      title: 'Cost Efficiency',
      value: costs.available && costs.variance
        ? (costs.variance.status === 'under_budget' ? 'Under Budget' : 'Over Budget')
        : 'N/A',
      icon: Speed,
      color: costs.variance?.status === 'under_budget'
        ? theme.palette.success.main
        : theme.palette.warning.main,
      subtitle: costs.available
        ? `Planned: ${formatCurrency(costs.target?.totalPlannedCost || 0)}`
        : 'Cost data not available',
    },
  ], [revenue, sales, leads, costs, theme]);

  // Inventory pie data
  const inventoryData = useMemo(() => {
    if (!sales.actual?.inventoryStatus) return [];
    const colorMap = {
      available: theme.palette.success.main,
      sold: theme.palette.primary.main,
      booked: theme.palette.info.main,
      blocked: theme.palette.warning.main,
    };
    return sales.actual.inventoryStatus.map(s => ({
      name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1),
      value: s.count,
      color: colorMap[s._id] || theme.palette.grey[400],
    }));
  }, [sales, theme]);

  // Project chart data
  const projectChartData = useMemo(() =>
    projects.map(p => ({
      name: p.name?.length > 14 ? p.name.slice(0, 14) + '\u2026' : p.name,
      fullName: p.name,
      target: p.targetRevenue || 0,
      actual: p.actualRevenue || 0,
    })),
  [projects]);

  const ChartTooltipContent = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', minWidth: 180 }}>
        <Typography variant="subtitle2" gutterBottom>{d.fullName || d.name}</Typography>
        {d.target !== undefined && (
          <Typography variant="body2" color="text.secondary">Target: {formatCurrency(d.target)}</Typography>
        )}
        {d.actual !== undefined && (
          <Typography variant="body2" color="text.secondary">Actual: {formatCurrency(d.actual)}</Typography>
        )}
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
        title="Financial Overview"
        subtitle="Revenue, costs, sales velocity, and lead performance"
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

      {/* Critical alerts */}
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

      {/* Filter */}
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
      </Grid>

      {!loading && (
        <>
          {/* Revenue & Sales Section */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Revenue & Costs */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Revenue & Costs
                  </Typography>

                  <MetricRow
                    label="Revenue"
                    actual={revenue.actual?.totalRevenue || 0}
                    target={revenue.target?.totalRevenue || 0}
                    unit="₹"
                  />

                  {costs.available && (
                    <MetricRow
                      label="Costs"
                      actual={costs.actual?.totalActualCost || 0}
                      target={costs.target?.totalPlannedCost || 0}
                      unit="₹"
                      color={costs.variance?.status === 'under_budget' ? 'success' : 'error'}
                    />
                  )}

                  <Box
                    sx={{
                      mt: 2, p: 2, borderRadius: 2,
                      bgcolor: (revenue.variance?.percentage || 0) >= 0
                        ? alpha(theme.palette.success.main, 0.06)
                        : alpha(theme.palette.error.main, 0.06),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Revenue Variance
                      </Typography>
                      <Chip
                        size="small"
                        label={revenue.variance?.status || 'behind'}
                        color={revenue.variance?.status === 'ahead' ? 'success' : 'error'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                      {(revenue.variance?.percentage || 0) >= 0 ? '+' : ''}
                      {(revenue.variance?.percentage || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(Math.abs(revenue.variance?.absolute || 0))}{' '}
                      {(revenue.variance?.percentage || 0) >= 0 ? 'above' : 'below'} target
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Sales & Leads */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sales & Lead Pipeline
                  </Typography>

                  <MetricRow
                    label="Units Sold"
                    actual={sales.actual?.soldUnits || 0}
                    target={sales.target?.targetSales || 0}
                  />

                  <MetricRow
                    label="Total Leads"
                    actual={leads.actual?.totalLeads || 0}
                    target={leads.target?.totalLeads || 0}
                  />

                  <MetricRow
                    label="Qualified Leads"
                    actual={leads.actual?.qualifiedLeads || 0}
                    target={leads.target?.qualifiedLeads || 0}
                  />

                  <MetricRow
                    label="Booked Leads"
                    actual={leads.actual?.bookedLeads || 0}
                    target={leads.target?.bookedLeads || 0}
                  />

                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`Qualification: ${pct(leads.performance?.qualificationRate)}`}
                      color={leads.performance?.qualificationRate >= 20 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`Conversion: ${pct(leads.performance?.conversionRate)}`}
                      color={leads.performance?.conversionRate >= 3 ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Inventory & Project Comparison */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Inventory Breakdown */}
            {inventoryData.length > 0 && (
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Inventory Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                      <PieChart>
                        <Pie
                          data={inventoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 35 : 45}
                          outerRadius={isMobile ? 60 : 75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {inventoryData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v, name) => [`${v} units`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {inventoryData.map((d, i) => (
                        <Chip
                          key={i}
                          size="small"
                          label={`${d.name}: ${d.value}`}
                          sx={{ bgcolor: alpha(d.color, 0.1), color: d.color, fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Project Revenue Comparison */}
            {projectChartData.length > 0 && (
              <Grid item xs={12} md={inventoryData.length > 0 ? 8 : 12}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Revenue by Project
                    </Typography>
                    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
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
              </Grid>
            )}
          </Grid>

          {/* Projections */}
          {projections?.endOfYear && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  End of Year Projections
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Projected Revenue</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {formatCurrency(projections.endOfYear.projectedRevenue || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Projected Sales</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {projections.endOfYear.projectedSales || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Confidence</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {projections.confidence || 0}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={projections.confidence || 0}
                      color={projections.confidence >= 70 ? 'success' : projections.confidence >= 40 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3, mt: 1 }}
                    />
                  </Grid>
                </Grid>
                {projections.assumptions?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Assumptions: {projections.assumptions.join(' · ')}
                    </Typography>
                  </Box>
                )}
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
                        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.8, flexShrink: 0 }} />
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
                          <Typography variant="body2" fontWeight={600}>{action.action}</Typography>
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

export default RealTimeFinancialDashboard;

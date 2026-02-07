// src/pages/analytics/BudgetVarianceDashboard.js
// Budget variance — target vs actual revenue per project

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Chip, Avatar,
  List, ListItemButton, ListItemText, ListItemAvatar,
  IconButton, Tooltip, LinearProgress,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  AccountBalance, CompareArrows, Warning, Refresh, Business,
  CheckCircle, Error as ErrorIcon, TrendingUp, TrendingDown, Flag,
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { PageHeader, KPICard, FilterBar } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { projectAPI, salesAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THRESHOLDS = { CRITICAL: 20, WARNING: 10 };

const getStatus = (v) => {
  const a = Math.abs(v);
  if (a >= THRESHOLDS.CRITICAL) return { label: 'Critical', color: 'error' };
  if (a >= THRESHOLDS.WARNING) return { label: 'Warning', color: 'warning' };
  return { label: 'On Track', color: 'success' };
};

const ChartTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const s = getStatus(d.variance);
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', minWidth: 180 }}>
      <Typography variant="subtitle2" gutterBottom>{d.name}</Typography>
      <Typography variant="body2" color="text.secondary">Target: {formatCurrency(d.target)}</Typography>
      <Typography variant="body2" color="text.secondary">Actual: {formatCurrency(d.actual)}</Typography>
      <Typography variant="body2" fontWeight={600} color={`${s.color}.main`}>
        Variance: {d.variance >= 0 ? '+' : ''}{d.variance.toFixed(1)}%
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Units: {d.sold}/{d.total}
      </Typography>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const BudgetVarianceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);

  const [filters, setFilters] = useState({
    project: searchParams.get('project') || '',
    level: '',
  });

  const canView = canAccess?.viewFinancials ? canAccess.viewFinancials() : true;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [pRes, sRes] = await Promise.allSettled([
        projectAPI.getProjects(),
        salesAPI.getSales({ limit: 5000 }),
      ]);
      setProjects(pRes.status === 'fulfilled' ? (pRes.value.data?.data || []) : []);
      setSales(sRes.status === 'fulfilled' ? (sRes.value.data?.data || []) : []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (canView) fetchData(); }, [fetchData, canView]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.project) p.set('project', filters.project);
    setSearchParams(p, { replace: true });
  }, [filters.project, setSearchParams]);

  const handleFilter = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  const clearFilters = () => setFilters({ project: '', level: '' });
  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  const variances = useMemo(() => {
    return projects
      .filter(p => (p.targetRevenue || 0) > 0)
      .map(p => {
        const pSales = sales.filter(
          s => (s.project?._id || s.project) === p._id && s.status !== 'Cancelled',
        );
        const actual = pSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
        const target = p.targetRevenue;
        const variance = ((actual - target) / target) * 100;
        return {
          id: p._id,
          name: p.name,
          shortName: p.name?.length > 16 ? p.name.slice(0, 16) + '\u2026' : p.name,
          target, actual,
          variance: Math.round(variance * 10) / 10,
          total: p.totalUnits || 0,
          sold: pSales.length,
          progress: p.totalUnits > 0 ? (pSales.length / p.totalUnits) * 100 : 0,
        };
      })
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [projects, sales]);

  const filtered = useMemo(() => {
    if (!filters.level) return variances;
    if (filters.level === 'critical')
      return variances.filter(p => Math.abs(p.variance) >= THRESHOLDS.CRITICAL);
    if (filters.level === 'warning')
      return variances.filter(p => {
        const a = Math.abs(p.variance);
        return a >= THRESHOLDS.WARNING && a < THRESHOLDS.CRITICAL;
      });
    if (filters.level === 'on_track')
      return variances.filter(p => Math.abs(p.variance) < THRESHOLDS.WARNING);
    return variances;
  }, [variances, filters.level]);

  const stats = useMemo(() => {
    const tgt = filtered.reduce((s, p) => s + p.target, 0);
    const act = filtered.reduce((s, p) => s + p.actual, 0);
    const v = tgt > 0 ? ((act - tgt) / tgt) * 100 : 0;
    const crit = filtered.filter(p => Math.abs(p.variance) >= THRESHOLDS.CRITICAL).length;
    const warn = filtered.filter(p => {
      const a = Math.abs(p.variance);
      return a >= THRESHOLDS.WARNING && a < THRESHOLDS.CRITICAL;
    }).length;
    return {
      tgt, act,
      variance: Math.round(v * 10) / 10,
      crit, warn,
      onTrack: filtered.length - crit - warn,
      count: filtered.length,
    };
  }, [filtered]);

  const detail = useMemo(() => {
    if (!filters.project) return null;
    return variances.find(p => p.id === filters.project) || null;
  }, [filters.project, variances]);

  const chartData = useMemo(
    () => filtered.slice(0, 12).map(p => ({
      ...p,
      fill: theme.palette[getStatus(p.variance).color].main,
    })),
    [filtered, theme],
  );

  const pieData = useMemo(() => [
    { name: 'Critical', value: stats.crit, color: theme.palette.error.main },
    { name: 'Warning', value: stats.warn, color: theme.palette.warning.main },
    { name: 'On Track', value: stats.onTrack, color: theme.palette.success.main },
  ].filter(d => d.value > 0), [stats, theme]);

  const projectOpts = useMemo(() => [
    { value: '', label: 'All Projects' },
    ...variances.map(p => ({ value: p.id, label: p.name })),
  ], [variances]);

  const kpis = detail ? [
    { title: 'Target Revenue', value: formatCurrency(detail.target), icon: AccountBalance, color: theme.palette.primary.main },
    { title: 'Actual Revenue', value: formatCurrency(detail.actual), icon: TrendingUp, color: theme.palette.success.main },
    { title: 'Variance', value: `${detail.variance >= 0 ? '+' : ''}${detail.variance}%`, icon: CompareArrows, color: theme.palette[getStatus(detail.variance).color].main },
    { title: 'Units Sold', value: `${detail.sold} / ${detail.total}`, icon: Business, color: theme.palette.info.main, subtitle: `${detail.progress.toFixed(0)}% inventory sold` },
  ] : [
    { title: 'Total Target', value: formatCurrency(stats.tgt), icon: AccountBalance, color: theme.palette.primary.main },
    { title: 'Total Revenue', value: formatCurrency(stats.act), icon: TrendingUp, color: theme.palette.success.main },
    { title: 'Overall Variance', value: `${stats.variance >= 0 ? '+' : ''}${stats.variance}%`, icon: CompareArrows, color: theme.palette[getStatus(stats.variance).color].main },
    { title: 'At Risk', value: `${stats.crit + stats.warn}`, icon: Flag, color: theme.palette.warning.main, subtitle: `${stats.crit} critical \u00b7 ${stats.warn} warning` },
  ];

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
        title="Budget Variance"
        subtitle={`Tracking ${stats.count} project${stats.count !== 1 ? 's' : ''} with revenue targets`}
        icon={CompareArrows}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((k, i) => (
          <Grid item xs={6} md={3} key={i}>
            <KPICard
              title={k.title}
              value={k.value}
              icon={k.icon}
              color={k.color}
              subtitle={k.subtitle}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'project', label: 'Project', type: 'select', options: projectOpts },
          { key: 'level', label: 'Variance Level', type: 'select', options: [
            { value: '', label: 'All Levels' },
            { value: 'critical', label: 'Critical (>20%)' },
            { value: 'warning', label: 'Warning (10-20%)' },
            { value: 'on_track', label: 'On Track (<10%)' },
          ]},
        ]}
        values={filters}
        onChange={handleFilter}
        onClear={clearFilters}
      />

      {!loading && (
        <>
          {/* ---- Selected Project Detail ---- */}
          {detail && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {detail.name}
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Revenue Progress
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{formatCurrency(detail.actual)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        of {formatCurrency(detail.target)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((detail.actual / detail.target) * 100, 100)}
                      color={getStatus(detail.variance).color}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {((detail.actual / detail.target) * 100).toFixed(1)}% achieved
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Units Progress
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{detail.sold} sold</Typography>
                      <Typography variant="body2" color="text.secondary">
                        of {detail.total} total
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={detail.progress}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {detail.progress.toFixed(1)}% inventory sold
                    </Typography>
                  </Grid>
                </Grid>

                {detail.total > detail.sold && detail.target > detail.actual && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>{detail.total - detail.sold} units remaining</strong> need{' '}
                    {formatCurrency(detail.target - detail.actual)} to hit target &mdash; avg.{' '}
                    {formatCurrency(
                      (detail.target - detail.actual) /
                      Math.max(detail.total - detail.sold, 1),
                    )}{' '}
                    per unit
                  </Alert>
                )}

                {detail.actual >= detail.target && (
                  <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
                    This project has met or exceeded its revenue target.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---- Portfolio Charts ---- */}
          {!detail && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Variance by Project
                    </Typography>
                    {chartData.length === 0 ? (
                      <Alert severity="info">No projects with revenue targets found.</Alert>
                    ) : (
                      <ResponsiveContainer width="100%" height={isMobile ? 240 : 340}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 70 : 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.08)} />
                          <XAxis
                            dataKey="shortName"
                            angle={-35}
                            textAnchor="end"
                            fontSize={11}
                            height={isMobile ? 80 : 60}
                          />
                          <YAxis tickFormatter={v => `${v}%`} fontSize={11} />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeDasharray="2 2" />
                          <ReferenceLine
                            y={THRESHOLDS.WARNING}
                            stroke={theme.palette.warning.main}
                            strokeDasharray="4 4"
                            strokeOpacity={0.4}
                          />
                          <ReferenceLine
                            y={-THRESHOLDS.WARNING}
                            stroke={theme.palette.warning.main}
                            strokeDasharray="4 4"
                            strokeOpacity={0.4}
                          />
                          <Bar
                            dataKey="variance"
                            radius={[4, 4, 0, 0]}
                            cursor="pointer"
                            onClick={(d) => handleFilter('project', d.id)}
                          >
                            {chartData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Portfolio Health
                    </Typography>
                    {pieData.length === 0 ? (
                      <Alert severity="info">No data</Alert>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={isMobile ? 35 : 45}
                              outerRadius={isMobile ? 60 : 75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(v, name) => [`${v} project${v > 1 ? 's' : ''}`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                          {pieData.map((d, i) => (
                            <Chip
                              key={i}
                              size="small"
                              label={`${d.name}: ${d.value}`}
                              sx={{ bgcolor: alpha(d.color, 0.1), color: d.color, fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* ---- Project List ---- */}
          {!detail && (
            <Card>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, mb: 1 }}>
                  {filtered.length} Project{filtered.length !== 1 ? 's' : ''}
                </Typography>
                {filtered.length === 0 ? (
                  <Alert severity="info">No projects match the current filters.</Alert>
                ) : (
                  <List disablePadding>
                    {filtered.map((p) => {
                      const s = getStatus(p.variance);
                      const revProgress = p.target > 0
                        ? Math.min((p.actual / p.target) * 100, 100)
                        : 0;
                      return (
                        <ListItemButton
                          key={p.id}
                          onClick={() => handleFilter('project', p.id)}
                          sx={{
                            borderRadius: 2, mb: 1,
                            border: '1px solid', borderColor: 'divider',
                            '&:hover': { borderColor: `${s.color}.main` },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{
                              bgcolor: alpha(theme.palette[s.color].main, 0.1),
                              color: `${s.color}.main`,
                              width: 36, height: 36,
                            }}>
                              {s.color === 'error'
                                ? <ErrorIcon fontSize="small" />
                                : s.color === 'warning'
                                ? <Warning fontSize="small" />
                                : <CheckCircle fontSize="small" />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">{p.name}</Typography>
                                <Chip
                                  size="small"
                                  icon={p.variance >= 0
                                    ? <TrendingUp fontSize="small" />
                                    : <TrendingDown fontSize="small" />}
                                  label={`${p.variance >= 0 ? '+' : ''}${p.variance}%`}
                                  color={s.color}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Target: {formatCurrency(p.target)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Actual: {formatCurrency(p.actual)} &middot; Units: {p.sold}/{p.total}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={revProgress}
                                  color={s.color}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              </Box>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default BudgetVarianceDashboard;

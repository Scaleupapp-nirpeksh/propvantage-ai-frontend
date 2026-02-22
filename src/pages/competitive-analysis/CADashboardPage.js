// File: src/pages/competitive-analysis/CADashboardPage.js
// Dashboard overview for competitive analysis module

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add,
  PsychologyAlt,
  Upload,
  Business,
  LocationOn,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, KPICard, ChartCard, EmptyState, CardGridSkeleton } from '../../components/common';
import { CHART_COLORS } from '../../constants/statusConfig';
import { formatDistanceToNow } from 'date-fns';

const DATA_SOURCE_LABELS = {
  manual: 'Manual Entry',
  csv_import: 'CSV Import',
  ai_research: 'AI Research',
  field_visit: 'Field Visit',
  web_research: 'Web Research',
};

const FRESHNESS_CONFIG = {
  fresh:  { label: 'Fresh',  color: 'success', maxDays: 30 },
  recent: { label: 'Aging',  color: 'warning', maxDays: 90 },
  stale:  { label: 'Stale',  color: 'error',   maxDays: Infinity },
};

const getFreshnessLevel = (days) => {
  if (days < 30) return 'fresh';
  if (days < 90) return 'recent';
  return 'stale';
};

const CADashboardPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await competitiveAnalysisAPI.getDashboard();
      setDashboard(res.data?.data || res.data);
    } catch (error) {
      enqueueSnackbar('Failed to load dashboard', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <CardGridSkeleton />;

  // Empty state - no competitor data yet
  if (!dashboard || dashboard.totalCompetitors === 0) {
    return (
      <Box>
        <PageHeader
          title="Competitive Analysis"
          subtitle="Market position and competitor insights"
          badge="BETA"
        />
        <EmptyState
          icon={Business}
          title="No competitor data yet"
          description="Start tracking competitors to gain market intelligence. Add them manually, import via CSV, or use AI to research automatically."
          size="large"
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: -2, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/competitive-analysis/competitors/new')}>
            Enter Manually
          </Button>
          <Button variant="outlined" startIcon={<Upload />} onClick={() => navigate('/competitive-analysis/import')}>
            Import CSV
          </Button>
          <Button variant="outlined" startIcon={<PsychologyAlt />} onClick={() => navigate('/competitive-analysis/research')}>
            AI Research
          </Button>
        </Box>
      </Box>
    );
  }

  const sourceData = (dashboard.sourceDistribution || []).map(s => ({
    name: DATA_SOURCE_LABELS[s.source] || s.source,
    value: s.count,
  }));

  const freshness = dashboard.dataFreshness || {};

  return (
    <Box>
      <PageHeader
        title="Competitive Analysis"
        subtitle="Market position and competitor insights"
        badge="BETA"
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" startIcon={<Refresh />} onClick={fetchDashboard}>Refresh</Button>
            <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => navigate('/competitive-analysis/competitors/new')}>
              Add Competitor
            </Button>
            <Button size="small" variant="outlined" startIcon={<PsychologyAlt />} onClick={() => navigate('/competitive-analysis/research')}>
              AI Research
            </Button>
            <Button size="small" variant="outlined" startIcon={<Upload />} onClick={() => navigate('/competitive-analysis/import')}>
              Import CSV
            </Button>
          </Box>
        }
      />

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPICard
            title="Total Competitors"
            value={dashboard.totalCompetitors || 0}
            icon={Business}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            title="Active Competitors"
            value={dashboard.activeCompetitors || 0}
            icon={TrendingUp}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            title="Localities Tracked"
            value={dashboard.localitiesTracked || 0}
            icon={LocationOn}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            title="Freshness Score"
            value={`${freshness.overallFreshnessScore || 0}/100`}
            icon={Refresh}
            color={freshness.overallFreshnessScore >= 70 ? 'success' : freshness.overallFreshnessScore >= 40 ? 'warning' : 'error'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Localities */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Localities Tracked</Typography>
          <Grid container spacing={2}>
            {(dashboard.localities || []).map((loc, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                  onClick={() => navigate(`/competitive-analysis/competitors?city=${encodeURIComponent(loc.city)}&area=${encodeURIComponent(loc.area)}`)}
                >
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{loc.area}</Typography>
                        <Typography variant="caption" color="text.secondary">{loc.city}</Typography>
                      </Box>
                      <Chip label={`${loc.competitorCount} projects`} size="small" variant="outlined" />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Avg Price/sqft</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {loc.avgPricePerSqft ? `₹${loc.avgPricePerSqft.toLocaleString('en-IN')}` : '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Confidence</Typography>
                        <Typography variant="body2" fontWeight={600}>{loc.avgConfidenceScore || 0}%</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Data Sources Pie Chart */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Data Sources" height={260}>
            {sourceData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} projects`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 6 }}>No data</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
              {sourceData.map((s, i) => (
                <Chip
                  key={s.name}
                  label={`${s.name}: ${s.value}`}
                  size="small"
                  sx={{ bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.1), color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 600, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </ChartCard>
        </Grid>

        {/* Recently Added */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Recently Added</Typography>
          <Card variant="outlined">
            {(dashboard.recentlyAdded || []).slice(0, 5).map((comp, idx) => {
              const freshnessLevel = getFreshnessLevel(comp.dataAgeDays || 0);
              const fCfg = FRESHNESS_CONFIG[freshnessLevel];
              return (
                <Box
                  key={comp._id || idx}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                    borderBottom: idx < 4 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/competitive-analysis/competitors/${comp._id}`)}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{comp.projectName}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {comp.developerName} • {comp.location?.area}, {comp.location?.city}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ whiteSpace: 'nowrap' }}>
                    {comp.pricing?.pricePerSqft?.avg ? `₹${comp.pricing.pricePerSqft.avg.toLocaleString('en-IN')}/sqft` : '—'}
                  </Typography>
                  <Chip
                    label={fCfg.label}
                    size="small"
                    color={fCfg.color}
                    variant="outlined"
                    sx={{ minWidth: 60 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
                    {comp.dataCollectionDate
                      ? formatDistanceToNow(new Date(comp.dataCollectionDate), { addSuffix: true })
                      : '—'}
                  </Typography>
                </Box>
              );
            })}
            {(dashboard.recentlyAdded || []).length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No competitors added yet</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Data Freshness */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Data Freshness</Typography>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Fresh: ${freshness.freshCount || 0}`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 600 }}
                />
                <Chip
                  label={`Aging: ${freshness.recentCount || 0}`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', fontWeight: 600 }}
                />
                <Chip
                  label={`Stale: ${freshness.staleCount || 0}`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontWeight: 600 }}
                />
              </Box>
              {/* Freshness progress bar */}
              {(freshness.freshCount || 0) + (freshness.recentCount || 0) + (freshness.staleCount || 0) > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ width: `${((freshness.freshCount || 0) / dashboard.totalCompetitors) * 100}%`, bgcolor: 'success.main' }} />
                    <Box sx={{ width: `${((freshness.recentCount || 0) / dashboard.totalCompetitors) * 100}%`, bgcolor: 'warning.main' }} />
                    <Box sx={{ width: `${((freshness.staleCount || 0) / dashboard.totalCompetitors) * 100}%`, bgcolor: 'error.main' }} />
                  </Box>
                </Box>
              )}
              {freshness.recommendation && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {freshness.recommendation}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CADashboardPage;

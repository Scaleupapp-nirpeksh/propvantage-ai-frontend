import React, { useState, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  TextField, MenuItem, Alert, alpha, useTheme,
} from '@mui/material';
import { TrendingUp, TrendingDown, Search } from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, KPICard, ChartCard, EmptyState, CardGridSkeleton } from '../../components/common';
import { fmtCurrency } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS_OPTIONS = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------

const ChartTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1.5, minWidth: 180 }} elevation={3}>
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" sx={{ color: p.color }}>
            {p.name}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {p.name.toLowerCase().includes('unit') ? p.value.toLocaleString('en-IN') : fmtCurrency(p.value)}
          </Typography>
        </Box>
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const MarketTrendsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [months, setMonths] = useState(6);

  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // ---------------------------------------------------------------------------
  // Fetch trends
  // ---------------------------------------------------------------------------

  const handleLoadTrends = useCallback(async () => {
    if (!city.trim() || !area.trim()) {
      enqueueSnackbar('Please enter both city and area', { variant: 'warning' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await competitiveAnalysisAPI.getMarketTrends({
        city: city.trim(),
        area: area.trim(),
        months,
      });
      setData(res.data?.data || res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load market trends';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [city, area, months, enqueueSnackbar]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const hasData = data && data.dataPoints > 0;
  const trends = data?.latestTrends;

  const priceHistory = (data?.priceHistory || []).map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM yy'),
  }));

  const supplyHistory = (data?.supplyHistory || []).map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM yy'),
  }));

  const priceChangePositive = trends?.pricePerSqftChange >= 0;
  const supplyChangePositive = trends?.supplyChange >= 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      <PageHeader
        title="Market Trends"
        subtitle="Historical price and supply trends"
      />

      {/* ---- Locality selector ---- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Period"
                select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                fullWidth
              >
                {MONTHS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleLoadTrends}
                disabled={loading || !city.trim() || !area.trim()}
                fullWidth
                sx={{ height: 40 }}
              >
                Load Trends
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ---- Error ---- */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ---- Loading skeleton ---- */}
      {loading && <CardGridSkeleton count={3} />}

      {/* ---- No data state ---- */}
      {!loading && data && !hasData && (
        <EmptyState
          title="No Historical Snapshots"
          description={data.message || 'Market trends will build over time.'}
          size="large"
        />
      )}

      {/* ---- Results ---- */}
      {!loading && hasData && (
        <>
          {/* Trend KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Price Change (per sq.ft)"
                value={`${priceChangePositive ? '+' : ''}${trends.pricePerSqftChange.toFixed(2)}%`}
                subtitle={`${priceChangePositive ? '+' : ''}${fmtCurrency(trends.pricePerSqftChangeAbsolute)}/sq.ft`}
                icon={priceChangePositive ? TrendingUp : TrendingDown}
                color={priceChangePositive ? 'success' : 'error'}
                trend={{
                  value: parseFloat(trends.pricePerSqftChange.toFixed(2)),
                  direction: priceChangePositive ? 'up' : 'down',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Supply Change"
                value={`${supplyChangePositive ? '+' : ''}${trends.supplyChange.toFixed(1)}%`}
                icon={supplyChangePositive ? TrendingUp : TrendingDown}
                color={supplyChangePositive ? 'success' : 'error'}
                trend={{
                  value: parseFloat(trends.supplyChange.toFixed(1)),
                  direction: supplyChangePositive ? 'up' : 'down',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="New Projects Added"
                value={trends.newProjectsAdded}
                icon={TrendingUp}
                color="primary"
              />
            </Grid>
          </Grid>

          {/* Price History Chart */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard
                title="Price History"
                subtitle="Avg price/sq.ft with min-max range"
                height={320}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => fmtCurrency(v)}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="max"
                      stackId="range"
                      stroke="none"
                      fill={alpha(theme.palette.primary.main, 0.08)}
                      name="Max"
                    />
                    <Area
                      type="monotone"
                      dataKey="min"
                      stackId="range"
                      stroke="none"
                      fill={theme.palette.background.paper}
                      name="Min"
                    />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      fill={alpha(theme.palette.primary.main, 0.12)}
                      name="Avg Price"
                      dot={{ r: 3, fill: theme.palette.primary.main }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Supply History Chart */}
            <Grid item xs={12} md={6}>
              <ChartCard
                title="Supply History"
                subtitle="Total projects and units over time"
                height={320}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplyHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="totalProjects"
                      fill={theme.palette.primary.main}
                      name="Total Projects"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalUnits"
                      fill={alpha(theme.palette.success.main, 0.7)}
                      name="Total Units"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MarketTrendsPage;

// File: src/pages/competitive-analysis/MarketOverviewPage.js
// Aggregated market statistics for any locality

import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search,
  Business,
  Home,
  BarChart as BarChartIcon,
  Assessment,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, KPICard, ChartCard, EmptyState, CardGridSkeleton } from '../../components/common';
import { fmtCurrency } from '../../utils/formatters';
import { CHART_COLORS } from '../../constants/statusConfig';

const MarketOverviewPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLoad = useCallback(async () => {
    if (!city.trim() || !area.trim()) {
      enqueueSnackbar('Please enter both city and area', { variant: 'warning' });
      return;
    }
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await competitiveAnalysisAPI.getMarketOverview({ city: city.trim(), area: area.trim() });
      setData(res.data?.data || res.data);
    } catch (error) {
      enqueueSnackbar('Failed to load market overview', { variant: 'error' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [city, area, enqueueSnackbar]);

  // Price distribution bar data
  const priceDistributionData = data?.pricePerSqft
    ? [
        { label: 'Min', value: data.pricePerSqft.min },
        { label: 'P25', value: data.pricePerSqft.p25 },
        { label: 'Median', value: data.pricePerSqft.median },
        { label: 'Avg', value: data.pricePerSqft.avg },
        { label: 'P75', value: data.pricePerSqft.p75 },
        { label: 'Max', value: data.pricePerSqft.max },
      ]
    : [];

  // Unit type distribution
  const unitTypeData = (data?.unitTypeDistribution || []).map((u) => ({
    name: u.unitType,
    value: u.count,
    percentage: u.percentage,
  }));

  // Project status distribution
  const statusData = (data?.projectStatusDistribution || []).map((s) => ({
    name: s.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: s.count,
    percentage: s.percentage,
  }));

  // Amenity prevalence sorted by percentage desc
  const amenityData = [...(data?.amenityPrevalence || [])]
    .sort((a, b) => b.percentage - a.percentage)
    .map((a) => ({
      name: a.amenity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      percentage: a.percentage,
      count: a.count,
    }));

  const dq = data?.dataQuality;

  return (
    <Box>
      <PageHeader
        title="Market Overview"
        subtitle="Aggregated market statistics for any locality"
      />

      {/* Locality Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              size="small"
              required
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              size="small"
              required
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleLoad}
              disabled={loading || !city.trim() || !area.trim()}
            >
              Load Overview
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <CardGridSkeleton count={4} />}

      {/* Empty / no-search state */}
      {!loading && !data && (
        <EmptyState
          icon={hasSearched ? Assessment : Business}
          title={hasSearched ? 'No market data found' : 'Select a locality'}
          description={
            hasSearched
              ? 'No competitor data found for the selected city and area. Try a different locality.'
              : 'Enter a city and area above, then click "Load Overview" to see aggregated market statistics.'
          }
          size="large"
        />
      )}

      {/* Data loaded */}
      {!loading && data && (
        <>
          {/* KPI Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <KPICard
                title="Total Projects"
                value={data.totalProjects || 0}
                icon={Business}
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KPICard
                title="Total Units"
                value={data.totalUnitsInMarket || 0}
                icon={Home}
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KPICard
                title="Avg Price/sqft"
                value={data.pricePerSqft?.avg ? fmtCurrency(data.pricePerSqft.avg) : '—'}
                icon={BarChartIcon}
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <KPICard
                title="Price Std Dev"
                value={data.pricePerSqft?.stdDev ? fmtCurrency(data.pricePerSqft.stdDev) : '—'}
                icon={Assessment}
                color="warning"
                subtitle={
                  data.pricePerSqft?.outliersRemoved > 0
                    ? `${data.pricePerSqft.outliersRemoved} outlier${data.pricePerSqft.outliersRemoved > 1 ? 's' : ''} removed`
                    : undefined
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Price Distribution */}
            <Grid item xs={12} md={6}>
              <ChartCard title="Price Distribution (per sqft)" height={300}>
                {priceDistributionData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={priceDistributionData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmtCurrency(v)} />
                      <Tooltip formatter={(value) => [fmtCurrency(value), 'Price/sqft']} />
                      <Bar dataKey="value" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>No price data</Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Unit Type Distribution — Donut */}
            <Grid item xs={12} md={6}>
              <ChartCard title="Unit Type Distribution" height={300}>
                {unitTypeData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={unitTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {unitTypeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} units`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {unitTypeData.map((u, i) => (
                        <Chip
                          key={u.name}
                          label={`${u.name}: ${u.percentage}%`}
                          size="small"
                          sx={{
                            bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.1),
                            color: CHART_COLORS[i % CHART_COLORS.length],
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>No unit data</Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Project Status Distribution — Horizontal Bar */}
            <Grid item xs={12} md={6}>
              <ChartCard title="Project Status Distribution" height={280}>
                {statusData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={130} />
                      <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Projects' : name]} />
                      <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>No status data</Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Amenity Prevalence — Horizontal Bar */}
            <Grid item xs={12} md={6}>
              <ChartCard title="Amenity Prevalence" height={280}>
                {amenityData.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={amenityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Prevalence']} />
                      <Bar dataKey="percentage" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>No amenity data</Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Data Quality Card */}
            {dq && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Data Quality</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Total Data Points</Typography>
                        <Typography variant="h5" fontWeight={700}>{dq.totalDataPoints}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Verified</Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {dq.verifiedDataPoints}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            / {dq.totalDataPoints}
                          </Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Avg Confidence</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5" fontWeight={700}>{dq.averageConfidenceScore}%</Typography>
                          <Chip
                            label={dq.averageConfidenceScore >= 70 ? 'Good' : dq.averageConfidenceScore >= 40 ? 'Fair' : 'Low'}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                dq.averageConfidenceScore >= 70
                                  ? theme.palette.success.main
                                  : dq.averageConfidenceScore >= 40
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main,
                                0.1
                              ),
                              color:
                                dq.averageConfidenceScore >= 70
                                  ? theme.palette.success.main
                                  : dq.averageConfidenceScore >= 40
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Stale Data Points</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5" fontWeight={700}>{dq.staleDataPoints}</Typography>
                          {dq.staleDataPoints > 0 && (
                            <Chip
                              label="Needs refresh"
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Floor Rise Charge */}
            {data.floorRiseCharge && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Floor Rise Charge</Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Min</Typography>
                        <Typography variant="h6" fontWeight={700}>{fmtCurrency(data.floorRiseCharge.min)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Avg</Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">{fmtCurrency(data.floorRiseCharge.avg)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Max</Typography>
                        <Typography variant="h6" fontWeight={700}>{fmtCurrency(data.floorRiseCharge.max)}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MarketOverviewPage;

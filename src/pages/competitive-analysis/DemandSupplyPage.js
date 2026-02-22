// File: src/pages/competitive-analysis/DemandSupplyPage.js
// Demand & Supply analysis by locality — user enters city + area, clicks Analyze

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
import { Search, Business, Inventory } from '@mui/icons-material';
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
  Legend,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, KPICard, ChartCard, EmptyState, CardGridSkeleton } from '../../components/common';
import { fmtCurrency } from '../../utils/formatters';
import { CHART_COLORS } from '../../constants/statusConfig';

// Pipeline status display labels
const PIPELINE_LABELS = {
  pre_launch: 'Pre-Launch',
  newly_launched: 'Newly Launched',
  under_construction: 'Under Construction',
  ready_to_move: 'Ready to Move',
  completed: 'Completed',
};

// Pipeline status colors
const PIPELINE_COLORS = {
  pre_launch: '#8e24aa',
  newly_launched: '#1e88e5',
  under_construction: '#fb8c00',
  ready_to_move: '#43a047',
  completed: '#757575',
};

const PIPELINE_KEYS = ['pre_launch', 'newly_launched', 'under_construction', 'ready_to_move', 'completed'];

const DemandSupplyPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleAnalyze = useCallback(async () => {
    if (!city.trim() || !area.trim()) {
      enqueueSnackbar('Please enter both city and area', { variant: 'warning' });
      return;
    }
    try {
      setLoading(true);
      const res = await competitiveAnalysisAPI.getDemandSupply({ city: city.trim(), area: area.trim() });
      setData(res.data?.data || res.data);
    } catch (error) {
      enqueueSnackbar('Failed to load demand-supply data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [city, area, enqueueSnackbar]);

  // --- Chart data transformations ---

  const unitTypeChartData = (data?.supplyByUnitType || []).map((u) => ({
    unitType: u.unitType,
    totalUnits: u.totalUnits,
    availableUnits: u.availableUnits,
    avgPricePerSqft: u.avgPricePerSqft,
  }));

  const pipelineBreakdown = data?.supplyPipeline?.breakdown || {};
  const pipelineChartData = [
    {
      name: 'Supply Pipeline',
      ...PIPELINE_KEYS.reduce((acc, key) => {
        acc[key] = pipelineBreakdown[key] || 0;
        return acc;
      }, {}),
    },
  ];

  const saturationData = (data?.marketSaturation?.supplyConcentration || []).map((s) => ({
    name: s.type,
    value: s.share,
  }));

  // --- Custom tooltip for unit type bar chart ---
  const UnitTypeTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = data?.supplyByUnitType?.find((u) => u.unitType === label);
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((p) => (
          <Typography key={p.dataKey} variant="body2" sx={{ color: p.color }}>
            {p.dataKey === 'totalUnits' ? 'Total Units' : 'Available Units'}: {p.value?.toLocaleString('en-IN')}
          </Typography>
        ))}
        {entry?.avgPricePerSqft && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Avg Price/sqft: {fmtCurrency(entry.avgPricePerSqft)}
          </Typography>
        )}
      </Box>
    );
  };

  // --- Custom tooltip for pipeline bar chart ---
  const PipelineTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          boxShadow: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
          Supply Pipeline
        </Typography>
        {payload.map((p) => (
          <Typography key={p.dataKey} variant="body2" sx={{ color: p.fill }}>
            {PIPELINE_LABELS[p.dataKey]}: {p.value?.toLocaleString('en-IN')} units
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader title="Demand & Supply" subtitle="Demand-supply gap analysis by locality" badge="BETA" />

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
              onClick={handleAnalyze}
              disabled={loading || !city.trim() || !area.trim()}
            >
              Analyze
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <CardGridSkeleton count={3} />}

      {/* Empty state — before any search */}
      {!loading && !data && (
        <EmptyState
          icon={Inventory}
          title="Enter a locality to analyze"
          description="Provide a city and area above, then click Analyze to view demand-supply insights for that market."
          size="large"
        />
      )}

      {/* Data loaded */}
      {!loading && data && (
        <>
          {/* KPI Row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Total Projects"
                value={data.totalProjects || 0}
                icon={Business}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Total Supply"
                value={`${(data.totalSupply || 0).toLocaleString('en-IN')} units`}
                icon={Inventory}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Project Density"
                value={`${data.marketSaturation?.projectDensity || 0} projects`}
                icon={Business}
                color="warning"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Supply by Unit Type — Grouped Bar Chart */}
            <Grid item xs={12} md={8}>
              <ChartCard title="Supply by Unit Type" subtitle="Total vs available units per type" height={340}>
                {unitTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitTypeChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                      <XAxis dataKey="unitType" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<UnitTypeTooltip />} />
                      <Legend />
                      <Bar dataKey="totalUnits" name="Total Units" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="availableUnits" name="Available Units" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>
                    No unit type data available
                  </Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Market Saturation — Donut PieChart */}
            <Grid item xs={12} md={4}>
              <ChartCard title="Market Saturation" subtitle="Supply concentration by unit type" height={340}>
                {saturationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={saturationData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {saturationData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 8 }}>
                    No saturation data available
                  </Typography>
                )}
              </ChartCard>
            </Grid>

            {/* Supply Pipeline — Horizontal Stacked Bar Chart */}
            <Grid item xs={12}>
              <ChartCard title="Supply Pipeline" subtitle="Unit distribution across project stages" height={180}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} layout="vertical" barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                    <Tooltip content={<PipelineTooltip />} />
                    <Legend
                      formatter={(value) => PIPELINE_LABELS[value] || value}
                    />
                    {PIPELINE_KEYS.map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="pipeline"
                        fill={PIPELINE_COLORS[key]}
                        name={key}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Per-Type Stats Cards */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Unit Type Breakdown
              </Typography>
              <Grid container spacing={2}>
                {(data.supplyByUnitType || []).map((unit) => (
                  <Grid item xs={12} sm={6} md={3} key={unit.unitType}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {unit.unitType}
                          </Typography>
                          <Chip
                            label={`${unit.projectCount} projects`}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Units
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {unit.totalUnits?.toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Available Units
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {unit.availableUnits?.toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Price/sqft
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {fmtCurrency(unit.avgPricePerSqft)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DemandSupplyPage;

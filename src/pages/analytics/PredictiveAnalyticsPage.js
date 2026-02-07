// File: src/pages/analytics/PredictiveAnalyticsPage.js
// Description: Predictive Analytics Dashboard - matched to actual backend API responses
// Version: 1.1 - Fixed to match actual backend response structures
// Location: src/pages/analytics/PredictiveAnalyticsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Skeleton,
  Paper,
  LinearProgress,
  Avatar,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CheckCircle,
  FilterList,
  ShowChart,
  MonetizationOn,
  AttachMoney,
  Schedule,
  CalendarToday,
  Clear,
  ExpandMore,
  ExpandLess,
  People,
  Speed,
  Inventory,
  AutoGraph,
  Psychology,
  CompareArrows,
  Lightbulb,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Bar,
  ComposedChart,
  Line,
} from 'recharts';
import { predictiveAPI, projectAPI } from '../../services/api';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FORECAST_PERIODS = [
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '12 Months' },
];

const CHART_COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  purple: '#9c27b0',
  chart: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#f57c00', '#00acc1', '#8bc34a'],
  scenarios: {
    optimistic: '#4caf50',
    realistic: '#2196f3',
    pessimistic: '#f44336',
  },
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value?.toFixed(0) || 0}`;
};

const formatPercentage = (value, decimals = 1) => `${(value || 0).toFixed(decimals)}%`;

const formatNumber = (value) => (value || 0).toLocaleString();

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

const PredictiveKPICard = ({ title, value, unit = 'number', icon: Icon, color = 'primary', loading = false, subtitle, badge }) => {
  const formatValue = () => {
    if (loading) return <Skeleton width={80} height={40} />;
    if (unit === 'currency') return formatCurrency(value);
    if (unit === 'percentage') return formatPercentage(value);
    return formatNumber(value);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>{formatValue()}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48, ml: 2 }}>
            <Icon />
          </Avatar>
        </Box>
        {badge && !loading && (
          <Chip label={badge} size="small" color={color} variant="outlined" sx={{ mt: 1 }} />
        )}
      </CardContent>
    </Card>
  );
};

const ScenarioCard = ({ title, color, value, label, description, icon: Icon, isHighlighted = false }) => (
  <Card
    sx={{
      height: '100%',
      border: isHighlighted ? 2 : 1,
      borderColor: isHighlighted ? color : 'divider',
      bgcolor: isHighlighted ? `${color}08` : 'background.paper',
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 36, height: 36 }}>
          <Icon sx={{ fontSize: 20 }} />
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
        {isHighlighted && <Chip label="Most Likely" size="small" color="primary" />}
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{description}</Typography>
      )}
    </CardContent>
  </Card>
);

// =============================================================================
// FILTERS COMPONENT
// =============================================================================

const PredictiveFilters = ({ filters, onFilterChange, projects = [], onApply, onClear, loading }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Prediction Filters</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<Clear />} onClick={onClear}>Clear</Button>
            <Button variant="contained" size="small" startIcon={<AutoGraph />} onClick={onApply} disabled={loading}>
              Generate Predictions
            </Button>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        }
      />
      <Collapse in={expanded}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Forecast Period</InputLabel>
                <Select value={filters.period} onChange={(e) => onFilterChange('period', e.target.value)} label="Forecast Period">
                  {FORECAST_PERIODS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select value={filters.project} onChange={(e) => onFilterChange('project', e.target.value)} label="Project">
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Output Format</InputLabel>
                <Select value={filters.format} onChange={(e) => onFilterChange('format', e.target.value)} label="Output Format">
                  <MenuItem value="detailed">Detailed</MenuItem>
                  <MenuItem value="summary">Summary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

// =============================================================================
// SALES FORECAST TAB - Matches actual API: /analytics/predictions/sales-forecast
// =============================================================================

const SalesForecastTab = ({ data, loading }) => {
  // Actual response: { metadata, forecast, scenarios, confidence, insights, recommendations }
  const forecastData = data.salesForecast || {};
  const forecast = forecastData.forecast || {};
  const monthlyBreakdown = forecast.monthlyBreakdown || [];
  const scenarios = forecastData.scenarios || {};
  const metadata = forecastData.metadata || {};
  const insights = forecastData.insights || [];
  const recommendations = forecastData.recommendations || [];

  const chartData = monthlyBreakdown.map((item) => ({
    month: formatMonth(item.date) || `Month ${item.month}`,
    forecastedSales: item.forecastedSales || 0,
    aiAdjustedSales: item.aiAdjustedSales || 0,
    confidence: item.confidence || 0,
  }));

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Total Forecasted Sales"
          value={forecast.totalForecastedSales || 0}
          icon={ShowChart}
          color="primary"
          loading={loading}
          subtitle={`Next ${metadata.forecastPeriod?.replace('_', ' ') || '6 months'}`}
          badge={`Data Quality: ${metadata.dataQuality || 'N/A'}`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Avg Monthly Sales"
          value={Math.round(forecast.averageMonthlySales || 0)}
          icon={CalendarToday}
          color="info"
          loading={loading}
          subtitle="Average per month"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Confidence Range (95%)"
          value={forecastData.confidence?.confidence95 ? `${forecastData.confidence.confidence95.lower}-${forecastData.confidence.confidence95.upper}` : 'N/A'}
          unit="number"
          icon={Psychology}
          color="success"
          loading={loading}
          subtitle="Sales range at 95% confidence"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="AI Impact"
          value={(forecast.aiEnhancements?.overallImpact || 0) * 100}
          unit="percentage"
          icon={AutoGraph}
          color="warning"
          loading={loading}
          subtitle={forecast.methodology || 'AI-Enhanced Analysis'}
        />
      </Grid>

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <Grid item xs={12}>
          {insights.map((insight, idx) => (
            <Alert key={idx} severity={insight.type === 'warning' ? 'warning' : 'info'} sx={{ mb: 1 }}>
              <strong>{insight.category}:</strong> {insight.message}
              {insight.impact && <Chip label={`Impact: ${insight.impact}`} size="small" sx={{ ml: 1 }} />}
            </Alert>
          ))}
        </Grid>
      )}

      {/* Scenario Analysis */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrows color="primary" /> Scenario Analysis
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <ScenarioCard
              title="Pessimistic"
              color={CHART_COLORS.scenarios.pessimistic}
              value={formatNumber(scenarios.pessimistic?.totalSales || 0)}
              label={`${scenarios.pessimistic?.probability || 0}% probability`}
              description={scenarios.pessimistic?.description}
              icon={TrendingDown}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ScenarioCard
              title="Realistic"
              color={CHART_COLORS.scenarios.realistic}
              value={formatNumber(scenarios.realistic?.totalSales || 0)}
              label={`${scenarios.realistic?.probability || 0}% probability`}
              description={scenarios.realistic?.description}
              icon={TrendingFlat}
              isHighlighted
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ScenarioCard
              title="Optimistic"
              color={CHART_COLORS.scenarios.optimistic}
              value={formatNumber(scenarios.optimistic?.totalSales || 0)}
              label={`${scenarios.optimistic?.probability || 0}% probability`}
              description={scenarios.optimistic?.description}
              icon={TrendingUp}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Monthly Forecast Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Monthly Sales Forecast</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}><CircularProgress /></Box>
            ) : chartData.length === 0 ? (
              <Alert severity="info">No forecast data available.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="forecastedSales" fill={CHART_COLORS.primary} name="Forecasted Sales" />
                  <Line type="monotone" dataKey="aiAdjustedSales" stroke={CHART_COLORS.success} strokeWidth={2} name="AI Adjusted Sales" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="confidence" stroke={CHART_COLORS.warning} strokeDasharray="5 5" name="Confidence %" yAxisId={0} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recommendations */}
      {!loading && recommendations.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb color="warning" /> AI Recommendations
              </Typography>
              {recommendations.map((rec, idx) => (
                <Alert key={idx} severity={rec.priority === 'high' ? 'warning' : 'info'} sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2">{rec.action}</Typography>
                    <Typography variant="body2" color="text.secondary">{rec.rationale}</Typography>
                    <Chip label={`Est. Impact: ${rec.estimatedImpact}`} size="small" sx={{ mt: 0.5 }} />
                  </Box>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// =============================================================================
// REVENUE PROJECTIONS TAB - Matches actual API: /analytics/predictions/revenue-projection
// =============================================================================

const RevenueProjectionsTab = ({ data, loading }) => {
  // Actual response: { totalProjectedRevenue, monthlyBreakdown, scenarios, confidence, assumptions, basedOnSalesForecast }
  const projection = data.revenueProjection || {};
  const monthly = projection.monthlyBreakdown || [];
  const scenarios = projection.scenarios || {};
  const assumptions = projection.assumptions || [];
  const salesBasis = projection.basedOnSalesForecast || {};

  const chartData = monthly.map((item, idx) => ({
    month: formatMonth(item.date) || `Month ${item.month}`,
    projectedRevenue: item.projectedRevenue || 0,
    projectedSales: item.projectedSales || 0,
    confidence: item.confidence || 0,
    cumulative: monthly.slice(0, idx + 1).reduce((sum, m) => sum + (m.projectedRevenue || 0), 0),
  }));

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Total Projected Revenue"
          value={projection.totalProjectedRevenue || 0}
          unit="currency"
          icon={MonetizationOn}
          color="success"
          loading={loading}
          subtitle="End of forecast period"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Total Projected Sales"
          value={salesBasis.totalSales || 0}
          icon={ShowChart}
          color="primary"
          loading={loading}
          subtitle="Units forecasted to sell"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Avg Unit Price"
          value={salesBasis.averagePrice || 0}
          unit="currency"
          icon={AttachMoney}
          color="info"
          loading={loading}
          subtitle="Average selling price"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Monthly Avg Revenue"
          value={monthly.length > 0 ? monthly.reduce((s, m) => s + (m.projectedRevenue || 0), 0) / monthly.length : 0}
          unit="currency"
          icon={CalendarToday}
          color="warning"
          loading={loading}
          subtitle="Average monthly projection"
        />
      </Grid>

      {/* Revenue Scenarios */}
      {!loading && Object.keys(scenarios).length > 0 && (
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows color="primary" /> Revenue Scenarios
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <ScenarioCard title="Pessimistic" color={CHART_COLORS.scenarios.pessimistic} value={formatCurrency(scenarios.pessimistic?.totalRevenue || 0)} label="Conservative estimate" description={scenarios.pessimistic?.description} icon={TrendingDown} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ScenarioCard title="Realistic" color={CHART_COLORS.scenarios.realistic} value={formatCurrency(scenarios.realistic?.totalRevenue || 0)} label="Most likely estimate" description={scenarios.realistic?.description} icon={TrendingFlat} isHighlighted />
            </Grid>
            <Grid item xs={12} md={4}>
              <ScenarioCard title="Optimistic" color={CHART_COLORS.scenarios.optimistic} value={formatCurrency(scenarios.optimistic?.totalRevenue || 0)} label="Best case estimate" description={scenarios.optimistic?.description} icon={TrendingUp} />
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Revenue Projection Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Revenue Projections Over Time</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}><CircularProgress /></Box>
            ) : chartData.length === 0 ? (
              <Alert severity="info">No revenue projection data available.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <RechartsTooltip formatter={(value, name) => [name.includes('Revenue') || name.includes('Cumulative') ? formatCurrency(value) : value, name]} />
                  <Legend />
                  <Area type="monotone" dataKey="cumulative" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.15} name="Cumulative Revenue" strokeWidth={2} />
                  <Area type="monotone" dataKey="projectedRevenue" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.3} name="Monthly Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Breakdown Table */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Monthly Revenue Breakdown</Typography>
            {loading ? (
              <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
            ) : monthly.length === 0 ? (
              <Alert severity="info">No monthly breakdown available.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Projected Sales</TableCell>
                      <TableCell align="right">Projected Revenue</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthly.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{formatMonth(item.date) || `Month ${item.month}`}</TableCell>
                        <TableCell align="right">{formatNumber(item.projectedSales || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.projectedRevenue || 0)}</TableCell>
                        <TableCell align="right">{item.confidence || 0}%</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatNumber(monthly.reduce((s, m) => s + (m.projectedSales || 0), 0))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(monthly.reduce((s, m) => s + (m.projectedRevenue || 0), 0))}</TableCell>
                      <TableCell align="right">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Assumptions */}
      {!loading && assumptions.length > 0 && (
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Assumptions</Typography>
              {assumptions.map((assumption, idx) => (
                <Alert key={idx} severity="info" icon={false} sx={{ mb: 1, py: 0.5 }}>
                  <Typography variant="body2">{assumption}</Typography>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// =============================================================================
// LEAD CONVERSION TAB - Matches actual API: /analytics/predictions/lead-conversion-probability
// =============================================================================

const LeadConversionTab = ({ data, loading }) => {
  // Actual response: { totalLeads, highProbabilityLeads, averageProbability, leadBreakdown: {hot, warm, cold}, topLeads: [...] }
  const conversionData = data.leadConversion || {};
  const topLeads = conversionData.topLeads || [];
  const breakdown = conversionData.leadBreakdown || {};

  const pieData = [
    { name: 'Hot', value: breakdown.hot || 0 },
    { name: 'Warm', value: breakdown.warm || 0 },
    { name: 'Cold', value: breakdown.cold || 0 },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['#d32f2f', '#ed6c02', '#0288d1'];

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Total Leads"
          value={conversionData.totalLeads || 0}
          icon={People}
          color="primary"
          loading={loading}
          subtitle="Leads analyzed"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="High Probability Leads"
          value={conversionData.highProbabilityLeads || 0}
          icon={CheckCircle}
          color="success"
          loading={loading}
          subtitle="Likely to convert"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Avg Conversion Probability"
          value={conversionData.averageProbability || 0}
          unit="percentage"
          icon={ShowChart}
          color="info"
          loading={loading}
          subtitle="Across all leads"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Hot Leads"
          value={breakdown.hot || 0}
          icon={TrendingUp}
          color="error"
          loading={loading}
          subtitle={`${breakdown.warm || 0} warm, ${breakdown.cold || 0} cold`}
        />
      </Grid>

      {/* Lead Breakdown Pie Chart */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Lead Temperature Breakdown</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}><CircularProgress /></Box>
            ) : pieData.length === 0 ? (
              <Alert severity="info">No lead data available.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Top Leads by Score */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Top High-Probability Leads</Typography>
            {loading ? (
              <Box>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
            ) : topLeads.length === 0 ? (
              <Alert severity="info">No lead prediction data available.</Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lead Name</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">Conversion %</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell align="right">Budget Range</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topLeads.map((lead) => (
                      <TableRow key={lead._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {lead.firstName} {lead.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(lead.daysSinceCreated || 0)} days old
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={lead.source || 'N/A'} size="small" variant="outlined" /></TableCell>
                        <TableCell><Chip label={lead.status || 'N/A'} size="small" color="primary" /></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{lead.score || 0}</Typography>
                            <Chip label={lead.scoreGrade || '-'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(lead.conversionProbability || 0)}
                            size="small"
                            sx={{
                              bgcolor: (lead.conversionProbability || 0) >= 70 ? '#e8f5e9' : (lead.conversionProbability || 0) >= 40 ? '#fff3e0' : '#fce4ec',
                              color: (lead.conversionProbability || 0) >= 70 ? '#2e7d32' : (lead.conversionProbability || 0) >= 40 ? '#e65100' : '#c62828',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.riskLevel || 'N/A'}
                            size="small"
                            color={lead.riskLevel === 'Very Low' || lead.riskLevel === 'Low' ? 'success' : lead.riskLevel === 'Medium' ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {lead.budget ? `${formatCurrency(lead.budget.min)} - ${formatCurrency(lead.budget.max)}` : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// =============================================================================
// INVENTORY TURNOVER TAB - Matches actual API: /analytics/predictions/inventory-turnover
// =============================================================================

const InventoryTurnoverTab = ({ data, loading }) => {
  // Actual response: { currentInventory: {available, sold, total}, turnoverPrediction: {period, projectedSales, turnoverRate, monthsToSellOut}, insights: [...] }
  const inventory = data.inventoryTurnover || {};
  const currentInventory = inventory.currentInventory || {};
  const turnover = inventory.turnoverPrediction || {};
  const insights = inventory.insights || [];

  const blocked = currentInventory.total - (currentInventory.available || 0) - (currentInventory.sold || 0);
  const inventoryPieData = [
    { name: 'Available', value: currentInventory.available || 0 },
    { name: 'Sold', value: currentInventory.sold || 0 },
    { name: 'Other', value: blocked > 0 ? blocked : 0 },
  ].filter(d => d.value > 0);

  const INV_COLORS = ['#2e7d32', '#1976d2', '#ed6c02'];

  const soldPercentage = currentInventory.total > 0 ? ((currentInventory.sold || 0) / currentInventory.total) * 100 : 0;
  const availablePercentage = currentInventory.total > 0 ? ((currentInventory.available || 0) / currentInventory.total) * 100 : 0;

  return (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Total Inventory"
          value={currentInventory.total || 0}
          icon={Inventory}
          color="primary"
          loading={loading}
          subtitle="Total units across projects"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Available Units"
          value={currentInventory.available || 0}
          icon={CheckCircle}
          color="success"
          loading={loading}
          subtitle={`${formatPercentage(availablePercentage)} of total`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Turnover Rate"
          value={turnover.turnoverRate || 0}
          unit="percentage"
          icon={Speed}
          color="info"
          loading={loading}
          subtitle={`${turnover.projectedSales || 0} projected sales`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <PredictiveKPICard
          title="Months to Sell Out"
          value={turnover.monthsToSellOut ? turnover.monthsToSellOut.toFixed(1) : 0}
          icon={Schedule}
          color={(turnover.monthsToSellOut || 0) > 24 ? 'error' : (turnover.monthsToSellOut || 0) > 12 ? 'warning' : 'success'}
          loading={loading}
          subtitle="At current absorption rate"
        />
      </Grid>

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <Grid item xs={12}>
          {insights.map((insight, idx) => (
            <Alert key={idx} severity={insight.type === 'warning' ? 'warning' : 'info'} sx={{ mb: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{insight.message}</Typography>
                {insight.action && (
                  <Typography variant="caption" color="text.secondary">Recommended action: {insight.action}</Typography>
                )}
              </Box>
            </Alert>
          ))}
        </Grid>
      )}

      {/* Inventory Pie Chart */}
      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Inventory Distribution</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}><CircularProgress /></Box>
            ) : inventoryPieData.length === 0 ? (
              <Alert severity="info">No inventory data available.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={inventoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {inventoryPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={INV_COLORS[idx % INV_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Turnover Summary */}
      <Grid item xs={12} md={7}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Turnover Analysis Summary</Typography>
            {loading ? (
              <Box>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Forecast Period</TableCell>
                      <TableCell align="right">{turnover.period?.replace('_', ' ') || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Total Inventory</TableCell>
                      <TableCell align="right">{formatNumber(currentInventory.total || 0)} units</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Currently Available</TableCell>
                      <TableCell align="right">
                        {formatNumber(currentInventory.available || 0)} units ({formatPercentage(availablePercentage)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Units Sold</TableCell>
                      <TableCell align="right">
                        {formatNumber(currentInventory.sold || 0)} units ({formatPercentage(soldPercentage)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Projected Sales</TableCell>
                      <TableCell align="right">{formatNumber(turnover.projectedSales || 0)} units</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Turnover Rate</TableCell>
                      <TableCell align="right">{formatPercentage(turnover.turnoverRate || 0)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Estimated Months to Sell Out</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${turnover.monthsToSellOut ? turnover.monthsToSellOut.toFixed(1) : 'N/A'} months`}
                          color={(turnover.monthsToSellOut || 0) > 24 ? 'error' : (turnover.monthsToSellOut || 0) > 12 ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Sell-out progress bar */}
            {!loading && currentInventory.total > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>Sales Progress</Typography>
                  <Typography variant="body2" color="text.secondary">{formatPercentage(soldPercentage)} sold</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(soldPercentage, 100)}
                  color={soldPercentage >= 75 ? 'success' : soldPercentage >= 50 ? 'info' : 'warning'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// =============================================================================
// MAIN PREDICTIVE ANALYTICS PAGE
// =============================================================================

const PredictiveAnalyticsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [projects, setProjects] = useState([]);

  const [filters, setFilters] = useState({
    period: '6_months',
    project: 'all',
    format: 'detailed',
  });

  const [predictiveData, setPredictiveData] = useState({
    salesForecast: {},
    revenueProjection: {},
    leadConversion: {},
    inventoryTurnover: {},
  });

  const [loadingStates, setLoadingStates] = useState({
    salesForecast: true,
    revenueProjection: true,
    leadConversion: true,
    inventoryTurnover: true,
  });

  const getApiParams = useCallback(() => {
    const params = { period: filters.period, format: filters.format };
    if (filters.project !== 'all') params.projectId = filters.project;
    return params;
  }, [filters]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getProjects();
      const data = response.data?.data || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  const fetchSalesForecast = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, salesForecast: true }));
      const response = await predictiveAPI.getSalesForecast(getApiParams());
      setPredictiveData((prev) => ({ ...prev, salesForecast: response.data?.data || {} }));
    } catch (err) {
      console.error('Error fetching sales forecast:', err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, salesForecast: false }));
    }
  }, [getApiParams]);

  const fetchRevenueProjection = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, revenueProjection: true }));
      const response = await predictiveAPI.getRevenueProjection(getApiParams());
      setPredictiveData((prev) => ({ ...prev, revenueProjection: response.data?.data || {} }));
    } catch (err) {
      console.error('Error fetching revenue projection:', err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, revenueProjection: false }));
    }
  }, [getApiParams]);

  const fetchLeadConversion = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, leadConversion: true }));
      const response = await predictiveAPI.getLeadConversionProbability(getApiParams());
      setPredictiveData((prev) => ({ ...prev, leadConversion: response.data?.data || {} }));
    } catch (err) {
      console.error('Error fetching lead conversion:', err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, leadConversion: false }));
    }
  }, [getApiParams]);

  const fetchInventoryTurnover = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, inventoryTurnover: true }));
      const response = await predictiveAPI.getInventoryTurnover(getApiParams());
      setPredictiveData((prev) => ({ ...prev, inventoryTurnover: response.data?.data || {} }));
    } catch (err) {
      console.error('Error fetching inventory turnover:', err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, inventoryTurnover: false }));
    }
  }, [getApiParams]);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchSalesForecast(), fetchRevenueProjection(), fetchLeadConversion(), fetchInventoryTurnover()]);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to refresh predictive data');
    } finally {
      setLoading(false);
    }
  }, [fetchSalesForecast, fetchRevenueProjection, fetchLeadConversion, fetchInventoryTurnover]);

  useEffect(() => {
    fetchProjects();
    refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => refreshAllData(), 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshAllData]);

  const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
  const clearFilters = () => setFilters({ period: '6_months', project: 'all', format: 'detailed' });

  const TAB_LABELS = ['Sales Forecast', 'Revenue Projections', 'Lead Conversion', 'Inventory Turnover'];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>Predictive Analytics</Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered forecasts for sales, revenue, lead conversion, and inventory turnover
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} color="primary" />}
              label="Auto Refresh"
            />
            <Tooltip title="Refresh Predictions">
              <IconButton onClick={refreshAllData} disabled={loading} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdated.toLocaleString()}
          {autoRefresh && ' | Auto-refresh: ON (every 5 minutes)'}
        </Typography>
      </Box>

      {/* Filters */}
      <PredictiveFilters filters={filters} onFilterChange={handleFilterChange} projects={projects} onApply={refreshAllData} onClear={clearFilters} loading={loading} />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant={isMobile ? 'scrollable' : 'standard'} scrollButtons={isMobile ? 'auto' : false}>
          {TAB_LABELS.map((label, idx) => (<Tab key={idx} label={label} />))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <SalesForecastTab data={predictiveData} loading={loadingStates.salesForecast} />}
      {activeTab === 1 && <RevenueProjectionsTab data={predictiveData} loading={loadingStates.revenueProjection} />}
      {activeTab === 2 && <LeadConversionTab data={predictiveData} loading={loadingStates.leadConversion} />}
      {activeTab === 3 && <InventoryTurnoverTab data={predictiveData} loading={loadingStates.inventoryTurnover} />}
    </Box>
  );
};

export default PredictiveAnalyticsPage;

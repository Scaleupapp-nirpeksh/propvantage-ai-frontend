// File: src/pages/pricing/DynamicPricingPage.js
// Description: Dynamic Pricing Dashboard - matches actual backend API response structure
// Version: 1.1 - Fixed to match actual backend response
// Location: src/pages/pricing/DynamicPricingPage.js

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
  Divider,
  useTheme,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  MonetizationOn,
  AttachMoney,
  AutoGraph,
  Lightbulb,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { pricingAPI, projectAPI } from '../../services/api';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount?.toLocaleString() || 0}`;
};

const formatFullCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Suggestion Card - maps to actual backend fields
const PricingSuggestionCard = ({ suggestion }) => {
  const diff = suggestion.difference || 0;
  const type = diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'hold';

  const getSeverityColor = () => {
    if (type === 'increase') return 'warning';
    if (type === 'decrease') return 'error';
    return 'info';
  };

  const getTypeLabel = () => {
    if (type === 'increase') return 'Price Increase';
    if (type === 'decrease') return 'Price Decrease';
    return 'Hold';
  };

  const TrendIcon = type === 'increase' ? TrendingUp : type === 'decrease' ? TrendingDown : TrendingFlat;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendIcon color={type === 'increase' ? 'warning' : type === 'decrease' ? 'error' : 'info'} />
              <Typography variant="subtitle1" fontWeight={600}>
                {suggestion.unitNumber}
              </Typography>
              <Chip
                label={getTypeLabel()}
                size="small"
                color={getSeverityColor()}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {diff > 0
                ? `Suggested to increase price by ${formatCurrency(diff)} to meet revenue targets.`
                : diff < 0
                ? `Suggested to decrease price by ${formatCurrency(Math.abs(diff))} to align with average pricing.`
                : 'Current price is in line with the suggested pricing.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Current Price</Typography>
                <Typography variant="body2" fontWeight={600}>{formatCurrency(suggestion.currentPrice)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Suggested Price</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  {formatCurrency(suggestion.suggestedNewPrice)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Difference</Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={diff > 0 ? 'warning.main' : diff < 0 ? 'error.main' : 'text.secondary'}
                >
                  {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Dynamic Pricing Page
const DynamicPricingPage = () => {
  const theme = useTheme();
  const { canAccess } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [pricingData, setPricingData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getProjects();
      const data = response.data?.data || [];
      const projectsList = Array.isArray(data) ? data : [];
      setProjects(projectsList);
      if (projectsList.length > 0 && !selectedProject) {
        setSelectedProject(projectsList[0]._id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, [selectedProject]);

  // Fetch dynamic pricing
  const fetchDynamicPricing = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    setError(null);

    try {
      const response = await pricingAPI.getDynamicPricing(selectedProject);
      setPricingData(response.data?.data || response.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dynamic pricing:', err);
      setError(err.response?.data?.message || 'Failed to load dynamic pricing data.');
      setPricingData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchDynamicPricing();
    }
  }, [selectedProject]);

  // Extract data from actual backend response structure
  const summary = pricingData?.summary || {};
  const suggestions = pricingData?.suggestions || [];

  // Compute derived stats from suggestions
  const increaseCount = suggestions.filter(s => (s.difference || 0) > 0).length;
  const decreaseCount = suggestions.filter(s => (s.difference || 0) < 0).length;
  const totalCurrentValue = suggestions.reduce((sum, s) => sum + (s.currentPrice || 0), 0);
  const totalSuggestedValue = suggestions.reduce((sum, s) => sum + (s.suggestedNewPrice || 0), 0);

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">New Avg Price</Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {loading ? <Skeleton width={100} /> : formatCurrency(summary.newAveragePrice || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Suggested average per unit</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MonetizationOn color="success" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Target Revenue</Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {loading ? <Skeleton width={100} /> : formatCurrency(summary.targetRevenue || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Achieved: {formatCurrency(summary.achievedRevenue || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoGraph color="warning" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Remaining Revenue</Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {loading ? <Skeleton width={100} /> : formatCurrency(summary.remainingRevenue || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.unitsRemaining || 0} units remaining
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Lightbulb color="info" fontSize="small" />
              <Typography variant="body2" color="text.secondary">Price Suggestions</Typography>
            </Box>
            <Typography variant="h4" fontWeight={600}>
              {loading ? <Skeleton width={60} /> : suggestions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {increaseCount} increase, {decreaseCount} decrease
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Insight */}
      {!loading && suggestions.length > 0 && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Pricing Summary:</strong> Out of {suggestions.length} units, {increaseCount} are suggested for a price increase and {decreaseCount} for a decrease.
            Total current value: {formatCurrency(totalCurrentValue)} → Suggested total: {formatCurrency(totalSuggestedValue)} (Diff: {formatCurrency(totalSuggestedValue - totalCurrentValue)}).
          </Alert>
        </Grid>
      )}

      {/* Pricing Suggestions */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb color="warning" /> AI Pricing Suggestions
        </Typography>
        {loading ? (
          <Box>{[1, 2, 3].map((i) => <Skeleton key={i} height={100} sx={{ mb: 1 }} />)}</Box>
        ) : suggestions.length === 0 ? (
          <Alert severity="info">No pricing suggestions available for this project at the moment.</Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {suggestions.length} unit pricing recommendations based on target revenue of {formatCurrency(summary.targetRevenue)}.
            </Typography>
            {suggestions.slice(0, 10).map((suggestion, idx) => (
              <PricingSuggestionCard key={suggestion.unitId || idx} suggestion={suggestion} />
            ))}
            {suggestions.length > 10 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Showing top 10 of {suggestions.length} suggestions. View the "Unit Pricing" tab for the full list.
              </Alert>
            )}
          </>
        )}
      </Grid>
    </Grid>
  );

  const renderPriceDistribution = () => {
    // Build chart data showing the distribution of price changes
    const chartData = suggestions.map(s => ({
      unit: s.unitNumber,
      currentPrice: s.currentPrice || 0,
      suggestedPrice: s.suggestedNewPrice || 0,
      difference: s.difference || 0,
    }));

    // Sort by difference for better visualization
    chartData.sort((a, b) => a.difference - b.difference);

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Price Adjustment Distribution</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : chartData.length === 0 ? (
                <Alert severity="info">No pricing data available.</Alert>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="unit"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={Math.ceil(chartData.length / 20)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <RechartsTooltip
                      formatter={(value, name) => [formatFullCurrency(value), name]}
                      labelFormatter={(label) => `Unit: ${label}`}
                    />
                    <Bar dataKey="difference" name="Price Difference">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.difference > 0 ? '#ed6c02' : entry.difference < 0 ? '#d32f2f' : '#9e9e9e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#ed6c02', borderRadius: '50%' }} />
                  <Typography variant="caption">Price Increase ({increaseCount})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#d32f2f', borderRadius: '50%' }} />
                  <Typography variant="caption">Price Decrease ({decreaseCount})</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderUnitPricing = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Unit-wise Pricing Analysis</Typography>
              {!loading && (
                <Chip
                  label={`${suggestions.length} units`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            {loading ? (
              <Box>{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)}</Box>
            ) : suggestions.length === 0 ? (
              <Alert severity="info">No unit pricing data available.</Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Current Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Suggested Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Difference</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suggestions.map((unit) => {
                      const diff = unit.difference || 0;
                      return (
                        <TableRow key={unit.unitId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{unit.unitNumber}</Typography>
                          </TableCell>
                          <TableCell align="right">{formatFullCurrency(unit.currentPrice || 0)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600} color="primary.main">
                              {formatFullCurrency(unit.suggestedNewPrice || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontWeight={600}
                              color={diff > 0 ? 'warning.main' : diff < 0 ? 'error.main' : 'text.secondary'}
                            >
                              {diff > 0 ? '+' : ''}{formatFullCurrency(diff)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={diff > 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : diff < 0 ? <TrendingDown sx={{ fontSize: 14 }} /> : <TrendingFlat sx={{ fontSize: 14 }} />}
                              label={diff > 0 ? 'Increase' : diff < 0 ? 'Decrease' : 'Hold'}
                              size="small"
                              color={diff > 0 ? 'warning' : diff < 0 ? 'error' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>Dynamic Pricing</Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered pricing suggestions and market analysis for your projects
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Select Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchDynamicPricing} disabled={loading} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdated.toLocaleString()}
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Overview & Suggestions" />
          <Tab label="Price Distribution" />
          <Tab label="Unit Pricing" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && renderOverview()}
      {activeTab === 1 && renderPriceDistribution()}
      {activeTab === 2 && renderUnitPricing()}
    </Box>
  );
};

export default DynamicPricingPage;

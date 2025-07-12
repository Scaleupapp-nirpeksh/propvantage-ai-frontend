// File: src/pages/analytics/RevenueAnalytics.js
// Description: Comprehensive Revenue Analytics Dashboard with forecasting and financial projections
// Version: 1.0 - Production Grade Implementation for Phase 1
// Location: src/pages/analytics/RevenueAnalytics.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
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
  Badge,
  TextField,
  InputAdornment,
  Collapse,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  Stack,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  Info,
  Error,
  FilterList,
  GetApp,
  Insights,
  AccountBalance,
  MonetizationOn,
  CompareArrows,
  Timeline,
  Assessment,
  PieChart,
  BarChart,
  ShowChart,
  NotificationsActive,
  Business,
  AttachMoney,
  Schedule,
  Flag,
  CalendarToday,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  AccountBalanceWallet,
  CreditCard,
  Savings,
  RequestQuote,
  AccountTree,
  Analytics,
  Speed,
  LocalAtm,
  PaidOutlined,
  PaymentOutlined,
  ReceiptOutlined,
  FileDownload,
  Print,
  Share,
  Equalizer,
  DonutLarge,
  MultilineChart,
  AutoGraph,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, analyticsAPI, projectAPI } from '../../services/api';

// =============================================================================
// REVENUE ANALYTICS CONFIGURATION
// =============================================================================

/**
 * Revenue analysis periods
 */
const REVENUE_PERIODS = [
  { value: 'current_week', label: 'This Week' },
  { value: 'current_month', label: 'This Month' },
  { value: 'current_quarter', label: 'This Quarter' },
  { value: 'current_year', label: 'This Year' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Revenue performance thresholds
 */
const REVENUE_THRESHOLDS = {
  excellent: 120,  // 120%+ of target = excellent
  good: 100,       // 100-120% of target = good  
  warning: 80,     // 80-100% of target = warning
  critical: 80,    // <80% of target = critical
};

/**
 * Revenue forecast confidence levels
 */
const FORECAST_CONFIDENCE = {
  high: { min: 85, label: 'High Confidence', color: 'success' },
  medium: { min: 70, label: 'Medium Confidence', color: 'warning' },
  low: { min: 0, label: 'Low Confidence', color: 'error' },
};

/**
 * Color system for revenue metrics
 */
const REVENUE_COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  target: '#9c27b0',
  actual: '#f57c00',
  forecast: '#00acc1',
  chart: ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#f57c00', '#00acc1', '#8bc34a'],
};

/**
 * Revenue categories for breakdown
 */
const REVENUE_CATEGORIES = [
  { key: 'bookings', label: 'New Bookings', icon: AttachMoney },
  { key: 'collections', label: 'Collections', icon: AccountBalanceWallet },
  { key: 'pending', label: 'Pending Payments', icon: Schedule },
  { key: 'overdue', label: 'Overdue Amounts', icon: Warning },
];

/**
 * Utility functions for formatting
 */
const formatCurrency = (value) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value?.toFixed(0) || 0}`;
};

const formatPercentage = (value, decimals = 1) => {
  return `${(value || 0).toFixed(decimals)}%`;
};

const formatNumber = (value) => {
  return (value || 0).toLocaleString();
};

const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const calculateVariance = (actual, target) => {
  if (!target || target === 0) return 0;
  return ((actual - target) / target) * 100;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Advanced Revenue Filters Component
 */
const RevenueFilters = ({ 
  filters, 
  onFilterChange, 
  projects = [], 
  onApplyFilters,
  onClearFilters,
  loading = false 
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    onFilterChange(field, value);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Revenue Analytics Filters</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Assessment />}
              onClick={onApplyFilters}
              disabled={loading}
            >
              Apply Filters
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
            {/* Time Period */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  label="Time Period"
                >
                  {REVENUE_PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Date Range */}
            {filters.period === 'custom' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth size="small" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth size="small" />
                    )}
                  />
                </Grid>
              </LocalizationProvider>
            )}

            {/* Project Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  label="Project"
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Revenue Type Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Revenue Type</InputLabel>
                <Select
                  value={filters.revenueType}
                  onChange={(e) => handleFilterChange('revenueType', e.target.value)}
                  label="Revenue Type"
                >
                  <MenuItem value="all">All Revenue</MenuItem>
                  <MenuItem value="bookings">New Bookings</MenuItem>
                  <MenuItem value="collections">Collections</MenuItem>
                  <MenuItem value="recurring">Recurring Revenue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Analysis Focus */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Analysis Focus</InputLabel>
                <Select
                  value={filters.focus}
                  onChange={(e) => handleFilterChange('focus', e.target.value)}
                  label="Analysis Focus"
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="trends">Trend Analysis</MenuItem>
                  <MenuItem value="forecasting">Forecasting</MenuItem>
                  <MenuItem value="variance">Budget Variance</MenuItem>
                  <MenuItem value="growth">Growth Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

/**
 * Revenue KPI Card Component
 */
const RevenueKPICard = ({ 
  title, 
  value, 
  previousValue,
  target,
  unit = 'currency', 
  icon: Icon, 
  color = 'primary',
  loading = false,
  showTrend = true,
  showTarget = true,
  subtitle = null,
  alertLevel = null,
}) => {
  const theme = useTheme();
  
  // Calculate trend
  const trend = useMemo(() => {
    if (!showTrend || !previousValue || !value) return null;
    const change = calculateGrowth(value, previousValue);
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(change),
      value: value - previousValue,
    };
  }, [value, previousValue, showTrend]);

  // Calculate target variance
  const targetVariance = useMemo(() => {
    if (!showTarget || !target || !value) return null;
    return calculateVariance(value, target);
  }, [value, target, showTarget]);

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp fontSize="small" color="success" />;
      case 'down': return <TrendingDown fontSize="small" color="error" />;
      default: return <TrendingFlat fontSize="small" color="info" />;
    }
  };

  const getPerformanceColor = () => {
    if (alertLevel) return alertLevel;
    if (!targetVariance) return color;
    if (targetVariance >= REVENUE_THRESHOLDS.excellent - 100) return 'success';
    if (targetVariance >= REVENUE_THRESHOLDS.good - 100) return 'info';
    if (targetVariance >= REVENUE_THRESHOLDS.warning - 100) return 'warning';
    return 'error';
  };

  const formatValue = () => {
    if (loading) return <CircularProgress size={20} />;
    if (unit === 'currency') return formatCurrency(value);
    if (unit === 'percentage') return formatPercentage(value);
    return formatNumber(value);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: alertLevel ? `2px solid ${theme.palette[alertLevel].main}` : 'none',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {formatValue()}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Avatar 
            sx={{ 
              bgcolor: `${getPerformanceColor()}.main`, 
              width: 48, 
              height: 48,
              ml: 2,
            }}
          >
            <Icon />
          </Avatar>
        </Box>

        {/* Trend Display */}
        {trend && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon()}
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 0.5,
                  color: trend.direction === 'up' ? 'success.main' : 
                         trend.direction === 'down' ? 'error.main' : 'text.secondary'
                }}
              >
                {formatPercentage(trend.percentage, 1)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs previous period
            </Typography>
          </Box>
        )}

        {/* Target Progress */}
        {targetVariance !== null && !loading && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Budget Target
              </Typography>
              <Typography variant="caption" color={getPerformanceColor()}>
                {targetVariance >= 0 ? '+' : ''}{formatPercentage(targetVariance)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.abs(targetVariance) + 100, 200) / 2}
              color={getPerformanceColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Target: {formatCurrency(target)}
            </Typography>
          </Box>
        )}

        {/* Alert Indicator */}
        {alertLevel && (
          <Alert severity={alertLevel} sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              {alertLevel === 'error' ? 'Below target threshold' : 
               alertLevel === 'warning' ? 'Monitor performance' : 'Excellent performance'}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Revenue Forecast Chart Component
 */
const RevenueForecastChart = ({ forecastData, actualData, loading = false }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!forecastData || forecastData.length === 0) {
    return (
      <Alert severity="info">
        No forecast data available for the selected period.
      </Alert>
    );
  }

  // Combine actual and forecast data
  const combinedData = actualData.map(actual => {
    const forecast = forecastData.find(f => f.period === actual.period);
    return {
      ...actual,
      forecast: forecast?.revenue || null,
      confidence: forecast?.confidence || null,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={combinedData}>
        <XAxis dataKey="period" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <RechartsTooltip 
          formatter={(value, name) => [
            formatCurrency(value),
            name === 'revenue' ? 'Actual Revenue' : 
            name === 'forecast' ? 'Forecasted Revenue' : 
            name === 'target' ? 'Target Revenue' : name
          ]}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stackId="1"
          stroke={REVENUE_COLORS.actual}
          fill={REVENUE_COLORS.actual}
          fillOpacity={0.6}
          name="Actual Revenue"
        />
        <Line 
          type="monotone" 
          dataKey="target" 
          stroke={REVENUE_COLORS.target}
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Target Revenue"
        />
        <Line 
          type="monotone" 
          dataKey="forecast" 
          stroke={REVENUE_COLORS.forecast}
          strokeWidth={3}
          name="Forecasted Revenue"
        />
        <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

/**
 * Project Revenue Table Component
 */
const ProjectRevenueTable = ({ projectData, loading = false }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  const getVarianceColor = (variance) => {
    if (variance >= REVENUE_THRESHOLDS.excellent - 100) return 'success';
    if (variance >= REVENUE_THRESHOLDS.good - 100) return 'info';  
    if (variance >= REVENUE_THRESHOLDS.warning - 100) return 'warning';
    return 'error';
  };

  const sortedProjectData = projectData.sort((a, b) => (b.actualRevenue || 0) - (a.actualRevenue || 0));

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Project Name</TableCell>
            <TableCell align="right">Target Revenue</TableCell>
            <TableCell align="right">Actual Revenue</TableCell>
            <TableCell align="right">Variance</TableCell>
            <TableCell align="right">Achievement</TableCell>
            <TableCell align="right">Units Sold</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedProjectData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((project, index) => {
              const variance = calculateVariance(project.actualRevenue, project.targetRevenue);
              const achievement = project.targetRevenue > 0 ? 
                (project.actualRevenue / project.targetRevenue) * 100 : 0;
              
              return (
                <TableRow key={project._id || index}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {project.name || 'Unknown Project'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.location || 'Location not specified'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(project.targetRevenue || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(project.actualRevenue || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      color={variance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight={600}
                    >
                      {variance >= 0 ? '+' : ''}{formatPercentage(variance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(achievement, 100)}
                        color={getVarianceColor(variance)}
                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatPercentage(achievement)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatNumber(project.unitsSold || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        achievement >= REVENUE_THRESHOLDS.excellent ? 'Excellent' :
                        achievement >= REVENUE_THRESHOLDS.good ? 'On Track' :
                        achievement >= REVENUE_THRESHOLDS.warning ? 'Behind' : 'Critical'
                      }
                      color={getVarianceColor(variance)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={projectData.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </TableContainer>
  );
};

// =============================================================================
// MAIN REVENUE ANALYTICS COMPONENT
// =============================================================================

const RevenueAnalytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  
  // Enhanced filters state
  const [filters, setFilters] = useState({
    period: 'current_month',
    startDate: null,
    endDate: null,
    project: 'all',
    revenueType: 'all',
    focus: 'all',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  
  // Revenue analytics data state
  const [revenueData, setRevenueData] = useState({
    kpis: {
      totalRevenue: 0,
      targetRevenue: 0,
      revenueGrowth: 0,
      collectionRate: 0,
      pendingRevenue: 0,
      overdueAmount: 0,
    },
    trends: [],
    forecast: [],
    projectBreakdown: [],
    categoryBreakdown: [],
    budgetVariance: {},
    alerts: [],
    projections: {},
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    trends: true,
    forecast: true,
    projects: true,
    variance: true,
  });

  // =============================================================================
  // FILTER FUNCTIONS
  // =============================================================================

  /**
   * Generate API query parameters from current filters
   */
  const getApiParams = useCallback(() => {
    const params = {
      period: filters.period,
    };

    // Add custom date range
    if (filters.period === 'custom' && filters.startDate && filters.endDate) {
      params.startDate = filters.startDate.toISOString();
      params.endDate = filters.endDate.toISOString();
    }

    // Add project filter
    if (filters.project !== 'all') {
      params.projectId = filters.project;
    }

    // Add revenue type filter
    if (filters.revenueType !== 'all') {
      params.revenueType = filters.revenueType;
    }

    return params;
  }, [filters]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Apply filters and refresh data
   */
  const applyFilters = () => {
    refreshRevenueData();
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      period: 'current_month',
      startDate: null,
      endDate: null,
      project: 'all',
      revenueType: 'all',
      focus: 'all',
    });
  };

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch filter options
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const projectsResponse = await projectAPI.getProjects();
      const projectsData = projectsResponse.data?.data || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  /**
   * Fetch revenue KPIs
   */
  const fetchRevenueKPIs = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, kpis: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getRevenueKPIs with params:', params);
      
      const response = await budgetVsActualAPI.getRevenueKPIs(params);
      console.log('✅ Revenue KPIs API Response:', response.data);

      const data = response.data?.data || {};
      
      setRevenueData(prev => ({
        ...prev,
        kpis: {
          totalRevenue: data.revenue?.actual?.totalRevenue || 0,
          targetRevenue: data.revenue?.target?.totalRevenue || 0,
          revenueGrowth: data.growth?.revenueGrowth || 0,
          collectionRate: data.collections?.rate || 0,
          pendingRevenue: data.revenue?.pending || 0,
          overdueAmount: data.revenue?.overdue || 0,
        },
      }));

    } catch (error) {
      console.error('Error fetching revenue KPIs:', error);
      setError(`Failed to load revenue KPIs: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, kpis: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch revenue trends and forecasting
   */
  const fetchRevenueTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, trends: true, forecast: true }));
      
      const params = { ...getApiParams(), include: 'trends,projections,forecast' };
      console.log('🔄 Calling budgetVsActualAPI.getRevenueAnalysis with params:', params);
      
      const response = await budgetVsActualAPI.getRevenueAnalysis(params);
      console.log('✅ Revenue Trends API Response:', response.data);

      const data = response.data?.data || {};
      
      // Transform trend data for charts
      const trends = [];
      if (data.revenue?.trend?.monthly) {
        trends.push(...data.revenue.trend.monthly.map(item => ({
          period: `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`,
          revenue: item.revenue || 0,
          target: item.target || 0,
          collections: item.collections || 0,
        })));
      }

      // Transform forecast data
      const forecast = data.projections?.monthly?.map(item => ({
        period: `${item.year}-${String(item.month).padStart(2, '0')}`,
        revenue: item.projectedRevenue || 0,
        confidence: item.confidence || 0,
      })) || [];

      setRevenueData(prev => ({
        ...prev,
        trends,
        forecast,
        projections: data.projections || {},
      }));

    } catch (error) {
      console.error('Error fetching revenue trends:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false, forecast: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch project revenue breakdown
   */
  const fetchProjectBreakdown = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const params = { ...getApiParams(), include: 'revenue,variance,performance' };
      console.log('🔄 Calling budgetVsActualAPI.getProjectComparison with params:', params);
      
      const response = await budgetVsActualAPI.getProjectComparison(params);
      console.log('✅ Project Revenue Breakdown API Response:', response.data);

      const data = response.data?.data || {};
      
      setRevenueData(prev => ({
        ...prev,
        projectBreakdown: data.projects || [],
      }));

    } catch (error) {
      console.error('Error fetching project breakdown:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch budget variance analysis
   */
  const fetchBudgetVariance = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, variance: true }));
      
      const params = { ...getApiParams(), include: 'variance,budget,analysis' };
      console.log('🔄 Calling budgetVsActualAPI.getBudgetVsActual with params:', params);
      
      const response = await budgetVsActualAPI.getBudgetVsActual(params);
      console.log('✅ Budget Variance API Response:', response.data);

      const data = response.data?.data || {};
      
      setRevenueData(prev => ({
        ...prev,
        budgetVariance: data.variance || {},
        alerts: data.alerts || [],
      }));

    } catch (error) {
      console.error('Error fetching budget variance:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, variance: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all revenue data
   */
  const refreshRevenueData = useCallback(async () => {
    console.log('🔄 Starting revenue analytics refresh with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchRevenueKPIs(),
        fetchRevenueTrends(),
        fetchProjectBreakdown(),
        fetchBudgetVariance(),
      ]);
      
      console.log('✅ Revenue analytics refresh completed successfully');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing revenue analytics:', error);
      setError('Failed to refresh revenue data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchRevenueKPIs,
    fetchRevenueTrends,
    fetchProjectBreakdown,
    fetchBudgetVariance,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Revenue Analytics initializing...');
    fetchFilterOptions();
    refreshRevenueData();
  }, []);

  // Refresh data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshRevenueData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshRevenueData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, refreshRevenueData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
  };

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = (format) => {
    // Implementation for export functionality
    console.log(`Exporting revenue data in ${format} format`);
    handleExportClose();
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render Revenue KPIs Overview
   */
  const renderRevenueKPIs = () => {
    // Calculate alert levels based on performance
    const getRevenueAlert = () => {
      const achievement = revenueData.kpis.targetRevenue > 0 ? 
        (revenueData.kpis.totalRevenue / revenueData.kpis.targetRevenue) * 100 : 0;
      if (achievement < REVENUE_THRESHOLDS.critical) return 'error';
      if (achievement < REVENUE_THRESHOLDS.warning) return 'warning';
      return null;
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Total Revenue"
            value={revenueData.kpis.totalRevenue}
            target={revenueData.kpis.targetRevenue}
            unit="currency"
            icon={MonetizationOn}
            color="success"
            loading={loadingStates.kpis}
            subtitle="Revenue generated"
            alertLevel={getRevenueAlert()}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Target Revenue"
            value={revenueData.kpis.targetRevenue}
            unit="currency"
            icon={RequestQuote}
            color="info"
            loading={loadingStates.kpis}
            subtitle="Budget target"
            showTrend={false}
            showTarget={false}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Revenue Growth"
            value={revenueData.kpis.revenueGrowth}
            unit="percentage"
            icon={TrendingUp}
            color="primary"
            loading={loadingStates.kpis}
            subtitle="Period over period"
            showTarget={false}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Collection Rate"
            value={revenueData.kpis.collectionRate}
            unit="percentage"
            icon={AccountBalanceWallet}
            color="warning"
            loading={loadingStates.kpis}
            subtitle="Revenue collected"
            showTarget={false}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Pending Revenue"
            value={revenueData.kpis.pendingRevenue}
            unit="currency"
            icon={Schedule}
            color="info"
            loading={loadingStates.kpis}
            subtitle="Awaiting collection"
            showTrend={false}
            showTarget={false}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <RevenueKPICard
            title="Overdue Amount"
            value={revenueData.kpis.overdueAmount}
            unit="currency"
            icon={Warning}
            color="error"
            loading={loadingStates.kpis}
            subtitle="Past due payments"
            showTrend={false}
            showTarget={false}
            alertLevel={revenueData.kpis.overdueAmount > 1000000 ? 'warning' : null}
          />
        </Grid>
      </Grid>
    );
  };

  /**
   * Render Revenue Trends Chart
   */
  const renderRevenueTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue Trends & Performance
        </Typography>
        
        {loadingStates.trends ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : revenueData.trends.length === 0 ? (
          <Alert severity="info">
            No revenue trend data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={revenueData.trends}>
              <XAxis dataKey="period" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === 'revenue' ? 'Actual Revenue' : 
                  name === 'target' ? 'Target Revenue' : 'Collections'
                ]}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill={REVENUE_COLORS.actual}
                name="Actual Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={REVENUE_COLORS.target}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="collections" 
                stackId="1"
                stroke={REVENUE_COLORS.success}
                fill={REVENUE_COLORS.success}
                fillOpacity={0.3}
                name="Collections"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Revenue Forecasting
   */
  const renderRevenueForecast = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue Forecasting & Projections
        </Typography>
        
        <RevenueForecastChart 
          forecastData={revenueData.forecast} 
          actualData={revenueData.trends}
          loading={loadingStates.forecast} 
        />
        
        {/* Forecast Summary */}
        {Object.keys(revenueData.projections).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Forecast Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Next Month Projection
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(revenueData.projections.nextMonth?.revenue || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Quarter End Projection
                </Typography>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(revenueData.projections.quarterEnd?.revenue || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Year End Projection
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(revenueData.projections.yearEnd?.revenue || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Forecast Confidence
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatPercentage(revenueData.projections.confidence || 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Project Revenue Breakdown
   */
  const renderProjectBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Project Revenue Performance
        </Typography>
        
        <ProjectRevenueTable 
          projectData={revenueData.projectBreakdown} 
          loading={loadingStates.projects} 
        />
      </CardContent>
    </Card>
  );

  /**
   * Render Revenue Category Breakdown
   */
  const renderCategoryBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue by Category
        </Typography>
        
        <Grid container spacing={3}>
          {REVENUE_CATEGORIES.map((category, index) => {
            const value = revenueData.kpis[category.key] || 0;
            const Icon = category.icon;
            
            return (
              <Grid item xs={12} sm={6} md={3} key={category.key}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: `${REVENUE_COLORS.chart[index]}.main` }}>
                    <Icon />
                  </Avatar>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.label}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );

  /**
   * Render Budget Variance Analysis
   */
  const renderBudgetVariance = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Budget Variance Analysis
        </Typography>
        
        {loadingStates.variance ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : Object.keys(revenueData.budgetVariance).length === 0 ? (
          <Alert severity="info">
            No budget variance data available for the selected period.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Revenue Variance
                </Typography>
                <Typography variant="h4" color={
                  revenueData.budgetVariance.revenue?.percentage >= 0 ? 'success.main' : 'error.main'
                }>
                  {revenueData.budgetVariance.revenue?.percentage >= 0 ? '+' : ''}
                  {formatPercentage(revenueData.budgetVariance.revenue?.percentage || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(Math.abs(revenueData.budgetVariance.revenue?.amount || 0))} 
                  {revenueData.budgetVariance.revenue?.percentage >= 0 ? ' above' : ' below'} budget
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Collection Variance
                </Typography>
                <Typography variant="h4" color={
                  revenueData.budgetVariance.collections?.percentage >= 0 ? 'success.main' : 'error.main'
                }>
                  {revenueData.budgetVariance.collections?.percentage >= 0 ? '+' : ''}
                  {formatPercentage(revenueData.budgetVariance.collections?.percentage || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(Math.abs(revenueData.budgetVariance.collections?.amount || 0))} 
                  {revenueData.budgetVariance.collections?.percentage >= 0 ? ' above' : ' below'} budget
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Revenue Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive revenue analysis with forecasting, budget variance, and project-wise breakdown
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Auto Refresh Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={handleAutoRefreshToggle}
                    color="primary"
                  />
                }
                label="Auto Refresh"
              />
              
              {/* Export Menu */}
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={handleExportClick}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={handleExportClose}
              >
                <MenuItem onClick={() => handleExport('excel')}>
                  <FileDownload sx={{ mr: 1 }} />
                  Export to Excel
                </MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>
                  <Print sx={{ mr: 1 }} />
                  Export to PDF
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <GetApp sx={{ mr: 1 }} />
                  Export to CSV
                </MenuItem>
              </Menu>
              
              {/* Manual Refresh Button */}
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={refreshRevenueData} 
                  disabled={loading}
                  color="primary"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Last Updated Info */}
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()}
            {autoRefresh && ' • Auto-refresh: ON (every 5 minutes)'}
          </Typography>
        </Box>

        {/* Advanced Filters */}
        <RevenueFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={projects}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          loading={loading}
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="revenue analytics tabs">
            <Tab label="Overview" />
            <Tab label="Trends & Growth" />
            <Tab label="Forecasting" />
            <Tab label="Project Breakdown" />
            <Tab label="Budget Variance" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderRevenueKPIs()}
              </Grid>
              <Grid item xs={12} lg={8}>
                {renderRevenueTrends()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderCategoryBreakdown()}
              </Grid>
            </Grid>
          )}

          {/* Trends & Growth Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderRevenueTrends()}
              </Grid>
              <Grid item xs={12}>
                {renderRevenueKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Forecasting Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderRevenueForecast()}
              </Grid>
              <Grid item xs={12}>
                {renderRevenueKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Project Breakdown Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderProjectBreakdown()}
              </Grid>
            </Grid>
          )}

          {/* Budget Variance Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderBudgetVariance()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderRevenueTrends()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderCategoryBreakdown()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default RevenueAnalytics;
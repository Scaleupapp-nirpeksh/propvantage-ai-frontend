// File: src/pages/analytics/RealTimeFinancialDashboard.js
// Description: FIXED Real-time Financial Dashboard with proper API integration
// Version: 1.1 - Fixed to work with actual API responses and added filtering
// Location: src/pages/analytics/RealTimeFinancialDashboard.js

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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Collapse,
  CardHeader,
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
  ShowChart,
  NotificationsActive,
  Business,
  AttachMoney,
  Schedule,
  Flag,
  AccountBalanceWallet,
  CreditCard,
  Wallet,
  TrendingDownOutlined,
  ArrowUpward,
  ArrowDownward,
  SwapHoriz,
  Speed,
  PaymentOutlined,
  ReceiptOutlined,
  LocalAtm,
  CalendarToday,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
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
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, analyticsAPI, projectAPI } from '../../services/api';

// =============================================================================
// DASHBOARD CONFIGURATION
// =============================================================================

/**
 * Real-time update intervals
 */
const UPDATE_INTERVALS = {
  live: 30 * 1000,      // 30 seconds
  frequent: 60 * 1000,   // 1 minute
  normal: 5 * 60 * 1000, // 5 minutes
};

/**
 * Financial alert thresholds
 */
const FINANCIAL_THRESHOLDS = {
  cashFlow: {
    critical: 1000000,    // Critical cash flow level (10L)
    warning: 5000000,     // Warning cash flow level (50L)
  },
  variance: {
    critical: 25,         // 25% variance threshold
    warning: 15,          // 15% variance threshold
  },
  growth: {
    target: 10,           // 10% target growth rate
    excellent: 20,        // 20% excellent growth rate
  },
};

/**
 * Color system for financial indicators
 */
const FINANCIAL_COLORS = {
  positive: '#2e7d32',      // Green - positive trends
  negative: '#d32f2f',      // Red - negative trends
  warning: '#ed6c02',       // Orange - warning levels
  neutral: '#1976d2',       // Blue - neutral/info
  excellent: '#4caf50',     // Light green - excellent performance
  critical: '#f44336',      // Deep red - critical alerts
  chart: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#f57c00'],
};

/**
 * Time period options for real-time data
 */
const REALTIME_PERIODS = [
  { value: 'live', label: 'Live (30s)', interval: UPDATE_INTERVALS.live },
  { value: 'minute', label: '1 Minute', interval: UPDATE_INTERVALS.frequent },
  { value: 'hour', label: 'Last Hour', interval: UPDATE_INTERVALS.normal },
  { value: 'today', label: 'Today', interval: UPDATE_INTERVALS.normal },
  { value: 'current_month', label: 'This Month', interval: UPDATE_INTERVALS.normal },
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

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Enhanced Financial Filters Component
 */
const FinancialFilters = ({ 
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
            <Typography variant="h6">Financial Analysis Filters</Typography>
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
                  {REALTIME_PERIODS.map((period) => (
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

            {/* Metric Focus */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Focus Area</InputLabel>
                <Select
                  value={filters.focus}
                  onChange={(e) => handleFilterChange('focus', e.target.value)}
                  label="Focus Area"
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="revenue">Revenue Focus</MenuItem>
                  <MenuItem value="cash_flow">Cash Flow</MenuItem>
                  <MenuItem value="alerts">Alerts Only</MenuItem>
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
 * Real-time status indicator
 */
const RealTimeStatusIndicator = ({ isLive, lastUpdate, updateInterval }) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceUpdate(Date.now() - lastUpdate);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const getStatusColor = () => {
    if (!isLive) return 'default';
    if (timeSinceUpdate < updateInterval * 1.5) return 'success';
    if (timeSinceUpdate < updateInterval * 2) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Badge
        variant="dot"
        color={getStatusColor()}
        sx={{
          '& .MuiBadge-badge': {
            animation: isLive && getStatusColor() === 'success' ? 'pulse 2s infinite' : 'none',
          },
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {isLive ? 'LIVE' : 'OFFLINE'}
        </Typography>
      </Badge>
      <Typography variant="caption" color="text.secondary">
        Updated {Math.floor(timeSinceUpdate / 1000)}s ago
      </Typography>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

/**
 * Financial metric card with real-time indicators
 */
const FinancialMetricCard = ({ 
  title, 
  value, 
  previousValue,
  target,
  unit = 'currency', 
  icon: Icon, 
  color = 'primary',
  loading = false,
  trend = null,
  isRealTime = false,
  alertLevel = null,
}) => {
  const theme = useTheme();
  
  // Calculate trend and variance
  const calculatedTrend = useMemo(() => {
    if (!previousValue || !value) return null;
    const change = calculatePercentageChange(value, previousValue);
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(change),
      value: value - previousValue,
    };
  }, [value, previousValue]);

  const targetVariance = useMemo(() => {
    if (!target || !value) return null;
    return calculatePercentageChange(value, target);
  }, [value, target]);

  const displayTrend = trend || calculatedTrend;

  const getTrendIcon = () => {
    if (!displayTrend) return null;
    switch (displayTrend.direction) {
      case 'up': return <ArrowUpward fontSize="small" color="success" />;
      case 'down': return <ArrowDownward fontSize="small" color="error" />;
      default: return <SwapHoriz fontSize="small" color="info" />;
    }
  };

  const getAlertColor = () => {
    if (alertLevel === 'critical') return 'error';
    if (alertLevel === 'warning') return 'warning';
    return color;
  };

  const formatValue = () => {
    if (loading) return <CircularProgress size={20} />;
    if (unit === 'currency') return formatCurrency(value);
    if (unit === 'percentage') return formatPercentage(value);
    if (unit === 'number') return (value || 0).toLocaleString();
    return `${value}${unit}`;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative',
        border: alertLevel ? `2px solid ${theme.palette[getAlertColor()].main}` : 'none',
        boxShadow: alertLevel ? theme.shadows[4] : theme.shadows[1],
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              {isRealTime && (
                <Chip label="LIVE" size="small" color="success" variant="outlined" />
              )}
            </Box>
            
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {formatValue()}
            </Typography>
            
            {target && (
              <Typography variant="caption" color="text.secondary">
                Target: {formatCurrency(target)}
              </Typography>
            )}
          </Box>
          
          <Avatar 
            sx={{ 
              bgcolor: `${getAlertColor()}.main`, 
              width: 48, 
              height: 48,
              ml: 2,
            }}
          >
            <Icon />
          </Avatar>
        </Box>

        {/* Trend Display */}
        {displayTrend && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getTrendIcon()}
              <Typography 
                variant="body2" 
                sx={{ 
                  ml: 0.5,
                  color: displayTrend.direction === 'up' ? 'success.main' : 
                         displayTrend.direction === 'down' ? 'error.main' : 'text.secondary'
                }}
              >
                {formatPercentage(displayTrend.percentage, 1)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs previous
            </Typography>
          </Box>
        )}

        {/* Target Variance */}
        {targetVariance !== null && !loading && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.abs(targetVariance), 100)}
              color={Math.abs(targetVariance) <= 5 ? 'success' : Math.abs(targetVariance) <= 15 ? 'warning' : 'error'}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {targetVariance > 0 ? 'Above' : 'Below'} target by {formatPercentage(Math.abs(targetVariance))}
            </Typography>
          </Box>
        )}

        {/* Alert Indicator */}
        {alertLevel && (
          <Alert severity={alertLevel} sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              {alertLevel === 'critical' ? 'Immediate attention required' : 'Monitor closely'}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Cash flow indicator component
 */
const CashFlowIndicator = ({ revenue, expenses, netFlow, loading = false }) => {
  const getFlowColor = (flow) => {
    if (flow > 0) return 'success';
    if (flow < 0) return 'error';
    return 'info';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cash Flow Status
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <ArrowDownward color="success" sx={{ fontSize: 32 }} />
                <Typography variant="h6" color="success.main">
                  {formatCurrency(revenue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revenue
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <ArrowUpward color="error" sx={{ fontSize: 32 }} />
                <Typography variant="h6" color="error.main">
                  {formatCurrency(expenses)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Expenses
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <SwapHoriz color={getFlowColor(netFlow)} sx={{ fontSize: 32 }} />
                <Typography variant="h6" color={`${getFlowColor(netFlow)}.main`}>
                  {formatCurrency(netFlow)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Net Flow
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN REAL-TIME FINANCIAL DASHBOARD COMPONENT
// =============================================================================

const RealTimeFinancialDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false); // Start with false
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [updateInterval, setUpdateInterval] = useState(UPDATE_INTERVALS.normal);
  
  // Enhanced filters state
  const [filters, setFilters] = useState({
    period: 'current_month',
    startDate: null,
    endDate: null,
    project: 'all',
    focus: 'all',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  
  // Financial data state - FIXED to match actual API response
  const [financialData, setFinancialData] = useState({
    kpis: [],
    alerts: [],
    revenue: {},
    sales: {},
    leads: {},
    cashFlow: {},
    trends: [],
    recentActivities: [],
    projections: {},
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    comprehensive: true,
    revenue: true,
    cashFlow: true,
    alerts: true,
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

    // Add focus filter
    if (filters.focus !== 'all') {
      params.focus = filters.focus;
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
    refreshFinancialData();
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
      focus: 'all',
    });
  };

  // =============================================================================
  // DATA FETCHING FUNCTIONS - FIXED FOR ACTUAL API STRUCTURE
  // =============================================================================

  /**
   * Fetch filter options (projects)
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
   * Fetch financial dashboard KPIs - FIXED for actual API response
   */
  const fetchFinancialDashboard = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, dashboard: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getBudgetDashboard for financial data with params:', params);
      
      const response = await budgetVsActualAPI.getBudgetDashboard(params);
      console.log('✅ Financial Dashboard API Response:', response.data);

      // FIXED: Parse actual API response structure
      const dashboardData = response.data?.data || {};
      
      setFinancialData(prev => ({
        ...prev,
        kpis: dashboardData.kpis || [],
        alerts: dashboardData.alerts || [],
        projections: dashboardData.projections || {},
      }));

    } catch (error) {
      console.error('Error fetching financial dashboard:', error);
      setError(`Failed to load financial dashboard: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, dashboard: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch comprehensive financial report - FIXED for actual API response
   */
  const fetchComprehensiveFinancialReport = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, comprehensive: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getBudgetVsActual for comprehensive financial data with params:', params);
      
      const response = await budgetVsActualAPI.getBudgetVsActual(params);
      console.log('✅ Comprehensive Financial Report API Response:', response.data);

      // FIXED: Parse actual API response structure
      const reportData = response.data?.data || {};
      
      // Calculate cash flow from revenue and estimated expenses
      const totalRevenue = reportData.revenue?.actual?.totalRevenue || 0;
      const estimatedExpenses = totalRevenue * 0.3; // Estimate 30% expenses
      const netCashFlow = totalRevenue - estimatedExpenses;

      setFinancialData(prev => ({
        ...prev,
        revenue: reportData.revenue || {},
        sales: reportData.sales || {},
        leads: reportData.leads || {},
        cashFlow: {
          inflow: totalRevenue,
          outflow: estimatedExpenses,
          netFlow: netCashFlow,
        },
      }));

    } catch (error) {
      console.error('Error fetching comprehensive financial report:', error);
      setError(`Failed to load comprehensive financial report: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, comprehensive: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch revenue trends - FIXED for actual API response
   */
  const fetchRevenueTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, revenue: true }));
      
      const params = { ...getApiParams(), include: 'trends,projections' };
      console.log('🔄 Calling budgetVsActualAPI.getRevenueAnalysis for trends with params:', params);
      
      const response = await budgetVsActualAPI.getRevenueAnalysis(params);
      console.log('✅ Revenue Trends API Response:', response.data);

      // FIXED: Parse actual API response structure
      const revenueData = response.data?.data || {};
      
      // Transform monthly trend data for charts
      const trends = [];
      if (revenueData.revenue?.trend?.monthly) {
        trends.push(...revenueData.revenue.trend.monthly.map(item => ({
          period: `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`,
          revenue: item.revenue || 0,
          salesCount: item.salesCount || 0,
          // Estimate expenses and profit
          expenses: (item.revenue || 0) * 0.3,
          profit: (item.revenue || 0) * 0.7,
        })));
      }

      setFinancialData(prev => ({
        ...prev,
        trends,
      }));

    } catch (error) {
      console.error('Error fetching revenue trends:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, revenue: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all financial data
   */
  const refreshFinancialData = useCallback(async () => {
    console.log('🔄 Starting financial dashboard refresh with filters:', filters);
    setLoading(true);
    setError(null);
    setLastUpdated(Date.now());

    try {
      await Promise.all([
        fetchFinancialDashboard(),
        fetchComprehensiveFinancialReport(),
        fetchRevenueTrends(),
      ]);
      
      console.log('✅ Financial dashboard refresh completed successfully');
    } catch (error) {
      console.error('❌ Error refreshing financial dashboard:', error);
      setError('Failed to refresh financial data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchFinancialDashboard,
    fetchComprehensiveFinancialReport,
    fetchRevenueTrends,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Financial Dashboard initializing...');
    fetchFilterOptions();
    refreshFinancialData();
  }, []);

  // Refresh data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshFinancialData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Auto-refresh based on selected period
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(refreshFinancialData, updateInterval);
    return () => clearInterval(interval);
  }, [isLiveMode, updateInterval, refreshFinancialData]);

  // Update interval when period changes
  useEffect(() => {
    const period = REALTIME_PERIODS.find(p => p.value === filters.period);
    if (period) {
      setUpdateInterval(period.interval);
    }
  }, [filters.period]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleLiveModeToggle = (event) => {
    setIsLiveMode(event.target.checked);
    if (event.target.checked) {
      refreshFinancialData();
    }
  };

  const handleManualRefresh = () => {
    refreshFinancialData();
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render financial KPI metrics - FIXED for actual data structure
   */
  const renderFinancialKPIs = () => {
    // Get cash alert level
    const getCashAlert = () => {
      const balance = financialData.cashFlow.netFlow || 0;
      if (balance < FINANCIAL_THRESHOLDS.cashFlow.critical) return 'critical';
      if (balance < FINANCIAL_THRESHOLDS.cashFlow.warning) return 'warning';
      return null;
    };

    // Extract values from actual API data
    const totalRevenue = financialData.revenue?.actual?.totalRevenue || 0;
    const previousRevenue = financialData.revenue?.trend?.monthly?.[0]?.revenue || 0;
    const targetRevenue = financialData.revenue?.target?.totalRevenue || 0;
    
    const totalExpenses = financialData.cashFlow.outflow || 0;
    const netProfit = financialData.cashFlow.netFlow || 0;
    const cashBalance = netProfit; // Use net profit as cash balance approximation

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialMetricCard
            title="Total Revenue"
            value={totalRevenue}
            previousValue={previousRevenue}
            target={targetRevenue}
            unit="currency"
            icon={MonetizationOn}
            color="success"
            loading={loadingStates.dashboard}
            isRealTime={isLiveMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FinancialMetricCard
            title="Total Expenses"
            value={totalExpenses}
            previousValue={previousRevenue * 0.3} // Estimate previous expenses
            unit="currency"
            icon={PaymentOutlined}
            color="error"
            loading={loadingStates.dashboard}
            isRealTime={isLiveMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FinancialMetricCard
            title="Net Profit"
            value={netProfit}
            previousValue={previousRevenue * 0.7} // Estimate previous profit
            unit="currency"
            icon={TrendingUp}
            color="primary"
            loading={loadingStates.dashboard}
            isRealTime={isLiveMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FinancialMetricCard
            title="Cash Flow"
            value={cashBalance}
            previousValue={previousRevenue * 0.7} // Estimate previous cash flow
            unit="currency"
            icon={AccountBalanceWallet}
            color="info"
            loading={loadingStates.dashboard}
            isRealTime={isLiveMode}
            alertLevel={getCashAlert()}
          />
        </Grid>
      </Grid>
    );
  };

  /**
   * Render financial trends chart - FIXED for actual data structure
   */
  const renderFinancialTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Financial Trends
        </Typography>
        
        {loadingStates.revenue ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : financialData.trends.length === 0 ? (
          <Alert severity="info">
            No trend data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={financialData.trends}>
              <XAxis dataKey="period" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  formatCurrency(value), 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke={FINANCIAL_COLORS.positive}
                fill={FINANCIAL_COLORS.positive}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="2"
                stroke={FINANCIAL_COLORS.negative}
                fill={FINANCIAL_COLORS.negative}
                fillOpacity={0.6}
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke={FINANCIAL_COLORS.neutral}
                strokeWidth={3}
                name="Net Profit"
              />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render financial alerts - FIXED for actual data structure
   */
  const renderFinancialAlerts = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Financial Alerts
          </Typography>
          <Badge badgeContent={financialData.alerts.length} color="error">
            <NotificationsActive />
          </Badge>
        </Box>
        
        {loadingStates.dashboard ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : financialData.alerts.length === 0 ? (
          <Alert severity="success">
            No financial alerts at this time. All metrics are within normal thresholds.
          </Alert>
        ) : (
          <List>
            {financialData.alerts.slice(0, 5).map((alert, index) => (
              <ListItem key={index} divider={index < Math.min(financialData.alerts.length, 5) - 1}>
                <ListItemIcon>
                  {alert.type === 'critical' ? 
                    <Error color="error" /> : 
                    <Warning color="warning" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={alert.category?.toUpperCase() + ' Alert'}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Impact: {alert.impact}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render financial projections
   */
  const renderProjections = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Financial Projections
        </Typography>
        
        {financialData.projections?.endOfYear ? (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {formatCurrency(financialData.projections.endOfYear.projectedRevenue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Projected Revenue
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="success.main">
                  {Math.round(financialData.projections.endOfYear.projectedSales)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Projected Sales
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="info.main">
                  {formatPercentage(financialData.projections.confidence)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Confidence Level
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No projection data available for the selected period.
          </Typography>
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
                Real-time Financial Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Live financial monitoring with real-time KPIs, cash flow tracking, and alerts
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Live Mode Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isLiveMode}
                    onChange={handleLiveModeToggle}
                    color="primary"
                  />
                }
                label="Live Mode"
              />
              
              {/* Manual Refresh Button */}
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={handleManualRefresh} 
                  disabled={loading}
                  color="primary"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Real-time Status */}
          <RealTimeStatusIndicator 
            isLive={isLiveMode} 
            lastUpdate={lastUpdated} 
            updateInterval={updateInterval}
          />
        </Box>

        {/* Enhanced Filters */}
        <FinancialFilters
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
            {error}
          </Alert>
        )}

        {/* Main Dashboard Content */}
        <Grid container spacing={3}>
          {/* Financial KPIs Row */}
          <Grid item xs={12}>
            {renderFinancialKPIs()}
          </Grid>

          {/* Cash Flow Indicator */}
          <Grid item xs={12} md={4}>
            <CashFlowIndicator
              revenue={financialData.cashFlow.inflow}
              expenses={financialData.cashFlow.outflow}
              netFlow={financialData.cashFlow.netFlow}
              loading={loadingStates.comprehensive}
            />
          </Grid>

          {/* Financial Projections */}
          <Grid item xs={12} md={4}>
            {renderProjections()}
          </Grid>

          {/* Financial Alerts */}
          <Grid item xs={12} md={4}>
            {renderFinancialAlerts()}
          </Grid>

          {/* Financial Trends */}
          <Grid item xs={12}>
            {renderFinancialTrends()}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default RealTimeFinancialDashboard;
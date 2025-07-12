// File: src/pages/analytics/BudgetVsActualDashboard.js
// Description: FIXED Budget vs Actual Dashboard with proper API data structure
// Version: 1.1 - Fixed to work with actual API responses and added filtering
// Location: src/pages/analytics/BudgetVsActualDashboard.js

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
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, projectAPI } from '../../services/api';

// =============================================================================
// DASHBOARD CONFIGURATION
// =============================================================================

/**
 * Budget analysis configuration
 */
const ANALYSIS_PERIODS = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'current_quarter', label: 'Current Quarter' },
  { value: 'current_year', label: 'Current Year' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Variance thresholds for alerts
 */
const VARIANCE_THRESHOLDS = {
  critical: 20, // 20% variance
  warning: 10,  // 10% variance
  good: 5,      // 5% variance
};

/**
 * Color system for budget indicators
 */
const BUDGET_COLORS = {
  onTrack: '#2e7d32',      // Green
  warning: '#ed6c02',       // Orange
  critical: '#d32f2f',     // Red
  exceeded: '#9c27b0',     // Purple
  target: '#1976d2',       // Blue
  actual: '#dc004e',       // Pink
};

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

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Enhanced Filters Component for Budget Dashboard
 */
const BudgetFilters = ({ 
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
            <Typography variant="h6">Budget Analysis Filters</Typography>
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
                  {ANALYSIS_PERIODS.map((period) => (
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

            {/* Analysis Type */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Analysis Type</InputLabel>
                <Select
                  value={filters.analysisType}
                  onChange={(e) => handleFilterChange('analysisType', e.target.value)}
                  label="Analysis Type"
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="revenue">Revenue Only</MenuItem>
                  <MenuItem value="sales">Sales Performance</MenuItem>
                  <MenuItem value="leads">Lead Generation</MenuItem>
                  <MenuItem value="marketing">Marketing ROI</MenuItem>
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
 * Budget status indicator component
 */
const BudgetStatusIndicator = ({ variance, size = 'medium' }) => {
  const getStatus = () => {
    const absVariance = Math.abs(variance);
    if (absVariance <= VARIANCE_THRESHOLDS.good) return 'onTrack';
    if (absVariance <= VARIANCE_THRESHOLDS.warning) return 'warning';
    return 'critical';
  };

  const getIcon = () => {
    const status = getStatus();
    switch (status) {
      case 'onTrack': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <Info />;
    }
  };

  const status = getStatus();
  const iconSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;

  return (
    <Tooltip title={`Variance: ${formatPercentage(variance)}`}>
      <Avatar 
        sx={{ 
          bgcolor: BUDGET_COLORS[status], 
          width: iconSize + 8, 
          height: iconSize + 8,
        }}
      >
        {React.cloneElement(getIcon(), { fontSize: size })}
      </Avatar>
    </Tooltip>
  );
};

/**
 * KPI metric card for budget dashboard
 */
const BudgetKPICard = ({ 
  kpi,
  loading = false,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ahead': return 'success';
      case 'behind': return 'error';
      case 'on_track': return 'info';
      default: return 'warning';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="info" />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {kpi.name}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {loading ? <CircularProgress size={20} /> : `${kpi.value?.toFixed(1)}${kpi.unit}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target: {kpi.target}{kpi.unit}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Chip
              label={kpi.status?.replace('_', ' ').toUpperCase()}
              color={getStatusColor(kpi.status)}
              size="small"
            />
            {getTrendIcon(kpi.trend)}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((kpi.value / kpi.target) * 100, 100)}
            color={getStatusColor(kpi.status)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {formatPercentage((kpi.value / kpi.target) * 100)} of target achieved
        </Typography>
      </CardContent>
    </Card>
  );
};

/**
 * Budget alert card component
 */
const BudgetAlertCard = ({ alert, onDismiss }) => {
  const getSeverityColor = (type) => {
    switch (type) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'critical': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <Info />;
    }
  };

  return (
    <Alert 
      severity={getSeverityColor(alert.type)}
      icon={getSeverityIcon(alert.type)}
      onClose={onDismiss}
      sx={{ mb: 1 }}
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {alert.category?.toUpperCase()} Alert
        </Typography>
        <Typography variant="body2">
          {alert.message}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Impact: {alert.impact}
        </Typography>
      </Box>
    </Alert>
  );
};

// =============================================================================
// MAIN BUDGET VS ACTUAL DASHBOARD COMPONENT
// =============================================================================

const BudgetVsActualDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Enhanced filters state
  const [filters, setFilters] = useState({
    period: 'current_month',
    startDate: null,
    endDate: null,
    project: 'all',
    analysisType: 'all',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  
  // Dashboard data state - FIXED to match actual API response
  const [budgetData, setBudgetData] = useState({
    kpis: [],
    alerts: [],
    insights: [],
    quickActions: [],
    projections: {},
    revenue: {},
    sales: {},
    leads: {},
    projects: [],
    trends: [],
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    comprehensive: true,
    revenue: true,
    projects: true,
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
    refreshDashboard();
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
      analysisType: 'all',
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
   * Fetch budget dashboard KPIs - FIXED for actual API response
   */
  const fetchBudgetDashboard = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, dashboard: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getBudgetDashboard with params:', params);
      
      const response = await budgetVsActualAPI.getBudgetDashboard(params);
      console.log('✅ Budget Dashboard API Response:', response.data);

      // FIXED: Parse actual API response structure
      const dashboardData = response.data?.data || {};
      
      setBudgetData(prev => ({
        ...prev,
        kpis: dashboardData.kpis || [],
        alerts: dashboardData.alerts || [],
        insights: dashboardData.topInsights || [],
        quickActions: dashboardData.quickActions || [],
        projections: dashboardData.projections || {},
      }));

    } catch (error) {
      console.error('Error fetching budget dashboard:', error);
      setError(`Failed to load budget dashboard: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, dashboard: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch comprehensive budget vs actual report - FIXED for actual API response
   */
  const fetchComprehensiveReport = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, comprehensive: true }));
      
      const params = { ...getApiParams(), include: 'variance,analysis' };
      console.log('🔄 Calling budgetVsActualAPI.getBudgetVsActual with params:', params);
      
      const response = await budgetVsActualAPI.getBudgetVsActual(params);
      console.log('✅ Comprehensive Report API Response:', response.data);

      // FIXED: Parse actual API response structure
      const reportData = response.data?.data || {};
      
      setBudgetData(prev => ({
        ...prev,
        revenue: reportData.revenue || {},
        sales: reportData.sales || {},
        leads: reportData.leads || {},
        projects: reportData.projects || [],
      }));

    } catch (error) {
      console.error('Error fetching comprehensive report:', error);
      setError(`Failed to load comprehensive report: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, comprehensive: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch revenue analysis trends - FIXED for actual API response
   */
  const fetchRevenueTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, revenue: true }));
      
      const params = { ...getApiParams(), include: 'trends,projections' };
      console.log('🔄 Calling budgetVsActualAPI.getRevenueAnalysis with params:', params);
      
      const response = await budgetVsActualAPI.getRevenueAnalysis(params);
      console.log('✅ Revenue Analysis API Response:', response.data);

      // FIXED: Parse actual API response structure
      const revenueData = response.data?.data || {};
      
      // Transform monthly trend data for charts
      const trends = [];
      if (revenueData.revenue?.trend?.monthly) {
        trends.push(...revenueData.revenue.trend.monthly.map(item => ({
          period: `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`,
          revenue: item.revenue || 0,
          salesCount: item.salesCount || 0,
        })));
      }

      setBudgetData(prev => ({
        ...prev,
        trends,
        revenue: { ...prev.revenue, ...revenueData.revenue },
      }));

    } catch (error) {
      console.error('Error fetching revenue trends:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, revenue: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch project comparison - FIXED for actual API response
   */
  const fetchProjectComparison = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const params = { ...getApiParams(), include: 'budget,variance,performance' };
      console.log('🔄 Calling budgetVsActualAPI.getProjectComparison with params:', params);
      
      const response = await budgetVsActualAPI.getProjectComparison(params);
      console.log('✅ Project Comparison API Response:', response.data);

      // FIXED: Parse actual API response structure
      const projectsData = response.data?.data?.projects || [];
      
      setBudgetData(prev => ({
        ...prev,
        projects: projectsData,
      }));

    } catch (error) {
      console.error('Error fetching project comparison:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all budget data
   */
  const refreshDashboard = useCallback(async () => {
    console.log('🔄 Starting budget dashboard refresh with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchBudgetDashboard(),
        fetchComprehensiveReport(),
        fetchRevenueTrends(),
        fetchProjectComparison(),
      ]);
      
      console.log('✅ Budget dashboard refresh completed successfully');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing budget dashboard:', error);
      setError('Failed to refresh budget data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchBudgetDashboard,
    fetchComprehensiveReport,
    fetchRevenueTrends,
    fetchProjectComparison,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Budget Dashboard initializing...');
    fetchFilterOptions();
    refreshDashboard();
  }, []);

  // Refresh data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshDashboard();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const dismissAlert = (alertIndex) => {
    setBudgetData(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, index) => index !== alertIndex)
    }));
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render KPI metrics dashboard - FIXED for actual data structure
   */
  const renderKPIDashboard = () => (
    <Grid container spacing={3}>
      {budgetData.kpis.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <BudgetKPICard
            kpi={kpi}
            loading={loadingStates.dashboard}
          />
        </Grid>
      ))}
    </Grid>
  );

  /**
   * Render budget vs actual trends chart - FIXED for actual data structure
   */
  const renderBudgetTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Revenue Trends
        </Typography>
        
        {loadingStates.revenue ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : budgetData.trends.length === 0 ? (
          <Alert severity="info">
            No trend data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={budgetData.trends}>
              <XAxis dataKey="period" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Sales Count'
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke={BUDGET_COLORS.target}
                fill={BUDGET_COLORS.target}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="salesCount" 
                stackId="2"
                stroke={BUDGET_COLORS.actual}
                fill={BUDGET_COLORS.actual}
                fillOpacity={0.6}
                name="Sales Count"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render project comparison - FIXED for actual data structure
   */
  const renderProjectComparison = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Project Performance Comparison
        </Typography>
        
        {loadingStates.projects ? (
          <Box>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={80} sx={{ mb: 2 }} />
            ))}
          </Box>
        ) : budgetData.projects.length === 0 ? (
          <Alert severity="info">
            No project data available for the selected period.
          </Alert>
        ) : (
          <List>
            {budgetData.projects.map((project, index) => {
              const variance = project.targetRevenue > 0 ? 
                ((project.actualRevenue - project.targetRevenue) / project.targetRevenue) * 100 : 0;
              
              return (
                <ListItem 
                  key={project._id || index} 
                  divider={index < budgetData.projects.length - 1}
                  sx={{ py: 2 }}
                >
                  <ListItemAvatar>
                    <BudgetStatusIndicator variance={variance} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={`${variance >= 0 ? '+' : ''}${formatPercentage(variance)}`}
                          color={Math.abs(variance) <= VARIANCE_THRESHOLDS.good ? 'success' : 
                                 Math.abs(variance) <= VARIANCE_THRESHOLDS.warning ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Target: {formatCurrency(project.targetRevenue)} | 
                          Actual: {formatCurrency(project.actualRevenue)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((project.actualRevenue / project.targetRevenue) * 100, 100)}
                          color={Math.abs(variance) > VARIANCE_THRESHOLDS.warning ? 'error' : 'success'}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render budget alerts - FIXED for actual data structure
   */
  const renderBudgetAlerts = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Budget Alerts
          </Typography>
          <Badge badgeContent={budgetData.alerts.length} color="error">
            <NotificationsActive />
          </Badge>
        </Box>
        
        {loadingStates.dashboard ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : budgetData.alerts.length === 0 ? (
          <Alert severity="success">
            No budget alerts at this time. All metrics are within acceptable variance thresholds.
          </Alert>
        ) : (
          <Box>
            {budgetData.alerts.map((alert, index) => (
              <BudgetAlertCard
                key={index}
                alert={alert}
                onDismiss={() => dismissAlert(index)}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render quick insights and actions
   */
  const renderInsightsAndActions = () => (
    <Grid container spacing={3}>
      {/* Top Insights */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Insights
            </Typography>
            {budgetData.insights.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No insights available for the selected period.
              </Typography>
            ) : (
              <List>
                {budgetData.insights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Insights color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recommended Actions
            </Typography>
            {budgetData.quickActions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recommended actions at this time.
              </Typography>
            ) : (
              <List>
                {budgetData.quickActions.map((action, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Flag />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={action.action}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Priority: {action.priority} | Impact: {action.estimatedImpact}
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
      </Grid>
    </Grid>
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
                Budget vs Actual Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time budget tracking and variance analysis with comprehensive filtering
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Refresh Button */}
              <Tooltip title="Refresh Dashboard">
                <IconButton 
                  onClick={refreshDashboard} 
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
            <br />
            Active Filters: {Object.entries(filters).filter(([key, value]) => 
              value && value !== 'all' && value !== ''
            ).length} filters applied
          </Typography>
        </Box>

        {/* Enhanced Filters */}
        <BudgetFilters
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
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="budget analysis tabs">
            <Tab label="Dashboard Overview" />
            <Tab label="Revenue Trends" />
            <Tab label="Project Analysis" />
            <Tab label="Insights & Actions" />
            <Tab label="Alerts" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Dashboard Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderKPIDashboard()}
              </Grid>
              <Grid item xs={12} lg={8}>
                {renderBudgetTrends()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderBudgetAlerts()}
              </Grid>
            </Grid>
          )}

          {/* Revenue Trends Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderBudgetTrends()}
              </Grid>
              <Grid item xs={12}>
                {renderKPIDashboard()}
              </Grid>
            </Grid>
          )}

          {/* Project Analysis Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderProjectComparison()}
              </Grid>
            </Grid>
          )}

          {/* Insights & Actions Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderInsightsAndActions()}
              </Grid>
            </Grid>
          )}

          {/* Alerts Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderBudgetAlerts()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default BudgetVsActualDashboard;
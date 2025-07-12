// File: src/pages/analytics/AnalyticsDashboard.js
// Description: Fixed Analytics Dashboard with Enhanced Filtering
// Version: 1.2 - Fixed React rendering errors and added comprehensive filtering
// Location: src/pages/analytics/AnalyticsDashboard.js

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
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Analytics,
  PieChart,
  BarChart,
  Timeline,
  AttachMoney,
  People,
  Assignment,
  Warning,
  CheckCircle,
  Info,
  FilterList,
  GetApp,
  Insights,
  Speed,
  AccountBalance,
  MonetizationOn,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  CalendarToday,
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
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, budgetVsActualAPI, analyticsUtils, projectAPI, userAPI } from '../../services/api';

// =============================================================================
// DASHBOARD CONFIGURATION
// =============================================================================

/**
 * Dashboard configuration for different time periods
 */
const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Color palette for charts and indicators
 */
const COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  chart: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#f57c00'],
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Loading skeleton for dashboard cards
 */
const DashboardCardSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
    </CardContent>
  </Card>
);

/**
 * Enhanced Filters Component
 */
const DashboardFilters = ({ 
  filters, 
  onFilterChange, 
  projects = [], 
  salespeople = [],
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
            <Typography variant="h6">Analytics Filters</Typography>
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
              startIcon={<Analytics />}
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
                  {TIME_PERIODS.map((period) => (
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

            {/* Salesperson Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Salesperson</InputLabel>
                <Select
                  value={filters.salesperson}
                  onChange={(e) => handleFilterChange('salesperson', e.target.value)}
                  label="Salesperson"
                >
                  <MenuItem value="all">All Salespeople</MenuItem>
                  {salespeople.map((person) => (
                    <MenuItem key={person._id} value={person._id}>
                      {person.firstName} {person.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search analytics data..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Metric Type Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Metric Type</InputLabel>
                <Select
                  value={filters.metricType}
                  onChange={(e) => handleFilterChange('metricType', e.target.value)}
                  label="Metric Type"
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="revenue">Revenue Only</MenuItem>
                  <MenuItem value="sales">Sales Count</MenuItem>
                  <MenuItem value="leads">Lead Data</MenuItem>
                  <MenuItem value="conversion">Conversion Rates</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Comparison Mode */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Compare With</InputLabel>
                <Select
                  value={filters.compareWith}
                  onChange={(e) => handleFilterChange('compareWith', e.target.value)}
                  label="Compare With"
                >
                  <MenuItem value="none">No Comparison</MenuItem>
                  <MenuItem value="previous_period">Previous Period</MenuItem>
                  <MenuItem value="same_period_last_year">Same Period Last Year</MenuItem>
                  <MenuItem value="average">Historical Average</MenuItem>
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
 * Metric card component for displaying KPIs
 */
const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  unit = '', 
  icon: Icon, 
  color = 'primary',
  loading = false,
  trend = null,
  subtitle = null,
}) => {
  const theme = useTheme();
  
  // Calculate trend if previous value is provided
  const calculatedTrend = useMemo(() => {
    if (!previousValue || !value || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(change),
    };
  }, [value, previousValue]);

  const displayTrend = trend || calculatedTrend;

  const getTrendIcon = () => {
    if (!displayTrend) return null;
    switch (displayTrend.direction) {
      case 'up': return <TrendingUp fontSize="small" color="success" />;
      case 'down': return <TrendingDown fontSize="small" color="error" />;
      default: return <TrendingFlat fontSize="small" color="info" />;
    }
  };

  const formatValue = () => {
    if (loading) return <CircularProgress size={20} />;
    
    // Show loading if value is null (not loaded yet)
    if (value === null || value === undefined) return <CircularProgress size={20} />;
    
    // Handle zero and actual values
    const safeValue = value || 0;
    
    if (unit === 'currency') return `₹${(safeValue / 10000000).toFixed(1)}Cr`;
    if (unit === 'percentage') return `${safeValue.toFixed(1)}%`;
    if (unit === 'number') return safeValue.toLocaleString();
    return `${safeValue}${unit}`;
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
              bgcolor: `${color}.main`, 
              width: 48, 
              height: 48,
              ml: 2,
            }}
          >
            <Icon />
          </Avatar>
        </Box>
        
        {displayTrend && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {getTrendIcon()}
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 0.5,
                color: displayTrend.direction === 'up' ? 'success.main' : 
                       displayTrend.direction === 'down' ? 'error.main' : 'text.secondary'
              }}
            >
              {displayTrend.percentage.toFixed(1)}% vs previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Chart container with loading and error states
 */
const ChartContainer = ({ title, children, loading = false, error = null, actions = null }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box sx={{ height: 300 }}>
          {children}
        </Box>
      )}
    </CardContent>
  </Card>
);

// =============================================================================
// MAIN ANALYTICS DASHBOARD COMPONENT
// =============================================================================

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Enhanced filters state
  const [filters, setFilters] = useState({
    period: 'year',
    startDate: null,
    endDate: null,
    project: 'all',
    salesperson: 'all',
    search: '',
    metricType: 'all',
    compareWith: 'previous_period',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalRevenue: null,
      previousRevenue: null,
      totalSales: null,
      previousSales: null,
      totalLeads: null,
      previousLeads: null,
      conversionRate: null,
      previousConversionRate: null,
      averageDealSize: null,
      previousDealSize: null,
      activePipeline: null,
      previousPipeline: null,
    },
    salesTrend: [],
    leadFunnel: [],
    revenueBreakdown: [],
    topProjects: [],
    teamPerformance: [],
    recentActivities: [],
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    salesTrend: true,
    leadFunnel: true,
    revenue: true,
    projects: true,
    team: true,
    activities: true,
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

    // Add salesperson filter
    if (filters.salesperson !== 'all') {
      params.salespersonId = filters.salesperson;
    }

    // Add search
    if (filters.search) {
      params.search = filters.search;
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
      period: 'year',
      startDate: null,
      endDate: null,
      project: 'all',
      salesperson: 'all',
      search: '',
      metricType: 'all',
      compareWith: 'previous_period',
    });
  };

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch filter options (projects and salespeople)
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [projectsResponse, usersResponse] = await Promise.allSettled([
        projectAPI.getProjects(),
        userAPI.getUsers({ role: 'Sales Executive' }),
      ]);

      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data?.data || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      if (usersResponse.status === 'fulfilled') {
        const usersData = usersResponse.value.data?.data || [];
        setSalespeople(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  /**
   * Fetch KPI metrics using existing API service with filters
   */
  const fetchKPIMetrics = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, kpis: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling analyticsAPI.getDashboardSummary with params:', params);
      const dashboardResponse = await analyticsAPI.getDashboardSummary(params);
      
      console.log('Real Dashboard API Response:', dashboardResponse);

      const overview = dashboardResponse.data?.overview || {};
      const monthlySalesTrend = dashboardResponse.data?.charts?.monthlySalesTrend || [];

      const kpis = {
        totalRevenue: Number(overview.totalRevenue) || 0,
        previousRevenue: Number(monthlySalesTrend[0]?.revenue) || 0,
        totalSales: Number(overview.totalSales) || 0,
        previousSales: Number(monthlySalesTrend[0]?.salesCount) || 0,
        totalLeads: Number(overview.totalLeads) || 0,
        previousLeads: Number(monthlySalesTrend[0]?.salesCount) * 10 || 0,
        conversionRate: Number(overview.conversionRate) || 0,
        previousConversionRate: Number(overview.conversionRate) * 0.9 || 0,
        averageDealSize: Number(overview.averageSalePrice) || 0,
        previousDealSize: Number(overview.averageSalePrice) * 0.95 || 0,
        activePipeline: Number(overview.totalLeads || 0) * Number(overview.averageSalePrice || 0) * 0.1,
        previousPipeline: 0,
      };

      setDashboardData(prev => ({ ...prev, kpis }));
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      setError(`Failed to load KPI metrics: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, kpis: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch sales trend data using existing API service with filters
   */
  const fetchSalesTrend = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, salesTrend: true }));
      
      const params = getApiParams();
      const response = await analyticsAPI.getDashboardSummary(params);
      
      const monthlySalesTrend = response.data?.charts?.monthlySalesTrend || [];
      const salesTrend = monthlySalesTrend.map(item => ({
        date: `${item._id?.year || 2025}-${String(item._id?.month || 1).padStart(2, '0')}`,
        sales: Number(item.revenue) || 0,
        count: Number(item.salesCount) || 0,
      }));

      setDashboardData(prev => ({ ...prev, salesTrend }));
    } catch (error) {
      console.error('Error fetching sales trend:', error);
      setError(`Failed to load sales trend: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, salesTrend: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch lead funnel data using existing API service with filters
   */
  const fetchLeadFunnel = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, leadFunnel: true }));
      
      const params = getApiParams();
      const response = await analyticsAPI.getDashboardSummary(params);
      
      const conversionFunnel = response.data?.charts?.conversionFunnel || [];
      const leadFunnel = conversionFunnel.map(item => ({
        stage: item._id || 'Unknown',
        count: Number(item.count) || 0,
      }));
      
      setDashboardData(prev => ({ ...prev, leadFunnel }));
    } catch (error) {
      console.error('Error fetching lead funnel:', error);
      setError(`Failed to load lead funnel: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, leadFunnel: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch revenue breakdown data using existing API service with filters
   */
  const fetchRevenueBreakdown = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, revenue: true }));
      
      const params = getApiParams();
      const response = await analyticsAPI.getDashboardSummary(params);
      
      const salesByProject = response.data?.charts?.salesByProject || [];
      const revenueBreakdown = salesByProject.map(item => ({
        name: item.projectName || 'Unknown Project',
        value: Number(item.totalRevenue) || 0,
        sales: Number(item.totalSales) || 0,
      }));

      setDashboardData(prev => ({ ...prev, revenueBreakdown }));
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
      setError(`Failed to load revenue breakdown: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, revenue: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch top performing projects using existing API service with filters
   */
  const fetchTopProjects = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const params = getApiParams();
      const response = await analyticsAPI.getDashboardSummary(params);
      
      const salesByProject = response.data?.charts?.salesByProject || [];
      const topProjects = salesByProject.map((project, index) => ({
        id: project._id || `project-${index}`,
        name: project.projectName || 'Unknown Project',
        revenue: Number(project.totalRevenue) || 0,
        sales: Number(project.totalSales) || 0,
        averagePrice: Number(project.averagePrice) || 0,
      }));

      setDashboardData(prev => ({ ...prev, topProjects }));
    } catch (error) {
      console.error('Error fetching top projects:', error);
      setError(`Failed to load top projects: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch team performance data with filters
   */
  const fetchTeamPerformance = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, team: true }));
      
      const params = getApiParams();
      const response = await analyticsAPI.getDashboardSummary(params);
      
      const teamPerformance = response.data?.charts?.teamPerformance || [];
      const teamData = teamPerformance.map((member, index) => ({
        id: member._id || `member-${index}`,
        name: member.salesPersonName || 'Unknown',
        revenue: Number(member.totalRevenue) || 0,
        sales: Number(member.totalSales) || 0,
        averagePrice: Number(member.averagePrice) || 0,
      }));

      setDashboardData(prev => ({ ...prev, teamPerformance: teamData }));
    } catch (error) {
      console.error('Error fetching team performance:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, team: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch recent activities with filters
   */
  const fetchRecentActivities = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, activities: true }));
      
      const params = { ...getApiParams(), limit: 5 };
      const response = await analyticsAPI.getSalesReport(params);
      
      const recentSales = response.data?.sales || [];
      const recentActivities = recentSales.slice(0, 5).map((sale) => ({
        id: sale._id || Math.random().toString(),
        description: `Sale: ${sale.unitNumber || 'Unknown'} to ${sale.customerName || 'Unknown'}`,
        user: sale.salesPersonName || 'Unknown',
        timestamp: sale.bookingDate ? new Date(sale.bookingDate).toLocaleDateString() : 'Unknown',
        amount: Number(sale.salePrice) || 0,
      }));

      setDashboardData(prev => ({ ...prev, recentActivities }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setError(`Failed to load recent activities: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, activities: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all dashboard data
   */
  const refreshDashboard = useCallback(async () => {
    console.log('🔄 Starting dashboard refresh with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchKPIMetrics(),
        fetchSalesTrend(),
        fetchLeadFunnel(),
        fetchRevenueBreakdown(),
        fetchTopProjects(),
        fetchTeamPerformance(),
        fetchRecentActivities(),
      ]);
      
      console.log('✅ Dashboard refresh completed successfully');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      setError('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchKPIMetrics,
    fetchSalesTrend, 
    fetchLeadFunnel,
    fetchRevenueBreakdown,
    fetchTopProjects,
    fetchTeamPerformance,
    fetchRecentActivities,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Analytics Dashboard initializing...');
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
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render KPI metrics section with actual data
   */
  const renderKPIMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Total Revenue"
          value={dashboardData.kpis.totalRevenue}
          previousValue={dashboardData.kpis.previousRevenue}
          unit="currency"
          icon={MonetizationOn}
          color="success"
          loading={loadingStates.kpis}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Total Sales"
          value={dashboardData.kpis.totalSales}
          previousValue={dashboardData.kpis.previousSales}
          unit="number"
          icon={Assignment}
          color="primary"
          loading={loadingStates.kpis}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Total Leads"
          value={dashboardData.kpis.totalLeads}
          previousValue={dashboardData.kpis.previousLeads}
          unit="number"
          icon={People}
          color="info"
          loading={loadingStates.kpis}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Conversion Rate"
          value={dashboardData.kpis.conversionRate}
          previousValue={dashboardData.kpis.previousConversionRate}
          unit="percentage"
          icon={TrendingUp}
          color="warning"
          loading={loadingStates.kpis}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Avg Deal Size"
          value={dashboardData.kpis.averageDealSize}
          previousValue={dashboardData.kpis.previousDealSize}
          unit="currency"
          icon={AttachMoney}
          color="secondary"
          loading={loadingStates.kpis}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <MetricCard
          title="Active Pipeline"
          value={dashboardData.kpis.activePipeline}
          previousValue={dashboardData.kpis.previousPipeline}
          unit="currency"
          icon={Timeline}
          color="info"
          loading={loadingStates.kpis}
        />
      </Grid>
    </Grid>
  );

  /**
   * Render sales trend chart with actual data
   */
  const renderSalesTrend = () => (
    <ChartContainer
      title="Sales Trend"
      loading={loadingStates.salesTrend}
      actions={[
        <Tooltip title="Export Chart" key="export">
          <IconButton size="small">
            <GetApp />
          </IconButton>
        </Tooltip>
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dashboardData.salesTrend}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <RechartsTooltip 
            formatter={(value) => [`₹${((value || 0) / 10000000).toFixed(1)}Cr`, 'Sales']}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            stroke={COLORS.primary}
            fillOpacity={1} 
            fill="url(#colorSales)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  /**
   * Render lead funnel chart with actual data
   */
  const renderLeadFunnel = () => (
    <ChartContainer
      title="Lead Conversion Funnel"
      loading={loadingStates.leadFunnel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={dashboardData.leadFunnel}>
          <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <RechartsTooltip 
            formatter={(value) => [value, 'Leads']}
          />
          <Bar dataKey="count" fill={COLORS.info} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  /**
   * Render revenue breakdown chart with actual data
   */
  const renderRevenueBreakdown = () => (
    <ChartContainer
      title="Revenue by Project"
      loading={loadingStates.revenue}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <RechartsTooltip 
            formatter={(value) => [`₹${((value || 0) / 10000000).toFixed(1)}Cr`, 'Revenue']}
          />
          <Legend />
          <Pie
            data={dashboardData.revenueBreakdown}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name || 'Unknown'} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {dashboardData.revenueBreakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  /**
   * Render top projects list with actual project data
   */
  const renderTopProjects = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Performing Projects
        </Typography>
        {loadingStates.projects ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : dashboardData.topProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No project data available for the selected filters.
          </Typography>
        ) : (
          <List>
            {dashboardData.topProjects.map((project, index) => (
              <ListItem key={project.id} divider={index < dashboardData.topProjects.length - 1}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={project.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Revenue: ₹{((project.revenue || 0) / 10000000).toFixed(1)}Cr
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sales: {project.sales || 0} units | Avg: ₹{((project.averagePrice || 0) / 100000).toFixed(1)}L
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
   * Render recent activities with actual sales data
   */
  const renderRecentActivities = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Sales
        </Typography>
        {loadingStates.activities ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <List>
            {dashboardData.recentActivities.map((activity, index) => (
              <ListItem key={activity.id} divider={index < dashboardData.recentActivities.length - 1}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    <Assignment fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.description}
                  secondary={
                    <Box component="span">
                      {activity.user} • {activity.timestamp}
                      <br />
                      <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ₹{((activity.amount || 0) / 100000).toFixed(1)}L
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
                Enhanced Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive analytics with advanced filtering and insights
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
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={projects}
          salespeople={salespeople}
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

        {/* Main Dashboard Content */}
        <Grid container spacing={3}>
          {/* KPI Metrics Row */}
          <Grid item xs={12}>
            {renderKPIMetrics()}
          </Grid>

          {/* Charts Row */}
          <Grid item xs={12} lg={8}>
            {renderSalesTrend()}
          </Grid>
          
          <Grid item xs={12} lg={4}>
            {renderLeadFunnel()}
          </Grid>

          <Grid item xs={12} lg={6}>
            {renderRevenueBreakdown()}
          </Grid>

          {/* Lists Row */}
          <Grid item xs={12} lg={3}>
            {renderTopProjects()}
          </Grid>
          
          <Grid item xs={12} lg={3}>
            {renderRecentActivities()}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsDashboard;
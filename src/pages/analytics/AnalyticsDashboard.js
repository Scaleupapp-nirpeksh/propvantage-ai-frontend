// File: src/pages/analytics/AnalyticsDashboard.js
// Description: Main Analytics Dashboard - Foundation for Phase 1 Analytics Implementation
// Version: 1.0 - Complete analytics dashboard with real-time KPIs, charts, and insights
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
} from '@mui/icons-material';
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
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, budgetVsActualAPI, analyticsUtils } from '../../services/api';

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
    if (!previousValue || !value) return null;
    const change = analyticsUtils.calculatePercentageChange(value, previousValue);
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
    if (unit === 'currency') return analyticsUtils.formatCurrency(value);
    if (unit === 'percentage') return analyticsUtils.formatPercentage(value);
    if (unit === 'number') return analyticsUtils.formatLargeNumber(value);
    return `${value}${unit}`;
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
              {analyticsUtils.formatPercentage(displayTrend.percentage, 1)} vs previous period
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
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    salesTrend: [],
    leadFunnel: [],
    revenueBreakdown: [],
    topProjects: [],
    recentActivities: [],
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    salesTrend: true,
    leadFunnel: true,
    revenue: true,
    projects: true,
    activities: true,
  });

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch KPI metrics from multiple endpoints
   */
  const fetchKPIMetrics = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, kpis: true }));
      
      const [dashboardData, revenueKPIs, salesKPIs, leadKPIs] = await Promise.all([
        analyticsAPI.getDashboardSummary({ period: selectedPeriod }),
        budgetVsActualAPI.getRevenueKPIs({ period: selectedPeriod }),
        budgetVsActualAPI.getSalesKPIs({ period: selectedPeriod }),
        budgetVsActualAPI.getLeadKPIs({ period: selectedPeriod }),
      ]);

      const kpis = {
        totalRevenue: dashboardData.data?.revenue?.total || 0,
        previousRevenue: dashboardData.data?.revenue?.previous || 0,
        totalSales: dashboardData.data?.sales?.total || 0,
        previousSales: dashboardData.data?.sales?.previous || 0,
        totalLeads: dashboardData.data?.leads?.total || 0,
        previousLeads: dashboardData.data?.leads?.previous || 0,
        conversionRate: dashboardData.data?.conversion?.rate || 0,
        previousConversionRate: dashboardData.data?.conversion?.previous || 0,
        averageDealSize: dashboardData.data?.dealSize?.average || 0,
        previousDealSize: dashboardData.data?.dealSize?.previous || 0,
        activePipeline: dashboardData.data?.pipeline?.value || 0,
        previousPipeline: dashboardData.data?.pipeline?.previous || 0,
      };

      setDashboardData(prev => ({ ...prev, kpis }));
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      setError('Failed to load KPI metrics');
    } finally {
      setLoadingStates(prev => ({ ...prev, kpis: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch sales trend data
   */
  const fetchSalesTrend = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, salesTrend: true }));
      
      const response = await analyticsAPI.getSalesTrends({ 
        period: selectedPeriod,
        granularity: 'daily',
      });

      const salesTrend = response.data?.trends || [];
      setDashboardData(prev => ({ ...prev, salesTrend }));
    } catch (error) {
      console.error('Error fetching sales trend:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, salesTrend: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch lead funnel data
   */
  const fetchLeadFunnel = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, leadFunnel: true }));
      
      const response = await analyticsAPI.getLeadFunnel({ period: selectedPeriod });
      const leadFunnel = response.data?.funnel || [];
      
      setDashboardData(prev => ({ ...prev, leadFunnel }));
    } catch (error) {
      console.error('Error fetching lead funnel:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, leadFunnel: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch revenue breakdown data
   */
  const fetchRevenueBreakdown = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, revenue: true }));
      
      const response = await budgetVsActualAPI.getRevenueAnalysis({ 
        period: selectedPeriod,
        include: 'breakdown',
      });

      const revenueBreakdown = response.data?.breakdown || [];
      setDashboardData(prev => ({ ...prev, revenueBreakdown }));
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, revenue: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch top performing projects
   */
  const fetchTopProjects = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const response = await analyticsAPI.getSalesReport({ 
        period: selectedPeriod,
        groupBy: 'project',
        limit: 5,
      });

      const topProjects = response.data?.projects || [];
      setDashboardData(prev => ({ ...prev, topProjects }));
    } catch (error) {
      console.error('Error fetching top projects:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch recent activities
   */
  const fetchRecentActivities = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, activities: true }));
      
      const response = await analyticsAPI.getDashboard({ 
        period: selectedPeriod,
        include: 'activities',
      });

      const recentActivities = response.data?.activities || [];
      setDashboardData(prev => ({ ...prev, recentActivities }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, activities: false }));
    }
  }, [selectedPeriod]);

  /**
   * Refresh all dashboard data
   */
  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchKPIMetrics(),
        fetchSalesTrend(),
        fetchLeadFunnel(),
        fetchRevenueBreakdown(),
        fetchTopProjects(),
        fetchRecentActivities(),
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
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
    fetchRecentActivities,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render KPI metrics section
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
   * Render sales trend chart
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
            formatter={(value) => [analyticsUtils.formatCurrency(value), 'Sales']}
            labelFormatter={(label) => `Date: ${label}`}
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
   * Render lead funnel chart
   */
  const renderLeadFunnel = () => (
    <ChartContainer
      title="Lead Conversion Funnel"
      loading={loadingStates.leadFunnel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={dashboardData.leadFunnel}>
          <XAxis dataKey="stage" />
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
   * Render revenue breakdown chart
   */
  const renderRevenueBreakdown = () => (
    <ChartContainer
      title="Revenue by Project"
      loading={loadingStates.revenue}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <RechartsTooltip 
            formatter={(value) => [analyticsUtils.formatCurrency(value), 'Revenue']}
          />
          <Legend />
          <RechartsTooltip />
          <RechartsTooltip />
          {dashboardData.revenueBreakdown.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
          ))}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );

  /**
   * Render top projects list
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
                  secondary={`Revenue: ${analyticsUtils.formatCurrency(project.revenue)} | Sales: ${project.sales}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render recent activities
   */
  const renderRecentActivities = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activities
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
                  secondary={`${activity.user} • ${activity.timestamp}`}
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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive analytics and insights for your business performance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Time Period Selector */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {TIME_PERIODS.map((period) => (
                <Chip
                  key={period.value}
                  label={period.label}
                  variant={selectedPeriod === period.value ? 'filled' : 'outlined'}
                  color="primary"
                  onClick={() => setSelectedPeriod(period.value)}
                  size="small"
                />
              ))}
            </Box>
            
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
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
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
  );
};

export default AnalyticsDashboard;
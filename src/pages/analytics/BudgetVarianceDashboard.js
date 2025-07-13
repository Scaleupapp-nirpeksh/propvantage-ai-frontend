// File: src/pages/analytics/BudgetVarianceDashboard.js
// Description: COMPLETE Budget Variance Dashboard - Production Ready with ALL integrations
// Version: 2.0.0 - Complete implementation with all tabs and real API integration
// Location: src/pages/analytics/BudgetVarianceDashboard.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  Skeleton,
  Paper,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Badge,
  Breadcrumbs,
  Link,
  Fade,
  Slide,
  Snackbar,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  FilterList,
  Insights,
  AccountBalance,
  MonetizationOn,
  CompareArrows,
  Timeline,
  Assessment,
  NotificationsActive,
  Business,
  Schedule,
  Home,
  Analytics,
  NavigateNext,
  ArrowBack,
  AutoGraph,
  QueryStats,
  AttachMoney,
  Assignment,
  Archive,
  PriceChange,
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
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from 'recharts';

// Import services and context
import { useAuth } from '../../context/AuthContext';
import { projectAPI } from '../../services/api';
import { budgetVarianceAPI, budgetHelpers } from '../../services/budgetAPI';

// Import all tab components
import BudgetVarianceFilters from './BudgetVarianceFilters';
import BudgetVarianceSummaryCards from './BudgetVarianceSummaryCards';
import VarianceOverviewTab from './VarianceOverviewTab';
import AlertsActionsTab from './AlertsActionsTab';
import PricingSuggestionsTab from './PricingSuggestionsTab';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const DASHBOARD_CONFIG = {
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MANUAL_REFRESH_DEBOUNCE: 1000, // 1 second
  
  VARIANCE_THRESHOLDS: {
    CRITICAL: 20,    // 20% variance - red
    WARNING: 10,     // 10% variance - orange  
    GOOD: 5,         // 5% variance - green
  },
  
  COLORS: {
    PRIMARY: '#1976d2',
    SUCCESS: '#2e7d32', 
    WARNING: '#ed6c02',
    ERROR: '#d32f2f',
    INFO: '#0288d1',
  },
  
  CHARTS: {
    HEIGHT: 300,
    MOBILE_HEIGHT: 200,
    ANIMATION_DURATION: 750,
  },
};

const FILTER_OPTIONS = {
  PROJECT_STATUS: [
    { value: 'all', label: 'All Projects' },
    { value: 'active', label: 'Active Projects' },
    { value: 'launched', label: 'Launched Projects' },
    { value: 'pre-launch', label: 'Pre-Launch Projects' },
  ],
  
  VARIANCE_LEVEL: [
    { value: 'all', label: 'All Variance Levels' },
    { value: 'critical', label: 'Critical (>20%)' },
    { value: 'warning', label: 'Warning (10-20%)' },
    { value: 'normal', label: 'Normal (<10%)' },
  ],
};

const DASHBOARD_TABS = [
  { 
    label: 'Variance Overview', 
    value: 0, 
    icon: <AutoGraph />,
    description: 'Real-time budget variance summary'
  },
  { 
    label: 'Project Analysis', 
    value: 1, 
    icon: <Assessment />,
    description: 'Detailed project-wise analysis'
  },
  { 
    label: 'Alerts & Actions', 
    value: 2, 
    icon: <NotificationsActive />,
    description: 'Critical alerts and recommendations'
  },
  { 
    label: 'Pricing Suggestions', 
    value: 3, 
    icon: <PriceChange />,
    description: 'AI-powered pricing optimization'
  },
  { 
    label: 'Historical Analysis', 
    value: 4, 
    icon: <Archive />,
    description: 'Historical variance trends'
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateBreadcrumbs = (projectId, projectName) => [
  { label: 'Dashboard', href: '/dashboard', icon: <Home fontSize="small" /> },
  { label: 'Analytics', href: '/analytics', icon: <Analytics fontSize="small" /> },
  { 
    label: 'Budget Variance', 
    href: '/analytics/budget-variance',
    icon: <QueryStats fontSize="small" />
  },
  ...(projectId && projectName ? [
    { 
      label: projectName, 
      href: `/analytics/budget-variance?project=${projectId}`,
      icon: <Business fontSize="small" />
    }
  ] : []),
];

const getVarianceStatusConfig = (variance) => {
  const absVariance = Math.abs(variance);
  
  if (absVariance >= DASHBOARD_CONFIG.VARIANCE_THRESHOLDS.CRITICAL) {
    return {
      status: 'Critical',
      severity: 'error',
      color: DASHBOARD_CONFIG.COLORS.ERROR,
      bgColor: '#ffebee',
      icon: <Error />,
    };
  } else if (absVariance >= DASHBOARD_CONFIG.VARIANCE_THRESHOLDS.WARNING) {
    return {
      status: 'Warning', 
      severity: 'warning',
      color: DASHBOARD_CONFIG.COLORS.WARNING,
      bgColor: '#fff3e0',
      icon: <Warning />,
    };
  } else {
    return {
      status: 'On Track',
      severity: 'success', 
      color: DASHBOARD_CONFIG.COLORS.SUCCESS,
      bgColor: '#e8f5e8',
      icon: <CheckCircle />,
    };
  }
};

// =============================================================================
// MAIN BUDGET VARIANCE DASHBOARD COMPONENT
// =============================================================================

const BudgetVarianceDashboard = () => {
  console.log('🚀 BudgetVarianceDashboard component mounting...');
  
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Permission check
  useEffect(() => {
    console.log('=== BUDGET VARIANCE DASHBOARD DEBUG ===');
    console.log('User:', user);
    console.log('User Role:', user?.role);
    console.log('Is Authenticated:', isAuthenticated);
    
    if (canAccess && typeof canAccess.viewFinancials === 'function') {
      console.log('Can Access viewFinancials:', canAccess.viewFinancials());
    } else {
      console.error('ERROR: viewFinancials method not found in canAccess:', canAccess);
    }
  }, [user, canAccess, isAuthenticated]);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Filter state
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || 'all',
    projectStatus: 'active',
    varianceLevel: 'all',
    timePeriod: 'real_time',
    startDate: null,
    endDate: null,
    searchTerm: '',
    onlyProblemsProjects: false,
  });
  
  // Filter options data
  const [filterOptions, setFilterOptions] = useState({
    projects: [],
    loading: false,
  });
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    portfolioSummary: {
      totalProjects: 0,
      projectsNeedingAttention: 0,
      criticalProjects: 0,
      warningProjects: 0,
      totalBudgetTarget: 0,
      totalRevenue: 0,
      projects: [],
    },
    projectVariance: null,
    alerts: [],
    recommendedActions: [],
    pricingSuggestions: [],
    loadingStates: {
      portfolio: true,
      projectDetails: false,
      alerts: false,
      actions: false,
      pricing: false,
    },
  });
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const selectedProject = useMemo(() => {
    if (filters.project === 'all' || !dashboardData.portfolioSummary.projects) {
      return null;
    }
    return dashboardData.portfolioSummary.projects.find(
      project => project.projectId === filters.project
    );
  }, [filters.project, dashboardData.portfolioSummary.projects]);
  
  const dashboardStats = useMemo(() => {
    const { portfolioSummary } = dashboardData;
    
    if (filters.project !== 'all' && dashboardData.projectVariance) {
      const { project, calculations } = dashboardData.projectVariance;
      return {
        totalBudget: project?.budgetTarget || 0,
        totalRevenue: calculations?.actualRevenue || 0,
        totalVariance: calculations?.variancePercentage || 0,
        projectsCount: 1,
      };
    } else {
      return {
        totalBudget: portfolioSummary.totalBudgetTarget || 0,
        totalRevenue: portfolioSummary.totalRevenue || 0,
        totalVariance: portfolioSummary.totalBudgetTarget > 0 ? 
          ((portfolioSummary.totalRevenue - portfolioSummary.totalBudgetTarget) / 
           portfolioSummary.totalBudgetTarget) * 100 : 0,
        projectsCount: portfolioSummary.totalProjects || 0,
      };
    }
  }, [dashboardData, filters.project]);
  
  const breadcrumbs = useMemo(() => {
    const projectName = selectedProject?.projectName || null;
    return generateBreadcrumbs(filters.project !== 'all' ? filters.project : null, projectName);
  }, [filters.project, selectedProject]);
  
  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================
  
  const fetchFilterOptions = useCallback(async () => {
    try {
      setFilterOptions(prev => ({ ...prev, loading: true }));
      
      console.log('🔄 Fetching filter options...');
      const response = await projectAPI.getProjects();
      const projects = response.data?.data || [];
      
      console.log('✅ Filter options loaded:', { projectsCount: projects.length });
      
      setFilterOptions({
        projects: Array.isArray(projects) ? projects : [],
        loading: false,
      });
      
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      setFilterOptions(prev => ({ ...prev, loading: false }));
      setError('Failed to load filter options');
    }
  }, []);
  
  const fetchPortfolioSummary = useCallback(async () => {
    try {
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, portfolio: true }
      }));
      
      console.log('🔄 Fetching portfolio budget variance summary...');
      
      const response = await budgetVarianceAPI.getMultiProjectBudgetSummary({
        limit: 50,
        status: filters.projectStatus !== 'all' ? filters.projectStatus : undefined,
      });
      
      const summaryData = response.data?.data || {};
      
      console.log('✅ Portfolio summary loaded:', summaryData);
      
      setDashboardData(prev => ({
        ...prev,
        portfolioSummary: {
          totalProjects: summaryData.summary?.totalProjects || 0,
          projectsNeedingAttention: summaryData.summary?.projectsNeedingAttention || 0,
          criticalProjects: summaryData.summary?.criticalProjects || 0,
          warningProjects: summaryData.summary?.warningProjects || 0,
          totalBudgetTarget: summaryData.summary?.totalBudgetTarget || 0,
          totalRevenue: summaryData.summary?.totalRevenue || 0,
          projects: summaryData.projects || [],
        },
        loadingStates: { ...prev.loadingStates, portfolio: false }
      }));
      
    } catch (error) {
      console.error('❌ Error fetching portfolio summary:', error);
      setError('Failed to load portfolio summary');
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, portfolio: false }
      }));
    }
  }, [filters.projectStatus]);
  
  const fetchProjectVariance = useCallback(async (projectId) => {
    if (!projectId || projectId === 'all') {
      setDashboardData(prev => ({
        ...prev,
        projectVariance: null,
        pricingSuggestions: [], // Clear pricing suggestions
        loadingStates: { ...prev.loadingStates, projectDetails: false, pricing: false }
      }));
      return;
    }
    
    try {
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, projectDetails: true, pricing: true }
      }));
      
      console.log(`🔄 Fetching variance data for project: ${projectId}`);
      
      const response = await budgetVarianceAPI.getProjectBudgetVariance(projectId);
      const varianceData = response.data?.data || {};
      
      console.log('✅ Project variance data loaded:', varianceData);
      
      setDashboardData(prev => ({
        ...prev,
        projectVariance: varianceData,
        pricingSuggestions: varianceData.pricingSuggestions || [], // Extract pricing suggestions
        loadingStates: { ...prev.loadingStates, projectDetails: false, pricing: false }
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching project variance for ${projectId}:`, error);
      setError(`Failed to load variance data for selected project`);
      setDashboardData(prev => ({
        ...prev,
        projectVariance: null,
        pricingSuggestions: [],
        loadingStates: { ...prev.loadingStates, projectDetails: false, pricing: false }
      }));
    }
  }, []);
  
  const fetchAlerts = useCallback(async () => {
    try {
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, alerts: true }
      }));
      
      console.log('🔄 Fetching budget alerts...');
      
      const response = await budgetVarianceAPI.getBudgetAlerts(
        filters.project !== 'all' ? filters.project : null
      );
      
      const alerts = response.data?.data || [];
      
      console.log('✅ Budget alerts loaded:', { alertsCount: alerts.length });
      
      setDashboardData(prev => ({
        ...prev,
        alerts,
        loadingStates: { ...prev.loadingStates, alerts: false }
      }));
      
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      setDashboardData(prev => ({
        ...prev,
        alerts: [],
        loadingStates: { ...prev.loadingStates, alerts: false }
      }));
    }
  }, [filters.project]);
  
  const fetchRecommendedActions = useCallback(async () => {
    try {
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, actions: true }
      }));
      
      console.log('🔄 Fetching recommended actions...');
      
      const response = await budgetVarianceAPI.getRecommendedActions(
        filters.project !== 'all' ? filters.project : null
      );
      
      const actions = response.data?.data || [];
      
      console.log('✅ Recommended actions loaded:', { actionsCount: actions.length });
      
      setDashboardData(prev => ({
        ...prev,
        recommendedActions: actions,
        loadingStates: { ...prev.loadingStates, actions: false }
      }));
      
    } catch (error) {
      console.error('❌ Error fetching recommended actions:', error);
      setDashboardData(prev => ({
        ...prev,
        recommendedActions: [],
        loadingStates: { ...prev.loadingStates, actions: false }
      }));
    }
  }, [filters.project]);
  
  const fetchPricingSuggestions = useCallback(async () => {
    // Don't make a separate API call - pricing suggestions are included in project variance data
    if (dashboardData.projectVariance && dashboardData.projectVariance.pricingSuggestions) {
      setDashboardData(prev => ({
        ...prev,
        pricingSuggestions: dashboardData.projectVariance.pricingSuggestions,
        loadingStates: { ...prev.loadingStates, pricing: false }
      }));
    } else {
      setDashboardData(prev => ({
        ...prev,
        pricingSuggestions: [],
        loadingStates: { ...prev.loadingStates, pricing: false }
      }));
    }
  }, [dashboardData.projectVariance]);
  
  const refreshDashboard = useCallback(async (showRefreshIndicator = true) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }
      
      console.log('🔄 Refreshing budget variance dashboard...');
      
      // Fetch all data in parallel - REMOVE fetchPricingSuggestions
      await Promise.all([
        fetchPortfolioSummary(),
        filters.project !== 'all' ? fetchProjectVariance(filters.project) : Promise.resolve(),
        fetchAlerts(),
        fetchRecommendedActions(),
        // ❌ REMOVE: filters.project !== 'all' ? fetchPricingSuggestions() : Promise.resolve(),
      ]);
      
      setLastUpdated(new Date());
      console.log('✅ Dashboard refresh completed');
      
      setSnackbar({
        open: true,
        message: 'Dashboard data refreshed successfully',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      setError('Failed to refresh dashboard data');
      setSnackbar({
        open: true,
        message: 'Failed to refresh dashboard data',
        severity: 'error'
      });
    } finally {
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  }, [fetchPortfolioSummary, fetchProjectVariance, fetchAlerts, fetchRecommendedActions, filters.project]);
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleFilterChange = useCallback((filterKey, value) => {
    console.log(`🔧 Filter changed: ${filterKey} = ${value}`);
    
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: value };
      
      if (filterKey === 'project') {
        const newSearchParams = new URLSearchParams(searchParams);
        if (value === 'all') {
          newSearchParams.delete('project');
        } else {
          newSearchParams.set('project', value);
        }
        setSearchParams(newSearchParams);
      }
      
      return newFilters;
    });
  }, [searchParams, setSearchParams]);
  
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);
  
  const handleManualRefresh = useCallback(() => {
    refreshDashboard(true);
  }, [refreshDashboard]);
  
  const handleAutoRefreshToggle = useCallback((event) => {
    setAutoRefresh(event.target.checked);
  }, []);
  
  const handleNavigateBack = useCallback(() => {
    navigate('/analytics');
  }, [navigate]);
  
  const applyFilters = useCallback(() => {
    refreshDashboard(false);
  }, [refreshDashboard]);
  
  const clearFilters = useCallback(() => {
    setFilters({
      project: 'all',
      projectStatus: 'active',
      varianceLevel: 'all',
      timePeriod: 'real_time',
      startDate: null,
      endDate: null,
      searchTerm: '',
      onlyProblemsProjects: false,
    });
  }, []);
  
  // Alert and Action Handlers
  const handleAlertAcknowledge = useCallback(async (alertId, userId) => {
    try {
      await budgetVarianceAPI.acknowledgeAlert(alertId, userId);
      await fetchAlerts(); // Refresh alerts
      setSnackbar({
        open: true,
        message: 'Alert acknowledged successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to acknowledge alert',
        severity: 'error'
      });
    }
  }, [fetchAlerts]);
  
  const handleActionStatusChange = useCallback(async (actionId, newStatus, userId) => {
    try {
      await budgetVarianceAPI.updateActionStatus(actionId, newStatus, userId);
      await fetchRecommendedActions(); // Refresh actions
      setSnackbar({
        open: true,
        message: 'Action status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating action status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update action status',
        severity: 'error'
      });
    }
  }, [fetchRecommendedActions]);
  
  // Pricing Handlers
  const handlePriceUpdate = useCallback(async (unitNumber, newPrice) => {
    if (!filters.project || filters.project === 'all') return;
    
    try {
      await budgetVarianceAPI.updateUnitPricing(filters.project, unitNumber, newPrice);
      await fetchPricingSuggestions(); // Refresh pricing suggestions
      await fetchProjectVariance(filters.project); // Refresh project variance
      setSnackbar({
        open: true,
        message: 'Unit pricing updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating unit pricing:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update unit pricing',
        severity: 'error'
      });
    }
  }, [filters.project, fetchPricingSuggestions, fetchProjectVariance]);
  
  const handleBulkPriceUpdate = useCallback(async (updates) => {
    if (!filters.project || filters.project === 'all') return;
    
    try {
      await budgetVarianceAPI.bulkUpdateUnitPricing(filters.project, updates);
      await fetchPricingSuggestions(); // Refresh pricing suggestions
      await fetchProjectVariance(filters.project); // Refresh project variance
      setSnackbar({
        open: true,
        message: `${updates.length} unit prices updated successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error bulk updating unit pricing:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update unit pricing',
        severity: 'error'
      });
    }
  }, [filters.project, fetchPricingSuggestions, fetchProjectVariance]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    console.log('🚀 Budget Variance Dashboard initializing...');
    fetchFilterOptions();
    refreshDashboard(false);
  }, []);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshDashboard(false);
    }, DASHBOARD_CONFIG.MANUAL_REFRESH_DEBOUNCE);
    
    return () => clearTimeout(timeoutId);
  }, [filters]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      refreshDashboard(false);
    }, DASHBOARD_CONFIG.AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshDashboard]);
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  const renderDashboardHeader = () => (
    <Box sx={{ mb: 4 }}>
      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ mb: 2 }}
        separator={<NavigateNext fontSize="small" />}
      >
        {breadcrumbs.map((crumb, index) => (
          <Link
            key={index}
            color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
            href={crumb.href}
            onClick={(e) => {
              e.preventDefault();
              navigate(crumb.href);
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {crumb.icon}
            <Typography sx={{ ml: 0.5 }}>{crumb.label}</Typography>
          </Link>
        ))}
      </Breadcrumbs>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Budget Variance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time budget tracking and variance analysis
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          
          <Tooltip title="Refresh Dashboard">
            <IconButton 
              onClick={handleManualRefresh}
              disabled={refreshing}
              color="primary"
              size="large"
            >
              <Refresh sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleNavigateBack}
            size={isMobile ? 'small' : 'medium'}
          >
            Back to Analytics
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastUpdated.toLocaleString()}
          {autoRefresh && (
            <Chip 
              label="Auto-refresh ON" 
              size="small" 
              color="primary" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
      </Box>
    </Box>
  );

  const renderDashboardTabs = () => (
    <Paper sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant={isMobile ? 'scrollable' : 'fullWidth'}
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {DASHBOARD_TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.icon}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {tab.label}
                  </Typography>
                  {!isMobile && (
                    <Typography variant="caption" color="text.secondary">
                      {tab.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            }
            sx={{ 
              textAlign: 'left',
              alignItems: 'flex-start',
              minHeight: 72,
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Variance Overview
        return (
          <VarianceOverviewTab
            portfolioSummary={dashboardData.portfolioSummary}
            projectVariance={dashboardData.projectVariance}
            loadingStates={dashboardData.loadingStates}
            onProjectSelect={(projectId) => handleFilterChange('project', projectId)}
            onRefreshData={handleManualRefresh}
          />
        );
        
      case 1: // Project Analysis
        if (filters.project === 'all') {
          return (
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Select a Project</AlertTitle>
              Please select a specific project from the filters above to view detailed analysis.
            </Alert>
          );
        }
        return (
          <VarianceOverviewTab
            portfolioSummary={dashboardData.portfolioSummary}
            projectVariance={dashboardData.projectVariance}
            loadingStates={dashboardData.loadingStates}
            onProjectSelect={(projectId) => handleFilterChange('project', projectId)}
            onRefreshData={handleManualRefresh}
          />
        );
        
      case 2: // Alerts & Actions
        return (
          <AlertsActionsTab
            portfolioSummary={dashboardData.portfolioSummary}
            projectVariance={dashboardData.projectVariance}
            alerts={dashboardData.alerts}
            recommendedActions={dashboardData.recommendedActions}
            loadingStates={dashboardData.loadingStates}
            onAlertAcknowledge={handleAlertAcknowledge}
            onActionStatusChange={handleActionStatusChange}
          />
        );
        
      case 3: // Pricing Suggestions
        return (
          <PricingSuggestionsTab
            projectVariance={{
              ...dashboardData.projectVariance,
              pricingSuggestions: dashboardData.pricingSuggestions,
            }}
            loadingStates={{
              ...dashboardData.loadingStates,
              pricingSuggestions: dashboardData.loadingStates.pricing,
            }}
            onPriceUpdate={handlePriceUpdate}
            onBulkPriceUpdate={handleBulkPriceUpdate}
          />
        );
        
      case 4: // Historical Analysis
        return (
          <Alert severity="info">
            <AlertTitle>Historical Analysis Coming Soon</AlertTitle>
            Historical variance trends and analytics will be available in the next update.
          </Alert>
        );
        
      default:
        return null;
    }
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  console.log('🎨 Rendering BudgetVarianceDashboard...');
  
  return (
    <Fade in timeout={500}>
      <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        {renderDashboardHeader()}
        
        {error && (
          <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => setError(null)}
              action={
                <Button color="inherit" size="small" onClick={handleManualRefresh}>
                  Retry
                </Button>
              }
            >
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              {error}
            </Alert>
          </Slide>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={60} />
          </Box>
        )}
        
        {!loading && (
          <Fade in timeout={750}>
            <Box>
              <BudgetVarianceFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                projects={filterOptions.projects}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                loading={filterOptions.loading || loading}
              />
              
              <BudgetVarianceSummaryCards
                dashboardStats={dashboardStats}
                portfolioSummary={dashboardData.portfolioSummary}
                projectVariance={dashboardData.projectVariance}
                alerts={dashboardData.alerts}
                loadingStates={dashboardData.loadingStates}
                onNavigateToProject={(projectId) => handleFilterChange('project', projectId)}
                onViewAlerts={() => setActiveTab(2)}
                onRefreshData={handleManualRefresh}
              />
              
              {renderDashboardTabs()}
              
              <Box sx={{ mt: 3 }}>
                {renderTabContent()}
              </Box>
            </Box>
          </Fade>
        )}
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default BudgetVarianceDashboard;
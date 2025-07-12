// File: src/pages/analytics/BudgetVsActualDashboard.js
// Description: Budget vs Actual Dashboard - Real-time financial tracking and budget analysis
// Version: 1.0 - Complete budget analysis with variance tracking, alerts, and projections
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
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, analyticsUtils } from '../../services/api';

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

const PROJECT_FILTERS = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active Projects' },
  { value: 'completed', label: 'Completed Projects' },
  { value: 'high_variance', label: 'High Variance Projects' },
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

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

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
    <Tooltip title={`Variance: ${analyticsUtils.formatPercentage(variance)}`}>
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
 * Budget metric card with variance analysis
 */
const BudgetMetricCard = ({ 
  title, 
  budget, 
  actual, 
  icon: Icon, 
  loading = false,
  subtitle = null,
  trend = null,
}) => {
  const variance = budget > 0 ? ((actual - budget) / budget) * 100 : 0;
  const isOver = actual > budget;
  
  const getVarianceColor = () => {
    const absVariance = Math.abs(variance);
    if (absVariance <= VARIANCE_THRESHOLDS.good) return 'success';
    if (absVariance <= VARIANCE_THRESHOLDS.warning) return 'warning';
    return 'error';
  };

  const getProgressColor = () => {
    if (isOver) return 'error';
    const percentage = budget > 0 ? (actual / budget) * 100 : 0;
    if (percentage >= 90) return 'warning';
    return 'success';
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BudgetStatusIndicator variance={variance} />
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {loading ? <CircularProgress size={20} /> : analyticsUtils.formatCurrency(actual)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs {analyticsUtils.formatCurrency(budget)} budgeted
                </Typography>
              </Box>
            </Box>
          </Box>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <Icon />
          </Avatar>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">Progress</Typography>
            <Typography variant="caption">
              {analyticsUtils.formatPercentage(budget > 0 ? (actual / budget) * 100 : 0)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min((actual / budget) * 100, 100)}
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Variance Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={`${variance >= 0 ? '+' : ''}${analyticsUtils.formatPercentage(variance)} variance`}
            color={getVarianceColor()}
            size="small"
            variant="outlined"
          />
          <Typography variant="body2" color={`${getVarianceColor()}.main`}>
            {isOver ? 'Over Budget' : 'Under Budget'}
          </Typography>
        </Box>

        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Budget alert card component
 */
const BudgetAlertCard = ({ alert, onDismiss }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <Info />;
    }
  };

  return (
    <Alert 
      severity={getSeverityColor(alert.severity)}
      icon={getSeverityIcon(alert.severity)}
      onClose={onDismiss}
      sx={{ mb: 1 }}
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {alert.title}
        </Typography>
        <Typography variant="body2">
          {alert.message}
        </Typography>
        {alert.actionRequired && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Action Required: {alert.actionRequired}
          </Typography>
        )}
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
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [showProjections, setShowProjections] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Dashboard data state
  const [budgetData, setBudgetData] = useState({
    summary: {},
    variance: [],
    trends: [],
    projects: [],
    alerts: [],
    projections: {},
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    summary: true,
    variance: true,
    trends: true,
    projects: true,
    alerts: true,
  });

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch budget summary metrics
   */
  const fetchBudgetSummary = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, summary: true }));
      
      const response = await budgetVsActualAPI.getBudgetDashboard({ 
        period: selectedPeriod,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
      });

      const summary = {
        totalBudget: response.data?.budget?.total || 0,
        totalActual: response.data?.actual?.total || 0,
        revenueBudget: response.data?.revenue?.budget || 0,
        revenueActual: response.data?.revenue?.actual || 0,
        salesBudget: response.data?.sales?.budget || 0,
        salesActual: response.data?.sales?.actual || 0,
        leadsBudget: response.data?.leads?.budget || 0,
        leadsActual: response.data?.leads?.actual || 0,
        marketingBudget: response.data?.marketing?.budget || 0,
        marketingActual: response.data?.marketing?.actual || 0,
        operationalBudget: response.data?.operational?.budget || 0,
        operationalActual: response.data?.operational?.actual || 0,
      };

      setBudgetData(prev => ({ ...prev, summary }));
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      setError('Failed to load budget summary');
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  }, [selectedPeriod, selectedProject]);

  /**
   * Fetch variance analysis data
   */
  const fetchVarianceAnalysis = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, variance: true }));
      
      const response = await budgetVsActualAPI.getBudgetVsActual({ 
        period: selectedPeriod,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
        include: 'variance,analysis',
      });

      const variance = response.data?.variance || [];
      setBudgetData(prev => ({ ...prev, variance }));
    } catch (error) {
      console.error('Error fetching variance analysis:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, variance: false }));
    }
  }, [selectedPeriod, selectedProject]);

  /**
   * Fetch budget trends data
   */
  const fetchBudgetTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, trends: true }));
      
      const response = await budgetVsActualAPI.getRevenueTrends({ 
        period: selectedPeriod,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
        include: 'budget,actual,projections',
      });

      const trends = response.data?.trends || [];
      setBudgetData(prev => ({ ...prev, trends }));
    } catch (error) {
      console.error('Error fetching budget trends:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false }));
    }
  }, [selectedPeriod, selectedProject]);

  /**
   * Fetch project-wise budget data
   */
  const fetchProjectBudgets = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const response = await budgetVsActualAPI.getProjectComparison({ 
        period: selectedPeriod,
        include: 'budget,variance,performance',
      });

      const projects = response.data?.projects || [];
      setBudgetData(prev => ({ ...prev, projects }));
    } catch (error) {
      console.error('Error fetching project budgets:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [selectedPeriod]);

  /**
   * Fetch budget alerts
   */
  const fetchBudgetAlerts = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, alerts: true }));
      
      const response = await budgetVsActualAPI.getBudgetAlerts({ 
        period: selectedPeriod,
        projectId: selectedProject !== 'all' ? selectedProject : undefined,
      });

      const alerts = response.data?.alerts || [];
      setBudgetData(prev => ({ ...prev, alerts }));
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, alerts: false }));
    }
  }, [selectedPeriod, selectedProject]);

  /**
   * Refresh all budget data
   */
  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchBudgetSummary(),
        fetchVarianceAnalysis(),
        fetchBudgetTrends(),
        fetchProjectBudgets(),
        fetchBudgetAlerts(),
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing budget dashboard:', error);
      setError('Failed to refresh budget data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchBudgetSummary,
    fetchVarianceAnalysis,
    fetchBudgetTrends,
    fetchProjectBudgets,
    fetchBudgetAlerts,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Auto-refresh every 3 minutes for financial data
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const dismissAlert = (alertId) => {
    setBudgetData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render budget summary metrics
   */
  const renderBudgetSummary = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Total Revenue"
          budget={budgetData.summary.revenueBudget}
          actual={budgetData.summary.revenueActual}
          icon={MonetizationOn}
          loading={loadingStates.summary}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Sales Performance"
          budget={budgetData.summary.salesBudget}
          actual={budgetData.summary.salesActual}
          icon={TrendingUp}
          loading={loadingStates.summary}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Lead Generation"
          budget={budgetData.summary.leadsBudget}
          actual={budgetData.summary.leadsActual}
          icon={Flag}
          loading={loadingStates.summary}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Marketing Spend"
          budget={budgetData.summary.marketingBudget}
          actual={budgetData.summary.marketingActual}
          icon={Assessment}
          loading={loadingStates.summary}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Operational Costs"
          budget={budgetData.summary.operationalBudget}
          actual={budgetData.summary.operationalActual}
          icon={Business}
          loading={loadingStates.summary}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <BudgetMetricCard
          title="Total Budget"
          budget={budgetData.summary.totalBudget}
          actual={budgetData.summary.totalActual}
          icon={AccountBalance}
          loading={loadingStates.summary}
        />
      </Grid>
    </Grid>
  );

  /**
   * Render budget vs actual trends chart
   */
  const renderBudgetTrends = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Budget vs Actual Trends
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showProjections}
                onChange={(e) => setShowProjections(e.target.checked)}
                color="primary"
              />
            }
            label="Show Projections"
          />
        </Box>
        
        {loadingStates.trends ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={budgetData.trends}>
              <XAxis dataKey="period" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  analyticsUtils.formatCurrency(value), 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Bar dataKey="budget" fill={BUDGET_COLORS.target} name="Budget" />
              <Bar dataKey="actual" fill={BUDGET_COLORS.actual} name="Actual" />
              {showProjections && (
                <Line 
                  type="monotone" 
                  dataKey="projection" 
                  stroke={BUDGET_COLORS.warning}
                  strokeDasharray="5 5"
                  name="Projection"
                />
              )}
              <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render variance analysis chart
   */
  const renderVarianceAnalysis = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Variance Analysis by Category
        </Typography>
        
        {loadingStates.variance ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={budgetData.variance}>
              <XAxis dataKey="category" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value) => [analyticsUtils.formatPercentage(value), 'Variance']}
              />
              <Bar 
                dataKey="variance" 
                fill={(entry) => entry.variance > 0 ? BUDGET_COLORS.critical : BUDGET_COLORS.onTrack}
              />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="2 2" />
              <ReferenceLine y={VARIANCE_THRESHOLDS.warning} stroke={BUDGET_COLORS.warning} strokeDasharray="5 5" />
              <ReferenceLine y={-VARIANCE_THRESHOLDS.warning} stroke={BUDGET_COLORS.warning} strokeDasharray="5 5" />
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render project budget comparison
   */
  const renderProjectComparison = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Project Budget Performance
        </Typography>
        
        {loadingStates.projects ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={80} sx={{ mb: 2 }} />
            ))}
          </Box>
        ) : (
          <List>
            {budgetData.projects.map((project, index) => {
              const variance = project.budget > 0 ? 
                ((project.actual - project.budget) / project.budget) * 100 : 0;
              
              return (
                <ListItem 
                  key={project.id} 
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
                          label={`${variance >= 0 ? '+' : ''}${analyticsUtils.formatPercentage(variance)}`}
                          color={Math.abs(variance) <= VARIANCE_THRESHOLDS.good ? 'success' : 
                                 Math.abs(variance) <= VARIANCE_THRESHOLDS.warning ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Budget: {analyticsUtils.formatCurrency(project.budget)} | 
                          Actual: {analyticsUtils.formatCurrency(project.actual)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((project.actual / project.budget) * 100, 100)}
                          color={variance > VARIANCE_THRESHOLDS.warning ? 'error' : 'success'}
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
   * Render budget alerts
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
        
        {loadingStates.alerts ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : budgetData.alerts.length === 0 ? (
          <Alert severity="success">
            No budget alerts at this time. All budgets are within acceptable variance thresholds.
          </Alert>
        ) : (
          <Box>
            {budgetData.alerts.map((alert) => (
              <BudgetAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </Box>
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
              Budget vs Actual Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time budget tracking and variance analysis across all projects
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Period Selector */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select value={selectedPeriod} onChange={handlePeriodChange} label="Period">
                {ANALYSIS_PERIODS.map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Project Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Project</InputLabel>
              <Select value={selectedProject} onChange={handleProjectChange} label="Project">
                {PROJECT_FILTERS.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Refresh Button */}
            <Tooltip title="Refresh Data">
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

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="budget analysis tabs">
          <Tab label="Overview" />
          <Tab label="Trends" />
          <Tab label="Variance Analysis" />
          <Tab label="Project Comparison" />
          <Tab label="Alerts" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderBudgetSummary()}
            </Grid>
            <Grid item xs={12} lg={8}>
              {renderBudgetTrends()}
            </Grid>
            <Grid item xs={12} lg={4}>
              {renderBudgetAlerts()}
            </Grid>
          </Grid>
        )}

        {/* Trends Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderBudgetTrends()}
            </Grid>
            <Grid item xs={12}>
              {renderVarianceAnalysis()}
            </Grid>
          </Grid>
        )}

        {/* Variance Analysis Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderVarianceAnalysis()}
            </Grid>
            <Grid item xs={12}>
              {renderBudgetSummary()}
            </Grid>
          </Grid>
        )}

        {/* Project Comparison Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderProjectComparison()}
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
  );
};

export default BudgetVsActualDashboard;
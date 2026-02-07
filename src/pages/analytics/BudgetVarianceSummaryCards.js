// File: src/pages/analytics/BudgetVarianceSummaryCards.js
// Description: Dashboard Summary Cards for Budget Variance Dashboard


import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Stack,
  Badge,
  Button,
  useTheme,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  AccountBalance,
  MonetizationOn,
  Warning,
  Error,
  CheckCircle,
  Info,
  Business,
  Flag,
  NotificationsActive,
  CompareArrows,
  AttachMoney,
  QueryStats,
  OpenInNew,
} from '@mui/icons-material';
import { budgetHelpers } from '../../services/budgetAPI';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Summary cards configuration
 */
const SUMMARY_CONFIG = {
  // Card animation timing
  ANIMATION: {
    STAGGER_DELAY: 100, // milliseconds between card animations
    DURATION: 300,      // animation duration
  },
  
  // Variance thresholds for color coding
  VARIANCE_THRESHOLDS: {
    CRITICAL: 20,
    WARNING: 10,
    GOOD: 5,
  },
  
  // Chart colors
  COLORS: {
    PRIMARY: '#1976d2',
    SUCCESS: '#2e7d32',
    WARNING: '#ed6c02', 
    ERROR: '#d32f2f',
    INFO: '#0288d1',
    NEUTRAL: '#757575',
  },
  
  // Card types
  CARD_TYPES: {
    METRIC: 'metric',
    PROGRESS: 'progress',
    STATUS: 'status',
    ALERT: 'alert',
    CHART: 'chart',
  },
};

/**
 * Get status configuration based on variance
 */
const getVarianceStatus = (variance) => {
  const absVariance = Math.abs(variance);
  
  if (absVariance >= SUMMARY_CONFIG.VARIANCE_THRESHOLDS.CRITICAL) {
    return {
      status: 'critical',
      label: 'Critical',
      color: SUMMARY_CONFIG.COLORS.ERROR,
      icon: <Error />,
      severity: 'error',
    };
  } else if (absVariance >= SUMMARY_CONFIG.VARIANCE_THRESHOLDS.WARNING) {
    return {
      status: 'warning',
      label: 'Warning',
      color: SUMMARY_CONFIG.COLORS.WARNING,
      icon: <Warning />,
      severity: 'warning',
    };
  } else {
    return {
      status: 'success',
      label: 'On Track',
      color: SUMMARY_CONFIG.COLORS.SUCCESS,
      icon: <CheckCircle />,
      severity: 'success',
    };
  }
};

/**
 * Get trend icon based on variance direction
 */
const getTrendIcon = (variance, previousVariance = null) => {
  if (previousVariance !== null) {
    const trend = variance - previousVariance;
    if (Math.abs(trend) < 1) return { icon: <TrendingFlat />, color: 'info' };
    return trend > 0 
      ? { icon: <TrendingUp />, color: 'success' }
      : { icon: <TrendingDown />, color: 'error' };
  }
  
  return variance >= 0 
    ? { icon: <TrendingUp />, color: variance > 5 ? 'success' : 'info' }
    : { icon: <TrendingDown />, color: variance < -5 ? 'error' : 'warning' };
};

// =============================================================================
// INDIVIDUAL CARD COMPONENTS
// =============================================================================

/**
 * Metric Card - Displays key financial metrics
 */
const MetricCard = ({ 
  title, 
  value, 
  target, 
  unit = '', 
  variance = 0,
  trend = null,
  icon,
  loading = false,
  onClick,
  subtitle,
}) => {
  const theme = useTheme();
  const statusConfig = getVarianceStatus(variance);
  const trendConfig = getTrendIcon(variance, trend);
  
  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const isClickable = !!onClick;
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': isClickable ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            {loading ? (
              <Skeleton variant="text" width="60%" height={40} />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                {budgetHelpers.formatAmountWithSuffix(value)}
                {unit && <Typography component="span" variant="h6" color="text.secondary">{unit}</Typography>}
              </Typography>
            )}
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: statusConfig.color, width: 40, height: 40 }}>
              {icon || statusConfig.icon}
            </Avatar>
            
            {variance !== 0 && (
              <Chip
                icon={trendConfig.icon}
                label={`${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`}
                size="small"
                color={trendConfig.color}
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        {/* Progress Bar */}
        {target > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Target: {budgetHelpers.formatAmountWithSuffix(target)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              color={statusConfig.severity}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Status Card - Displays project status summary
 */
const StatusCard = ({ 
  title, 
  projects = [], 
  loading = false,
  onViewDetails,
}) => {
  const statusCounts = useMemo(() => {
    return projects.reduce((acc, project) => {
      const variance = project.variancePercentage || 0;
      const status = getVarianceStatus(variance).status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { critical: 0, warning: 0, success: 0 });
  }, [projects]);
  
  const statusItems = [
    { 
      key: 'critical', 
      label: 'Critical Projects', 
      count: statusCounts.critical,
      color: SUMMARY_CONFIG.COLORS.ERROR,
      icon: <Error />,
    },
    { 
      key: 'warning', 
      label: 'Warning Projects', 
      count: statusCounts.warning,
      color: SUMMARY_CONFIG.COLORS.WARNING,
      icon: <Warning />,
    },
    { 
      key: 'success', 
      label: 'On Track Projects', 
      count: statusCounts.success,
      color: SUMMARY_CONFIG.COLORS.SUCCESS,
      icon: <CheckCircle />,
    },
  ];
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        avatar={<Business />}
        action={
          onViewDetails && (
            <IconButton onClick={onViewDetails}>
              <OpenInNew />
            </IconButton>
          )
        }
      />
      <CardContent>
        {loading ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <List dense>
            {statusItems.map((item) => (
              <ListItem key={item.key} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: item.color, width: 32, height: 32 }}>
                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Chip 
                        label={item.count} 
                        size="small" 
                        color={item.key === 'success' ? 'success' : item.key === 'warning' ? 'warning' : 'error'}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {!loading && projects.length === 0 && (
          <Alert severity="info">
            No projects found with current filters.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Alerts Card - Displays critical alerts summary
 */
const AlertsCard = ({ 
  alerts = [], 
  loading = false,
  onViewAllAlerts,
}) => {
  const alertCounts = useMemo(() => {
    return alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, { critical: 0, warning: 0, info: 0 });
  }, [alerts]);
  
  const totalAlerts = alerts.length;
  const criticalAlerts = alertCounts.critical || 0;
  const hasAlerts = totalAlerts > 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Budget Alerts"
        avatar={
          <Badge badgeContent={criticalAlerts} color="error">
            <NotificationsActive />
          </Badge>
        }
        action={
          onViewAllAlerts && hasAlerts && (
            <Button size="small" onClick={onViewAllAlerts}>
              View All
            </Button>
          )
        }
      />
      <CardContent>
        {loading ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : hasAlerts ? (
          <Box>
            {/* Alert Summary */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color={criticalAlerts > 0 ? 'error.main' : 'success.main'}>
                {totalAlerts} Active Alert{totalAlerts > 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {criticalAlerts} critical, {alertCounts.warning || 0} warning, {alertCounts.info || 0} info
              </Typography>
            </Box>
            
            {/* Recent Alerts */}
            <List dense>
              {alerts.slice(0, 3).map((alert, index) => {
                const severityConfig = {
                  critical: { color: 'error', icon: <Error /> },
                  warning: { color: 'warning', icon: <Warning /> },
                  info: { color: 'info', icon: <Info /> },
                }[alert.severity] || { color: 'info', icon: <Info /> };
                
                return (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {React.cloneElement(severityConfig.icon, { color: severityConfig.color })}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {alert.message || alert.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {alert.projectName && `${alert.projectName} • `}
                          {alert.category}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
            
            {alerts.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                +{alerts.length - 3} more alerts
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body1" color="success.main" gutterBottom>
              All Clear!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No budget alerts at this time.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Performance Card - Displays key performance indicators
 */
const PerformanceCard = ({ 
  title = "Performance Overview",
  metrics = [],
  loading = false,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        avatar={<QueryStats />}
      />
      <CardContent>
        {loading ? (
          <Box>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <Stack spacing={2}>
            {metrics.map((metric, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metric.value}
                    {metric.unit && <Typography component="span" variant="caption" color="text.secondary">{metric.unit}</Typography>}
                  </Typography>
                </Box>
                
                {metric.progress !== undefined && (
                  <LinearProgress 
                    variant="determinate" 
                    value={metric.progress}
                    color={metric.progress >= 80 ? 'success' : metric.progress >= 60 ? 'warning' : 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                )}
                
                {index < metrics.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN SUMMARY CARDS COMPONENT
// =============================================================================

/**
 * BudgetVarianceSummaryCards - Dashboard summary cards component
 * 
 * Features:
 * - Portfolio financial metrics overview
 * - Project status distribution
 * - Critical alerts summary  
 * - Performance indicators
 * - Real-time data display
 * - Mobile-responsive grid layout
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dashboardStats - Dashboard statistics
 * @param {Object} props.portfolioSummary - Portfolio summary data
 * @param {Object} props.projectVariance - Single project variance data (if applicable)
 * @param {Array} props.alerts - Active alerts list
 * @param {Object} props.loadingStates - Loading states for different sections
 * @param {Function} props.onNavigateToProject - Navigate to project handler
 * @param {Function} props.onViewAlerts - View alerts handler
 * @param {Function} props.onRefreshData - Refresh data handler
 * @returns {JSX.Element} BudgetVarianceSummaryCards component
 */
const BudgetVarianceSummaryCards = ({
  dashboardStats = {},
  portfolioSummary = {},
  projectVariance = null,
  alerts = [],
  loadingStates = {},
  onNavigateToProject,
  onViewAlerts,
  onRefreshData,
}) => {
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Generate metric cards data
   */
  const metricCards = useMemo(() => {
    const isPortfolioView = !projectVariance;
    
    if (isPortfolioView) {
      // Portfolio view metrics
      return [
        {
          title: 'Total Budget Target',
          value: portfolioSummary.totalBudgetTarget || 0,
          target: portfolioSummary.totalBudgetTarget || 0,
          variance: 0,
          icon: <AccountBalance />,
          subtitle: `${portfolioSummary.totalProjects || 0} projects`,
        },
        {
          title: 'Total Revenue Generated',
          value: portfolioSummary.totalRevenue || 0,
          target: portfolioSummary.totalBudgetTarget || 0,
          variance: dashboardStats.totalVariance || 0,
          icon: <MonetizationOn />,
          subtitle: `Across ${portfolioSummary.totalProjects || 0} projects`,
        },
        {
          title: 'Portfolio Variance',
          value: Math.abs(dashboardStats.totalVariance || 0),
          unit: '%',
          variance: dashboardStats.totalVariance || 0,
          icon: <CompareArrows />,
          subtitle: dashboardStats.totalVariance >= 0 ? 'Above target' : 'Behind target',
        },
        {
          title: 'Projects Needing Attention',
          value: (portfolioSummary.criticalProjects || 0) + (portfolioSummary.warningProjects || 0),
          target: portfolioSummary.totalProjects || 1,
          variance: portfolioSummary.totalProjects > 0 ? 
            (((portfolioSummary.criticalProjects || 0) + (portfolioSummary.warningProjects || 0)) / portfolioSummary.totalProjects) * 100 - 25 : 0,
          icon: <Flag />,
          subtitle: `${portfolioSummary.criticalProjects || 0} critical, ${portfolioSummary.warningProjects || 0} warning`,
        },
      ];
    } else {
      // Single project view metrics
      const { project, calculations, sales } = projectVariance;
      return [
        {
          title: 'Project Budget Target',
          value: project.budgetTarget || 0,
          target: project.budgetTarget || 0,
          variance: 0,
          icon: <AccountBalance />,
          subtitle: `${project.totalUnits || 0} total units`,
        },
        {
          title: 'Revenue Generated',
          value: sales.totalRevenue || 0,
          target: project.budgetTarget || 0,
          variance: calculations.variancePercentage || 0,
          icon: <MonetizationOn />,
          subtitle: `${sales.unitsSold || 0} units sold`,
        },
        {
          title: 'Budget Variance',
          value: Math.abs(calculations.variancePercentage || 0),
          unit: '%',
          variance: calculations.variancePercentage || 0,
          icon: <CompareArrows />,
          subtitle: calculations.variancePercentage >= 0 ? 'Above target' : 'Behind target',
        },
        {
          title: 'Remaining Revenue Required',
          value: calculations.requiredRevenueFromRemainingUnits || 0,
          target: project.budgetTarget || 0,
          variance: calculations.priceAdjustmentNeeded || 0,
          icon: <AttachMoney />,
          subtitle: `${calculations.remainingUnits || 0} units remaining`,
        },
      ];
    }
  }, [dashboardStats, portfolioSummary, projectVariance]);
  
  /**
   * Generate performance metrics
   */
  const performanceMetrics = useMemo(() => {
    const isPortfolioView = !projectVariance;
    
    if (isPortfolioView) {
      return [
        {
          label: 'Portfolio Health Score',
          value: portfolioSummary.totalProjects > 0 ? 
            Math.round(((portfolioSummary.totalProjects - portfolioSummary.criticalProjects - portfolioSummary.warningProjects) / portfolioSummary.totalProjects) * 100) : 100,
          unit: '%',
          progress: portfolioSummary.totalProjects > 0 ? 
            ((portfolioSummary.totalProjects - portfolioSummary.criticalProjects - portfolioSummary.warningProjects) / portfolioSummary.totalProjects) * 100 : 100,
        },
        {
          label: 'Average Revenue Progress',
          value: portfolioSummary.totalBudgetTarget > 0 ? 
            Math.round((portfolioSummary.totalRevenue / portfolioSummary.totalBudgetTarget) * 100) : 0,
          unit: '%',
          progress: portfolioSummary.totalBudgetTarget > 0 ? 
            (portfolioSummary.totalRevenue / portfolioSummary.totalBudgetTarget) * 100 : 0,
        },
        {
          label: 'Critical Projects Ratio',
          value: portfolioSummary.totalProjects > 0 ? 
            Math.round((portfolioSummary.criticalProjects / portfolioSummary.totalProjects) * 100) : 0,
          unit: '%',
          progress: 100 - (portfolioSummary.totalProjects > 0 ? 
            (portfolioSummary.criticalProjects / portfolioSummary.totalProjects) * 100 : 0),
        },
      ];
    } else {
      const { project, calculations, performance, sales } = projectVariance;
      return [
        {
          label: 'Budget Progress',
          value: Math.round(performance.budgetProgress || 0),
          unit: '%',
          progress: performance.budgetProgress || 0,
        },
        {
          label: 'Sales Progress',
          value: Math.round(performance.salesProgress || 0),
          unit: '%',
          progress: performance.salesProgress || 0,
        },
        {
          label: 'Average Sale Price',
          value: budgetHelpers.formatAmountWithSuffix(sales.averageSalePrice || 0),
          progress: project.targetPricePerUnit > 0 ? 
            Math.min((sales.averageSalePrice / project.targetPricePerUnit) * 100, 100) : 0,
        },
        {
          label: 'Price Adjustment Needed',
          value: `${calculations.priceAdjustmentNeeded >= 0 ? '+' : ''}${(calculations.priceAdjustmentNeeded || 0).toFixed(1)}%`,
          progress: 100 - Math.min(Math.abs(calculations.priceAdjustmentNeeded || 0), 100),
        },
      ];
    }
  }, [portfolioSummary, projectVariance]);
  
  /**
   * Get projects list for status card
   */
  const projectsList = useMemo(() => {
    return projectVariance ? [projectVariance] : (portfolioSummary.projects || []);
  }, [portfolioSummary.projects, projectVariance]);
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        {/* Metric Cards */}
        {metricCards.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <MetricCard
              {...metric}
              loading={loadingStates.portfolio}
              onClick={metric.title.includes('Project') && onNavigateToProject ? 
                () => onNavigateToProject(projectVariance?.project?.id) : undefined
              }
            />
          </Grid>
        ))}
        
        {/* Status Card */}
        <Grid item xs={12} md={6} lg={4}>
          <StatusCard
            title={projectVariance ? "Project Status" : "Portfolio Status"}
            projects={projectsList}
            loading={loadingStates.portfolio}
            onViewDetails={() => {
              // Navigate to detailed project analysis
              if (projectVariance && onNavigateToProject) {
                onNavigateToProject(projectVariance.project.id);
              }
            }}
          />
        </Grid>
        
        {/* Alerts Card */}
        <Grid item xs={12} md={6} lg={4}>
          <AlertsCard
            alerts={alerts}
            loading={loadingStates.alerts}
            onViewAllAlerts={onViewAlerts}
          />
        </Grid>
        
        {/* Performance Card */}
        <Grid item xs={12} lg={4}>
          <PerformanceCard
            title={projectVariance ? "Project Performance" : "Portfolio Performance"}
            metrics={performanceMetrics}
            loading={loadingStates.portfolio}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BudgetVarianceSummaryCards;
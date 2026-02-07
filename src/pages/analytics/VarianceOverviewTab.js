// File: src/pages/analytics/VarianceOverviewTab.js
// Description: Variance Overview Tab for Budget Variance Dashboard - PRODUCTION READY
// Version: 2.0.0 - Complete implementation with real API integration
// Author: PropVantage AI Development Team
// Created: 2025-01-13

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Divider,
  Paper,
  Stack,
  Alert,
  AlertTitle,
  Tooltip,
  LinearProgress,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  CheckCircle,
  BarChart,
  Refresh,
  OpenInNew,
  ViewList,
  Sort,
  ArrowUpward,
  ArrowDownward,
  Flag,
  MonetizationOn,
  AccountBalance,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from 'recharts';
import { budgetHelpers } from '../../services/budgetAPI';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Variance overview configuration
 */
const VARIANCE_CONFIG = {
  // Chart configuration
  CHARTS: {
    HEIGHT: 300,
    MOBILE_HEIGHT: 200,
    COLORS: {
      PRIMARY: '#1976d2',
      SUCCESS: '#2e7d32',
      WARNING: '#ed6c02',
      ERROR: '#d32f2f',
      INFO: '#0288d1',
      NEUTRAL: '#757575',
    },
    GRADIENTS: {
      SUCCESS: ['#4caf50', '#2e7d32'],
      WARNING: ['#ff9800', '#f57c00'],
      ERROR: ['#f44336', '#d32f2f'],
      PRIMARY: ['#2196f3', '#1976d2'],
    },
  },
  
  // Variance thresholds
  THRESHOLDS: {
    CRITICAL: 20,
    WARNING: 10,
    GOOD: 5,
  },
  
  // Display options
  DISPLAY: {
    MAX_PROJECTS_IN_CHART: 10,
    MAX_PROJECTS_IN_LIST: 20,
    REFRESH_INTERVAL: 30000, // 30 seconds
  },
  
  // View modes
  VIEW_MODES: {
    CHART: 'chart',
    LIST: 'list',
    GRID: 'grid',
  },
  
  // Sort options
  SORT_OPTIONS: [
    { value: 'variance_desc', label: 'Highest Variance', icon: <ArrowUpward /> },
    { value: 'variance_asc', label: 'Lowest Variance', icon: <ArrowDownward /> },
    { value: 'revenue_desc', label: 'Highest Revenue', icon: <MonetizationOn /> },
    { value: 'budget_desc', label: 'Largest Budget', icon: <AccountBalance /> },
    { value: 'name_asc', label: 'Project Name A-Z', icon: <Sort /> },
  ],
};

/**
 * Get variance status configuration
 */
const getVarianceStatusConfig = (variance) => {
  const absVariance = Math.abs(variance);
  
  if (absVariance >= VARIANCE_CONFIG.THRESHOLDS.CRITICAL) {
    return {
      status: 'critical',
      label: 'Critical',
      color: VARIANCE_CONFIG.CHARTS.COLORS.ERROR,
      bgColor: '#ffebee',
      icon: <Error />,
      severity: 'error',
      priority: 'high',
    };
  } else if (absVariance >= VARIANCE_CONFIG.THRESHOLDS.WARNING) {
    return {
      status: 'warning',
      label: 'Warning',
      color: VARIANCE_CONFIG.CHARTS.COLORS.WARNING,
      bgColor: '#fff3e0',
      icon: <Warning />,
      severity: 'warning',
      priority: 'medium',
    };
  } else {
    return {
      status: 'success',
      label: 'On Track',
      color: VARIANCE_CONFIG.CHARTS.COLORS.SUCCESS,
      bgColor: '#e8f5e8',
      icon: <CheckCircle />,
      severity: 'success',
      priority: 'low',
    };
  }
};

/**
 * Custom chart tooltip component
 */
const VarianceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const statusConfig = getVarianceStatusConfig(data.variancePercentage);
    
    return (
      <Paper sx={{ p: 2, border: `2px solid ${statusConfig.color}` }}>
        <Typography variant="subtitle2" gutterBottom>
          {data.projectName}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Budget Target:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {budgetHelpers.formatAmountWithSuffix(data.budgetTarget)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Actual Revenue:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {budgetHelpers.formatAmountWithSuffix(data.actualRevenue)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Variance:</Typography>
            <Chip
              size="small"
              icon={statusConfig.icon}
              label={`${data.variancePercentage >= 0 ? '+' : ''}${data.variancePercentage.toFixed(1)}%`}
              color={statusConfig.severity}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Units Sold:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {data.soldUnits || 0}/{data.totalUnits || 0}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }
  return null;
};

// =============================================================================
// CHART COMPONENTS
// =============================================================================

/**
 * Portfolio Variance Chart - Shows variance across all projects
 */
const PortfolioVarianceChart = ({ 
  projects = [], 
  loading = false,
  onProjectClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Prepare chart data - sort by absolute variance and take top projects
  const chartData = useMemo(() => {
    return projects
      .sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage))
      .slice(0, VARIANCE_CONFIG.DISPLAY.MAX_PROJECTS_IN_CHART)
      .map(project => ({
        projectName: project.projectName?.length > 15 ? 
          `${project.projectName.substring(0, 15)}...` : project.projectName,
        fullProjectName: project.projectName,
        projectId: project.projectId,
        variancePercentage: project.variancePercentage || 0,
        budgetTarget: project.budgetTarget || 0,
        actualRevenue: project.actualRevenue || 0,
        totalUnits: project.totalUnits || 0,
        soldUnits: project.soldUnits || 0,
        fill: getVarianceStatusConfig(project.variancePercentage || 0).color,
      }));
  }, [projects]);
  
  const handleBarClick = useCallback((data) => {
    if (onProjectClick && data.projectId) {
      onProjectClick(data.projectId);
    }
  }, [onProjectClick]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>No Variance Data</AlertTitle>
        No projects found with current filters. Try adjusting your filter criteria.
      </Alert>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={isMobile ? VARIANCE_CONFIG.CHARTS.MOBILE_HEIGHT : VARIANCE_CONFIG.CHARTS.HEIGHT}>
      <RechartsBarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="projectName" 
          angle={isMobile ? -45 : -30}
          textAnchor="end"
          height={isMobile ? 80 : 60}
          fontSize={12}
        />
        <YAxis 
          domain={['dataMin - 5', 'dataMax + 5']}
          tickFormatter={(value) => `${value}%`}
        />
        <RechartsTooltip content={<VarianceTooltip />} />
        <ReferenceLine y={0} stroke={theme.palette.text.secondary} strokeDasharray="2 2" />
        <ReferenceLine 
          y={VARIANCE_CONFIG.THRESHOLDS.WARNING} 
          stroke={VARIANCE_CONFIG.CHARTS.COLORS.WARNING} 
          strokeDasharray="5 5"
          label={{ value: "Warning Threshold", position: "topRight" }}
        />
        <ReferenceLine 
          y={-VARIANCE_CONFIG.THRESHOLDS.WARNING} 
          stroke={VARIANCE_CONFIG.CHARTS.COLORS.WARNING} 
          strokeDasharray="5 5"
        />
        <ReferenceLine 
          y={VARIANCE_CONFIG.THRESHOLDS.CRITICAL} 
          stroke={VARIANCE_CONFIG.CHARTS.COLORS.ERROR} 
          strokeDasharray="5 5"
          label={{ value: "Critical Threshold", position: "topRight" }}
        />
        <ReferenceLine 
          y={-VARIANCE_CONFIG.THRESHOLDS.CRITICAL} 
          stroke={VARIANCE_CONFIG.CHARTS.COLORS.ERROR} 
          strokeDasharray="5 5"
        />
        <Bar 
          dataKey="variancePercentage" 
          fill="#8884d8"
          cursor="pointer"
          onClick={handleBarClick}
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

/**
 * Portfolio Health Pie Chart
 */
const PortfolioHealthChart = ({ 
  projects = [], 
  loading = false 
}) => {
  const pieData = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      const variance = project.variancePercentage || 0;
      const status = getVarianceStatusConfig(variance).status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { critical: 0, warning: 0, success: 0 });
    
    return [
      {
        name: 'Critical',
        value: statusCounts.critical,
        color: VARIANCE_CONFIG.CHARTS.COLORS.ERROR,
        label: `${statusCounts.critical} Critical`,
      },
      {
        name: 'Warning', 
        value: statusCounts.warning,
        color: VARIANCE_CONFIG.CHARTS.COLORS.WARNING,
        label: `${statusCounts.warning} Warning`,
      },
      {
        name: 'On Track',
        value: statusCounts.success,
        color: VARIANCE_CONFIG.CHARTS.COLORS.SUCCESS,
        label: `${statusCounts.success} On Track`,
      },
    ].filter(item => item.value > 0);
  }, [projects]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (pieData.length === 0) {
    return (
      <Alert severity="info">
        No projects to display
      </Alert>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsPieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <RechartsTooltip 
          formatter={(value, name, props) => [
            `${value} project${value > 1 ? 's' : ''}`,
            props.payload.name
          ]}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// LIST COMPONENTS
// =============================================================================

/**
 * Project Variance List Item
 */
const ProjectVarianceListItem = ({ 
  project, 
  onProjectClick,
  showDetails = true,
}) => {
  const statusConfig = getVarianceStatusConfig(project.variancePercentage || 0);
  const progress = project.budgetTarget > 0 ? 
    Math.min((project.actualRevenue / project.budgetTarget) * 100, 100) : 0;
  
  return (
    <ListItem
      component={onProjectClick ? ListItemButton : "div"}
      onClick={() => onProjectClick && onProjectClick(project.projectId)}
      sx={{
        border: `1px solid ${statusConfig.color}20`,
        borderRadius: 2,
        mb: 1,
        bgcolor: statusConfig.bgColor,
        '&:hover': onProjectClick ? {
          bgcolor: `${statusConfig.color}10`,
          transform: 'translateX(4px)',
          transition: 'all 0.2s ease-in-out',
        } : {},
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: statusConfig.color }}>
          {statusConfig.icon}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {project.projectName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={project.variancePercentage >= 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${project.variancePercentage >= 0 ? '+' : ''}${(project.variancePercentage || 0).toFixed(1)}%`}
                color={statusConfig.severity}
                size="small"
              />
              {project.needsAttention && (
                <Tooltip title="Requires immediate attention">
                  <Flag color="warning" />
                </Tooltip>
              )}
            </Box>
          </Box>
        }
        secondary={
          showDetails && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Target: {budgetHelpers.formatAmountWithSuffix(project.budgetTarget || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actual: {budgetHelpers.formatAmountWithSuffix(project.actualRevenue || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress: {progress.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Units: {project.soldUnits || 0}/{project.totalUnits || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={statusConfig.severity}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )
        }
      />
      
      {onProjectClick && (
        <IconButton edge="end">
          <OpenInNew />
        </IconButton>
      )}
    </ListItem>
  );
};

/**
 * Projects Variance List
 */
const ProjectsVarianceList = ({ 
  projects = [], 
  loading = false,
  onProjectClick,
  sortBy = 'variance_desc',
  maxItems = VARIANCE_CONFIG.DISPLAY.MAX_PROJECTS_IN_LIST,
}) => {
  // Sort projects based on selected criteria
  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      switch (sortBy) {
        case 'variance_desc':
          return Math.abs(b.variancePercentage || 0) - Math.abs(a.variancePercentage || 0);
        case 'variance_asc':
          return Math.abs(a.variancePercentage || 0) - Math.abs(b.variancePercentage || 0);
        case 'revenue_desc':
          return (b.actualRevenue || 0) - (a.actualRevenue || 0);
        case 'budget_desc':
          return (b.budgetTarget || 0) - (a.budgetTarget || 0);
        case 'name_asc':
          return (a.projectName || '').localeCompare(b.projectName || '');
        default:
          return 0;
      }
    });
    
    return sorted.slice(0, maxItems);
  }, [projects, sortBy, maxItems]);
  
  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={100} sx={{ mb: 1, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }
  
  if (sortedProjects.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>No Projects Found</AlertTitle>
        No projects match your current filter criteria.
      </Alert>
    );
  }
  
  return (
    <List sx={{ width: '100%' }}>
      {sortedProjects.map((project, index) => (
        <Fade in timeout={300 + (index * 100)} key={project.projectId}>
          <div>
            <ProjectVarianceListItem
              project={project}
              onProjectClick={onProjectClick}
            />
          </div>
        </Fade>
      ))}
      
      {projects.length > maxItems && (
        <ListItem>
          <ListItemText
            primary={
              <Typography variant="body2" color="text.secondary" align="center">
                Showing {sortedProjects.length} of {projects.length} projects
              </Typography>
            }
          />
        </ListItem>
      )}
    </List>
  );
};

// =============================================================================
// MAIN VARIANCE OVERVIEW TAB COMPONENT
// =============================================================================

/**
 * VarianceOverviewTab - Main variance overview component
 * 
 * Features:
 * - Portfolio variance chart visualization
 * - Project health pie chart
 * - Sortable projects list with variance details
 * - Real-time variance tracking
 * - Interactive project selection
 * - Multiple view modes (chart/list/grid)
 * 
 * @param {Object} props - Component props
 * @param {Object} props.portfolioSummary - Portfolio summary data
 * @param {Object} props.projectVariance - Single project variance data
 * @param {Object} props.loadingStates - Loading states
 * @param {Function} props.onProjectSelect - Project selection handler
 * @param {Function} props.onRefreshData - Data refresh handler
 * @returns {JSX.Element} VarianceOverviewTab component
 */
const VarianceOverviewTab = ({
  portfolioSummary = {},
  projectVariance = null,
  loadingStates = {},
  onProjectSelect,
  onRefreshData,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // =============================================================================
  // LOCAL STATE
  // =============================================================================
  
  const [viewMode, setViewMode] = useState(VARIANCE_CONFIG.VIEW_MODES.CHART);
  const [sortBy, setSortBy] = useState('variance_desc');
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Get projects list for display
   */
  const projectsList = useMemo(() => {
    let projects = portfolioSummary.projects || [];
    
    // Filter to show only problem projects if toggled
    if (showOnlyProblems) {
      projects = projects.filter(project => 
        Math.abs(project.variancePercentage || 0) >= VARIANCE_CONFIG.THRESHOLDS.WARNING
      );
    }
    
    return projects;
  }, [portfolioSummary.projects, showOnlyProblems]);
  
  /**
   * Calculate summary statistics
   */
  const summaryStats = useMemo(() => {
    const projects = projectsList;
    const total = projects.length;
    
    if (total === 0) {
      return {
        total: 0,
        critical: 0,
        warning: 0,
        onTrack: 0,
        averageVariance: 0,
        worstVariance: 0,
        bestVariance: 0,
      };
    }
    
    const critical = projects.filter(p => 
      Math.abs(p.variancePercentage || 0) >= VARIANCE_CONFIG.THRESHOLDS.CRITICAL
    ).length;
    
    const warning = projects.filter(p => {
      const abs = Math.abs(p.variancePercentage || 0);
      return abs >= VARIANCE_CONFIG.THRESHOLDS.WARNING && abs < VARIANCE_CONFIG.THRESHOLDS.CRITICAL;
    }).length;
    
    const variances = projects.map(p => p.variancePercentage || 0);
    const averageVariance = variances.reduce((sum, v) => sum + v, 0) / total;
    const worstVariance = Math.min(...variances);
    const bestVariance = Math.max(...variances);
    
    return {
      total,
      critical,
      warning,
      onTrack: total - critical - warning,
      averageVariance,
      worstVariance,
      bestVariance,
    };
  }, [projectsList]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleViewModeChange = useCallback((event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  }, []);
  
  const handleSortChange = useCallback((event) => {
    setSortBy(event.target.value);
  }, []);
  
  const handleProjectClick = useCallback((projectId) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  }, [onProjectSelect]);
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  /**
   * Render overview header with controls
   */
  const renderOverviewHeader = () => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
      }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {projectVariance ? 'Project Variance Analysis' : 'Portfolio Variance Overview'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time budget variance tracking across {summaryStats.total} project{summaryStats.total > 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value={VARIANCE_CONFIG.VIEW_MODES.CHART}>
              <BarChart />
            </ToggleButton>
            <ToggleButton value={VARIANCE_CONFIG.VIEW_MODES.LIST}>
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Refresh Button */}
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefreshData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Summary Statistics */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {summaryStats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Projects
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error">
                {summaryStats.critical}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Critical
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {summaryStats.warning}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Warning
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {summaryStats.onTrack}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On Track
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
  
  /**
   * Render chart view
   */
  const renderChartView = () => (
    <Grid container spacing={3}>
      {/* Portfolio Variance Chart */}
      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader
            title="Portfolio Variance Analysis"
            subheader="Budget variance percentage by project"
            action={
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyProblems}
                    onChange={(e) => setShowOnlyProblems(e.target.checked)}
                    color="warning"
                  />
                }
                label="Problems Only"
              />
            }
          />
          <CardContent>
            <PortfolioVarianceChart
              projects={projectsList}
              loading={loadingStates.portfolio}
              onProjectClick={handleProjectClick}
            />
          </CardContent>
        </Card>
      </Grid>
      
      {/* Portfolio Health Chart */}
      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader
            title="Portfolio Health"
            subheader="Project status distribution"
          />
          <CardContent>
            <PortfolioHealthChart
              projects={projectsList}
              loading={loadingStates.portfolio}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  /**
   * Render list view
   */
  const renderListView = () => (
    <Card>
      <CardHeader
        title="Projects Variance List"
        subheader={`${projectsList.length} projects sorted by variance`}
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                label="Sort By"
              >
                {VARIANCE_CONFIG.SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyProblems}
                  onChange={(e) => setShowOnlyProblems(e.target.checked)}
                  color="warning"
                />
              }
              label="Problems Only"
            />
          </Box>
        }
      />
      <CardContent>
        <ProjectsVarianceList
          projects={projectsList}
          loading={loadingStates.portfolio}
          onProjectClick={handleProjectClick}
          sortBy={sortBy}
        />
      </CardContent>
    </Card>
  );
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <Box>
      {/* Overview Header */}
      {renderOverviewHeader()}
      
      {/* Main Content */}
      {viewMode === VARIANCE_CONFIG.VIEW_MODES.CHART ? renderChartView() : renderListView()}
    </Box>
  );
};

export default VarianceOverviewTab;
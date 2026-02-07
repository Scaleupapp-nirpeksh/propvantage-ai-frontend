/**
 * File: src/pages/payments/CollectionPerformancePage.js
 * Description: Advanced collection performance analytics with team metrics, efficiency tracking,
 *              and actionable insights for improving payment collection rates
 * Version: 1.1 - Cleaned of mock data, ready for API integration
 * Location: src/pages/payments/CollectionPerformancePage.js
 * 
 * Features:
 * - Collection efficiency metrics and KPIs
 * - Team performance tracking and leaderboards
 * - Project-wise collection analysis
 * - Collection trends and forecasting
 * - Performance improvement recommendations
 * - Comparative analysis across periods
 * - Collection strategy insights
 * - Export and reporting capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Avatar,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import {
  Speed,
  TrendingUp,
  TrendingDown,
  Star,
  EmojiEvents,
  Refresh,
  FilterList,
  ExpandMore,
  Download,
  Share,
  Analytics,
  Insights,
  CheckCircle,
  Warning,
  Business,
  Group,
  Flag,
  Schedule,
  ContactPhone,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { paymentAPI, salesAPI, userAPI } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

/**
 * Performance metric configurations
 */
const PERFORMANCE_METRICS = [
  {
    id: 'collection_rate',
    label: 'Collection Rate',
    description: 'Percentage of due payments collected on time',
    icon: Speed,
    format: 'percentage',
    target: 85,
    color: 'primary',
  },
  {
    id: 'avg_collection_time',
    label: 'Avg Collection Time',
    description: 'Average days from due date to collection',
    icon: Schedule,
    format: 'days',
    target: 7,
    color: 'info',
  },
  {
    id: 'overdue_ratio',
    label: 'Overdue Ratio',
    description: 'Percentage of payments that become overdue',
    icon: Warning,
    format: 'percentage',
    target: 15,
    color: 'warning',
    inverse: true, // Lower is better
  },
  {
    id: 'first_contact_success',
    label: 'First Contact Success',
    description: 'Payments collected after first contact',
    icon: ContactPhone,
    format: 'percentage',
    target: 60,
    color: 'success',
  },
];

/**
 * Team performance ranking system
 */
const PERFORMANCE_RANKINGS = [
  { rank: 1, label: 'Excellent', color: 'gold', icon: EmojiEvents, threshold: 90 },
  { rank: 2, label: 'Good', color: 'silver', icon: Star, threshold: 75 },
  { rank: 3, label: 'Average', color: 'bronze', icon: Flag, threshold: 60 },
  { rank: 4, label: 'Needs Improvement', color: 'grey', icon: TrendingDown, threshold: 0 },
];

/**
 * Time period options
 */
const TIME_PERIODS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '180', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates performance score based on metrics
 * @param {Object} metrics - Performance metrics
 * @returns {number} Performance score (0-100)
 */
const calculatePerformanceScore = (metrics) => {
  let totalScore = 0;
  let validMetrics = 0;

  PERFORMANCE_METRICS.forEach(metric => {
    const value = metrics[metric.id];
    if (value !== undefined && value !== null) {
      const target = metric.target;
      let score;

      if (metric.inverse) {
        // Lower is better (e.g., overdue ratio)
        score = Math.max(0, Math.min(100, ((target - value) / target) * 100 + 100));
      } else {
        // Higher is better
        score = Math.max(0, Math.min(100, (value / target) * 100));
      }

      totalScore += score;
      validMetrics++;
    }
  });

  return validMetrics > 0 ? Math.round(totalScore / validMetrics) : 0;
};

/**
 * Gets performance ranking based on score
 * @param {number} score - Performance score
 * @returns {Object} Performance ranking
 */
const getPerformanceRanking = (score) => {
  return PERFORMANCE_RANKINGS.find(rank => score >= rank.threshold) || PERFORMANCE_RANKINGS[PERFORMANCE_RANKINGS.length - 1];
};

/**
 * Calculates percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Change percentage and direction
 */
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return { percentage: 0, direction: 'neutral' };
  
  const change = ((current - previous) / previous) * 100;
  return {
    percentage: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
};

/**
 * Formats metric value based on type
 * @param {number} value - Metric value
 * @param {string} format - Format type
 * @returns {string} Formatted value
 */
const formatMetricValue = (value, format) => {
  switch (format) {
    case 'percentage':
      return formatPercentage(value / 100);
    case 'days':
      return `${value} days`;
    case 'currency':
      return formatCurrency(value);
    default:
      return value?.toString() || '0';
  }
};

// ============================================================================
// PERFORMANCE OVERVIEW COMPONENT
// ============================================================================

/**
 * Performance overview with key metrics
 * @param {Object} performanceData - Performance data
 * @param {boolean} loading - Loading state
 */
const PerformanceOverview = ({ performanceData, loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Grid container spacing={3}>
        {PERFORMANCE_METRICS.map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card sx={{ height: 140 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={30} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!performanceData || !performanceData.metrics) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { metrics, previousMetrics = {} } = performanceData;
  const performanceScore = calculatePerformanceScore(metrics);
  const ranking = getPerformanceRanking(performanceScore);

  return (
    <Box>
      {/* Overall Performance Score */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette[ranking.color === 'gold' ? 'warning' : ranking.color === 'silver' ? 'info' : 'primary'].main} 0%, ${theme.palette[ranking.color === 'gold' ? 'warning' : ranking.color === 'silver' ? 'info' : 'primary'].dark} 100%)`, color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Overall Collection Performance
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                {performanceScore}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ranking.icon sx={{ fontSize: 20 }} />
                <Typography variant="body1">
                  {ranking.label}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={performanceScore}
                size={80}
                thickness={4}
                sx={{
                  color: 'white',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                Performance Score
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Individual Metrics */}
      <Grid container spacing={3}>
        {PERFORMANCE_METRICS.map((metric) => {
          const currentValue = metrics[metric.id] || 0;
          const previousValue = previousMetrics[metric.id] || 0;
          const change = calculateChange(currentValue, previousValue);
          const isOnTarget = metric.inverse 
            ? currentValue <= metric.target 
            : currentValue >= metric.target;

          return (
            <Grid item xs={12} sm={6} lg={3} key={metric.id}>
              <Card 
                sx={{ 
                  height: 140,
                  border: isOnTarget ? 2 : 1,
                  borderColor: isOnTarget ? 'success.main' : 'divider',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {metric.label}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color={`${metric.color}.main`}>
                        {formatMetricValue(currentValue, metric.format)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target: {formatMetricValue(metric.target, metric.format)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <metric.icon sx={{ fontSize: 32, color: `${metric.color}.main`, opacity: 0.8 }} />
                      {change.direction !== 'neutral' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {change.direction === 'up' ? (
                            <TrendingUp sx={{ fontSize: 16, color: metric.inverse ? 'error.main' : 'success.main' }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: metric.inverse ? 'success.main' : 'error.main' }} />
                          )}
                          <Typography 
                            variant="caption" 
                            color={change.direction === 'up' ? (metric.inverse ? 'error.main' : 'success.main') : (metric.inverse ? 'success.main' : 'error.main')}
                            sx={{ ml: 0.5 }}
                          >
                            {formatPercentage(change.percentage / 100)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  {isOnTarget && (
                    <Chip 
                      size="small" 
                      label="On Target" 
                      color="success" 
                      variant="outlined"
                      icon={<CheckCircle />}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

// ============================================================================
// TEAM PERFORMANCE COMPONENT
// ============================================================================

/**
 * Team performance leaderboard and analysis
 * @param {Array} teamData - Team performance data
 * @param {boolean} loading - Loading state
 */
const TeamPerformanceLeaderboard = ({ teamData, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Team Performance" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </CardContent>
      </Card>
    );
  }

  if (!teamData || teamData.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Team Performance Leaderboard"
          subheader="Top performers based on collection efficiency metrics"
          avatar={<Group color="primary" />}
        />
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No team performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate performance scores and sort
  const sortedTeam = teamData
    .map(member => ({
      ...member,
      performanceScore: calculatePerformanceScore({
        collection_rate: member.collectionRate,
        avg_collection_time: member.avgCollectionTime,
        overdue_ratio: member.overdueRatio,
        first_contact_success: member.contactSuccess,
      }),
    }))
    .sort((a, b) => b.performanceScore - a.performanceScore);

  return (
    <Card>
      <CardHeader
        title="Team Performance Leaderboard"
        subheader={`Top performers based on collection efficiency metrics`}
        avatar={<Group color="primary" />}
      />
      <CardContent>
        <List>
          {sortedTeam.map((member, index) => {
            const ranking = getPerformanceRanking(member.performanceScore);
            const isTopPerformer = index === 0;
            
            return (
              <ListItem key={member.id} divider={index < sortedTeam.length - 1}>
                <ListItemIcon>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: isTopPerformer ? 'gold' : 'primary.main',
                      color: isTopPerformer ? 'black' : 'white',
                    }}>
                      {member.avatar || member.name?.charAt(0)}
                    </Avatar>
                    {isTopPerformer && (
                      <EmojiEvents 
                        sx={{ 
                          position: 'absolute', 
                          top: -5, 
                          right: -5, 
                          fontSize: 16, 
                          color: 'gold' 
                        }} 
                      />
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        left: -8, 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: 20, 
                        height: 20, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {member.name}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={ranking.label} 
                        color={ranking.color === 'gold' ? 'warning' : ranking.color === 'silver' ? 'info' : 'primary'}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {member.role} • Collections: {formatCurrency(member.collectionsThisMonth || 0)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption">
                          Rate: {formatPercentage((member.collectionRate || 0) / 100)}
                        </Typography>
                        <Typography variant="caption">
                          Avg Time: {member.avgCollectionTime || 0} days
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {member.performanceScore}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={member.performanceScore}
                      sx={{ 
                        width: 100, 
                        mt: 0.5,
                        height: 6,
                        borderRadius: 3,
                      }}
                      color={ranking.color === 'gold' ? 'warning' : ranking.color === 'silver' ? 'info' : 'primary'}
                    />
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PROJECT PERFORMANCE COMPONENT
// ============================================================================

/**
 * Project-wise collection performance analysis
 * @param {Array} projectData - Project performance data
 * @param {boolean} loading - Loading state
 */
const ProjectPerformanceAnalysis = ({ projectData, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Project Performance" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </CardContent>
      </Card>
    );
  }

  if (!projectData || projectData.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Project Collection Performance"
          subheader="Collection efficiency across active projects"
          avatar={<Business color="primary" />}
        />
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No project performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Project Collection Performance"
        subheader="Collection efficiency across active projects"
        avatar={<Business color="primary" />}
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell align="right">Total Sales</TableCell>
                <TableCell align="right">Collected</TableCell>
                <TableCell align="right">Collection Rate</TableCell>
                <TableCell align="right">Pending</TableCell>
                <TableCell align="right">Overdue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projectData.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.soldUnits || 0}/{project.totalUnits || 0} units sold
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(project.totalSales || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main" fontWeight="medium">
                      {formatCurrency(project.totalCollected || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.collectionRate || 0}
                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                        color={(project.collectionRate || 0) >= 85 ? 'success' : 'warning'}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        {formatPercentage((project.collectionRate || 0) / 100)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="warning.main">
                      {formatCurrency(project.pendingAmount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(project.overdueAmount || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PERFORMANCE INSIGHTS COMPONENT
// ============================================================================

/**
 * Performance insights and recommendations
 * @param {Object} performanceData - Performance data
 * @param {boolean} loading - Loading state
 */
const PerformanceInsights = ({ performanceData, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Performance Insights" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </CardContent>
      </Card>
    );
  }

  const insights = performanceData?.insights || [];

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Performance Insights & Recommendations"
          subheader="AI-powered insights for collection optimization"
          avatar={<Insights color="primary" />}
        />
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">
            No insights available. Performance insights will appear here once data is collected.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Performance Insights & Recommendations"
        subheader="AI-powered insights for collection optimization"
        avatar={<Insights color="primary" />}
      />
      <CardContent>
        <Stack spacing={2}>
          {insights.map((insight, index) => (
            <Alert
              key={index}
              severity={insight.type}
              icon={<insight.icon />}
              action={
                <Button size="small" color="inherit">
                  Act Now
                </Button>
              }
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {insight.title}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {insight.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recommended Action: {insight.action}
              </Typography>
            </Alert>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COLLECTION FILTERS COMPONENT
// ============================================================================

/**
 * Collection performance filters
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Filter change callback
 */
const CollectionFilters = ({ filters, onFilterChange }) => {
  const [expanded, setExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={(_, isExpanded) => setExpanded(isExpanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FilterList color="primary" />
            <Typography variant="h6">
              Performance Filters
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Time Period */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filters.period || '30'}
                  label="Time Period"
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                >
                  {TIME_PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* View Type */}
            <Grid item xs={12} md={4}>
              <ToggleButtonGroup
                value={filters.viewType || 'overview'}
                exclusive
                onChange={(e, value) => value && handleFilterChange('viewType', value)}
                fullWidth
              >
                <ToggleButton value="overview">Overview</ToggleButton>
                <ToggleButton value="detailed">Detailed</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Export Options */}
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                  fullWidth
                >
                  Export Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  size="small"
                  fullWidth
                >
                  Share
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
};

// ============================================================================
// MAIN COLLECTION PERFORMANCE PAGE COMPONENT
// ============================================================================

/**
 * Main collection performance page component
 * Comprehensive collection efficiency analytics and team performance tracking
 */
const CollectionPerformancePage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Data state
  const [performanceData, setPerformanceData] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [projectData, setProjectData] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    period: searchParams.get('period') || '30',
    viewType: searchParams.get('viewType') || 'overview',
  });

  // ============================================================================
  // PERMISSION CHECK
  // ============================================================================

  const canViewPerformance = canAccess && canAccess.viewFinancials ? canAccess.viewFinancials() : true;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches collection performance data
   * @param {boolean} showRefreshing - Whether to show refreshing indicator
   */
  const fetchPerformanceData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching collection performance data...');

      // TODO: Replace with actual API calls
      const performanceResponse = await paymentAPI.getCollectionPerformance({
        period: filters.period,
        viewType: filters.viewType,
      });

      const teamResponse = await userAPI.getTeamPerformance({
        period: filters.period,
      });

      const projectResponse = await salesAPI.getProjectPerformance({
        period: filters.period,
      });

      setPerformanceData(performanceResponse.data);
      setTeamData(teamResponse.data || []);
      setProjectData(projectResponse.data || []);

      console.log('✅ Collection performance data loaded');

    } catch (err) {
      console.error('❌ Error fetching collection performance:', err);
      setError(err.response?.data?.message || 'Failed to load collection performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles filter changes
   * @param {Object} newFilters - New filter values
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handles manual refresh
   */
  const handleRefresh = () => {
    fetchPerformanceData(true);
  };

  /**
   * Handles snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Permission check
  if (!canViewPerformance) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view collection performance data.
        </Alert>
      </Box>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Collection Performance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Advanced collection efficiency analytics and team performance insights
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => navigate('/payments/reports')}
          >
            Detailed Reports
          </Button>
        </Stack>
      </Box>

      {/* Collection Filters */}
      <CollectionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Dashboard Content */}
      <Stack spacing={4}>
        {/* Performance Overview */}
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Performance Overview
          </Typography>
          <PerformanceOverview 
            performanceData={performanceData} 
            loading={loading}
          />
        </Box>

        {/* Team Performance and Project Analysis */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <TeamPerformanceLeaderboard
              teamData={teamData}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} lg={6}>
            <PerformanceInsights
              performanceData={performanceData}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Project Performance */}
        <Box>
          <ProjectPerformanceAnalysis
            projectData={projectData}
            loading={loading}
          />
        </Box>
      </Stack>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CollectionPerformancePage;
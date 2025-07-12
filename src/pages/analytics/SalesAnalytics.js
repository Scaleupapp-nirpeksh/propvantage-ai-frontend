// File: src/pages/analytics/SalesAnalytics.js
// Description: Comprehensive Sales Analytics Dashboard with advanced filtering and visualization
// Version: 1.0 - Production Grade Implementation for Phase 1
// Location: src/pages/analytics/SalesAnalytics.js

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
  People,
  PersonPin,
  Group,
  Star,
  StarBorder,
  ThumbUp,
  ThumbDown,
  Assignment,
  Visibility,
  FileDownload,
  Print,
  Share,
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
  FunnelChart,
  Funnel,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, projectAPI, userAPI } from '../../services/api';

// =============================================================================
// SALES ANALYTICS CONFIGURATION
// =============================================================================

/**
 * Analysis periods for sales data
 */
const SALES_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'current_week', label: 'This Week' },
  { value: 'current_month', label: 'This Month' },
  { value: 'current_quarter', label: 'This Quarter' },
  { value: 'current_year', label: 'This Year' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Sales performance thresholds
 */
const PERFORMANCE_THRESHOLDS = {
  excellent: 90,   // 90%+ achievement = excellent
  good: 75,        // 75-90% achievement = good
  average: 50,     // 50-75% achievement = average
  poor: 50,        // <50% achievement = poor
};

/**
 * Color system for sales metrics
 */
const SALES_COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  chart: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#f57c00', '#00acc1', '#8bc34a'],
  funnel: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
};

/**
 * Sales funnel stages
 */
const SALES_FUNNEL_STAGES = [
  { key: 'leads', label: 'Leads Generated', color: SALES_COLORS.chart[0] },
  { key: 'qualified', label: 'Qualified Leads', color: SALES_COLORS.chart[1] },
  { key: 'proposals', label: 'Proposals Sent', color: SALES_COLORS.chart[2] },
  { key: 'negotiations', label: 'In Negotiation', color: SALES_COLORS.chart[3] },
  { key: 'closed', label: 'Closed Won', color: SALES_COLORS.success },
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

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Advanced Sales Filters Component
 */
const SalesFilters = ({ 
  filters, 
  onFilterChange, 
  projects = [], 
  salesTeam = [],
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
            <Typography variant="h6">Sales Analytics Filters</Typography>
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
                  {SALES_PERIODS.map((period) => (
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

            {/* Sales Person Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sales Person</InputLabel>
                <Select
                  value={filters.salesPerson}
                  onChange={(e) => handleFilterChange('salesPerson', e.target.value)}
                  label="Sales Person"
                >
                  <MenuItem value="all">All Sales Team</MenuItem>
                  {salesTeam.map((person) => (
                    <MenuItem key={person._id} value={person._id}>
                      {person.firstName} {person.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sales Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Sales Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="Booked">Booked</MenuItem>
                  <MenuItem value="Agreement Signed">Agreement Signed</MenuItem>
                  <MenuItem value="Payment Pending">Payment Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Metrics Focus */}
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
                  <MenuItem value="conversion">Conversion Rates</MenuItem>
                  <MenuItem value="performance">Team Performance</MenuItem>
                  <MenuItem value="pipeline">Pipeline Analysis</MenuItem>
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
 * Sales KPI Card Component
 */
const SalesKPICard = ({ 
  title, 
  value, 
  previousValue,
  target,
  unit = 'number', 
  icon: Icon, 
  color = 'primary',
  loading = false,
  showTrend = true,
  subtitle = null,
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

  const targetAchievement = useMemo(() => {
    if (!target || !value) return null;
    return (value / target) * 100;
  }, [value, target]);

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp fontSize="small" color="success" />;
      case 'down': return <TrendingDown fontSize="small" color="error" />;
      default: return <TrendingFlat fontSize="small" color="info" />;
    }
  };

  const formatValue = () => {
    if (loading) return <CircularProgress size={20} />;
    if (unit === 'currency') return formatCurrency(value);
    if (unit === 'percentage') return formatPercentage(value);
    return formatNumber(value);
  };

  const getPerformanceColor = () => {
    if (!targetAchievement) return color;
    if (targetAchievement >= PERFORMANCE_THRESHOLDS.excellent) return 'success';
    if (targetAchievement >= PERFORMANCE_THRESHOLDS.good) return 'info';
    if (targetAchievement >= PERFORMANCE_THRESHOLDS.average) return 'warning';
    return 'error';
  };

  return (
    <Card sx={{ height: '100%' }}>
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

        {/* Target Achievement */}
        {targetAchievement !== null && !loading && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Target Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPercentage(targetAchievement)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(targetAchievement, 100)}
              color={getPerformanceColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Sales Funnel Visualization Component
 */
const SalesFunnelChart = ({ funnelData, loading = false }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!funnelData || funnelData.length === 0) {
    return (
      <Alert severity="info">
        No funnel data available for the selected period.
      </Alert>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <FunnelChart data={funnelData}>
        <RechartsTooltip 
          formatter={(value, name) => [formatNumber(value), name]}
        />
        <Funnel
          dataKey="value"
          data={funnelData}
          isAnimationActive
        >
          {funnelData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={SALES_FUNNEL_STAGES[index]?.color || SALES_COLORS.chart[index]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

/**
 * Sales Team Performance Table
 */
const SalesTeamTable = ({ teamData, loading = false }) => {
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

  const getPerformanceIcon = (achievement) => {
    if (achievement >= PERFORMANCE_THRESHOLDS.excellent) return <Star color="success" />;
    if (achievement >= PERFORMANCE_THRESHOLDS.good) return <ThumbUp color="info" />;
    if (achievement >= PERFORMANCE_THRESHOLDS.average) return <StarBorder color="warning" />;
    return <ThumbDown color="error" />;
  };

  const sortedTeamData = teamData.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Sales Person</TableCell>
            <TableCell align="right">Sales Count</TableCell>
            <TableCell align="right">Revenue</TableCell>
            <TableCell align="right">Avg. Deal Size</TableCell>
            <TableCell align="right">Conversion Rate</TableCell>
            <TableCell align="center">Performance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTeamData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((person, index) => {
              const actualIndex = page * rowsPerPage + index;
              const avgDealSize = person.salesCount > 0 ? person.revenue / person.salesCount : 0;
              const achievement = person.target > 0 ? (person.revenue / person.target) * 100 : 0;
              
              return (
                <TableRow key={person._id || actualIndex}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="primary">
                        #{actualIndex + 1}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {person.firstName?.[0]}{person.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {person.firstName} {person.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {person.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(person.salesCount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(person.revenue || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(avgDealSize)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatPercentage(person.conversionRate || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getPerformanceIcon(achievement)}
                      <Typography variant="caption" color="text.secondary">
                        {formatPercentage(achievement)}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={teamData.length}
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
// MAIN SALES ANALYTICS COMPONENT
// =============================================================================

const SalesAnalytics = () => {
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
    salesPerson: 'all',
    status: 'all',
    focus: 'all',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  
  // Sales analytics data state
  const [salesData, setSalesData] = useState({
    kpis: {
      totalSales: 0,
      totalRevenue: 0,
      averageDealSize: 0,
      conversionRate: 0,
      salesGrowth: 0,
      revenueGrowth: 0,
    },
    trends: [],
    funnel: [],
    teamPerformance: [],
    projectBreakdown: [],
    conversionMetrics: {},
    alerts: [],
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    trends: true,
    funnel: true,
    team: true,
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

    // Add sales person filter
    if (filters.salesPerson !== 'all') {
      params.salesPersonId = filters.salesPerson;
    }

    // Add status filter
    if (filters.status !== 'all') {
      params.status = filters.status;
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
    refreshSalesData();
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
      salesPerson: 'all',
      status: 'all',
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
      const [projectsResponse, usersResponse] = await Promise.all([
        projectAPI.getProjects(),
        userAPI.getUsers() // Get all users, we'll filter on frontend for sales roles
      ]);

      const projectsData = projectsResponse.data?.data || [];
      const usersData = usersResponse.data?.data || [];
      
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      // Filter users to only sales-related roles
      const salesUsers = usersData.filter(user => 
        user.role && (
          user.role.includes('Sales') || 
          user.role === 'Business Head' ||
          user.role === 'Project Director'
        )
      );
      setSalesTeam(Array.isArray(salesUsers) ? salesUsers : []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  /**
   * Fetch sales KPIs
   */
  const fetchSalesKPIs = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, kpis: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getSalesKPIs for KPIs with params:', params);
      
      const response = await budgetVsActualAPI.getSalesKPIs(params);
      console.log('✅ Sales KPIs API Response:', response.data);

      const data = response.data?.data || {};
      
      setSalesData(prev => ({
        ...prev,
        kpis: {
          totalSales: data.sales?.count || 0,
          totalRevenue: data.sales?.totalValue || 0,
          averageDealSize: data.sales?.averageDealSize || 0,
          conversionRate: data.conversion?.overallRate || 0,
          salesGrowth: data.growth?.salesGrowth || 0,
          revenueGrowth: data.growth?.revenueGrowth || 0,
        },
      }));

    } catch (error) {
      console.error('Error fetching sales KPIs:', error);
      // Fallback: Set default values to prevent UI breaking
      setSalesData(prev => ({
        ...prev,
        kpis: {
          totalSales: 0,
          totalRevenue: 0,
          averageDealSize: 0,
          conversionRate: 0,
          salesGrowth: 0,
          revenueGrowth: 0,
        },
      }));
      if (!error.message.includes('404')) {
        setError(`Failed to load sales KPIs: ${error.message}`);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, kpis: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch sales trends
   */
  const fetchSalesTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, trends: true }));
      
      const params = { ...getApiParams(), include: 'trends,monthly' };
      console.log('🔄 Calling budgetVsActualAPI.getSalesAnalysis for trends with params:', params);
      
      const response = await budgetVsActualAPI.getSalesAnalysis(params);
      console.log('✅ Sales Trends API Response:', response.data);

      const data = response.data?.data || {};
      
      // Transform trend data for charts
      const trends = [];
      if (data.trends?.monthly) {
        trends.push(...data.trends.monthly.map(item => ({
          period: `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`,
          sales: item.salesCount || 0,
          revenue: item.revenue || 0,
          conversions: item.conversions || 0,
        })));
      }

      setSalesData(prev => ({
        ...prev,
        trends,
      }));

    } catch (error) {
      console.error('Error fetching sales trends:', error);
      // Fallback: Set empty trends data
      setSalesData(prev => ({
        ...prev,
        trends: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Sales trends API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch sales funnel data
   */
  const fetchSalesFunnel = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, funnel: true }));
      
      const params = { ...getApiParams(), include: 'funnel,conversion' };
      console.log('🔄 Calling budgetVsActualAPI.getLeadAnalysis for funnel with params:', params);
      
      const response = await budgetVsActualAPI.getLeadAnalysis(params);
      console.log('✅ Sales Funnel API Response:', response.data);

      const data = response.data?.data || {};
      
      // Transform funnel data
      const funnelData = SALES_FUNNEL_STAGES.map(stage => ({
        name: stage.label,
        value: data.funnel?.[stage.key] || 0,
        fill: stage.color,
      }));

      setSalesData(prev => ({
        ...prev,
        funnel: funnelData,
        conversionMetrics: data.conversion || {},
      }));

    } catch (error) {
      console.error('Error fetching sales funnel:', error);
      // Fallback: Set empty funnel data
      setSalesData(prev => ({
        ...prev,
        funnel: [],
        conversionMetrics: {},
      }));
      if (!error.message.includes('404')) {
        console.warn('Sales funnel API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, funnel: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch team performance
   */
  const fetchTeamPerformance = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, team: true }));
      
      const params = { ...getApiParams(), include: 'team,individual' };
      console.log('🔄 Calling budgetVsActualAPI.getSalesAnalysis for team performance with params:', params);
      
      const response = await budgetVsActualAPI.getSalesAnalysis(params);
      console.log('✅ Team Performance API Response:', response.data);

      const data = response.data?.data || {};
      
      setSalesData(prev => ({
        ...prev,
        teamPerformance: data.team || [],
      }));

    } catch (error) {
      console.error('Error fetching team performance:', error);
      // Fallback: Set empty team data
      setSalesData(prev => ({
        ...prev,
        teamPerformance: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Team performance API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, team: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch project breakdown
   */
  const fetchProjectBreakdown = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, projects: true }));
      
      const params = { ...getApiParams(), include: 'projects,breakdown' };
      console.log('🔄 Calling budgetVsActualAPI.getProjectComparison with params:', params);
      
      const response = await budgetVsActualAPI.getProjectComparison(params);
      console.log('✅ Project Breakdown API Response:', response.data);

      const data = response.data?.data || {};
      
      setSalesData(prev => ({
        ...prev,
        projectBreakdown: data.projects || [],
      }));

    } catch (error) {
      console.error('Error fetching project breakdown:', error);
      // Fallback: Set empty project data
      setSalesData(prev => ({
        ...prev,
        projectBreakdown: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Project breakdown API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, projects: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all sales data
   */
  const refreshSalesData = useCallback(async () => {
    console.log('🔄 Starting sales analytics refresh with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSalesKPIs(),
        fetchSalesTrends(),
        fetchSalesFunnel(),
        fetchTeamPerformance(),
        fetchProjectBreakdown(),
      ]);
      
      console.log('✅ Sales analytics refresh completed successfully');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing sales analytics:', error);
      setError('Failed to refresh sales data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchSalesKPIs,
    fetchSalesTrends,
    fetchSalesFunnel,
    fetchTeamPerformance,
    fetchProjectBreakdown,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Sales Analytics initializing...');
    fetchFilterOptions();
    refreshSalesData();
  }, []);

  // Refresh data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshSalesData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshSalesData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, refreshSalesData]);

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
    console.log(`Exporting sales data in ${format} format`);
    handleExportClose();
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render Sales KPIs Overview
   */
  const renderSalesKPIs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Total Sales"
          value={salesData.kpis.totalSales}
          unit="number"
          icon={Assignment}
          color="primary"
          loading={loadingStates.kpis}
          subtitle="Bookings completed"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Total Revenue"
          value={salesData.kpis.totalRevenue}
          unit="currency"
          icon={MonetizationOn}
          color="success"
          loading={loadingStates.kpis}
          subtitle="Revenue generated"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Avg Deal Size"
          value={salesData.kpis.averageDealSize}
          unit="currency"
          icon={TrendingUp}
          color="info"
          loading={loadingStates.kpis}
          subtitle="Per sale average"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Conversion Rate"
          value={salesData.kpis.conversionRate}
          unit="percentage"
          icon={ShowChart}
          color="warning"
          loading={loadingStates.kpis}
          subtitle="Lead to sale conversion"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Sales Growth"
          value={salesData.kpis.salesGrowth}
          unit="percentage"
          icon={TrendingUp}
          color="success"
          loading={loadingStates.kpis}
          subtitle="Period over period"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={2}>
        <SalesKPICard
          title="Revenue Growth"
          value={salesData.kpis.revenueGrowth}
          unit="percentage"
          icon={AttachMoney}
          color="success"
          loading={loadingStates.kpis}
          subtitle="Period over period"
        />
      </Grid>
    </Grid>
  );

  /**
   * Render Sales Trends Chart
   */
  const renderSalesTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales Performance Trends
        </Typography>
        
        {loadingStates.trends ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : salesData.trends.length === 0 ? (
          <Alert severity="info">
            No sales trend data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={salesData.trends}>
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name === 'revenue' ? 'Revenue' : name === 'sales' ? 'Sales Count' : 'Conversions'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="sales" 
                fill={SALES_COLORS.primary}
                name="Sales Count"
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke={SALES_COLORS.success}
                fill={SALES_COLORS.success}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="conversions" 
                stroke={SALES_COLORS.warning}
                strokeWidth={3}
                name="Conversions"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Sales Funnel
   */
  const renderSalesFunnel = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales Conversion Funnel
        </Typography>
        
        <SalesFunnelChart 
          funnelData={salesData.funnel} 
          loading={loadingStates.funnel} 
        />
        
        {/* Conversion Metrics */}
        {Object.keys(salesData.conversionMetrics).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Conversion Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Lead to Qualified
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatPercentage(salesData.conversionMetrics.leadToQualified || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Qualified to Proposal
                </Typography>
                <Typography variant="h6" color="info.main">
                  {formatPercentage(salesData.conversionMetrics.qualifiedToProposal || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Proposal to Close
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatPercentage(salesData.conversionMetrics.proposalToClose || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Overall Conversion
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatPercentage(salesData.conversionMetrics.overallRate || 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Team Performance
   */
  const renderTeamPerformance = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales Team Performance
        </Typography>
        
        <SalesTeamTable 
          teamData={salesData.teamPerformance} 
          loading={loadingStates.team} 
        />
      </CardContent>
    </Card>
  );

  /**
   * Render Project Breakdown
   */
  const renderProjectBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales by Project
        </Typography>
        
        {loadingStates.projects ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : salesData.projectBreakdown.length === 0 ? (
          <Alert severity="info">
            No project sales data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={salesData.projectBreakdown}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {salesData.projectBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SALES_COLORS.chart[index % SALES_COLORS.chart.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
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
                Sales Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive sales performance analysis with advanced filtering and team insights
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
                  onClick={refreshSalesData} 
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
        <SalesFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={projects}
          salesTeam={salesTeam}
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
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="sales analytics tabs">
            <Tab label="Overview" />
            <Tab label="Trends Analysis" />
            <Tab label="Conversion Funnel" />
            <Tab label="Team Performance" />
            <Tab label="Project Breakdown" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderSalesKPIs()}
              </Grid>
              <Grid item xs={12} lg={8}>
                {renderSalesTrends()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderSalesFunnel()}
              </Grid>
            </Grid>
          )}

          {/* Trends Analysis Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderSalesTrends()}
              </Grid>
              <Grid item xs={12}>
                {renderSalesKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Conversion Funnel Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderSalesFunnel()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderProjectBreakdown()}
              </Grid>
              <Grid item xs={12}>
                {renderSalesKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Team Performance Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderTeamPerformance()}
              </Grid>
            </Grid>
          )}

          {/* Project Breakdown Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderProjectBreakdown()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderSalesFunnel()}
              </Grid>
              <Grid item xs={12}>
                {renderSalesKPIs()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesAnalytics;
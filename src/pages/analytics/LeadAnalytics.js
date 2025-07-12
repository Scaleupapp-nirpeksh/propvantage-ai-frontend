// File: src/pages/analytics/LeadAnalytics.js
// Description: Comprehensive Lead Analytics Dashboard with funnel analysis and conversion tracking
// Version: 1.0 - Production Grade Implementation for Phase 1
// Location: src/pages/analytics/LeadAnalytics.js

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
  Stack,
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
  PersonAdd,
  ContactPhone,
  Email,
  Web,
  Campaign,
  SocialDistance,
  Phone,
  LocationOn,
  Source,
  Filter1,
  Filter2,
  Filter3,
  Filter4,
  Filter5,
  Funnel as FunnelIcon,
  Transform,
  Speed,
  Equalizer,
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
  Scatter,
  ScatterChart,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { budgetVsActualAPI, projectAPI, userAPI } from '../../services/api';

// =============================================================================
// LEAD ANALYTICS CONFIGURATION
// =============================================================================

/**
 * Analysis periods for lead data
 */
const LEAD_PERIODS = [
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
 * Lead quality thresholds
 */
const QUALITY_THRESHOLDS = {
  hot: 80,      // 80%+ = hot lead
  warm: 60,     // 60-80% = warm lead  
  cold: 40,     // 40-60% = cold lead
  unqualified: 40, // <40% = unqualified
};

/**
 * Lead conversion thresholds
 */
const CONVERSION_THRESHOLDS = {
  excellent: 25,   // 25%+ conversion = excellent
  good: 15,        // 15-25% conversion = good
  average: 10,     // 10-15% conversion = average
  poor: 10,        // <10% conversion = poor
};

/**
 * Color system for lead metrics
 */
const LEAD_COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  hot: '#f44336',
  warm: '#ff9800',
  cold: '#2196f3',
  unqualified: '#9e9e9e',
  chart: ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#f57c00', '#00acc1', '#8bc34a'],
  funnel: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
};

/**
 * Lead sources configuration
 */
const LEAD_SOURCES = [
  { key: 'website', label: 'Website', icon: Web, color: LEAD_COLORS.chart[0] },
  { key: 'social_media', label: 'Social Media', icon: Campaign, color: LEAD_COLORS.chart[1] },
  { key: 'referral', label: 'Referrals', icon: People, color: LEAD_COLORS.chart[2] },
  { key: 'phone_inquiry', label: 'Phone Inquiry', icon: Phone, color: LEAD_COLORS.chart[3] },
  { key: 'walk_in', label: 'Walk-in', icon: LocationOn, color: LEAD_COLORS.chart[4] },
  { key: 'email_campaign', label: 'Email Campaign', icon: Email, color: LEAD_COLORS.chart[5] },
  { key: 'advertising', label: 'Advertising', icon: Campaign, color: LEAD_COLORS.chart[6] },
  { key: 'other', label: 'Other', icon: Source, color: LEAD_COLORS.chart[7] },
];

/**
 * Lead funnel stages
 */
const LEAD_FUNNEL_STAGES = [
  { key: 'generated', label: 'Leads Generated', icon: PersonAdd, color: LEAD_COLORS.chart[0] },
  { key: 'contacted', label: 'Contacted', icon: ContactPhone, color: LEAD_COLORS.chart[1] },
  { key: 'qualified', label: 'Qualified', icon: CheckCircle, color: LEAD_COLORS.chart[2] },
  { key: 'interested', label: 'Interested', icon: Star, color: LEAD_COLORS.chart[3] },
  { key: 'converted', label: 'Converted', icon: MonetizationOn, color: LEAD_COLORS.success },
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

const calculateConversionRate = (converted, total) => {
  if (!total || total === 0) return 0;
  return (converted / total) * 100;
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Advanced Lead Filters Component
 */
const LeadFilters = ({ 
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
            <Typography variant="h6">Lead Analytics Filters</Typography>
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
                  {LEAD_PERIODS.map((period) => (
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

            {/* Lead Source Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Lead Source</InputLabel>
                <Select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  label="Lead Source"
                >
                  <MenuItem value="all">All Sources</MenuItem>
                  {LEAD_SOURCES.map((source) => (
                    <MenuItem key={source.key} value={source.key}>
                      {source.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Lead Status Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Lead Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Lead Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="interested">Interested</MenuItem>
                  <MenuItem value="not_interested">Not Interested</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Assigned To Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  label="Assigned To"
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

            {/* Analysis Focus */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Analysis Focus</InputLabel>
                <Select
                  value={filters.focus}
                  onChange={(e) => handleFilterChange('focus', e.target.value)}
                  label="Analysis Focus"
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="conversion">Conversion Analysis</MenuItem>
                  <MenuItem value="sources">Source Performance</MenuItem>
                  <MenuItem value="quality">Lead Quality</MenuItem>
                  <MenuItem value="lifecycle">Lead Lifecycle</MenuItem>
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
 * Lead KPI Card Component
 */
const LeadKPICard = ({ 
  title, 
  value, 
  previousValue,
  target,
  unit = 'number', 
  icon: Icon, 
  color = 'primary',
  loading = false,
  showTrend = true,
  showTarget = true,
  subtitle = null,
  alertLevel = null,
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

  // Calculate target achievement
  const targetAchievement = useMemo(() => {
    if (!showTarget || !target || !value) return null;
    return (value / target) * 100;
  }, [value, target, showTarget]);

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp fontSize="small" color="success" />;
      case 'down': return <TrendingDown fontSize="small" color="error" />;
      default: return <TrendingFlat fontSize="small" color="info" />;
    }
  };

  const getPerformanceColor = () => {
    if (alertLevel) return alertLevel;
    if (!targetAchievement) return color;
    if (targetAchievement >= 120) return 'success';
    if (targetAchievement >= 100) return 'info';
    if (targetAchievement >= 80) return 'warning';
    return 'error';
  };

  const formatValue = () => {
    if (loading) return <CircularProgress size={20} />;
    if (unit === 'currency') return formatCurrency(value);
    if (unit === 'percentage') return formatPercentage(value);
    return formatNumber(value);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: alertLevel ? `2px solid ${theme.palette[alertLevel].main}` : 'none',
      }}
    >
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

        {/* Target Progress */}
        {targetAchievement !== null && !loading && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Target Progress
              </Typography>
              <Typography variant="caption" color={getPerformanceColor()}>
                {formatPercentage(targetAchievement)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(targetAchievement, 100)}
              color={getPerformanceColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Target: {formatNumber(target)}
            </Typography>
          </Box>
        )}

        {/* Alert Indicator */}
        {alertLevel && (
          <Alert severity={alertLevel} sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              {alertLevel === 'error' ? 'Below target threshold' : 
               alertLevel === 'warning' ? 'Monitor performance' : 'Excellent performance'}
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Lead Funnel Visualization Component
 */
const LeadFunnelChart = ({ funnelData, loading = false }) => {
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
            <Cell key={`cell-${index}`} fill={LEAD_FUNNEL_STAGES[index]?.color || LEAD_COLORS.chart[index]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

/**
 * Lead Source Performance Table
 */
const LeadSourceTable = ({ sourceData, loading = false }) => {
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

  const getPerformanceColor = (conversionRate) => {
    if (conversionRate >= CONVERSION_THRESHOLDS.excellent) return 'success';
    if (conversionRate >= CONVERSION_THRESHOLDS.good) return 'info';
    if (conversionRate >= CONVERSION_THRESHOLDS.average) return 'warning';
    return 'error';
  };

  const sortedSourceData = sourceData.sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0));

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Lead Source</TableCell>
            <TableCell align="right">Leads Generated</TableCell>
            <TableCell align="right">Conversions</TableCell>
            <TableCell align="right">Conversion Rate</TableCell>
            <TableCell align="right">Revenue Generated</TableCell>
            <TableCell align="right">Cost per Lead</TableCell>
            <TableCell align="center">Performance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSourceData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((source, index) => {
              const actualIndex = page * rowsPerPage + index;
              const conversionRate = calculateConversionRate(source.conversions || 0, source.leadsGenerated || 0);
              const sourceConfig = LEAD_SOURCES.find(s => s.key === source.source) || LEAD_SOURCES[LEAD_SOURCES.length - 1];
              
              return (
                <TableRow key={source.source || actualIndex}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="primary">
                        #{actualIndex + 1}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: sourceConfig.color }}>
                        <sourceConfig.icon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {sourceConfig.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {source.source}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(source.leadsGenerated || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(source.conversions || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      color={`${getPerformanceColor(conversionRate)}.main`}
                    >
                      {formatPercentage(conversionRate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(source.revenueGenerated || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(source.costPerLead || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        conversionRate >= CONVERSION_THRESHOLDS.excellent ? 'Excellent' :
                        conversionRate >= CONVERSION_THRESHOLDS.good ? 'Good' :
                        conversionRate >= CONVERSION_THRESHOLDS.average ? 'Average' : 'Poor'
                      }
                      color={getPerformanceColor(conversionRate)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={sourceData.length}
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
// MAIN LEAD ANALYTICS COMPONENT
// =============================================================================

const LeadAnalytics = () => {
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
    source: 'all',
    status: 'all',
    assignedTo: 'all',
    focus: 'all',
  });

  // Filter options
  const [projects, setProjects] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  
  // Lead analytics data state
  const [leadData, setLeadData] = useState({
    kpis: {
      totalLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      averageLeadValue: 0,
      leadGrowth: 0,
    },
    funnel: [],
    sourcePerformance: [],
    trends: [],
    lifecycle: [],
    qualityMetrics: {},
    alerts: [],
  });

  // Loading states for individual sections
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    funnel: true,
    sources: true,
    trends: true,
    lifecycle: true,
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

    // Add source filter
    if (filters.source !== 'all') {
      params.source = filters.source;
    }

    // Add status filter
    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    // Add assigned to filter
    if (filters.assignedTo !== 'all') {
      params.assignedToId = filters.assignedTo;
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
    refreshLeadData();
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
      source: 'all',
      status: 'all',
      assignedTo: 'all',
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
   * Fetch lead KPIs
   */
  const fetchLeadKPIs = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, kpis: true }));
      
      const params = getApiParams();
      console.log('🔄 Calling budgetVsActualAPI.getLeadKPIs for KPIs with params:', params);
      
      const response = await budgetVsActualAPI.getLeadKPIs(params);
      console.log('✅ Lead KPIs API Response:', response.data);

      const data = response.data?.data || {};
      
      setLeadData(prev => ({
        ...prev,
        kpis: {
          totalLeads: data.leads?.count || 0,
          qualifiedLeads: data.leads?.qualified || 0,
          convertedLeads: data.leads?.converted || 0,
          conversionRate: data.conversion?.rate || 0,
          averageLeadValue: data.leads?.averageValue || 0,
          leadGrowth: data.growth?.leadGrowth || 0,
        },
      }));

    } catch (error) {
      console.error('Error fetching lead KPIs:', error);
      // Fallback: Set default values to prevent UI breaking
      setLeadData(prev => ({
        ...prev,
        kpis: {
          totalLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          conversionRate: 0,
          averageLeadValue: 0,
          leadGrowth: 0,
        },
      }));
      if (!error.message.includes('404')) {
        setError(`Failed to load lead KPIs: ${error.message}`);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, kpis: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch lead funnel data
   */
  const fetchLeadFunnel = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, funnel: true }));
      
      const params = { ...getApiParams(), include: 'funnel,conversion' };
      console.log('🔄 Calling budgetVsActualAPI.getLeadAnalysis for funnel with params:', params);
      
      const response = await budgetVsActualAPI.getLeadAnalysis(params);
      console.log('✅ Lead Funnel API Response:', response.data);

      const data = response.data?.data || {};
      
      // Transform funnel data
      const funnelData = LEAD_FUNNEL_STAGES.map(stage => ({
        name: stage.label,
        value: data.funnel?.[stage.key] || 0,
        fill: stage.color,
      }));

      setLeadData(prev => ({
        ...prev,
        funnel: funnelData,
        qualityMetrics: data.quality || {},
      }));

    } catch (error) {
      console.error('Error fetching lead funnel:', error);
      // Fallback: Set empty funnel data
      setLeadData(prev => ({
        ...prev,
        funnel: [],
        qualityMetrics: {},
      }));
      if (!error.message.includes('404')) {
        console.warn('Lead funnel API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, funnel: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch lead source performance
   */
  const fetchSourcePerformance = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, sources: true }));
      
      const params = { ...getApiParams(), include: 'sources,performance' };
      console.log('🔄 Calling budgetVsActualAPI.getLeadAnalysis for source performance with params:', params);
      
      const response = await budgetVsActualAPI.getLeadAnalysis(params);
      console.log('✅ Source Performance API Response:', response.data);

      const data = response.data?.data || {};
      
      setLeadData(prev => ({
        ...prev,
        sourcePerformance: data.sources || [],
      }));

    } catch (error) {
      console.error('Error fetching source performance:', error);
      // Fallback: Set empty source data
      setLeadData(prev => ({
        ...prev,
        sourcePerformance: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Source performance API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, sources: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch lead trends
   */
  const fetchLeadTrends = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, trends: true }));
      
      const params = { ...getApiParams(), include: 'trends,monthly' };
      console.log('🔄 Calling budgetVsActualAPI.getLeadAnalysis for trends with params:', params);
      
      const response = await budgetVsActualAPI.getLeadAnalysis(params);
      console.log('✅ Lead Trends API Response:', response.data);

      const data = response.data?.data || {};
      
      // Transform trend data for charts
      const trends = [];
      if (data.trends?.monthly) {
        trends.push(...data.trends.monthly.map(item => ({
          period: `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`,
          leads: item.leadsGenerated || 0,
          qualified: item.qualified || 0,
          converted: item.converted || 0,
          conversionRate: calculateConversionRate(item.converted || 0, item.leadsGenerated || 0),
        })));
      }

      setLeadData(prev => ({
        ...prev,
        trends,
      }));

    } catch (error) {
      console.error('Error fetching lead trends:', error);
      // Fallback: Set empty trends data
      setLeadData(prev => ({
        ...prev,
        trends: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Lead trends API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false }));
    }
  }, [getApiParams]);

  /**
   * Fetch lead lifecycle analysis
   */
  const fetchLeadLifecycle = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, lifecycle: true }));
      
      const params = { ...getApiParams(), include: 'lifecycle,velocity' };
      console.log('🔄 Calling budgetVsActualAPI.getLeadAnalysis for lifecycle with params:', params);
      
      const response = await budgetVsActualAPI.getLeadAnalysis(params);
      console.log('✅ Lead Lifecycle API Response:', response.data);

      const data = response.data?.data || {};
      
      setLeadData(prev => ({
        ...prev,
        lifecycle: data.lifecycle || [],
        alerts: data.alerts || [],
      }));

    } catch (error) {
      console.error('Error fetching lead lifecycle:', error);
      // Fallback: Set empty lifecycle data
      setLeadData(prev => ({
        ...prev,
        lifecycle: [],
        alerts: [],
      }));
      if (!error.message.includes('404')) {
        console.warn('Lead lifecycle API not available, using fallback');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, lifecycle: false }));
    }
  }, [getApiParams]);

  /**
   * Refresh all lead data
   */
  const refreshLeadData = useCallback(async () => {
    console.log('🔄 Starting lead analytics refresh with filters:', filters);
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchLeadKPIs(),
        fetchLeadFunnel(),
        fetchSourcePerformance(),
        fetchLeadTrends(),
        fetchLeadLifecycle(),
      ]);
      
      console.log('✅ Lead analytics refresh completed successfully');
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing lead analytics:', error);
      setError('Failed to refresh lead data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchLeadKPIs,
    fetchLeadFunnel,
    fetchSourcePerformance,
    fetchLeadTrends,
    fetchLeadLifecycle,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    console.log('🚀 Lead Analytics initializing...');
    fetchFilterOptions();
    refreshLeadData();
  }, []);

  // Refresh data when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshLeadData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshLeadData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, refreshLeadData]);

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
    console.log(`Exporting lead data in ${format} format`);
    handleExportClose();
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render Lead KPIs Overview
   */
  const renderLeadKPIs = () => {
    // Calculate alert levels based on performance
    const getConversionAlert = () => {
      const rate = leadData.kpis.conversionRate;
      if (rate < CONVERSION_THRESHOLDS.poor) return 'error';
      if (rate < CONVERSION_THRESHOLDS.average) return 'warning';
      return null;
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Total Leads"
            value={leadData.kpis.totalLeads}
            unit="number"
            icon={PersonAdd}
            color="primary"
            loading={loadingStates.kpis}
            subtitle="Leads generated"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Qualified Leads"
            value={leadData.kpis.qualifiedLeads}
            unit="number"
            icon={CheckCircle}
            color="info"
            loading={loadingStates.kpis}
            subtitle="Quality prospects"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Converted Leads"
            value={leadData.kpis.convertedLeads}
            unit="number"
            icon={MonetizationOn}
            color="success"
            loading={loadingStates.kpis}
            subtitle="Successful conversions"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Conversion Rate"
            value={leadData.kpis.conversionRate}
            unit="percentage"
            icon={Transform}
            color="warning"
            loading={loadingStates.kpis}
            subtitle="Lead to sale conversion"
            alertLevel={getConversionAlert()}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Avg Lead Value"
            value={leadData.kpis.averageLeadValue}
            unit="currency"
            icon={AttachMoney}
            color="success"
            loading={loadingStates.kpis}
            subtitle="Revenue per lead"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <LeadKPICard
            title="Lead Growth"
            value={leadData.kpis.leadGrowth}
            unit="percentage"
            icon={TrendingUp}
            color="primary"
            loading={loadingStates.kpis}
            subtitle="Period over period"
            showTarget={false}
          />
        </Grid>
      </Grid>
    );
  };

  /**
   * Render Lead Trends Chart
   */
  const renderLeadTrends = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Generation & Conversion Trends
        </Typography>
        
        {loadingStates.trends ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : leadData.trends.length === 0 ? (
          <Alert severity="info">
            No lead trend data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={leadData.trends}>
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <CartesianGrid strokeDasharray="3 3" />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'conversionRate' ? formatPercentage(value) : formatNumber(value),
                  name === 'leads' ? 'Leads Generated' : 
                  name === 'qualified' ? 'Qualified' : 
                  name === 'converted' ? 'Converted' : 'Conversion Rate'
                ]}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="leads" 
                fill={LEAD_COLORS.chart[0]}
                name="Leads Generated"
              />
              <Bar 
                yAxisId="left"
                dataKey="qualified" 
                fill={LEAD_COLORS.chart[1]}
                name="Qualified"
              />
              <Bar 
                yAxisId="left"
                dataKey="converted" 
                fill={LEAD_COLORS.success}
                name="Converted"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke={LEAD_COLORS.warning}
                strokeWidth={3}
                name="Conversion Rate (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Lead Funnel
   */
  const renderLeadFunnel = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Conversion Funnel
        </Typography>
        
        <LeadFunnelChart 
          funnelData={leadData.funnel} 
          loading={loadingStates.funnel} 
        />
        
        {/* Quality Metrics */}
        {Object.keys(leadData.qualityMetrics).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Lead Quality Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Hot Leads
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatPercentage(leadData.qualityMetrics.hotLeads || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Warm Leads
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatPercentage(leadData.qualityMetrics.warmLeads || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Cold Leads
                </Typography>
                <Typography variant="h6" color="info.main">
                  {formatPercentage(leadData.qualityMetrics.coldLeads || 0)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Avg Response Time
                </Typography>
                <Typography variant="h6" color="primary">
                  {leadData.qualityMetrics.avgResponseTime || 0}h
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Source Performance
   */
  const renderSourcePerformance = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Source Performance
        </Typography>
        
        <LeadSourceTable 
          sourceData={leadData.sourcePerformance} 
          loading={loadingStates.sources} 
        />
      </CardContent>
    </Card>
  );

  /**
   * Render Lead Source Breakdown
   */
  const renderSourceBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Leads by Source
        </Typography>
        
        {loadingStates.sources ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : leadData.sourcePerformance.length === 0 ? (
          <Alert severity="info">
            No source data available for the selected period.
          </Alert>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={leadData.sourcePerformance}
                dataKey="leadsGenerated"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ source, percent }) => {
                  const sourceConfig = LEAD_SOURCES.find(s => s.key === source) || LEAD_SOURCES[LEAD_SOURCES.length - 1];
                  return `${sourceConfig.label}: ${(percent * 100).toFixed(0)}%`;
                }}
              >
                {leadData.sourcePerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={LEAD_COLORS.chart[index % LEAD_COLORS.chart.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value) => [formatNumber(value), 'Leads Generated']}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render Lead Lifecycle Analysis
   */
  const renderLeadLifecycle = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Lead Lifecycle Analysis
        </Typography>
        
        {loadingStates.lifecycle ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : leadData.lifecycle.length === 0 ? (
          <Alert severity="info">
            No lifecycle data available for the selected period.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {leadData.lifecycle.map((stage, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {stage.averageDays || 0} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stage.stageName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average time in stage
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
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
                Lead Analytics Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive lead analysis with funnel visualization, source performance, and conversion tracking
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
                  onClick={refreshLeadData} 
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
        <LeadFilters
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
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="lead analytics tabs">
            <Tab label="Overview" />
            <Tab label="Conversion Funnel" />
            <Tab label="Source Performance" />
            <Tab label="Trends Analysis" />
            <Tab label="Lifecycle Analysis" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {/* Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderLeadKPIs()}
              </Grid>
              <Grid item xs={12} lg={8}>
                {renderLeadTrends()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderLeadFunnel()}
              </Grid>
            </Grid>
          )}

          {/* Conversion Funnel Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderLeadFunnel()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderSourceBreakdown()}
              </Grid>
              <Grid item xs={12}>
                {renderLeadKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Source Performance Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderSourcePerformance()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderSourceBreakdown()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderLeadFunnel()}
              </Grid>
            </Grid>
          )}

          {/* Trends Analysis Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderLeadTrends()}
              </Grid>
              <Grid item xs={12}>
                {renderLeadKPIs()}
              </Grid>
            </Grid>
          )}

          {/* Lifecycle Analysis Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderLeadLifecycle()}
              </Grid>
              <Grid item xs={12} lg={6}>
                {renderLeadTrends()}
              </Grid>
              <Grid item xs={12} lg={6}>
                {renderLeadFunnel()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default LeadAnalytics;
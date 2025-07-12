// File: src/pages/analytics/AnalyticsReportsCenter.js
// Description: Analytics Reports Center - Centralized reporting hub for all analytics reports
// Version: 1.0 - Complete reporting center with customizable reports, export functionality, and scheduling
// Location: src/pages/analytics/AnalyticsReportsCenter.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  DatePicker,
  TimePicker,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Badge,
  Fab,
} from '@mui/material';
import {
  GetApp,
  Schedule,
  Visibility,
  Edit,
  Delete,
  Share,
  Add,
  FilterList,
  Search,
  Refresh,
  ExpandMore,
  Assessment,
  TrendingUp,
  AttachMoney,
  People,
  Business,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  TableChart,
  InsertChart,
  Description,
  Email,
  Print,
  CloudDownload,
  Settings,
  EventNote,
  PlayArrow,
  Stop,
  Pause,
  CheckCircle,
  Error,
  Warning,
  Info,
  CalendarToday,
  AccessTime,
  Folder,
  StarBorder,
  Star,
  MoreVert,
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, reportsAPI, analyticsUtils } from '../../services/api';

// =============================================================================
// REPORTS CONFIGURATION
// =============================================================================

/**
 * Available report categories and types
 */
const REPORT_CATEGORIES = {
  sales: {
    label: 'Sales Reports',
    icon: TrendingUp,
    color: 'primary',
    reports: [
      { id: 'sales_summary', name: 'Sales Summary', description: 'Comprehensive sales performance overview' },
      { id: 'sales_pipeline', name: 'Sales Pipeline', description: 'Current pipeline status and conversion rates' },
      { id: 'sales_team_performance', name: 'Team Performance', description: 'Individual and team sales metrics' },
      { id: 'conversion_analysis', name: 'Conversion Analysis', description: 'Lead to customer conversion insights' },
      { id: 'sales_forecast', name: 'Sales Forecast', description: 'Predictive sales projections' },
    ],
  },
  revenue: {
    label: 'Revenue Reports',
    icon: AttachMoney,
    color: 'success',
    reports: [
      { id: 'revenue_summary', name: 'Revenue Summary', description: 'Total revenue breakdown and trends' },
      { id: 'revenue_by_project', name: 'Revenue by Project', description: 'Project-wise revenue analysis' },
      { id: 'revenue_forecast', name: 'Revenue Forecast', description: 'Revenue projections and targets' },
      { id: 'pricing_analysis', name: 'Pricing Analysis', description: 'Price optimization insights' },
      { id: 'recurring_revenue', name: 'Recurring Revenue', description: 'Subscription and recurring income analysis' },
    ],
  },
  leads: {
    label: 'Lead Reports',
    icon: People,
    color: 'info',
    reports: [
      { id: 'lead_summary', name: 'Lead Summary', description: 'Lead generation and quality metrics' },
      { id: 'lead_sources', name: 'Lead Sources', description: 'Lead source effectiveness analysis' },
      { id: 'lead_conversion', name: 'Lead Conversion', description: 'Conversion funnel and bottlenecks' },
      { id: 'lead_scoring', name: 'Lead Scoring', description: 'Lead quality and scoring analysis' },
      { id: 'lead_nurturing', name: 'Lead Nurturing', description: 'Nurturing campaign effectiveness' },
    ],
  },
  financial: {
    label: 'Financial Reports',
    icon: Assessment,
    color: 'warning',
    reports: [
      { id: 'financial_summary', name: 'Financial Summary', description: 'Overall financial health overview' },
      { id: 'budget_variance', name: 'Budget Variance', description: 'Budget vs actual analysis' },
      { id: 'cash_flow', name: 'Cash Flow', description: 'Cash flow analysis and projections' },
      { id: 'profitability', name: 'Profitability', description: 'Profit margins and cost analysis' },
      { id: 'expense_breakdown', name: 'Expense Breakdown', description: 'Detailed expense categorization' },
    ],
  },
  operations: {
    label: 'Operational Reports',
    icon: Business,
    color: 'secondary',
    reports: [
      { id: 'project_performance', name: 'Project Performance', description: 'Project delivery and timeline analysis' },
      { id: 'resource_utilization', name: 'Resource Utilization', description: 'Team and resource efficiency metrics' },
      { id: 'customer_satisfaction', name: 'Customer Satisfaction', description: 'Customer feedback and satisfaction scores' },
      { id: 'operational_efficiency', name: 'Operational Efficiency', description: 'Process optimization insights' },
      { id: 'quality_metrics', name: 'Quality Metrics', description: 'Quality control and assurance metrics' },
    ],
  },
};

/**
 * Report format options
 */
const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', icon: Description },
  { value: 'excel', label: 'Excel Spreadsheet', icon: TableChart },
  { value: 'csv', label: 'CSV Data', icon: GetApp },
  { value: 'json', label: 'JSON Data', icon: GetApp },
  { value: 'email', label: 'Email Report', icon: Email },
];

/**
 * Report frequency options for scheduling
 */
const REPORT_FREQUENCIES = [
  { value: 'once', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

/**
 * Time period options
 */
const TIME_PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Report card component for displaying available reports
 */
const ReportCard = ({ 
  report, 
  category, 
  onGenerate, 
  onSchedule, 
  onView, 
  isFavorite = false, 
  onToggleFavorite,
  loading = false,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGenerate = () => {
    onGenerate(report, category);
    handleMenuClose();
  };

  const handleSchedule = () => {
    onSchedule(report, category);
    handleMenuClose();
  };

  const handleView = () => {
    onView(report, category);
    handleMenuClose();
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${category.color}.main`, 
              width: 48, 
              height: 48,
            }}
          >
            <category.icon />
          </Avatar>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              size="small" 
              onClick={() => onToggleFavorite(report.id)}
              color={isFavorite ? 'warning' : 'default'}
            >
              {isFavorite ? <Star /> : <StarBorder />}
            </IconButton>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="h6" component="div" gutterBottom>
          {report.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {report.description}
        </Typography>

        <Chip 
          label={category.label} 
          color={category.color} 
          size="small" 
          variant="outlined"
        />
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          onClick={handleGenerate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
        >
          Generate
        </Button>
        
        <Button 
          size="small" 
          onClick={handleView}
          startIcon={<Visibility />}
          variant="outlined"
        >
          Preview
        </Button>
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleGenerate}>
          <PlayArrow sx={{ mr: 1 }} />
          Generate Report
        </MenuItem>
        <MenuItem onClick={handleSchedule}>
          <Schedule sx={{ mr: 1 }} />
          Schedule Report
        </MenuItem>
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          Preview Report
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => onToggleFavorite(report.id)}>
          {isFavorite ? <Star sx={{ mr: 1 }} /> : <StarBorder sx={{ mr: 1 }} />}
          {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </MenuItem>
      </Menu>
    </Card>
  );
};

/**
 * Report generation dialog
 */
const ReportGenerationDialog = ({ 
  open, 
  onClose, 
  report, 
  category, 
  onGenerate 
}) => {
  const [reportConfig, setReportConfig] = useState({
    period: 'last_30_days',
    startDate: new Date(),
    endDate: new Date(),
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    includeSummary: true,
    filters: {},
  });

  const handleConfigChange = (field, value) => {
    setReportConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    onGenerate(report, category, reportConfig);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Generate {report?.name} Report
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Time Period Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={reportConfig.period}
                onChange={(e) => handleConfigChange('period', e.target.value)}
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

          {/* Export Format Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={reportConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
                label="Export Format"
              >
                {EXPORT_FORMATS.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <format.icon sx={{ mr: 1 }} />
                      {format.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Date Range (if period is custom) */}
          {reportConfig.period === 'custom' && (
            <>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MuiDatePicker
                    label="Start Date"
                    value={reportConfig.startDate}
                    onChange={(date) => handleConfigChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MuiDatePicker
                    label="End Date"
                    value={reportConfig.endDate}
                    onChange={(date) => handleConfigChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}

          {/* Report Options */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Report Options
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportConfig.includeCharts}
                  onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                />
              }
              label="Include Charts and Visualizations"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportConfig.includeData}
                  onChange={(e) => handleConfigChange('includeData', e.target.checked)}
                />
              }
              label="Include Raw Data Tables"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportConfig.includeSummary}
                  onChange={(e) => handleConfigChange('includeSummary', e.target.checked)}
                />
              }
              label="Include Executive Summary"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerate} variant="contained" startIcon={<PlayArrow />}>
          Generate Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Report scheduling dialog
 */
const ReportSchedulingDialog = ({ 
  open, 
  onClose, 
  report, 
  category, 
  onSchedule 
}) => {
  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    frequency: 'monthly',
    startDate: new Date(),
    time: new Date(),
    recipients: '',
    format: 'pdf',
    active: true,
    period: 'last_30_days',
  });

  const handleConfigChange = (field, value) => {
    setScheduleConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSchedule = () => {
    onSchedule(report, category, scheduleConfig);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Schedule {report?.name} Report
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Schedule Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Schedule Name"
              value={scheduleConfig.name}
              onChange={(e) => handleConfigChange('name', e.target.value)}
              placeholder={`${report?.name} - ${scheduleConfig.frequency}`}
            />
          </Grid>

          {/* Frequency */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={scheduleConfig.frequency}
                onChange={(e) => handleConfigChange('frequency', e.target.value)}
                label="Frequency"
              >
                {REPORT_FREQUENCIES.map((freq) => (
                  <MenuItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Format */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={scheduleConfig.format}
                onChange={(e) => handleConfigChange('format', e.target.value)}
                label="Format"
              >
                {EXPORT_FORMATS.filter(f => f.value !== 'email').map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <MuiDatePicker
                label="Start Date"
                value={scheduleConfig.startDate}
                onChange={(date) => handleConfigChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          {/* Time */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <MuiTimePicker
                label="Time"
                value={scheduleConfig.time}
                onChange={(time) => handleConfigChange('time', time)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          {/* Recipients */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Recipients"
              value={scheduleConfig.recipients}
              onChange={(e) => handleConfigChange('recipients', e.target.value)}
              placeholder="email1@company.com, email2@company.com"
              helperText="Separate multiple email addresses with commas"
            />
          </Grid>

          {/* Active Status */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={scheduleConfig.active}
                  onChange={(e) => handleConfigChange('active', e.target.checked)}
                />
              }
              label="Active Schedule"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSchedule} variant="contained" startIcon={<Schedule />}>
          Schedule Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// MAIN ANALYTICS REPORTS CENTER COMPONENT
// =============================================================================

const AnalyticsReportsCenter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Dialog states
  const [generationDialog, setGenerationDialog] = useState({
    open: false,
    report: null,
    category: null,
  });
  
  const [schedulingDialog, setSchedulingDialog] = useState({
    open: false,
    report: null,
    category: null,
  });

  // Data states
  const [reportsData, setReportsData] = useState({
    favorites: [],
    scheduled: [],
    recent: [],
    statistics: {},
  });

  const [loadingStates, setLoadingStates] = useState({
    favorites: true,
    scheduled: true,
    recent: true,
    statistics: true,
  });

  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================

  /**
   * Fetch user's favorite reports
   */
  const fetchFavoriteReports = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, favorites: true }));
      
      const response = await reportsAPI.getFavoriteReports();
      const favorites = response.data?.favorites || [];
      
      setReportsData(prev => ({ ...prev, favorites }));
    } catch (error) {
      console.error('Error fetching favorite reports:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, favorites: false }));
    }
  }, []);

  /**
   * Fetch scheduled reports
   */
  const fetchScheduledReports = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, scheduled: true }));
      
      const response = await reportsAPI.getScheduledReports();
      const scheduled = response.data?.schedules || [];
      
      setReportsData(prev => ({ ...prev, scheduled }));
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, scheduled: false }));
    }
  }, []);

  /**
   * Fetch recent reports
   */
  const fetchRecentReports = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, recent: true }));
      
      const response = await reportsAPI.getRecentReports({ limit: 10 });
      const recent = response.data?.reports || [];
      
      setReportsData(prev => ({ ...prev, recent }));
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, recent: false }));
    }
  }, []);

  /**
   * Fetch reports statistics
   */
  const fetchReportsStatistics = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, statistics: true }));
      
      const response = await reportsAPI.getReportsStatistics();
      const statistics = response.data?.statistics || {};
      
      setReportsData(prev => ({ ...prev, statistics }));
    } catch (error) {
      console.error('Error fetching reports statistics:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, statistics: false }));
    }
  }, []);

  /**
   * Refresh all reports data
   */
  const refreshReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchFavoriteReports(),
        fetchScheduledReports(),
        fetchRecentReports(),
        fetchReportsStatistics(),
      ]);
    } catch (error) {
      console.error('Error refreshing reports data:', error);
      setError('Failed to refresh reports data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchFavoriteReports,
    fetchScheduledReports,
    fetchRecentReports,
    fetchReportsStatistics,
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    refreshReportsData();
  }, [refreshReportsData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  const handleToggleFavorite = async (reportId) => {
    try {
      const isFavorite = reportsData.favorites.includes(reportId);
      
      if (isFavorite) {
        await reportsAPI.removeFavoriteReport(reportId);
        setReportsData(prev => ({
          ...prev,
          favorites: prev.favorites.filter(id => id !== reportId)
        }));
      } else {
        await reportsAPI.addFavoriteReport(reportId);
        setReportsData(prev => ({
          ...prev,
          favorites: [...prev.favorites, reportId]
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite report:', error);
    }
  };

  const handleGenerateReport = (report, category) => {
    setGenerationDialog({
      open: true,
      report,
      category,
    });
  };

  const handleScheduleReport = (report, category) => {
    setSchedulingDialog({
      open: true,
      report,
      category,
    });
  };

  const handleViewReport = async (report, category) => {
    try {
      // Generate a preview version of the report
      const response = await reportsAPI.generateReport({
        reportType: report.id,
        category: category.label,
        preview: true,
        format: 'json',
      });
      
      // Handle preview display (could open in a new tab or modal)
      console.log('Report preview:', response.data);
    } catch (error) {
      console.error('Error generating report preview:', error);
    }
  };

  const handleGenerateReportWithConfig = async (report, category, config) => {
    try {
      setLoading(true);
      
      const response = await reportsAPI.generateReport({
        reportType: report.id,
        category: category.label,
        ...config,
      });

      // Handle successful report generation
      if (config.format === 'email') {
        // Show success message for email
        alert('Report has been emailed successfully!');
      } else {
        // Trigger download for file formats
        const downloadUrl = response.data?.downloadUrl;
        if (downloadUrl) {
          window.open(downloadUrl, '_blank');
        }
      }

      // Refresh recent reports
      fetchRecentReports();
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReportWithConfig = async (report, category, config) => {
    try {
      setLoading(true);
      
      await reportsAPI.scheduleReport({
        reportType: report.id,
        category: category.label,
        ...config,
      });

      // Show success message
      alert('Report has been scheduled successfully!');

      // Refresh scheduled reports
      fetchScheduledReports();
    } catch (error) {
      console.error('Error scheduling report:', error);
      setError('Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  /**
   * Filter reports based on search query, category, and favorites
   */
  const filteredReports = useMemo(() => {
    const allReports = [];
    
    Object.entries(REPORT_CATEGORIES).forEach(([categoryKey, categoryData]) => {
      if (selectedCategory === 'all' || selectedCategory === categoryKey) {
        categoryData.reports.forEach(report => {
          if (
            (!searchQuery || 
             report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             report.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (!showFavoritesOnly || reportsData.favorites.includes(report.id))
          ) {
            allReports.push({
              ...report,
              category: categoryData,
              categoryKey,
            });
          }
        });
      }
    });
    
    return allReports;
  }, [searchQuery, selectedCategory, showFavoritesOnly, reportsData.favorites]);

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================

  /**
   * Render reports statistics cards
   */
  const renderStatisticsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                  {loadingStates.statistics ? <Skeleton width={60} /> : (reportsData.statistics.totalGenerated || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reports Generated
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Assessment />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                  {loadingStates.statistics ? <Skeleton width={60} /> : (reportsData.statistics.scheduledActive || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Schedules
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Schedule />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                  {loadingStates.statistics ? <Skeleton width={60} /> : (reportsData.favorites.length || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Favorite Reports
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Star />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                  {loadingStates.statistics ? <Skeleton width={60} /> : (reportsData.statistics.thisMonth || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This Month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <CalendarToday />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  /**
   * Render reports grid
   */
  const renderReportsGrid = () => {
    if (loading && filteredReports.length === 0) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ height: 280 }}>
                <CardContent>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="100%" height={16} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || showFavoritesOnly 
              ? 'Try adjusting your filters or search terms' 
              : 'Start by selecting a report category or searching for specific reports'
            }
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={`${report.categoryKey}-${report.id}`}>
            <ReportCard
              report={report}
              category={report.category}
              onGenerate={handleGenerateReport}
              onSchedule={handleScheduleReport}
              onView={handleViewReport}
              isFavorite={reportsData.favorites.includes(report.id)}
              onToggleFavorite={handleToggleFavorite}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  /**
   * Render scheduled reports list
   */
  const renderScheduledReports = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Scheduled Reports
        </Typography>
        
        {loadingStates.scheduled ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : reportsData.scheduled.length === 0 ? (
          <Alert severity="info">
            No scheduled reports. Create a schedule by clicking "Schedule" on any report.
          </Alert>
        ) : (
          <List>
            {reportsData.scheduled.map((schedule, index) => (
              <ListItem 
                key={schedule.id} 
                divider={index < reportsData.scheduled.length - 1}
                secondaryAction={
                  <Box>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: schedule.active ? 'success.main' : 'grey.400' }}>
                    {schedule.active ? <CheckCircle /> : <Pause />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={schedule.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {schedule.frequency} • Next run: {schedule.nextRun}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recipients: {schedule.recipients}
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
   * Render recent reports list
   */
  const renderRecentReports = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        
        {loadingStates.recent ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : reportsData.recent.length === 0 ? (
          <Alert severity="info">
            No recent reports. Generate your first report to see it here.
          </Alert>
        ) : (
          <List>
            {reportsData.recent.map((report, index) => (
              <ListItem 
                key={report.id} 
                divider={index < reportsData.recent.length - 1}
                secondaryAction={
                  <Box>
                    <IconButton size="small" onClick={() => window.open(report.downloadUrl, '_blank')}>
                      <GetApp />
                    </IconButton>
                    <IconButton size="small">
                      <Share />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <Description />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={report.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Generated {report.createdAt} • {report.format.toUpperCase()}
                      </Typography>
                      <Chip 
                        label={report.status} 
                        size="small" 
                        color={report.status === 'completed' ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Analytics Reports Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate, schedule, and manage all your analytics reports from one central location
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={refreshReportsData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {renderStatisticsCards()}

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search reports..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
                  <MenuItem key={key} value={key}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showFavoritesOnly}
                  onChange={handleToggleFavorites}
                />
              }
              label="Favorites Only"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredReports.length} reports found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Reports" />
          <Tab label="Scheduled" />
          <Tab label="Recent" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && renderReportsGrid()}
        {activeTab === 1 && renderScheduledReports()}
        {activeTab === 2 && renderRecentReports()}
      </Box>

      {/* Report Generation Dialog */}
      <ReportGenerationDialog
        open={generationDialog.open}
        onClose={() => setGenerationDialog({ open: false, report: null, category: null })}
        report={generationDialog.report}
        category={generationDialog.category}
        onGenerate={handleGenerateReportWithConfig}
      />

      {/* Report Scheduling Dialog */}
      <ReportSchedulingDialog
        open={schedulingDialog.open}
        onClose={() => setSchedulingDialog({ open: false, report: null, category: null })}
        report={schedulingDialog.report}
        category={schedulingDialog.category}
        onSchedule={handleScheduleReportWithConfig}
      />

      {/* Floating Action Button for Quick Report Generation */}
      <Fab
        color="primary"
        aria-label="quick report"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          // Quick access to most popular report
          const popularReport = filteredReports[0];
          if (popularReport) {
            handleGenerateReport(popularReport, popularReport.category);
          }
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default AnalyticsReportsCenter;
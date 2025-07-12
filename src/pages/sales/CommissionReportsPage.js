// File: src/pages/sales/CommissionReportsPage.js
// Description: Comprehensive commission reporting and analytics page with data visualization and export capabilities
// Version: 1.0 - Complete commission reporting system with backend integration
// Location: src/pages/sales/CommissionReportsPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Avatar,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  InputAdornment,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Download,
  Print,
  Share,
  Refresh,
  FilterList,
  Clear,
  ExpandMore,
  CalendarToday,
  Person,
  Business,
  Analytics,
  BarChart,
  PieChart,
  ShowChart,
  TableChart,
  DateRange,
  GetApp,
  PictureAsPdf,
  Description,
  CloudDownload,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  MonetizationOn,
  Handshake,
  Timeline,
  CompareArrows,
  Visibility,
  Settings,
  Info,
  Help,
  AccountBalance,
  Receipt,
  Assignment,
  Group,
  Dashboard,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Report time periods
const TIME_PERIODS = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'current_quarter', label: 'Current Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'current_year', label: 'Current Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Report types
const REPORT_TYPES = [
  {
    id: 'overview',
    title: 'Commission Overview',
    description: 'Overall commission performance and metrics',
    icon: Dashboard,
  },
  {
    id: 'partner_performance',
    title: 'Partner Performance',
    description: 'Individual partner commission analysis',
    icon: Person,
  },
  {
    id: 'project_analysis',
    title: 'Project Analysis',
    description: 'Commission breakdown by project',
    icon: Business,
  },
  {
    id: 'trends',
    title: 'Commission Trends',
    description: 'Time-based commission trend analysis',
    icon: ShowChart,
  },
  {
    id: 'payment_status',
    title: 'Payment Status Report',
    description: 'Commission payment status analysis',
    icon: AccountBalance,
  },
];

// Chart color schemes
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

// Export formats
const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Report', icon: PictureAsPdf },
  { value: 'excel', label: 'Excel Spreadsheet', icon: TableChart },
  { value: 'csv', label: 'CSV Data', icon: Description },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates date range based on period selection
 */
const getDateRangeFromPeriod = (period) => {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case 'current_month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last_month':
      startDate.setMonth(now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'current_quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'current_year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'last_year':
      startDate.setFullYear(now.getFullYear() - 1, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setFullYear(now.getFullYear() - 1, 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { startDate, endDate };
};

/**
 * Formats chart data for different visualizations
 */
const formatChartData = (rawData, type) => {
  switch (type) {
    case 'monthly_trend':
      return rawData.map(item => ({
        month: item.month,
        commissions: item.commissionCount || 0,
        amount: item.totalAmount || 0,
      }));
    case 'partner_performance':
      return rawData.map(item => ({
        name: `${item.firstName} ${item.lastName}`,
        commissions: item.totalCommissions || 0,
        amount: item.totalAmount || 0,
        rate: item.averageRate || 0,
      }));
    case 'project_breakdown':
      return rawData.map(item => ({
        name: item.projectName,
        value: item.totalAmount || 0,
        commissions: item.commissionCount || 0,
      }));
    case 'status_distribution':
      return rawData.map(item => ({
        name: item.status,
        value: item.count || 0,
        amount: item.totalAmount || 0,
      }));
    default:
      return rawData;
  }
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Metric Card Component for Key Performance Indicators
 */
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  isLoading = false,
  onClick 
}) => {
  const theme = useTheme();
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}.main`, 
              width: 48, 
              height: 48,
              mr: 2
            }}
          >
            <Icon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {value}
              </Typography>
            )}
          </Box>
        </Box>
        
        {subtitle && !isLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && trendValue && !isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendIcon 
              sx={{ 
                fontSize: 16, 
                color: trend === 'up' ? 'success.main' : 'error.main',
                mr: 0.5 
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend === 'up' ? 'success.main' : 'error.main',
                fontWeight: 500 
              }}
            >
              {trendValue} vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Report Filters Component
 */
const ReportFilters = ({ 
  filters, 
  onFilterChange, 
  onGenerateReport, 
  projects, 
  partners,
  isLoading 
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">Report Filters</Typography>
          </Box>
        }
        action={
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={onGenerateReport}
            disabled={isLoading}
          >
            Generate Report
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Time Period */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={filters.period}
                onChange={(e) => onFilterChange('period', e.target.value)}
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
            <>
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => onFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => onFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}

          {/* Project Filter */}
          <Grid item xs={12} md={filters.period === 'custom' ? 2 : 3}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.projectId || 'all'}
                onChange={(e) => onFilterChange('projectId', e.target.value === 'all' ? null : e.target.value)}
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

          {/* Partner Filter */}
          <Grid item xs={12} md={filters.period === 'custom' ? 2 : 3}>
            <FormControl fullWidth>
              <InputLabel>Partner</InputLabel>
              <Select
                value={filters.partnerId || 'all'}
                onChange={(e) => onFilterChange('partnerId', e.target.value === 'all' ? null : e.target.value)}
                label="Partner"
              >
                <MenuItem value="all">All Partners</MenuItem>
                {partners.map((partner) => (
                  <MenuItem key={partner._id} value={partner._id}>
                    {partner.firstName} {partner.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Report Type */}
          <Grid item xs={12} md={filters.period === 'custom' ? 2 : 3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={filters.reportType}
                onChange={(e) => onFilterChange('reportType', e.target.value)}
                label="Report Type"
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

/**
 * Commission Trend Chart Component
 */
const CommissionTrendChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ShowChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No trend data available
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <RechartsTooltip 
          formatter={(value, name) => [
            name === 'amount' ? formatCurrency(value) : value,
            name === 'amount' ? 'Commission Amount' : 'Commission Count'
          ]}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="amount"
          stackId="1"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
          name="Commission Amount"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="commissions"
          stroke="#82ca9d"
          strokeWidth={2}
          name="Commission Count"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * Partner Performance Chart Component
 */
const PartnerPerformanceChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <BarChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No partner data available
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip 
          formatter={(value, name) => [
            name === 'amount' ? formatCurrency(value) : value,
            name === 'amount' ? 'Total Commission' : 'Commission Count'
          ]}
        />
        <Legend />
        <Bar dataKey="amount" fill="#8884d8" name="Total Commission" />
        <Bar dataKey="commissions" fill="#82ca9d" name="Commission Count" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

/**
 * Project Distribution Chart Component
 */
const ProjectDistributionChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <PieChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No project data available
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <RechartsTooltip 
          formatter={(value, name) => [formatCurrency(value), 'Commission Amount']}
        />
        <Legend />
        <RechartsPieChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </RechartsPieChart>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

/**
 * Commission Summary Table Component
 */
const CommissionSummaryTable = ({ data, type, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <TableChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const getColumns = () => {
    switch (type) {
      case 'partner_performance':
        return [
          { id: 'name', label: 'Partner Name' },
          { id: 'commissions', label: 'Total Commissions', align: 'right' },
          { id: 'amount', label: 'Total Amount', align: 'right', format: formatCurrency },
          { id: 'rate', label: 'Avg Rate', align: 'right', format: formatPercentage },
        ];
      case 'project_analysis':
        return [
          { id: 'name', label: 'Project Name' },
          { id: 'commissions', label: 'Commissions', align: 'right' },
          { id: 'value', label: 'Total Amount', align: 'right', format: formatCurrency },
        ];
      case 'payment_status':
        return [
          { id: 'name', label: 'Status' },
          { id: 'value', label: 'Count', align: 'right' },
          { id: 'amount', label: 'Amount', align: 'right', format: formatCurrency },
        ];
      default:
        return [
          { id: 'name', label: 'Name' },
          { id: 'value', label: 'Value', align: 'right' },
        ];
    }
  };

  const columns = getColumns();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} hover>
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.format ? column.format(row[column.id]) : row[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Export Dialog Component
 */
const ExportDialog = ({ open, onClose, onExport, reportData }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeDetails: true,
    includeSummary: true,
  });

  const handleExport = () => {
    onExport(exportFormat, exportOptions);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Commission Report</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Export Format */}
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Export Format"
            >
              {EXPORT_FORMATS.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <format.icon fontSize="small" />
                    {format.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Export Options */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Include in Export
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeSummary}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeSummary: e.target.checked 
                    }))}
                  />
                }
                label="Summary Metrics"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeCharts: e.target.checked 
                    }))}
                  />
                }
                label="Charts and Visualizations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.includeDetails}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeDetails: e.target.checked 
                    }))}
                  />
                }
                label="Detailed Data Tables"
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" startIcon={<Download />}>
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission Reports Page Component
 * Comprehensive commission reporting with analytics, visualizations, and export capabilities
 */
const CommissionReportsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [reportData, setReportData] = useState({
    overview: null,
    trends: [],
    partnerPerformance: [],
    projectAnalysis: [],
    paymentStatus: [],
  });

  const [projects, setProjects] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter state
  const [filters, setFilters] = useState({
    period: 'current_month',
    startDate: null,
    endDate: null,
    projectId: null,
    partnerId: null,
    reportType: 'overview',
  });

  // Dialog states
  const [exportDialog, setExportDialog] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const canViewReports = canAccess.salesReports();

  const overviewMetrics = useMemo(() => {
    if (!reportData.overview) return {};

    return {
      totalCommissions: reportData.overview.totalCommissions || 0,
      totalAmount: reportData.overview.totalCommissionAmount || 0,
      averageCommission: reportData.overview.averageCommissionAmount || 0,
      topPerformer: reportData.overview.topPerformingPartner?.name || 'N/A',
      approvedCommissions: reportData.overview.approvedCommissions || 0,
      pendingCommissions: reportData.overview.pendingCommissions || 0,
      paidCommissions: reportData.overview.paidCommissions || 0,
      conversionRate: reportData.overview.conversionRate || 0,
    };
  }, [reportData.overview]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches filter options (projects and partners)
   */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [projectsResponse, partnersResponse] = await Promise.all([
        projectAPI.getProjects(),
        userAPI.getUsers({ role: 'Channel Partner' }),
      ]);

      setProjects(projectsResponse.data?.data || []);
      setPartners(partnersResponse.data?.data || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  /**
   * Generates commission report based on current filters
   */
  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = {
        ...filters,
      };

      // Add date range if not custom period
      if (filters.period !== 'custom') {
        const dateRange = getDateRangeFromPeriod(filters.period);
        if (dateRange) {
          queryParams.startDate = dateRange.startDate.toISOString();
          queryParams.endDate = dateRange.endDate.toISOString();
        }
      } else if (filters.startDate && filters.endDate) {
        queryParams.startDate = filters.startDate.toISOString();
        queryParams.endDate = filters.endDate.toISOString();
      }

      // Fetch commission analytics
      const [analyticsResponse, reportResponse] = await Promise.all([
        commissionAPI.getCommissionAnalytics(queryParams),
        commissionAPI.getCommissionReport(queryParams),
      ]);

      const analytics = analyticsResponse.data?.data || {};
      const report = reportResponse.data?.data || {};

      // Process and format data
      setReportData({
        overview: analytics.overview || analytics,
        trends: formatChartData(analytics.trends || [], 'monthly_trend'),
        partnerPerformance: formatChartData(report.partnerPerformance || [], 'partner_performance'),
        projectAnalysis: formatChartData(report.projectBreakdown || [], 'project_breakdown'),
        paymentStatus: formatChartData(analytics.statusDistribution || [], 'status_distribution'),
      });

    } catch (err) {
      console.error('Error generating commission report:', err);
      setError(err.response?.data?.message || 'Failed to generate commission report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Generate initial report
  useEffect(() => {
    generateReport();
  }, []); // Only on mount

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles filter changes
   */
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handles report export
   */
  const handleExport = useCallback(async (format, options) => {
    try {
      // This would typically call a backend endpoint to generate the export
      setSnackbar({
        open: true,
        message: `Export in ${format.toUpperCase()} format will be implemented`,
        severity: 'info',
      });

      // Implementation would depend on your backend export capabilities
      // Example:
      // const response = await commissionAPI.exportReport(filters, format, options);
      // const blob = new Blob([response.data], { type: 'application/octet-stream' });
      // const url = URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `commission-report-${new Date().toISOString().split('T')[0]}.${format}`;
      // link.click();
      // URL.revokeObjectURL(url);

    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Export failed. Please try again.',
        severity: 'error',
      });
    }
  }, [filters]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Check permissions
  if (!canViewReports) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" color="warning.main" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to view commission reports.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Commission Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive commission performance analysis and reporting
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={generateReport}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setExportDialog(true)}
            disabled={!reportData.overview}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => window.print()}
            disabled={!reportData.overview}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Report Filters */}
      <ReportFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onGenerateReport={generateReport}
        projects={projects}
        partners={partners}
        isLoading={loading}
      />

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Overview Metrics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Key Performance Indicators
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Commissions"
              value={overviewMetrics.totalCommissions?.toLocaleString() || '0'}
              icon={Assignment}
              color="primary"
              isLoading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Amount"
              value={formatCurrency(overviewMetrics.totalAmount || 0)}
              icon={MonetizationOn}
              color="success"
              isLoading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Average Commission"
              value={formatCurrency(overviewMetrics.averageCommission || 0)}
              icon={TrendingUp}
              color="info"
              isLoading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Approval Rate"
              value={formatPercentage(overviewMetrics.conversionRate || 0)}
              icon={CheckCircle}
              color="warning"
              isLoading={loading}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Charts and Visualizations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Commission Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader 
              title="Commission Trends"
              subheader="Monthly commission performance over time"
            />
            <CardContent>
              <CommissionTrendChart data={reportData.trends} isLoading={loading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader 
              title="Payment Status"
              subheader="Commission payment status distribution"
            />
            <CardContent>
              <ProjectDistributionChart data={reportData.paymentStatus} isLoading={loading} />
            </CardContent>
          </Card>
        </Grid>

        {/* Partner Performance */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Partner Performance"
              subheader="Top performing partners by commission amount"
            />
            <CardContent>
              <PartnerPerformanceChart data={reportData.partnerPerformance} isLoading={loading} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Tables */}
      <Grid container spacing={3}>
        {/* Partner Performance Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Partner Performance Details" />
            <CardContent sx={{ p: 0 }}>
              <CommissionSummaryTable 
                data={reportData.partnerPerformance} 
                type="partner_performance"
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Project Analysis Table */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Project Commission Analysis" />
            <CardContent sx={{ p: 0 }}>
              <CommissionSummaryTable 
                data={reportData.projectAnalysis} 
                type="project_analysis"
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        onExport={handleExport}
        reportData={reportData}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CommissionReportsPage;
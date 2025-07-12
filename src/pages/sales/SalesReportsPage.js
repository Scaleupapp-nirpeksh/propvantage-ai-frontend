/**
 * File: src/pages/sales/SalesReportsPage.js
 * Description: Enhanced sales reporting dashboard with modern UX and frontend export functionality
 * Version: 2.0 - UX Enhancement & Frontend Export Implementation
 * Location: src/pages/sales/SalesReportsPage.js
 */

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
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
  Tooltip,
  Badge,
  Fade,
  Slide,
  Zoom,
  Breadcrumbs,
  Link,
  Menu,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  alpha,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ExpandMore,
  Refresh,
  FileDownload,
  Print,
  Share,
  CalendarToday,
  Person,
  Business,
  PieChart,
  BarChart,
  ShowChart,
  Timeline as TimelineIcon,
  MonetizationOn,
  CheckCircle,
  Schedule,
  Warning,
  TableChart,
  InsertChart,
  FilterList,
  Clear,
  DateRange,
  GetApp,
  Visibility,
  Dashboard,
  Home,
  Analytics,
  PictureAsPdf,
  TableView,
  SaveAlt,
  CloudDownload,
  DataSaverOff,
  FullscreenRounded,
  SettingsRounded,
  AutoGraphRounded,
  LeaderboardRounded,
  PieChartRounded,
  BarChartRounded,
  TimelineRounded,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const REPORT_TYPES = [
  {
    key: 'overview',
    label: 'Sales Overview',
    description: 'High-level sales metrics and trends',
    icon: AutoGraphRounded,
    color: 'primary',
  },
  {
    key: 'performance',
    label: 'Performance Analysis',
    description: 'Detailed performance by salesperson and project',
    icon: LeaderboardRounded,
    color: 'success',
  },
  {
    key: 'revenue',
    label: 'Revenue Analytics',
    description: 'Revenue trends and forecasting',
    icon: MonetizationOn,
    color: 'info',
  },
  {
    key: 'detailed',
    label: 'Detailed Reports',
    description: 'Comprehensive data tables and exports',
    icon: TableView,
    color: 'warning',
  },
];

const TIME_PERIODS = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 3 months', days: 90 },
  { value: '180', label: 'Last 6 months', days: 180 },
  { value: '365', label: 'Last year', days: 365 },
  { value: 'ytd', label: 'Year to date', days: null },
  { value: 'custom', label: 'Custom range', days: null },
];

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', 
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'
];

const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF Report', icon: PictureAsPdf, description: 'Complete visual report' },
  { key: 'excel', label: 'Excel File', icon: TableView, description: 'Spreadsheet with all data' },
  { key: 'csv', label: 'CSV Data', icon: DataSaverOff, description: 'Raw data export' },
  { key: 'print', label: 'Print Report', icon: Print, description: 'Print-friendly version' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateDateRange = (period) => {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'ytd':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      break;
    case 'custom':
      return { startDate: null, endDate: null };
    default:
      const days = parseInt(period);
      startDate.setDate(endDate.getDate() - days);
  }

  return { startDate, endDate };
};

const aggregateDataByPeriod = (data, period) => {
  const groupedData = {};
  
  data.forEach(item => {
    const date = new Date(item.bookingDate || item.createdAt);
    let key;
    
    if (period <= 30) {
      key = date.toLocaleDateString();
    } else if (period <= 180) {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = `Week of ${weekStart.toLocaleDateString()}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groupedData[key]) {
      groupedData[key] = {
        period: key,
        sales: 0,
        revenue: 0,
        averageValue: 0,
      };
    }
    
    groupedData[key].sales += 1;
    groupedData[key].revenue += item.salePrice || 0;
  });
  
  Object.values(groupedData).forEach(item => {
    item.averageValue = item.sales > 0 ? item.revenue / item.sales : 0;
  });
  
  return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
};

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

const exportToPDF = async (reportData, filters) => {
  try {
    // Import html2pdf dynamically
    const html2pdf = await import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    
    const element = document.getElementById('report-content');
    const options = {
      margin: 1,
      filename: `sales-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf.default().from(element).set(options).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('PDF export is not available. Please try another format.');
  }
};

const exportToExcel = (salesData, analytics, filters) => {
  try {
    // Create workbook data
    const wb = {
      SheetNames: ['Sales Data', 'Summary'],
      Sheets: {}
    };

    // Sales data sheet
    const salesSheetData = salesData.map(sale => ({
      'Customer Name': sale.lead?.firstName && sale.lead?.lastName 
        ? `${sale.lead.firstName} ${sale.lead.lastName}` 
        : sale.lead?.email || 'Unknown',
      'Project': sale.project?.name || 'Unknown',
      'Unit': sale.unit?.unitNumber || sale.unit?.fullAddress || 'Unknown',
      'Sale Price': sale.salePrice || 0,
      'Status': sale.status || 'Unknown',
      'Booking Date': sale.bookingDate ? formatDate(sale.bookingDate) : '',
      'Salesperson': sale.salesPerson?.firstName && sale.salesPerson?.lastName 
        ? `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}` 
        : 'Unassigned',
    }));

    // Summary data
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Sales', totalSales],
      ['Total Revenue', totalRevenue],
      ['Average Sale Value', totalSales > 0 ? totalRevenue / totalSales : 0],
      ['Report Period', TIME_PERIODS.find(p => p.value === filters.period)?.label || 'Custom'],
      ['Generated On', new Date().toLocaleDateString()],
    ];

    // Convert to worksheet format (simplified)
    wb.Sheets['Sales Data'] = {
      '!ref': `A1:G${salesSheetData.length + 1}`,
      ...salesSheetData.reduce((acc, row, index) => {
        Object.keys(row).forEach((key, colIndex) => {
          const cellAddress = String.fromCharCode(65 + colIndex) + (index + 2);
          acc[cellAddress] = { v: row[key] };
        });
        return acc;
      }, {
        A1: { v: 'Customer Name' }, B1: { v: 'Project' }, C1: { v: 'Unit' },
        D1: { v: 'Sale Price' }, E1: { v: 'Status' }, F1: { v: 'Booking Date' }, G1: { v: 'Salesperson' }
      })
    };

    wb.Sheets['Summary'] = {
      '!ref': `A1:B${summaryData.length}`,
      ...summaryData.reduce((acc, row, index) => {
        acc[`A${index + 1}`] = { v: row[0] };
        acc[`B${index + 1}`] = { v: row[1] };
        return acc;
      }, {})
    };

    // Create download (simplified approach)
    const csvContent = salesSheetData.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    const headers = Object.keys(salesSheetData[0] || {}).map(h => `"${h}"`).join(',');
    const fullCsv = headers + '\n' + csvContent;
    
    const blob = new Blob([fullCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel export failed:', error);
    alert('Excel export failed. Downloading as CSV instead.');
  }
};

const exportToCSV = (salesData, filters) => {
  try {
    const csvData = salesData.map(sale => ({
      'Customer Name': sale.lead?.firstName && sale.lead?.lastName 
        ? `${sale.lead.firstName} ${sale.lead.lastName}` 
        : sale.lead?.email || 'Unknown',
      'Project': sale.project?.name || 'Unknown',
      'Unit': sale.unit?.unitNumber || sale.unit?.fullAddress || 'Unknown',
      'Sale Price': sale.salePrice || 0,
      'Status': sale.status || 'Unknown',
      'Booking Date': sale.bookingDate ? formatDate(sale.bookingDate) : '',
      'Salesperson': sale.salesPerson?.firstName && sale.salesPerson?.lastName 
        ? `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}` 
        : 'Unassigned',
    }));

    const headers = Object.keys(csvData[0] || {}).map(h => `"${h}"`).join(',');
    const rows = csvData.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    const csvContent = headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export failed:', error);
    alert('CSV export failed. Please try again.');
  }
};

const handlePrint = () => {
  window.print();
};

// ============================================================================
// ENHANCED METRIC CARD COMPONENT
// ============================================================================

const EnhancedMetricCard = ({ title, value, subtitle, icon: Icon, color, trend, loading, onClick }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="text" width="80%" />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Zoom in timeout={300}>
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].light, 0.05)})`,
          border: 1,
          borderColor: alpha(theme.palette[color].main, 0.2),
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: 6,
            borderColor: theme.palette[color].main,
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography color="text.secondary" variant="body2" gutterBottom fontWeight="medium">
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight="bold" 
                color={`${color}.main`}
                sx={{ mb: 1 }}
              >
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {trend > 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography 
                    variant="caption" 
                    color={trend > 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Avatar 
              sx={{ 
                bgcolor: `${color}.main`, 
                width: 56, 
                height: 56,
                ml: 2,
                boxShadow: 3,
              }}
            >
              <Icon />
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// ============================================================================
// ENHANCED SALES OVERVIEW COMPONENT
// ============================================================================

const EnhancedSalesOverview = ({ salesData, analytics, loading, period }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.salePrice || 0), 0);
  const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  const statusBreakdown = salesData.reduce((acc, sale) => {
    const status = sale.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const trendData = useMemo(() => {
    return aggregateDataByPeriod(salesData, parseInt(period) || 30);
  }, [salesData, period]);

  const pieData = Object.entries(statusBreakdown).map(([status, count], index) => ({
    name: status,
    value: count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const metrics = [
    {
      title: 'Total Sales',
      value: totalSales.toLocaleString(),
      subtitle: TIME_PERIODS.find(p => p.value === period)?.label || 'Custom period',
      icon: Assessment,
      color: 'primary',
      trend: null,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'Revenue generated',
      icon: MonetizationOn,
      color: 'success',
      trend: null,
    },
    {
      title: 'Average Sale Value',
      value: formatCurrency(averageSaleValue),
      subtitle: 'Per transaction',
      icon: TrendingUp,
      color: 'info',
      trend: null,
    },
    {
      title: 'Completion Rate',
      value: totalSales > 0 ? formatPercentage((statusBreakdown['Completed'] || 0) / totalSales * 100) : '0%',
      subtitle: 'Sales completed',
      icon: CheckCircle,
      color: 'warning',
      trend: null,
    },
  ];

  return (
    <Box id="sales-overview-content">
      {/* Enhanced Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <EnhancedMetricCard {...metric} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Enhanced Charts Section */}
      <Grid container spacing={3}>
        {/* Sales Trend Chart with Controls */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 450 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Sales Trend Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sales and revenue over {TIME_PERIODS.find(p => p.value === period)?.label.toLowerCase()}
                    </Typography>
                  </Box>
                  
                  <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(e, newType) => newType && setChartType(newType)}
                    size="small"
                  >
                    <ToggleButton value="area">
                      <Tooltip title="Area Chart">
                        <ShowChart />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="bar">
                      <Tooltip title="Bar Chart">
                        <BarChart />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="line">
                      <Tooltip title="Line Chart">
                        <TimelineIcon />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              }
            />
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    {chartType === 'area' ? (
                      <ComposedChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                        <YAxis yAxisId="sales" orientation="left" stroke={theme.palette.text.secondary} />
                        <YAxis yAxisId="revenue" orientation="right" stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'revenue' || name === 'averageValue') {
                              return [formatCurrency(value), name];
                            }
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Area
                          yAxisId="sales"
                          type="monotone"
                          dataKey="sales"
                          stackId="1"
                          stroke={theme.palette.primary.main}
                          fill={theme.palette.primary.main}
                          fillOpacity={0.3}
                          name="Sales Count"
                        />
                        <Bar
                          yAxisId="revenue"
                          dataKey="revenue"
                          fill={theme.palette.success.main}
                          fillOpacity={0.7}
                          name="Revenue"
                        />
                      </ComposedChart>
                    ) : chartType === 'bar' ? (
                      <RechartsBarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'revenue' || name === 'averageValue') {
                              return [formatCurrency(value), name];
                            }
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar dataKey="sales" fill={theme.palette.primary.main} name="Sales Count" />
                        <Bar dataKey="revenue" fill={theme.palette.success.main} name="Revenue" />
                      </RechartsBarChart>
                    ) : (
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'revenue' || name === 'averageValue') {
                              return [formatCurrency(value), name];
                            }
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke={theme.palette.primary.main} 
                          strokeWidth={3}
                          name="Sales Count"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke={theme.palette.success.main} 
                          strokeWidth={3}
                          name="Revenue"
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Status Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 450 }}>
            <CardHeader 
              title="Sales by Status" 
              subheader="Distribution across pipeline stages"
            />
            <CardContent>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <>
                  <Box sx={{ width: '100%', height: 250, mb: 2 }}>
                    <ResponsiveContainer>
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Status Legend */}
                  <Stack spacing={1}>
                    {pieData.map((status) => (
                      <Box key={status.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: status.fill, 
                              borderRadius: 1, 
                              mr: 1 
                            }} 
                          />
                          <Typography variant="body2">{status.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {status.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================================
// ENHANCED PERFORMANCE ANALYSIS COMPONENT
// ============================================================================

const EnhancedPerformanceAnalysis = ({ salesData, projects, users, loading }) => {
  const theme = useTheme();
  const [performanceView, setPerformanceView] = useState('salesperson');

  const salespersonPerformance = useMemo(() => {
    const performance = {};
    
    salesData.forEach(sale => {
      const salesPersonId = sale.salesPerson?._id || sale.salesPerson || 'unassigned';
      const salesPersonName = sale.salesPerson?.firstName && sale.salesPerson?.lastName 
        ? `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}`
        : 'Unassigned';
      
      if (!performance[salesPersonId]) {
        performance[salesPersonId] = {
          id: salesPersonId,
          name: salesPersonName,
          sales: 0,
          revenue: 0,
          averageValue: 0,
        };
      }
      
      performance[salesPersonId].sales += 1;
      performance[salesPersonId].revenue += sale.salePrice || 0;
    });
    
    return Object.values(performance)
      .map(perf => ({
        ...perf,
        averageValue: perf.sales > 0 ? perf.revenue / perf.sales : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData]);

  const projectPerformance = useMemo(() => {
    const performance = {};
    
    salesData.forEach(sale => {
      const projectId = sale.project?._id || sale.project || 'unknown';
      const projectName = sale.project?.name || 'Unknown Project';
      
      if (!performance[projectId]) {
        performance[projectId] = {
          id: projectId,
          name: projectName,
          sales: 0,
          revenue: 0,
          averageValue: 0,
        };
      }
      
      performance[projectId].sales += 1;
      performance[projectId].revenue += sale.salePrice || 0;
    });
    
    return Object.values(performance)
      .map(perf => ({
        ...perf,
        averageValue: perf.sales > 0 ? perf.revenue / perf.sales : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [salesData]);

  const currentData = performanceView === 'salesperson' ? salespersonPerformance : projectPerformance;

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2].map(i => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Skeleton variant="rectangular" height="100%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box id="performance-analysis-content">
      <Grid container spacing={3}>
        {/* Performance Chart with Toggle */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 500 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Performance Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revenue performance comparison
                    </Typography>
                  </Box>
                  
                  <ToggleButtonGroup
                    value={performanceView}
                    exclusive
                    onChange={(e, newView) => newView && setPerformanceView(newView)}
                    size="small"
                  >
                    <ToggleButton value="salesperson">
                      <Person sx={{ mr: 1 }} />
                      Salespeople
                    </ToggleButton>
                    <ToggleButton value="project">
                      <Business sx={{ mr: 1 }} />
                      Projects
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              }
            />
            <CardContent>
              <Box sx={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <RechartsBarChart data={currentData.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis type="number" stroke={theme.palette.text.secondary} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke={theme.palette.text.secondary}
                      width={120}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill={performanceView === 'salesperson' ? theme.palette.primary.main : theme.palette.success.main}
                      radius={[0, 4, 4, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Performers Table */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 500 }}>
            <CardHeader 
              title={`Top ${performanceView === 'salesperson' ? 'Performers' : 'Projects'}`}
              subheader="Performance ranking"
            />
            <CardContent sx={{ p: 0, height: 420, overflow: 'auto' }}>
              {currentData.slice(0, 10).map((perf, index) => (
                <Box 
                  key={perf.id}
                  sx={{ 
                    p: 2, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        mr: 2, 
                        width: 32, 
                        height: 32, 
                        fontSize: '0.875rem',
                        bgcolor: index < 3 ? 'primary.main' : 'grey.400',
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {perf.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {perf.sales} sale{perf.sales !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(perf.revenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg: {formatCurrency(perf.averageValue)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================================
// DETAILED REPORTS TABLE COMPONENT
// ============================================================================

const DetailedReportsTable = ({ salesData, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={400} />
        </CardContent>
      </Card>
    );
  }

  const paginatedData = salesData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <CardHeader 
        title="Detailed Sales Data" 
        subheader={`${salesData.length} total records`}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Sale Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Salesperson</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((sale) => (
                <TableRow key={sale._id} hover>
                  <TableCell>
                    {sale.lead?.firstName && sale.lead?.lastName 
                      ? `${sale.lead.firstName} ${sale.lead.lastName}` 
                      : sale.lead?.email || 'Unknown'}
                  </TableCell>
                  <TableCell>{sale.project?.name || 'Unknown'}</TableCell>
                  <TableCell>{sale.unit?.unitNumber || sale.unit?.fullAddress || 'Unknown'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(sale.salePrice || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.status || 'Unknown'} 
                      size="small"
                      color={
                        sale.status === 'Completed' ? 'success' :
                        sale.status === 'Cancelled' ? 'error' :
                        sale.status === 'Agreement Signed' ? 'primary' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {sale.bookingDate ? formatDate(sale.bookingDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {sale.salesPerson?.firstName && sale.salesPerson?.lastName 
                      ? `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}` 
                      : 'Unassigned'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={salesData.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN ENHANCED SALES REPORTS PAGE
// ============================================================================

const SalesReportsPage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    period: searchParams.get('period') || '30',
    project: searchParams.get('project') || 'all',
    salesperson: searchParams.get('salesperson') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
  });

  const canViewReports = canAccess && canAccess.salesPipeline ? canAccess.salesPipeline() : true;

  // Fetch reports data (keeping original logic)
  const fetchReportsData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching reports data with filters:', filters);

      let dateRange = generateDateRange(filters.period);
      if (filters.period === 'custom' && filters.dateFrom && filters.dateTo) {
        dateRange = { startDate: filters.dateFrom, endDate: filters.dateTo };
      }

      const queryParams = {
        limit: 1000,
        project: filters.project !== 'all' ? filters.project : undefined,
        salesperson: filters.salesperson !== 'all' ? filters.salesperson : undefined,
        dateFrom: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
        dateTo: dateRange.endDate ? dateRange.endDate.toISOString() : undefined,
        sortBy: 'bookingDate',
        sortOrder: 'desc',
      };

      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      const [salesResult, analyticsResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSales(queryParams),
        salesAPI.getSalesAnalytics({ 
          period: filters.period !== 'custom' ? filters.period : undefined,
          projectId: filters.project !== 'all' ? filters.project : undefined,
          salespersonId: filters.salesperson !== 'all' ? filters.salesperson : undefined,
        }),
        projectAPI.getProjects(),
        canAccess && canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (salesResult.status === 'fulfilled') {
        const response = salesResult.value.data;
        const sales = response.data || [];
        console.log('✅ Sales data loaded:', sales.length, 'sales');
        setSalesData(sales);
      } else {
        console.error('❌ Sales API failed:', salesResult.reason);
        setSalesData([]);
      }

      if (analyticsResult.status === 'fulfilled') {
        const response = analyticsResult.value.data;
        const analyticsData = response.data || [];
        console.log('✅ Analytics data loaded:', analyticsData);
        setAnalytics(analyticsData);
      } else {
        console.error('❌ Analytics API failed:', analyticsResult.reason);
        setAnalytics({});
      }

      if (projectsResult.status === 'fulfilled') {
        const response = projectsResult.value.data;
        const projectsData = response.data || response || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      if (usersResult.status === 'fulfilled') {
        const response = usersResult.value.data;
        const usersData = response.data || response || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching reports data:', error);
      setError('Failed to load reports data. Please try again.');
      setLoading(false);
      setSalesData([]);
      setAnalytics({});
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters, canAccess]);

  useEffect(() => {
    if (canViewReports) {
      fetchReportsData();
    }
  }, [fetchReportsData, canViewReports]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value);
        }
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = async (format) => {
    setExportMenuAnchor(null);
    
    switch (format) {
      case 'pdf':
        await exportToPDF(salesData, filters);
        break;
      case 'excel':
        exportToExcel(salesData, analytics, filters);
        break;
      case 'csv':
        exportToCSV(salesData, filters);
        break;
      case 'print':
        handlePrint();
        break;
      default:
        console.log('Unknown export format:', format);
    }
  };

  const clearFilters = () => {
    setFilters({
      period: '30',
      project: 'all',
      salesperson: 'all',
      dateFrom: null,
      dateTo: null,
    });
  };

  const refreshData = () => {
    fetchReportsData(true);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );

  if (!canViewReports) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view sales reports.
        </Alert>
      </Box>
    );
  }

  const speedDialActions = [
    { icon: <PictureAsPdf />, name: 'Export PDF', onClick: () => handleExport('pdf') },
    { icon: <TableView />, name: 'Export Excel', onClick: () => handleExport('excel') },
    { icon: <DataSaverOff />, name: 'Export CSV', onClick: () => handleExport('csv') },
    { icon: <Print />, name: 'Print Report', onClick: () => handleExport('print') },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        
        {/* Enhanced Header */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            border: 0,
            borderRadius: 0,
          }}
        >
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/" onClick={() => navigate('/')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Home fontSize="small" />
                Dashboard
              </Box>
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Analytics fontSize="small" />
              Sales Reports
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Sales Reports
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Comprehensive sales analytics and performance insights
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => handleExport('print')}
              >
                Print
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<CloudDownload />}
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              >
                Export
              </Button>
              
              <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={refreshData}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ px: 3 }} id="report-content">
          {refreshing && <LinearProgress sx={{ mb: 2 }} />}

          {error && (
            <Fade in={Boolean(error)}>
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </Fade>
          )}

          {/* Enhanced Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Report Filters
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={filters.period}
                      label="Time Period"
                      onChange={handleFilterChange('period')}
                    >
                      {TIME_PERIODS.map((period) => (
                        <MenuItem key={period.value} value={period.value}>
                          {period.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {filters.period === 'custom' && (
                  <>
                    <Grid item xs={12} sm={6} md={2}>
                      <DatePicker
                        label="From Date"
                        value={filters.dateFrom}
                        onChange={handleFilterChange('dateFrom')}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DatePicker
                        label="To Date"
                        value={filters.dateTo}
                        onChange={handleFilterChange('dateTo')}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={filters.project}
                      label="Project"
                      onChange={handleFilterChange('project')}
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

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Salesperson</InputLabel>
                    <Select
                      value={filters.salesperson}
                      label="Salesperson"
                      onChange={handleFilterChange('salesperson')}
                    >
                      <MenuItem value="all">All Salespeople</MenuItem>
                      {users.filter(u => u.role?.includes('Sales')).map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Clear />}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Enhanced Report Tabs */}
          <Card sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 72,
                    textTransform: 'none',
                  },
                }}
              >
                {REPORT_TYPES.map((type, index) => (
                  <Tab 
                    key={type.key}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <type.icon />
                        <Typography variant="body2" fontWeight="medium">
                          {type.label}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              <TabPanel value={activeTab} index={0}>
                <EnhancedSalesOverview 
                  salesData={salesData}
                  analytics={analytics}
                  loading={loading}
                  period={filters.period}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <EnhancedPerformanceAnalysis 
                  salesData={salesData}
                  projects={projects}
                  users={users}
                  loading={loading}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <MonetizationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    Revenue Analytics Coming Soon
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Advanced revenue forecasting and predictive analytics will be available here.
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <DetailedReportsTable 
                  salesData={salesData}
                  loading={loading}
                />
              </TabPanel>
            </Box>
          </Card>
        </Box>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          {EXPORT_FORMATS.map((format) => (
            <MenuItem key={format.key} onClick={() => handleExport(format.key)}>
              <ListItemIcon>
                <format.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={format.label}
                secondary={format.description}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Export Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesReportsPage;
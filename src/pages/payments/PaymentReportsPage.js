/**
 * File: src/pages/payments/PaymentReportsPage.js
 * Description: Comprehensive payment reporting dashboard with analytics and management
 * Version: 1.0 - Complete Payment Management Implementation
 * Location: src/pages/payments/PaymentReportsPage.js
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
  Tooltip,
  Fade,
  Zoom,
  Breadcrumbs,
  Link,
  Menu,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  alpha,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Payment,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Refresh,
  Print,
  Business,
  BarChart,
  ShowChart,
  Timeline as TimelineIcon,
  MonetizationOn,
  CheckCircle,
  Clear,
  Visibility,
  Home,
  PictureAsPdf,
  TableView,
  CloudDownload,
  DataSaverOff,
  AutoGraphRounded,
  ErrorOutline,
  AccessTime,
  CreditCard,
  QueryStats,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  LineChart,
  Line,
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
import { paymentAPI, projectAPI, userAPI, salesAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const REPORT_TYPES = [
  {
    key: 'overview',
    label: 'Payment Overview',
    description: 'High-level payment metrics and trends',
    icon: AutoGraphRounded,
    color: 'primary',
  },
  {
    key: 'performance',
    label: 'Performance Analytics',
    description: 'Payment plans and collection performance',
    icon: QueryStats,
    color: 'success',
  },
  {
    key: 'overdue',
    label: 'Overdue Management',
    description: 'Overdue payments and collections',
    icon: ErrorOutline,
    color: 'error',
  },
  {
    key: 'detailed',
    label: 'Detailed Records',
    description: 'Comprehensive payment data and exports',
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

const PAYMENT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'overdue', label: 'Overdue', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
  { value: 'processing', label: 'Processing', color: 'info' },
];

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', 
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'
];

const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF Report', icon: PictureAsPdf, description: 'Complete payment report' },
  { key: 'excel', label: 'Excel File', icon: TableView, description: 'Spreadsheet with all data' },
  { key: 'csv', label: 'CSV Data', icon: DataSaverOff, description: 'Raw payment data' },
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

const aggregatePaymentsByPeriod = (data, period) => {
  const groupedData = {};
  
  data.forEach(payment => {
    const date = new Date(payment.dueDate || payment.createdAt);
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
        payments: 0,
        amount: 0,
        overdue: 0,
        completed: 0,
      };
    }
    
    groupedData[key].payments += 1;
    groupedData[key].amount += payment.amount || 0;
    
    if (payment.status === 'overdue') groupedData[key].overdue += 1;
    if (payment.status === 'completed') groupedData[key].completed += 1;
  });
  
  return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
};

const calculatePaymentMetrics = (payments) => {
  const total = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completed = payments.filter(p => p.status === 'completed').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;
  const pending = payments.filter(p => p.status === 'pending').length;
  
  const completedAmount = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const overdueAmount = payments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const collectionRate = total > 0 ? (completed / total) * 100 : 0;
  const overdueRate = total > 0 ? (overdue / total) * 100 : 0;
  
  return {
    total,
    totalAmount,
    completed,
    overdue,
    pending,
    completedAmount,
    overdueAmount,
    collectionRate,
    overdueRate,
    averagePayment: total > 0 ? totalAmount / total : 0,
  };
};

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

const exportToPDF = async (paymentData, filters) => {
  try {
    const html2pdf = await import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    
    const element = document.getElementById('payment-report-content');
    const options = {
      margin: 1,
      filename: `payment-report-${new Date().toISOString().split('T')[0]}.pdf`,
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

const exportToExcel = (paymentData, analytics, filters) => {
  try {
    const paymentSheetData = paymentData.map(payment => ({
      'Payment ID': payment._id || payment.paymentId || 'N/A',
      'Customer': payment.customer?.name || payment.customerName || 'Unknown',
      'Project': payment.project?.name || 'Unknown',
      'Amount': payment.amount || 0,
      'Status': payment.status || 'Unknown',
      'Due Date': payment.dueDate ? formatDate(payment.dueDate) : '',
      'Paid Date': payment.paidDate ? formatDate(payment.paidDate) : '',
      'Payment Method': payment.paymentMethod || 'Unknown',
      'Notes': payment.notes || '',
    }));

    const csvContent = paymentSheetData.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    const headers = Object.keys(paymentSheetData[0] || {}).map(h => `"${h}"`).join(',');
    const fullCsv = headers + '\n' + csvContent;
    
    const blob = new Blob([fullCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Excel export failed:', error);
    alert('Excel export failed. Downloading as CSV instead.');
  }
};

const exportToCSV = (paymentData, filters) => {
  try {
    const csvData = paymentData.map(payment => ({
      'Payment ID': payment._id || payment.paymentId || 'N/A',
      'Customer': payment.customer?.name || payment.customerName || 'Unknown',
      'Project': payment.project?.name || 'Unknown',
      'Amount': payment.amount || 0,
      'Status': payment.status || 'Unknown',
      'Due Date': payment.dueDate ? formatDate(payment.dueDate) : '',
      'Paid Date': payment.paidDate ? formatDate(payment.paidDate) : '',
      'Payment Method': payment.paymentMethod || 'Unknown',
      'Notes': payment.notes || '',
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
    link.download = `payment-data-${new Date().toISOString().split('T')[0]}.csv`;
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
              {trend !== null && trend !== undefined && (
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
// PAYMENT OVERVIEW COMPONENT
// ============================================================================

const PaymentOverview = ({ paymentData, analytics, loading, period }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const metrics = useMemo(() => calculatePaymentMetrics(paymentData), [paymentData]);
  
  const trendData = useMemo(() => {
    return aggregatePaymentsByPeriod(paymentData, parseInt(period) || 30);
  }, [paymentData, period]);

  const statusBreakdown = useMemo(() => {
    const breakdown = paymentData.reduce((acc, payment) => {
      const status = payment.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(breakdown).map(([status, count], index) => ({
      name: status,
      value: count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [paymentData]);

  const metricCards = [
    {
      title: 'Total Payments',
      value: metrics.total.toLocaleString(),
      subtitle: TIME_PERIODS.find(p => p.value === period)?.label || 'Custom period',
      icon: Payment,
      color: 'primary',
      trend: null,
    },
    {
      title: 'Total Amount',
      value: formatCurrency(metrics.totalAmount),
      subtitle: 'Total payment amount',
      icon: MonetizationOn,
      color: 'success',
      trend: null,
    },
    {
      title: 'Collection Rate',
      value: formatPercentage(metrics.collectionRate),
      subtitle: 'Successful collections',
      icon: CheckCircle,
      color: 'info',
      trend: null,
    },
    {
      title: 'Overdue Amount',
      value: formatCurrency(metrics.overdueAmount),
      subtitle: `${metrics.overdue} overdue payments`,
      icon: ErrorOutline,
      color: 'error',
      trend: null,
    },
  ];

  return (
    <Box id="payment-overview-content">
      {/* Enhanced Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricCards.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <EnhancedMetricCard {...metric} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Enhanced Charts Section */}
      <Grid container spacing={3}>
        {/* Payment Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 450 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Payment Trend Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment volume and amounts over {TIME_PERIODS.find(p => p.value === period)?.label.toLowerCase()}
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
                        <YAxis yAxisId="count" orientation="left" stroke={theme.palette.text.secondary} />
                        <YAxis yAxisId="amount" orientation="right" stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'amount') {
                              return [formatCurrency(value), 'Amount'];
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
                          yAxisId="count"
                          type="monotone"
                          dataKey="payments"
                          stackId="1"
                          stroke={theme.palette.primary.main}
                          fill={theme.palette.primary.main}
                          fillOpacity={0.3}
                          name="Payment Count"
                        />
                        <Bar
                          yAxisId="amount"
                          dataKey="amount"
                          fill={theme.palette.success.main}
                          fillOpacity={0.7}
                          name="Amount"
                        />
                      </ComposedChart>
                    ) : chartType === 'bar' ? (
                      <RechartsBarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'amount') {
                              return [formatCurrency(value), 'Amount'];
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
                        <Bar dataKey="payments" fill={theme.palette.primary.main} name="Payment Count" />
                        <Bar dataKey="amount" fill={theme.palette.success.main} name="Amount" />
                      </RechartsBarChart>
                    ) : (
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="period" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip 
                          formatter={(value, name) => {
                            if (name === 'amount') {
                              return [formatCurrency(value), 'Amount'];
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
                          dataKey="payments" 
                          stroke={theme.palette.primary.main} 
                          strokeWidth={3}
                          name="Payment Count"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke={theme.palette.success.main} 
                          strokeWidth={3}
                          name="Amount"
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 450 }}>
            <CardHeader 
              title="Payment Status" 
              subheader="Distribution by status"
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
                          data={statusBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  {/* Status Legend */}
                  <Stack spacing={1}>
                    {statusBreakdown.map((status) => (
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
// PERFORMANCE ANALYTICS COMPONENT
// ============================================================================

const PerformanceAnalytics = ({ paymentData, projects, loading }) => {
  const theme = useTheme();
  const [performanceView, setPerformanceView] = useState('project');

  const projectPerformance = useMemo(() => {
    const performance = {};
    
    paymentData.forEach(payment => {
      const projectId = payment.project?._id || payment.project || 'unknown';
      const projectName = payment.project?.name || 'Unknown Project';
      
      if (!performance[projectId]) {
        performance[projectId] = {
          id: projectId,
          name: projectName,
          payments: 0,
          totalAmount: 0,
          completed: 0,
          overdue: 0,
          collectionRate: 0,
        };
      }
      
      performance[projectId].payments += 1;
      performance[projectId].totalAmount += payment.amount || 0;
      
      if (payment.status === 'completed') performance[projectId].completed += 1;
      if (payment.status === 'overdue') performance[projectId].overdue += 1;
    });
    
    return Object.values(performance)
      .map(perf => ({
        ...perf,
        collectionRate: perf.payments > 0 ? (perf.completed / perf.payments) * 100 : 0,
        averagePayment: perf.payments > 0 ? perf.totalAmount / perf.payments : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [paymentData]);

  const paymentMethodPerformance = useMemo(() => {
    const performance = {};
    
    paymentData.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      
      if (!performance[method]) {
        performance[method] = {
          method,
          payments: 0,
          totalAmount: 0,
          completed: 0,
        };
      }
      
      performance[method].payments += 1;
      performance[method].totalAmount += payment.amount || 0;
      
      if (payment.status === 'completed') performance[method].completed += 1;
    });
    
    return Object.values(performance)
      .map(perf => ({
        ...perf,
        successRate: perf.payments > 0 ? (perf.completed / perf.payments) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [paymentData]);

  const currentData = performanceView === 'project' ? projectPerformance : paymentMethodPerformance;

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
    <Box id="performance-analytics-content">
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 500 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Performance Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment performance by {performanceView}
                    </Typography>
                  </Box>
                  
                  <ToggleButtonGroup
                    value={performanceView}
                    exclusive
                    onChange={(e, newView) => newView && setPerformanceView(newView)}
                    size="small"
                  >
                    <ToggleButton value="project">
                      <Business sx={{ mr: 1 }} />
                      Projects
                    </ToggleButton>
                    <ToggleButton value="method">
                      <CreditCard sx={{ mr: 1 }} />
                      Methods
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
                      dataKey={performanceView === 'project' ? 'name' : 'method'} 
                      stroke={theme.palette.text.secondary}
                      width={120}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Total Amount']}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Bar 
                      dataKey="totalAmount" 
                      fill={performanceView === 'project' ? theme.palette.primary.main : theme.palette.info.main}
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
              title={`Top ${performanceView === 'project' ? 'Projects' : 'Payment Methods'}`}
              subheader="Performance ranking"
            />
            <CardContent sx={{ p: 0, height: 420, overflow: 'auto' }}>
              {currentData.slice(0, 10).map((perf, index) => (
                <Box 
                  key={perf.id || perf.method}
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
                        {perf.name || perf.method}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {perf.payments} payment{perf.payments !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(perf.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatPercentage(perf.collectionRate || perf.successRate || 0)} rate
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
// OVERDUE MANAGEMENT COMPONENT
// ============================================================================

const OverdueManagement = ({ paymentData, loading }) => {
  const overduePayments = useMemo(() => {
    return paymentData
      .filter(payment => payment.status === 'overdue')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [paymentData]);

  const overdueByAge = useMemo(() => {
    const now = new Date();
    const ageGroups = {
      '1-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0,
    };

    overduePayments.forEach(payment => {
      const dueDate = new Date(payment.dueDate);
      const daysPastDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= 30) ageGroups['1-30 days']++;
      else if (daysPastDue <= 60) ageGroups['31-60 days']++;
      else if (daysPastDue <= 90) ageGroups['61-90 days']++;
      else ageGroups['90+ days']++;
    });

    return Object.entries(ageGroups).map(([age, count], index) => ({
      name: age,
      value: count,
      fill: CHART_COLORS[index],
    }));
  }, [overduePayments]);

  const totalOverdueAmount = overduePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

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
    <Box id="overdue-management-content">
      <Grid container spacing={3}>
        {/* Overdue Summary Cards */}
        <Grid item xs={12} md={6} lg={3}>
          <EnhancedMetricCard
            title="Overdue Payments"
            value={overduePayments.length.toLocaleString()}
            subtitle="Payments past due"
            icon={ErrorOutline}
            color="error"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <EnhancedMetricCard
            title="Overdue Amount"
            value={formatCurrency(totalOverdueAmount)}
            subtitle="Total outstanding"
            icon={MonetizationOn}
            color="warning"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <EnhancedMetricCard
            title="Oldest Overdue"
            value={overduePayments.length > 0 ? 
              `${Math.floor((new Date() - new Date(overduePayments[0].dueDate)) / (1000 * 60 * 60 * 24))} days` : 
              '0 days'
            }
            subtitle="Days past due"
            icon={AccessTime}
            color="info"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <EnhancedMetricCard
            title="Average Overdue"
            value={formatCurrency(overduePayments.length > 0 ? totalOverdueAmount / overduePayments.length : 0)}
            subtitle="Per payment"
            icon={AccountBalance}
            color="secondary"
            loading={loading}
          />
        </Grid>

        {/* Overdue by Age Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 400 }}>
            <CardHeader 
              title="Overdue by Age" 
              subheader="Distribution of overdue payments by age"
            />
            <CardContent>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <RechartsPieChart>
                    <Pie
                      data={overdueByAge}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overdueByAge.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Overdue Payments */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: 400 }}>
            <CardHeader 
              title="Recent Overdue Payments" 
              subheader="Payments requiring immediate attention"
            />
            <CardContent sx={{ p: 0, height: 320, overflow: 'auto' }}>
              {overduePayments.slice(0, 10).map((payment) => {
                const daysPastDue = Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24));
                
                return (
                  <Box 
                    key={payment._id}
                    sx={{ 
                      p: 2, 
                      borderBottom: 1, 
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {payment.customer?.name || payment.customerName || 'Unknown Customer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {payment.project?.name || 'Unknown Project'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${daysPastDue} days`} 
                        size="small"
                        color={daysPastDue > 60 ? 'error' : daysPastDue > 30 ? 'warning' : 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {formatCurrency(payment.amount || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due: {formatDate(payment.dueDate)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              
              {overduePayments.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="success.main">
                    No Overdue Payments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All payments are up to date!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ============================================================================
// DETAILED PAYMENTS TABLE COMPONENT
// ============================================================================

const DetailedPaymentsTable = ({ paymentData, loading }) => {
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

  const paginatedData = paymentData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Detailed Payment Records" 
        subheader={`${paymentData.length} total payments`}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Project</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Paid Date</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((payment) => (
                <TableRow key={payment._id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {payment._id?.slice(-8) || payment.paymentId || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {payment.customer?.name || payment.customerName || 'Unknown'}
                  </TableCell>
                  <TableCell>{payment.project?.name || 'Unknown'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(payment.amount || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.status || 'Unknown'} 
                      size="small"
                      color={getStatusColor(payment.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {payment.dueDate ? formatDate(payment.dueDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.paymentMethod || 'Unknown'}
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
          count={paymentData.length}
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
// MAIN PAYMENT REPORTS PAGE
// ============================================================================

const PaymentReportsPage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [paymentData, setPaymentData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    period: searchParams.get('period') || '30',
    project: searchParams.get('project') || 'all',
    status: searchParams.get('status') || 'all',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
  });

  const canViewPayments = canAccess && canAccess.payments ? canAccess.payments() : true;

  // Fetch payment data
  const fetchPaymentData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching payment data with filters:', filters);

      let dateRange = generateDateRange(filters.period);
      if (filters.period === 'custom' && filters.dateFrom && filters.dateTo) {
        dateRange = { startDate: filters.dateFrom, endDate: filters.dateTo };
      }

      const queryParams = {
        period: filters.period !== 'custom' ? filters.period : undefined,
        startDate: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
        endDate: dateRange.endDate ? dateRange.endDate.toISOString() : undefined,
        project: filters.project !== 'all' ? filters.project : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      };

      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      // Use the actual payment API endpoints that exist
      const [statsResult, overdueResult, dueTodayResult, projectsResult, , salesResult] = await Promise.allSettled([
        paymentAPI.getPaymentStatistics(queryParams),
        paymentAPI.getOverduePayments(queryParams),
        paymentAPI.getPaymentsDueToday(queryParams),
        projectAPI.getProjects(),
        canAccess && canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
        // Get sales data to get payment plans and link to transactions
        salesAPI.getSales({ limit: 1000, ...queryParams }),
      ]);

      // Combine all payment data from different endpoints
      let allPaymentData = [];
      let paymentStats = {};

      if (statsResult.status === 'fulfilled') {
        const response = statsResult.value.data;
        paymentStats = response.data || {};
        console.log('✅ Payment statistics loaded:', paymentStats);
        setAnalytics(paymentStats);
      }

      if (overdueResult.status === 'fulfilled') {
        const response = overdueResult.value.data;
        const overduePayments = response.data || [];
        
        // Convert overdue installments to payment format
        const overdueAsPayments = Array.isArray(overduePayments) ? overduePayments.map(installment => ({
          _id: installment._id,
          amount: installment.pendingAmount || installment.amount,
          status: 'overdue',
          dueDate: installment.dueDate,
          paymentMethod: 'Unknown',
          customer: installment.customer || { name: 'Unknown Customer' },
          project: installment.project || { name: 'Unknown Project' },
          customerName: installment.customerName,
          notes: `Overdue installment - ${installment.notes || ''}`,
          type: 'installment',
        })) : [];
        
        allPaymentData = [...allPaymentData, ...overdueAsPayments];
        console.log('✅ Overdue payments loaded:', overdueAsPayments.length, 'overdue');
      }

      if (dueTodayResult.status === 'fulfilled') {
        const response = dueTodayResult.value.data;
        const dueTodayPayments = response.data || [];
        
        // Convert due today installments to payment format
        const dueTodayAsPayments = Array.isArray(dueTodayPayments) ? dueTodayPayments.map(installment => ({
          _id: installment._id,
          amount: installment.pendingAmount || installment.amount,
          status: installment.status === 'overdue' ? 'overdue' : 'pending',
          dueDate: installment.dueDate,
          paymentMethod: 'Unknown',
          customer: installment.customer || { name: 'Unknown Customer' },
          project: installment.project || { name: 'Unknown Project' },
          customerName: installment.customerName,
          notes: `Due today - ${installment.notes || ''}`,
          type: 'installment',
        })) : [];
        
        // Avoid duplicates with overdue
        const newDueToday = dueTodayAsPayments.filter(payment => 
          !allPaymentData.some(existing => existing._id === payment._id)
        );
        
        allPaymentData = [...allPaymentData, ...newDueToday];
        console.log('✅ Due today payments loaded:', newDueToday.length, 'due today');
      }

      // Get completed payments from sales data if available
      if (salesResult.status === 'fulfilled') {
        const response = salesResult.value.data;
        const salesData = response.data || [];
        
        // Create payment records from completed sales
        const salesAsPayments = Array.isArray(salesData) ? salesData
          .filter(sale => sale.salePrice && sale.status === 'Completed')
          .map(sale => ({
            _id: `sale_${sale._id}`,
            amount: sale.salePrice,
            status: 'completed',
            dueDate: sale.bookingDate,
            paidDate: sale.bookingDate,
            paymentMethod: 'Unknown',
            customer: sale.lead || { name: 'Unknown Customer' },
            project: sale.project || { name: 'Unknown Project' },
            customerName: sale.lead?.firstName && sale.lead?.lastName 
              ? `${sale.lead.firstName} ${sale.lead.lastName}` 
              : sale.lead?.email || 'Unknown',
            notes: `Payment from completed sale`,
            type: 'sale_payment',
          })) : [];
        
        allPaymentData = [...allPaymentData, ...salesAsPayments];
        console.log('✅ Sale payments loaded:', salesAsPayments.length, 'from sales');
      }

      // Apply filters to the combined data
      if (filters.project !== 'all') {
        allPaymentData = allPaymentData.filter(payment => 
          payment.project?._id === filters.project || payment.project === filters.project
        );
      }

      if (filters.status !== 'all') {
        allPaymentData = allPaymentData.filter(payment => 
          payment.status === filters.status
        );
      }

      // Apply date range filter
      if (dateRange.startDate && dateRange.endDate) {
        allPaymentData = allPaymentData.filter(payment => {
          const paymentDate = new Date(payment.dueDate || payment.paidDate || payment.createdAt);
          return paymentDate >= dateRange.startDate && paymentDate <= dateRange.endDate;
        });
      }

      console.log('✅ Total payment data processed:', allPaymentData.length, 'payments');
      setPaymentData(allPaymentData);

      if (projectsResult.status === 'fulfilled') {
        const response = projectsResult.value.data;
        const projectsData = response.data || response || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching payment data:', error);
      setError('Failed to load payment data. Please try again.');
      setLoading(false);
      setPaymentData([]);
      setAnalytics({});
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters, canAccess]);

  useEffect(() => {
    if (canViewPayments) {
      fetchPaymentData();
    }
  }, [fetchPaymentData, canViewPayments]);

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
        await exportToPDF(paymentData, filters);
        break;
      case 'excel':
        exportToExcel(paymentData, analytics, filters);
        break;
      case 'csv':
        exportToCSV(paymentData, filters);
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
      status: 'all',
      dateFrom: null,
      dateTo: null,
    });
  };

  const refreshData = () => {
    fetchPaymentData(true);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );

  if (!canViewPayments) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view payment reports.
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
              <Payment fontSize="small" />
              Payment Reports
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Payment Reports
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Comprehensive payment analytics and collection management
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

        <Box sx={{ px: 3 }} id="payment-report-content">
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
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={handleFilterChange('status')}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
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
                <PaymentOverview 
                  paymentData={paymentData}
                  analytics={analytics}
                  loading={loading}
                  period={filters.period}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <PerformanceAnalytics 
                  paymentData={paymentData}
                  projects={projects}
                  loading={loading}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <OverdueManagement 
                  paymentData={paymentData}
                  loading={loading}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <DetailedPaymentsTable 
                  paymentData={paymentData}
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

export default PaymentReportsPage;
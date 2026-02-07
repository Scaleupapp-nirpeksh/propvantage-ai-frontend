// File: src/pages/dashboard/BusinessHeadDashboard.js
// Description: Business Head Dashboard - Responsive, mobile-friendly layout
// Version: 3.0 - Full responsive redesign
// Location: src/pages/dashboard/BusinessHeadDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Skeleton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Business,
  AttachMoney,
  Refresh,
  Visibility,
  Add,
  Timeline,
  Analytics,
  ArrowUpward,
  ArrowDownward,
  LocationOn,
  Construction,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, predictiveAPI } from '../../services/api';

// ─── Utility ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

// ─── KPI Metric Card ─────────────────────────────────────────────────────────
const ExecutiveMetricCard = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  icon: Icon,
  color = 'primary',
  onClick,
  isLoading = false,
  animate = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getTrendColor = () => {
    if (trendDirection === 'up') return theme.palette.success.main;
    if (trendDirection === 'down') return theme.palette.error.main;
    return theme.palette.warning.main;
  };
  const TrendIcon = trendDirection === 'up' ? ArrowUpward : ArrowDownward;

  return (
    <Zoom in={animate} timeout={300}>
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': onClick
            ? { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
            : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: `${color}.100`,
                color: `${color}.700`,
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
              }}
            >
              {isLoading ? <CircularProgress size={20} /> : <Icon sx={{ fontSize: isMobile ? 20 : 24 }} />}
            </Avatar>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendIcon sx={{ fontSize: 14, color: getTrendColor() }} />
                <Typography variant="caption" sx={{ color: getTrendColor(), fontWeight: 600 }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2, wordBreak: 'break-word' }}
          >
            {isLoading ? <Skeleton width={80} /> : value}
          </Typography>

          <Typography variant="body2" color="text.secondary" noWrap>
            {isLoading ? <Skeleton width={120} /> : title}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            {isLoading ? <Skeleton width={100} /> : subtitle}
          </Typography>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// ─── Project Status Pie Chart ────────────────────────────────────────────────
const ProjectStatusChart = ({ projects, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Project Status
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(0),
  }));

  const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Project Status
        </Typography>

        <Box sx={{ width: '100%', minHeight: isMobile ? 200 : 240 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 35 : 45}
                outerRadius={isMobile ? 65 : 80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value, name) => [`${value} project${value !== 1 ? 's' : ''}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Legend as chips below chart — avoids overflow */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
          {chartData.map((entry, index) => (
            <Chip
              key={entry.name}
              size="small"
              label={`${entry.name} (${entry.value})`}
              sx={{
                bgcolor: COLORS[index % COLORS.length],
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Project Portfolio Table ─────────────────────────────────────────────────
const ProjectPerformanceTable = ({ projects, isLoading, navigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Project Portfolio
          </Typography>
          <Box>
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} height={56} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'planning':
        return 'warning';
      case 'completed':
        return 'info';
      case 'on-hold':
        return 'error';
      default:
        return 'default';
    }
  };

  // Mobile: card list, Desktop: table
  if (isMobile) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Project Portfolio
            </Typography>
            <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => navigate('/projects/create')}>
              New
            </Button>
          </Box>

          <Stack spacing={1.5}>
            {projects.map((project) => (
              <Card
                key={project._id}
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ fontSize: 12 }} />
                        {project.location?.city || 'N/A'}
                      </Typography>
                    </Box>
                    <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {formatCurrency(project.targetRevenue)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Units
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatNumber(project.totalUnits)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body2">{project.type}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Project Portfolio
          </Typography>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => navigate('/projects/create')}>
            New Project
          </Button>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }} align="right">Units</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }} align="right">Target Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={project.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
                      <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2">{project.location?.city || 'N/A'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatNumber(project.totalUnits)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="success.main" noWrap>
                      {formatCurrency(project.targetRevenue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => navigate(`/projects/${project._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
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

// ─── Revenue Analytics Card ──────────────────────────────────────────────────
const RevenueAnalyticsCard = ({ projects, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Revenue by Type
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const revenueByType = projects.reduce((acc, project) => {
    const type = project.type || 'Unknown';
    if (!acc[type]) acc[type] = { type, revenue: 0, projects: 0 };
    acc[type].revenue += project.targetRevenue || 0;
    acc[type].projects += 1;
    return acc;
  }, {});

  const chartData = Object.values(revenueByType);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Revenue by Project Type
        </Typography>

        <Box sx={{ width: '100%', minHeight: isMobile ? 200 : 250 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: isMobile ? 40 : 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="type"
                angle={isMobile ? -30 : -20}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: isMobile ? 10 : 12 }} width={60} />
              <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Bar dataKey="revenue" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={0.5}>
          {chartData.map((item) => (
            <Box key={item.type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {item.type}
              </Typography>
              <Box sx={{ textAlign: 'right', ml: 1, flexShrink: 0 }}>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(item.revenue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.projects} project{item.projects !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─── Forecast Summary Widget ─────────────────────────────────────────────────
const ForecastSummaryWidget = ({ navigate, isLoading: parentLoading }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await predictiveAPI.getSalesForecast({ period: '3_months' });
        setForecast(response.data?.data || response.data || null);
      } catch (err) {
        console.error('Forecast widget error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!parentLoading) fetchForecast();
  }, [parentLoading]);

  const isWidgetLoading = loading || parentLoading;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Sales Forecast
          </Typography>
          <Chip label="AI" size="small" color="secondary" variant="outlined" />
        </Box>

        {isWidgetLoading ? (
          <Box>
            <Skeleton height={36} />
            <Skeleton height={36} />
            <Skeleton height={36} />
          </Box>
        ) : !forecast ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
            No forecast data yet.
          </Alert>
        ) : (
          <Box>
            {forecast.forecast && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Forecasted Sales (3 months)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.3 }}>
                  {forecast.forecast.totalForecastedSales || 0} units
                </Typography>
                {forecast.forecast.averageMonthlySales && (
                  <Typography variant="caption" color="text.secondary">
                    Avg {forecast.forecast.averageMonthlySales.toFixed(1)} units/month
                  </Typography>
                )}
              </Box>
            )}

            {forecast.scenarios && (
              <Grid container spacing={1} sx={{ mb: 1.5 }}>
                {['optimistic', 'realistic', 'pessimistic'].map((scenario) => {
                  const data = forecast.scenarios[scenario];
                  if (!data) return null;
                  const colors = {
                    optimistic: 'success.main',
                    realistic: 'primary.main',
                    pessimistic: 'warning.main',
                  };
                  return (
                    <Grid item xs={4} key={scenario}>
                      <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                          {scenario}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={colors[scenario]}>
                          {data.totalSales || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          {data.probability || 0}%
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {forecast.forecast?.monthlyBreakdown && forecast.forecast.monthlyBreakdown.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Monthly Breakdown
                </Typography>
                {forecast.forecast.monthlyBreakdown.slice(0, 3).map((month, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" noWrap>
                      {month.month}
                    </Typography>
                    <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {month.aiAdjustedSales || month.forecastedSales || 0} units
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {((month.confidence || 0) * 100).toFixed(0)}% conf.
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Button variant="text" size="small" fullWidth sx={{ mt: 1.5 }} onClick={() => navigate('/analytics/predictions')}>
          View Full Predictions
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const BusinessHeadDashboard = () => {
  const { user, getOrganizationDisplayName } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [dashboardData, setDashboardData] = useState({
    kpis: { totalRevenue: 0, totalProjects: 0, totalUnits: 0, avgProjectValue: 0 },
    projects: [],
  });
  const [loading, setLoading] = useState({ kpis: true, projects: true });
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const projectsResult = await projectAPI.getProjects();
      const projects = projectsResult.data.data || projectsResult.data || [];

      const totalRevenue = projects.reduce((sum, p) => sum + (p.targetRevenue || 0), 0);
      const totalUnits = projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
      const avgProjectValue = projects.length > 0 ? totalRevenue / projects.length : 0;

      setDashboardData({
        kpis: { totalRevenue, totalProjects: projects.length, totalUnits, avgProjectValue },
        projects,
      });
      setLoading({ kpis: false, projects: false });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing.');
      setLoading({ kpis: false, projects: false });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => fetchDashboardData(true);

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <Fade in timeout={500}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700 }}>
                Executive Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {user?.firstName}! Overview for {getOrganizationDisplayName()}.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={refreshing} size={isMobile ? 'small' : 'medium'}>
                  <Refresh
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<Analytics />}
                onClick={() => navigate('/analytics')}
              >
                {isMobile ? 'Analytics' : 'View Analytics'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* ─── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <Fade in>
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Total Revenue Target"
            value={formatCurrency(dashboardData.kpis.totalRevenue)}
            subtitle="Across all projects"
            icon={AttachMoney}
            color="success"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/revenue')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Active Projects"
            value={dashboardData.kpis.totalProjects}
            subtitle="In pipeline"
            icon={Business}
            color="primary"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Total Units"
            value={formatNumber(dashboardData.kpis.totalUnits)}
            subtitle="Across all projects"
            icon={Construction}
            color="info"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Avg Project Value"
            value={formatCurrency(dashboardData.kpis.avgProjectValue)}
            subtitle="Revenue per project"
            icon={Timeline}
            color="warning"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/projects')}
          />
        </Grid>
      </Grid>

      {/* ─── Project Table + Status Chart ───────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} lg={8}>
          <ProjectPerformanceTable projects={dashboardData.projects} isLoading={loading.projects} navigate={navigate} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ProjectStatusChart projects={dashboardData.projects} isLoading={loading.projects} />
        </Grid>
      </Grid>

      {/* ─── Revenue Analytics + Forecast ───────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        <Grid item xs={12} md={7} lg={8}>
          <RevenueAnalyticsCard projects={dashboardData.projects} isLoading={loading.projects} />
        </Grid>
        <Grid item xs={12} md={5} lg={4}>
          <ForecastSummaryWidget navigate={navigate} isLoading={loading.kpis} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHeadDashboard;

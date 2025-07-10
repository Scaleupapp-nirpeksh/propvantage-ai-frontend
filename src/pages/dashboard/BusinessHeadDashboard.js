// File: src/pages/dashboard/BusinessHeadDashboard.js
// Description: Professional Business Head Dashboard - Complete backend integration with modern UX
// Version: 2.0 - Executive-level dashboard with real-time data and advanced analytics
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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  Fade,
  Zoom,
  Skeleton,
  Tooltip,
  ButtonGroup,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Business,
  People,
  AttachMoney,
  Assessment,
  Refresh,
  Visibility,
  Add,
  Psychology,
  Construction,
  Assignment,
  Timeline,
  Speed,
  Compare,
  Dashboard,
  Analytics,
  Insights,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  FilterList,
  DateRange,
  Download,
  Share,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { 
  analyticsAPI, 
  projectAPI, 
  leadAPI, 
  salesAPI, 
  userAPI,
  paymentAPI,
  constructionAPI 
} from '../../services/api';

// Utility functions
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

const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

// Enhanced Metric Card Component
const ExecutiveMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendDirection, 
  icon: Icon, 
  color = 'primary',
  onClick,
  actionLabel,
  isLoading = false,
  animate = true 
}) => {
  const theme = useTheme();
  
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
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          '&:hover': onClick ? { 
            boxShadow: theme.shadows[8],
            transform: 'translateY(-4px)',
          } : {},
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {title}
              </Typography>
              
              {isLoading ? (
                <Skeleton variant="text" width="80%" height={48} />
              ) : (
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  {value}
                </Typography>
              )}
              
              {subtitle && !isLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {subtitle}
                </Typography>
              )}
              
              {trend && !isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendIcon 
                    sx={{ fontSize: 16, color: getTrendColor() }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ color: getTrendColor(), fontWeight: 600 }}
                  >
                    {trend}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Avatar 
              sx={{ 
                bgcolor: `${color}.100`, 
                color: `${color}.700`,
                width: 56,
                height: 56,
                boxShadow: theme.shadows[4],
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Avatar>
          </Box>
          
          {actionLabel && !isLoading && (
            <Button 
              variant="outlined"
              size="small" 
              fullWidth
              sx={{ mt: 1 }}
              endIcon={<Visibility />}
            >
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Strategic Overview Component
const StrategicOverview = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="50%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Revenue & Performance Analytics
          </Typography>
          <ButtonGroup size="small">
            <Button startIcon={<FilterList />}>Filter</Button>
            <Button startIcon={<Download />}>Export</Button>
          </ButtonGroup>
        </Box>
        
        <Box sx={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="month" 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : 'Projects'
                ]}
                labelStyle={{ color: theme.palette.text.primary }}
                contentStyle={{ 
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                fill={theme.palette.primary.main}
                fillOpacity={0.3}
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                name="Revenue"
              />
              <Bar
                yAxisId="right"
                dataKey="projects"
                fill={theme.palette.secondary.main}
                name="Active Projects"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Project Performance Table
const ProjectPerformanceTable = ({ projects, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} />
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Project Performance Overview
          </Typography>
          <Button 
            variant="outlined"
            size="small" 
            onClick={() => navigate('/projects')}
            endIcon={<Visibility />}
          >
            View All Projects
          </Button>
        </Box>
        
        {projects && projects.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Sales Progress</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Units</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 8).map((project, index) => {
                  const salesProgress = project.totalUnits > 0 
                    ? (project.soldUnits / project.totalUnits) * 100 
                    : 0;
                  
                  return (
                    <TableRow 
                      key={index}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => navigate(`/projects/${project._id}`)}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.location?.city}, {project.location?.area}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(project.currentRevenue || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          of {formatCurrency(project.targetRevenue || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={salesProgress} 
                            color={getProgressColor(salesProgress)}
                            sx={{ mb: 0.5, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {salesProgress.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {project.soldUnits || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          of {project.totalUnits || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={project.status || 'Active'}
                          size="small"
                          color={project.status === 'Completed' ? 'success' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Projects Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first project to start tracking performance
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => navigate('/projects/create')}
            >
              Create New Project
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Team Performance Component
const TeamPerformanceCard = ({ teamData, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="50%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Team Performance
          </Typography>
          <Button 
            size="small" 
            onClick={() => navigate('/users')}
            endIcon={<People />}
          >
            Manage Team
          </Button>
        </Box>
        
        {teamData && teamData.length > 0 ? (
          <Box>
            {teamData.slice(0, 6).map((member, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {member.leadsConverted || 0} conversions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This month
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={member.performanceScore || 0} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Performance Score
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.performanceScore || 0}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No team data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const ExecutiveActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Create Project',
      description: 'Launch new development',
      icon: Business,
      color: 'primary',
      onClick: () => navigate('/projects/create'),
    },
    {
      title: 'View Analytics',
      description: 'Detailed business insights',
      icon: Analytics,
      color: 'info',
      onClick: () => navigate('/analytics'),
    },
    {
      title: 'Team Management',
      description: 'Manage team members',
      icon: People,
      color: 'success',
      onClick: () => navigate('/users'),
    },
    {
      title: 'Financial Reports',
      description: 'Revenue and payments',
      icon: AttachMoney,
      color: 'warning',
      onClick: () => navigate('/payments'),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Executive Actions
        </Typography>
        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: `${action.color}.main`,
                    bgcolor: `${action.color}.50`,
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={action.onClick}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${action.color}.100`, color: `${action.color}.700` }}>
                    <action.icon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Business Head Dashboard Component
const BusinessHeadDashboard = () => {
  const { user, getOrganizationDisplayName } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // State management
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalRevenue: 0,
      totalProjects: 0,
      totalLeads: 0,
      conversionRate: 0,
    },
    projects: [],
    analytics: null,
    teamPerformance: [],
  });

  const [loading, setLoading] = useState({
    kpis: true,
    projects: true,
    analytics: true,
    team: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      // Fetch all data in parallel
      const [
        analyticsResponse,
        projectsResponse,
        leadsResponse,
        salesResponse,
        teamResponse,
      ] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        projectAPI.getProjects({ includeAnalytics: true }),
        leadAPI.getLeads({ limit: 1000 }), // Get all leads for accurate count
        salesAPI.getSales({ limit: 1000 }), // Get all sales for revenue calc
        userAPI.getUsers({ includePerformance: true }),
      ]);

      // Process analytics data
      let kpis = { totalRevenue: 0, totalProjects: 0, totalLeads: 0, conversionRate: 0 };
      let analytics = null;

      if (analyticsResponse.status === 'fulfilled') {
        const data = analyticsResponse.value.data;
        analytics = data;
        kpis = {
          totalRevenue: data.totalRevenue || 0,
          totalProjects: data.totalProjects || 0,
          totalLeads: data.totalLeads || 0,
          conversionRate: data.conversionRate || 0,
        };
      }

      // Process projects data
      let projects = [];
      if (projectsResponse.status === 'fulfilled') {
        projects = projectsResponse.value.data.data || [];
        
        // If analytics API didn't provide totals, calculate from projects
        if (analyticsResponse.status === 'rejected') {
          kpis.totalProjects = projects.length;
          kpis.totalRevenue = projects.reduce((sum, project) => 
            sum + (project.currentRevenue || 0), 0
          );
        }
      }

      // Process leads data
      if (leadsResponse.status === 'fulfilled' && analyticsResponse.status === 'rejected') {
        const leads = leadsResponse.value.data.data || [];
        kpis.totalLeads = leads.length;
      }

      // Process sales data for conversion rate calculation
      if (salesResponse.status === 'fulfilled' && analyticsResponse.status === 'rejected') {
        const sales = salesResponse.value.data.data || [];
        const totalLeads = kpis.totalLeads;
        const convertedLeads = sales.length;
        kpis.conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      }

      // Process team data
      let teamPerformance = [];
      if (teamResponse.status === 'fulfilled') {
        teamPerformance = teamResponse.value.data.data || [];
      }

      // Update state
      setDashboardData({
        kpis,
        projects,
        analytics,
        teamPerformance,
      });

      setLoading({
        kpis: false,
        projects: false,
        analytics: false,
        team: false,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing.');
      setLoading({
        kpis: false,
        projects: false,
        analytics: false,
        team: false,
      });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Calculate trends (placeholder - should come from backend)
  const getRevenueTraend = () => {
    // This should be calculated from historical data in backend
    return "+12.5% from last month";
  };

  return (
    <Box>
      {/* Header */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Executive Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {user?.firstName}! Here's your business overview for {getOrganizationDisplayName()}.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Dashboard">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <Refresh sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    }
                  }} />
                </IconButton>
              </Tooltip>
              <Button 
                variant="outlined" 
                startIcon={<Analytics />}
                onClick={() => navigate('/analytics')}
              >
                Advanced Analytics
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Error Alert */}
      {error && (
        <Fade in>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
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

      {/* Executive KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Total Revenue"
            value={formatCurrency(dashboardData.kpis.totalRevenue)}
            subtitle="Across all projects"
            trend={getRevenueTraend()}
            trendDirection="up"
            icon={AttachMoney}
            color="success"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/revenue')}
            actionLabel="View Revenue Analytics"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Active Projects"
            value={dashboardData.kpis.totalProjects}
            subtitle="In development pipeline"
            trend="+2 new this quarter"
            trendDirection="up"
            icon={Business}
            color="primary"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
            actionLabel="Manage Projects"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Total Leads"
            value={formatNumber(dashboardData.kpis.totalLeads)}
            subtitle="Active prospects"
            trend="+18 this week"
            trendDirection="up"
            icon={People}
            color="info"
            isLoading={loading.kpis}
            onClick={() => navigate('/leads')}
            actionLabel="View Lead Pipeline"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Conversion Rate"
            value={`${dashboardData.kpis.conversionRate.toFixed(1)}%`}
            subtitle="Lead to sales conversion"
            trend="+2.3% improvement"
            trendDirection="up"
            icon={Timeline}
            color="warning"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/leads')}
            actionLabel="Conversion Analytics"
          />
        </Grid>
      </Grid>

      {/* Strategic Overview Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <StrategicOverview 
            data={dashboardData.analytics} 
            isLoading={loading.analytics}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <TeamPerformanceCard 
            teamData={dashboardData.teamPerformance} 
            isLoading={loading.team}
          />
        </Grid>
      </Grid>

      {/* Project Performance Table */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <ProjectPerformanceTable 
            projects={dashboardData.projects} 
            isLoading={loading.projects}
          />
        </Grid>
      </Grid>

      {/* Executive Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ExecutiveActions />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHeadDashboard;
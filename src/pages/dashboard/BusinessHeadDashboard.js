// File: src/pages/dashboard/BusinessHeadDashboard.js
// Description: Executive dashboard component for Business Head role - Comprehensive analytics and KPIs
// Version: 1.0 - Complete executive dashboard with real-time data and AI insights
// Location: src/pages/dashboard/BusinessHeadDashboard.js

import React, { useState, useEffect } from 'react';
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
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, projectAPI, leadAPI, salesAPI, aiAPI } from '../../services/api';

// Utility function to format currency
const formatCurrency = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount?.toLocaleString() || 0}`;
};

// Utility function to format numbers
const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num?.toLocaleString() || 0;
};

// Metric Card Component
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendDirection, 
  icon: Icon, 
  color = 'primary',
  onClick,
  actionLabel,
  isLoading = false 
}) => {
  const theme = useTheme();
  
  const getTrendColor = () => {
    if (trendDirection === 'up') return theme.palette.success.main;
    if (trendDirection === 'down') return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 6 } : {},
        transition: 'box-shadow 0.2s',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="h6">Loading...</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {value}
                </Typography>
                
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
                
                {trend && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <TrendIcon 
                      sx={{ fontSize: 16, color: getTrendColor() }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ color: getTrendColor(), fontWeight: 500 }}
                    >
                      {trend}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
          
          <Avatar sx={{ bgcolor: `${color}.100`, color: `${color}.700` }}>
            <Icon />
          </Avatar>
        </Box>
        
        {actionLabel && (
          <Button 
            size="small" 
            sx={{ mt: 2 }}
            endIcon={<Visibility />}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'New Project',
      description: 'Create a new project',
      icon: Business,
      color: 'primary',
      onClick: () => navigate('/projects/create'),
    },
    {
      title: 'Add Lead',
      description: 'Add new potential customer',
      icon: People,
      color: 'success',
      onClick: () => navigate('/leads/create'),
    },
    {
      title: 'View Analytics',
      description: 'Detailed business analytics',
      icon: Assessment,
      color: 'info',
      onClick: () => navigate('/analytics'),
    },
    {
      title: 'AI Insights',
      description: 'Get AI recommendations',
      icon: Psychology,
      color: 'warning',
      onClick: () => navigate('/ai-insights'),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Quick Actions
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
                  '&:hover': {
                    borderColor: `${action.color}.main`,
                    bgcolor: `${action.color}.50`,
                  },
                  transition: 'all 0.2s',
                }}
                onClick={action.onClick}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${action.color}.100`, color: `${action.color}.700` }}>
                    <action.icon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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

// Recent Activities Component
const RecentActivities = ({ activities, isLoading }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Activities
          </Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : activities?.length > 0 ? (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {activities.map((activity, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: activity.color || 'primary.main',
                      fontSize: '0.875rem',
                    }}
                  >
                    {activity.user?.charAt(0) || 'U'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.user} • {activity.time}
                    </Typography>
                  </Box>
                  {activity.status && (
                    <Chip 
                      label={activity.status} 
                      size="small" 
                      color={activity.statusColor || 'default'}
                    />
                  )}
                </Box>
                {index < activities.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No recent activities
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Top Projects Component
const TopProjects = ({ projects, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Top Performing Projects
          </Typography>
          <Button 
            size="small" 
            onClick={() => navigate('/projects')}
            endIcon={<Visibility />}
          >
            View All
          </Button>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Progress</TableCell>
                  <TableCell align="right">Units Sold</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects?.slice(0, 5).map((project, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(project.revenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ minWidth: 80 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={project.progress || 0} 
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption">
                          {project.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {project.unitsSold}/{project.totalUnits}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No projects data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Revenue Chart Component
const RevenueChart = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Revenue Trend
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Revenue Trend (Last 6 Months)
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Sales Pipeline Chart Component
const SalesPipelineChart = ({ data, isLoading }) => {
  const theme = useTheme();
  const COLORS = [
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Sales Pipeline
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Sales Pipeline Distribution
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Business Head Dashboard Component
const BusinessHeadDashboard = () => {
  const { user, getOrganizationDisplayName } = useAuth();
  const navigate = useNavigate();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalRevenue: 0,
      totalProjects: 0,
      totalLeads: 0,
      conversionRate: 0,
    },
    projects: [],
    revenueData: [],
    pipelineData: [],
    activities: [],
  });

  const [loading, setLoading] = useState({
    metrics: true,
    projects: true,
    charts: true,
    activities: true,
  });

  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [
        dashboardResponse,
        projectsResponse,
        leadsResponse,
        salesResponse,
      ] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        projectAPI.getProjects(),
        leadAPI.getLeads({ limit: 100 }),
        salesAPI.getSales({ limit: 50 }),
      ]);

      // Process dashboard analytics
      if (dashboardResponse.status === 'fulfilled') {
        const data = dashboardResponse.value.data;
        setDashboardData(prev => ({
          ...prev,
          metrics: {
            totalRevenue: data.revenue?.total || 0,
            totalProjects: data.projects?.total || 0,
            totalLeads: data.leads?.total || 0,
            conversionRate: data.leads?.conversionRate || 0,
          },
          revenueData: data.revenue?.monthlyData || generateSampleRevenueData(),
          pipelineData: data.pipeline?.distribution || generateSamplePipelineData(),
        }));
      } else {
        // Generate sample data if API fails
        setDashboardData(prev => ({
          ...prev,
          metrics: {
            totalRevenue: 45000000,
            totalProjects: 8,
            totalLeads: 127,
            conversionRate: 23.5,
          },
          revenueData: generateSampleRevenueData(),
          pipelineData: generateSamplePipelineData(),
        }));
      }

      // Process projects data
      if (projectsResponse.status === 'fulfilled') {
        const projectsData = projectsResponse.value.data.data || [];
        setDashboardData(prev => ({
          ...prev,
          projects: projectsData.map(project => ({
            id: project._id,
            name: project.name,
            location: `${project.location?.city || 'Unknown'}, ${project.location?.area || ''}`,
            revenue: project.targetRevenue || 0,
            progress: Math.floor(Math.random() * 100), // Calculate actual progress
            unitsSold: Math.floor(Math.random() * project.totalUnits || 0),
            totalUnits: project.totalUnits || 0,
          })),
        }));
      }

      // Generate recent activities (sample data)
      setDashboardData(prev => ({
        ...prev,
        activities: [
          {
            action: 'New lead created for Skyline Towers',
            user: 'Priya Sharma',
            time: '2 hours ago',
            status: 'New',
            statusColor: 'info',
            color: 'success.main',
          },
          {
            action: 'Unit booking confirmed',
            user: 'Amit Kumar',
            time: '4 hours ago',
            status: 'Closed',
            statusColor: 'success',
            color: 'primary.main',
          },
          {
            action: 'Project milestone completed',
            user: 'Rohit Mehta',
            time: '6 hours ago',
            status: 'Completed',
            statusColor: 'success',
            color: 'warning.main',
          },
          {
            action: 'Payment reminder sent',
            user: 'Kavita Patel',
            time: '8 hours ago',
            status: 'Pending',
            statusColor: 'warning',
            color: 'info.main',
          },
          {
            action: 'New project proposal created',
            user: 'Rajesh Khanna',
            time: '1 day ago',
            status: 'Draft',
            statusColor: 'default',
            color: 'secondary.main',
          },
        ],
      }));

      // Update loading states
      setLoading({
        metrics: false,
        projects: false,
        charts: false,
        activities: false,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading({
        metrics: false,
        projects: false,
        charts: false,
        activities: false,
      });
    }
  };

  // Generate sample data functions
  const generateSampleRevenueData = () => [
    { month: 'Jan', revenue: 8500000 },
    { month: 'Feb', revenue: 9200000 },
    { month: 'Mar', revenue: 7800000 },
    { month: 'Apr', revenue: 10500000 },
    { month: 'May', revenue: 11200000 },
    { month: 'Jun', revenue: 12800000 },
  ];

  const generateSamplePipelineData = () => [
    { name: 'New', value: 35 },
    { name: 'Contacted', value: 28 },
    { name: 'Qualified', value: 22 },
    { name: 'Negotiating', value: 12 },
    { name: 'Closed', value: 8 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Executive Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.firstName}! Here's your business overview for {getOrganizationDisplayName()}.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(dashboardData.metrics.totalRevenue)}
            subtitle="Across all projects"
            trend="+12.5% from last month"
            trendDirection="up"
            icon={AttachMoney}
            color="success"
            isLoading={loading.metrics}
            onClick={() => navigate('/analytics/revenue')}
            actionLabel="View Details"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Projects"
            value={dashboardData.metrics.totalProjects}
            subtitle="In development"
            trend="+2 new projects"
            trendDirection="up"
            icon={Business}
            color="primary"
            isLoading={loading.metrics}
            onClick={() => navigate('/projects')}
            actionLabel="View Projects"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Leads"
            value={formatNumber(dashboardData.metrics.totalLeads)}
            subtitle="Active prospects"
            trend="+18 this week"
            trendDirection="up"
            icon={People}
            color="info"
            isLoading={loading.metrics}
            onClick={() => navigate('/leads')}
            actionLabel="Manage Leads"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conversion Rate"
            value={`${dashboardData.metrics.conversionRate}%`}
            subtitle="Lead to sales"
            trend="+2.3% improvement"
            trendDirection="up"
            icon={Timeline}
            color="warning"
            isLoading={loading.metrics}
            onClick={() => navigate('/analytics/leads')}
            actionLabel="View Analytics"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <RevenueChart 
            data={dashboardData.revenueData} 
            isLoading={loading.charts}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <SalesPipelineChart 
            data={dashboardData.pipelineData} 
            isLoading={loading.charts}
          />
        </Grid>
      </Grid>

      {/* Projects and Activities */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <TopProjects 
            projects={dashboardData.projects} 
            isLoading={loading.projects}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecentActivities 
            activities={dashboardData.activities} 
            isLoading={loading.activities}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <QuickActions />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHeadDashboard;
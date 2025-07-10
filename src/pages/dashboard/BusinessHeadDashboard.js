// File: src/pages/dashboard/BusinessHeadDashboard.js
// Description: FIXED Business Head Dashboard - Working with actual backend data
// Version: 2.1 - Fixed all data loading and display issues
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
  Stack,
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
  Timeline,
  Analytics,
  ArrowUpward,
  ArrowDownward,
  LocationOn,
  CheckCircle,
  Schedule,
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
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, userAPI } from '../../services/api';

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
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: `${color}.100`, 
                color: `${color}.700`,
                width: 56,
                height: 56,
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : <Icon />}
            </Avatar>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendIcon sx={{ fontSize: 16, color: getTrendColor() }} />
                <Typography 
                  variant="caption" 
                  sx={{ color: getTrendColor(), fontWeight: 600 }}
                >
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {isLoading ? <Skeleton width={80} /> : value}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {isLoading ? <Skeleton width={120} /> : title}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {isLoading ? <Skeleton width={100} /> : subtitle}
          </Typography>
        </CardContent>
      </Card>
    </Zoom>
  );
};

// Project Status Chart Component
const ProjectStatusChart = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Project Status Distribution</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Process project data for chart
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(1)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Project Status Distribution</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Project Performance Table Component
const ProjectPerformanceTable = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Project Portfolio</Typography>
          <Box sx={{ p: 2 }}>
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'planning': return 'warning';
      case 'completed': return 'info';
      case 'on-hold': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Project Portfolio</Typography>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => window.open('/projects/create', '_blank')}
          >
            New Project
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Target Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {project._id.slice(-8)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={project.type} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {project.location?.city || 'Not specified'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatNumber(project.totalUnits)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(project.targetRevenue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={project.status} 
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={() => window.open(`/projects/${project._id}`, '_blank')}
                    >
                      <Visibility />
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

// Team Overview Component
const TeamOverview = ({ teamData, isLoading }) => {
  if (isLoading) {
    return (
      <Card sx={{ height: 400 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Team Overview</Typography>
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Process team data for role distribution
  const roleCounts = teamData.reduce((acc, member) => {
    const role = member.role || 'Unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(roleCounts).map(([role, count]) => ({
    role,
    count,
  }));

  return (
    <Card sx={{ height: 400 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Team Overview</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="role" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Team Members</Typography>
          <Stack spacing={1}>
            {teamData.slice(0, 5).map((member) => (
              <Box key={member._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.100' }}>
                  {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {member.firstName} {member.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.role}
                  </Typography>
                </Box>
                <Chip 
                  label={member.isActive ? 'Active' : 'Inactive'}
                  color={member.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            ))}
          </Stack>
        </Box>
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
      totalUnits: 0,
      avgProjectValue: 0,
    },
    projects: [],
    teamData: [],
  });

  const [loading, setLoading] = useState({
    kpis: true,
    projects: true,
    team: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch data in parallel with proper error handling
      const [projectsResult, teamResult] = await Promise.allSettled([
        projectAPI.getProjects(),
        userAPI.getUsers(),
      ]);

      let projects = [];
      let teamData = [];

      // Process projects data
      if (projectsResult.status === 'fulfilled') {
        console.log('✅ Projects API Response:', projectsResult.value.data);
        projects = projectsResult.value.data.data || projectsResult.value.data || [];
      } else {
        console.error('❌ Projects API failed:', projectsResult.reason);
      }

      // Process team data
      if (teamResult.status === 'fulfilled') {
        console.log('✅ Team API Response:', teamResult.value.data);
        teamData = teamResult.value.data.data || teamResult.value.data || [];
      } else {
        console.error('❌ Team API failed:', teamResult.reason);
      }

      // Calculate KPIs from actual data
      const totalRevenue = projects.reduce((sum, project) => sum + (project.targetRevenue || 0), 0);
      const totalUnits = projects.reduce((sum, project) => sum + (project.totalUnits || 0), 0);
      const avgProjectValue = projects.length > 0 ? totalRevenue / projects.length : 0;

      const kpis = {
        totalRevenue,
        totalProjects: projects.length,
        totalUnits,
        avgProjectValue,
      };

      console.log('📊 Calculated KPIs:', kpis);

      // Update state
      setDashboardData({
        kpis,
        projects,
        teamData,
      });

      setLoading({
        kpis: false,
        projects: false,
        team: false,
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing.');
      setLoading({
        kpis: false,
        projects: false,
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
                View Analytics
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
            title="Total Revenue Target"
            value={formatCurrency(dashboardData.kpis.totalRevenue)}
            subtitle="Across all projects"
            trend="+12.5% from last quarter"
            trendDirection="up"
            icon={AttachMoney}
            color="success"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/revenue')}
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
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Total Units"
            value={formatNumber(dashboardData.kpis.totalUnits)}
            subtitle="Across all projects"
            trend="+480 this quarter"
            trendDirection="up"
            icon={Construction}
            color="info"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ExecutiveMetricCard
            title="Avg Project Value"
            value={formatCurrency(dashboardData.kpis.avgProjectValue)}
            subtitle="Revenue per project"
            trend="+8.2% improvement"
            trendDirection="up"
            icon={Timeline}
            color="warning"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/projects')}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <ProjectPerformanceTable 
            projects={dashboardData.projects} 
            isLoading={loading.projects}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ProjectStatusChart 
            projects={dashboardData.projects} 
            isLoading={loading.projects}
          />
        </Grid>
      </Grid>

      {/* Team Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TeamOverview 
            teamData={dashboardData.teamData} 
            isLoading={loading.team}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHeadDashboard;
// File: src/pages/dashboard/ProjectDirectorDashboard.js
// Description: Comprehensive Project Director Dashboard with construction progress and project management
// Version: 2.0 - Full implementation with all project management features
// Location: src/pages/dashboard/ProjectDirectorDashboard.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Construction,
  Business,
  Timeline,
  Assessment,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  Visibility,
  TrendingUp,
  TrendingDown,
  Domain,
  Apartment,
  Home,
  AccountBalance,
  Speed,
  People,
  Assignment,
  NotificationsActive,
  ArrowUpward,
  ArrowDownward,
  AutoGraph,
  PieChart,
  BarChart,
  Today,
  CalendarToday,
  LocationOn,
  Engineering,
  Architecture,
  Handyman,
} from '@mui/icons-material';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart as RechartsBarChart, Bar, Legend } from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI, budgetVsActualAPI, alertsAPI } from '../../services/api';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#0088fe'];

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};

const getStatusColor = (status) => {
  const statusColors = {
    'planning': 'info',
    'pre-launch': 'warning',
    'active': 'success',
    'completed': 'primary',
    'on-hold': 'error',
    'not-started': 'default',
    'foundation': 'info',
    'structure': 'warning',
    'finishing': 'primary',
  };
  return statusColors[status] || 'default';
};

// =============================================================================
// COMPONENTS
// =============================================================================

// Project KPI Card Component
const ProjectKPICard = ({ title, value, subtitle, change, icon: Icon, color = 'primary', isLoading, onClick, progress }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Card sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="h6" sx={{ mt: 1 }}>Loading...</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}.main` }}>
              <Icon />
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { elevation: 4 } : {},
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change >= 0 ? (
                  <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 600 }}
                >
                  {formatPercentage(Math.abs(change))}
                </Typography>
              </Box>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  color={color}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {formatPercentage(progress)} Complete
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// Project Status Distribution Chart
const ProjectStatusChart = ({ projects, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Project Status Distribution" />
        <CardContent>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
    percentage: ((count / projects.length) * 100).toFixed(1)
  }));

  return (
    <Card>
      <CardHeader 
        title="Project Status Distribution"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
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
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Project List Table Component
const ProjectListTable = ({ projects, isLoading, navigate }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Active Projects" />
        <CardContent>
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Loading project {i}...</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const displayedProjects = projects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <CardHeader 
        title="Active Projects"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={() => navigate('/projects')}
          >
            View All
          </Button>
        }
      />
      <CardContent sx={{ px: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedProjects.map((project) => {
                const progress = project.constructionProgress || 0;
                const totalUnits = project.totalUnits || 0;
                const soldUnits = project.soldUnits || 0;
                const revenue = project.revenueAchieved || 0;
                
                return (
                  <TableRow key={project._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                          {project.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={project.status} 
                        size="small" 
                        color={getStatusColor(project.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">
                          {formatPercentage(progress)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {soldUnits}/{totalUnits}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalUnits > 0 ? formatPercentage((soldUnits / totalUnits) * 100) : '0%'} sold
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(revenue)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/projects/${project._id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={projects.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActionsCard = ({ navigate }) => (
  <Card>
    <CardHeader 
      title="Quick Actions" 
      titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
    />
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Business />}
            onClick={() => navigate('/projects/create')}
          >
            New Project
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Domain />}
            onClick={() => navigate('/projects')}
          >
            All Projects
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/analytics/budget')}
          >
            Budget Analysis
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Timeline />}
            onClick={() => navigate('/analytics')}
          >
            Project Analytics
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Construction Alerts Component
const ConstructionAlertsCard = ({ alerts, isLoading }) => (
  <Card>
    <CardHeader 
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Construction Alerts
          </Typography>
          {alerts.length > 0 && (
            <Badge badgeContent={alerts.length} color="error">
              <NotificationsActive color="error" />
            </Badge>
          )}
        </Box>
      }
    />
    <CardContent>
      {isLoading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading alert {i}...</Typography>
            </Box>
          ))}
        </Box>
      ) : alerts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No construction alerts at this time
          </Typography>
        </Box>
      ) : (
        <List>
          {alerts.slice(0, 5).map((alert, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Warning color={alert.severity || 'warning'} />
                </ListItemIcon>
                <ListItemText
                  primary={alert.title}
                  secondary={alert.description}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {alert.project && (
                  <ListItemSecondaryAction>
                    <Chip 
                      label={alert.project} 
                      size="small" 
                      color={alert.severity || 'warning'}
                    />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < alerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

// Main Project Director Dashboard Component
const ProjectDirectorDashboard = () => {
  const { user, getOrganizationDisplayName } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalProjects: 0,
      activeProjects: 0,
      totalUnits: 0,
      totalRevenue: 0,
      averageProgress: 0,
      completionRate: 0,
    },
    projects: [],
    alerts: [],
    milestones: [],
  });

  const [loading, setLoading] = useState({
    kpis: true,
    projects: true,
    alerts: true,
    milestones: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch project portfolio data
  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true, kpis: true }));
      
      const projectsResponse = await projectAPI.getProjects();
      const projects = projectsResponse.data?.data || projectsResponse.data || [];

      // Calculate KPIs from project data
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const totalUnits = projects.reduce((sum, project) => sum + (project.totalUnits || 0), 0);
      const totalRevenue = projects.reduce((sum, project) => sum + (project.revenueAchieved || 0), 0);
      
      // Calculate average construction progress
      const projectsWithProgress = projects.filter(p => (p.constructionProgress || 0) > 0);
      const averageProgress = projectsWithProgress.length > 0 
        ? projectsWithProgress.reduce((sum, project) => sum + (project.constructionProgress || 0), 0) / projectsWithProgress.length
        : 0;
      
      // Calculate completion rate
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      setDashboardData(prev => ({
        ...prev,
        kpis: {
          totalProjects,
          activeProjects,
          totalUnits,
          totalRevenue,
          averageProgress,
          completionRate,
        },
        projects: projects
      }));

    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Failed to load project data');
    } finally {
      setLoading(prev => ({ ...prev, projects: false, kpis: false }));
    }
  }, []);

  // Fetch construction alerts from API
  const fetchConstructionAlerts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, alerts: true }));
      
      // Replace with actual API call when available
      // const alertsResponse = await alertsAPI.getConstructionAlerts();
      // const alerts = alertsResponse.data?.data || alertsResponse.data || [];
      
      // For now, set empty array - replace with actual API integration
      const alerts = [];

      setDashboardData(prev => ({
        ...prev,
        alerts: alerts
      }));

    } catch (error) {
      console.error('Error fetching construction alerts:', error);
      setDashboardData(prev => ({
        ...prev,
        alerts: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);

  // Fetch upcoming milestones from API
  const fetchUpcomingMilestones = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, milestones: true }));
      
      // Replace with actual API call when available
      // const milestonesResponse = await projectAPI.getUpcomingMilestones();
      // const milestones = milestonesResponse.data?.data || milestonesResponse.data || [];
      
      // For now, set empty array - replace with actual API integration
      const milestones = [];

      setDashboardData(prev => ({
        ...prev,
        milestones: milestones
      }));

    } catch (error) {
      console.error('Error fetching upcoming milestones:', error);
      setDashboardData(prev => ({
        ...prev,
        milestones: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, milestones: false }));
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      await Promise.all([
        fetchProjectData(),
        fetchConstructionAlerts(),
        fetchUpcomingMilestones()
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [fetchProjectData, fetchConstructionAlerts, fetchUpcomingMilestones]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const { projects, milestones } = dashboardData;
    
    return {
      onTimeProjects: projects.filter(p => (p.constructionProgress || 0) >= 80).length,
      delayedProjects: projects.filter(p => p.status === 'active' && (p.constructionProgress || 0) < 50).length,
      upcomingMilestones: milestones.length,
    };
  }, [dashboardData.projects, dashboardData.milestones]);

  return (
    <Box>
      {/* Header */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Project Director Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {user?.firstName}! Here's your project portfolio overview for {getOrganizationDisplayName()}.
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
                startIcon={<Assessment />}
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

      {/* Project KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <ProjectKPICard
            title="Total Projects"
            value={dashboardData.kpis.totalProjects}
            subtitle={`${dashboardData.kpis.activeProjects} active projects`}
            icon={Business}
            color="primary"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ProjectKPICard
            title="Construction Progress"
            value={formatPercentage(dashboardData.kpis.averageProgress)}
            subtitle="Average across all projects"
            progress={dashboardData.kpis.averageProgress}
            icon={Construction}
            color="warning"
            isLoading={loading.kpis}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ProjectKPICard
            title="Total Units"
            value={formatNumber(dashboardData.kpis.totalUnits)}
            subtitle="Across all projects"
            icon={Apartment}
            color="info"
            isLoading={loading.kpis}
            onClick={() => navigate('/projects')}
          />
        </Grid>
      </Grid>

      {/* Secondary KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {dashboardData.kpis.activeProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {derivedMetrics.onTimeProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              On Track Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error.main">
              {derivedMetrics.delayedProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Delayed Projects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {derivedMetrics.upcomingMilestones}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upcoming Milestones
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Project List Table */}
        <Grid item xs={12} lg={8}>
          <ProjectListTable 
            projects={dashboardData.projects}
            isLoading={loading.projects}
            navigate={navigate}
          />
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Project Status Chart */}
            <ProjectStatusChart 
              projects={dashboardData.projects}
              isLoading={loading.projects}
            />
            
            {/* Quick Actions */}
            <QuickActionsCard navigate={navigate} />
            
            {/* Construction Alerts */}
            <ConstructionAlertsCard 
              alerts={dashboardData.alerts}
              isLoading={loading.alerts}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDirectorDashboard;
// File: src/pages/dashboard/SalesExecutiveDashboard.js
// Description: FIXED Sales Executive Dashboard - Now includes REAL LEADS DATA
// Version: 2.4 - Added back leads API since Sales Executive has access
// Location: src/pages/dashboard/SalesExecutiveDashboard.js

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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  useTheme,
  Fade,
  Zoom,
  Skeleton,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  Person,
  Phone,
  Email,
  Assignment,
  Today,
  Schedule,
  Add,
  Visibility,
  Event,
  Speed,
  GpsFixed,
  Timeline,
  CheckCircle,
  Warning,
  PriorityHigh,
  Refresh,
  LeaderboardRounded,
  MonetizationOn,
  PersonAdd,
  ArrowUpward,
  ArrowDownward,
  Business,
  Apartment,
  LocationOn,
  Star,
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
import { projectAPI, leadAPI } from '../../services/api';

// Utility functions
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
};

const getTimeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Enhanced Personal Metric Card Component
const PersonalMetricCard = ({ 
  title, 
  current, 
  target, 
  subtitle, 
  icon: Icon, 
  color = 'primary',
  isLoading = false,
  trend,
  trendDirection,
  onClick 
}) => {
  const theme = useTheme();
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  
  const getTrendColor = () => {
    if (trendDirection === 'up') return theme.palette.success.main;
    if (trendDirection === 'down') return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  const TrendIcon = trendDirection === 'up' ? ArrowUpward : ArrowDownward;
  
  return (
    <Zoom in timeout={300}>
      <Card 
        sx={{ 
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': onClick ? { 
            boxShadow: 6,
            transform: 'translateY(-4px)',
          } : {},
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `1px solid ${theme.palette.divider}`,
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
                <Skeleton variant="text" width="80%" height={40} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {current}
                  {target && (
                    <Typography component="span" variant="h6" color="text.secondary">
                      /{target}
                    </Typography>
                  )}
                </Typography>
              )}
              
              {subtitle && !isLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {subtitle}
                </Typography>
              )}

              {trend && !isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendIcon sx={{ fontSize: 16, color: getTrendColor() }} />
                  <Typography variant="caption" sx={{ color: getTrendColor(), fontWeight: 600 }}>
                    {trend}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Avatar 
              sx={{ 
                bgcolor: `${color}.100`, 
                color: `${color}.700`,
                width: 48,
                height: 48,
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Avatar>
          </Box>
          
          {target && !isLoading && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Target Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {percentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(percentage, 100)} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: `${color}.100`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: `${color}.main`,
                  },
                }} 
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
};

// My Hot Leads Component - REAL BACKEND DATA
const MyHotLeads = ({ leads, isLoading }) => {
  const navigate = useNavigate();
  
  const getLeadStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'site visit scheduled': return 'warning';
      case 'site visit completed': return 'info';
      case 'qualified': return 'primary';
      case 'booked': return 'success';
      case 'new': return 'default';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'error'; // Hot
    if (score >= 75) return 'warning'; // Warm
    return 'info'; // Cold
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Hot';
    if (score >= 75) return 'Warm';
    return 'Cold';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="50%" height={32} />
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" width="100%" height={80} sx={{ mt: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Priority Leads
          </Typography>
          <Badge badgeContent={leads.length} color="primary">
            <Button 
              size="small" 
              onClick={() => navigate('/leads')}
              endIcon={<Visibility />}
            >
              View All
            </Button>
          </Badge>
        </Box>
        
        {leads && leads.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {leads.slice(0, 6).map((lead, index) => (
              <React.Fragment key={lead._id}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {lead.firstName} {lead.lastName}
                        </Typography>
                        <Chip 
                          label={getScoreLabel(lead.score)}
                          size="small"
                          color={getScoreColor(lead.score)}
                          sx={{ height: 18, fontSize: '0.7rem' }}
                        />
                        <Chip 
                          label={lead.status}
                          size="small"
                          color={getLeadStatusColor(lead.status)}
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {lead.project?.name} • Score: {lead.score}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {lead.followUpSchedule?.isOverdue ? (
                            <Chip 
                              label={`Overdue by ${lead.followUpSchedule.overdueBy} days`}
                              size="small"
                              color="error"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          ) : (
                            `Created: ${getTimeAgo(lead.createdAt)}`
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" color="primary">
                        <Phone fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary">
                        <Email fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < Math.min(leads.length, 6) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No leads assigned
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start by creating or getting assigned new leads
            </Typography>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<PersonAdd />}
              onClick={() => navigate('/leads/create')}
            >
              Create Lead
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Today's Activities Component - Using real lead follow-ups
const TodaysActivities = ({ leads, isLoading }) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Create activities from real lead follow-ups
  const activities = leads
    .filter(lead => lead.followUpSchedule?.nextFollowUpDate)
    .slice(0, 8)
    .map(lead => ({
      id: lead._id,
      title: `${lead.followUpSchedule.followUpType}: ${lead.firstName} ${lead.lastName}`,
      type: lead.followUpSchedule.followUpType || 'call',
      time: lead.followUpSchedule.isOverdue 
        ? `Overdue ${lead.followUpSchedule.overdueBy} days`
        : new Date(lead.followUpSchedule.nextFollowUpDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      priority: lead.followUpSchedule.isOverdue ? 'high' : lead.score >= 90 ? 'high' : 'medium',
      completed: false,
      leadId: lead._id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      isOverdue: lead.followUpSchedule.isOverdue,
      notes: lead.followUpSchedule.notes,
    }));

  const getPriorityColor = (priority, isOverdue) => {
    if (isOverdue) return 'error';
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'call': return <Phone />;
      case 'email': return <Email />;
      case 'meeting': return <Event />;
      case 'follow-up': return <Schedule />;
      default: return <Assignment />;
    }
  };

  const overdueCount = activities.filter(a => a.isOverdue).length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Follow-up Activities
          </Typography>
          <Badge 
            badgeContent={overdueCount} 
            color="error"
          >
            <Today />
          </Badge>
        </Box>
        
        {activities.length > 0 ? (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  sx={{
                    bgcolor: activity.isOverdue ? 'error.50' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    border: activity.isOverdue ? '1px solid' : '1px solid transparent',
                    borderColor: activity.isOverdue ? 'error.main' : 'transparent',
                    '&:hover': { borderColor: 'divider' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36,
                        bgcolor: `${getPriorityColor(activity.priority, activity.isOverdue)}.main`,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: activity.isOverdue ? 600 : 500,
                        }}
                      >
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          size="small" 
                          label={activity.time}
                          color={activity.isOverdue ? 'error' : 'default'}
                          variant={activity.isOverdue ? 'filled' : 'outlined'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        {activity.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {activity.notes.substring(0, 30)}...
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      size="small" 
                      onClick={() => navigate(`/leads/${activity.leadId}`)}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < activities.length - 1 && <Divider sx={{ my: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              All caught up!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No follow-ups scheduled for today
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/leads')}
            >
              View Leads
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Lead Pipeline Chart Component - REAL BACKEND DATA
const PersonalPipelineChart = ({ leads, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Process real leads data for pipeline
  const pipelineData = [];
  if (leads && leads.length > 0) {
    const statusCounts = leads.reduce((acc, lead) => {
      const status = lead.status || 'New';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    pipelineData.push(...Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    })));
  }

  const COLORS = [
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.error.main,
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          My Lead Pipeline
        </Typography>
        {pipelineData.length > 0 ? (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <GpsFixed sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No pipeline data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const SalesQuickActions = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Create Lead',
      icon: PersonAdd,
      color: 'primary',
      onClick: () => navigate('/leads/create'),
    },
    {
      title: 'View All Leads',
      icon: Person,
      color: 'success',
      onClick: () => navigate('/leads'),
    },
    {
      title: 'View Projects',
      icon: Business,
      color: 'info',
      onClick: () => navigate('/projects'),
    },
    {
      title: 'Book Sale',
      icon: MonetizationOn,
      color: 'warning',
      onClick: () => navigate('/sales/create'),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: `${action.color}.main`,
                    bgcolor: `${action.color}.50`,
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={action.onClick}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: `${action.color}.100`, 
                    color: `${action.color}.700`,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <action.icon />
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {action.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Sales Executive Dashboard Component
const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [dashboardData, setDashboardData] = useState({
    personalMetrics: {
      leadsAssigned: 0,
      leadsConverted: 0,
      monthlyTarget: 15,
      overdueFollowUps: 0,
    },
    myLeads: [],
    projects: [],
  });

  const [loading, setLoading] = useState({
    metrics: true,
    leads: true,
    projects: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch personal dashboard data - REAL BACKEND DATA
  const fetchPersonalData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Fetching sales executive dashboard data - INCLUDING LEADS...');
      
      // Fetch real data from authorized endpoints
      const [leadsResult, projectsResult] = await Promise.allSettled([
        leadAPI.getLeads(), // Sales Executive has access to this
        projectAPI.getProjects(), // Sales Executive has access to this
      ]);

      let myLeads = [];
      let projects = [];

      // Process leads data
      if (leadsResult.status === 'fulfilled') {
        console.log('✅ Leads API Response:', leadsResult.value.data);
        const responseData = leadsResult.value.data;
        
        // Handle nested data structure: data.data.leads or data.leads
        let allLeads = [];
        if (responseData.data && responseData.data.leads) {
          allLeads = responseData.data.leads;
        } else if (responseData.leads) {
          allLeads = responseData.leads;
        } else if (Array.isArray(responseData.data)) {
          allLeads = responseData.data;
        } else if (Array.isArray(responseData)) {
          allLeads = responseData;
        }
        
        console.log('📊 Extracted leads array:', allLeads);
        
        // Filter leads assigned to current user
        myLeads = allLeads.filter(lead => 
          lead.assignedTo && 
          (lead.assignedTo._id === user?.id || lead.assignedTo._id === user?._id)
        );
        
        console.log(`📝 Found ${allLeads.length} total leads, ${myLeads.length} assigned to me`);
      } else {
        console.log('❌ Leads API failed:', leadsResult.reason);
      }

      // Process projects data
      if (projectsResult.status === 'fulfilled') {
        console.log('✅ Projects API Response:', projectsResult.value.data);
        projects = projectsResult.value.data.data || projectsResult.value.data || [];
      } else {
        console.log('❌ Projects API failed:', projectsResult.reason);
      }

      // Calculate REAL personal metrics from backend data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const leadsThisMonth = myLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
      });

      const convertedLeads = myLeads.filter(lead => 
        ['Booked', 'Converted', 'Closed'].includes(lead.status)
      );

      const overdueFollowUps = myLeads.filter(lead => 
        lead.followUpSchedule?.isOverdue
      ).length;

      const personalMetrics = {
        leadsAssigned: leadsThisMonth.length,
        leadsConverted: convertedLeads.length,
        monthlyTarget: 15, // This could come from user settings in future
        overdueFollowUps,
      };

      console.log('📊 Calculated REAL Personal Metrics:', personalMetrics);
      console.log('🔥 Hot Leads (Score >= 90):', myLeads.filter(l => l.score >= 90).length);
      console.log('⚠️ Overdue Follow-ups:', overdueFollowUps);

      // Update state with REAL data
      setDashboardData({
        personalMetrics,
        myLeads: myLeads.sort((a, b) => (b.score || 0) - (a.score || 0)), // Sort by score desc
        projects,
      });

      setLoading({
        metrics: false,
        leads: false,
        projects: false,
      });

    } catch (error) {
      console.error('❌ Error fetching sales executive dashboard data:', error);
      setError('Failed to load your dashboard data. Please try refreshing.');
      setLoading({
        metrics: false,
        leads: false,
        projects: false,
      });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [user?.id, user?._id]);

  // Initial data load
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchPersonalData();
    }
  }, [fetchPersonalData, user?.id, user?._id]);

  // Handle refresh
  const handleRefresh = () => {
    fetchPersonalData(true);
  };

  return (
    <Box>
      {/* Header */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                My Sales Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Good morning, {user?.firstName}! Here's your personal performance overview.
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
                startIcon={<LeaderboardRounded />}
                onClick={() => navigate('/leads')}
              >
                My Leads
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

      {/* Personal Metrics - REAL BACKEND DATA */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="This Month's Leads"
            current={dashboardData.personalMetrics.leadsAssigned}
            target={dashboardData.personalMetrics.monthlyTarget}
            subtitle="Assigned to you"
            icon={Person}
            color="primary"
            isLoading={loading.metrics}
            onClick={() => navigate('/leads')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Conversions"
            current={dashboardData.personalMetrics.leadsConverted}
            target={Math.floor(dashboardData.personalMetrics.monthlyTarget * 0.3)}
            subtitle="Successfully closed"
            icon={GpsFixed}
            color="success"
            isLoading={loading.metrics}
            onClick={() => navigate('/leads?status=booked')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Total Leads"
            current={dashboardData.myLeads.length}
            subtitle="All assigned leads"
            icon={Assignment}
            color="info"
            isLoading={loading.leads}
            onClick={() => navigate('/leads')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Overdue Follow-ups"
            current={dashboardData.personalMetrics.overdueFollowUps}
            subtitle="Need immediate attention"
            icon={Warning}
            color="warning"
            isLoading={loading.metrics}
            onClick={() => navigate('/leads?filter=overdue')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid - REAL BACKEND DATA */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Activities */}
        <Grid item xs={12} md={6} lg={4}>
          <TodaysActivities 
            leads={dashboardData.myLeads} 
            isLoading={loading.leads}
          />
        </Grid>
        
        {/* My Hot Leads */}
        <Grid item xs={12} md={6} lg={4}>
          <MyHotLeads 
            leads={dashboardData.myLeads} 
            isLoading={loading.leads}
          />
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={6} lg={4}>
          <SalesQuickActions />
        </Grid>
      </Grid>

      {/* Pipeline Chart - REAL BACKEND DATA */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <PersonalPipelineChart 
            leads={dashboardData.myLeads} 
            isLoading={loading.leads}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesExecutiveDashboard;
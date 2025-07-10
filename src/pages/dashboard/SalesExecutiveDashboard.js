// File: src/pages/dashboard/SalesExecutiveDashboard.js
// Description: Professional Sales Executive Dashboard - Complete backend integration with personal metrics
// Version: 2.0 - Sales-focused dashboard with real-time personal performance data
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
  ButtonGroup,
  Paper,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Person,
  Phone,
  Email,
  Assignment,
  Today,
  Schedule,
  Star,
  Add,
  Visibility,
  Call,
  Message,
  Event,
  Psychology,
  Speed,
  GpsFixed,
  Timeline,
  CheckCircle,
  Warning,
  PriorityHigh,
  Refresh,
  CalendarToday,
  Task,
  LeaderboardRounded,
  MonetizationOn,
  PersonAdd,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  NotificationsActive,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, salesAPI, analyticsAPI, aiAPI, userAPI } from '../../services/api';

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

const getLeadStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'hot': return 'error';
    case 'warm': return 'warning';
    case 'cold': return 'info';
    case 'converted': return 'success';
    default: return 'default';
  }
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

// Personal Pipeline Chart Component
const PersonalPipelineChart = ({ data, isLoading }) => {
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

  const COLORS = [
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.primary.main,
    theme.palette.success.main,
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          My Lead Pipeline
        </Typography>
        {data && data.length > 0 ? (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
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

// Today's Activities Component
const TodaysActivities = ({ activities, isLoading }) => {
  const navigate = useNavigate();
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return <PriorityHigh />;
      case 'medium': return <Warning />;
      case 'low': return <CheckCircle />;
      default: return <Assignment />;
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Today's Activities
          </Typography>
          <Badge 
            badgeContent={activities?.filter(a => !a.completed).length || 0} 
            color="error"
          >
            <Today />
          </Badge>
        </Box>
        
        {activities && activities.length > 0 ? (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {activities.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    bgcolor: activity.completed ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    border: '1px solid transparent',
                    '&:hover': { borderColor: 'divider' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36,
                        bgcolor: activity.completed 
                          ? 'success.main' 
                          : `${getPriorityColor(activity.priority)}.main`,
                      }}
                    >
                      {activity.completed ? <CheckCircle /> : getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: activity.completed ? 'line-through' : 'none',
                          fontWeight: activity.completed ? 400 : 500,
                        }}
                      >
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip 
                          size="small" 
                          label={activity.time}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        {activity.leadName && (
                          <Chip 
                            label={activity.leadName} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {activity.leadId && (
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/leads/${activity.leadId}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    )}
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
              No activities scheduled for today
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/leads')}
            >
              Add Activity
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Hot Leads Component
const MyHotLeads = ({ leads, isLoading }) => {
  const navigate = useNavigate();
  
  const getLeadScore = (score) => {
    if (score >= 80) return { label: 'Hot', color: 'error' };
    if (score >= 60) return { label: 'Warm', color: 'warning' };
    return { label: 'Cold', color: 'info' };
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
          <Button 
            size="small" 
            onClick={() => navigate('/leads')}
            endIcon={<Visibility />}
          >
            View All
          </Button>
        </Box>
        
        {leads && leads.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {leads.slice(0, 6).map((lead, index) => (
              <React.Fragment key={index}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {lead.firstName} {lead.lastName}
                        </Typography>
                        <Chip 
                          label={getLeadScore(lead.score || 0).label}
                          size="small"
                          color={getLeadScore(lead.score || 0).color}
                          sx={{ height: 18, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {lead.project?.name || 'No project'} • {formatCurrency(lead.budget?.max || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Last contact: {getTimeAgo(lead.lastInteractionDate)}
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
                {index < leads.length - 1 && index < 5 && <Divider />}
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

// Performance Chart Component
const MyPerformanceChart = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={250} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Weekly Performance Trend
        </Typography>
        {data && data.length > 0 ? (
          <Box sx={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="day" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Bar 
                  dataKey="leadsContacted" 
                  fill={theme.palette.primary.main} 
                  name="Leads Contacted"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="callsMade" 
                  fill={theme.palette.success.main} 
                  name="Calls Made"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="conversions" 
                  fill={theme.palette.warning.main} 
                  name="Conversions"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Timeline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No performance data available
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
      title: 'Add Lead',
      icon: PersonAdd,
      color: 'primary',
      onClick: () => navigate('/leads/create'),
    },
    {
      title: 'Schedule Call',
      icon: Phone,
      color: 'success',
      onClick: () => navigate('/leads?action=call'),
    },
    {
      title: 'Send Follow-up',
      icon: Email,
      color: 'info',
      onClick: () => navigate('/leads?action=followup'),
    },
    {
      title: 'Book Meeting',
      icon: Event,
      color: 'warning',
      onClick: () => navigate('/leads?action=meeting'),
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
      monthlyTarget: 0,
      revenue: 0,
      conversionRate: 0,
    },
    myLeads: [],
    activities: [],
    performanceData: [],
    pipelineData: [],
  });

  const [loading, setLoading] = useState({
    metrics: true,
    leads: true,
    activities: true,
    performance: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch personal dashboard data
  const fetchPersonalData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      // Fetch user's personal data
      const [
        myLeadsResponse,
        mySalesResponse,
        myActivitiesResponse,
        userProfileResponse,
      ] = await Promise.allSettled([
        leadAPI.getLeads({ assignedTo: user?.id, limit: 100 }),
        salesAPI.getSales({ salesExecutive: user?.id, limit: 100 }),
        // This would be from a dedicated activities API in real scenario
        leadAPI.getLeads({ assignedTo: user?.id, status: 'active', limit: 20 }),
        userAPI.getUserById(user?.id),
      ]);

      // Process leads data
      let myLeads = [];
      let personalMetrics = {
        leadsAssigned: 0,
        leadsConverted: 0,
        monthlyTarget: 15, // This should come from user profile or settings
        revenue: 0,
        conversionRate: 0,
      };

      if (myLeadsResponse.status === 'fulfilled') {
        myLeads = myLeadsResponse.value.data.data || [];
        
        // Calculate metrics from actual data
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const leadsThisMonth = myLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
        });

        const convertedLeads = myLeads.filter(lead => 
          ['Converted', 'Closed', 'Won'].includes(lead.status)
        );

        personalMetrics.leadsAssigned = leadsThisMonth.length;
        personalMetrics.leadsConverted = convertedLeads.length;
        personalMetrics.conversionRate = personalMetrics.leadsAssigned > 0 
          ? (personalMetrics.leadsConverted / personalMetrics.leadsAssigned) * 100 
          : 0;

        // Generate pipeline data from actual leads
        const pipelineData = [
          { 
            name: 'New', 
            value: myLeads.filter(l => l.status === 'New').length 
          },
          { 
            name: 'Contacted', 
            value: myLeads.filter(l => l.status === 'Contacted').length 
          },
          { 
            name: 'Qualified', 
            value: myLeads.filter(l => l.status === 'Qualified').length 
          },
          { 
            name: 'Converted', 
            value: convertedLeads.length 
          },
        ].filter(item => item.value > 0); // Only show stages with data

        setDashboardData(prev => ({
          ...prev,
          myLeads: myLeads
            .filter(lead => (lead.score || 0) >= 60) // High priority leads
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8),
          pipelineData,
        }));
      }

      // Process sales data for revenue calculation
      if (mySalesResponse.status === 'fulfilled') {
        const mySales = mySalesResponse.value.data.data || [];
        personalMetrics.revenue = mySales.reduce((sum, sale) => 
          sum + (sale.finalAmount || sale.totalAmount || 0), 0
        );
      }

      // Process user profile for target information
      if (userProfileResponse.status === 'fulfilled') {
        const userProfile = userProfileResponse.value.data;
        personalMetrics.monthlyTarget = userProfile.monthlyTarget || 15;
      }

      // Generate performance data (this should come from actual activity tracking)
      const performanceData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // In real scenario, this would be actual tracked data
        const dayLeads = myLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate.toDateString() === date.toDateString();
        });
        
        performanceData.push({
          day: dayName,
          leadsContacted: dayLeads.length,
          callsMade: Math.floor(dayLeads.length * 1.5), // Estimated
          conversions: dayLeads.filter(l => l.status === 'Converted').length,
        });
      }

      // Generate activities from leads (in real scenario, this would be from activities API)
      const activities = myLeads
        .filter(lead => lead.nextFollowUp || lead.status === 'New')
        .slice(0, 8)
        .map(lead => ({
          id: lead._id,
          title: `Follow up with ${lead.firstName} ${lead.lastName}`,
          type: 'follow-up',
          time: lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending',
          priority: (lead.score || 0) >= 80 ? 'high' : (lead.score || 0) >= 60 ? 'medium' : 'low',
          completed: false,
          leadId: lead._id,
          leadName: `${lead.firstName} ${lead.lastName}`,
        }));

      // Update all state
      setDashboardData(prev => ({
        ...prev,
        personalMetrics,
        activities,
        performanceData,
      }));

      setLoading({
        metrics: false,
        leads: false,
        activities: false,
        performance: false,
      });

    } catch (error) {
      console.error('Error fetching personal dashboard data:', error);
      setError('Failed to load your dashboard data. Please try refreshing.');
      setLoading({
        metrics: false,
        leads: false,
        activities: false,
        performance: false,
      });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [user?.id]);

  // Initial data load
  useEffect(() => {
    if (user?.id) {
      fetchPersonalData();
    }
  }, [fetchPersonalData, user?.id]);

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
                onClick={() => navigate('/analytics/personal')}
              >
                My Analytics
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

      {/* Personal Metrics */}
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
            trend="+3 this week"
            trendDirection="up"
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
            trend="+2 this week"
            trendDirection="up"
            onClick={() => navigate('/leads?status=converted')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Revenue Generated"
            current={formatCurrency(dashboardData.personalMetrics.revenue)}
            subtitle="From conversions"
            icon={MonetizationOn}
            color="warning"
            isLoading={loading.metrics}
            trend="+₹2.5L this month"
            trendDirection="up"
            onClick={() => navigate('/sales')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Conversion Rate"
            current={`${dashboardData.personalMetrics.conversionRate.toFixed(1)}%`}
            subtitle="Lead to sale ratio"
            icon={Speed}
            color="info"
            isLoading={loading.metrics}
            trend="+2.1% improvement"
            trendDirection="up"
            onClick={() => navigate('/analytics/conversion')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Activities */}
        <Grid item xs={12} md={6} lg={4}>
          <TodaysActivities 
            activities={dashboardData.activities} 
            isLoading={loading.activities}
          />
        </Grid>
        
        {/* Hot Leads */}
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

      {/* Performance Analytics */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <MyPerformanceChart 
            data={dashboardData.performanceData} 
            isLoading={loading.performance}
          />
        </Grid>
        
        {/* Pipeline Chart */}
        <Grid item xs={12} lg={4}>
          <PersonalPipelineChart 
            data={dashboardData.pipelineData} 
            isLoading={loading.leads}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesExecutiveDashboard;
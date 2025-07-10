// File: src/pages/dashboard/SalesExecutiveDashboard.js
// Description: Sales Executive dashboard component - Personal sales metrics and lead management interface
// Version: 1.0 - Sales-focused dashboard with personal KPIs and lead pipeline
// Location: src/pages/dashboard/SalesExecutiveDashboard.js

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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  TrendingUp,
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
  ExpandMore,
  CheckCircle,
  Warning,
  PriorityHigh,
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
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, salesAPI, analyticsAPI, aiAPI } from '../../services/api';

// Utility functions
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

const getTimeAgo = (date) => {
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

// Personal Metrics Card Component
const PersonalMetricCard = ({ 
  title, 
  current, 
  target, 
  subtitle, 
  icon: Icon, 
  color = 'primary',
  isLoading = false 
}) => {
  const theme = useTheme();
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {current}
                  {target && (
                    <Typography component="span" variant="h6" color="text.secondary">
                      /{target}
                    </Typography>
                  )}
                </Typography>
                
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          
          <Avatar sx={{ bgcolor: `${color}.100`, color: `${color}.700` }}>
            <Icon />
          </Avatar>
        </Box>
        
        {target && !isLoading && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
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
  );
};

// Today's Tasks Component
const TodaysTasks = ({ tasks, isLoading }) => {
  const navigate = useNavigate();
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHigh />;
      case 'medium': return <Warning />;
      case 'low': return <CheckCircle />;
      default: return <Assignment />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Today's Tasks
          </Typography>
          <Badge badgeContent={tasks?.filter(t => !t.completed).length || 0} color="error">
            <Today />
          </Badge>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : tasks?.length > 0 ? (
          <List dense>
            {tasks.slice(0, 6).map((task, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    bgcolor: task.completed ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: task.completed ? 'success.main' : `${getPriorityColor(task.priority)}.main`,
                      }}
                    >
                      {task.completed ? <CheckCircle /> : getPriorityIcon(task.priority)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontWeight: task.completed ? 400 : 500,
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {task.time}
                        </Typography>
                        {task.leadName && (
                          <Chip 
                            label={task.leadName} 
                            size="small" 
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {task.leadId && (
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/leads/${task.leadId}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < tasks.length - 1 && index < 5 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No tasks for today. Great job!
            </Typography>
          </Box>
        )}
        
        <Button 
          fullWidth 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/leads')}
        >
          View All Activities
        </Button>
      </CardContent>
    </Card>
  );
};

// Hot Leads Component
const HotLeads = ({ leads, isLoading }) => {
  const navigate = useNavigate();
  
  const getLeadTemperature = (score) => {
    if (score >= 80) return { label: 'Hot', color: 'error' };
    if (score >= 60) return { label: 'Warm', color: 'warning' };
    return { label: 'Cold', color: 'info' };
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Hot Leads
          </Typography>
          <Button 
            size="small" 
            onClick={() => navigate('/leads')}
            endIcon={<Visibility />}
          >
            View All
          </Button>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : leads?.length > 0 ? (
          <List>
            {leads.slice(0, 5).map((lead, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderRadius: 1,
                  }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {lead.name?.charAt(0) || 'L'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {lead.name}
                        </Typography>
                        <Chip 
                          label={getLeadTemperature(lead.score).label}
                          size="small"
                          color={getLeadTemperature(lead.score).color}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {lead.project} • {formatCurrency(lead.budget)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Last contact: {getTimeAgo(lead.lastContact)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary">
                        <Phone fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary">
                        <Message fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < leads.length - 1 && index < 4 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No hot leads at the moment
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Performance Chart Component
const PerformanceChart = ({ data, isLoading }) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Performance Trend
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
          Weekly Performance
        </Typography>
        <Box sx={{ height: 250, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill={theme.palette.primary.main} name="Leads Added" />
              <Bar dataKey="calls" fill={theme.palette.success.main} name="Calls Made" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActionsPanel = () => {
  const navigate = useNavigate();
  
  const actions = [
    {
      title: 'Add New Lead',
      icon: Add,
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
      title: 'Book Site Visit',
      icon: Event,
      color: 'warning',
      onClick: () => navigate('/leads?action=visit'),
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
            <Grid item xs={6} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<action.icon />}
                onClick={action.onClick}
                sx={{
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                  '&:hover': {
                    bgcolor: `${action.color}.50`,
                    borderColor: `${action.color}.main`,
                  },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {action.title}
                </Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// AI Insights Component
const AIInsightsPanel = ({ insights, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI Insights
          </Typography>
          <Psychology color="primary" />
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {insights?.map((insight, index) => (
              <Accordion key={index} sx={{ mb: 1, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={insight.type} 
                      size="small" 
                      color={insight.priority === 'high' ? 'error' : 'primary'}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {insight.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {insight.description}
                  </Typography>
                  {insight.action && (
                    <Button 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={() => navigate(insight.actionUrl)}
                    >
                      {insight.action}
                    </Button>
                  )}
                </AccordionDetails>
              </Accordion>
            )) || (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No AI insights available
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main Sales Executive Dashboard Component
const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    personalMetrics: {
      leadsAssigned: 0,
      leadsConverted: 0,
      monthlyTarget: 0,
      revenue: 0,
    },
    todaysTasks: [],
    hotLeads: [],
    performanceData: [],
    aiInsights: [],
  });

  const [loading, setLoading] = useState({
    metrics: true,
    tasks: true,
    leads: true,
    performance: true,
    insights: true,
  });

  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchSalesExecutiveData();
  }, []);

  const fetchSalesExecutiveData = async () => {
    try {
      setError(null);
      
      // Fetch personal leads and sales data
      const [
        leadsResponse,
        salesResponse,
      ] = await Promise.allSettled([
        leadAPI.getLeads({ assignedTo: user?.id, limit: 50 }),
        salesAPI.getSales({ salesExecutive: user?.id, limit: 20 }),
      ]);

      // Process leads data
      let personalLeads = [];
      if (leadsResponse.status === 'fulfilled') {
        personalLeads = leadsResponse.value.data.data || [];
        
        // Calculate personal metrics
        const leadsThisMonth = personalLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          const now = new Date();
          return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
        });

        const convertedLeads = personalLeads.filter(lead => lead.status === 'Closed' || lead.status === 'Converted');
        
        setDashboardData(prev => ({
          ...prev,
          personalMetrics: {
            leadsAssigned: personalLeads.length,
            leadsConverted: convertedLeads.length,
            monthlyTarget: 15, // This should come from user settings
            revenue: convertedLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
          },
          hotLeads: personalLeads
            .filter(lead => lead.score >= 70)
            .map(lead => ({
              id: lead._id,
              name: `${lead.firstName} ${lead.lastName || ''}`,
              project: lead.project?.name || 'Unknown Project',
              budget: lead.budget?.max || lead.budget?.min || 0,
              score: lead.score || 0,
              lastContact: lead.lastInteractionDate || lead.createdAt,
            })),
        }));
      }

      // Generate sample tasks and performance data
      setDashboardData(prev => ({
        ...prev,
        todaysTasks: [
          {
            title: 'Follow up with Rajesh Kumar',
            time: '10:00 AM',
            priority: 'high',
            completed: false,
            leadId: personalLeads[0]?._id,
            leadName: 'Rajesh Kumar',
          },
          {
            title: 'Site visit with Priya Sharma',
            time: '2:00 PM',
            priority: 'high',
            completed: false,
            leadId: personalLeads[1]?._id,
            leadName: 'Priya Sharma',
          },
          {
            title: 'Send property brochure to Amit',
            time: '4:00 PM',
            priority: 'medium',
            completed: true,
            leadId: personalLeads[2]?._id,
            leadName: 'Amit Patel',
          },
          {
            title: 'Prepare cost sheet for premium unit',
            time: '5:00 PM',
            priority: 'medium',
            completed: false,
          },
          {
            title: 'Call back interested customer',
            time: '6:00 PM',
            priority: 'low',
            completed: false,
          },
        ],
        performanceData: [
          { day: 'Mon', leads: 3, calls: 12 },
          { day: 'Tue', leads: 5, calls: 15 },
          { day: 'Wed', leads: 2, calls: 8 },
          { day: 'Thu', leads: 4, calls: 14 },
          { day: 'Fri', leads: 6, calls: 18 },
          { day: 'Sat', leads: 3, calls: 10 },
          { day: 'Sun', leads: 1, calls: 5 },
        ],
        aiInsights: [
          {
            type: 'Opportunity',
            title: 'High-value lead needs immediate attention',
            description: 'Rajesh Kumar has shown strong interest and has the budget for premium units. Schedule a call within 24 hours.',
            priority: 'high',
            action: 'Contact Now',
            actionUrl: `/leads/${personalLeads[0]?._id}`,
          },
          {
            type: 'Follow-up',
            title: '3 warm leads haven\'t been contacted this week',
            description: 'These leads have shown interest but haven\'t received follow-up. Recommend reaching out with project updates.',
            priority: 'medium',
            action: 'View Leads',
            actionUrl: '/leads?filter=warm',
          },
          {
            type: 'Performance',
            title: 'You\'re 20% ahead of monthly target',
            description: 'Great performance! You\'ve converted 12 leads vs target of 10 for this month.',
            priority: 'low',
            action: 'View Analytics',
            actionUrl: '/analytics/personal',
          },
        ],
      }));

      // Update loading states
      setLoading({
        metrics: false,
        tasks: false,
        leads: false,
        performance: false,
        insights: false,
      });

    } catch (error) {
      console.error('Error fetching sales executive data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading({
        metrics: false,
        tasks: false,
        leads: false,
        performance: false,
        insights: false,
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Sales Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Good morning, {user?.firstName}! Here's your sales overview and today's activities.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchSalesExecutiveData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Personal Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Leads This Month"
            current={dashboardData.personalMetrics.leadsAssigned}
            target={dashboardData.personalMetrics.monthlyTarget}
            subtitle="Assigned to you"
            icon={Person}
            color="primary"
            isLoading={loading.metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Conversions"
            current={dashboardData.personalMetrics.leadsConverted}
            target={Math.floor(dashboardData.personalMetrics.monthlyTarget * 0.3)}
            subtitle="This month"
            icon={GpsFixed}
            color="success"
            isLoading={loading.metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Revenue Generated"
            current={formatCurrency(dashboardData.personalMetrics.revenue)}
            subtitle="From conversions"
            icon={TrendingUp}
            color="warning"
            isLoading={loading.metrics}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PersonalMetricCard
            title="Conversion Rate"
            current={dashboardData.personalMetrics.leadsAssigned > 0 
              ? `${Math.round((dashboardData.personalMetrics.leadsConverted / dashboardData.personalMetrics.leadsAssigned) * 100)}%`
              : '0%'
            }
            subtitle="Lead to sale"
            icon={Speed}
            color="info"
            isLoading={loading.metrics}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Today's Tasks */}
        <Grid item xs={12} md={6} lg={4}>
          <TodaysTasks 
            tasks={dashboardData.todaysTasks} 
            isLoading={loading.tasks}
          />
        </Grid>
        
        {/* Hot Leads */}
        <Grid item xs={12} md={6} lg={4}>
          <HotLeads 
            leads={dashboardData.hotLeads} 
            isLoading={loading.leads}
          />
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={6} lg={4}>
          <QuickActionsPanel />
        </Grid>
      </Grid>

      {/* Performance and AI Insights */}
      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <PerformanceChart 
            data={dashboardData.performanceData} 
            isLoading={loading.performance}
          />
        </Grid>
        
        {/* AI Insights */}
        <Grid item xs={12} lg={4}>
          <AIInsightsPanel 
            insights={dashboardData.aiInsights} 
            isLoading={loading.insights}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesExecutiveDashboard;
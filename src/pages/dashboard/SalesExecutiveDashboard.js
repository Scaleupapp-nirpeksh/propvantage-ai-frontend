import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Button, IconButton,
  Avatar, Chip, List, ListItem, ListItemText,
  ListItemAvatar, ListItemSecondaryAction, Divider, Alert,
  Badge, Tooltip, Paper, Stack,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Phone, Email, Assignment, Schedule, Visibility,
  Event, GpsFixed, CheckCircle, Warning, Refresh,
  MonetizationOn, PersonAdd, Business,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { leadAPI } from '../../services/api';
import { PageHeader, KPICard, ChartCard, EmptyState } from '../../components/common';
import { CHART_COLORS } from '../../constants/statusConfig';

const getScoreColor = (score) => {
  if (score >= 90) return 'error';
  if (score >= 75) return 'warning';
  return 'info';
};

const getScoreLabel = (score) => {
  if (score >= 90) return 'Hot';
  if (score >= 75) return 'Warm';
  return 'Cold';
};

// My Hot Leads Component
const MyHotLeads = ({ leads, isLoading }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLoading) {
    return <Card sx={{ height: '100%' }}><CardContent><Typography variant="body2" color="text.secondary">Loading leads...</Typography></CardContent></Card>;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.938rem' }}>My Priority Leads</Typography>
          <Badge badgeContent={leads.length} color="primary">
            <Button size="small" onClick={() => navigate('/leads')} endIcon={<Visibility sx={{ fontSize: 16 }} />}>
              View All
            </Button>
          </Badge>
        </Box>

        {leads.length > 0 ? (
          <List sx={{ maxHeight: 320, overflow: 'auto' }} dense>
            {leads.slice(0, 6).map((lead, idx) => (
              <React.Fragment key={lead._id}>
                <ListItem
                  sx={{ px: 0, cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.813rem' }}>
                      {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {lead.firstName} {lead.lastName}
                        </Typography>
                        <Chip label={getScoreLabel(lead.score)} size="small" color={getScoreColor(lead.score)} sx={{ height: 18, fontSize: '0.625rem' }} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {lead.project?.name} · Score: {lead.score}
                        {lead.followUpSchedule?.isOverdue && (
                          <Chip label={`Overdue ${lead.followUpSchedule.overdueBy}d`} size="small" color="error" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                        )}
                      </Typography>
                    }
                  />
                  {!isMobile && (
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.25}>
                        <IconButton size="small" color="primary"><Phone sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" color="primary"><Email sx={{ fontSize: 16 }} /></IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {idx < Math.min(leads.length, 6) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <EmptyState
            icon={Person}
            title="No leads assigned"
            description="Start by creating or getting assigned new leads"
            action={{ label: 'Create Lead', onClick: () => navigate('/leads/create') }}
            size="small"
          />
        )}
      </CardContent>
    </Card>
  );
};

// Follow-up Activities Component
const TodaysActivities = ({ leads, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <Card sx={{ height: '100%' }}><CardContent><Typography variant="body2" color="text.secondary">Loading activities...</Typography></CardContent></Card>;
  }

  const activities = leads
    .filter(lead => lead.followUpSchedule?.nextFollowUpDate)
    .slice(0, 8)
    .map(lead => ({
      id: lead._id,
      title: `${lead.followUpSchedule.followUpType}: ${lead.firstName} ${lead.lastName}`,
      type: lead.followUpSchedule.followUpType || 'call',
      time: lead.followUpSchedule.isOverdue
        ? `Overdue ${lead.followUpSchedule.overdueBy} days`
        : new Date(lead.followUpSchedule.nextFollowUpDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverdue: lead.followUpSchedule.isOverdue,
      notes: lead.followUpSchedule.notes,
    }));

  const overdueCount = activities.filter(a => a.isOverdue).length;

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'call': return <Phone sx={{ fontSize: 16 }} />;
      case 'email': return <Email sx={{ fontSize: 16 }} />;
      case 'meeting': return <Event sx={{ fontSize: 16 }} />;
      default: return <Assignment sx={{ fontSize: 16 }} />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.938rem' }}>Follow-up Activities</Typography>
          <Badge badgeContent={overdueCount} color="error">
            <Schedule sx={{ fontSize: 20 }} />
          </Badge>
        </Box>

        {activities.length > 0 ? (
          <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
            {activities.map((activity, idx) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  sx={{
                    px: 1, borderRadius: 1, mb: 0.5,
                    bgcolor: activity.isOverdue ? 'error.50' : 'transparent',
                    border: '1px solid', borderColor: activity.isOverdue ? 'error.light' : 'transparent',
                    cursor: 'pointer', '&:hover': { borderColor: 'divider' },
                  }}
                  onClick={() => navigate(`/leads/${activity.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: activity.isOverdue ? 'error.main' : 'primary.main' }}>
                      {getIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: activity.isOverdue ? 600 : 500, fontSize: '0.813rem' }} noWrap>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <Chip
                        size="small" label={activity.time}
                        color={activity.isOverdue ? 'error' : 'default'}
                        variant={activity.isOverdue ? 'filled' : 'outlined'}
                        sx={{ height: 20, fontSize: '0.688rem', mt: 0.25 }}
                      />
                    }
                  />
                </ListItem>
                {idx < activities.length - 1 && <Divider sx={{ my: 0.25 }} />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="All caught up!"
            description="No follow-ups scheduled"
            action={{ label: 'View Leads', onClick: () => navigate('/leads') }}
            size="small"
          />
        )}
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const SalesQuickActions = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actions = [
    { title: 'Create Lead', icon: PersonAdd, color: 'primary', onClick: () => navigate('/leads/create') },
    { title: 'All Leads', icon: Person, color: 'success', onClick: () => navigate('/leads') },
    { title: 'Projects', icon: Business, color: 'info', onClick: () => navigate('/projects') },
    { title: 'Book Sale', icon: MonetizationOn, color: 'warning', onClick: () => navigate('/sales/create') },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.938rem', mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={1.5}>
          {actions.map((action, idx) => (
            <Grid item xs={6} key={idx}>
              <Paper
                sx={{
                  p: isMobile ? 1.5 : 2, cursor: 'pointer', textAlign: 'center',
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  '&:hover': { borderColor: `${action.color}.main`, bgcolor: `${action.color}.50`, transform: 'translateY(-2px)' },
                  transition: 'all 0.2s',
                }}
                onClick={action.onClick}
              >
                <Avatar sx={{ bgcolor: `${action.color}.100`, color: `${action.color}.700`, mx: 'auto', mb: 1, width: 40, height: 40 }}>
                  <action.icon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>{action.title}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Pipeline Chart
const PersonalPipelineChart = ({ leads, isLoading }) => {
  const pipelineData = [];
  if (leads?.length > 0) {
    const counts = leads.reduce((acc, lead) => {
      const status = lead.status || 'New';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(counts).forEach(([name, value]) => pipelineData.push({ name, value }));
  }

  return (
    <ChartCard title="My Lead Pipeline" loading={isLoading} height={{ xs: 220, sm: 260, md: 300 }}>
      {pipelineData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value"
              label={({ name, value }) => `${name} (${value})`}>
              {pipelineData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState icon={GpsFixed} title="No pipeline data" size="small" />
      )}
    </ChartCard>
  );
};

// Main Dashboard
const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    personalMetrics: { leadsAssigned: 0, leadsConverted: 0, monthlyTarget: 15, overdueFollowUps: 0 },
    myLeads: [],
  });
  const [loading, setLoading] = useState({ metrics: true, leads: true });
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPersonalData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const [leadsResult] = await Promise.allSettled([leadAPI.getLeads()]);

      let myLeads = [];
      if (leadsResult.status === 'fulfilled') {
        const responseData = leadsResult.value.data;
        let allLeads = [];
        if (responseData.data?.leads) allLeads = responseData.data.leads;
        else if (responseData.leads) allLeads = responseData.leads;
        else if (Array.isArray(responseData.data)) allLeads = responseData.data;
        else if (Array.isArray(responseData)) allLeads = responseData;

        myLeads = allLeads.filter(lead =>
          lead.assignedTo && (lead.assignedTo._id === user?.id || lead.assignedTo._id === user?._id)
        );
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const leadsThisMonth = myLeads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const converted = myLeads.filter(l => ['Booked', 'Converted', 'Closed'].includes(l.status));
      const overdue = myLeads.filter(l => l.followUpSchedule?.isOverdue).length;

      setDashboardData({
        personalMetrics: { leadsAssigned: leadsThisMonth.length, leadsConverted: converted.length, monthlyTarget: 15, overdueFollowUps: overdue },
        myLeads: myLeads.sort((a, b) => (b.score || 0) - (a.score || 0)),
      });
      setLoading({ metrics: false, leads: false });
    } catch {
      setError('Failed to load dashboard data.');
      setLoading({ metrics: false, leads: false });
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    if (user?.id || user?._id) fetchPersonalData();
  }, [fetchPersonalData, user?.id, user?._id]);

  const { personalMetrics, myLeads } = dashboardData;

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="My Sales Dashboard"
        subtitle={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.firstName}!`}
        icon={Person}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchPersonalData(true)} disabled={refreshing}>
                <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" size="small" onClick={() => navigate('/leads')}>My Leads</Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => fetchPersonalData(true)}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* KPI Cards - responsive 2x2 on mobile, 4-across on desktop */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="This Month's Leads"
            value={personalMetrics.leadsAssigned}
            subtitle={`Target: ${personalMetrics.monthlyTarget}`}
            icon={Person} color="primary"
            loading={loading.metrics}
            onClick={() => navigate('/leads')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Conversions"
            value={personalMetrics.leadsConverted}
            subtitle={`Target: ${Math.floor(personalMetrics.monthlyTarget * 0.3)}`}
            icon={GpsFixed} color="success"
            loading={loading.metrics}
            onClick={() => navigate('/leads?status=booked')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Total Leads"
            value={myLeads.length}
            subtitle="All assigned"
            icon={Assignment} color="info"
            loading={loading.leads}
            onClick={() => navigate('/leads')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard
            title="Overdue Follow-ups"
            value={personalMetrics.overdueFollowUps}
            subtitle="Needs attention"
            icon={Warning} color="warning"
            loading={loading.metrics}
            onClick={() => navigate('/leads?filter=overdue')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid - responsive stacking */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <TodaysActivities leads={myLeads} isLoading={loading.leads} />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <MyHotLeads leads={myLeads} isLoading={loading.leads} />
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          <SalesQuickActions />
        </Grid>
      </Grid>

      {/* Pipeline Chart */}
      <PersonalPipelineChart leads={myLeads} isLoading={loading.leads} />
    </Box>
  );
};

export default SalesExecutiveDashboard;

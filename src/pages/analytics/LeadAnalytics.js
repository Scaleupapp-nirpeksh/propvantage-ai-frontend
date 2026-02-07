import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardHeader, Typography,
  IconButton, Alert, Stack, Tabs, Tab, Tooltip, LinearProgress,
  Skeleton, ToggleButton, ToggleButtonGroup, Avatar,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import {
  TrendingUp, Refresh, People, ShowChart, BarChart,
  Timeline as TimelineIcon, Person, Business, Analytics,
  EmojiEvents, Leaderboard, CheckCircle, Assessment,
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart as RechartsPieChart,
  Pie, Cell, ComposedChart, LineChart, Line,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI, userAPI } from '../../services/api';
import { PageHeader, KPICard, FilterBar } from '../../components/common';
import { CHART_COLORS } from '../../constants/statusConfig';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: '90',  label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
];

// Funnel order from top to bottom
const FUNNEL_STAGES = ['New', 'Contacted', 'Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getMonthLabel = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const getWeekLabel = (dateStr) => {
  const d = new Date(dateStr);
  const ws = new Date(d);
  ws.setDate(d.getDate() - d.getDay());
  return ws.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getDayLabel = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getAssigneeName = (lead) => {
  const a = lead?.assignedTo;
  if (!a) return 'Unassigned';
  return `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Unassigned';
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Hot';
  if (score >= 60) return 'Warm';
  if (score >= 40) return 'Cold';
  return 'Low';
};

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

const ChartTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1.5, minWidth: 140 }} elevation={3}>
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" sx={{ color: p.color }}>{p.name}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>{p.value}</Typography>
        </Box>
      ))}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab — trend + status breakdown
// ---------------------------------------------------------------------------

const OverviewTab = ({ leads, period, loading }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('area');

  const trendData = useMemo(() => {
    const grouped = {};
    const periodDays = parseInt(period) || 999;
    leads.forEach(lead => {
      const dateStr = lead.createdAt;
      let key;
      if (periodDays <= 30) key = getDayLabel(dateStr);
      else if (periodDays <= 180) key = getWeekLabel(dateStr);
      else key = getMonthLabel(dateStr);
      if (!grouped[key]) grouped[key] = { period: key, leads: 0 };
      grouped[key].leads += 1;
    });
    return Object.values(grouped);
  }, [leads, period]);

  const statusBreakdown = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.status || 'Unknown'] = (counts[l.status || 'Unknown'] || 0) + 1; });
    return Object.entries(counts).map(([name, value], i) => ({
      name, value, fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [leads]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}><Skeleton variant="rounded" height={380} /></Grid>
        <Grid item xs={12} md={4}><Skeleton variant="rounded" height={380} /></Grid>
      </Grid>
    );
  }

  const renderChart = () => {
    const gridLine = <CartesianGrid key="g" strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />;
    const xAxis = <XAxis key="x" dataKey="period" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />;
    const yAxis = <YAxis key="y" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />;
    const tip = <RechartsTooltip key="t" content={<ChartTooltipContent />} />;
    const leg = <Legend key="l" />;
    const common = [gridLine, xAxis, yAxis, tip, leg];

    if (chartType === 'area') {
      return (
        <AreaChart data={trendData}>
          {common}
          <Area type="monotone" dataKey="leads" name="Leads" fill={theme.palette.primary.main} fillOpacity={0.15} stroke={theme.palette.primary.main} strokeWidth={2} />
        </AreaChart>
      );
    }
    if (chartType === 'bar') {
      return (
        <RechartsBarChart data={trendData}>
          {common}
          <Bar dataKey="leads" name="Leads" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      );
    }
    return (
      <LineChart data={trendData}>
        {common}
        <Line type="monotone" dataKey="leads" name="Leads" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Lead Generation Trend</Typography>}
            action={
              <ToggleButtonGroup value={chartType} exclusive onChange={(e, v) => v && setChartType(v)} size="small">
                <ToggleButton value="area"><Tooltip title="Area"><ShowChart sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
                <ToggleButton value="bar"><Tooltip title="Bar"><BarChart sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
                <ToggleButton value="line"><Tooltip title="Line"><TimelineIcon sx={{ fontSize: 18 }} /></Tooltip></ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent sx={{ height: 340 }}>
            {trendData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No data for this period</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>{renderChart()}</ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Status Breakdown</Typography>} />
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {statusBreakdown.map(s => (
                    <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.fill }} />
                        <Typography variant="caption">{s.name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{s.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Funnel & Source Tab
// ---------------------------------------------------------------------------

const FunnelSourceTab = ({ leads, loading }) => {
  const theme = useTheme();

  // Funnel — count leads at each stage or beyond
  const funnelData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.status || 'Unknown'] = (counts[l.status || 'Unknown'] || 0) + 1; });
    return FUNNEL_STAGES.map((stage, i) => ({
      name: stage,
      count: counts[stage] || 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [leads]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const src = l.source || 'Unknown';
      if (!map[src]) map[src] = { name: src, count: 0, qualified: 0, booked: 0 };
      map[src].count += 1;
      if (['Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked'].includes(l.status)) map[src].qualified += 1;
      if (l.status === 'Booked') map[src].booked += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [leads]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Funnel */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Conversion Funnel</Typography>} />
          <CardContent sx={{ height: 380 }}>
            {funnelData.every(d => d.count === 0) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No funnel data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={funnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                    {funnelData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Source breakdown */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Lead Sources</Typography>} />
          <CardContent>
            {sourceData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No source data</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {sourceData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {sourceData.map((s, i) => {
                    const convRate = s.count > 0 ? ((s.qualified / s.count) * 100).toFixed(0) : 0;
                    return (
                      <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <Typography variant="caption">{s.name}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{s.count} ({convRate}% qualified)</Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Team & Project Tab
// ---------------------------------------------------------------------------

const TeamProjectTab = ({ leads, loading }) => {
  const theme = useTheme();
  const [view, setView] = useState('assignee');

  const data = useMemo(() => {
    const map = {};
    leads.forEach(lead => {
      let id, name;
      if (view === 'assignee') {
        id = lead.assignedTo?._id || 'unassigned';
        name = getAssigneeName(lead);
      } else {
        id = lead.project?._id || 'unknown';
        name = lead.project?.name || 'No Project';
      }
      if (!map[id]) map[id] = { id, name, total: 0, qualified: 0, booked: 0, lost: 0, avgScore: 0, scores: [] };
      map[id].total += 1;
      map[id].scores.push(lead.score || 0);
      if (['Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked'].includes(lead.status)) map[id].qualified += 1;
      if (lead.status === 'Booked') map[id].booked += 1;
      if (lead.status === 'Lost') map[id].lost += 1;
    });
    return Object.values(map)
      .map(p => ({
        ...p,
        avgScore: p.scores.length > 0 ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 0,
        qualRate: p.total > 0 ? ((p.qualified / p.total) * 100) : 0,
        convRate: p.total > 0 ? ((p.booked / p.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads, view]);

  if (loading) return <Skeleton variant="rounded" height={400} />;

  return (
    <Grid container spacing={3}>
      {/* Bar chart */}
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardHeader
            title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{view === 'assignee' ? 'Leads by Assignee' : 'Leads by Project'}</Typography>}
            action={
              <ToggleButtonGroup value={view} exclusive onChange={(e, v) => v && setView(v)} size="small">
                <ToggleButton value="assignee"><Person sx={{ fontSize: 18, mr: 0.5 }} /> People</ToggleButton>
                <ToggleButton value="project"><Business sx={{ fontSize: 18, mr: 0.5 }} /> Projects</ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent sx={{ height: 380 }}>
            {data.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <ResponsiveContainer>
                <RechartsBarChart data={data.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} stroke={theme.palette.text.secondary} tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="qualified" name="Qualified" fill={theme.palette.success.main} radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Rankings */}
      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardHeader title={<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Rankings</Typography>} />
          <CardContent sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>
            {data.slice(0, 10).map((p, i) => (
              <Box key={p.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: i < 3 ? 'primary.main' : 'grey.400' }}>
                    {i < 3 ? <EmojiEvents sx={{ fontSize: 16 }} /> : i + 1}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.total} lead{p.total !== 1 ? 's' : ''} &middot; Avg score: {p.avgScore}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 5.5 }}>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {p.qualRate.toFixed(0)}% qualified
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.convRate.toFixed(0)}% booked
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const LeadAnalytics = () => {
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    period: searchParams.get('period') || 'all',
    project: searchParams.get('project') || '',
    status: searchParams.get('status') || '',
  });

  const canView = canAccess?.leadManagement ? canAccess.leadManagement() : true;

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const params = { limit: 1000 };
      if (filters.project) params.project = filters.project;
      if (filters.status) params.status = filters.status;

      // Date filtering
      if (filters.period && filters.period !== 'all') {
        const days = parseInt(filters.period, 10);
        if (!isNaN(days)) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - days);
          params.dateFrom = startDate.toISOString();
          params.dateTo = endDate.toISOString();
        }
      }

      const [leadsResult, projectsResult, usersResult] = await Promise.allSettled([
        leadAPI.getLeads(params),
        projectAPI.getProjects(),
        canAccess?.userManagement?.() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (leadsResult.status === 'fulfilled') {
        const resp = leadsResult.value.data;
        setLeads(resp.data?.leads || resp.data || []);
      } else {
        setLeads([]);
      }

      if (projectsResult.status === 'fulfilled') {
        const d = projectsResult.value.data?.data || projectsResult.value.data || [];
        setProjects(Array.isArray(d) ? d : []);
      }

      if (usersResult.status === 'fulfilled') {
        const raw = usersResult.value.data?.data;
        const d = raw?.users || raw || [];
        setUsers(Array.isArray(d) ? d : []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load lead analytics. Please try again.');
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters.period, filters.project, filters.status, canAccess]);

  useEffect(() => { if (canView) fetchData(); }, [fetchData, canView]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.period && filters.period !== 'all') params.set('period', filters.period);
    if (filters.project) params.set('project', filters.project);
    if (filters.status) params.set('status', filters.status);
    setSearchParams(params, { replace: true });
  }, [filters.period, filters.project, filters.status, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: '', period: 'all', project: '', status: '' });

  // Client-side search
  const filteredLeads = useMemo(() => {
    if (!filters.search) return leads;
    const q = filters.search.toLowerCase();
    return leads.filter(l =>
      (`${l.firstName || ''} ${l.lastName || ''}`).toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.project?.name || '').toLowerCase().includes(q) ||
      (l.source || '').toLowerCase().includes(q)
    );
  }, [leads, filters.search]);

  // KPIs
  const totalLeads = filteredLeads.length;
  const qualifiedCount = filteredLeads.filter(l => ['Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked'].includes(l.status)).length;
  const bookedCount = filteredLeads.filter(l => l.status === 'Booked').length;
  const lostCount = filteredLeads.filter(l => l.status === 'Lost').length;
  const qualRate = totalLeads > 0 ? ((qualifiedCount / totalLeads) * 100).toFixed(1) : '0';
  const convRate = totalLeads > 0 ? ((bookedCount / totalLeads) * 100).toFixed(1) : '0';
  const avgScore = totalLeads > 0 ? Math.round(filteredLeads.reduce((s, l) => s + (l.score || 0), 0) / totalLeads) : 0;

  // Filter config
  const statusOptions = ['New', 'Contacted', 'Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Unqualified'];
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Search', placeholder: 'Search leads...' },
    { key: 'period', type: 'select', label: 'Period', options: TIME_PERIODS },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
    { key: 'status', type: 'select', label: 'Status', options: statusOptions.map(s => ({ value: s, label: s })) },
  ];

  // ---------------------------------------------------------------------------
  // Permission guard
  // ---------------------------------------------------------------------------

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to view lead analytics.</Alert>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box>
      <PageHeader
        title="Lead Analytics"
        subtitle="Lead generation, conversion and performance"
        icon={Leaderboard}
        actions={
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchData(true)} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      />

      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Total Leads" value={totalLeads} icon={People} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Qualified" value={qualifiedCount} icon={TrendingUp} color="success" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Booked" value={bookedCount} icon={CheckCircle} color="info" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Qual. Rate" value={`${qualRate}%`} icon={Analytics} color="warning" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Conv. Rate" value={`${convRate}%`} icon={Assessment} color="secondary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard title="Avg Score" value={avgScore} icon={EmojiEvents} color="primary" loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Tabs */}
      <Card variant="outlined" sx={{ mt: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Funnel & Sources" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Team & Projects" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && (
            <OverviewTab leads={filteredLeads} period={filters.period} loading={loading} />
          )}
          {activeTab === 1 && (
            <FunnelSourceTab leads={filteredLeads} loading={loading} />
          )}
          {activeTab === 2 && (
            <TeamProjectTab leads={filteredLeads} loading={loading} />
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default LeadAnalytics;

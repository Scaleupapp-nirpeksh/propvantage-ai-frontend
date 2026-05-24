// File: src/pages/cp-portal/CpPortalDashboardPage.js
// Description: SP5 — 5-card responsive dashboard per spec §7.3. Each card
//   combines a deterministic recharts visualisation with an embedded
//   <AIInsightCard surface="..." /> that surfaces the LLM commentary.
//
//   The legacy onboarding card (getting started / browse marketplace) is
//   preserved at the bottom for brand-new CP orgs that don't have analytics
//   data yet — the analytics cards naturally show 'insufficient_data' empty
//   states in that case.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Button, Skeleton,
} from '@mui/material';
import {
  TrendingUp, Payments, People, Domain, FactCheck, Storefront,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip as ReTooltip, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { cpAnalyticsAPI } from '../../services/api';
import AIInsightCard from '../../components/ai/AIInsightCard';
import AIQuotaIndicator from '../../components/ai/AIQuotaIndicator';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');
const inrRow = (byCurrency) =>
  (byCurrency || []).find((c) => c.currency === 'INR') || (byCurrency || [])[0] || null;

const DashCard = ({ title, icon: Icon, kpi, viewMoreLabel, viewMoreTo, children, navigate, embeddedSurface, range }) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>{title}</Typography>
        {viewMoreTo && (
          <Button size="small" onClick={() => navigate(viewMoreTo)} sx={{ textTransform: 'none' }}>
            {viewMoreLabel || 'View details'}
          </Button>
        )}
      </Stack>
      {kpi && <Box sx={{ mt: 1.5 }}>{kpi}</Box>}
      <Box sx={{ mt: 1.5 }}>{children}</Box>
      {embeddedSurface && <AIInsightCard surface={embeddedSurface} range={range} compact embedded />}
    </CardContent>
  </Card>
);

const CpPortalDashboardPage = () => {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [pipeline, setPipeline] = useState(null);
  const [commission, setCommission] = useState(null);
  const [agents, setAgents] = useState(null);
  const [developers, setDevelopers] = useState(null);
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setUsage] = useState(null);

  const canViewTeam = useMemo(() => {
    const perms = user?.role?.permissions || user?.permissions || [];
    return Array.isArray(perms) && perms.includes('cp_analytics:view_team');
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { range: '30d' };
    Promise.allSettled([
      cpAnalyticsAPI.getPipeline(params).then((r) => r.data?.data),
      cpAnalyticsAPI.getCommission(params).then((r) => r.data?.data),
      canViewTeam ? cpAnalyticsAPI.getAgents(params).then((r) => r.data?.data) : Promise.resolve(null),
      cpAnalyticsAPI.getDevelopers(params).then((r) => r.data?.data),
      cpAnalyticsAPI.getReconciliation(params).then((r) => r.data?.data),
    ]).then(([p, c, a, d, r]) => {
      if (cancelled) return;
      setPipeline(p.status === 'fulfilled' ? p.value : null);
      setCommission(c.status === 'fulfilled' ? c.value : null);
      setAgents(a.status === 'fulfilled' ? a.value : null);
      setDevelopers(d.status === 'fulfilled' ? d.value : null);
      setRecon(r.status === 'fulfilled' ? r.value : null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [canViewTeam]);

  const PipelineCard = () => {
    const funnel = pipeline?.breakdowns?.funnel || [];
    return (
      <DashCard title="Pipeline Health" icon={TrendingUp} navigate={navigate}
        viewMoreTo="/partner/prospects" viewMoreLabel="View prospects"
        embeddedSurface="pipeline_health" range="30d"
        kpi={
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box><Typography variant="caption" color="text.secondary">Total</Typography><Typography variant="h6">{pipeline?.summary?.totalProspects ?? '—'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Active</Typography><Typography variant="h6">{pipeline?.summary?.activeProspects ?? '—'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Aging &gt;30d</Typography><Typography variant="h6" color={pipeline?.summary?.agingOver30d ? 'warning.main' : 'text.primary'}>{pipeline?.summary?.agingOver30d ?? '—'}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Due today</Typography><Typography variant="h6" color={pipeline?.summary?.followUpsDueToday ? 'error.main' : 'text.primary'}>{pipeline?.summary?.followUpsDueToday ?? '—'}</Typography></Box>
          </Stack>
        }
      >
        {loading
          ? <Skeleton variant="rectangular" height={140} />
          : funnel.length > 0 && (
            <Box sx={{ height: 140 }}>
              <ResponsiveContainer><BarChart data={funnel}><XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} /><YAxis hide /><ReTooltip /><Bar dataKey="count" fill="#1e88e5" /></BarChart></ResponsiveContainer>
            </Box>
          )
        }
      </DashCard>
    );
  };

  const CommissionCard = () => {
    const inr = inrRow(commission?.summary?.byCurrency);
    const months = commission?.series?.byMonth || [];
    return (
      <DashCard title="Commission Overview" icon={Payments} navigate={navigate}
        viewMoreTo="/partner/commission" embeddedSurface="commission_overview" range="30d"
        kpi={
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box><Typography variant="caption" color="text.secondary">Received (INR)</Typography><Typography variant="h6" color="success.main">{fmtMoneyIN(inr?.received)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Expected</Typography><Typography variant="h6">{fmtMoneyIN(inr?.expected)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Outstanding</Typography><Typography variant="h6" color={inr?.outstanding ? 'warning.main' : 'text.primary'}>{fmtMoneyIN(inr?.outstanding)}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Realisation</Typography><Typography variant="h6">{fmtPct(inr?.realisationRate)}</Typography></Box>
          </Stack>
        }
      >
        {loading
          ? <Skeleton variant="rectangular" height={120} />
          : months.length > 0 && (
            <Box sx={{ height: 120 }}>
              <ResponsiveContainer><LineChart data={months}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis hide /><ReTooltip formatter={(v) => fmtMoneyIN(v)} /><Line type="monotone" dataKey="received" stroke="#43a047" /></LineChart></ResponsiveContainer>
            </Box>
          )
        }
      </DashCard>
    );
  };

  const AgentsCard = () => {
    if (!canViewTeam) return null;
    const top = (agents?.agents || []).slice(0, 5);
    return (
      <DashCard title="Agent Performance" icon={People} navigate={navigate}
        viewMoreTo="/partner/team" viewMoreLabel="Team page"
        embeddedSurface="agent_performance" range="30d"
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : top.length === 0
          ? <Typography variant="body2" color="text.secondary">No agent activity yet.</Typography>
          : top.map((a) => (
            <Stack key={String(a.userId)} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{a.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={`${a.prospectsBooked} booked`} />
                <Typography variant="caption" color="text.secondary">{fmtPct(a.conversionRate)} conv</Typography>
              </Stack>
            </Stack>
          ))
        }
      </DashCard>
    );
  };

  const DevelopersCard = () => {
    const top = (developers?.developers || []).slice(0, 5);
    const overall = developers?.overallConversion ?? 0;
    return (
      <DashCard title="Developer Performance" icon={Domain} navigate={navigate}
        viewMoreTo="/partner/developers/performance" embeddedSurface="developer_performance" range="30d"
        kpi={<Typography variant="caption" color="text.secondary">Overall conversion: <strong>{fmtPct(overall)}</strong></Typography>}
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : top.length === 0
          ? <Typography variant="body2" color="text.secondary">No developer activity yet.</Typography>
          : top.map((d) => (
            <Stack key={String(d.id || d.name)} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: 180 }}>
                <Typography variant="body2" noWrap>{d.name}</Typography>
                <Chip size="small" variant="outlined" label={d.context} sx={{ fontSize: '0.6rem' }} />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color={d.deltaVsOverall >= 0 ? 'success.main' : 'error.main'}>
                  {d.deltaVsOverall >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(d.deltaVsOverall || 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">{fmtPct(d.conversionRate)} conv</Typography>
              </Stack>
            </Stack>
          ))
        }
      </DashCard>
    );
  };

  const ReconciliationCard = () => {
    const s = recon?.summary || {};
    const donut = [
      { name: 'Matched',  value: s.matched   || 0, fill: '#43a047' },
      { name: 'CP only',  value: s.cpOnly    || 0, fill: '#fb8c00' },
      { name: 'Dev only', value: s.devOnly   || 0, fill: '#1e88e5' },
      { name: 'Mismatch', value: s.mismatched|| 0, fill: '#e53935' },
    ];
    const total = donut.reduce((sum, x) => sum + x.value, 0);
    return (
      <DashCard title="Commission Reconciliation" icon={FactCheck} navigate={navigate}
        viewMoreTo="/partner/commission/reconciliation" embeddedSurface="commission_reconciliation" range="30d"
        kpi={
          <Stack direction="row" spacing={2}>
            <Box><Typography variant="caption" color="text.secondary">Matched</Typography><Typography variant="h6" color="success.main">{s.matched ?? 0}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">CP only</Typography><Typography variant="h6" color="warning.main">{s.cpOnly ?? 0}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Dev only</Typography><Typography variant="h6">{s.devOnly ?? 0}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Mismatch</Typography><Typography variant="h6" color="error.main">{s.mismatched ?? 0}</Typography></Box>
          </Stack>
        }
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : total === 0
          ? <Typography variant="body2" color="text.secondary">No reconciliation rows yet — push prospects to start.</Typography>
          : <Box sx={{ height: 130 }}><ResponsiveContainer><PieChart><Pie data={donut} dataKey="value" innerRadius={30} outerRadius={50}>{donut.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Legend wrapperStyle={{ fontSize: '0.7rem' }} /></PieChart></ResponsiveContainer></Box>
        }
      </DashCard>
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Welcome, {user?.firstName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {organization?.name} · here's what's happening in the last 30 days.
          </Typography>
        </Box>
        <AIQuotaIndicator onUsageChange={setUsage} />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}><PipelineCard /></Grid>
        <Grid item xs={12} md={6} lg={4}><CommissionCard /></Grid>
        {canViewTeam && <Grid item xs={12} md={6} lg={4}><AgentsCard /></Grid>}
        <Grid item xs={12} md={6} lg={4}><DevelopersCard /></Grid>
        <Grid item xs={12} md={6} lg={4}><ReconciliationCard /></Grid>
      </Grid>

      <Card variant="outlined" sx={{ mt: 3, maxWidth: 640 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Storefront color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Find developers to partner with</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Discover real-estate developers, explore their portfolios, and apply to partner with them.
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/partner/marketplace')}>
            Browse marketplace
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CpPortalDashboardPage;

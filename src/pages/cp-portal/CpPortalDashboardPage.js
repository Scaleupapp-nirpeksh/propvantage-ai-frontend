// File: src/pages/cp-portal/CpPortalDashboardPage.js
// Description: SP5 — CP dashboard. 5-card responsive grid per spec §7.3
//   with UX hardening from real-prod feedback:
//
//   • Page-level quota banner instead of 4 per-card "quota reached" blocks
//   • Pipeline funnel: angled labels + truncated text so they don't collide
//   • Commission overview: single-month data shown as a stat, not a 1-dot
//     line chart
//   • Developer Performance: long names truncated + tooltipped
//   • Layout: 2-column on lg so 5 cards fit cleanly (2+2+1 spans the last
//     row across both halves) and rows have equal heights
//   • All cards stretch to the same height per row

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Button, Skeleton,
  Alert, AlertTitle, Tooltip as MuiTooltip, useTheme,
} from '@mui/material';
import {
  TrendingUp, Payments, People, Domain, FactCheck, Storefront, AutoAwesome,
} from '@mui/icons-material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip as ReTooltip, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { cpAnalyticsAPI } from '../../services/api';
import AIInsightCard from '../../components/ai/AIInsightCard';
import AIQuotaIndicator from '../../components/ai/AIQuotaIndicator';

// ─── Formatting helpers ───────────────────────────────────────────────────

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');
const inrRow = (byCurrency) =>
  (byCurrency || []).find((c) => c.currency === 'INR') || (byCurrency || [])[0] || null;

// Short labels for funnel stages so they fit on the x-axis.
const SHORT_STATUS = {
  'New':                  'New',
  'Contacted':            'Contacted',
  'Qualified':            'Qualified',
  'Site Visit Scheduled': 'Visit Sched',
  'Site Visit Completed': 'Visit Done',
  'Negotiating':          'Negotiating',
  'Booked':               'Booked',
};

// Truncate long developer names cleanly.
const truncate = (s, n = 22) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || '—');

// ─── Reusable card chrome ─────────────────────────────────────────────────

const DashCard = ({ title, icon: Icon, kpi, viewMoreLabel, viewMoreTo, children, navigate, embeddedSurface, range, quotaExhausted }) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: kpi ? 1.5 : 1 }}>
        <Icon color="primary" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1, fontSize: '0.95rem' }}>{title}</Typography>
        {viewMoreTo && (
          <Button size="small" onClick={() => navigate(viewMoreTo)} sx={{ textTransform: 'none', fontSize: '0.75rem', minWidth: 'auto', px: 1 }}>
            {viewMoreLabel || 'View details'}
          </Button>
        )}
      </Stack>
      {kpi && <Box>{kpi}</Box>}
      <Box sx={{ mt: 1.5, flexGrow: 1 }}>{children}</Box>
      {embeddedSurface && (
        <AIInsightCard
          surface={embeddedSurface}
          range={range}
          compact
          embedded
          quotaExhausted={quotaExhausted}
          suppressQuotaError={quotaExhausted}
        />
      )}
    </CardContent>
  </Card>
);

// Compact KPI tile.
const KPI = ({ label, value, color = 'text.primary' }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, color, mt: 0.25 }}>{value}</Typography>
  </Box>
);

// ─── Page ─────────────────────────────────────────────────────────────────

const CpPortalDashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, organization } = useAuth();

  const [pipeline, setPipeline] = useState(null);
  const [commission, setCommission] = useState(null);
  const [agents, setAgents] = useState(null);
  const [developers, setDevelopers] = useState(null);
  const [recon, setRecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);

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

  // Quota-exhausted state (drives the page banner + per-card suppression).
  const quotaExhausted = useMemo(() => {
    if (!usage) return false;
    const used = (usage.scheduledGenerations || 0) + (usage.onDemandGenerations || 0) + (usage.copilotMessages || 0);
    return used >= (usage.quota?.dailyQuota ?? 200);
  }, [usage]);

  // ─── Card-specific renderers ────────────────────────────────────────────

  const PipelineCard = () => {
    const funnel = (pipeline?.breakdowns?.funnel || []).map((f) => ({ ...f, short: SHORT_STATUS[f.status] || f.status }));
    return (
      <DashCard title="Pipeline Health" icon={TrendingUp} navigate={navigate}
        viewMoreTo="/partner/prospects" viewMoreLabel="Prospects"
        embeddedSurface="pipeline_health" range="30d" quotaExhausted={quotaExhausted}
        kpi={
          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            <KPI label="Total"      value={pipeline?.summary?.totalProspects ?? '—'} />
            <KPI label="Active"     value={pipeline?.summary?.activeProspects ?? '—'} />
            <KPI label="Aging >30d" value={pipeline?.summary?.agingOver30d ?? '—'}    color={pipeline?.summary?.agingOver30d ? 'warning.main' : 'text.primary'} />
            <KPI label="Due today"  value={pipeline?.summary?.followUpsDueToday ?? '—'} color={pipeline?.summary?.followUpsDueToday ? 'error.main' : 'text.primary'} />
          </Stack>
        }
      >
        {loading
          ? <Skeleton variant="rectangular" height={140} />
          : funnel.length > 0 && (
            <Box sx={{ height: 140 }}>
              <ResponsiveContainer>
                <BarChart data={funnel} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                  <XAxis
                    dataKey="short"
                    tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <ReTooltip cursor={{ fill: theme.palette.action.hover }} formatter={(v, _, ctx) => [v, ctx.payload.status]} />
                  <Bar dataKey="count" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
        viewMoreTo="/partner/commission" embeddedSurface="commission_overview" range="30d" quotaExhausted={quotaExhausted}
        kpi={
          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            <KPI label="Received (INR)" value={fmtMoneyIN(inr?.received)}     color="success.main" />
            <KPI label="Expected"       value={fmtMoneyIN(inr?.expected)} />
            <KPI label="Outstanding"    value={fmtMoneyIN(inr?.outstanding)}  color={inr?.outstanding ? 'warning.main' : 'text.primary'} />
            <KPI label="Realisation"    value={fmtPct(inr?.realisationRate)} />
          </Stack>
        }
      >
        {loading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : months.length >= 2 ? (
          <Box sx={{ height: 120 }}>
            <ResponsiveContainer>
              <LineChart data={months} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : v} />
                <ReTooltip formatter={(v) => fmtMoneyIN(v)} />
                <Line type="monotone" dataKey="received" stroke={theme.palette.success.main} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : months.length === 1 ? (
          // Single data point — show as a stat, not a degenerate 1-dot chart.
          <Box sx={{ height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">{months[0].month} received</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>{fmtMoneyIN(months[0].received)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>More history will appear after the next month.</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">No commission received in this period.</Typography>
          </Box>
        )}
      </DashCard>
    );
  };

  const AgentsCard = () => {
    if (!canViewTeam) return null;
    const top = (agents?.agents || []).slice(0, 5);
    return (
      <DashCard title="Agent Performance" icon={People} navigate={navigate}
        viewMoreTo="/partner/team" viewMoreLabel="Team page"
        embeddedSurface="agent_performance" range="30d" quotaExhausted={quotaExhausted}
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : top.length === 0
          ? <Typography variant="body2" color="text.secondary">No agent activity yet.</Typography>
          : <Stack spacing={0.5}>{top.map((a) => (
              <Stack key={String(a.userId)} direction="row" justifyContent="space-between" alignItems="center">
                <MuiTooltip title={a.name}><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{a.name}</Typography></MuiTooltip>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`${a.prospectsBooked} booked`} sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Typography variant="caption" color="text.secondary">{fmtPct(a.conversionRate)}</Typography>
                </Stack>
              </Stack>
            ))}</Stack>
        }
      </DashCard>
    );
  };

  const DevelopersCard = () => {
    const top = (developers?.developers || []).slice(0, 5);
    const overall = developers?.overallConversion ?? 0;
    return (
      <DashCard title="Developer Performance" icon={Domain} navigate={navigate}
        viewMoreTo="/partner/developers/performance" embeddedSurface="developer_performance" range="30d" quotaExhausted={quotaExhausted}
        kpi={<Typography variant="caption" color="text.secondary">Overall conversion: <strong>{fmtPct(overall)}</strong></Typography>}
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : top.length === 0
          ? <Typography variant="body2" color="text.secondary">No developer activity yet.</Typography>
          : <Stack spacing={0.5}>{top.map((d) => (
              <Stack key={String(d.id || d.name)} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
                  <MuiTooltip title={d.name}><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{truncate(d.name, 22)}</Typography></MuiTooltip>
                  <Chip size="small" variant="outlined" label={d.context} sx={{ fontSize: '0.6rem', height: 18 }} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color={d.deltaVsOverall >= 0 ? 'success.main' : 'error.main'}>
                    {d.deltaVsOverall >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(d.deltaVsOverall || 0))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{fmtPct(d.conversionRate)}</Typography>
                </Stack>
              </Stack>
            ))}</Stack>
        }
      </DashCard>
    );
  };

  const ReconciliationCard = () => {
    const s = recon?.summary || {};
    const donut = [
      { name: 'Matched',  value: s.matched   || 0, fill: theme.palette.success.main },
      { name: 'CP only',  value: s.cpOnly    || 0, fill: theme.palette.warning.main },
      { name: 'Dev only', value: s.devOnly   || 0, fill: theme.palette.info.main },
      { name: 'Mismatch', value: s.mismatched|| 0, fill: theme.palette.error.main },
    ];
    const total = donut.reduce((sum, x) => sum + x.value, 0);
    return (
      <DashCard title="Commission Reconciliation" icon={FactCheck} navigate={navigate}
        viewMoreTo="/partner/commission/reconciliation" embeddedSurface="commission_reconciliation" range="30d" quotaExhausted={quotaExhausted}
        kpi={
          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            <KPI label="Matched"    value={s.matched   ?? 0} color="success.main" />
            <KPI label="CP only"    value={s.cpOnly    ?? 0} color="warning.main" />
            <KPI label="Dev only"   value={s.devOnly   ?? 0} />
            <KPI label="Mismatch"   value={s.mismatched?? 0} color="error.main" />
          </Stack>
        }
      >
        {loading
          ? <Skeleton variant="rectangular" height={130} />
          : total === 0
          ? <Box sx={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">No reconciliation rows yet — push prospects to start.</Typography>
            </Box>
          : <Box sx={{ height: 130 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={30} outerRadius={50}>
                    {donut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
        }
      </DashCard>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Welcome, {user?.firstName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {organization?.name} · here's what's happening in the last 30 days.
          </Typography>
        </Box>
        <AIQuotaIndicator onUsageChange={setUsage} />
      </Stack>

      {/* Page-level quota banner — replaces the previous per-card error spam. */}
      {quotaExhausted && (
        <Alert
          severity="warning"
          icon={<AutoAwesome fontSize="small" />}
          sx={{ mb: 2 }}
          action={
            usage?.resetsAt && (
              <Typography variant="caption" sx={{ pr: 1 }}>
                Resets {new Date(usage.resetsAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )
          }
        >
          <AlertTitle sx={{ fontSize: '0.875rem' }}>AI commentary paused for today</AlertTitle>
          You've used your daily AI quota ({usage?.quota?.dailyQuota ?? 200} generations). The deterministic analytics below
          continue to work — only the AI narratives are paused until midnight IST.
        </Alert>
      )}

      {/*
        Layout strategy:
          xs (mobile): 1 column
          md (tablet): 2 columns → 2+2+1 (last card spans full width)
          lg (desktop): the 5-card grid; the 5th card spans the half-row gap
        Reconciliation gets explicit md=12 / lg=4 so it doesn't sit alone in
        a row with empty space to its right.
      */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} md={6} lg={4}><PipelineCard /></Grid>
        <Grid item xs={12} md={6} lg={4}><CommissionCard /></Grid>
        {canViewTeam && <Grid item xs={12} md={6} lg={4}><AgentsCard /></Grid>}
        <Grid item xs={12} md={6} lg={4}><DevelopersCard /></Grid>
        <Grid item xs={12} md={12} lg={canViewTeam ? 8 : 4}><ReconciliationCard /></Grid>
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

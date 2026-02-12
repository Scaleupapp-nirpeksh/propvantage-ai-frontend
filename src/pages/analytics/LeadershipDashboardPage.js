import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Tabs, Tab, Chip, Alert, AlertTitle,
  LinearProgress, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails, IconButton,
  Tooltip, Select, MenuItem, FormControl, InputLabel, Skeleton, Divider,
  useTheme, alpha, Stack,
} from '@mui/material';
import {
  Leaderboard, Business, Apartment, AccountBalance, TrendingUp, AttachMoney,
  AccountBalanceWallet, HourglassEmpty, Warning, People, Whatshot, MonetizationOn,
  Engineering, Receipt, Handshake, TaskAlt, Group, ExpandMore, Refresh, EmojiEvents,
  CheckCircle, Star, ReportProblem,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';

import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/common/KPICard';
import ChartCard from '../../components/common/ChartCard';
import EmptyState from '../../components/common/EmptyState';
import { leadershipAPI } from '../../services/api';
import { fmtCurrency } from '../../utils/formatters';

// ─── Constants ───────────────────────────────────────────────────────────────

const PERIODS = [
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 365, label: 'This Year' },
];

const SORT_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'sales', label: 'Sales' },
  { value: 'construction', label: 'Construction' },
  { value: 'collection', label: 'Collection' },
];

const PHASE_ORDER = [
  'Pre-Construction', 'Foundation Phase', 'Structure Phase', 'MEP Phase',
  'Finishing Phase', 'Inspection Phase', 'Handover Phase',
];

const UNIT_STATUS_COLORS = {
  available: '#43a047', booked: '#1e88e5', sold: '#00695c', blocked: '#e53935',
};

const PROJECT_STATUS_COLORS = {
  'planning': '#78909c', 'pre-launch': '#8e24aa', 'launched': '#43a047',
  'under-construction': '#1e88e5', 'completed': '#00695c', 'on-hold': '#fb8c00',
};

const TASK_PRIORITY_COLORS = {
  Critical: '#e53935', High: '#fb8c00', Medium: '#1e88e5', Low: '#78909c',
};

const TASK_STATUS_COLORS = {
  Open: '#1e88e5', 'In Progress': '#fb8c00', 'Under Review': '#8e24aa',
  Completed: '#43a047', 'On Hold': '#78909c', Cancelled: '#e53935',
};

const ALERT_SEVERITY_MAP = { critical: 'error', warning: 'warning', info: 'info' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const safeEntries = (obj) => Object.entries(obj || {});
const safeVal = (v) => v ?? 0;

const getThresholdColor = (value, good, warn) =>
  value >= good ? 'success.main' : value >= warn ? 'warning.main' : 'error.main';

const getThresholdMui = (value, good, warn) =>
  value >= good ? 'success' : value >= warn ? 'warning' : 'error';

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    {Icon && <Icon sx={{ fontSize: 24, color: 'primary.main' }} />}
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
  </Box>
);

// ─── Metric Row (for comparison cards) ───────────────────────────────────────

const MetricRow = ({ label, value, color, bold }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 600, color: color || 'text.primary' }}>
      {value}
    </Typography>
  </Box>
);

// ─── Progress Bar with Label ─────────────────────────────────────────────────

const ProgressWithLabel = ({ value, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <LinearProgress
      variant="determinate"
      value={Math.min(safeVal(value), 100)}
      color={color || 'primary'}
      sx={{ flex: 1, height: 6, borderRadius: 3 }}
    />
    <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
      {safeVal(value).toFixed(1)}%
    </Typography>
  </Box>
);

// ─── Record-to-Chart-Data converter ──────────────────────────────────────────

const recordToChartData = (record, colorMap) =>
  safeEntries(record).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: typeof value === 'object' ? (value.count || value.amount || 0) : value,
    fill: colorMap?.[key] || undefined,
  }));

// =============================================================================
// OVERVIEW TAB SECTIONS
// =============================================================================

// ─── 1. Portfolio Section ────────────────────────────────────────────────────

const PortfolioSection = ({ data, loading, chartColors }) => {
  const p = data || {};
  const unitData = useMemo(() => recordToChartData(p.unitsByStatus, UNIT_STATUS_COLORS), [p.unitsByStatus]);
  const projectData = useMemo(() => recordToChartData(p.projectsByStatus, PROJECT_STATUS_COLORS), [p.projectsByStatus]);

  return (
    <Box>
      <SectionHeader icon={Business} title="Portfolio Overview" subtitle="Current snapshot of all projects and units" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Total Projects', value: safeVal(p.totalProjects), icon: Business, color: 'primary' },
          { title: 'Total Units', value: safeVal(p.totalUnits), icon: Apartment, color: 'info' },
          { title: 'Inventory Value', value: fmtCurrency(safeVal(p.totalInventoryValue)), icon: AccountBalance, color: 'success' },
          { title: 'Target Revenue', value: fmtCurrency(safeVal(p.totalTargetRevenue)), icon: TrendingUp, color: 'warning' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Unit Distribution" height={{ xs: 220, md: 280 }} loading={loading}>
            {unitData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={unitData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={2}>
                      {unitData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill || chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: -1 }}>
                  {unitData.map((d, i) => (
                    <Chip key={d.name} size="small" label={`${d.name}: ${d.value}`}
                      sx={{ bgcolor: alpha(d.fill || chartColors[i % chartColors.length], 0.12), fontWeight: 600, fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </>
            ) : (
              <EmptyState title="No units" description="No units created yet" size="small" />
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Projects by Status" height={{ xs: 220, md: 280 }} loading={loading}>
            {projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {projectData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || chartColors[i % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No projects" description="No projects created yet" size="small" />
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── 2. Revenue Section ──────────────────────────────────────────────────────

const RevenueSection = ({ data, loading, period, chartColors }) => {
  const barData = useMemo(() => [{
    name: 'Revenue',
    Collected: safeVal(data?.totalCollected),
    Outstanding: safeVal(data?.totalOutstanding) - safeVal(data?.totalOverdue),
    Overdue: safeVal(data?.totalOverdue),
  }], [data]);
  const r = data || {};

  return (
    <Box>
      <SectionHeader icon={AttachMoney} title="Revenue & Collections" subtitle="Financial health across the organization" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Total Sales Value', value: fmtCurrency(safeVal(r.totalSalesValue)), subtitle: `${safeVal(r.totalSalesCount)} sales`, icon: AttachMoney, color: 'primary' },
          { title: 'Total Collected', value: fmtCurrency(safeVal(r.totalCollected)), subtitle: `${safeVal(r.collectionRate).toFixed(1)}% rate`, icon: AccountBalanceWallet, color: 'success' },
          { title: 'Outstanding', value: fmtCurrency(safeVal(r.totalOutstanding)), icon: HourglassEmpty, color: 'warning' },
          { title: 'Overdue', value: fmtCurrency(safeVal(r.totalOverdue)), subtitle: `${safeVal(r.overdueInstallmentCount)} installments`, icon: Warning, color: 'error' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)', color: '#fff' }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)' }}>This Period ({period} days)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
                {fmtCurrency(safeVal(r.periodSalesValue))}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {safeVal(r.periodSalesCount)} new bookings
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                {fmtCurrency(safeVal(r.periodCollected))} collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <ChartCard title="Revenue Breakdown" height={{ xs: 180, md: 220 }} loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmtCurrency(v)} />
                <YAxis type="category" dataKey="name" width={70} />
                <RechartsTooltip formatter={(v) => fmtCurrency(v)} />
                <Legend />
                <Bar dataKey="Collected" stackId="a" fill={chartColors[1]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Outstanding" stackId="a" fill={chartColors[2]} />
                <Bar dataKey="Overdue" stackId="a" fill={chartColors[5]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {safeVal(r.collectionRate) > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Collection Rate</Typography>
            <Typography variant="body2" fontWeight={600}>{safeVal(r.collectionRate).toFixed(1)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={Math.min(safeVal(r.collectionRate), 100)}
            color={getThresholdMui(r.collectionRate, 70, 40)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
    </Box>
  );
};

// ─── 3. Sales Pipeline Section ───────────────────────────────────────────────

const SalesPipelineSection = ({ data, loading, chartColors }) => {
  const s = data || {};

  const funnelData = useMemo(() => {
    const order = ['New', 'Contacted', 'Qualified', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiating', 'Booked'];
    return order.map((stage, i) => ({
      name: stage, count: safeVal(s.leadsByStatus?.[stage]), fill: chartColors[i % chartColors.length],
    }));
  }, [s.leadsByStatus, chartColors]);

  const sourceData = useMemo(() => recordToChartData(s.leadsBySource), [s.leadsBySource]);

  return (
    <Box>
      <SectionHeader icon={People} title="Sales Pipeline" subtitle="Lead funnel and conversion metrics" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Total Leads', value: safeVal(s.totalLeads), icon: People, color: 'primary' },
          { title: 'Hot Leads', value: safeVal(s.hotLeads), subtitle: 'Score ≥ 70', icon: Whatshot, color: 'error' },
          { title: 'Conversion Rate', value: `${safeVal(s.conversionRate).toFixed(1)}%`, icon: TrendingUp, color: 'success' },
          { title: 'Avg Booking Value', value: fmtCurrency(safeVal(s.avgBookingValue)), icon: MonetizationOn, color: 'info' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {/* Lead Score Gauge */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Average Lead Score</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                <CircularProgress
                  variant="determinate" value={safeVal(s.avgLeadScore)} size={140} thickness={6}
                  sx={{ color: (t) => getThresholdColor(s.avgLeadScore, 70, 40) }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>{safeVal(s.avgLeadScore).toFixed(0)}</Typography>
                  <Typography variant="caption" color="text.secondary">/ 100</Typography>
                </Box>
              </Box>
              {safeVal(s.overdueFollowUps) > 0 && (
                <Chip icon={<Warning />} label={`${s.overdueFollowUps} overdue follow-ups`} color="warning" size="small" sx={{ mt: 1 }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Lead Funnel */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Lead Pipeline" height={{ xs: 260, md: 300 }} loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Lead Sources */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Lead Sources" height={{ xs: 260, md: 300 }} loading={loading}>
            {sourceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2}>
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {sourceData.map((d, i) => (
                    <Chip key={d.name} size="small" label={`${d.name}: ${d.value}`}
                      sx={{ fontSize: '0.65rem', bgcolor: alpha(chartColors[i % chartColors.length], 0.12), fontWeight: 600 }} />
                  ))}
                </Box>
              </>
            ) : (
              <EmptyState title="No leads" description="No lead source data yet" size="small" />
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── 4. Construction Section ─────────────────────────────────────────────────

const ConstructionSection = ({ data, loading }) => {
  const c = data || {};
  const cv = c.costVariance || {};
  const variancePct = safeVal(cv.variancePercent);

  return (
    <Box>
      <SectionHeader icon={Engineering} title="Construction Progress" subtitle="Milestone tracking and cost analysis" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {/* Overall Progress Gauge */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Overall Progress</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                <CircularProgress
                  variant="determinate" value={safeVal(c.overallProgress)} size={160} thickness={7}
                  sx={{ color: 'primary.main' }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>{safeVal(c.overallProgress).toFixed(1)}%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Variance */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Cost Variance</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Budgeted</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmtCurrency(safeVal(cv.planned))}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Actual Spent</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmtCurrency(safeVal(cv.actual))}</Typography>
              </Box>
              <Chip
                label={`${variancePct >= 0 ? '+' : ''}${variancePct.toFixed(1)}% variance`}
                color={variancePct > 10 ? 'error' : variancePct > 0 ? 'warning' : 'success'}
                size="small" sx={{ fontWeight: 600 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Mini KPIs */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={1.5}>
            {[
              { title: 'Delayed', value: safeVal(c.delayedCount), icon: Warning, color: 'error' },
              { title: 'Open Issues', value: safeVal(c.openIssues), icon: ReportProblem, color: 'warning' },
              { title: 'Contractors', value: safeVal(c.activeContractors), icon: Engineering, color: 'info' },
              { title: 'Avg Rating', value: `${safeVal(c.avgContractorRating).toFixed(1)} ★`, icon: Star, color: 'success' },
            ].map((kpi) => (
              <Grid item xs={6} key={kpi.title}>
                <KPICard {...kpi} loading={loading} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Phase Progress Table */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Construction Phases</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Phase</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Completed</TableCell>
                  <TableCell align="center">In Progress</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PHASE_ORDER.map((phase) => {
                  const pd = c.milestonesByPhase?.[phase];
                  if (!pd) return null;
                  return (
                    <TableRow key={phase}>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.813rem' }}>{phase}</TableCell>
                      <TableCell align="center">{pd.total}</TableCell>
                      <TableCell align="center">{pd.completed}</TableCell>
                      <TableCell align="center">{pd.inProgress}</TableCell>
                      <TableCell>
                        <ProgressWithLabel value={pd.avgProgress} color={getThresholdMui(pd.avgProgress, 80, 40)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

// ─── 5. Invoicing Section ────────────────────────────────────────────────────

const InvoicingSection = ({ data, loading, chartColors }) => {
  const inv = data || {};
  const statusData = useMemo(() => recordToChartData(inv.invoicesByStatus), [inv.invoicesByStatus]);

  return (
    <Box>
      <SectionHeader icon={Receipt} title="Invoicing" subtitle="Invoice status and payment tracking" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Total Invoiced', value: fmtCurrency(safeVal(inv.totalInvoiced)), icon: Receipt, color: 'primary' },
          { title: 'Paid', value: fmtCurrency(safeVal(inv.totalPaid)), icon: CheckCircle, color: 'success' },
          { title: 'Pending', value: fmtCurrency(safeVal(inv.totalPending)), icon: HourglassEmpty, color: 'warning' },
          { title: 'Overdue', value: fmtCurrency(safeVal(inv.totalOverdue)), subtitle: `${safeVal(inv.overdueCount)} invoices`, icon: Warning, color: 'error' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {safeVal(inv.periodInvoiceCount) > 0 && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', bgcolor: alpha('#039be5', 0.06) }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">This Period</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, my: 1, color: 'info.main' }}>
                  {inv.periodInvoiceCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invoices worth {fmtCurrency(safeVal(inv.periodInvoiceValue))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid item xs={12} md={safeVal(inv.periodInvoiceCount) > 0 ? 8 : 12}>
          <ChartCard title="Invoice Status" height={{ xs: 220, md: 260 }} loading={loading}>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {statusData.map((d, i) => (
                    <Chip key={d.name} size="small" label={`${d.name}: ${d.value}`}
                      sx={{ fontSize: '0.65rem', bgcolor: alpha(chartColors[i % chartColors.length], 0.12), fontWeight: 600 }} />
                  ))}
                </Box>
              </>
            ) : (
              <EmptyState title="No invoices" description="No invoices generated yet" size="small" />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {safeVal(inv.overdueCount) > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Overdue Invoices</AlertTitle>
          {inv.overdueCount} invoice(s) overdue totaling {fmtCurrency(safeVal(inv.totalOverdue))}
        </Alert>
      )}
    </Box>
  );
};

// ─── 6. Channel Partner Section ──────────────────────────────────────────────

const ChannelPartnerSection = ({ data, loading, chartColors }) => {
  const cp = data || {};
  const statusData = useMemo(() => {
    return safeEntries(cp.commissionsByStatus).map(([status, detail]) => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: typeof detail === 'object' ? safeVal(detail.amount) : safeVal(detail),
      count: typeof detail === 'object' ? safeVal(detail.count) : 0,
    }));
  }, [cp.commissionsByStatus]);

  return (
    <Box>
      <SectionHeader icon={Handshake} title="Channel Partners" subtitle="Commission tracking and payout status" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Gross Commissions', value: fmtCurrency(safeVal(cp.totalGrossCommissions)), icon: MonetizationOn, color: 'primary' },
          { title: 'Net Commissions', value: fmtCurrency(safeVal(cp.totalNetCommissions)), icon: AttachMoney, color: 'info' },
          { title: 'Paid Out', value: fmtCurrency(safeVal(cp.totalPaid)), icon: CheckCircle, color: 'success' },
          { title: 'Pending Payout', value: fmtCurrency(safeVal(cp.totalPending)), icon: HourglassEmpty, color: 'warning' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {statusData.length > 0 && (
        <ChartCard title="Commission by Status" height={{ xs: 200, md: 240 }} loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => fmtCurrency(v)} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <RechartsTooltip formatter={(v) => fmtCurrency(v)} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </Box>
  );
};

// ─── 7. Operations Section ───────────────────────────────────────────────────

const OperationsSection = ({ data, loading, chartColors }) => {
  const ops = data || {};
  const statusData = useMemo(() => recordToChartData(ops.tasksByStatus, TASK_STATUS_COLORS), [ops.tasksByStatus]);
  const priorityData = useMemo(() =>
    safeEntries(ops.tasksByPriority).map(([k, v]) => ({ name: k, count: v, fill: TASK_PRIORITY_COLORS[k] || '#78909c' })),
  [ops.tasksByPriority]);
  const categoryData = useMemo(() => recordToChartData(ops.tasksByCategory), [ops.tasksByCategory]);

  return (
    <Box>
      <SectionHeader icon={TaskAlt} title="Operations" subtitle="Task management overview" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { title: 'Created (Period)', value: safeVal(ops.periodCreated), icon: TaskAlt, color: 'primary' },
          { title: 'Completed (Period)', value: safeVal(ops.periodCompleted), icon: CheckCircle, color: 'success' },
          { title: 'Overdue Tasks', value: safeVal(ops.overdueCount), icon: Warning, color: 'error' },
          { title: 'Escalated', value: safeVal(ops.escalatedCount), icon: ReportProblem, color: 'warning' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.title}>
            <KPICard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12} md={4}>
          <ChartCard title="Tasks by Status" height={{ xs: 220, md: 260 }} loading={loading}>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill || chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {statusData.map((d, i) => (
                    <Chip key={d.name} size="small" label={`${d.name}: ${d.value}`}
                      sx={{ fontSize: '0.65rem', bgcolor: alpha(d.fill || chartColors[i % chartColors.length], 0.12), fontWeight: 600 }} />
                  ))}
                </Box>
              </>
            ) : (
              <EmptyState title="No tasks" size="small" />
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="Tasks by Priority" height={{ xs: 220, md: 260 }} loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="Tasks by Category" height={{ xs: 220, md: 260 }} loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── 8. Team Section ─────────────────────────────────────────────────────────

const TeamSection = ({ data, loading, chartColors }) => {
  const t = data || {};
  const roleData = useMemo(() =>
    safeEntries(t.usersByRole).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count),
  [t.usersByRole]);

  return (
    <Box>
      <SectionHeader icon={Group} title="Team" subtitle="User workload and role distribution" />
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <KPICard title="Active Users" value={safeVal(t.activeUsers)} icon={Group} color="primary" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Users by Role" height={{ xs: 280, md: 320 }} loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Bar dataKey="count" fill={chartColors[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Top Workload</Typography>
              {(t.topWorkload || []).length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Open Tasks</TableCell>
                        <TableCell sx={{ minWidth: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(t.topWorkload || []).map((user, i) => {
                        const maxTasks = t.topWorkload[0]?.openTasks || 1;
                        return (
                          <TableRow key={user.userId}>
                            <TableCell sx={{ fontWeight: 600, color: i < 3 ? 'primary.main' : 'text.secondary' }}>{i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                            <TableCell align="right">{user.openTasks}</TableCell>
                            <TableCell>
                              <LinearProgress
                                variant="determinate"
                                value={(user.openTasks / maxTasks) * 100}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <EmptyState title="No workload data" size="small" />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// =============================================================================
// PROJECT COMPARISON TAB
// =============================================================================

// ─── Tower Drill-Down ────────────────────────────────────────────────────────

const TowerDrillDown = ({ towers }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tower</TableCell>
          <TableCell align="center">Units</TableCell>
          <TableCell>Status</TableCell>
          <TableCell sx={{ minWidth: 120 }}>Construction</TableCell>
          <TableCell align="right">Budget</TableCell>
          <TableCell align="right">Actual Cost</TableCell>
          <TableCell align="right">Revenue Target</TableCell>
          <TableCell align="right">Revenue Achieved</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {towers.map((tower) => (
          <TableRow key={tower.towerId}>
            <TableCell sx={{ fontWeight: 600 }}>
              {tower.name}
              <Typography variant="caption" display="block" color="text.secondary">{tower.code}</Typography>
            </TableCell>
            <TableCell align="center">{tower.totalUnits}</TableCell>
            <TableCell>
              <Chip
                label={tower.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha(PROJECT_STATUS_COLORS[tower.status?.replace(/_/g, '-')] || '#78909c', 0.12) }}
              />
            </TableCell>
            <TableCell>
              <ProgressWithLabel value={tower.constructionProgress} color={getThresholdMui(tower.constructionProgress, 80, 40)} />
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{fmtCurrency(safeVal(tower.financials?.constructionCost?.budgeted))}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{fmtCurrency(safeVal(tower.financials?.constructionCost?.actual))}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{fmtCurrency(safeVal(tower.financials?.revenueTarget))}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{fmtCurrency(safeVal(tower.financials?.revenueAchieved))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ─── Project Comparison Card ─────────────────────────────────────────────────

const ProjectComparisonCard = ({ project, isBest }) => {
  const theme = useTheme();
  const p = project;
  const inv = p.inventory || {};
  const rev = p.revenue || {};
  const sp = p.salesPipeline || {};
  const con = p.construction || {};
  const invoicing = p.invoicing || {};
  const cp = p.channelPartner || {};
  const tasks = p.tasks || {};

  return (
    <Card sx={{
      flex: { xs: '0 0 320px', md: '1 1 0' },
      minWidth: { xs: 320, md: 0 },
      border: '1px solid',
      borderColor: 'divider',
      transition: theme.custom?.transitions?.normal || '250ms ease',
      '&:hover': { borderColor: 'primary.light', boxShadow: theme.custom?.elevation?.cardHover },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{p.name}</Typography>
            <Chip label={p.type} size="small" sx={{ mt: 0.5, fontSize: '0.65rem', textTransform: 'capitalize' }} />
          </Box>
          <Chip
            label={p.status?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            size="small"
            sx={{
              fontWeight: 600, fontSize: '0.7rem',
              bgcolor: alpha(PROJECT_STATUS_COLORS[p.status] || '#78909c', 0.12),
              color: PROJECT_STATUS_COLORS[p.status] || '#78909c',
            }}
          />
        </Box>

        {/* Inventory */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Inventory</Typography>
        <MetricRow label="Total Units" value={safeVal(inv.totalUnits)} />
        <MetricRow label="Available / Booked / Sold" value={`${safeVal(inv.available)} / ${safeVal(inv.booked)} / ${safeVal(inv.sold)}`} />
        <Box sx={{ mb: 1.5 }}>
          <MetricRow label="Occupancy" value={`${safeVal(inv.occupancyRate).toFixed(1)}%`} />
          <LinearProgress variant="determinate" value={Math.min(safeVal(inv.occupancyRate), 100)} color={getThresholdMui(inv.occupancyRate, 70, 30)} sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Revenue */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Revenue</Typography>
        <MetricRow label="Target" value={fmtCurrency(safeVal(rev.targetRevenue))} />
        <MetricRow label="Actual" value={fmtCurrency(safeVal(rev.actualRevenue))} bold />
        <Box sx={{ mb: 1 }}>
          <MetricRow label="Achievement" value={`${safeVal(rev.achievementRate).toFixed(1)}%`} color={getThresholdColor(rev.achievementRate, 50, 20)} />
          <LinearProgress variant="determinate" value={Math.min(safeVal(rev.achievementRate), 100)} color={getThresholdMui(rev.achievementRate, 50, 20)} sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
        </Box>
        <MetricRow label="Collection Efficiency" value={`${safeVal(rev.collectionEfficiency).toFixed(1)}%`} color={getThresholdColor(rev.collectionEfficiency, 70, 40)} />
        {safeVal(rev.overdueAmount) > 0 && (
          <MetricRow label="Overdue" value={fmtCurrency(rev.overdueAmount)} color="error.main" />
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Sales Pipeline */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Sales</Typography>
        <MetricRow label="Total Leads" value={safeVal(sp.totalLeads)} />
        <MetricRow label="Qualified" value={safeVal(sp.qualifiedLeads)} />
        <MetricRow label="Conversion" value={`${safeVal(sp.conversionRate).toFixed(1)}%`} color={getThresholdColor(sp.conversionRate, 15, 5)} />
        <MetricRow label="Avg Sale Price" value={fmtCurrency(safeVal(sp.avgSalePrice))} />

        <Divider sx={{ my: 1.5 }} />

        {/* Construction */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Construction</Typography>
        {safeVal(con.totalMilestones) > 0 ? (
          <>
            <Box sx={{ mb: 1 }}>
              <MetricRow label="Progress" value={`${safeVal(con.overallProgress).toFixed(1)}%`} />
              <LinearProgress variant="determinate" value={Math.min(safeVal(con.overallProgress), 100)} sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />
            </Box>
            {safeVal(con.delayed) > 0 && (
              <Chip icon={<Warning />} label={`${con.delayed} delayed`} color="error" size="small" sx={{ mb: 0.5, fontSize: '0.7rem' }} />
            )}
            <MetricRow label="Cost Variance" value={`${safeVal(con.costVariance?.variancePercent).toFixed(1)}%`}
              color={con.costVariance?.variancePercent > 10 ? 'error.main' : con.costVariance?.variancePercent > 0 ? 'warning.main' : 'success.main'} />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>Not started</Typography>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Invoicing + CP + Tasks (compact) */}
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Other Metrics</Typography>
        <MetricRow label="Invoiced / Paid" value={`${fmtCurrency(safeVal(invoicing.totalInvoiced))} / ${fmtCurrency(safeVal(invoicing.totalPaid))}`} />
        {safeVal(invoicing.overdueCount) > 0 && (
          <MetricRow label="Overdue Invoices" value={`${invoicing.overdueCount} (${fmtCurrency(safeVal(invoicing.overdueAmount))})`} color="error.main" />
        )}
        <MetricRow label="CP Sales" value={safeVal(cp.salesViaCp)} />
        <MetricRow label="Tasks (Open/Overdue)" value={`${safeVal(tasks.open)} / ${safeVal(tasks.overdue)}`}
          color={safeVal(tasks.overdue) > 0 ? 'error.main' : undefined} />

        {/* Tower Drill-Down */}
        {(p.towers || []).length > 0 && (
          <Accordion sx={{ mt: 2, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Towers ({p.towers.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TowerDrillDown towers={p.towers} />
            </AccordionDetails>
          </Accordion>
        )}

        {/* Alerts */}
        {(p.alerts || []).length > 0 ? (
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            {p.alerts.map((alert, i) => (
              <Alert key={i} severity={ALERT_SEVERITY_MAP[alert.severity] || 'info'} sx={{ py: 0, fontSize: '0.75rem' }}>
                {alert.message}
              </Alert>
            ))}
          </Stack>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Chip icon={<CheckCircle />} label="All Clear" color="success" size="small" variant="outlined" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Comparison Highlights ───────────────────────────────────────────────────

const ComparisonHighlights = ({ comparison }) => {
  if (!comparison) return null;
  const highlights = [
    { label: 'Best Revenue', data: comparison.bestRevenue, metric: `${safeVal(comparison.bestRevenue?.achievementRate).toFixed(1)}% achievement` },
    { label: 'Best Sales', data: comparison.bestSales, metric: `${safeVal(comparison.bestSales?.conversionRate).toFixed(1)}% conversion` },
    { label: 'Best Construction', data: comparison.bestConstruction, metric: `${safeVal(comparison.bestConstruction?.overallProgress).toFixed(1)}% progress` },
    { label: 'Best Collection', data: comparison.bestCollection, metric: `${safeVal(comparison.bestCollection?.collectionEfficiency).toFixed(1)}% efficiency` },
  ];

  return (
    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
      {highlights.map((h) => (
        <Grid item xs={6} md={3} key={h.label}>
          <Card sx={{ bgcolor: alpha('#ffb300', 0.06), border: '1px solid', borderColor: alpha('#ffb300', 0.2) }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <EmojiEvents sx={{ fontSize: 16, color: '#ffb300' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{h.label}</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{h.data?.name || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{h.metric}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

const LeadershipDashboardPage = () => {
  const theme = useTheme();

  const chartColors = theme.custom?.chartColors || [
    '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#e53935', '#ffb300', '#546e7a',
  ];

  // State
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState(30);
  const [sortBy, setSortBy] = useState('revenue');
  const [overview, setOverview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data Fetching
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [ovRes, cmpRes] = await Promise.allSettled([
        leadershipAPI.getOverview({ period }),
        leadershipAPI.getProjectComparison({ period, sortBy }),
      ]);

      if (ovRes.status === 'fulfilled') {
        setOverview(ovRes.value.data?.data || ovRes.value.data || null);
      }
      if (cmpRes.status === 'fulfilled') {
        const cmpData = cmpRes.value.data?.data || cmpRes.value.data || null;
        setComparison(cmpData);
      }

      if (ovRes.status === 'rejected' && cmpRes.status === 'rejected') {
        setError('Failed to load leadership data. Please try again.');
      }
    } catch (err) {
      console.error('Leadership Dashboard error:', err);
      setError('Failed to load leadership data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, sortBy]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title="Leadership Dashboard"
        subtitle="Executive overview for promoters & board"
        icon={Leaderboard}
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Period</InputLabel>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
                {PERIODS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
                <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Organization Overview" />
        <Tab label="Project Comparison" />
      </Tabs>

      {/* Tab 1: Overview */}
      {tab === 0 && (
        <Box>
          {overview ? (
            <Stack spacing={4}>
              <PortfolioSection data={overview.portfolio} loading={loading} chartColors={chartColors} />
              <Divider />
              <RevenueSection data={overview.revenue} loading={loading} period={period} chartColors={chartColors} />
              <Divider />
              <SalesPipelineSection data={overview.salesPipeline} loading={loading} chartColors={chartColors} />
              <Divider />
              <ConstructionSection data={overview.construction} loading={loading} />
              <Divider />
              <InvoicingSection data={overview.invoicing} loading={loading} chartColors={chartColors} />
              <Divider />
              <ChannelPartnerSection data={overview.channelPartner} loading={loading} chartColors={chartColors} />
              <Divider />
              <OperationsSection data={overview.operations} loading={loading} chartColors={chartColors} />
              <Divider />
              <TeamSection data={overview.team} loading={loading} chartColors={chartColors} />
            </Stack>
          ) : loading ? (
            <Box>
              {/* Loading skeletons for all 8 sections */}
              {[1, 2, 3, 4].map((n) => (
                <Box key={n} sx={{ mb: 4 }}>
                  <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {[1, 2, 3, 4].map((k) => (
                      <Grid item xs={6} md={3} key={k}>
                        <Skeleton variant="rounded" height={100} />
                      </Grid>
                    ))}
                  </Grid>
                  <Skeleton variant="rounded" height={200} sx={{ mt: 2 }} />
                </Box>
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={Leaderboard}
              title="No data available"
              description="Leadership data will appear here once projects and sales are added to the system."
            />
          )}
        </Box>
      )}

      {/* Tab 2: Project Comparison */}
      {tab === 1 && (
        <Box>
          {comparison ? (
            <>
              {/* Comparison Highlights */}
              <ComparisonHighlights comparison={comparison.comparison} />

              {/* Sort Control */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                    {SORT_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Project Cards */}
              {(comparison.projects || []).length > 0 ? (
                <Box sx={{
                  display: 'flex', gap: 2.5,
                  overflowX: { xs: 'auto', md: 'visible' },
                  flexWrap: { xs: 'nowrap', md: 'wrap' },
                  pb: 2,
                  scrollSnapType: { xs: 'x mandatory', md: 'none' },
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 3 },
                }}>
                  {comparison.projects.map((project) => (
                    <Box key={project.projectId} sx={{ scrollSnapAlign: 'start', flex: { xs: '0 0 320px', md: '1 1 0' }, minWidth: { md: 300 } }}>
                      <ProjectComparisonCard
                        project={project}
                        isBest={comparison.comparison?.bestRevenue?.projectId === project.projectId}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <EmptyState
                  icon={Business}
                  title="No projects to compare"
                  description="Projects will appear here once they are created."
                />
              )}
            </>
          ) : loading ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[1, 2, 3, 4].map((n) => (
                  <Grid item xs={6} md={3} key={n}>
                    <Skeleton variant="rounded" height={80} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: 'flex', gap: 2.5 }}>
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} variant="rounded" height={500} sx={{ flex: 1, minWidth: 300 }} />
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState
              icon={Business}
              title="No comparison data"
              description="Project comparison will be available once projects are created."
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default LeadershipDashboardPage;

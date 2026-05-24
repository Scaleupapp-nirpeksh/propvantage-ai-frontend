// File: src/pages/cp-portal/CommissionDashboardPage.js
// Description: SP5 — /partner/commission deep-dive. KPIs per currency,
//   12-month time series, by-developer + by-agent tables, by-status
//   breakdown, embedded AIInsightCard.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Skeleton,
  ToggleButtonGroup, ToggleButton, Table, TableBody, TableCell, TableHead, TableRow,
  Button,
} from '@mui/material';
import { Payments } from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip,
} from 'recharts';
import { cpAnalyticsAPI } from '../../services/api';
import AIInsightCard from '../../components/ai/AIInsightCard';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');

const RANGES = ['30d', '90d', '6m', '12m', 'ytd', 'all'];

const CommissionDashboardPage = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    cpAnalyticsAPI.getCommission({ range })
      .then((r) => { if (!cancelled) { setData(r.data?.data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [range]);

  const inr = (data?.summary?.byCurrency || []).find((c) => c.currency === 'INR') || (data?.summary?.byCurrency || [])[0];

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Payments sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Commission</Typography>
          <Typography variant="body2" color="text.secondary">
            Expected, received, outstanding and realisation — sliced by developer and agent.
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" value={range} exclusive onChange={(_, v) => v && setRange(v)}>
          {RANGES.map((r) => <ToggleButton key={r} value={r}>{r}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {['expected', 'received', 'outstanding'].map((k) => (
          <Grid item xs={12} md={3} key={k}>
            <Card variant="outlined"><CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{k}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }} color={k === 'outstanding' ? 'warning.main' : k === 'received' ? 'success.main' : 'text.primary'}>
                {loading ? <Skeleton width={120} /> : fmtMoneyIN(inr?.[k])}
              </Typography>
            </CardContent></Card>
          </Grid>
        ))}
        <Grid item xs={12} md={3}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Realisation rate</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {loading ? <Skeleton width={80} /> : fmtPct(inr?.realisationRate)}
            </Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Received commission — 12 months</Typography>
            {loading
              ? <Skeleton variant="rectangular" height={220} />
              : <Box sx={{ height: 220 }}>
                  <ResponsiveContainer><LineChart data={data?.series?.byMonth || []}><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis hide /><ReTooltip formatter={(v) => fmtMoneyIN(v)} /><Line type="monotone" dataKey="received" stroke="#43a047" /></LineChart></ResponsiveContainer>
                </Box>
            }
          </CardContent></Card>

          <Card variant="outlined" sx={{ mt: 2 }}><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>By developer</Typography>
            {loading
              ? <Skeleton variant="rectangular" height={180} />
              : <Table size="small">
                  <TableHead><TableRow><TableCell>Developer</TableCell><TableCell>Context</TableCell><TableCell align="right">Prospects</TableCell><TableCell align="right">Expected</TableCell><TableCell align="right">Received</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(data?.breakdowns?.byDeveloper || []).slice(0, 10).map((d, i) => (
                      <TableRow key={`${d.developerId}-${i}`}><TableCell>{d.developerName || '—'}</TableCell><TableCell><Chip size="small" variant="outlined" label={d.context} /></TableCell><TableCell align="right">{d.prospects}</TableCell><TableCell align="right">{fmtMoneyIN(d.expected)}</TableCell><TableCell align="right">{fmtMoneyIN(d.received)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
            }
          </CardContent></Card>

          {(data?.breakdowns?.byAgent || []).length > 0 && (
            <Card variant="outlined" sx={{ mt: 2 }}><CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>By agent</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Agent</TableCell><TableCell align="right">Prospects</TableCell><TableCell align="right">Expected</TableCell><TableCell align="right">Received</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.breakdowns.byAgent.slice(0, 10).map((a, i) => (
                    <TableRow key={`${a.agentId}-${i}`}><TableCell>{a.agentName || '—'}</TableCell><TableCell align="right">{a.prospects}</TableCell><TableCell align="right">{fmtMoneyIN(a.expected)}</TableCell><TableCell align="right">{fmtMoneyIN(a.received)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <AIInsightCard surface="commission_overview" range={range} compact={false} />
          <Card variant="outlined" sx={{ mt: 2 }}><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>By commission status</Typography>
            {loading
              ? <Skeleton variant="rectangular" height={160} />
              : <Box sx={{ height: 160 }}>
                  <ResponsiveContainer><BarChart data={data?.breakdowns?.byStatus || []}><XAxis dataKey="status" tick={{ fontSize: 10 }} /><YAxis hide /><ReTooltip /><Bar dataKey="count" fill="#1e88e5" /></BarChart></ResponsiveContainer>
                </Box>
            }
          </CardContent></Card>
          <Button variant="outlined" sx={{ mt: 2 }} fullWidth onClick={() => navigate('/partner/commission/reconciliation')}>
            View reconciliation →
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommissionDashboardPage;

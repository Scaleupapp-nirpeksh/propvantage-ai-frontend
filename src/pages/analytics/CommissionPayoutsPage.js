// File: src/pages/analytics/CommissionPayoutsPage.js
// Description: SP5 — dev-side /analytics/commission-payouts. KPIs +
//   monthly chart + by-CP table + by-project breakdown.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Payments } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts';
import { devAnalyticsAPI } from '../../services/api';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

const RANGES = ['30d', '90d', '6m', '12m', 'ytd', 'all'];

const CommissionPayoutsPage = () => {
  const [range, setRange] = useState('ytd');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    devAnalyticsAPI.getCommissionPayouts({ range })
      .then((r) => { setData(r.data?.data); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary || {};

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Payments sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Commission Payouts</Typography>
          <Typography variant="body2" color="text.secondary">Paid vs outstanding to channel partners, sliced by CP and project.</Typography>
        </Box>
        <ToggleButtonGroup size="small" value={range} exclusive onChange={(_, v) => v && setRange(v)}>
          {RANGES.map((r) => <ToggleButton key={r} value={r}>{r}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><Card variant="outlined"><CardContent>
          <Typography variant="caption" color="text.secondary">Paid this period</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }} color="success.main">{loading ? <Skeleton width={100} /> : fmtMoneyIN(s.paidThisPeriod)}</Typography>
        </CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card variant="outlined"><CardContent>
          <Typography variant="caption" color="text.secondary">Outstanding</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }} color="warning.main">{loading ? <Skeleton width={100} /> : fmtMoneyIN(s.outstanding)}</Typography>
        </CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card variant="outlined"><CardContent>
          <Typography variant="caption" color="text.secondary">CPs paid</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{loading ? <Skeleton width={40} /> : s.cpsPaid ?? 0}</Typography>
        </CardContent></Card></Grid>
        <Grid item xs={6} md={3}><Card variant="outlined"><CardContent>
          <Typography variant="caption" color="text.secondary">Avg payout / CP</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{loading ? <Skeleton width={80} /> : fmtMoneyIN(s.avgPayoutPerCp)}</Typography>
        </CardContent></Card></Grid>
      </Grid>

      <Card variant="outlined"><CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Paid commission — 12 months</Typography>
        {loading
          ? <Skeleton variant="rectangular" height={220} />
          : <Box sx={{ height: 220 }}>
              <ResponsiveContainer><LineChart data={data?.series?.byMonth || []}><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis hide /><ReTooltip formatter={(v) => fmtMoneyIN(v)} /><Line type="monotone" dataKey="paid" stroke="#43a047" /></LineChart></ResponsiveContainer>
            </Box>
        }
      </CardContent></Card>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>By channel partner</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>CP</TableCell><TableCell align="right">Payouts</TableCell><TableCell align="right">Paid</TableCell></TableRow></TableHead>
              <TableBody>{(data?.breakdowns?.byCp || []).slice(0, 10).map((r, i) => <TableRow key={i}><TableCell>{r.channelPartnerName || '—'}</TableCell><TableCell align="right">{r.payoutCount}</TableCell><TableCell align="right">{fmtMoneyIN(r.paid)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>By project</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Project</TableCell><TableCell align="right">Paid</TableCell></TableRow></TableHead>
              <TableBody>{(data?.breakdowns?.byProject || []).slice(0, 10).map((r, i) => <TableRow key={i}><TableCell>{r.projectName || '—'}</TableCell><TableCell align="right">{fmtMoneyIN(r.paid)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommissionPayoutsPage;

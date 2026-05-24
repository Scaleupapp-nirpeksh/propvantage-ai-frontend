// File: src/pages/analytics/ChannelPartnerScorecardPage.js
// Description: SP5 — dev-side /analytics/channel-partners. Ranked partners
//   table with per-CP detail drawer. Deterministic only (dev side has no
//   embedded AI cards — dev Copilot picks up the data via 3 new tools).

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton, Drawer, IconButton, Divider,
} from '@mui/material';
import { Groups, Close } from '@mui/icons-material';
import { devAnalyticsAPI } from '../../services/api';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');

const RANGES = ['30d', '90d', '6m', '12m', 'ytd', 'all'];

const ChannelPartnerScorecardPage = () => {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    devAnalyticsAPI.getChannelPartnerScorecard({ range })
      .then((r) => { setData(r.data?.data); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [range]);
  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Groups sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Channel Partner Scorecard</Typography>
          <Typography variant="body2" color="text.secondary">Performance KPIs across your active CP partners.</Typography>
        </Box>
        <ToggleButtonGroup size="small" value={range} exclusive onChange={(_, v) => v && setRange(v)}>
          {RANGES.map((r) => <ToggleButton key={r} value={r}>{r}</ToggleButton>)}
        </ToggleButtonGroup>
      </Stack>

      <Card variant="outlined"><CardContent>
        {loading
          ? <Skeleton variant="rectangular" height={300} />
          : <Table size="small">
              <TableHead><TableRow>
                <TableCell>Channel Partner</TableCell><TableCell align="right">Submitted</TableCell>
                <TableCell align="right">Accepted</TableCell><TableCell align="right">Rejected</TableCell>
                <TableCell align="right">Accept</TableCell><TableCell align="right">Conv</TableCell>
                <TableCell align="right">Decision</TableCell><TableCell align="right">Paid YTD</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(data?.partners || []).length === 0
                  ? <TableRow><TableCell colSpan={9}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No partner activity in this period.</Typography></TableCell></TableRow>
                  : data.partners.map((p) => (
                    <TableRow key={String(p.partnershipId)} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                      <TableCell>{p.channelPartnerOrg?.name || '—'}</TableCell>
                      <TableCell align="right">{p.leadsSubmitted}</TableCell>
                      <TableCell align="right">{p.accepted}</TableCell>
                      <TableCell align="right">{p.rejected}</TableCell>
                      <TableCell align="right">{fmtPct(p.acceptRate)}</TableCell>
                      <TableCell align="right">{fmtPct(p.conversionRate)}</TableCell>
                      <TableCell align="right">{p.avgTimeToDecisionHours}h</TableCell>
                      <TableCell align="right">{fmtMoneyIN(p.commissionPaidYtd)}</TableCell>
                      <TableCell align="right"><Chip size="small" color={p.partnerQualityScore >= 0.7 ? 'success' : p.partnerQualityScore >= 0.4 ? 'warning' : 'default'} label={p.partnerQualityScore} /></TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
        }
      </CardContent></Card>

      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100vw', md: 440 } } }}>
        {selected && <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>{selected.channelPartnerOrg?.name}</Typography>
            <IconButton onClick={() => setSelected(null)}><Close /></IconButton>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Typography variant="caption">Leads submitted: <strong>{selected.leadsSubmitted}</strong></Typography>
            <Typography variant="caption">Accepted: <strong>{selected.accepted}</strong> · Rejected: <strong>{selected.rejected}</strong></Typography>
            <Typography variant="caption">Accept rate: <strong>{fmtPct(selected.acceptRate)}</strong></Typography>
            <Typography variant="caption">Conversion: <strong>{fmtPct(selected.conversionRate)}</strong></Typography>
            <Typography variant="caption">Avg time to decision: <strong>{selected.avgTimeToDecisionHours}h</strong></Typography>
            <Typography variant="caption">Commission paid YTD: <strong>{fmtMoneyIN(selected.commissionPaidYtd)}</strong></Typography>
            <Typography variant="caption">Quality score: <strong>{selected.partnerQualityScore}</strong></Typography>
          </Stack>
        </Box>}
      </Drawer>
    </Box>
  );
};

export default ChannelPartnerScorecardPage;

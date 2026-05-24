// File: src/pages/analytics/LeadQualityPage.js
// Description: SP5 — dev-side /analytics/lead-quality. Per-CP quality metrics
//   (acceptRate, duplicateFlagRate, topRejectionReasons, leadQualityScore).

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Verified } from '@mui/icons-material';
import { devAnalyticsAPI } from '../../services/api';

const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');
const RANGES = ['30d', '90d', '6m', '12m', 'ytd', 'all'];

const LeadQualityPage = () => {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    devAnalyticsAPI.getLeadQuality({ range })
      .then((r) => { setData(r.data?.data); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [range]);
  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Verified sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Lead Quality by Channel Partner</Typography>
          <Typography variant="body2" color="text.secondary">
            Acceptance, rejection reasons, duplicate flag rate, and composite quality score.
          </Typography>
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
                <TableCell>Channel Partner</TableCell>
                <TableCell align="right">Submitted</TableCell>
                <TableCell align="right">Accepted</TableCell>
                <TableCell align="right">Rejected</TableCell>
                <TableCell align="right">Accept rate</TableCell>
                <TableCell>Top rejection reasons</TableCell>
                <TableCell align="right">Duplicate flag rate</TableCell>
                <TableCell align="right">Quality score</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(data?.partners || []).length === 0
                  ? <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No lead activity in this period.</Typography></TableCell></TableRow>
                  : data.partners.map((p) => (
                    <TableRow key={String(p.partnershipId)} hover>
                      <TableCell>{p.channelPartnerOrg?.name || '—'}</TableCell>
                      <TableCell align="right">{p.totalSubmitted}</TableCell>
                      <TableCell align="right">{p.accepted}</TableCell>
                      <TableCell align="right">{p.rejected}</TableCell>
                      <TableCell align="right">{fmtPct(p.acceptRate)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {(p.topRejectionReasons || []).map((r) => (
                            <Chip key={r.reason} size="small" variant="outlined" label={`${r.reason} (${r.count})`} />
                          ))}
                          {(p.topRejectionReasons || []).length === 0 && <Typography variant="caption" color="text.secondary">—</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{fmtPct(p.duplicateFlagRate)}</TableCell>
                      <TableCell align="right">
                        <Chip size="small" color={p.leadQualityScore >= 0.7 ? 'success' : p.leadQualityScore >= 0.4 ? 'warning' : 'default'} label={p.leadQualityScore} />
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
        }
      </CardContent></Card>
    </Box>
  );
};

export default LeadQualityPage;

// File: src/pages/cp-portal/DeveloperPerformanceDetailPage.js
// Description: SP5 — /partner/developers/performance. Two-pane: ranked
//   developer list (left) + selected developer's KPIs (right). Embedded
//   AIInsightCard. Sample-size threshold from the rule library means
//   weakDevelopers/topDevelopers candidates only fire when n≥10 per developer.

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Skeleton, List, ListItemButton, ListItemText, Divider,
} from '@mui/material';
import { Domain } from '@mui/icons-material';
import { cpAnalyticsAPI } from '../../services/api';
import AIInsightCard from '../../components/ai/AIInsightCard';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');

const DeveloperPerformanceDetailPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    cpAnalyticsAPI.getDevelopers({ range: 'all' })
      .then((r) => {
        if (cancelled) return;
        const d = r.data?.data;
        setData(d);
        if (d?.developers?.length > 0) setSelected(d.developers[0]);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const overall = data?.overallConversion ?? 0;

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Domain sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Developer Performance</Typography>
          <Typography variant="body2" color="text.secondary">Overall conversion: <strong>{fmtPct(overall)}</strong></Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card variant="outlined"><CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>All developers</Typography>
            {loading
              ? <><Skeleton height={36} /><Skeleton height={36} /><Skeleton height={36} /></>
              : (data?.developers || []).length === 0
              ? <Typography variant="body2" color="text.secondary">No developer activity yet.</Typography>
              : <List dense disablePadding>
                  {data.developers.map((d) => (
                    <ListItemButton
                      key={String(d.id || d.name)}
                      selected={selected?.id === d.id}
                      onClick={() => setSelected(d)}
                    >
                      <ListItemText
                        primary={<Stack direction="row" spacing={1} alignItems="center"><Typography variant="body2">{d.name}</Typography><Chip size="small" variant="outlined" label={d.context} sx={{ fontSize: '0.6rem', height: 18 }} /></Stack>}
                        secondary={`${d.prospects} prospects · ${fmtPct(d.conversionRate)} conv`}
                      />
                      <Typography variant="caption" color={d.deltaVsOverall >= 0 ? 'success.main' : 'error.main'}>
                        {d.deltaVsOverall >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(d.deltaVsOverall || 0))}
                      </Typography>
                    </ListItemButton>
                  ))}
                </List>
            }
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={7}>
          {selected
            ? <>
              <Card variant="outlined"><CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>{selected.name}</Typography>
                  <Chip variant="outlined" size="small" label={selected.context} />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Prospects</Typography><Typography variant="h6">{selected.prospects}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Conversion</Typography><Typography variant="h6">{fmtPct(selected.conversionRate)}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Δ vs overall</Typography><Typography variant="h6" color={selected.deltaVsOverall >= 0 ? 'success.main' : 'error.main'}>{selected.deltaVsOverall >= 0 ? '+' : ''}{fmtPct(selected.deltaVsOverall)}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Commission realised</Typography><Typography variant="h6">{fmtMoneyIN(selected.commissionRealised)}</Typography></Grid>
                  {selected.context === 'platform' && (
                    <>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">Avg time to booking</Typography><Typography variant="h6">{selected.avgTimeToBookingDays} d</Typography></Grid>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">Lead acceptance</Typography><Typography variant="h6">{fmtPct(selected.leadAcceptanceRate)}</Typography></Grid>
                    </>
                  )}
                </Grid>
              </CardContent></Card>
              <Box sx={{ mt: 2 }}>
                <AIInsightCard surface="developer_performance" range="all" compact={false} />
              </Box>
            </>
            : <Card variant="outlined"><CardContent><Typography variant="body2" color="text.secondary">Select a developer to see details.</Typography></CardContent></Card>
          }
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeveloperPerformanceDetailPage;

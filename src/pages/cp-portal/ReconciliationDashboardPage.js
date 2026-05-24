// File: src/pages/cp-portal/ReconciliationDashboardPage.js
// Description: SP5 — /partner/commission/reconciliation. The headline
//   cross-org feature: four filter-tab KPI tiles, sortable table, drill-
//   through drawer with side-by-side CP vs developer ledger, mark-reviewed
//   action, embedded AIInsightCard.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Skeleton, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, Drawer, Divider, Button,
  IconButton, Tooltip as MuiTooltip,
} from '@mui/material';
import { FactCheck, Close, Done } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { cpAnalyticsAPI } from '../../services/api';
import AIInsightCard from '../../components/ai/AIInsightCard';

const fmtMoneyIN = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};

const STATUS_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'mismatched',  label: 'Mismatched', color: 'error' },
  { key: 'cp_only',     label: 'CP only',    color: 'warning' },
  { key: 'dev_only',    label: 'Dev only',   color: 'info' },
  { key: 'matched',     label: 'Matched',    color: 'success' },
];

const STATUS_COLOR = {
  matched: 'success', mismatched: 'error', cp_only: 'warning', dev_only: 'info',
  pending_trigger: 'default', no_record: 'default',
};

const ReconciliationDashboardPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [drawerId, setDrawerId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    cpAnalyticsAPI.getReconciliation({ range: 'all' })
      .then((r) => { setData(r.data?.data); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const filteredRows = useMemo(() => {
    const rows = data?.rows || [];
    if (tab === 'all') return rows;
    return rows.filter((r) => r.status === tab);
  }, [data, tab]);

  const openDrawer = (id) => {
    setDrawerId(id);
    setDetail(null);
    setDetailLoading(true);
    cpAnalyticsAPI.getReconciliationDetail(id)
      .then((r) => { setDetail(r.data?.data); setDetailLoading(false); })
      .catch(() => { setDetail(null); setDetailLoading(false); enqueueSnackbar('Failed to load detail', { variant: 'error' }); });
  };

  const markReviewed = async () => {
    try {
      await cpAnalyticsAPI.markReconciliationReviewed(drawerId);
      enqueueSnackbar('Marked as reviewed', { variant: 'success' });
      setDrawerId(null);
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to mark reviewed', { variant: 'error' });
    }
  };

  const s = data?.summary || {};

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <FactCheck sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Commission Reconciliation</Typography>
          <Typography variant="body2" color="text.secondary">
            Your CP-side ledger vs the developer's official commission records.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { k: 'matched',    label: 'Matched',    color: 'success.main' },
          { k: 'cpOnly',     label: 'CP only',    color: 'warning.main' },
          { k: 'devOnly',    label: 'Dev only',   color: 'info.main' },
          { k: 'mismatched', label: 'Mismatched', color: 'error.main' },
        ].map(({ k, label, color }) => (
          <Grid item xs={6} md={3} key={k}>
            <Card variant="outlined"><CardContent>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color }}>
                {loading ? <Skeleton width={40} /> : (s[k] ?? 0)}
              </Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined"><CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
              {STATUS_TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
            </Tabs>
            {loading
              ? <Skeleton variant="rectangular" height={300} />
              : (
                <Table size="small">
                  <TableHead><TableRow><TableCell>Prospect</TableCell><TableCell>Status</TableCell><TableCell>Lead status</TableCell><TableCell align="right">CP exp</TableCell><TableCell align="right">Dev exp</TableCell><TableCell align="right">Δ</TableCell><TableCell></TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredRows.length === 0
                      ? <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No rows in this status.</Typography></TableCell></TableRow>
                      : filteredRows.map((r) => (
                        <TableRow key={String(r.prospectId)} hover sx={{ cursor: 'pointer' }} onClick={() => openDrawer(r.prospectId)}>
                          <TableCell><Stack><Typography variant="body2">{r.prospectName}</Typography><Typography variant="caption" color="text.secondary">{r.phone}</Typography></Stack></TableCell>
                          <TableCell><Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || 'default'} /></TableCell>
                          <TableCell><Typography variant="caption">{r.leadStatus}</Typography></TableCell>
                          <TableCell align="right">{fmtMoneyIN(r.cpExpected)}</TableCell>
                          <TableCell align="right">{fmtMoneyIN(r.devExpected)}</TableCell>
                          <TableCell align="right" sx={{ color: r.expectedDelta > 0 ? 'error.main' : 'inherit' }}>
                            {r.expectedDelta > 0 ? fmtMoneyIN(r.expectedDelta) : '—'}
                          </TableCell>
                          <TableCell align="right">
                            {r.reviewedAt && <MuiTooltip title="Reviewed"><Done fontSize="small" color="success" /></MuiTooltip>}
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              )
            }
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <AIInsightCard surface="commission_reconciliation" compact={false} />
        </Grid>
      </Grid>

      <Drawer anchor="right" open={!!drawerId} onClose={() => setDrawerId(null)} PaperProps={{ sx: { width: { xs: '100vw', md: 520 } } }}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>Reconciliation detail</Typography>
            <IconButton onClick={() => setDrawerId(null)}><Close /></IconButton>
          </Stack>
          {detailLoading
            ? <><Skeleton height={40} /><Skeleton height={120} /><Skeleton height={120} /></>
            : !detail
            ? <Typography variant="body2" color="text.secondary">No detail available.</Typography>
            : <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{detail.prospect?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{detail.prospect?.phone}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                <Chip size="small" label={detail.status} color={STATUS_COLOR[detail.status] || 'default'} />
                <Chip size="small" variant="outlined" label={`Lead: ${detail.lead?.status || '—'}`} />
              </Stack>
              <Typography variant="body2" sx={{ mb: 2 }}>{detail.explanation}</Typography>

              <Divider sx={{ my: 2 }}><Chip size="small" label="CP ledger" /></Divider>
              <Stack spacing={0.5}>
                <Typography variant="caption">Agreement: {detail.cpLedger?.agreement?.type === 'percentage' ? `${detail.cpLedger?.agreement?.value}%` : detail.cpLedger?.agreement?.type === 'flat' ? fmtMoneyIN(detail.cpLedger?.agreement?.value) : '—'}</Typography>
                <Typography variant="caption">Expected: <strong>{fmtMoneyIN(detail.cpLedger?.expectedAmount)}</strong></Typography>
                <Typography variant="caption">Received: <strong>{fmtMoneyIN(detail.cpLedger?.receivedAmount)}</strong> ({detail.cpLedger?.payments?.length || 0} payment{(detail.cpLedger?.payments?.length || 0) === 1 ? '' : 's'})</Typography>
              </Stack>

              <Divider sx={{ my: 2 }}><Chip size="small" label="Developer record" /></Divider>
              {(detail.devRecords || []).length === 0
                ? <Typography variant="caption" color="text.secondary">No CommissionRecord found on the developer side.</Typography>
                : detail.devRecords.map((r, i) => (
                  <Stack key={i} spacing={0.5} sx={{ mb: 1 }}>
                    <Typography variant="caption">Gross: <strong>{fmtMoneyIN(r.grossAmount)}</strong> · Net: <strong>{fmtMoneyIN(r.netAmount)}</strong> · Status: {r.status}</Typography>
                    <Typography variant="caption">Payouts: {(r.payouts || []).filter((p) => p.status === 'paid').length} paid of {(r.payouts || []).length}</Typography>
                  </Stack>
                ))
              }

              {detail.reviewedAt
                ? <Typography variant="caption" color="success.main" sx={{ mt: 2, display: 'block' }}>✓ Reviewed on {new Date(detail.reviewedAt).toLocaleString()}</Typography>
                : <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={markReviewed}>Mark as reviewed</Button>
              }
            </>
          }
        </Box>
      </Drawer>
    </Box>
  );
};

export default ReconciliationDashboardPage;

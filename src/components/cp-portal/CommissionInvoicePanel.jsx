// File: src/components/cp-portal/CommissionInvoicePanel.jsx
// Description: SP5+ — CP-side commission-invoice card embedded in the
//   Prospect Detail Commission tab. Lists existing invoices for the
//   prospect, lets the CP create + submit + cancel a draft, and renders
//   each invoice's status with the dev's decision note if any.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button, Skeleton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Divider,
} from '@mui/material';
import { Receipt, Add, Edit, Send, Cancel, Description } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { cpCommissionInvoicesAPI } from '../../services/api';

const fmtMoney = (v, ccy = 'INR') => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (ccy === 'INR') return `₹${Math.round(v).toLocaleString('en-IN')}`;
  return `${ccy} ${Math.round(v).toLocaleString('en-US')}`;
};

const STATUS_COLOR = {
  draft:     'default',
  submitted: 'info',
  approved:  'success',
  rejected:  'error',
  paid:      'success',
  cancelled: 'default',
};

const CommissionInvoicePanel = ({ prospect, onChanged }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [invoices, setInvoices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null); // existing invoice or null = create
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!prospect?._id) return;
    setLoading(true);
    try {
      const r = await cpCommissionInvoicesAPI.list({ prospectId: prospect._id });
      setInvoices(r.data?.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [prospect?._id]);
  useEffect(() => { load(); }, [load]);

  // Default form state.
  const blankForm = {
    baseAmount: prospect?.commission?.expectedAmount || 0,
    gstPct: 18,
    tdsPct: 5,
    currency: prospect?.commissionAgreement?.currency || 'INR',
    cpParty: {
      legalName: '', gstin: '', pan: '',
      bankAccountName: '', bankAccountNumber: '', bankIfsc: '', bankName: '',
      address: '',
    },
    notes: '',
  };
  const [form, setForm] = useState(blankForm);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...blankForm });
    setOpenForm(true);
  };
  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      baseAmount: inv.baseAmount,
      gstPct: inv.gstPct,
      tdsPct: inv.tdsPct,
      currency: inv.currency,
      cpParty: { ...blankForm.cpParty, ...(inv.cpParty || {}) },
      notes: inv.notes || '',
    });
    setOpenForm(true);
  };

  const save = async (alsoSubmit) => {
    setBusy(true);
    try {
      let id = editing?._id;
      if (id) {
        await cpCommissionInvoicesAPI.update(id, form);
      } else {
        const r = await cpCommissionInvoicesAPI.create({
          prospectId: prospect._id,
          ...form,
        });
        id = r.data?.data?._id;
      }
      if (alsoSubmit && id) {
        await cpCommissionInvoicesAPI.submit(id);
      }
      enqueueSnackbar(alsoSubmit ? 'Invoice submitted to developer' : 'Invoice saved as draft', { variant: 'success' });
      setOpenForm(false);
      load();
      if (onChanged) onChanged();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not save invoice', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (inv) => {
    if (!window.confirm(`Cancel invoice ${inv.invoiceNumber || '(draft)'}?`)) return;
    try {
      await cpCommissionInvoicesAPI.cancel(inv._id);
      enqueueSnackbar('Invoice cancelled', { variant: 'success' });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not cancel', { variant: 'error' });
    }
  };

  // Computed totals (so the user sees the math as they type).
  const base = Number(form.baseAmount) || 0;
  const gst  = Math.round(base * (Number(form.gstPct) || 0) * 100 / 100) / 100;
  const tds  = Math.round(base * (Number(form.tdsPct) || 0) * 100 / 100) / 100;
  const net  = Math.max(0, Math.round((base + gst - tds) * 100) / 100);

  // UI hints based on prospect state.
  const isPlatformProspect = prospect?.developerContext?.type === 'platform';
  const isPushed           = Boolean(prospect?.pushedToLead);
  const canCreate          = isPlatformProspect && isPushed;
  const openInvoice        = (invoices || []).find((i) => ['draft', 'submitted', 'approved'].includes(i.status));

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Receipt sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
          <Typography variant="overline" color="text.secondary" sx={{ flexGrow: 1 }}>
            Commission Invoice
          </Typography>
          {canCreate && !openInvoice && (
            <Button size="small" variant="contained" startIcon={<Add />} onClick={openCreate}>
              Generate Invoice
            </Button>
          )}
        </Stack>

        {!canCreate && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
            Commission invoices are only available for platform-context prospects after
            they've been pushed to the developer and a Sale has been booked.
          </Alert>
        )}

        {loading ? (
          <Skeleton variant="rectangular" height={80} sx={{ mt: 1 }} />
        ) : (invoices || []).length === 0 ? (
          canCreate && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No invoice yet. Click <strong>Generate Invoice</strong> to start one.
            </Typography>
          )
        ) : (
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Base</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id} hover>
                  <TableCell>
                    <Tooltip title={inv.invoiceNumber || 'Draft (no number yet)'}>
                      <Typography variant="body2">{inv.invoiceNumber || 'Draft'}</Typography>
                    </Tooltip>
                    {inv.decisionNote && inv.status === 'rejected' && (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        Reason: {inv.decisionNote}
                      </Typography>
                    )}
                    {inv.paymentReference && inv.status === 'paid' && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                        Ref: {inv.paymentReference}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{fmtMoney(inv.baseAmount, inv.currency)}</TableCell>
                  <TableCell align="right"><strong>{fmtMoney(inv.netPayable, inv.currency)}</strong></TableCell>
                  <TableCell><Chip size="small" label={inv.status} color={STATUS_COLOR[inv.status] || 'default'} /></TableCell>
                  <TableCell align="right">
                    {(inv.status === 'draft' || inv.status === 'rejected') && (
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(inv)}><Edit fontSize="small" /></IconButton></Tooltip>
                    )}
                    {inv.status === 'draft' && (
                      <Tooltip title="Submit to developer">
                        <IconButton size="small" color="primary" onClick={async () => {
                          try {
                            await cpCommissionInvoicesAPI.submit(inv._id);
                            enqueueSnackbar('Invoice submitted', { variant: 'success' });
                            load();
                          } catch (err) {
                            enqueueSnackbar(err.response?.data?.message || 'Could not submit', { variant: 'error' });
                          }
                        }}><Send fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {(inv.status === 'draft' || inv.status === 'submitted') && (
                      <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={() => cancel(inv)}><Cancel fontSize="small" /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create / edit dialog */}
      <Dialog open={openForm} onClose={() => !busy && setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Description fontSize="small" />
            {editing ? `Edit Invoice ${editing.invoiceNumber || '(draft)'}` : 'Generate Commission Invoice'}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="Base amount" type="number" required fullWidth size="small"
              value={form.baseAmount}
              onChange={(e) => setForm((f) => ({ ...f, baseAmount: Number(e.target.value) }))} />
            <TextField label="Currency" fullWidth size="small" value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="GST %" type="number" fullWidth size="small" value={form.gstPct}
              onChange={(e) => setForm((f) => ({ ...f, gstPct: Number(e.target.value) }))} />
            <TextField label="TDS %" type="number" fullWidth size="small" value={form.tdsPct}
              onChange={(e) => setForm((f) => ({ ...f, tdsPct: Number(e.target.value) }))} />
          </Stack>

          <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Base</Typography><Typography variant="caption">{fmtMoney(base, form.currency)}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between"><Typography variant="caption">+ GST ({form.gstPct}%)</Typography><Typography variant="caption">{fmtMoney(gst, form.currency)}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between"><Typography variant="caption">− TDS ({form.tdsPct}%)</Typography><Typography variant="caption">{fmtMoney(tds, form.currency)}</Typography></Stack>
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight={700}>Net payable</Typography><Typography variant="body2" fontWeight={700}>{fmtMoney(net, form.currency)}</Typography></Stack>
          </Box>

          <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>Billing details (one-time snapshot)</Typography>
          <Stack direction="row" spacing={2}>
            <TextField label="Legal name" fullWidth size="small" value={form.cpParty.legalName}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, legalName: e.target.value } }))} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="GSTIN" fullWidth size="small" value={form.cpParty.gstin}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, gstin: e.target.value.toUpperCase() } }))} />
            <TextField label="PAN" fullWidth size="small" value={form.cpParty.pan}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, pan: e.target.value.toUpperCase() } }))} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Bank account name" fullWidth size="small" value={form.cpParty.bankAccountName}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, bankAccountName: e.target.value } }))} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Account number" fullWidth size="small" value={form.cpParty.bankAccountNumber}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, bankAccountNumber: e.target.value } }))} />
            <TextField label="IFSC" fullWidth size="small" value={form.cpParty.bankIfsc}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, bankIfsc: e.target.value.toUpperCase() } }))} />
            <TextField label="Bank name" fullWidth size="small" value={form.cpParty.bankName}
              onChange={(e) => setForm((f) => ({ ...f, cpParty: { ...f.cpParty, bankName: e.target.value } }))} />
          </Stack>
          <TextField label="Notes (optional)" fullWidth size="small" multiline minRows={2}
            value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenForm(false)} disabled={busy}>Cancel</Button>
          <Button onClick={() => save(false)} disabled={busy || !(base > 0)}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
          <Button variant="contained" onClick={() => save(true)} disabled={busy || !(base > 0)}>
            {busy ? 'Submitting…' : 'Save & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CommissionInvoicePanel;

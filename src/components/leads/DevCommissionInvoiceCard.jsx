// File: src/components/leads/DevCommissionInvoiceCard.jsx
// Description: SP5+ — dev-side card on LeadDetail showing CP-submitted
//   commission invoices for this lead. Lets the dev approve / reject /
//   record payment.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Chip, Button, Skeleton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Receipt, CheckCircle, Cancel, Payment, ExpandMore, AccountBalance,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { devCommissionInvoicesAPI } from '../../services/api';

const fmtMoney = (v, ccy = 'INR') => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  if (ccy === 'INR') return `₹${Math.round(v).toLocaleString('en-IN')}`;
  return `${ccy} ${Math.round(v).toLocaleString('en-US')}`;
};

const STATUS_COLOR = {
  draft: 'default', submitted: 'info', approved: 'success',
  rejected: 'error', paid: 'success', cancelled: 'default',
};

const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'cash', 'upi', 'other'];

const DevCommissionInvoiceCard = ({ leadId, onChanged }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [invoices, setInvoices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decideTarget, setDecideTarget] = useState(null);   // { invoice, action }
  const [decideNote, setDecideNote] = useState('');
  const [decideBusy, setDecideBusy] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null); // invoice
  const [paymentForm, setPaymentForm] = useState({ reference: '', method: 'bank_transfer', paidAt: '' });
  const [paymentBusy, setPaymentBusy] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const r = await devCommissionInvoicesAPI.list({ leadId });
      setInvoices(r.data?.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);
  useEffect(() => { load(); }, [load]);

  const openDecide = (invoice, action) => {
    setDecideTarget({ invoice, action });
    setDecideNote('');
  };
  const submitDecide = async () => {
    if (decideTarget.action === 'reject' && !decideNote.trim()) {
      enqueueSnackbar('A reason is required when rejecting an invoice', { variant: 'warning' });
      return;
    }
    setDecideBusy(true);
    try {
      if (decideTarget.action === 'approve') {
        await devCommissionInvoicesAPI.approve(decideTarget.invoice._id, { note: decideNote });
      } else {
        await devCommissionInvoicesAPI.reject(decideTarget.invoice._id, { note: decideNote });
      }
      enqueueSnackbar(`Invoice ${decideTarget.action}d`, { variant: 'success' });
      setDecideTarget(null);
      load();
      if (onChanged) onChanged();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Action failed', { variant: 'error' });
    } finally {
      setDecideBusy(false);
    }
  };

  const openPayment = (invoice) => {
    setPaymentTarget(invoice);
    setPaymentForm({
      reference: '',
      method: 'bank_transfer',
      paidAt: new Date().toISOString().slice(0, 10),
    });
  };
  const submitPayment = async () => {
    if (!paymentForm.reference.trim()) {
      enqueueSnackbar('Payment reference is required', { variant: 'warning' });
      return;
    }
    setPaymentBusy(true);
    try {
      await devCommissionInvoicesAPI.recordPayment(paymentTarget._id, paymentForm);
      enqueueSnackbar('Payment recorded', { variant: 'success' });
      setPaymentTarget(null);
      load();
      if (onChanged) onChanged();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to record payment', { variant: 'error' });
    } finally {
      setPaymentBusy(false);
    }
  };

  // Don't render the card at all if the lead has no invoices (avoids
  // empty cards on direct dev leads with no CP attribution).
  if (!loading && (invoices || []).length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt color="primary" />
          Commission Invoices
        </Typography>

        {loading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Submitted by</TableCell>
                <TableCell align="right">Base</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <React.Fragment key={inv._id}>
                  <TableRow hover>
                    <TableCell>
                      <Typography variant="body2"><strong>{inv.invoiceNumber || 'Pending'}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.cpOrg?.name || 'Channel Partner'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {inv.submittedBy
                          ? `${inv.submittedBy.firstName || ''} ${inv.submittedBy.lastName || ''}`.trim()
                          : '—'}
                      </Typography>
                      {inv.submittedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(inv.submittedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{fmtMoney(inv.baseAmount, inv.currency)}</TableCell>
                    <TableCell align="right"><strong>{fmtMoney(inv.netPayable, inv.currency)}</strong></TableCell>
                    <TableCell><Chip size="small" label={inv.status} color={STATUS_COLOR[inv.status] || 'default'} /></TableCell>
                    <TableCell align="right">
                      {inv.status === 'submitted' && (
                        <>
                          <Tooltip title="Approve">
                            <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => openDecide(inv, 'approve')}>
                              Approve
                            </Button>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <Button size="small" color="error" startIcon={<Cancel />} onClick={() => openDecide(inv, 'reject')}>
                              Reject
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      {inv.status === 'approved' && (
                        <Tooltip title="Record payment">
                          <Button size="small" variant="contained" startIcon={<Payment />} onClick={() => openPayment(inv)}>
                            Record Payment
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  {(inv.status === 'submitted' || inv.status === 'approved') && (inv.cpParty?.bankAccountNumber || inv.cpParty?.gstin) && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: 0 }}>
                        <Accordion variant="outlined" sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                            <Typography variant="caption" color="text.secondary">
                              <AccountBalance sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              Billing & bank details
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                            <Stack spacing={0.5}>
                              {inv.cpParty?.legalName && <Typography variant="caption">Legal name: <strong>{inv.cpParty.legalName}</strong></Typography>}
                              {inv.cpParty?.gstin && <Typography variant="caption">GSTIN: <strong>{inv.cpParty.gstin}</strong></Typography>}
                              {inv.cpParty?.pan && <Typography variant="caption">PAN: <strong>{inv.cpParty.pan}</strong></Typography>}
                              {inv.cpParty?.bankAccountName && (
                                <Typography variant="caption">
                                  Bank: <strong>{inv.cpParty.bankAccountName}</strong> · {inv.cpParty.bankAccountNumber} · {inv.cpParty.bankIfsc} ({inv.cpParty.bankName})
                                </Typography>
                              )}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  )}
                  {inv.status === 'rejected' && inv.decisionNote && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 1, borderBottom: 0 }}>
                        <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>
                          Rejected: {inv.decisionNote}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                  {inv.status === 'paid' && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 1, borderBottom: 0 }}>
                        <Typography variant="caption" color="success.main">
                          ✓ Paid on {new Date(inv.paidAt).toLocaleDateString()}{inv.paymentReference ? ` · Ref: ${inv.paymentReference}` : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Approve / Reject dialog */}
      <Dialog open={!!decideTarget} onClose={() => !decideBusy && setDecideTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {decideTarget?.action === 'approve' ? 'Approve invoice' : 'Reject invoice'}
          {decideTarget?.invoice?.invoiceNumber ? ` ${decideTarget.invoice.invoiceNumber}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              {decideTarget?.action === 'approve'
                ? `Approve this invoice for ${fmtMoney(decideTarget?.invoice?.netPayable, decideTarget?.invoice?.currency)} net payable?`
                : `Reject this invoice and send a reason back to the CP?`}
            </Typography>
            <TextField
              label={decideTarget?.action === 'approve' ? 'Note (optional)' : 'Reason (required)'}
              fullWidth multiline minRows={3} size="small"
              value={decideNote} onChange={(e) => setDecideNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDecideTarget(null)} disabled={decideBusy}>Cancel</Button>
          <Button
            variant="contained"
            color={decideTarget?.action === 'approve' ? 'success' : 'error'}
            onClick={submitDecide}
            disabled={decideBusy}
          >
            {decideBusy ? '…' : (decideTarget?.action === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment dialog */}
      <Dialog open={!!paymentTarget} onClose={() => !paymentBusy && setPaymentTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Record payment for {paymentTarget?.invoiceNumber}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Net payable</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {fmtMoney(paymentTarget?.netPayable, paymentTarget?.currency)}
              </Typography>
            </Box>
            <TextField label="Payment reference (UTR / cheque no.)" required fullWidth size="small"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))} />
            <TextField select label="Method" fullWidth size="small" value={paymentForm.method}
              onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField label="Paid on" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={paymentForm.paidAt}
              onChange={(e) => setPaymentForm((f) => ({ ...f, paidAt: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPaymentTarget(null)} disabled={paymentBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment} disabled={paymentBusy || !paymentForm.reference.trim()}>
            {paymentBusy ? '…' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DevCommissionInvoiceCard;

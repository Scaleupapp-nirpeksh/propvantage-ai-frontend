// File: src/pages/channel-partners/CommissionRecordListPage.js
// Description: Lists channel-partner commission records and lets an authorised
//   user mark individual payouts paid.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  CircularProgress, Alert, Button, MenuItem, TextField, Stack, Collapse,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { channelPartnerAPI } from '../../services/api';
import ChannelPartnerAttributionFields from '../../components/channel-partners/ChannelPartnerAttributionFields';

const STATUS_COLOR = {
  accrued: 'default',
  partially_paid: 'warning',
  paid: 'success',
  cancelled: 'error',
};

const inr = (n) =>
  n === null || n === undefined ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

const RecordRow = ({ record, onPay, payingKey, onEditAttribution }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen((o) => !o)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{record.channelPartner?.firmName || '—'}</TableCell>
        <TableCell>{record.sale?.project?.name || '—'}</TableCell>
        <TableCell align="right">{record.sharePct}%</TableCell>
        <TableCell align="right">{inr(record.grossAmount)}</TableCell>
        <TableCell align="right">{inr(record.netAmount)}</TableCell>
        <TableCell>
          <Chip size="small" label={record.status} color={STATUS_COLOR[record.status] || 'default'} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, border: open ? undefined : 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Payouts</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Trigger</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(record.payouts || []).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.label}</TableCell>
                      <TableCell>{p.trigger}</TableCell>
                      <TableCell align="right">{inr(p.amount)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={p.status}
                          color={p.status === 'paid' ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        {p.status === 'pending' && record.status !== 'cancelled' && (
                          <Button
                            size="small"
                            disabled={payingKey === `${record._id}-${i}`}
                            onClick={() => onPay(record._id, i)}
                          >
                            Mark paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {record.status !== 'cancelled' && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    onClick={() =>
                      onEditAttribution(record.sale?._id || record.sale, record.sale?.project?.name)
                    }
                  >
                    Edit booking attribution
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const CommissionRecordListPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payingKey, setPayingKey] = useState(null);

  const [editSale, setEditSale] = useState(null); // { saleId, projectName }
  const [editValue, setEditValue] = useState({ viaChannelPartner: false, partners: [] });
  const [savingEdit, setSavingEdit] = useState(false);

  // Open the edit dialog for a booking — prefill from all of that sale's records.
  const openEditDialog = (saleId, projectName) => {
    const saleRecords = records.filter((r) => (r.sale?._id || r.sale) === saleId);
    setEditSale({ saleId, projectName });
    setEditValue({
      viaChannelPartner: true,
      partners: saleRecords.map((r) => ({
        channelPartner: r.channelPartner?._id || r.channelPartner,
        agent: r.agent?._id || r.agent || null,
        sharePct: r.sharePct,
      })),
    });
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await channelPartnerAPI.getCommissionRecords(params);
      setRecords(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load commission records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const saveEdit = async () => {
    const validPartners = (editValue.partners || []).filter(
      (p) => p.channelPartner && Number(p.sharePct) > 0
    );
    const sum = validPartners.reduce((a, p) => a + Number(p.sharePct), 0);
    if (editValue.viaChannelPartner && (validPartners.length === 0 || Math.abs(sum - 100) > 0.01)) {
      setError('Commission split must total 100% across selected partners.');
      return;
    }
    setSavingEdit(true);
    try {
      await channelPartnerAPI.editSaleAttribution(editSale.saleId, {
        viaChannelPartner: editValue.viaChannelPartner,
        partners: validPartners.map((p) => ({
          channelPartner: p.channelPartner,
          agent: p.agent || null,
          sharePct: Number(p.sharePct) || 0,
        })),
      });
      setEditSale(null);
      await fetchRecords();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update attribution.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePay = async (recordId, index) => {
    setPayingKey(`${recordId}-${index}`);
    try {
      await channelPartnerAPI.markPayoutPaid(recordId, index);
      await fetchRecords();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to mark payout paid.');
    } finally {
      setPayingKey(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Commission Records
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="accrued">Accrued</MenuItem>
          <MenuItem value="partially_paid">Partially paid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Alert severity="info">
          No commission records yet. They are generated when a booking with a
          channel-partner attribution is created.
        </Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Channel partner</TableCell>
              <TableCell>Project</TableCell>
              <TableCell align="right">Share</TableCell>
              <TableCell align="right">Gross</TableCell>
              <TableCell align="right">Net</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((r) => (
              <RecordRow
                key={r._id}
                record={r}
                onPay={handlePay}
                payingKey={payingKey}
                onEditAttribution={openEditDialog}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={Boolean(editSale)} onClose={() => setEditSale(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          Edit attribution{editSale?.projectName ? ` — ${editSale.projectName}` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <ChannelPartnerAttributionFields value={editValue} onChange={setEditValue} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSale(null)} disabled={savingEdit}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={savingEdit}>
            {savingEdit ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommissionRecordListPage;

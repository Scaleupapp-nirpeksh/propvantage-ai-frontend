// File: src/pages/channel-partners/CommissionRecordListPage.js
// Description: Lists channel-partner commission records and lets an authorised
//   user mark individual payouts paid.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  CircularProgress, Alert, Button, MenuItem, TextField, Stack, Collapse,
  IconButton,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { channelPartnerAPI } from '../../services/api';

const STATUS_COLOR = {
  accrued: 'default',
  partially_paid: 'warning',
  paid: 'success',
  cancelled: 'error',
};

const inr = (n) =>
  n === null || n === undefined ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

const RecordRow = ({ record, onPay, payingKey }) => {
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
              <RecordRow key={r._id} record={r} onPay={handlePay} payingKey={payingKey} />
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default CommissionRecordListPage;

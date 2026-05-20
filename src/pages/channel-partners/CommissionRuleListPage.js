// File: src/pages/channel-partners/CommissionRuleListPage.js
// Description: Lists channel-partner commission rules.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, CircularProgress, Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { channelPartnerAPI } from '../../services/api';

const CommissionRuleListPage = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await channelPartnerAPI.getCommissionRules();
      setRules(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load commission rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const rateLabel = (r) =>
    r.rate?.method === 'flat'
      ? `₹${(r.rate.flatAmount || 0).toLocaleString('en-IN')} flat`
      : `${r.rate?.percentage || 0}% of ${r.rate?.basis === 'base_price' ? 'base price' : 'sale price'}`;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Commission Rules</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/channel-partners/commission-rules/create')}
        >
          Add Rule
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rules.length === 0 ? (
        <Alert severity="info">No commission rules yet.</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Applies to</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Payout</TableCell>
              <TableCell>TDS</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((r) => (
              <TableRow
                key={r._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/channel-partners/commission-rules/${r._id}`)}
              >
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.appliesToProject?.name || 'All projects'}</TableCell>
                <TableCell>{rateLabel(r)}</TableCell>
                <TableCell>
                  {r.payout?.schedule === 'tranches'
                    ? `${r.payout.tranches?.length || 0} tranches`
                    : 'Lump sum'}
                </TableCell>
                <TableCell>{r.tdsPercent || 0}%</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status}
                    color={r.status === 'active' ? 'success' : 'default'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default CommissionRuleListPage;

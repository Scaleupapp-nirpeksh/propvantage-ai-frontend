// File: src/pages/channel-partners/ChannelPartnerListPage.js
// Description: Lists channel partner firms with status filter + search.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, MenuItem, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, CircularProgress, Alert, Stack,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { channelPartnerAPI } from '../../services/api';

const STATUS_COLOR = { active: 'success', suspended: 'warning', blacklisted: 'error' };

const ChannelPartnerListPage = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await channelPartnerAPI.getChannelPartners(params);
      setPartners(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load channel partners.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Channel Partners
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/channel-partners/create')}
        >
          Add Partner
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search firm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="blacklisted">Blacklisted</MenuItem>
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : partners.length === 0 ? (
        <Alert severity="info">No channel partners yet. Add your first partner firm.</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Firm</TableCell>
              <TableCell>RERA No.</TableCell>
              <TableCell>Primary contact</TableCell>
              <TableCell>Approved projects</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partners.map((p) => (
              <TableRow
                key={p._id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/channel-partners/${p._id}`)}
              >
                <TableCell>{p.firmName}</TableCell>
                <TableCell>{p.reraRegistrationNumber || '—'}</TableCell>
                <TableCell>{p.primaryContact?.name || '—'}</TableCell>
                <TableCell>{p.approvedProjects?.length || 0}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={p.status}
                    color={STATUS_COLOR[p.status] || 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default ChannelPartnerListPage;

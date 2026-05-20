// File: src/pages/channel-partners/ChannelPartnerDashboardPage.js
// Description: CP performance dashboard — per-partner leaderboard + a funnel
//   summary (leads tagged → bookings → commission).

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, CircularProgress, Alert,
} from '@mui/material';
import { channelPartnerAPI } from '../../services/api';

const STATUS_COLOR = { active: 'success', suspended: 'warning', blacklisted: 'error' };

const inr = (n) => {
  if (n === null || n === undefined) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const StatCard = ({ label, value }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const ChannelPartnerDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await channelPartnerAPI.getDashboard();
      setData(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const funnel = data?.funnel || {};
  const leaderboard = data?.leaderboard || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Channel Partner Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        How your channel partner network is contributing.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard label="Leads tagged" value={funnel.leadsTagged ?? 0} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Bookings" value={funnel.bookings ?? 0} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Conversion" value={`${funnel.conversionPct ?? 0}%`} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Booked value" value={inr(funnel.bookingValue)} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Commission (net)" value={inr(funnel.commissionNet)} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Commission paid" value={inr(funnel.commissionPaid)} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Commission pending" value={inr(funnel.commissionPending)} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Partners" value={data?.partnerCount ?? 0} /></Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Partner Leaderboard
          </Typography>
          {leaderboard.length === 0 ? (
            <Alert severity="info">
              No channel partner activity yet. Tag leads and bookings with a partner to populate this.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Leads</TableCell>
                  <TableCell align="right">Bookings</TableCell>
                  <TableCell align="right">Booked value</TableCell>
                  <TableCell align="right">Commission (net)</TableCell>
                  <TableCell align="right">Pending</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((r) => (
                  <TableRow
                    key={r.channelPartnerId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/channel-partners/${r.channelPartnerId}`)}
                  >
                    <TableCell>{r.firmName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || 'default'} />
                    </TableCell>
                    <TableCell align="right">{r.leadsTagged}</TableCell>
                    <TableCell align="right">{r.bookings}</TableCell>
                    <TableCell align="right">{inr(r.bookingValue)}</TableCell>
                    <TableCell align="right">{inr(r.commissionNet)}</TableCell>
                    <TableCell align="right">{inr(r.commissionPending)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChannelPartnerDashboardPage;

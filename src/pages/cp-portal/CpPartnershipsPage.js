import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip, Alert, CircularProgress,
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Divider,
} from '@mui/material';
import { partnershipAPI } from '../../services/api';

const STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  suspended: { label: 'Suspended', color: 'warning' },
  terminated: { label: 'Terminated', color: 'default' },
  declined: { label: 'Declined', color: 'default' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'terminated', label: 'Terminated' },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtCommission = (c) => {
  if (!c) return null;
  return c.type === 'percentage' ? `${c.value}% commission` : `₹${c.value} flat commission`;
};

const CpPartnershipsPage = () => {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Re-apply dialog
  const [reapply, setReapply] = useState(null); // partnership object
  const [reapplyMessage, setReapplyMessage] = useState('');
  const [reapplying, setReapplying] = useState(false);
  const [reapplyError, setReapplyError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    partnershipAPI.list()
      .then((res) => setItems(res.data?.data || []))
      .catch(() => setError('Could not load your partnerships.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const transition = async (id, action) => {
    setBusyId(id);
    setActionError('');
    setActionOk('');
    try {
      await partnershipAPI.transition(id, { action });
      setActionOk('Partnership updated.');
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not complete that action.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReapply = async () => {
    if (!reapply) return;
    setReapplying(true);
    setReapplyError('');
    try {
      await partnershipAPI.create({
        counterpartyOrgId: reapply.developerOrg?._id,
        message: reapplyMessage,
      });
      setReapply(null);
      setActionOk('Re-application sent.');
      load();
    } catch (err) {
      setReapplyError(err.response?.data?.message || 'Could not send your re-application.');
    } finally {
      setReapplying(false);
    }
  };

  const activeKey = TABS[tab].key;
  const filtered = activeKey === 'all'
    ? items
    : items.filter((p) => p.status === activeKey);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>My Partnerships</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track your applications and partnerships with developers.
      </Typography>

      {actionOk && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionOk('')}>{actionOk}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}
        variant="scrollable" scrollButtons="auto">
        {TABS.map((t) => <Tab key={t.key} label={t.label} />)}
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          {activeKey === 'all'
            ? 'You have no partnerships yet. Visit the Marketplace to find developers.'
            : `No ${activeKey} partnerships.`}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((p) => {
            const dev = p.developerOrg || {};
            const meta = STATUS_META[p.status] || { label: p.status, color: 'default' };
            const canAcceptDecline = p.status === 'pending' && p.initiatedBy === 'developer';
            const canTerminate = p.status === 'active' || p.status === 'suspended';
            const canReapply = p.status === 'rejected' || p.status === 'terminated';
            const commission = fmtCommission(p.commissionTerms);
            const busy = busyId === p._id;
            return (
              <Grid item xs={12} md={6} key={p._id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar src={dev.portfolioProfile?.logoUrl || undefined} sx={{ width: 48, height: 48 }}>
                        {dev.name?.[0]}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                          {dev.name || 'Developer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {dev.city || '—'}
                        </Typography>
                      </Box>
                      <Chip size="small" label={meta.label} color={meta.color} />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.initiatedBy === 'developer' ? 'Invited by developer' : 'You applied'}
                      {' · Requested '}{fmtDate(p.requestedAt || p.createdAt)}
                    </Typography>
                    {p.decidedAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Decided {fmtDate(p.decidedAt)}
                      </Typography>
                    )}
                    {commission && (
                      <Chip size="small" variant="outlined" label={commission} sx={{ mt: 1 }} />
                    )}
                    {p.commissionTerms?.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>{p.commissionTerms.notes}</Typography>
                    )}
                    {(canAcceptDecline || canTerminate || canReapply) && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        {canAcceptDecline && (
                          <>
                            <Button size="small" variant="contained" disabled={busy}
                              onClick={() => transition(p._id, 'accept')}>Accept</Button>
                            <Button size="small" color="error" disabled={busy}
                              onClick={() => transition(p._id, 'decline')}>Decline</Button>
                          </>
                        )}
                        {canTerminate && (
                          <Button size="small" color="error" disabled={busy}
                            onClick={() => transition(p._id, 'terminate')}>Terminate</Button>
                        )}
                        {canReapply && (
                          <Button size="small" variant="contained" disabled={busy}
                            onClick={() => { setReapply(p); setReapplyMessage(''); setReapplyError(''); }}>
                            Re-apply
                          </Button>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Re-apply dialog */}
      <Dialog open={!!reapply} onClose={() => !reapplying && setReapply(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Re-apply to {reapply?.developerOrg?.name}</DialogTitle>
        <DialogContent dividers>
          {reapplyError && <Alert severity="error" sx={{ mb: 2 }}>{reapplyError}</Alert>}
          <TextField fullWidth multiline minRows={4} label="Message to the developer"
            value={reapplyMessage} onChange={(e) => setReapplyMessage(e.target.value)}
            disabled={reapplying} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReapply(null)} disabled={reapplying}>Cancel</Button>
          <Button variant="contained" onClick={submitReapply} disabled={reapplying}>
            {reapplying ? 'Sending…' : 'Send application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CpPartnershipsPage;

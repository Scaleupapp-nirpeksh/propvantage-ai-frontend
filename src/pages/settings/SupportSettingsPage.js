// File: src/pages/settings/SupportSettingsPage.js
// Admin view of the org's helpdesk address (auto-provisioned). Share this address
// with clients; inbound mail to it becomes tickets routed to the right dept head.
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Tooltip, Button, Stack,
  Chip, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ContentCopy, Autorenew, SupportAgent, MarkEmailRead } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';
import { PageHeader } from '../../components/common';

const PREFIXES = ['legal', 'sales', 'crm', 'finance'];

const SupportSettingsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isOwner, user } = useAuth();
  const canManage = isOwner || ['Business Head', 'admin', 'owner'].includes(user?.role);

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenOpen, setRegenOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportAPI.getInbox();
      setAddress(res.data?.data?.address || '');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load the helpdesk address.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const copy = () => {
    navigator.clipboard?.writeText(address);
    enqueueSnackbar('Helpdesk address copied.', { variant: 'success' });
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const res = await supportAPI.regenerateInbox(slug.trim() || undefined);
      setAddress(res.data?.data?.address || '');
      setRegenOpen(false);
      setSlug('');
      enqueueSnackbar('Helpdesk address updated.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update the address.', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Helpdesk settings" subtitle="Your support email address for clients" icon={SupportAgent} />

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 2, maxWidth: 760 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <MarkEmailRead color="primary" />
          <Typography variant="h6" fontWeight={700}>Your helpdesk address</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Share this address with your clients. Any email they send here is automatically
          turned into a ticket, the client gets an instant acknowledgement with a live status
          link, and the request is assigned to the right department head.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={22} /></Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={address}
                size="small"
                fullWidth
                InputProps={{ readOnly: true, sx: { fontWeight: 600, fontSize: '1rem' } }}
                sx={{ maxWidth: 520 }}
              />
              <Tooltip title="Copy">
                <IconButton onClick={copy}><ContentCopy fontSize="small" /></IconButton>
              </Tooltip>
              {canManage && (
                <Tooltip title="Change address">
                  <IconButton onClick={() => setRegenOpen(true)}><Autorenew fontSize="small" /></IconButton>
                </Tooltip>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              How it routes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Ask clients to start the subject line with the area their query relates to (case-insensitive).
              The ticket is auto-assigned to that department's head:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PREFIXES.map((p) => (
                <Chip key={p} label={`${p} — …`} size="small" sx={{ textTransform: 'capitalize' }} />
              ))}
              <Chip label="anything else → triage" size="small" variant="outlined" />
            </Stack>
          </>
        )}
      </Paper>

      <Dialog open={regenOpen} onClose={() => setRegenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change helpdesk address</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pick a new prefix. Existing clients using the old address will no longer reach you, so
            change this only during setup.
          </Typography>
          <TextField
            label="New prefix"
            placeholder="e.g. 25south"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            fullWidth size="small"
            helperText="Letters and numbers only. Leave blank to derive from your organization name."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={regenerate} disabled={busy}>
            {busy ? 'Updating…' : 'Update address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportSettingsPage;

// File: src/pages/reports/ReportReviewPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Button, Chip, Stack, Typography, IconButton, Tooltip, Alert,
  List, ListItem, ListItemText, Snackbar, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, EditNote, Flag, CheckCircle, Send, Undo, OpenInNew, DoneAll } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { reportAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';
import OverrideDialog from '../../components/reports/OverrideDialog';
import FlagDialog from '../../components/reports/FlagDialog';
import { availableReviewActions, applyOverrides } from '../../utils/review';
import { reportShareUrl } from '../../utils/reportShare';

const ReportReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checkPerm } = useAuth();
  const canApprove = checkPerm('reports:approve');

  const [instance, setInstance] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [overrideBlock, setOverrideBlock] = useState(null);
  const [flagBlock, setFlagBlock] = useState(null);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, catRes, usersRes] = await Promise.all([
        reportAPI.getInstance(id), reportAPI.getCatalog(), userAPI.getUsers(),
      ]);
      setInstance(instRes.data?.data || null);
      setCatalog(catRes.data?.data || []);
      setUsers(usersRes.data?.data || usersRes.data?.users || []);
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const status = instance?.review?.status || 'draft';
  const actions = availableReviewActions(status, canApprove);
  const overrides = instance?.overrides || [];
  const flags = instance?.flags || [];

  // Blocks enriched with kind (from catalog) + overrides applied, for the review canvas.
  const blocks = applyOverrides(
    (instance?.blocks || [])
      .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((b) => ({ ...b, kind: b.kind || catalog.find((c) => c.type === b.type)?.kind })),
    overrides
  );

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); setToast({ severity: 'success', msg: okMsg }); await load(); }
    catch (err) { setToast({ severity: 'error', msg: err.response?.data?.message || 'Action failed' }); }
    finally { setBusy(false); }
  };

  const shareUrl = reportShareUrl(instance?.publicSlug);

  return (
    <Box>
      <PageHeader
        title={instance?.title || 'Review report'}
        subtitle="Check every value. Override or flag anything wrong, then approve."
        loading={loading}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports/generated')}>Back</Button>
            <Chip label={status.replace('_', ' ')} color={status === 'approved' ? 'success' : status === 'in_review' ? 'info' : 'default'} />
            {actions.submit && <Button variant="contained" startIcon={<Send />} disabled={busy}
              onClick={() => run(() => reportAPI.submitReview(id), 'Submitted for review')}>Submit for review</Button>}
            {actions.requestChanges && <Button color="warning" startIcon={<Undo />} disabled={busy}
              onClick={() => setChangesOpen(true)}>Request changes</Button>}
            {actions.approve && <Button variant="contained" color="success" startIcon={<CheckCircle />} disabled={busy}
              onClick={() => run(() => reportAPI.approveReport(id), 'Report approved')}>Approve</Button>}
          </Stack>
        }
      />

      {status === 'approved' && shareUrl && (
        <Alert severity="success" sx={{ mb: 2 }}
          action={<>
            <Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy</Button>
            <Button color="inherit" size="small" startIcon={<OpenInNew />} href={shareUrl} target="_blank" rel="noreferrer">Open</Button>
            <Button color="inherit" size="small" startIcon={<Send />} disabled={busy}
              onClick={() => run(() => reportAPI.sendReport(id), 'Report sent to stakeholders')}>Send to stakeholders</Button>
          </>}>
          Approved — public link is live: {shareUrl}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {blocks.map((block) => {
              const overridden = overrides.some((o) => o.blockId === block.id);
              const canOverride = block.kind === 'kpi' && status !== 'approved';
              const canFlag = status !== 'approved';
              return (
                <Paper key={block.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    {overridden && <Chip size="small" color="info" label="overridden" />}
                    {canOverride && <Tooltip title="Override value"><IconButton size="small" onClick={() => setOverrideBlock(block)}><EditNote fontSize="small" /></IconButton></Tooltip>}
                    {canFlag && <Tooltip title="Flag for correction"><IconButton size="small" onClick={() => setFlagBlock(block)}><Flag fontSize="small" /></IconButton></Tooltip>}
                  </Box>
                  <ReportBlockRenderer block={block} images={instance?.images || []} />
                </Paper>
              );
            })}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Flags ({flags.filter((f) => f.status === 'open').length} open)</Typography>
            {flags.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No flags. Hover a block and use the flag icon to raise one.</Typography>
            ) : (
              <List dense>
                {flags.map((f) => (
                  <ListItem key={f.id} disableGutters
                    secondaryAction={f.status === 'open' && status !== 'approved'
                      ? <Tooltip title="Mark resolved"><IconButton edge="end" size="small"
                          onClick={() => run(() => reportAPI.resolveFlag(id, f.id), 'Flag resolved')}><DoneAll fontSize="small" /></IconButton></Tooltip>
                      : null}>
                    <ListItemText
                      primary={<><Chip size="small" label={f.severity} sx={{ mr: 1 }} />{f.note}</>}
                      secondary={f.status === 'resolved' ? 'Resolved' : 'Open'} />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <OverrideDialog open={!!overrideBlock} block={overrideBlock}
        onClose={() => setOverrideBlock(null)}
        onSave={(payload) => { setOverrideBlock(null); run(() => reportAPI.addOverride(id, payload), 'Override saved'); }} />
      <FlagDialog open={!!flagBlock} block={flagBlock} users={users}
        onClose={() => setFlagBlock(null)}
        onSave={(payload) => { setFlagBlock(null); run(() => reportAPI.addFlag(id, payload), 'Flag raised'); }} />

      <Dialog open={changesOpen} onClose={() => setChangesOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request changes</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline minRows={3} size="small" label="What needs to change?" value={changesNote}
            onChange={(e) => setChangesNote(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangesOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning"
            onClick={() => { setChangesOpen(false); run(() => reportAPI.requestChanges(id, changesNote), 'Changes requested'); }}>Send</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default ReportReviewPage;

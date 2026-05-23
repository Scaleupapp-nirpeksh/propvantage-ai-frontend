// File: src/pages/leads/LeadRegistrationsPage.js
// SP4 — Developer-side queue of pending lead registrations from Channel Partners.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, Drawer, IconButton, Divider, Stack,
  Button, TextField, Tooltip,
} from '@mui/material';
import { Close, Refresh, Check, Cancel } from '@mui/icons-material';
import { leadRegistrationsAPI } from '../../services/api';

const fmtRelative = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString();
};

const fmtMoney = (n, ccy = 'INR') =>
  (n === undefined || n === null || n === '') ? '—' : `${ccy} ${Number(n).toLocaleString()}`;

const getAgentName = (lead) => {
  const partner = lead?.channelPartnerAttribution?.partners?.[0];
  const agent = partner?.agentUser;
  if (!agent) return '—';
  if (typeof agent === 'object') return `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email || '—';
  return String(agent);
};

const LeadRegistrationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ ok: '', err: '' });

  const [drawerId, setDrawerId] = useState(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    leadRegistrationsAPI.list()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load registrations.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeDrawer = () => {
    setDrawerId(null);
    setRejectMode(false);
    setRejectNote('');
  };

  const handleDecide = async (id, action, note) => {
    setActionBusy(true);
    try {
      await leadRegistrationsAPI.decide(id, { action, note: note || undefined });
      setSnack({ ok: `Lead ${action}ed.`, err: '' });
      closeDrawer();
      load();
    } catch (err) {
      setSnack({ ok: '', err: err.response?.data?.message || 'Could not complete action.' });
    } finally {
      setActionBusy(false);
    }
  };

  const drawerLead = items.find((l) => l._id === drawerId);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Pending Lead Registrations</Typography>
          <Typography variant="body2" color="text.secondary">
            Leads pushed by your Channel Partners awaiting your acceptance.
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip>
      </Box>

      {snack.ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.ok}</Alert>}
      {snack.err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.err}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No pending registrations.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CP Org</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Duplicate?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((lead) => (
                  <TableRow key={lead._id} hover sx={{ cursor: 'pointer' }} onClick={() => setDrawerId(lead._id)}>
                    <TableCell>{lead.cpOrgName || '—'}</TableCell>
                    <TableCell>{getAgentName(lead)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{lead.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell>{lead.project?.name || (typeof lead.project === 'string' ? lead.project : '—')}</TableCell>
                    <TableCell>{fmtRelative(lead.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {lead.duplicateMatch ? (
                        <Chip
                          size="small"
                          color="warning"
                          label={`Possible duplicate of ${lead.duplicateMatch.name} (${lead.duplicateMatch.lastContactedDaysAgo}d ago)`}
                          onClick={() => navigate(`/leads/${lead.duplicateMatch._id}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Chip size="small" label="No" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Detail drawer */}
      <Drawer anchor="right" open={!!drawerId} onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Lead Registration</Typography>
          <IconButton onClick={closeDrawer}><Close /></IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {!drawerLead ? (
          <Typography variant="body2" color="text.secondary">Lead no longer in queue.</Typography>
        ) : (
          <Box>
            <Typography variant="overline" color="text.secondary">Contact</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {`${drawerLead.firstName || ''} ${drawerLead.lastName || ''}`.trim() || '—'}
            </Typography>
            <Typography variant="body2">{drawerLead.phone || '—'}</Typography>
            {drawerLead.email && <Typography variant="body2" color="text.secondary">{drawerLead.email}</Typography>}

            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" color="text.secondary">Submitted by</Typography>
            <Typography variant="body2"><strong>{drawerLead.cpOrgName || '—'}</strong></Typography>
            <Typography variant="body2">Agent: {getAgentName(drawerLead)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {drawerLead.createdAt ? new Date(drawerLead.createdAt).toLocaleString() : ''}
            </Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" color="text.secondary">Project</Typography>
            <Typography variant="body2">
              {drawerLead.project?.name || (typeof drawerLead.project === 'string' ? drawerLead.project : '—')}
            </Typography>

            {drawerLead.budget && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">Budget</Typography>
                <Typography variant="body2">
                  {fmtMoney(drawerLead.budget.min, drawerLead.budget.currency || 'INR')}
                  {' – '}
                  {fmtMoney(drawerLead.budget.max, drawerLead.budget.currency || 'INR')}
                </Typography>
              </>
            )}

            {drawerLead.requirements && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">Requirements</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{drawerLead.requirements}</Typography>
              </>
            )}

            {drawerLead.sourceProspect?.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">CP Agent's Note</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {drawerLead.sourceProspect.notes}
                </Typography>
              </>
            )}

            {drawerLead.duplicateMatch && (
              <Alert severity="warning" sx={{ mt: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => navigate(`/leads/${drawerLead.duplicateMatch._id}`)}>
                    View
                  </Button>
                }>
                Possible duplicate of {drawerLead.duplicateMatch.name} ({drawerLead.duplicateMatch.lastContactedDaysAgo}d ago).
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            {!rejectMode ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" color="success" startIcon={<Check />}
                  onClick={() => handleDecide(drawerLead._id, 'accept')} disabled={actionBusy}>
                  Accept
                </Button>
                <Button variant="outlined" color="error" startIcon={<Cancel />}
                  onClick={() => setRejectMode(true)} disabled={actionBusy}>
                  Reject
                </Button>
              </Stack>
            ) : (
              <Box>
                <Typography variant="overline" color="text.secondary">Reject Reason</Typography>
                <TextField fullWidth multiline minRows={3} sx={{ mt: 1, mb: 1 }}
                  placeholder="Why are you rejecting this lead?"
                  value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" color="error"
                    onClick={() => handleDecide(drawerLead._id, 'reject', rejectNote)}
                    disabled={actionBusy}>
                    Confirm Reject
                  </Button>
                  <Button onClick={() => { setRejectMode(false); setRejectNote(''); }} disabled={actionBusy}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default LeadRegistrationsPage;

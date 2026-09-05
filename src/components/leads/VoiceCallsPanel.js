// File: src/components/leads/VoiceCallsPanel.js
// Description: AI voice calls for one lead — place a call and review each call's
//   status, outcome, recording, transcript and the actions the agent took.
//   Polls while a call is live so the card updates as the call progresses.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack, Collapse, IconButton,
  CircularProgress, Tooltip, Divider, Alert, ButtonGroup, Menu, MenuItem, ListItemText,
} from '@mui/material';
import { PhoneInTalk, ExpandMore, ExpandLess, GraphicEq, Refresh, ArrowDropDown } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { voiceAPI } from '../../services/api';

const LIVE = new Set(['queued', 'ringing', 'in-progress', 'forwarding']);

const statusColor = (s) => ({
  queued: 'default', ringing: 'info', 'in-progress': 'success', forwarding: 'info', ended: 'default', failed: 'error',
}[s] || 'default');

const fmtDuration = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

const fmtWhen = (iso) => {
  try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
};

const ACTION_LABELS = {
  get_available_units: 'Checked inventory',
  update_lead_qualification: 'Saved qualification',
  schedule_site_visit: 'Booked site visit',
  set_follow_up: 'Set follow-up',
  request_human_callback: 'Requested callback',
  mark_do_not_call: 'Marked do-not-call',
  task_created: 'Created task',
};

const CallRow = ({ call }) => {
  const [open, setOpen] = useState(false);
  const actions = (call.actionsTaken || []).filter((a) => a.ok !== false);
  const live = LIVE.has(call.status);
  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" label={live ? call.status.replace('-', ' ') : (call.outcome || call.status)} color={live ? statusColor(call.status) : (call.status === 'failed' ? 'error' : 'default')} variant={live ? 'filled' : 'outlined'} />
        <Typography variant="body2" color="text.secondary">{fmtWhen(call.createdAt)}</Typography>
        {call.durationSec > 0 && <Typography variant="body2" color="text.secondary">· {fmtDuration(call.durationSec)}</Typography>}
        {call.trigger === 'auto_new_lead' && <Chip size="small" label="auto" variant="outlined" />}
        {call.handoffRequested && <Chip size="small" label="Callback requested" color="warning" variant="outlined" />}
        <Box sx={{ flexGrow: 1 }} />
        {live && <CircularProgress size={16} />}
        {(call.transcript || call.summary || call.error) && (
          <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label="toggle details">
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Stack>
      {call.summary && (
        <Typography variant="body2" sx={{ mt: 0.75 }}>{call.summary}</Typography>
      )}
      {call.error && <Alert severity="error" sx={{ mt: 1 }} variant="outlined">{call.error}</Alert>}
      {actions.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          {actions.map((a, i) => (
            <Chip key={i} size="small" label={ACTION_LABELS[a.tool] || a.tool} variant="outlined" color="primary" />
          ))}
        </Stack>
      )}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1.5 }}>
          {call.recordingUrl && (
            <Box sx={{ mb: 1.5 }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={call.recordingUrl} style={{ width: '100%' }} />
            </Box>
          )}
          {call.transcript ? (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, maxHeight: 320, overflow: 'auto' }}>
              {call.transcript.split('\n').map((line, i) => {
                const isAI = /^(AI|assistant|bot)\s*:/i.test(line);
                return (
                  <Typography key={i} variant="body2" sx={{ mb: 0.5, color: isAI ? 'primary.main' : 'text.primary' }}>
                    {line}
                  </Typography>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No transcript for this call.</Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const VoiceCallsPanel = ({ lead, onLeadChanged }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [playbooks, setPlaybooks] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const hadLiveRef = useRef(false);

  useEffect(() => {
    voiceAPI.listPlaybooks().then((res) => setPlaybooks(res.data?.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!lead?._id) return;
    try {
      const res = await voiceAPI.listCalls(lead._id);
      const list = res.data?.data || [];
      setCalls(list);
      const anyLive = list.some((c) => LIVE.has(c.status));
      if (hadLiveRef.current && !anyLive) onLeadChanged?.(); // a call just ended → lead fields may have changed
      hadLiveRef.current = anyLive;
    } catch (err) {
      // Silent: the panel is secondary to the lead page.
    } finally {
      setLoading(false);
    }
  }, [lead?._id, onLeadChanged]);

  useEffect(() => { load(); }, [load]);

  // Poll while any call is live.
  const anyLive = calls.some((c) => LIVE.has(c.status));
  useEffect(() => {
    if (!anyLive) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [anyLive, load]);

  const placeCall = async (playbook = null) => {
    setMenuAnchor(null);
    setPlacing(true);
    try {
      await voiceAPI.createCall(lead._id, undefined, playbook?._id);
      enqueueSnackbar(`Calling ${lead.firstName || 'the lead'} now${playbook ? ` — ${playbook.name}` : ''}…`, { variant: 'success' });
      await load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not place the call.', { variant: 'error' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <GraphicEq color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>AI calls</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh"><span><IconButton size="small" onClick={load} disabled={loading}><Refresh fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title={lead.doNotCall ? 'This lead asked not to be called' : 'Have the AI agent call this lead now'}>
            <span>
              <ButtonGroup variant="contained" size="small" disabled={placing || anyLive || Boolean(lead.doNotCall) || !lead.phone}>
                <Button startIcon={placing ? <CircularProgress size={14} color="inherit" /> : <PhoneInTalk />} onClick={() => placeCall(null)}>
                  {anyLive ? 'Call in progress' : 'Call with AI'}
                </Button>
                {playbooks.length > 0 && (
                  <Button size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="choose playbook"><ArrowDropDown /></Button>
                )}
              </ButtonGroup>
            </span>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => placeCall(null)}><ListItemText primary="Default — qualify & book a visit" /></MenuItem>
            {playbooks.map((pb) => (
              <MenuItem key={pb._id} onClick={() => placeCall(pb)}>
                <ListItemText primary={pb.name} secondary={pb.triggerLabel} />
              </MenuItem>
            ))}
          </Menu>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          The agent calls from your configured number, qualifies the buyer, quotes live inventory, and books the site visit — everything it learns is saved to this lead.
        </Typography>
        <Divider />
        {loading ? (
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></Box>
        ) : calls.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No AI calls yet.</Typography>
        ) : (
          calls.map((c, i) => (
            <React.Fragment key={c._id}>
              <CallRow call={c} />
              {i < calls.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceCallsPanel;

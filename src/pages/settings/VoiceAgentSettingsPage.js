// File: src/pages/settings/VoiceAgentSettingsPage.js
// Description: Org-level control room for the AI voice agent — status at a glance,
//   persona/voice/guardrails, a test call with live status, what the caller hears,
//   and the org's recent AI calls.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, Switch, FormControlLabel, Divider,
  CircularProgress, Alert, Chip, Grid, Stepper, Step, StepLabel,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip, Link,
} from '@mui/material';
import {
  RecordVoiceOver, PhoneInTalk, Save, Refresh, OpenInNew, CheckCircle, RadioButtonUnchecked,
  GraphicEq,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { voiceAPI } from '../../services/api';
import { PageHeader } from '../../components/common';

const LIVE = new Set(['queued', 'ringing', 'in-progress', 'forwarding']);
const STEPS = ['Placing', 'Ringing', 'In progress', 'Ended'];
const stepFor = (s) => ({ queued: 0, ringing: 1, 'in-progress': 2, forwarding: 2, ended: 3, failed: 3 }[s] ?? 0);

const fmtDuration = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};
const fmtWhen = (iso) => {
  try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
};
const TRIGGER_LABEL = { manual: 'Manual', auto_new_lead: 'Auto', test: 'Test' };

const Tile = ({ label, value, sub, color }) => (
  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>{label}</Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, color: color || 'text.primary', lineHeight: 1.2, mt: 0.5 }}>{value}</Typography>
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
  </Paper>
);

const VoiceAgentSettingsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    enabled: false, autoCallNewLeads: false, hindiSwitching: true, agentName: 'Aanya',
    callingHours: { start: '09:00', end: '21:00' }, monthlyMinuteBudget: 300, voicePreset: 'arushi',
  });
  const [dirty, setDirty] = useState(false);

  const [testPhone, setTestPhone] = useState(user?.phoneNumber || '');
  const [testing, setTesting] = useState(false);
  const [liveCall, setLiveCall] = useState(null);
  const pollRef = useRef(null);

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const setF = (patch) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); };

  const load = useCallback(async () => {
    try {
      const res = await voiceAPI.getSettings();
      const d = res.data?.data || {};
      setSettings(d);
      const preset = (d.voicePresets || []).find((p) => p.voiceId === d.voice?.voiceId)?.key || 'arushi';
      setForm({
        enabled: Boolean(d.enabled),
        autoCallNewLeads: Boolean(d.autoCallNewLeads),
        hindiSwitching: d.hindiSwitching !== false,
        agentName: d.agentName || 'Aanya',
        callingHours: { start: d.callingHours?.start || '09:00', end: d.callingHours?.end || '21:00' },
        monthlyMinuteBudget: d.monthlyMinuteBudget ?? 300,
        voicePreset: preset,
      });
      setDirty(false);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load voice agent settings.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await voiceAPI.listCalls(undefined);
      setRecent(res.data?.data || []);
    } catch { /* secondary */ } finally { setRecentLoading(false); }
  }, []);

  useEffect(() => { load(); loadRecent(); }, [load, loadRecent]);

  // Poll the live test call until it ends.
  useEffect(() => {
    if (!liveCall || !LIVE.has(liveCall.status)) return undefined;
    pollRef.current = setInterval(async () => {
      try {
        const res = await voiceAPI.getCall(liveCall._id);
        const c = res.data?.data;
        if (c) {
          setLiveCall(c);
          if (!LIVE.has(c.status)) { clearInterval(pollRef.current); load(); loadRecent(); }
        }
      } catch { /* keep polling */ }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [liveCall, load, loadRecent]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await voiceAPI.updateSettings({ ...form, monthlyMinuteBudget: Number(form.monthlyMinuteBudget) || 0 });
      const { synced, syncError } = res.data || {};
      enqueueSnackbar(synced ? 'Saved — the agent is updated and live.' : (syncError ? `Saved, but the agent could not be synced: ${syncError}` : 'Saved.'), { variant: syncError ? 'warning' : 'success' });
      await load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const placeTest = async () => {
    setTesting(true);
    try {
      const res = await voiceAPI.testCall({ phone: testPhone });
      setLiveCall(res.data?.data || null);
      enqueueSnackbar(`Calling ${testPhone} — pick up!`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Test call failed.', { variant: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const presets = useMemo(() => settings?.voicePresets || [], [settings]);
  const selectedPreset = useMemo(() => presets.find((p) => p.key === form.voicePreset), [presets, form.voicePreset]);
  const phoneReady = Boolean(settings?.phoneNumber) || (settings?.phoneNumberSource && settings.phoneNumberSource !== 'none');
  const usage = settings?.usage || { calls: 0, minutes: 0 };
  const firstMessage = `Hi, this is ${form.agentName || 'Aanya'} calling from {project} on behalf of {executive}. Am I speaking with {first name}?`;

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Voice Agent"
        subtitle="An AI assistant that calls your leads, qualifies them, quotes live inventory, and books site visits — in Indian English, switching to Hindi when the caller does."
        icon={RecordVoiceOver}
      />

      {!settings?.configured && (
        <Alert severity="warning" sx={{ mb: 2 }}>Voice calling is not configured on the server yet (provider key missing). Settings can be saved, but calls will not go out.</Alert>
      )}

      {/* Status strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Tile label="Agent" value={settings?.enabled ? 'On' : 'Off'} color={settings?.enabled ? 'success.main' : 'text.secondary'}
            sub={settings?.enabled ? (settings?.autoCallNewLeads ? 'auto-calls new leads' : 'manual calls only') : 'switch on and save'} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label="Buyers see calls from" value={settings?.phoneNumber || '—'} sub={phoneReady ? 'your dedicated calling number' : 'no calling number configured'} color={phoneReady ? 'text.primary' : 'error.main'} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label="Assistant" value={settings?.assistantSynced ? 'Synced' : 'Not created yet'} sub={settings?.assistantSynced ? 'updates on every save' : 'created on first save or call'} color={settings?.assistantSynced ? 'success.main' : 'text.secondary'} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Tile label="This month" value={`${usage.calls} calls · ${usage.minutes} min`} sub={`budget ${form.monthlyMinuteBudget || '∞'} min`} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* LEFT — configuration */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Agent</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Who calls, and how it sounds.</Typography>
            <Stack spacing={2}>
              <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => setF({ enabled: e.target.checked })} />} label="Voice agent enabled" />
              <TextField
                label="Agent name" value={form.agentName} onChange={(e) => setF({ agentName: e.target.value })} size="small" fullWidth
                helperText="It always says it is calling on behalf of the assigned executive — it never claims to be them."
              />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Voice</Typography>
                <Grid container spacing={1.5}>
                  {presets.map((p) => {
                    const selected = form.voicePreset === p.key;
                    const [name, desc] = p.label.split(' — ');
                    return (
                      <Grid item xs={12} sm={6} key={p.key}>
                        <Paper
                          variant="outlined"
                          onClick={() => setF({ voicePreset: p.key })}
                          sx={{
                            p: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                            borderColor: selected ? 'primary.main' : 'divider', bgcolor: selected ? 'primary.50' : 'background.paper',
                            borderWidth: selected ? 2 : 1, transition: 'all .15s', '&:hover': { borderColor: 'primary.main' },
                          }}
                        >
                          {selected ? <CheckCircle color="primary" fontSize="small" /> : <RadioButtonUnchecked fontSize="small" sx={{ color: 'text.disabled' }} />}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{desc}</Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Pick, save, then place a test call to hear it.
                </Typography>
              </Box>
              <FormControlLabel control={<Switch checked={form.hindiSwitching} onChange={(e) => setF({ hindiSwitching: e.target.checked })} />} label="Switch to Hindi / Hinglish when the caller does" />
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Guardrails</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>When it may call, and how much it may spend.</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={form.autoCallNewLeads} onChange={(e) => setF({ autoCallNewLeads: e.target.checked })} disabled={!form.enabled} />}
                label="Automatically call every new lead within a minute (inside calling hours)"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField size="small" label="Calls from (IST)" type="time" value={form.callingHours.start}
                  onChange={(e) => setF({ callingHours: { ...form.callingHours, start: e.target.value } })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Calls until (IST)" type="time" value={form.callingHours.end}
                  onChange={(e) => setF({ callingHours: { ...form.callingHours, end: e.target.value } })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Monthly minute budget" type="number" value={form.monthlyMinuteBudget}
                  onChange={(e) => setF({ monthlyMinuteBudget: e.target.value })} helperText="0 = no limit" />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={save} disabled={saving || !dirty}>
                  Save changes
                </Button>
                {dirty && <Typography variant="caption" color="warning.main">Unsaved changes</Typography>}
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT — test + preview + number */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3, border: 2, borderColor: 'primary.main' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <GraphicEq color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Test call</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rings the number below as a new lead named <strong>Voice Test</strong> on your first project, assigned to you.
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Your mobile" placeholder="+91 98765 43210" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} fullWidth />
              <Button variant="contained" startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <PhoneInTalk />} onClick={placeTest}
                disabled={testing || !testPhone || (liveCall && LIVE.has(liveCall.status))} sx={{ whiteSpace: 'nowrap' }}>
                Call me
              </Button>
            </Stack>
            {liveCall && (
              <Box sx={{ mt: 2.5 }}>
                <Stepper activeStep={stepFor(liveCall.status)} alternativeLabel>
                  {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
                </Stepper>
                <Box sx={{ mt: 1.5 }}>
                  {LIVE.has(liveCall.status) ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={14} />
                      <Typography variant="body2">{liveCall.status === 'in-progress' ? 'Talking…' : 'Connecting…'}</Typography>
                    </Stack>
                  ) : liveCall.status === 'failed' ? (
                    <Alert severity="error" variant="outlined">{liveCall.error || 'The call could not be placed.'}</Alert>
                  ) : (
                    <Alert severity="success" variant="outlined"
                      action={liveCall.lead && (
                        <Button size="small" endIcon={<OpenInNew />} onClick={() => navigate(`/leads/${liveCall.lead?._id || liveCall.lead}`)}>Open lead</Button>
                      )}>
                      <strong>{liveCall.outcome || 'Ended'}</strong>{liveCall.durationSec ? ` · ${fmtDuration(liveCall.durationSec)}` : ''}
                      {liveCall.summary && <Typography variant="body2" sx={{ mt: 0.5 }}>{liveCall.summary}</Typography>}
                    </Alert>
                  )}
                </Box>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>What the caller hears</Typography>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>“{firstMessage}”</Typography>
            </Box>
            <Stack spacing={0.75}>
              {[
                'Confirms it is the right person and a good time.',
                'Learns configuration, budget, timeline and preferences — saves each to the lead as it goes.',
                'Quotes availability and prices only from live inventory; never guesses.',
                'Offers and books a site visit, or sets a follow-up.',
                'Hands over to the executive for pricing, loans, legal or anything it should not decide.',
                `Speaks Indian English${form.hindiSwitching ? ', switching to Hinglish if the caller does' : ''}; ${selectedPreset ? selectedPreset.label.split(' — ')[0] : 'Arushi'} voice.`,
              ].map((t, i) => (
                <Typography key={i} variant="body2" color="text.secondary">— {t}</Typography>
              ))}
            </Stack>
          </Paper>

        </Grid>

        {/* BOTTOM — recent calls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent AI calls</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Refresh"><span><IconButton size="small" onClick={loadRecent} disabled={recentLoading}><Refresh fontSize="small" /></IconButton></span></Tooltip>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {recent.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No calls yet — place a test call above, or open any lead and click <strong>Call with AI</strong>.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When</TableCell><TableCell>Lead</TableCell><TableCell>Trigger</TableCell>
                      <TableCell>Outcome</TableCell><TableCell align="right">Duration</TableCell><TableCell align="right">Cost</TableCell><TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent.map((c) => {
                      const leadId = c.lead?._id || c.lead;
                      const leadName = c.lead ? `${c.lead.firstName || ''} ${c.lead.lastName || ''}`.trim() || c.lead.phone : '—';
                      const live = LIVE.has(c.status);
                      return (
                        <TableRow key={c._id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtWhen(c.createdAt)}</TableCell>
                          <TableCell>{leadId ? <Link component="button" underline="hover" onClick={() => navigate(`/leads/${leadId}`)}>{leadName}</Link> : leadName}</TableCell>
                          <TableCell><Chip size="small" variant="outlined" label={TRIGGER_LABEL[c.trigger] || c.trigger} /></TableCell>
                          <TableCell>
                            <Chip size="small" label={live ? c.status.replace('-', ' ') : (c.outcome || c.status)}
                              color={live ? 'info' : c.status === 'failed' ? 'error' : c.handoffRequested ? 'warning' : 'default'} variant={live ? 'filled' : 'outlined'} />
                          </TableCell>
                          <TableCell align="right">{c.durationSec ? fmtDuration(c.durationSec) : '—'}</TableCell>
                          <TableCell align="right">{c.costUsd ? `$${c.costUsd.toFixed(2)}` : '—'}</TableCell>
                          <TableCell align="right">
                            {c.recordingUrl && (
                              <Tooltip title="Open recording"><IconButton size="small" component="a" href={c.recordingUrl} target="_blank" rel="noreferrer"><OpenInNew fontSize="small" /></IconButton></Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VoiceAgentSettingsPage;

// File: src/pages/settings/VoiceAgentSettingsPage.js
// Description: Org-level configuration for the AI voice agent — on/off, auto-call
//   new leads, persona, voice, calling hours, budget — plus phone-number setup
//   and a self-serve test call.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, Switch, FormControlLabel, MenuItem,
  Divider, CircularProgress, Alert, Chip, Grid,
} from '@mui/material';
import { RecordVoiceOver, PhoneInTalk, Save, Sms } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { voiceAPI } from '../../services/api';
import { PageHeader } from '../../components/common';

const VoiceAgentSettingsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    enabled: false, autoCallNewLeads: false, hindiSwitching: true, agentName: 'Aanya',
    callingHours: { start: '09:00', end: '21:00' }, monthlyMinuteBudget: 300, voicePreset: 'arushi',
  });

  const [twilio, setTwilio] = useState({ accountSid: '', authToken: '', number: '' });
  const [importing, setImporting] = useState(false);

  const [testPhone, setTestPhone] = useState(user?.phoneNumber || '');
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load voice agent settings.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await voiceAPI.updateSettings({ ...form, monthlyMinuteBudget: Number(form.monthlyMinuteBudget) || 0 });
      const { synced, syncError } = res.data || {};
      enqueueSnackbar(synced ? 'Saved — the agent has been updated.' : (syncError ? `Saved, but the agent could not be synced: ${syncError}` : 'Saved.'), { variant: syncError ? 'warning' : 'success' });
      await load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const importNumber = async () => {
    setImporting(true);
    try {
      await voiceAPI.setupPhoneNumber(twilio.accountSid ? twilio : {});
      enqueueSnackbar('Phone number connected.', { variant: 'success' });
      setTwilio({ accountSid: '', authToken: '', number: '' });
      await load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not connect the number.', { variant: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const placeTest = async () => {
    setTesting(true);
    setLastTest(null);
    try {
      const res = await voiceAPI.testCall({ phone: testPhone });
      const s = res.data?.data;
      setLastTest(s);
      enqueueSnackbar(`Calling ${testPhone} now — pick up!`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Test call failed.', { variant: 'error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  const presets = settings?.voicePresets || [];
  const phoneReady = Boolean(settings?.phoneNumber) || settings?.phoneNumberSource !== 'none';

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

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Agent</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />}
                label="Voice agent enabled"
              />
              <FormControlLabel
                control={<Switch checked={form.autoCallNewLeads} onChange={(e) => setForm({ ...form, autoCallNewLeads: e.target.checked })} disabled={!form.enabled} />}
                label="Automatically call every new lead within a minute (inside calling hours)"
              />
              <FormControlLabel
                control={<Switch checked={form.hindiSwitching} onChange={(e) => setForm({ ...form, hindiSwitching: e.target.checked })} />}
                label="Switch to Hindi / Hinglish when the caller does"
              />
              <TextField
                label="Agent name"
                value={form.agentName}
                onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                helperText='Introduces itself as "{name}, calling from {project} on behalf of {assigned executive}".'
                size="small"
                fullWidth
              />
              <TextField
                select size="small" label="Voice" value={form.voicePreset}
                onChange={(e) => setForm({ ...form, voicePreset: e.target.value })}
                helperText="Change, save, and place a test call to hear the difference."
                fullWidth
              >
                {presets.map((p) => <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>)}
              </TextField>
              <Stack direction="row" spacing={2}>
                <TextField size="small" label="Calls from (IST)" type="time" value={form.callingHours.start}
                  onChange={(e) => setForm({ ...form, callingHours: { ...form.callingHours, start: e.target.value } })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Calls until (IST)" type="time" value={form.callingHours.end}
                  onChange={(e) => setForm({ ...form, callingHours: { ...form.callingHours, end: e.target.value } })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Monthly minute budget" type="number" value={form.monthlyMinuteBudget}
                  onChange={(e) => setForm({ ...form, monthlyMinuteBudget: e.target.value })} helperText="0 = no limit" />
              </Stack>
              <Box>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={save} disabled={saving}>
                  Save
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Phone number</Typography>
            {phoneReady ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Chip icon={<Sms />} label={settings?.phoneNumber || 'Configured on server'} color="success" variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {settings?.phoneNumberSource === 'org' ? 'connected for this organisation' : 'from server configuration'}
                </Typography>
              </Stack>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>Connect a Twilio number so the agent has a caller ID.</Alert>
            )}
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Connect a different Twilio number</Typography>
            <Stack spacing={1.5}>
              <TextField size="small" label="Twilio Account SID" value={twilio.accountSid} onChange={(e) => setTwilio({ ...twilio, accountSid: e.target.value })} />
              <TextField size="small" label="Twilio Auth Token" type="password" value={twilio.authToken} onChange={(e) => setTwilio({ ...twilio, authToken: e.target.value })} />
              <TextField size="small" label="Number (E.164, e.g. +14155551234)" value={twilio.number} onChange={(e) => setTwilio({ ...twilio, number: e.target.value })} />
              <Box>
                <Button variant="outlined" onClick={importNumber} disabled={importing || !(twilio.accountSid && twilio.authToken && twilio.number)}>
                  {importing ? 'Connecting…' : 'Connect number'}
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Test call</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Calls the number below as if it were a new lead on your first project, assigned to you. The lead and the call appear under Leads afterwards.
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Your mobile" placeholder="+91 98765 43210" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} fullWidth />
              <Button variant="contained" startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <PhoneInTalk />} onClick={placeTest} disabled={testing || !testPhone}>
                Call me
              </Button>
            </Stack>
            {lastTest && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Call placed (status: {lastTest.status}). Open the lead <strong>Voice Test</strong> to follow it live.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VoiceAgentSettingsPage;

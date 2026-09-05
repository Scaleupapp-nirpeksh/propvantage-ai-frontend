// File: src/pages/settings/voice/PlaybooksTab.js
// Description: Call playbooks — list, create from template, and a plain-language
//   editor (basics · trigger · audience · timing · objective · actions & handover)
//   with a "test on my number" action.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Switch, Chip, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, TextField, FormControlLabel, Checkbox, Divider, IconButton, Tooltip, CircularProgress, Alert,
  Autocomplete, FormGroup,
} from '@mui/material';
import { Add, Edit, Delete, PhoneInTalk, Close, Save } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../context/AuthContext';
import { voiceAPI, projectAPI } from '../../../services/api';
import { TOOL_LABELS, HANDOVER_LABELS, LEAD_STATUSES, NOTIFY_ROLES, TRIGGER_PARAM_FIELDS, VARIABLE_HINTS } from './voiceConstants';

const Section = ({ title, hint, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
    {hint && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{hint}</Typography>}
    {children}
  </Box>
);

const linesToList = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const listToLines = (a) => (Array.isArray(a) ? a.join('\n') : '');

const PlaybookEditor = ({ open, playbook, templates, projects, onClose, onSaved }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState(user?.phoneNumber || '');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!playbook) { setForm(null); return; }
    setForm({
      name: playbook.name || '', description: playbook.description || '', enabled: Boolean(playbook.enabled),
      trigger: { type: playbook.trigger?.type, params: { ...(playbook.trigger?.params || {}) } },
      audience: {
        projects: (playbook.audience?.projects || []).map(String),
        minScore: playbook.audience?.minScore ?? '',
        statuses: playbook.audience?.statuses || [],
        skipIfHumanContactHours: playbook.audience?.skipIfHumanContactHours ?? 48,
      },
      timing: {
        window: { start: playbook.timing?.window?.start || '10:00', end: playbook.timing?.window?.end || '19:00' },
        delayMinutes: playbook.timing?.delayMinutes ?? 2,
        retry: { maxAttempts: playbook.timing?.retry?.maxAttempts ?? 2, afterHours: playbook.timing?.retry?.afterHours ?? 4 },
        overrideOrgGuardrails: Boolean(playbook.timing?.overrideOrgGuardrails),
      },
      objective: {
        purpose: playbook.objective?.purpose || '', openingLine: playbook.objective?.openingLine || '',
        mustAsk: listToLines(playbook.objective?.mustAsk), mustNotSay: listToLines(playbook.objective?.mustNotSay),
        extraInstructions: playbook.objective?.extraInstructions || '',
      },
      tools: playbook.tools?.length ? playbook.tools : Object.keys(TOOL_LABELS),
      handover: {
        conditions: playbook.handover?.conditions || [],
        notifyAssigned: playbook.handover?.notifyAssigned !== false,
        notifyRoles: playbook.handover?.notifyRoles || [],
      },
    });
  }, [playbook]);

  const set = (path, value) => setForm((f) => {
    const next = JSON.parse(JSON.stringify(f));
    const keys = path.split('.'); let o = next;
    for (let i = 0; i < keys.length - 1; i += 1) o = o[keys[i]];
    o[keys[keys.length - 1]] = value;
    return next;
  });

  const payload = () => ({
    ...form,
    audience: { ...form.audience, minScore: form.audience.minScore === '' ? null : Number(form.audience.minScore) },
    objective: { ...form.objective, mustAsk: linesToList(form.objective.mustAsk), mustNotSay: linesToList(form.objective.mustNotSay) },
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await voiceAPI.updatePlaybook(playbook._id, payload());
      enqueueSnackbar('Playbook saved.', { variant: 'success' });
      onSaved(res.data?.data);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not save the playbook.', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try {
      await voiceAPI.updatePlaybook(playbook._id, payload());
      await voiceAPI.testPlaybook(playbook._id, testPhone);
      enqueueSnackbar(`Calling ${testPhone} with "${form.name}" — pick up!`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Test call failed.', { variant: 'error' });
    } finally { setTesting(false); }
  };

  if (!form) return null;
  const paramFields = TRIGGER_PARAM_FIELDS[form.trigger.type] || [];
  const triggerLabel = templates.find((t) => t.trigger?.type === form.trigger.type)?.triggerLabel || playbook.triggerLabel || form.trigger.type;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 640 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit playbook</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={onClose}><Close /></IconButton>
        </Stack>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          <Section title="Basics">
            <Stack spacing={1.5}>
              <TextField size="small" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} fullWidth />
              <TextField size="small" label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} fullWidth />
              <FormControlLabel control={<Switch checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />} label="Enabled" />
            </Stack>
          </Section>

          <Section title="When" hint={triggerLabel}>
            <Stack direction="row" spacing={1.5}>
              {paramFields.map((f) => (
                <TextField key={f.key} size="small" type="number" label={f.label} value={form.trigger.params[f.key] ?? f.default}
                  onChange={(e) => set(`trigger.params.${f.key}`, Number(e.target.value))} />
              ))}
              {paramFields.length === 0 && <Typography variant="body2" color="text.secondary">No timing parameters for this trigger.</Typography>}
            </Stack>
          </Section>

          <Section title="For whom" hint="Leave projects and statuses empty to include everyone.">
            <Stack spacing={1.5}>
              <Autocomplete multiple size="small" options={projects} getOptionLabel={(p) => p.name || ''} isOptionEqualToValue={(a, b) => String(a._id) === String(b._id)}
                value={projects.filter((p) => form.audience.projects.includes(String(p._id)))}
                onChange={(e, v) => set('audience.projects', v.map((p) => String(p._id)))}
                renderInput={(params) => <TextField {...params} label="Projects" placeholder="All projects" />} />
              <Autocomplete multiple size="small" options={LEAD_STATUSES} value={form.audience.statuses}
                onChange={(e, v) => set('audience.statuses', v)}
                renderInput={(params) => <TextField {...params} label="Lead statuses" placeholder="Any status" />} />
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="number" label="Minimum lead score" value={form.audience.minScore} onChange={(e) => set('audience.minScore', e.target.value)} placeholder="none" />
                <TextField size="small" type="number" label="Skip if a person contacted them in the last (hours)" value={form.audience.skipIfHumanContactHours}
                  onChange={(e) => set('audience.skipIfHumanContactHours', Number(e.target.value))} sx={{ minWidth: 300 }} />
              </Stack>
            </Stack>
          </Section>

          <Section title="Timing" hint="Calls stay inside the organisation's 9 am–9 pm IST hard window and 3-day cooldown unless you override below.">
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="time" label="From (IST)" value={form.timing.window.start} onChange={(e) => set('timing.window.start', e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="time" label="Until (IST)" value={form.timing.window.end} onChange={(e) => set('timing.window.end', e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="number" label="Delay after trigger (min)" value={form.timing.delayMinutes} onChange={(e) => set('timing.delayMinutes', Number(e.target.value))} />
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="number" label="Max attempts" value={form.timing.retry.maxAttempts} onChange={(e) => set('timing.retry.maxAttempts', Number(e.target.value))} inputProps={{ min: 1, max: 5 }} />
                <TextField size="small" type="number" label="Retry after (hours)" value={form.timing.retry.afterHours} onChange={(e) => set('timing.retry.afterHours', Number(e.target.value))} inputProps={{ min: 1 }} />
              </Stack>
              <FormControlLabel control={<Switch checked={form.timing.overrideOrgGuardrails} onChange={(e) => set('timing.overrideOrgGuardrails', e.target.checked)} />}
                label="Override the organisation's hard window and cooldown for this playbook" />
              {form.timing.overrideOrgGuardrails && <Alert severity="warning" variant="outlined">Use with care — this playbook may call outside 9 am–9 pm and more than once in 3 days.</Alert>}
            </Stack>
          </Section>

          <Section title="What the call is for" hint={`Placeholders you can use: ${VARIABLE_HINTS.join(' ')}`}>
            <Stack spacing={1.5}>
              <TextField size="small" multiline minRows={3} label="Purpose (told to the agent)" value={form.objective.purpose} onChange={(e) => set('objective.purpose', e.target.value)} fullWidth />
              <TextField size="small" label="Opening line (what the caller hears first)" value={form.objective.openingLine} onChange={(e) => set('objective.openingLine', e.target.value)} fullWidth />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField size="small" multiline minRows={3} label="Must find out (one per line)" value={form.objective.mustAsk} onChange={(e) => set('objective.mustAsk', e.target.value)} fullWidth />
                <TextField size="small" multiline minRows={3} label="Must never discuss (one per line)" value={form.objective.mustNotSay} onChange={(e) => set('objective.mustNotSay', e.target.value)} fullWidth />
              </Stack>
              <TextField size="small" multiline minRows={2} label="Extra instructions (tone, limits, special cases)" value={form.objective.extraInstructions} onChange={(e) => set('objective.extraInstructions', e.target.value)} fullWidth />
            </Stack>
          </Section>

          <Section title="What it may do on this call">
            <FormGroup>
              {Object.entries(TOOL_LABELS).map(([k, label]) => (
                <FormControlLabel key={k} control={<Checkbox size="small" checked={form.tools.includes(k)}
                  onChange={(e) => set('tools', e.target.checked ? [...form.tools, k] : form.tools.filter((t) => t !== k))} />} label={label} />
              ))}
            </FormGroup>
          </Section>

          <Section title="Hand over to a person when">
            <FormGroup>
              {Object.entries(HANDOVER_LABELS).map(([k, label]) => (
                <FormControlLabel key={k} control={<Checkbox size="small" checked={form.handover.conditions.includes(k)}
                  onChange={(e) => set('handover.conditions', e.target.checked ? [...form.handover.conditions, k] : form.handover.conditions.filter((c) => c !== k))} />} label={label} />
              ))}
            </FormGroup>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <FormControlLabel control={<Switch checked={form.handover.notifyAssigned} onChange={(e) => set('handover.notifyAssigned', e.target.checked)} />} label="Notify the assigned executive after every call" />
              <Autocomplete multiple size="small" options={NOTIFY_ROLES} value={form.handover.notifyRoles} onChange={(e, v) => set('handover.notifyRoles', v)}
                renderInput={(params) => <TextField {...params} label="Also notify these roles on handover" placeholder="e.g. Finance Head" />} />
            </Stack>
          </Section>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={save} disabled={saving}>Save</Button>
          <Box sx={{ flexGrow: 1 }} />
          <TextField size="small" label="Test on" placeholder="+91…" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} sx={{ width: 190 }} />
          <Button variant="outlined" startIcon={testing ? <CircularProgress size={16} /> : <PhoneInTalk />} onClick={test} disabled={testing || !testPhone}>Call me with this playbook</Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

const PlaybooksTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isOwner, checkPerm } = useAuth();
  const canManage = isOwner || (checkPerm && checkPerm('voice:manage_playbooks'));

  const [playbooks, setPlaybooks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, t, pr] = await Promise.all([voiceAPI.listPlaybooks(), voiceAPI.getTemplates(), projectAPI.getProjects({ limit: 200 })]);
      setPlaybooks(p.data?.data || []);
      setTemplates(t.data?.data || []);
      const d = pr.data?.data; setProjects(Array.isArray(d) ? d : (d?.projects || pr.data?.projects || []));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load playbooks.', { variant: 'error' });
    } finally { setLoading(false); }
  }, [enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const usedKeys = useMemo(() => new Set(playbooks.map((p) => p.templateKey)), [playbooks]);

  const createFrom = async (key) => {
    try {
      const res = await voiceAPI.createPlaybook({ templateKey: key });
      setPickerOpen(false);
      await load();
      setEditing(res.data?.data);
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Could not create the playbook.', { variant: 'error' }); }
  };

  const toggle = async (pb, enabled) => {
    try { await voiceAPI.updatePlaybook(pb._id, { enabled }); await load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Could not update.', { variant: 'error' }); }
  };

  const remove = async (pb) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${pb.name}"? Scheduled calls for it will be cancelled.`)) return;
    try { await voiceAPI.deletePlaybook(pb._id); await load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Could not delete.', { variant: 'error' }); }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Playbooks</Typography>
          <Typography variant="body2" color="text.secondary">Each playbook says when the agent calls, whom, what it should achieve, and when to hand over.</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {canManage && <Button variant="contained" startIcon={<Add />} onClick={() => setPickerOpen(true)}>New from template</Button>}
      </Stack>

      {playbooks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 1 }}>No playbooks yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Start from a template — new enquiry, missed follow-up, site-visit reminder, or payment reminder — then edit the words and timing to match how you work.</Typography>
          {canManage && <Button variant="contained" startIcon={<Add />} onClick={() => setPickerOpen(true)}>New from template</Button>}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {playbooks.map((pb) => (
            <Grid item xs={12} md={6} key={pb._id}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{pb.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{pb.triggerLabel}</Typography>
                  </Box>
                  <Tooltip title={pb.enabled ? 'On' : 'Off'}>
                    <Switch checked={pb.enabled} onChange={(e) => toggle(pb, e.target.checked)} disabled={!canManage} />
                  </Tooltip>
                </Stack>
                {pb.description && <Typography variant="body2" sx={{ mt: 1 }}>{pb.description}</Typography>}
                <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" variant="outlined" label={`${pb.timing?.window?.start}–${pb.timing?.window?.end} IST`} />
                  <Chip size="small" variant="outlined" label={`${pb.timing?.retry?.maxAttempts || 1} attempt${(pb.timing?.retry?.maxAttempts || 1) > 1 ? 's' : ''}`} />
                  {pb.timing?.overrideOrgGuardrails && <Chip size="small" color="warning" variant="outlined" label="overrides guardrails" />}
                </Stack>
                <Box sx={{ flexGrow: 1 }} />
                <Divider sx={{ my: 1.5 }} />
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    This month: <strong>{pb.stats?.calls || 0}</strong> calls · <strong>{pb.stats?.reached || 0}</strong> reached · <strong>{pb.stats?.queued || 0}</strong> queued
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {canManage && (
                    <>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditing(pb)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(pb)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New playbook from template</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {templates.map((t) => (
              <Paper key={t.key} variant="outlined" sx={{ p: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => createFrom(t.key)}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t.name}</Typography>
                  {usedKeys.has(t.key) && <Chip size="small" label="already added" variant="outlined" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                <Typography variant="caption" color="primary">{t.triggerLabel}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setPickerOpen(false)}>Cancel</Button></DialogActions>
      </Dialog>

      <PlaybookEditor open={Boolean(editing)} playbook={editing} templates={templates} projects={projects}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </Box>
  );
};

export default PlaybooksTab;

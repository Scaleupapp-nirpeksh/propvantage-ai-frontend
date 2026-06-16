// src/pages/workspace/CardBuilderDialog.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  ToggleButtonGroup, ToggleButton, Typography, Divider, Paper, CircularProgress,
} from '@mui/material';
import { ListAlt, ShowChart } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceAPI } from '../../services/api';
import { getModuleCatalog } from './catalogCache';
import FilterBuilder from './FilterBuilder';
import NLInput from './NLInput';

const MODULES = [
  { value: 'leads', label: 'Leads' },
  { value: 'sales', label: 'Sales / Bookings' },
  { value: 'payments', label: 'Payments' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'channelPartners', label: 'Channel Partners' },
];

const emptyPlan = (module) => ({
  module,
  logic: 'AND',
  filters: [],
  sort: null,
  limit: 50,
  nlSource: null,
});

const CardBuilderDialog = ({ open, onClose, card }) => {
  const { createCard, updateCard, addToBoard } = useWorkspace();
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = Boolean(card?._id);

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('leads');
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [tab, setTab] = useState(0); // 0 = Builder, 1 = Ask in words
  const [plan, setPlan] = useState(emptyPlan('leads'));
  const [renderMode, setRenderMode] = useState('list');
  const [metricField, setMetricField] = useState(null);
  const [preview, setPreview] = useState(null); // { rows, total } | { value }
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate when opening (create vs edit).
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setTitle(card.title || '');
      setModule(card.module);
      setPlan(card.queryPlan || emptyPlan(card.module));
      setRenderMode(card.renderMode || 'list');
      setMetricField(card.metricConfig?.field || null);
    } else {
      setTitle('');
      setModule('leads');
      setPlan(emptyPlan('leads'));
      setRenderMode('list');
      setMetricField(null);
    }
    setTab(0);
    setPreview(null);
  }, [open, isEdit, card]);

  // Load the catalog for the chosen module.
  useEffect(() => {
    if (!open || !module) return;
    let cancelled = false;
    setCatalogLoading(true);
    getModuleCatalog(module)
      .then((cat) => { if (!cancelled) setCatalog(cat); })
      .catch(() => { if (!cancelled) setCatalog(null); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [open, module]);

  const handleModuleChange = (next) => {
    setModule(next);
    setPlan(emptyPlan(next)); // reset filters when module changes
    setPreview(null);
    setMetricField(null);
  };

  // Live preview: run the current plan without saving.
  const runPreview = useCallback(async () => {
    if (!plan || !plan.filters || plan.filters.length === 0) {
      setPreview(null);
      return;
    }
    setPreviewing(true);
    try {
      const metricConfig = metricField
        ? { agg: 'sum', field: metricField }
        : { agg: 'count', field: null };
      const opts = renderMode === 'metric'
        ? { renderMode, metricConfig }
        : { renderMode };
      const res = await workspaceAPI.preview({ ...plan, module }, opts);
      setPreview(res.data?.data || null);
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }, [plan, module, renderMode, metricField]);

  // Re-run preview when plan/renderMode change (debounced lightly).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(runPreview, 400);
    return () => clearTimeout(t);
  }, [open, runPreview]);

  const previewCount = renderMode === 'metric'
    ? (preview?.value ?? '—')
    : (preview?.total ?? preview?.rows?.length ?? '—');

  const handleSave = async () => {
    if (!title.trim()) {
      enqueueSnackbar('Please enter a card title', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const metricConfig = metricField
        ? { agg: 'sum', field: metricField }
        : { agg: 'count', field: null };
      const payload = {
        title: title.trim(),
        module,
        queryPlan: { ...plan, module },
        renderMode,
        metricConfig: renderMode === 'metric' ? metricConfig : { agg: 'count', field: null },
      };
      if (isEdit) {
        await updateCard(card._id, payload);
      } else {
        const created = await createCard({
          ...payload,
          visibility: 'private',
          sharedWithUsers: [],
          sharedWithRoles: [],
        });
        if (created?._id) await addToBoard(created._id, renderMode === 'metric' ? 'sm' : 'md');
      }
      onClose();
    } catch {
      /* error already surfaced via context snackbar */
    } finally {
      setSaving(false);
    }
  };

  const numericFields = (catalog?.fields || []).filter((f) => f.type === 'number');

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit card' : 'New card'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Step 1 — title + module */}
          <Grid item xs={12} sm={7}>
            <TextField
              label="Card title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Stale CP leads"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Module</InputLabel>
              <Select
                value={module}
                label="Module"
                onChange={(e) => handleModuleChange(e.target.value)}
                disabled={isEdit}
              >
                {MODULES.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Step 2 — Builder / Ask in words */}
          <Grid item xs={12}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 1, minHeight: 40 }}>
              <Tab label="Builder" sx={{ minHeight: 40, textTransform: 'none' }} />
              <Tab label="Ask in words" sx={{ minHeight: 40, textTransform: 'none' }} />
            </Tabs>

            {catalogLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={22} />
              </Box>
            ) : tab === 0 ? (
              <FilterBuilder catalog={catalog} plan={plan} onChange={setPlan} />
            ) : (
              <NLInput
                module={module}
                onPlan={(nextPlan) => { setPlan({ ...nextPlan, module }); setTab(0); }}
              />
            )}
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Render mode */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Show as</Typography>
            <ToggleButtonGroup
              value={renderMode}
              exclusive
              size="small"
              onChange={(e, v) => v && setRenderMode(v)}
              sx={{ display: 'block', mt: 0.5 }}
            >
              <ToggleButton value="list"><ListAlt sx={{ fontSize: 16, mr: 0.5 }} /> List</ToggleButton>
              <ToggleButton value="metric"><ShowChart sx={{ fontSize: 16, mr: 0.5 }} /> Metric</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          {renderMode === 'metric' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Aggregate (count by default)</InputLabel>
                <Select
                  value={metricField || ''}
                  label="Aggregate (count by default)"
                  onChange={(e) => setMetricField(e.target.value || null)}
                >
                  <MenuItem value="">Count of records</MenuItem>
                  {numericFields.map((f) => (
                    <MenuItem key={f.key} value={f.key}>Sum of {f.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Live preview */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
                {previewing
                  ? <CircularProgress size={16} />
                  : <Typography variant="body2" color="text.secondary">{previewCount} matching</Typography>}
              </Box>
              {renderMode === 'metric' ? (
                <Typography variant="h4" fontWeight={800}>{preview?.value ?? '—'}</Typography>
              ) : (
                <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
                  {(preview?.rows || []).slice(0, 5).map((r, i) => (
                    <Typography key={r._id || i} variant="body2" noWrap sx={{ py: 0.25 }}>
                      • {r.firstName || r.title || r.name || r._id}
                      {r.lastName ? ` ${r.lastName}` : ''}
                    </Typography>
                  ))}
                  {(!preview || (preview.rows || []).length === 0) && !previewing && (
                    <Typography variant="body2" color="text.secondary">No matching records.</Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
          {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create card')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CardBuilderDialog;

// src/pages/workspace/CardBuilderDialog.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  ToggleButtonGroup, ToggleButton, Typography, Divider, Paper, CircularProgress,
  FormGroup, FormControlLabel, Checkbox,
} from '@mui/material';
import { ListAlt, ShowChart, ArrowUpward, ArrowDownward, Insights } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceAPI, projectAPI } from '../../services/api';
import { getModuleCatalog, getInsightSources } from './catalogCache';
import FilterBuilder from './FilterBuilder';
import NLInput from './NLInput';
import InsightCardView from './InsightCardView';

const MODULES = [
  { value: 'leads', label: 'Leads' },
  { value: 'sales', label: 'Sales / Bookings' },
  { value: 'payments', label: 'Payments' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'channelPartners', label: 'Channel Partners' },
  { value: 'projects', label: 'Projects' },
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
  const [columns, setColumns] = useState([]); // chosen list display columns (catalog field keys)
  // Insight mode (D3): source registry + the chosen source/period/project.
  const [insightSources, setInsightSources] = useState([]);
  const [insightSource, setInsightSource] = useState('');
  const [insightPeriod, setInsightPeriod] = useState('');
  const [insightProject, setInsightProject] = useState(''); // '' = All projects
  const [projects, setProjects] = useState([]);
  const [insightPreview, setInsightPreview] = useState(null);
  const [insightPreviewing, setInsightPreviewing] = useState(false);
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
      setColumns(card.columns || []); // empty → catalog effect fills defaults
      setInsightSource(card.insightConfig?.source || '');
      setInsightPeriod(card.insightConfig?.period || '');
      setInsightProject(card.insightConfig?.projectId || '');
    } else {
      setTitle('');
      setModule('leads');
      setPlan(emptyPlan('leads'));
      setRenderMode('list');
      setMetricField(null);
      setColumns([]);
      setInsightSource('');
      setInsightPeriod('');
      setInsightProject('');
    }
    setInsightPreview(null);
    // New card → default to "Describe the Cards" (NL) tab; editing → Builder (plan exists).
    setTab(isEdit ? 0 : 1);
    setPreview(null);
  }, [open, isEdit, card]);

  // Load the catalog for the chosen module.
  useEffect(() => {
    if (!open || !module) return;
    let cancelled = false;
    setCatalogLoading(true);
    getModuleCatalog(module)
      .then((cat) => {
        if (cancelled) return;
        setCatalog(cat);
        // Pre-check the catalog's default columns when none are chosen yet
        // (new card, or an edit card that never pinned columns).
        const defaults = (cat?.fields || [])
          .filter((f) => f.displayable && f.defaultColumn)
          .map((f) => f.key)
          .slice(0, 6);
        setColumns((prev) => (prev && prev.length ? prev : defaults));
      })
      .catch(() => { if (!cancelled) setCatalog(null); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [open, module]);

  // Load insight-source registry + project list once when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getInsightSources()
      .then((srcs) => { if (!cancelled) setInsightSources(srcs || []); })
      .catch(() => { if (!cancelled) setInsightSources([]); });
    projectAPI.getProjects()
      .then((res) => { if (!cancelled) setProjects(res.data?.data || res.data || []); })
      .catch(() => { if (!cancelled) setProjects([]); });
    return () => { cancelled = true; };
  }, [open]);

  const activeInsightSource = insightSources.find((s) => s.key === insightSource) || null;
  // Each source declares exactly one param (period or timeframe); read its values.
  const insightParamKey = activeInsightSource
    ? (activeInsightSource.params?.period ? 'period' : 'timeframe')
    : 'period';
  const insightParamValues = activeInsightSource?.params?.[insightParamKey] || [];

  // When the chosen source changes, default the period to its first allowed value.
  useEffect(() => {
    if (renderMode !== 'insight' || !activeInsightSource) return;
    if (!insightParamValues.includes(insightPeriod)) {
      setInsightPeriod(insightParamValues[0] || '');
    }
  }, [renderMode, insightSource]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live insight preview when source/period/project change.
  useEffect(() => {
    if (!open || renderMode !== 'insight' || !insightSource || !insightPeriod) {
      setInsightPreview(null);
      return undefined;
    }
    let cancelled = false;
    setInsightPreviewing(true);
    const t = setTimeout(() => {
      workspaceAPI
        .previewInsight({ source: insightSource, period: insightPeriod, projectId: insightProject || null })
        .then((res) => { if (!cancelled) setInsightPreview(res.data?.data || null); })
        .catch(() => { if (!cancelled) setInsightPreview(null); })
        .finally(() => { if (!cancelled) setInsightPreviewing(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, renderMode, insightSource, insightPeriod, insightProject]);

  const handleModuleChange = (next) => {
    setModule(next);
    setPlan(emptyPlan(next)); // reset filters + sort when module changes
    setPreview(null);
    setMetricField(null);
    setColumns([]); // catalog effect re-fills defaults for the new module
  };

  const toggleColumn = (key) => {
    setColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Sort control reads/writes plan.sort = { field, dir } | null.
  const setSortField = (field) => {
    setPlan((p) => ({ ...p, sort: field ? { field, dir: p.sort?.dir || 'desc' } : null }));
  };
  const setSortDir = (dir) => {
    setPlan((p) => (p.sort?.field ? { ...p, sort: { ...p.sort, dir } } : p));
  };

  // Live preview: run the current plan without saving.
  const runPreview = useCallback(async () => {
    if (renderMode === 'insight') return; // insight has its own preview effect
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
    if (renderMode === 'insight' && (!insightSource || !insightPeriod)) {
      enqueueSnackbar('Please pick an insight and a period', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const metricConfig = metricField
        ? { agg: 'sum', field: metricField }
        : { agg: 'count', field: null };
      const payload = renderMode === 'insight'
        ? {
            title: title.trim(),
            renderMode: 'insight',
            insightConfig: {
              source: insightSource,
              period: insightPeriod,
              projectId: insightProject || null,
            },
          }
        : {
            title: title.trim(),
            module,
            queryPlan: { ...plan, module },
            renderMode,
            metricConfig: renderMode === 'metric' ? metricConfig : { agg: 'count', field: null },
            columns: renderMode === 'list' ? columns : [],
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
        if (created?._id) await addToBoard(created._id, renderMode === 'list' ? 'md' : 'sm');
      }
      onClose();
    } catch {
      /* error already surfaced via context snackbar */
    } finally {
      setSaving(false);
    }
  };

  const numericFields = (catalog?.fields || []).filter((f) => f.type === 'number');
  const displayableFields = (catalog?.fields || []).filter((f) => f.displayable);
  const sortField = plan.sort?.field || '';
  const sortDir = plan.sort?.dir || 'desc';

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit card' : 'New card'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Step 1 — title + module */}
          <Grid item xs={12} sm={renderMode === 'insight' ? 12 : 7}>
            <TextField
              label="Card title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Stale CP leads"
            />
          </Grid>
          {renderMode !== 'insight' && (
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
          )}

          {/* Step 2 — Builder / Ask in words (query-plan modes only) */}
          {renderMode !== 'insight' && (
            <Grid item xs={12}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 1, minHeight: 40 }}>
                <Tab label="Builder" sx={{ minHeight: 40, textTransform: 'none' }} />
                <Tab label="Describe the Cards" sx={{ minHeight: 40, textTransform: 'none' }} />
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
          )}

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
              <ToggleButton value="insight"><Insights sx={{ fontSize: 16, mr: 0.5 }} /> Insight</ToggleButton>
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

          {/* Insight source + period + project (insight mode only) */}
          {renderMode === 'insight' && (
            <>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Insight</InputLabel>
                  <Select
                    value={insightSource}
                    label="Insight"
                    onChange={(e) => setInsightSource(e.target.value)}
                  >
                    {insightSources.map((s) => (
                      <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small" disabled={!activeInsightSource}>
                  <InputLabel>{insightParamKey === 'timeframe' ? 'Timeframe' : 'Period'}</InputLabel>
                  <Select
                    value={insightParamValues.includes(insightPeriod) ? insightPeriod : ''}
                    label={insightParamKey === 'timeframe' ? 'Timeframe' : 'Period'}
                    onChange={(e) => setInsightPeriod(e.target.value)}
                  >
                    {insightParamValues.map((v) => (
                      <MenuItem key={v} value={v}>{v.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={insightProject}
                    label="Project"
                    onChange={(e) => setInsightProject(e.target.value)}
                  >
                    <MenuItem value="">All projects</MenuItem>
                    {projects.map((p) => (
                      <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Columns + sort (list mode only) */}
          {renderMode === 'list' && displayableFields.length > 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Columns to show {columns.length ? `(${columns.length} selected)` : ''}
                </Typography>
                <FormGroup row sx={{ mt: 0.5, gap: 0.5 }}>
                  {displayableFields.map((f) => (
                    <FormControlLabel
                      key={f.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={columns.includes(f.key)}
                          onChange={() => toggleColumn(f.key)}
                        />
                      }
                      label={<Typography variant="body2">{f.label}</Typography>}
                      sx={{ mr: 1 }}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={7}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortField}
                    label="Sort by"
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <MenuItem value="">Default order</MenuItem>
                    {displayableFields.map((f) => (
                      <MenuItem key={f.key} value={f.key}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={5}>
                <ToggleButtonGroup
                  value={sortDir}
                  exclusive
                  size="small"
                  disabled={!sortField}
                  onChange={(e, v) => v && setSortDir(v)}
                  sx={{ mt: 0.5 }}
                >
                  <ToggleButton value="desc"><ArrowDownward sx={{ fontSize: 16, mr: 0.5 }} /> Desc</ToggleButton>
                  <ToggleButton value="asc"><ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} /> Asc</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </>
          )}

          {/* Live preview */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
                {renderMode === 'insight'
                  ? (insightPreviewing && <CircularProgress size={16} />)
                  : (previewing
                      ? <CircularProgress size={16} />
                      : <Typography variant="body2" color="text.secondary">{previewCount} matching</Typography>)}
              </Box>
              {renderMode === 'insight' ? (
                (!insightSource || !insightPeriod) ? (
                  <Typography variant="body2" color="text.secondary">Pick an insight and a period to preview.</Typography>
                ) : (
                  <InsightCardView payload={insightPreview} loading={insightPreviewing} />
                )
              ) : renderMode === 'metric' ? (
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

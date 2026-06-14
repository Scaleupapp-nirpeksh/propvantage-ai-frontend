// File: src/pages/reports/ReportTemplateBuilder.js
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Button, TextField, Stack, Snackbar, Alert } from '@mui/material';
import { Save, PlayArrow, ArrowBack, Schedule } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { reportAPI } from '../../services/api';
import { reportShareUrl } from '../../utils/reportShare';
import {
  builderReducer, initialBuilderState, actions, buildTemplatePayload, templateToBuilderState, makeId,
} from './builderState';
import BlockPalette from '../../components/reports/BlockPalette';
import BuilderCanvas from '../../components/reports/BuilderCanvas';
import BlockConfigPanel from '../../components/reports/BlockConfigPanel';
import ThemePicker from '../../components/reports/ThemePicker';
import ImageUploader from '../../components/reports/ImageUploader';
import ScheduleDeliveryDialog from '../../components/reports/ScheduleDeliveryDialog';

const ReportTemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState(null); // resolved snapshot blocks, or null
  const [shareSlug, setShareSlug] = useState(null);
  const [toast, setToast] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Load catalog + (if editing) the template
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, tplRes] = await Promise.all([
          reportAPI.getCatalog(),
          isEdit ? reportAPI.getTemplate(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCatalog(catRes.data?.data || []);
        if (tplRes) dispatch(actions.load(templateToBuilderState(tplRes.data?.data)));
      } catch (err) {
        if (!cancelled) setToast({ severity: 'error', msg: err.response?.data?.message || 'Failed to load builder' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) || null;

  // Any structural edit invalidates a live preview
  const editAndClearPreview = useCallback((action) => {
    setPreviewBlocks(null);
    dispatch(action);
  }, []);

  const handleAddBlock = (blockDef) =>
    editAndClearPreview(actions.addBlock({
      id: makeId('b'), type: blockDef.type, title: blockDef.label, config: blockDef.defaultConfig || {},
    }));

  const handleSave = async () => {
    const payload = buildTemplatePayload(state);
    if (!payload.name?.trim()) { setToast({ severity: 'warning', msg: 'Give your report a name first.' }); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await reportAPI.updateTemplate(id, payload);
        setToast({ severity: 'success', msg: 'Template saved' });
      } else {
        const res = await reportAPI.createTemplate(payload);
        setToast({ severity: 'success', msg: 'Template created' });
        navigate(`/reports/templates/${res.data?.data?._id}/edit`, { replace: true });
      }
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!isEdit) { setToast({ severity: 'info', msg: 'Save the template once before generating a preview.' }); return; }
    setGenerating(true);
    try {
      await reportAPI.updateTemplate(id, buildTemplatePayload(state)); // ensure latest is persisted
      const res = await reportAPI.generate(id);
      setPreviewBlocks(res.data?.data?.blocks || []);
      setShareSlug(res.data?.data?.publicSlug || null);
      setToast({ severity: 'success', msg: 'Preview generated with live data' });
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Generate failed' });
    } finally {
      setGenerating(false);
    }
  };

  // Canvas shows resolved data when a preview exists, else the design-time blocks (no data).
  // Snapshot blocks from the backend don't carry `kind`, so derive it from the catalog by type —
  // the renderer needs `kind` to pick kpi/chart/table vs layout. (Phase 2's public page has no
  // catalog, so the snapshot generator should attach `kind` server-side there.)
  const canvasBlocks = (previewBlocks || state.blocks).map((b) => ({
    ...b,
    kind: b.kind || catalog.find((c) => c.type === b.type)?.kind,
    data: previewBlocks ? b.data : {},
  }));

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Report Template' : 'New Report Template'}
        loading={loading}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
            <Button variant="outlined" startIcon={<PlayArrow />} onClick={handleGenerate} disabled={generating || loading}>
              {generating ? 'Generating…' : 'Generate preview'}
            </Button>
            <Button startIcon={<Schedule />} onClick={() => setScheduleOpen(true)}>Schedule & delivery</Button>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        }
      />

      <TextField
        fullWidth size="small" label="Report name" sx={{ mb: 2 }}
        value={state.name} onChange={(e) => dispatch(actions.setField('name', e.target.value))}
      />

      {shareSlug && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(reportShareUrl(shareSlug))}>
              Copy link
            </Button>
          }
        >
          Shareable link: <a href={reportShareUrl(shareSlug)} target="_blank" rel="noreferrer">{reportShareUrl(shareSlug)}</a>
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto' }}>
            <BlockPalette catalog={catalog} onAdd={handleAddBlock} loading={loading} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto', bgcolor: 'background.default' }}>
            <BuilderCanvas
              blocks={canvasBlocks}
              images={state.imageSlots}
              selectedBlockId={state.selectedBlockId}
              onSelect={(bid) => dispatch(actions.selectBlock(bid))}
              onRemove={(bid) => editAndClearPreview(actions.removeBlock(bid))}
              onReorder={(from, to) => editAndClearPreview(actions.reorderBlocks(from, to))}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto' }}>
            <ThemePicker theme={state.theme} onChange={(patch) => dispatch(actions.setTheme(patch))} />
            <ImageUploader
              imageSlots={state.imageSlots}
              makeId={makeId}
              onAdd={(slot) => dispatch(actions.addImageSlot(slot))}
              onRemove={(slotId) => dispatch(actions.removeImageSlot(slotId))}
            />
            <BlockConfigPanel
              block={selectedBlock}
              imageSlots={state.imageSlots}
              onChange={(patch) => editAndClearPreview(actions.updateBlock(state.selectedBlockId, patch))}
            />
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>

      <ScheduleDeliveryDialog
        open={scheduleOpen}
        schedule={state.schedule}
        delivery={state.delivery}
        onScheduleChange={(patch) => dispatch(actions.setSchedule(patch))}
        onDeliveryChange={(patch) => dispatch(actions.setDelivery(patch))}
        onClose={() => setScheduleOpen(false)}
      />
    </Box>
  );
};

export default ReportTemplateBuilder;

// File: src/pages/reports/ReportAgentPage.js
// Conversational report builder: a live report canvas driven by a chat dock.
// Supports create (new) and edit-existing (/:id/edit). Schedule & send via dialog.
// Built entirely in the app design system (MUI / Inter / blue+gold).
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Chip, Popover, CircularProgress,
} from '@mui/material';
import { AutoAwesome, Save, ArrowBack, Palette, Schedule } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { reportAPI } from '../../services/api';
import CanvasBlock from '../../components/reports/CanvasBlock';
import ReportChatDock from '../../components/reports/ReportChatDock';
import ReportDesignControls from '../../components/reports/ReportDesignControls';
import ScheduleDeliveryDialog from '../../components/reports/ScheduleDeliveryDialog';
import { getReportTheme } from '../../utils/reportThemes';
import useReportAgent from './useReportAgent';
import { initialBuilderState } from './builderState';

const ReportAgentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { enqueueSnackbar } = useSnackbar();
  const { messages, definition, previewBlocks, isLoading, sendMessage, setDefinition, repreview } = useReportAgent();
  const [saving, setSaving] = useState(false);
  const [themeAnchor, setThemeAnchor] = useState(null);

  // Edit-existing state
  const [templateId, setTemplateId] = useState(id || null);
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [access, setAccess] = useState(null);
  const [imageSlots, setImageSlots] = useState([]);
  const [loading, setLoading] = useState(isEdit);

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const tokens = getReportTheme(definition.theme?.preset);
  // Show resolved preview blocks (with data) when available; before the first turn the canvas is empty.
  const blocks = previewBlocks;

  // Load template on mount when editing an existing report
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await reportAPI.getTemplate(id);
        const tpl = res.data?.data || {};
        if (cancelled) return;
        const def = {
          name: tpl.name || '',
          scope: tpl.scope || { mode: 'portfolio' },
          theme: { preset: 'clean', ...(tpl.theme || {}) },
          blocks: tpl.blocks || [],
        };
        setDefinition(def);
        setSchedule({ ...initialBuilderState.schedule, ...(tpl.schedule || {}) });
        setDelivery({ ...initialBuilderState.delivery, ...(tpl.delivery || {}) });
        setAccess({ ...initialBuilderState.access, ...(tpl.access || {}) });
        setDescription(tpl.description || '');
        setImageSlots(tpl.imageSlots || []);
        setTemplateId(id);
        if (def.blocks?.length) repreview(def);
      } catch (err) {
        enqueueSnackbar(err.response?.data?.message || 'Failed to load report', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  // Single source of truth for create + update + schedule persistence
  const buildPayload = () => ({
    name: definition.name || 'Untitled report',
    description,
    scope: definition.scope,
    theme: definition.theme,
    blocks: definition.blocks,
    imageSlots,
    ...(schedule ? { schedule } : {}),
    ...(delivery ? { delivery } : {}),
    ...(access ? { access } : {}),
  });

  const handleSave = async () => {
    if (!definition.blocks?.length) { enqueueSnackbar('Ask the agent to build something first.', { variant: 'info' }); return null; }
    setSaving(true);
    try {
      if (templateId) {
        await reportAPI.updateTemplate(templateId, buildPayload());
        enqueueSnackbar('Report saved.', { variant: 'success' });
        return templateId;
      } else {
        const res = await reportAPI.createTemplate(buildPayload());
        const newId = res.data?.data?._id;
        if (newId) setTemplateId(newId);
        enqueueSnackbar('Report saved.', { variant: 'success' });
        return newId || null;
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
      return null;
    } finally { setSaving(false); }
  };

  const openSchedule = async () => {
    let tid = templateId;
    if (!tid) {
      tid = await handleSave();
      if (!tid) return;
    }
    // Ensure defaults exist for a brand-new report
    setSchedule((s) => s || { ...initialBuilderState.schedule });
    setDelivery((d) => d || { ...initialBuilderState.delivery });
    setAccess((a) => a || { ...initialBuilderState.access });
    setScheduleOpen(true);
  };

  const handleThemeChange = (patch) => {
    setDefinition((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  };

  const handleThemeClose = () => {
    setThemeAnchor(null);
    repreview();
  };

  // Per-block canvas controls — edit definition.blocks then re-resolve via repreview(newDef)
  const applyBlocks = (fn) => {
    const newBlocks = fn(definition.blocks || []);
    const newDef = { ...definition, blocks: newBlocks };
    setDefinition(newDef);
    repreview(newDef);
  };
  const reindex = (blks) => blks.map((b, i) => ({ ...b, order: i }));
  const moveBlock = (id, dir) => applyBlocks((blks) => {
    const i = blks.findIndex((b) => b.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= blks.length) return blks;
    const next = [...blks]; [next[i], next[j]] = [next[j], next[i]]; return reindex(next);
  });
  const removeBlock = (id) => applyBlocks((blks) => reindex(blks.filter((b) => b.id !== id)));
  const retitleBlock = (id, title) => applyBlocks((blks) => blks.map((b) => (b.id === id ? { ...b, title } : b)));

  // Loading guard while fetching template on edit
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
        <TextField
          size="small" placeholder="Untitled report" value={definition.name || ''}
          onChange={(e) => setDefinition((d) => ({ ...d, name: e.target.value }))}
          sx={{ minWidth: 280 }}
        />
        <Chip size="small" icon={<AutoAwesome sx={{ fontSize: 16 }} />} label="AI builder" color="primary" variant="outlined" />
        <Box sx={{ flex: 1 }} />
        <Button
          startIcon={<Palette />}
          onClick={(e) => setThemeAnchor(e.currentTarget)}
          variant="outlined"
          size="small"
        >
          Theme
        </Button>
        <Popover
          open={Boolean(themeAnchor)}
          anchorEl={themeAnchor}
          onClose={handleThemeClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <ReportDesignControls theme={definition.theme} onChange={handleThemeChange} />
        </Popover>
        <Button startIcon={<Schedule />} onClick={openSchedule}>Schedule &amp; send</Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>

      {/* Canvas (the report — the star) */}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', borderRadius: 2, bgcolor: tokens.page, p: { xs: 2, md: 3 } }}>
        {blocks.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'text.secondary', gap: 1 }}>
            <AutoAwesome sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Describe the report you want</Typography>
            <Typography variant="body2">Tell the assistant below what to build. It pulls your real numbers — it never makes figures up.</Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 820, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {blocks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((block, i, arr) => (
              <CanvasBlock
                key={block.id || block.type}
                block={block}
                images={imageSlots}
                themePreset={definition.theme?.preset}
                accentColor={definition.theme?.accentColor}
                isFirst={i === 0}
                isLast={i === arr.length - 1}
                onMoveUp={() => moveBlock(block.id, -1)}
                onMoveDown={() => moveBlock(block.id, 1)}
                onRemove={() => removeBlock(block.id)}
                onRetitle={(title) => retitleBlock(block.id, title)}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Chat dock */}
      <ReportChatDock messages={messages} isLoading={isLoading} onSend={(t) => sendMessage(t)} />

      {/* Schedule & send dialog */}
      <ScheduleDeliveryDialog
        open={scheduleOpen}
        schedule={schedule || initialBuilderState.schedule}
        delivery={delivery || initialBuilderState.delivery}
        access={access || initialBuilderState.access}
        onScheduleChange={(patch) => setSchedule((s) => ({ ...(s || initialBuilderState.schedule), ...patch }))}
        onDeliveryChange={(patch) => setDelivery((d) => ({ ...(d || initialBuilderState.delivery), ...patch }))}
        onAccessChange={(patch) => setAccess((a) => ({ ...(a || initialBuilderState.access), ...patch }))}
        onClose={async (_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            setScheduleOpen(false);
            return;
          }
          setScheduleOpen(false);
          if (templateId) {
            try {
              await reportAPI.updateTemplate(templateId, buildPayload());
              enqueueSnackbar('Schedule saved.', { variant: 'success' });
            } catch (err) {
              enqueueSnackbar(err.response?.data?.message || 'Could not save schedule', { variant: 'error' });
            }
          }
        }}
      />
    </Box>
  );
};

export default ReportAgentPage;

// File: src/pages/reports/ReportAgentPage.js
// Conversational report builder: a live report canvas driven by a chat dock.
// Built entirely in the app design system (MUI / Inter / blue+gold).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, IconButton, CircularProgress, Stack, Chip,
} from '@mui/material';
import { AutoAwesome, Send, Save, ArrowBack } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { reportAPI } from '../../services/api';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';
import { getReportTheme } from '../../utils/reportThemes';
import useReportAgent from './useReportAgent';

const STARTERS = [
  'Quarterly review for the whole portfolio — sales, collections, lead funnel.',
  'Monthly collections report for one project.',
  'Compare my projects on sales and collection rate.',
];

const ReportAgentPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { messages, definition, previewBlocks, isLoading, sendMessage, setDefinition } = useReportAgent();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const tokens = getReportTheme(definition.theme?.preset);
  // Show resolved preview blocks (with data) when available; before the first turn the canvas is empty.
  const blocks = previewBlocks.length ? previewBlocks : [];

  const submit = (text) => { const t = text != null ? text : input; if (t.trim()) { sendMessage(t); setInput(''); } };

  const handleSave = async () => {
    if (!definition.blocks?.length) { enqueueSnackbar('Ask the agent to build something first.', { variant: 'info' }); return; }
    setSaving(true);
    try {
      const payload = {
        name: definition.name || 'Untitled report',
        scope: definition.scope, theme: definition.theme, blocks: definition.blocks,
      };
      const res = await reportAPI.createTemplate(payload);
      enqueueSnackbar('Report saved.', { variant: 'success' });
      navigate(`/reports/templates/${res.data?.data?._id}/edit`);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
        <TextField
          size="small" placeholder="Untitled report" value={definition.name || ''}
          onChange={(e) => setDefinition({ ...definition, name: e.target.value })}
          sx={{ minWidth: 280 }}
        />
        <Chip size="small" icon={<AutoAwesome sx={{ fontSize: 16 }} />} label="AI builder" color="primary" variant="outlined" />
        <Box sx={{ flex: 1 }} />
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
            {blocks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((block) => (
              <ReportBlockRenderer key={block.id || block.type} block={block} images={[]} themePreset={definition.theme?.preset} />
            ))}
          </Box>
        )}
      </Paper>

      {/* Chat dock */}
      <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 2, p: 1.5 }}>
        {messages.length > 0 && (
          <Box sx={{ maxHeight: 180, overflow: 'auto', mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: m.role === 'user' ? 'grey.200' : 'primary.main', color: m.role === 'user' ? 'text.primary' : '#fff', fontSize: 13, fontWeight: 700 }}>
                  {m.role === 'user' ? 'You' : <AutoAwesome sx={{ fontSize: 15 }} />}
                </Box>
                <Typography variant="body2" sx={{ bgcolor: m.role === 'user' ? 'grey.100' : 'action.hover', px: 1.5, py: 1, borderRadius: 2, maxWidth: '80%' }}>
                  {m.content}
                </Typography>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
                <CircularProgress size={14} /> <Typography variant="caption">Working…</Typography>
              </Box>
            )}
            <div ref={endRef} />
          </Box>
        )}
        {messages.length === 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
            {STARTERS.map((s) => (
              <Chip key={s} label={s} variant="outlined" size="small" onClick={() => submit(s)} sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }} />
            ))}
          </Stack>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth multiline maxRows={4} size="small" placeholder="Ask the assistant to build or change the report…"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            disabled={isLoading}
          />
          <IconButton color="primary" onClick={() => submit()} disabled={isLoading || !input.trim()}><Send /></IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportAgentPage;

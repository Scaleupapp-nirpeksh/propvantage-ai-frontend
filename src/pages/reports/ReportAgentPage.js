// File: src/pages/reports/ReportAgentPage.js
// Conversational report builder: a live report canvas driven by a chat dock.
// Built entirely in the app design system (MUI / Inter / blue+gold).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Chip, Popover,
} from '@mui/material';
import { AutoAwesome, Save, ArrowBack, Palette } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { reportAPI } from '../../services/api';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';
import ReportChatDock from '../../components/reports/ReportChatDock';
import ReportDesignControls from '../../components/reports/ReportDesignControls';
import { getReportTheme } from '../../utils/reportThemes';
import useReportAgent from './useReportAgent';

const ReportAgentPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { messages, definition, previewBlocks, isLoading, sendMessage, setDefinition, repreview } = useReportAgent();
  const [saving, setSaving] = useState(false);
  const [themeAnchor, setThemeAnchor] = useState(null);

  const tokens = getReportTheme(definition.theme?.preset);
  // Show resolved preview blocks (with data) when available; before the first turn the canvas is empty.
  const blocks = previewBlocks.length ? previewBlocks : [];

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

  const handleThemeChange = (patch) => {
    setDefinition((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  };

  const handleThemeClose = () => {
    setThemeAnchor(null);
    repreview();
  };

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
              <ReportBlockRenderer
                key={block.id || block.type}
                block={block}
                images={[]}
                themePreset={definition.theme?.preset}
                accentColor={definition.theme?.accentColor}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Chat dock */}
      <ReportChatDock messages={messages} isLoading={isLoading} onSend={(t) => sendMessage(t)} />
    </Box>
  );
};

export default ReportAgentPage;

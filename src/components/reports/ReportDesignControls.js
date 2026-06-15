// File: src/components/reports/ReportDesignControls.js
import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, TextField } from '@mui/material';
import { REPORT_THEME_PRESETS, REPORT_THEME_LABELS } from '../../utils/reportThemes';

/** @param {{ theme, onChange }} props  theme={preset, accentColor?}; onChange(partialTheme) */
const ReportDesignControls = ({ theme = {}, onChange }) => (
  <Box sx={{ p: 2, minWidth: 240 }}>
    <Typography variant="overline" color="text.secondary">Theme</Typography>
    <Box sx={{ mt: 0.5, mb: 2 }}>
      <ToggleButtonGroup exclusive size="small" value={theme.preset || 'clean'}
        onChange={(_e, val) => { if (val) onChange({ preset: val }); }}>
        {REPORT_THEME_PRESETS.map((p) => <ToggleButton key={p} value={p}>{REPORT_THEME_LABELS[p]}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
    <Typography variant="overline" color="text.secondary">Accent colour</Typography>
    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      <input type="color" value={theme.accentColor || '#1e88e5'} onChange={(e) => onChange({ accentColor: e.target.value })}
        style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Accent colour" />
      <TextField size="small" value={theme.accentColor || ''} placeholder="#1e88e5"
        onChange={(e) => onChange({ accentColor: e.target.value })} sx={{ width: 120 }} />
    </Box>
  </Box>
);

export default ReportDesignControls;

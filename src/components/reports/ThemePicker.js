// File: src/components/reports/ThemePicker.js
import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

const PRESETS = [
  { key: 'clean', label: 'Clean' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'warm', label: 'Warm' },
];

/** @param {{ theme, onChange }} props  onChange(partialTheme) */
const ThemePicker = ({ theme = {}, onChange }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="overline" color="text.secondary">Theme</Typography>
    <Box sx={{ mt: 1 }}>
      <ToggleButtonGroup
        exclusive size="small" value={theme.preset || 'clean'}
        onChange={(_e, val) => { if (val) onChange({ preset: val }); }}
      >
        {PRESETS.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
  </Box>
);

export default ThemePicker;

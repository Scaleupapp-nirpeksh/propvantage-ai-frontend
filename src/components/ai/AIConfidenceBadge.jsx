// File: src/components/ai/AIConfidenceBadge.jsx
// Description: SP5 — small chip rendering the validator's confidence level.

import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { AutoAwesome, AutoFixHigh, Warning, Info } from '@mui/icons-material';

const CONFIG = {
  high:     { color: 'success', label: 'High confidence',   icon: <AutoFixHigh sx={{ fontSize: 14 }} />, tip: 'AI grounded every claim against the facts pack on the first try.' },
  medium:   { color: 'info',    label: 'Medium confidence', icon: <AutoAwesome sx={{ fontSize: 14 }} />, tip: 'AI grounded every claim against the facts pack.' },
  low:      { color: 'warning', label: 'Low confidence',    icon: <Info sx={{ fontSize: 14 }} />, tip: 'Sample size or data freshness limits how strongly this conclusion holds.' },
  fallback: { color: 'default', label: 'Auto-summary',      icon: <Warning sx={{ fontSize: 14 }} />, tip: 'AI couldn’t ground its answer; this is a deterministic summary from the metrics.' },
};

const AIConfidenceBadge = ({ level = 'medium' }) => {
  const c = CONFIG[level] || CONFIG.medium;
  return (
    <Tooltip title={c.tip} arrow>
      <Chip size="small" color={c.color} icon={c.icon} label={c.label} sx={{ height: 22, fontSize: '0.7rem' }} />
    </Tooltip>
  );
};

export default AIConfidenceBadge;

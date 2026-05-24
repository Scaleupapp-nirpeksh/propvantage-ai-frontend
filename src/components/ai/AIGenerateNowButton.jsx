// File: src/components/ai/AIGenerateNowButton.jsx
// Description: SP5 — on-demand "Generate now" button. Disabled when the
//   daily quota is exhausted. Surfaces 429 errors via the snackbar.

import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { cpInsightsAPI } from '../../services/api';

const AIGenerateNowButton = ({ surface, body, onGenerated, quotaExhausted = false, label = 'Generate now', size = 'small' }) => {
  const [busy, setBusy] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleClick = async () => {
    setBusy(true);
    try {
      const res = await cpInsightsAPI.generate(surface, body);
      const insight = res.data?.data;
      if (onGenerated) onGenerated(insight);
      enqueueSnackbar('Insight regenerated', { variant: 'success' });
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'ai_quota_exceeded') {
        const resets = data.resetsAt ? new Date(data.resetsAt).toLocaleString() : 'midnight';
        enqueueSnackbar(`AI quota exceeded; resets at ${resets}.`, { variant: 'warning' });
      } else {
        enqueueSnackbar(err.response?.data?.message || 'Could not generate insight.', { variant: 'error' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant="outlined"
      startIcon={busy ? <CircularProgress size={14} /> : <AutoAwesome sx={{ fontSize: 16 }} />}
      disabled={busy || quotaExhausted}
      onClick={handleClick}
      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
    >
      {quotaExhausted ? 'Quota reached' : label}
    </Button>
  );
};

export default AIGenerateNowButton;

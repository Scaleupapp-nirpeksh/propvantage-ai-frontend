// File: src/components/ai/AIQuotaIndicator.jsx
// Description: SP5 — small "47 generations left today" text + bar. Polls
//   cpInsightsAPI.usage every 5 minutes. Renders nothing while loading the
//   first time so it doesn't flash.

import React, { useEffect, useState, useCallback } from 'react';
import { Box, LinearProgress, Tooltip, Typography } from '@mui/material';
import { cpInsightsAPI } from '../../services/api';

const POLL_MS = 5 * 60 * 1000;

const AIQuotaIndicator = ({ onUsageChange }) => {
  const [usage, setUsage] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const res = await cpInsightsAPI.usage();
      const u = res.data?.data || null;
      setUsage(u);
      if (onUsageChange) onUsageChange(u);
    } catch {
      // silent; the indicator stays hidden
    }
  }, [onUsageChange]);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, POLL_MS);
    return () => clearInterval(t);
  }, [fetch]);

  if (!usage) return null;
  const used = (usage.scheduledGenerations || 0) + (usage.onDemandGenerations || 0) + (usage.copilotMessages || 0);
  const total = usage.quota?.dailyQuota ?? 200;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const remaining = Math.max(0, total - used);
  const color = pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary';

  return (
    <Tooltip
      title={`AI generations today: ${used} of ${total}. Resets at midnight IST.`}
      arrow
    >
      <Box sx={{ minWidth: 140, mr: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
          {remaining} AI generations left
        </Typography>
        <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 4, borderRadius: 2 }} />
      </Box>
    </Tooltip>
  );
};

export default AIQuotaIndicator;

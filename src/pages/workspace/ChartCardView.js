// src/pages/workspace/ChartCardView.js
// Renders a workspace chart card from the engine's grouped-aggregation payload
// ({ buckets:[{key,value}] }) using the shared recharts ChartCardRenderer in
// "bare" mode (the card shell already provides the title + border).
import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ChartCardRenderer from '../../components/copilot/cards/ChartCardRenderer';

const ChartCardView = ({ payload, chartType = 'bar', loading, error, height = 220 }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: height }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  const buckets = payload?.buckets || [];
  if (error || buckets.length === 0) {
    return (
      <Box sx={{ minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {error ? 'This chart failed to load.' : 'No data to chart yet.'}
        </Typography>
      </Box>
    );
  }
  const data = buckets.map((b) => ({ label: String(b.key ?? '—'), value: Number(b.value) || 0 }));
  return (
    <ChartCardRenderer
      bare
      height={height}
      card={{ chartType, data, xKey: 'label', yKeys: ['value'] }}
    />
  );
};

export default ChartCardView;

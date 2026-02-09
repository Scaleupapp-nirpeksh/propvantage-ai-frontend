// File: src/components/copilot/cards/MetricsCardRenderer.js
// Renders a grid of metric boxes with values, trends, and formatting

import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const formatValue = (value, unit) => {
  if (unit === 'currency') {
    const num = Number(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
    return `₹${num.toLocaleString('en-IN')}`;
  }
  if (unit === 'percent') return `${value}%`;
  if (unit === 'units') return `${value} units`;
  return String(value);
};

const TrendIndicator = ({ trend, changePercent }) => {
  const theme = useTheme();
  if (!trend) return null;

  const config = {
    up: { icon: TrendingUp, color: theme.palette.success.main },
    down: { icon: TrendingDown, color: theme.palette.error.main },
    flat: { icon: TrendingFlat, color: theme.palette.grey[500] },
  };

  const { icon: Icon, color } = config[trend] || config.flat;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
      <Icon sx={{ fontSize: 14, color }} />
      {changePercent != null && (
        <Typography variant="caption" sx={{ color, fontWeight: 600, fontSize: '0.688rem' }}>
          {changePercent > 0 ? '+' : ''}{changePercent}%
        </Typography>
      )}
    </Box>
  );
};

const MetricsCardRenderer = ({ card }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 1 }}>
      {card.title && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            mb: 1,
            display: 'block',
            fontSize: '0.688rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {card.title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
        }}
      >
        {card.metrics.map((metric, i) => (
          <Box
            key={i}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontSize: '0.688rem', display: 'block' }}
            >
              {metric.label}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'text.primary',
                lineHeight: 1.3,
                mt: 0.25,
              }}
            >
              {formatValue(metric.value, metric.unit)}
            </Typography>
            <TrendIndicator trend={metric.trend} changePercent={metric.changePercent} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MetricsCardRenderer;

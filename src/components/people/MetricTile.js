import React from 'react';
import { Box, Typography, LinearProgress, alpha, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const coerceNumber = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[,\s₹]/g, ''));
  return NaN;
};

const isPreformattedCurrency = (v) =>
  typeof v === 'string' && /(cr\b|crore|lakh|\bl\b|\bk\b|₹)/i.test(v);

const formatValue = (value, unit) => {
  if (value == null || value === '') return '—';
  if (unit === 'currency') {
    if (isPreformattedCurrency(value)) {
      const t = String(value).trim();
      return t.startsWith('₹') ? t : `₹${t}`;
    }
    const num = coerceNumber(value);
    if (!Number.isFinite(num)) return String(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
    return `₹${num.toLocaleString('en-IN')}`;
  }
  if (unit === 'percent') {
    const num = coerceNumber(value);
    return Number.isFinite(num) ? `${Math.round(num * 100)}%` : String(value);
  }
  return String(value);
};

const TREND_ICONS = {
  up:   { Icon: TrendingUp,   color: 'success.main' },
  down: { Icon: TrendingDown, color: 'error.main'   },
  flat: { Icon: TrendingFlat, color: 'text.disabled'},
};

const MetricTile = ({ label, value, unit, trend, changePercent, vsMedian, pctTarget }) => {
  const theme = useTheme();
  const trendCfg = TREND_ICONS[trend] || null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.688rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', lineHeight: 1.3, mt: 0.25 }}>
        {formatValue(value, unit)}
      </Typography>
      {trendCfg && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
          <trendCfg.Icon sx={{ fontSize: 14, color: trendCfg.color }} />
          {changePercent != null && (
            <Typography variant="caption" sx={{ color: trendCfg.color, fontWeight: 600, fontSize: '0.688rem' }}>
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </Typography>
          )}
        </Box>
      )}
      {vsMedian != null && (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', display: 'block', mt: 0.25 }}>
          vs median: {vsMedian > 0 ? '+' : ''}{vsMedian}%
        </Typography>
      )}
      {pctTarget != null && (
        <Box sx={{ mt: 0.75 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(pctTarget, 100)}
            sx={{ height: 4, borderRadius: 2 }}
            color={pctTarget >= 100 ? 'success' : pctTarget >= 75 ? 'primary' : 'warning'}
          />
          <Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
            {pctTarget}% of target
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MetricTile;
export { formatValue, coerceNumber };

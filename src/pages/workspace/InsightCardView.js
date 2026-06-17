// src/pages/workspace/InsightCardView.js
// Renders the normalized insight payload (Theme D3) produced by the backend's
// insight sources: a headline number, scenario/comparison bands, a confidence
// chip, a lightweight sparkline, and a few insight bullets. One renderer for
// every source (salesForecast, revenueProjection, leadConversion, budgetVsActual).
import React from 'react';
import { Box, Typography, Chip, Stack, CircularProgress, Divider } from '@mui/material';
import { CheckCircleOutline, ErrorOutline, RemoveCircleOutline } from '@mui/icons-material';

// ── Value formatting ────────────────────────────────────────────────────────
const formatCurrency = (n) => {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};
const formatValue = (value, format) => {
  if (value === null || value === undefined) return '—';
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `${Number(value) || 0}%`;
  return (Number(value) || 0).toLocaleString('en-IN');
};

const toneColor = (tone, theme) => {
  if (tone === 'positive') return theme.palette.success.main;
  if (tone === 'negative') return theme.palette.error.main;
  return theme.palette.text.secondary;
};

const confidenceColor = (level) =>
  level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'default';

// ── Minimal inline sparkline (no chart dependency) ──────────────────────────
const Sparkline = ({ series }) => {
  const pts = (series || []).map((p) => Number(p.value) || 0);
  if (pts.length < 2) return null;
  const w = 240;
  const h = 40;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const span = max - min || 1;
  const step = w / (pts.length - 1);
  const coords = pts.map((v, i) => [i * step, h - ((v - min) / span) * (h - 4) - 2]);
  return (
    <Box sx={{ mt: 1 }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline
          points={coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Box>
  );
};

const StatusIcon = ({ tone }) => {
  if (tone === 'positive') return <CheckCircleOutline sx={{ fontSize: 14, color: 'success.main' }} />;
  if (tone === 'negative') return <ErrorOutline sx={{ fontSize: 14, color: 'error.main' }} />;
  return <RemoveCircleOutline sx={{ fontSize: 14, color: 'text.disabled' }} />;
};

const InsightCardView = ({ payload, loading, error, compact = false }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (error || !payload) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {error ? 'This insight failed to load.' : 'No insight data.'}
        </Typography>
      </Box>
    );
  }

  const { headline = {}, bands = [], confidence, series, bullets = [] } = payload;

  return (
    <Box>
      {/* Headline */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">{headline.label}</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
            {formatValue(headline.value, headline.format)}
          </Typography>
        </Box>
        {confidence && (
          <Chip
            size="small"
            label={`${confidence.label}: ${confidence.level}`}
            color={confidenceColor(confidence.level)}
            sx={{ height: 22, fontSize: '0.65rem', textTransform: 'capitalize' }}
          />
        )}
      </Box>

      {/* Bands (scenarios / comparison) */}
      {bands.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {bands.map((b) => (
            <Box
              key={b.label}
              sx={{
                flex: 1,
                borderRadius: 1.5,
                p: 1,
                bgcolor: (t) => t.palette.action.hover,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" noWrap>{b.label}</Typography>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: (t) => toneColor(b.tone, t) }}
                noWrap
              >
                {formatValue(b.value, b.format)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      {/* Sparkline */}
      {series && series.length > 1 && (
        <Box sx={{ color: 'primary.main' }}>
          <Sparkline series={series} />
        </Box>
      )}

      {/* Bullets */}
      {!compact && bullets.length > 0 && (
        <>
          <Divider sx={{ my: 1.25 }} />
          <Stack spacing={0.5}>
            {bullets.slice(0, 4).map((b, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                <Box sx={{ mt: 0.25 }}><StatusIcon tone="neutral" /></Box>
                <Typography variant="body2" color="text.secondary">{b}</Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}

      {payload.asOf && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
          As of {new Date(payload.asOf).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
};

export default InsightCardView;

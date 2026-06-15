// File: src/components/reports/ReportBlockRenderer.js
// Renders a resolved report block ({ type, kind, title, config, data }) to UI.
// Shared by the builder preview, the review page, and the public report page.
// `themePreset` selects the report's visual theme (clean | midnight | warm).

import React from 'react';
import {
  Box, Card, CardContent, Typography, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, Alert,
} from '@mui/material';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { AutoAwesome } from '@mui/icons-material';
import { getReportTheme } from '../../utils/reportThemes';

const formatValue = (value, unit) => {
  const n = Number(value) || 0;
  if (unit === 'percent') return `${(n * 100).toFixed(1)}%`;
  if (unit === 'currency') {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  return n.toLocaleString('en-IN');
};

const ReportBlockRenderer = ({ block, images = [], themePreset, accentColor }) => {
  const base = getReportTheme(themePreset);
  const t = accentColor ? { ...base, accent: accentColor, accentSoft: `${accentColor}14` } : base;
  const colors = t.chartColors;
  const { type, kind, title, config = {}, data = {} } = block || {};

  const cardSx = { bgcolor: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 2 };

  if (type === 'ai.narrative') {
    const text = data?.text;
    return (
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.accentSoft }} style={{ borderLeft: `3px solid ${t.accent}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: t.accent }}>
          <AutoAwesome fontSize="small" />
          <Typography variant="caption" fontWeight={700}>{title || 'AI Summary'}</Typography>
        </Box>
        {text
          ? <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: t.text }}>{text}</Typography>
          : <Typography variant="body2" sx={{ color: t.subtext }}>The AI narrative is unavailable for this report.</Typography>}
      </Box>
    );
  }

  if (data && data.error) {
    return <Alert severity="warning" variant="outlined">{title || type}: couldn't load this data.</Alert>;
  }

  if (kind === 'kpi') {
    return (
      <Box sx={{ p: 2.5, borderRadius: 2, ...cardSx }}>
        <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.1, color: t.text }}>
          {formatValue(data.value, data.unit)}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: t.subtext, mt: 0.5 }}>{title || type}</Typography>
      </Box>
    );
  }

  if (kind === 'chart') {
    const chartData = Array.isArray(data.data) ? data.data : [];
    const isPie = (data.chartKind || 'bar') === 'pie';
    return (
      <Card elevation={0} sx={cardSx}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: t.text }}>{title || type}</Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              {isPie ? (
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ color: t.subtext }} />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: t.subtext, fontSize: 12 }} />
                  <YAxis tick={{ fill: t.subtext, fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (kind === 'table') {
    const rows = Array.isArray(data.rows) ? data.rows : [];
    // Prefer explicit column metadata (with units) from the block; otherwise fall back to raw
    // keys (rendered as text) so any future/legacy table without metadata still displays.
    const columns = Array.isArray(data.columns) && data.columns.length
      ? data.columns
      : (rows.length ? Object.keys(rows[0]).map((k) => ({ key: k, label: k, unit: null })) : []);
    const isNumeric = (unit) => unit === 'currency' || unit === 'percent' || unit === 'count';
    const cellText = (value, unit) => (isNumeric(unit) ? formatValue(value, unit) : String(value ?? ''));
    return (
      <Card elevation={0} sx={cardSx}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: t.text }}>{title || type}</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>{columns.map((col) => (
                <TableCell key={col.key} align={isNumeric(col.unit) ? 'right' : 'left'} sx={{ color: t.subtext, borderColor: t.surfaceBorder, fontWeight: 700 }}>{col.label}</TableCell>
              ))}</TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>{columns.map((col) => (
                  <TableCell key={col.key} align={isNumeric(col.unit) ? 'right' : 'left'} sx={{ color: t.text, borderColor: t.surfaceBorder }}>{cellText(r[col.key], col.unit)}</TableCell>
                ))}</TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // ─── Layout / media blocks ───
  if (type === 'layout.hero') {
    const cover = images.find((im) => im.id === config.imageSlotId);
    return (
      <Box sx={{
        position: 'relative', borderRadius: 3, overflow: 'hidden', minHeight: 200,
        p: 4, color: cover ? 'common.white' : t.text,
        background: cover
          ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${cover.url}) center/cover`
          : t.accentSoft,
      }}>
        <Typography variant="h4" fontWeight={700}>{config.title || title || 'Report'}</Typography>
        {config.subtitle ? <Typography variant="h6">{config.subtitle}</Typography> : null}
      </Box>
    );
  }
  if (type === 'media.gallery') {
    const slotIds = Array.isArray(config.imageSlotIds) ? config.imageSlotIds : [];
    const imgs = images.filter((im) => slotIds.includes(im.id));
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        {imgs.map((im) => (
          <Box key={im.id} component="img" src={im.url} alt={im.label || ''}
            sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 2 }} />
        ))}
      </Box>
    );
  }
  if (type === 'text.note') {
    return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: t.text }}>{config.text ?? data.text ?? ''}</Typography>;
  }
  if (type === 'layout.divider') {
    return <Divider sx={{ my: 2, borderColor: t.surfaceBorder }} />;
  }

  return <Alert severity="info" variant="outlined">Unsupported block: {type}</Alert>;
};

export default ReportBlockRenderer;

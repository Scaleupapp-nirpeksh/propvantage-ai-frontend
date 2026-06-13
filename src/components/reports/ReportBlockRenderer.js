// File: src/components/reports/ReportBlockRenderer.js
// Renders a resolved report block ({ type, kind, title, config, data }) to UI.
// Shared by the builder preview and (Phase 2) the public report page.

import React from 'react';
import {
  Box, Card, CardContent, Typography, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, Alert, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { KPICard } from '../common';

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

const ReportBlockRenderer = ({ block, images = [] }) => {
  const theme = useTheme();
  const colors = theme.custom?.chartColors || [theme.palette.primary.main];
  const { type, kind, title, config = {}, data = {} } = block || {};

  if (data && data.error) {
    return <Alert severity="warning" variant="outlined">{title || type}: couldn't load this data.</Alert>;
  }

  if (kind === 'kpi') {
    return <KPICard title={title || type} value={formatValue(data.value, data.unit)} />;
  }

  if (kind === 'chart') {
    const chartData = Array.isArray(data.data) ? data.data : [];
    const isPie = (data.chartKind || 'bar') === 'pie';
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{title || type}</Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              {isPie ? (
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
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
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{title || type}</Typography>
          <Table size="small">
            <TableHead><TableRow>{cols.map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>{cols.map((c) => <TableCell key={c}>{String(r[c])}</TableCell>)}</TableRow>
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
        p: 4, color: cover ? 'common.white' : 'text.primary',
        background: cover
          ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${cover.url}) center/cover`
          : theme.palette.action.hover,
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
    return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{config.text ?? data.text ?? ''}</Typography>;
  }
  if (type === 'layout.divider') {
    return <Divider sx={{ my: 2 }} />;
  }

  return <Alert severity="info" variant="outlined">Unsupported block: {type}</Alert>;
};

export default ReportBlockRenderer;

import React from 'react';
import { Box, Typography, Chip, Divider, Avatar, useTheme } from '@mui/material';
import { Warning } from '@mui/icons-material';
import MetricTile from './MetricTile';
import attainmentPct from './attainmentPct';

const Scorecard = ({ user, metrics = {}, attainment = {}, trend = {}, vsTeamMedian = {}, flags = {}, onClick }) => {
  const theme = useTheme();
  const flagCount = Object.values(flags || {}).reduce((s, v) => s + (Array.isArray(v) ? v.length : (v?.count || 0)), 0);

  const tiles = [
    { label: 'Sales Value', key: 'salesValue', unit: 'currency' },
    { label: 'Sales Count', key: 'salesCount', unit: 'number' },
    { label: 'Leads Worked', key: 'leadsWorked', unit: 'number' },
    { label: 'Conversion Rate', key: 'conversionRate', unit: 'percent' },
    { label: 'Tasks SLA', key: 'taskSlaRate', unit: 'percent' },
    { label: 'Interactions', key: 'interactionsLogged', unit: 'number' },
  ];

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown';

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 2 } : {},
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{userName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.role || user?.roleRef?.name}</Typography>
          </Box>
        </Box>
        {flagCount > 0 && (
          <Chip
            size="small"
            icon={<Warning sx={{ fontSize: '0.875rem !important' }} />}
            label={`${flagCount} flags`}
            color="error"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.625rem' }}
          />
        )}
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      {/* Metric grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {tiles.map(({ label, key, unit }) => (
          <MetricTile
            key={key}
            label={label}
            value={metrics[key]}
            unit={unit}
            trend={trend[key]}
            vsMedian={vsTeamMedian[key]}
            pctTarget={(() => { const frac = attainmentPct(attainment[key]); return frac != null ? Math.round(frac * 100) : undefined; })()}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Scorecard;

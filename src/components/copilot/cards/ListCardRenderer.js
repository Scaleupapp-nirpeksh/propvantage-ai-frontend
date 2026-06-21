// File: src/components/copilot/cards/ListCardRenderer.js
// Renders a vertical list of records. Each item: { title, subtitle, value, status }.
// Layout is defensive: titles never truncate to "TKT-...", subtitles/values wrap,
// and a long `value` (the model sometimes packs "Key: a, Key: b" in there) drops
// to its own line instead of crushing the title.

import React from 'react';
import { Box, Typography, Chip, useTheme, alpha } from '@mui/material';

const STATUS_COLORS = {
  overdue: 'error',
  due: 'warning',
  completed: 'success',
  resolved: 'success',
  closed: 'default',
  active: 'info',
  in_progress: 'warning',
  'in progress': 'warning',
  waiting_on_client: 'secondary',
  'waiting on client': 'secondary',
  assigned: 'info',
  new: 'info',
};

const statusChipColor = (status) => {
  if (!status) return 'default';
  return STATUS_COLORS[String(status).toLowerCase().trim()] || 'default';
};

// A "value" is a short badge (a number, amount, short status) vs. a metadata
// string that should wrap onto its own line.
const isBadgeValue = (value) => {
  const s = String(value);
  return s.length <= 18 && !s.includes(',') && !/:/.test(s);
};

const ListCardRenderer = ({ card }) => {
  const theme = useTheme();
  const items = Array.isArray(card.items) ? card.items : [];

  return (
    <Box sx={{ mb: 1 }}>
      {card.title && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            mb: 0.75,
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
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {items.map((item, i) => {
          const badge = item.value != null && item.value !== '' && isBadgeValue(item.value);
          const valueLine = item.value != null && item.value !== '' && !badge;
          return (
            <Box
              key={i}
              sx={{
                px: 1.75,
                py: 1.25,
                borderBottom: i < items.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
              }}
            >
              {/* Header: title + (optional) status chip / short value badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    lineHeight: 1.35,
                    color: 'text.primary',
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {item.title}
                </Typography>
                {item.status && (
                  <Chip
                    label={String(item.status).replace(/_/g, ' ')}
                    size="small"
                    color={statusChipColor(item.status)}
                    sx={{ height: 20, fontSize: '0.625rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}
                  />
                )}
                {badge && (
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: 'primary.main',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {item.value}
                  </Typography>
                )}
              </Box>

              {item.subtitle && (
                <Typography
                  sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.45, mt: 0.4, wordBreak: 'break-word' }}
                >
                  {item.subtitle}
                </Typography>
              )}

              {valueLine && (
                <Typography
                  sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1.45, mt: 0.25, wordBreak: 'break-word' }}
                >
                  {item.value}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ListCardRenderer;

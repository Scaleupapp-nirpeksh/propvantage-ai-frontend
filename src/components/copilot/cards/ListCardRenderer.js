// File: src/components/copilot/cards/ListCardRenderer.js
// Renders a vertical list with title, subtitle, value and status badge

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';

const statusColor = (status, theme) => {
  const map = {
    overdue: theme.palette.error.main,
    due: theme.palette.warning.main,
    completed: theme.palette.success.main,
    active: theme.palette.info.main,
  };
  return map[status] || theme.palette.grey[500];
};

const ListCardRenderer = ({ card }) => {
  const theme = useTheme();

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
        {card.items.map((item, i) => {
          const color = statusColor(item.status, theme);
          return (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 1,
                borderBottom: i < card.items.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3 }}
                  noWrap
                >
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.688rem' }}
                    noWrap
                  >
                    {item.subtitle}
                  </Typography>
                )}
              </Box>
              {item.value && (
                <Box
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: item.status ? alpha(color, 0.1) : 'grey.100',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      color: item.status ? color : 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ListCardRenderer;

import React from 'react';
import { Box, Typography, Chip, List, ListItem, ListItemText, ListItemIcon, alpha, useTheme } from '@mui/material';
import { Warning } from '@mui/icons-material';

const FLAG_LABELS = {
  staleLeads:       'Stale leads (no interaction >7d)',
  noMovementLeads:  'Leads with no status movement >14d',
  overdueFollowUps: 'Overdue follow-ups',
  overdueTasks:     'Overdue tasks',
  agingPipeline:    'Aging pipeline (>30d open)',
  lowActivity:      'Low activity (<5 interactions / 7d)',
};

const RedFlagInbox = ({ flags = {} }) => {
  const theme = useTheme();
  const entries = Object.entries(flags).filter(([, v]) => {
    const count = Array.isArray(v) ? v.length : (v?.count || 0);
    return count > 0;
  });

  if (entries.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No red flags — looking good!</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Needs Attention
      </Typography>
      <List dense disablePadding>
        {entries.map(([key, val]) => {
          const count = Array.isArray(val) ? val.length : (val?.count || 0);
          return (
            <ListItem
              key={key}
              disablePadding
              sx={{
                mb: 0.5,
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.error.main, 0.05),
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Warning sx={{ fontSize: 16, color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={FLAG_LABELS[key] || key}
                secondary={`${count} item${count !== 1 ? 's' : ''}`}
                primaryTypographyProps={{ fontSize: '0.813rem' }}
                secondaryTypographyProps={{ fontSize: '0.688rem' }}
              />
              <Chip label={count} size="small" color="error" sx={{ height: 20, fontSize: '0.625rem' }} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default RedFlagInbox;

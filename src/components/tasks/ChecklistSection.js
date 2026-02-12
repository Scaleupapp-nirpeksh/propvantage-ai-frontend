import React from 'react';
import { Box, Typography, LinearProgress, Checkbox, FormControlLabel, alpha, useTheme, Tooltip } from '@mui/material';
import { ChecklistRtl } from '@mui/icons-material';
import { formatRelativeTime } from '../../utils/formatters';

const ChecklistSection = ({ checklist = [], taskId, onToggle, disabled = false, progress }) => {
  const theme = useTheme();

  if (!checklist || checklist.length === 0) return null;

  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const totalCount = checklist.length;
  const displayProgress = progress != null ? progress : Math.round((completedCount / totalCount) * 100);

  return (
    <Box>
      {/* Header with progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <ChecklistRtl sx={{ fontSize: 20, color: 'text.secondary' }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Checklist ({completedCount}/{totalCount})
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {displayProgress}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={displayProgress}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            bgcolor: displayProgress === 100 ? 'success.main' : 'primary.main',
          },
        }}
      />

      {/* Checklist items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {checklist
          .slice()
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((item) => (
            <Tooltip
              key={item._id}
              title={
                item.isCompleted && item.completedAt
                  ? `Completed ${formatRelativeTime(item.completedAt)}`
                  : ''
              }
              placement="right"
              arrow
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={item.isCompleted}
                    onChange={() => onToggle && onToggle(item._id, !item.isCompleted)}
                    disabled={disabled}
                    size="small"
                    sx={{ py: 0.25 }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                      color: item.isCompleted ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {item.text}
                  </Typography>
                }
                sx={{ mx: 0, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }, borderRadius: 1 }}
              />
            </Tooltip>
          ))}
      </Box>
    </Box>
  );
};

export default ChecklistSection;

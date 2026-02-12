import React, { useState } from 'react';
import { Box, Chip, Popover, IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { AddReaction } from '@mui/icons-material';
import { groupReactions, QUICK_REACTIONS } from './utils/chatHelpers';

const ReactionBar = ({ reactions, currentUserId, onToggleReaction, disabled }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const grouped = groupReactions(reactions, currentUserId);

  if (!grouped.length && disabled) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
      {grouped.map((g) => (
        <Tooltip
          key={g.emoji}
          title={g.users.map((u) => `${u.firstName} ${u.lastName}`).join(', ')}
        >
          <Chip
            size="small"
            label={`${g.emoji} ${g.count}`}
            onClick={() => !disabled && onToggleReaction(g.emoji)}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              cursor: disabled ? 'default' : 'pointer',
              bgcolor: g.hasReacted
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.grey[500], 0.08),
              border: g.hasReacted ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
              '&:hover': disabled ? {} : {
                bgcolor: g.hasReacted
                  ? alpha(theme.palette.primary.main, 0.18)
                  : alpha(theme.palette.grey[500], 0.14),
              },
            }}
          />
        </Tooltip>
      ))}

      {!disabled && (
        <>
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ width: 24, height: 24 }}
          >
            <AddReaction sx={{ fontSize: 16, color: 'text.secondary' }} />
          </IconButton>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            slotProps={{ paper: { sx: { borderRadius: 3, p: 0.5, boxShadow: theme.custom?.elevation?.dropdown } } }}
          >
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              {QUICK_REACTIONS.map((emoji) => (
                <IconButton
                  key={emoji}
                  size="small"
                  onClick={() => {
                    onToggleReaction(emoji);
                    setAnchorEl(null);
                  }}
                  sx={{
                    fontSize: '1.2rem',
                    width: 36,
                    height: 36,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Popover>
        </>
      )}
    </Box>
  );
};

export default ReactionBar;

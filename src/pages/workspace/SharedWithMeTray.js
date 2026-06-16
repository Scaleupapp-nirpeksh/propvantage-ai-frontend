// src/pages/workspace/SharedWithMeTray.js
import React from 'react';
import {
  Box, Paper, Typography, Chip, Button, Stack, Tooltip,
} from '@mui/material';
import { Inbox, AddCircleOutline, CheckCircle } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';

const SharedWithMeTray = () => {
  const { sharedWithMe, layout, addToBoard } = useWorkspace();

  if (!sharedWithMe || sharedWithMe.length === 0) return null;

  const onBoard = (id) => (layout.items || []).some((it) => it.cardId === id);

  return (
    <Paper
      elevation={0}
      sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 2, mb: 3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Inbox sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="subtitle2" fontWeight={700}>Shared with me</Typography>
        <Chip size="small" label={sharedWithMe.length} sx={{ height: 20, fontSize: '0.65rem' }} />
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
        {sharedWithMe.map((card) => {
          const added = onBoard(card._id);
          return (
            <Paper
              key={card._id}
              variant="outlined"
              sx={{ p: 1.5, minWidth: 220, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{card.title}</Typography>
                <Typography variant="caption" color="text.secondary">{card.module}</Typography>
              </Box>
              {added ? (
                <Tooltip title="Already on your board">
                  <CheckCircle color="success" sx={{ fontSize: 20 }} />
                </Tooltip>
              ) : (
                <Button
                  size="small"
                  startIcon={<AddCircleOutline />}
                  onClick={() => addToBoard(card._id, card.renderMode === 'metric' ? 'sm' : 'md')}
                  sx={{ textTransform: 'none', flexShrink: 0 }}
                >
                  Add
                </Button>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default SharedWithMeTray;

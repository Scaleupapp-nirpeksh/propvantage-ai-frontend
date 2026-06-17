// src/pages/workspace/SuggestedCardsDialog.js
// Compact picker that lets users one-click add dashboard-derived suggested
// cards that are not already on the board.

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getSuggestedCards } from './starterCards';

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
const SuggestedCardsDialog = ({ open, onClose }) => {
  const { cards, createCard, addToBoard } = useWorkspace();

  // Track which suggestion titles are currently being added (in-flight).
  const [adding, setAdding] = useState(new Set());

  // Dedupe: filter out any suggestion whose title already exists in cards
  // (owned or shared-with-me — both live in `cards`).
  const existingTitles = new Set(cards.map((c) => c.title));
  const suggestions = getSuggestedCards().filter(
    (s) => !existingTitles.has(s.title),
  );

  const handleAdd = async (def) => {
    setAdding((prev) => new Set(prev).add(def.title));
    try {
      const created = await createCard({
        title: def.title,
        module: def.module,
        queryPlan: def.queryPlan,
        renderMode: def.renderMode,
        metricConfig: def.metricConfig,
        chartConfig: def.chartConfig,
        visibility: 'private',
        sharedWithUsers: [],
        sharedWithRoles: [],
      });
      if (created?._id) {
        await addToBoard(created._id, def.renderMode === 'metric' ? 'sm' : 'md');
      }
    } finally {
      // Remove from in-flight set; the card is now in `cards` so it drops
      // from `suggestions` automatically on the next render.
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(def.title);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Suggested cards</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {suggestions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              All suggestions added
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {suggestions.map((def) => {
              const inFlight = adding.has(def.title);
              return (
                <ListItem
                  key={def.title}
                  divider
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={inFlight}
                      onClick={() => handleAdd(def)}
                      sx={{ textTransform: 'none', minWidth: 72 }}
                    >
                      {inFlight ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={def.title}
                    secondary={
                      <Chip
                        label={def.module}
                        size="small"
                        sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                      />
                    }
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuggestedCardsDialog;

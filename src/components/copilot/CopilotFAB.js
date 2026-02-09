// File: src/components/copilot/CopilotFAB.js
// Description: Floating action button to toggle the AI Copilot chat panel
// Always visible in bottom-right corner, pulse animation on first visit

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Fab, Tooltip, useTheme, Zoom, Typography } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import CopilotChat from './CopilotChat';

const STORAGE_KEY = 'propvantage_copilot_seen';

const CopilotFAB = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setHasSeenBefore(false);
    }
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev && !hasSeenBefore) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setHasSeenBefore(true);
      }
      return !prev;
    });
  }, [hasSeenBefore]);

  // Keyboard shortcut: Cmd+J / Ctrl+J
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleToggle]);

  return (
    <>
      {/* Chat panel */}
      <CopilotChat open={open} onClose={() => setOpen(false)} />

      {/* FAB button */}
      <Zoom in={!open} unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: theme.zIndex.speedDial,
          }}
        >
          {/* Hint tooltip for first-time users */}
          {!hasSeenBefore && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 64,
                right: 0,
                bgcolor: 'grey.900',
                color: '#fff',
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontWeight: 500,
                boxShadow: theme.custom.elevation.dropdown,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -6,
                  right: 20,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${theme.palette.grey[900]}`,
                },
              }}
            >
              Ask AI anything!{' '}
              <Typography
                component="span"
                sx={{ fontSize: '0.625rem', color: 'grey.400', ml: 0.5 }}
              >
                ⌘J
              </Typography>
            </Box>
          )}

          <Tooltip title="AI Copilot (⌘J)" placement="left">
            <Fab
              color="primary"
              onClick={handleToggle}
              sx={{
                width: 56,
                height: 56,
                boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)',
                transition: 'all 200ms ease',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(30, 136, 229, 0.5)',
                  transform: 'scale(1.05)',
                },
                // Pulse animation for first-time users
                ...(!hasSeenBefore && {
                  animation: 'copilotPulse 2s infinite',
                  '@keyframes copilotPulse': {
                    '0%': { boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)' },
                    '50%': { boxShadow: '0 4px 24px rgba(30, 136, 229, 0.6), 0 0 0 8px rgba(30, 136, 229, 0.1)' },
                    '100%': { boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)' },
                  },
                }),
              }}
            >
              <AutoAwesome sx={{ fontSize: 24 }} />
            </Fab>
          </Tooltip>
        </Box>
      </Zoom>
    </>
  );
};

export default CopilotFAB;

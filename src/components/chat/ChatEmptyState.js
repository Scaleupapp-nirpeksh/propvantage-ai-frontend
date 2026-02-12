import React from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';

const ChatEmptyState = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.grey[500], 0.02),
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <ChatIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" color="text.primary" gutterBottom>
        Select a conversation
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
        Choose a conversation from the sidebar or start a new one to begin chatting.
      </Typography>
    </Box>
  );
};

export default ChatEmptyState;

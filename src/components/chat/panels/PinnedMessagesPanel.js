import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, List, ListItemButton,
  ListItemText, CircularProgress, useTheme,
} from '@mui/material';
import { Close, PushPin } from '@mui/icons-material';
import { useChat } from '../../../context/ChatContext';
import { formatRelativeTime, truncateText } from '../../../utils/formatters';

const PinnedMessagesPanel = ({ open, conversationId, onClose }) => {
  const theme = useTheme();
  const { loadPinnedMessages } = useChat();
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && conversationId) {
      setLoading(true);
      loadPinnedMessages(conversationId)
        .then((msgs) => setPinnedMessages(msgs))
        .catch(() => setPinnedMessages([]))
        .finally(() => setLoading(false));
    }
  }, [open, conversationId, loadPinnedMessages]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 360 }, p: 0 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PushPin sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>Pinned Messages</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : pinnedMessages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3 }}>
            <PushPin sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No pinned messages in this conversation
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {pinnedMessages.map((msg) => (
              <ListItemButton key={msg._id} sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="primary.main">
                        {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(msg.pinnedAt || msg.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.primary">
                      {truncateText(msg.content?.text || 'Attachment', 120)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default PinnedMessagesPanel;

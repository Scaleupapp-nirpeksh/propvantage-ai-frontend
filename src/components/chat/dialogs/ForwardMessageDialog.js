import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField,
  List, ListItemButton, ListItemAvatar, Avatar, ListItemText,
  InputAdornment, IconButton, CircularProgress, alpha, useTheme,
} from '@mui/material';
import { Search, Close, Group, Business } from '@mui/icons-material';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { getConversationDisplayName } from '../utils/chatHelpers';
import { useSnackbar } from 'notistack';

const ForwardMessageDialog = ({ open, message, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { conversations, conversationOrder, forwardMessage } = useChat();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const filtered = useMemo(() => {
    return conversationOrder.filter((id) => {
      const conv = conversations[id];
      if (!conv) return false;
      if (search) {
        const name = getConversationDisplayName(conv, user?._id);
        return name.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [conversationOrder, conversations, search, user?._id]);

  const handleForward = async (targetConvId) => {
    if (!message?._id) return;
    setForwarding(true);
    try {
      await forwardMessage(message._id, targetConvId);
      enqueueSnackbar('Message forwarded', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to forward message', { variant: 'error' });
    }
    setForwarding(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>Forward Message</Typography>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Preview */}
        {message && (
          <Box sx={{ mx: 3, mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary">
              {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'System'}
            </Typography>
            <Typography variant="body2" noWrap>
              {message.content?.text || 'Attachment'}
            </Typography>
          </Box>
        )}

        <Box sx={{ px: 3, pb: 1.5 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {forwarding && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!forwarding && (
            <List disablePadding>
              {filtered.map((id) => {
                const conv = conversations[id];
                if (!conv) return null;
                const name = getConversationDisplayName(conv, user?._id);
                return (
                  <ListItemButton key={id} onClick={() => handleForward(id)} sx={{ px: 3 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', fontSize: '0.75rem' }}>
                        {conv.type === 'group' ? <Group sx={{ fontSize: 18 }} /> : conv.type === 'entity' ? <Business sx={{ fontSize: 18 }} /> : name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    />
                  </ListItemButton>
                );
              })}
              {filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No conversations found
                </Typography>
              )}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;

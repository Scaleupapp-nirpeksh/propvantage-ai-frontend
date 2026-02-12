import React, { useState, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, Button, List,
  ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Divider,
  CircularProgress, alpha, useTheme,
} from '@mui/material';
import { Close, PersonRemove, Archive, ExitToApp, Edit, Save } from '@mui/icons-material';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from 'notistack';
import ConfirmDialog from '../../common/ConfirmDialog';

const ConversationSettingsPanel = ({ open, conversationId, onClose }) => {
  const theme = useTheme();
  const { user, checkPerm } = useAuth();
  const { conversations, updateConversation, removeParticipant, archiveConversation, leaveConversation } = useChat();
  const { enqueueSnackbar } = useSnackbar();

  const conversation = conversations[conversationId];
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const isGroupAdmin = conversation?.participants?.some(
    (p) => p.user?._id === user?._id && p.role === 'admin'
  );
  const canManage = isGroupAdmin || (checkPerm ? checkPerm('chat:manage_groups') : false);
  const activeParticipants = conversation?.participants?.filter((p) => p.isActive !== false) || [];

  const handleSaveName = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      await updateConversation(conversationId, { name, description });
      setEditingName(false);
      enqueueSnackbar('Conversation updated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to update', { variant: 'error' });
    }
    setLoading(false);
  }, [conversationId, name, description, updateConversation, enqueueSnackbar]);

  const handleRemoveParticipant = useCallback(async (userId) => {
    try {
      await removeParticipant(conversationId, userId);
      enqueueSnackbar('Participant removed', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to remove participant', { variant: 'error' });
    }
    setConfirmAction(null);
  }, [conversationId, removeParticipant, enqueueSnackbar]);

  const handleArchive = useCallback(async () => {
    try {
      await archiveConversation(conversationId, true);
      enqueueSnackbar('Conversation archived', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to archive', { variant: 'error' });
    }
    setConfirmAction(null);
  }, [conversationId, archiveConversation, onClose, enqueueSnackbar]);

  const handleLeave = useCallback(async () => {
    try {
      await leaveConversation(conversationId);
      enqueueSnackbar('Left conversation', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to leave', { variant: 'error' });
    }
    setConfirmAction(null);
  }, [conversationId, leaveConversation, onClose, enqueueSnackbar]);

  if (!conversation || conversation.type === 'direct') return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, p: 0 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={600}>Settings</Typography>
          <IconButton size="small" onClick={onClose}><Close /></IconButton>
        </Box>

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          {/* Name & description */}
          {canManage ? (
            editingName ? (
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  maxRows={3}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setEditingName(false)}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={handleSaveName} disabled={loading} startIcon={loading ? <CircularProgress size={14} /> : <Save sx={{ fontSize: 16 }} />}>
                    Save
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={600}>{conversation.name}</Typography>
                  <IconButton size="small" onClick={() => { setName(conversation.name || ''); setDescription(conversation.description || ''); setEditingName(true); }}>
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                {conversation.description && (
                  <Typography variant="body2" color="text.secondary">{conversation.description}</Typography>
                )}
              </Box>
            )
          ) : (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>{conversation.name}</Typography>
              {conversation.description && (
                <Typography variant="body2" color="text.secondary">{conversation.description}</Typography>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Members */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Members ({activeParticipants.length})
          </Typography>
          <List disablePadding>
            {activeParticipants.map((p) => (
              <ListItem
                key={p.user?._id}
                sx={{ px: 0 }}
                secondaryAction={
                  canManage && p.user?._id !== user?._id ? (
                    <IconButton
                      size="small"
                      onClick={() => setConfirmAction({ type: 'remove', userId: p.user._id, name: `${p.user.firstName} ${p.user.lastName}` })}
                    >
                      <PersonRemove sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={p.user?.profileImage}
                    sx={{ width: 32, height: 32, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}
                  >
                    {`${p.user?.firstName?.[0] || ''}${p.user?.lastName?.[0] || ''}`}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{p.user?.firstName} {p.user?.lastName}</Typography>
                      {p.role === 'admin' && (
                        <Chip label="Admin" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                      )}
                      {p.user?._id === user?._id && (
                        <Typography variant="caption" color="text.secondary">(you)</Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<Archive />}
              color="inherit"
              onClick={() => setConfirmAction({ type: 'archive' })}
              sx={{ justifyContent: 'flex-start' }}
            >
              Archive Conversation
            </Button>
            {conversation.type !== 'direct' && (
              <Button
                startIcon={<ExitToApp />}
                color="error"
                onClick={() => setConfirmAction({ type: 'leave' })}
                sx={{ justifyContent: 'flex-start' }}
              >
                Leave Conversation
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'remove' ? 'Remove Participant' :
          confirmAction?.type === 'archive' ? 'Archive Conversation' :
          'Leave Conversation'
        }
        message={
          confirmAction?.type === 'remove' ? `Remove ${confirmAction.name} from this conversation?` :
          confirmAction?.type === 'archive' ? 'Archive this conversation? You can unarchive it later.' :
          'Are you sure you want to leave this conversation?'
        }
        confirmLabel={confirmAction?.type === 'leave' ? 'Leave' : 'Confirm'}
        variant={confirmAction?.type === 'leave' ? 'danger' : 'warning'}
        onConfirm={() => {
          if (confirmAction?.type === 'remove') handleRemoveParticipant(confirmAction.userId);
          else if (confirmAction?.type === 'archive') handleArchive();
          else if (confirmAction?.type === 'leave') handleLeave();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
};

export default ConversationSettingsPanel;

import React, { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, alpha, useTheme } from '@mui/material';
import {
  Reply, ContentCopy, PushPin, Forward, Edit, Delete, TaskAlt,
  MoreVert,
} from '@mui/icons-material';
import { QUICK_REACTIONS } from './utils/chatHelpers';

const MessageActions = ({
  message,
  isOwnMessage,
  canSend,
  canDeleteAny,
  canCreateTask,
  isGroupAdmin,
  onReply,
  onReact,
  onPin,
  onForward,
  onEdit,
  onDelete,
  onCreateTask,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  if (message.isDeleted || message.type === 'system') return null;

  const canEdit = isOwnMessage && canSend && message.type === 'text';
  const canDeleteThis = (isOwnMessage && canSend) || canDeleteAny || isGroupAdmin;
  const showCreateTask = canCreateTask && message.type === 'text';

  return (
    <Box
      className="message-actions"
      sx={{
        position: 'absolute',
        top: -4,
        right: isOwnMessage ? undefined : 8,
        left: isOwnMessage ? 8 : undefined,
        display: 'none',
        alignItems: 'center',
        gap: 0,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.custom?.elevation?.card || '0 1px 3px rgba(0,0,0,0.08)',
        p: 0.25,
      }}
    >
      {/* Quick reactions */}
      {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
        <IconButton
          key={emoji}
          size="small"
          onClick={() => onReact(emoji)}
          sx={{ fontSize: '0.9rem', width: 28, height: 28 }}
        >
          {emoji}
        </IconButton>
      ))}

      {/* Reply */}
      <IconButton size="small" onClick={onReply} sx={{ width: 28, height: 28 }}>
        <Reply sx={{ fontSize: 16 }} />
      </IconButton>

      {/* More menu */}
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ width: 28, height: 28 }}
      >
        <MoreVert sx={{ fontSize: 16 }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2, boxShadow: theme.custom?.elevation?.dropdown } } }}
      >
        {/* All reactions */}
        <Box sx={{ display: 'flex', gap: 0.25, px: 1, py: 0.5 }}>
          {QUICK_REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => { onReact(emoji); setAnchorEl(null); }}
              sx={{ fontSize: '1.1rem', width: 32, height: 32, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => { onReply(); setAnchorEl(null); }}>
          <ListItemIcon><Reply fontSize="small" /></ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>

        {canSend && (
          <MenuItem onClick={() => { onPin(); setAnchorEl(null); }}>
            <ListItemIcon><PushPin fontSize="small" /></ListItemIcon>
            <ListItemText>{message.isPinned ? 'Unpin' : 'Pin'}</ListItemText>
          </MenuItem>
        )}

        {canSend && (
          <MenuItem onClick={() => { onForward(); setAnchorEl(null); }}>
            <ListItemIcon><Forward fontSize="small" /></ListItemIcon>
            <ListItemText>Forward</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(message.content?.text || '');
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Text</ListItemText>
        </MenuItem>

        {canEdit && (
          <MenuItem onClick={() => { onEdit(); setAnchorEl(null); }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {showCreateTask && (
          <MenuItem onClick={() => { onCreateTask(); setAnchorEl(null); }}>
            <ListItemIcon><TaskAlt fontSize="small" /></ListItemIcon>
            <ListItemText>Create Task</ListItemText>
          </MenuItem>
        )}

        {canDeleteThis && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={() => { onDelete(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
              <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default MessageActions;

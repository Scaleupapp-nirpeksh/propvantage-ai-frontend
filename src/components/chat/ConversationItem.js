import React from 'react';
import {
  Box, ListItemButton, Avatar, Typography, Badge, Chip, alpha, useTheme,
} from '@mui/material';
import { Group, Business } from '@mui/icons-material';
import { getConversationDisplayName, getOtherParticipant } from './utils/chatHelpers';
import { formatRelativeTime, truncateText } from '../../utils/formatters';

const ConversationItem = ({ conversation, currentUserId, isActive, isOnline, onClick }) => {
  const theme = useTheme();
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const other = getOtherParticipant(conversation, currentUserId);
  const unread = conversation.myUnreadCount || 0;
  const lastMsg = conversation.lastMessage;

  const getAvatarContent = () => {
    if (conversation.type === 'direct' && other?.user) {
      const initials = `${other.user.firstName?.[0] || ''}${other.user.lastName?.[0] || ''}`;
      return (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          invisible={!isOnline}
          sx={{ '& .MuiBadge-dot': { bgcolor: '#44b700', border: '2px solid white', width: 10, height: 10, borderRadius: '50%' } }}
        >
          <Avatar
            src={other.user.profileImage}
            sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', fontSize: '0.875rem' }}
          >
            {initials}
          </Avatar>
        </Badge>
      );
    }
    if (conversation.type === 'entity') {
      return (
        <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.info.main, 0.15), color: 'info.main' }}>
          <Business sx={{ fontSize: 22 }} />
        </Avatar>
      );
    }
    // group
    return (
      <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.secondary.main, 0.15), color: 'secondary.main' }}>
        <Group sx={{ fontSize: 22 }} />
      </Avatar>
    );
  };

  const getPreviewText = () => {
    if (!lastMsg) return 'No messages yet';
    const sender = lastMsg.senderName ? `${lastMsg.senderName.split(' ')[0]}: ` : '';
    const text = lastMsg.messageType === 'file'
      ? 'Sent an attachment'
      : lastMsg.messageType === 'system'
        ? lastMsg.text || 'System message'
        : lastMsg.text || '';
    return truncateText(`${sender}${text}`, 60);
  };

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1.5,
        gap: 1.5,
        borderRadius: 1,
        mx: 1,
        mb: 0.5,
        '&.Mui-selected': {
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
        },
      }}
    >
      {getAvatarContent()}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ fontWeight: unread > 0 ? 700 : 500, maxWidth: '70%' }}
          >
            {displayName}
          </Typography>
          {lastMsg?.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {formatRelativeTime(lastMsg.timestamp)}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontWeight: unread > 0 ? 600 : 400 }}
          >
            {getPreviewText()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {conversation.type === 'entity' && (
              <Chip
                label={conversation.entity?.entityType}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: 'info.main',
                }}
              />
            )}
            {unread > 0 && (
              <Box
                sx={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  px: 0.5,
                }}
              >
                {unread > 99 ? '99+' : unread}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ListItemButton>
  );
};

export default ConversationItem;

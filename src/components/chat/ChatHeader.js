import React from 'react';
import {
  Box, Typography, IconButton, Avatar, Badge, Chip, Tooltip, alpha, useTheme,
} from '@mui/material';
import {
  ArrowBack, Search, PushPin, Settings, Group, Business,
} from '@mui/icons-material';
import { getConversationDisplayName, getOtherParticipant } from './utils/chatHelpers';

const ChatHeader = ({
  conversation,
  currentUserId,
  isOnline,
  isMobile,
  onBack,
  onOpenSearch,
  onOpenPinned,
  onOpenSettings,
}) => {
  const theme = useTheme();
  if (!conversation) return null;

  const displayName = getConversationDisplayName(conversation, currentUserId);
  const other = getOtherParticipant(conversation, currentUserId);
  const activeParticipants = conversation.participants?.filter((p) => p.isActive !== false) || [];

  const getSubtitle = () => {
    if (conversation.type === 'direct') {
      return isOnline ? 'Online' : 'Offline';
    }
    if (conversation.type === 'entity') {
      return `${conversation.entity?.entityType} Chat • ${activeParticipants.length} members`;
    }
    return `${activeParticipants.length} members`;
  };

  const getAvatar = () => {
    if (conversation.type === 'direct' && other?.user) {
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
            sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', fontSize: '0.8rem' }}
          >
            {`${other.user.firstName?.[0] || ''}${other.user.lastName?.[0] || ''}`}
          </Avatar>
        </Badge>
      );
    }
    if (conversation.type === 'entity') {
      return (
        <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.info.main, 0.15), color: 'info.main' }}>
          <Business sx={{ fontSize: 20 }} />
        </Avatar>
      );
    }
    return (
      <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.secondary.main, 0.15), color: 'secondary.main' }}>
        <Group sx={{ fontSize: 20 }} />
      </Avatar>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {isMobile && (
        <IconButton size="small" onClick={onBack} sx={{ mr: -0.5 }}>
          <ArrowBack />
        </IconButton>
      )}

      {getAvatar()}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {displayName}
          </Typography>
          {conversation.type === 'entity' && (
            <Chip
              label={conversation.entity?.entityType}
              size="small"
              sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {getSubtitle()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Search messages">
          <IconButton size="small" onClick={onOpenSearch}>
            <Search sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Pinned messages">
          <IconButton size="small" onClick={onOpenPinned}>
            <PushPin sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        {conversation.type !== 'direct' && (
          <Tooltip title="Settings">
            <IconButton size="small" onClick={onOpenSettings}>
              <Settings sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ChatHeader;

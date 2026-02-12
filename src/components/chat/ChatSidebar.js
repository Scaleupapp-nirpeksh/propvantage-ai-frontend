import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, TextField, Tabs, Tab, IconButton, Typography, InputAdornment,
  Skeleton, alpha, useTheme,
} from '@mui/material';
import { Search, Add, Close } from '@mui/icons-material';
import ConversationItem from './ConversationItem';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const TYPE_TABS = [
  { label: 'All', value: null },
  { label: 'Direct', value: 'direct' },
  { label: 'Groups', value: 'group' },
  { label: 'Entity', value: 'entity' },
];

const ChatSidebar = ({ activeConversationId, onSelectConversation, onNewConversation }) => {
  const theme = useTheme();
  const { user, canAccess } = useAuth();
  const {
    conversations,
    conversationOrder,
    conversationsLoading,
    conversationsPagination,
    onlineUserIds,
    loadMoreConversations,
  } = useChat();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);

  const filteredOrder = useMemo(() => {
    return conversationOrder.filter((id) => {
      const conv = conversations[id];
      if (!conv) return false;
      if (typeFilter && conv.type !== typeFilter) return false;
      if (search) {
        const name = conv.name || '';
        const entityLabel = conv.entity?.displayLabel || '';
        const otherName = conv.participants
          ?.filter((p) => p.user?._id !== user?._id)
          .map((p) => `${p.user?.firstName || ''} ${p.user?.lastName || ''}`)
          .join(' ') || '';
        const haystack = `${name} ${entityLabel} ${otherName}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [conversationOrder, conversations, typeFilter, search, user?._id]);

  const isUserOnline = useCallback(
    (conv) => {
      if (conv.type !== 'direct') return false;
      const other = conv.participants?.find((p) => p.user?._id !== user?._id && p.isActive !== false);
      return other ? onlineUserIds.includes(other.user?._id) : false;
    },
    [onlineUserIds, user?._id]
  );

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 350 },
        flexShrink: 0,
        borderRight: { md: `1px solid ${theme.palette.divider}` },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>
            Chat
          </Typography>
          {canAccess.chatSend() && (
            <IconButton
              size="small"
              onClick={onNewConversation}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              <Add sx={{ fontSize: 20, color: 'primary.main' }} />
            </IconButton>
          )}
        </Box>

        {/* Search */}
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
            },
          }}
        />
      </Box>

      {/* Type tabs */}
      <Tabs
        value={typeFilter || 'all'}
        onChange={(_, v) => setTypeFilter(v === 'all' ? null : v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 36,
          px: 1,
          '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontSize: '0.8rem', minWidth: 'auto' },
        }}
      >
        {TYPE_TABS.map((tab) => (
          <Tab key={tab.value || 'all'} label={tab.label} value={tab.value || 'all'} />
        ))}
      </Tabs>

      {/* Conversation list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.grey[500], 0.2), borderRadius: 2 },
        }}
      >
        {conversationsLoading && filteredOrder.length === 0 ? (
          [...Array(5)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5, mx: 1 }}>
              <Skeleton variant="circular" width={44} height={44} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="80%" height={16} />
              </Box>
            </Box>
          ))
        ) : filteredOrder.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 2 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {search ? 'No conversations match your search' : 'No conversations yet'}
            </Typography>
          </Box>
        ) : (
          filteredOrder.map((id) => {
            const conv = conversations[id];
            if (!conv) return null;
            return (
              <ConversationItem
                key={id}
                conversation={conv}
                currentUserId={user?._id}
                isActive={id === activeConversationId}
                isOnline={isUserOnline(conv)}
                onClick={() => onSelectConversation(id)}
              />
            );
          })
        )}

        {/* Load more */}
        {conversationsPagination.hasMore && !conversationsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Typography
              variant="caption"
              color="primary"
              onClick={loadMoreConversations}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Load more
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatSidebar;

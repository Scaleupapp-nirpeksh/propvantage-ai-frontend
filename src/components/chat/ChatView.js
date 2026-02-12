import React, { useState, useEffect, useCallback } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { getTypingText } from './utils/chatHelpers';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const ChatView = ({
  conversationId,
  onBack,
  onOpenSearch,
  onOpenPinned,
  onOpenSettings,
  onForwardMessage,
  onCreateTaskFromMessage,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, checkPerm } = useAuth();
  const {
    conversations,
    messages,
    messagesPagination,
    messagesLoading,
    onlineUserIds,
    typingUsers,
    loadMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePin,
    handleTypingStart,
    handleTypingStop,
    markConversationRead,
  } = useChat();

  const [replyTo, setReplyTo] = useState(null);

  const conversation = conversations[conversationId];
  const convMessages = messages[conversationId] || [];
  const convPagination = messagesPagination[conversationId] || {};
  const convLoading = messagesLoading[conversationId] || false;
  const typingText = getTypingText(typingUsers[conversationId]);

  const canSend = checkPerm ? checkPerm('chat:send') : true;
  const canDeleteAny = checkPerm ? checkPerm('chat:delete_any') : false;
  const canCreateTask = checkPerm ? checkPerm('tasks:create') : false;

  const isGroupAdmin = conversation?.participants?.some(
    (p) => p.user?._id === user?._id && p.role === 'admin'
  ) || false;

  const isOnline = (() => {
    if (conversation?.type !== 'direct') return false;
    const other = conversation?.participants?.find(
      (p) => p.user?._id !== user?._id && p.isActive !== false
    );
    return other ? onlineUserIds.includes(other.user?._id) : false;
  })();

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markConversationRead(conversationId);
    }
    setReplyTo(null);
  }, [conversationId, loadMessages, markConversationRead]);

  const handleSend = useCallback(
    (data) => {
      if (conversationId) {
        sendMessage(conversationId, data);
      }
    },
    [conversationId, sendMessage]
  );

  const handleEdit = useCallback(
    (messageId, text) => {
      editMessage(messageId, text);
    },
    [editMessage]
  );

  const handleDelete = useCallback(
    (messageId) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  const handleReact = useCallback(
    (messageId, emoji) => {
      toggleReaction(messageId, emoji);
    },
    [toggleReaction]
  );

  const handlePin = useCallback(
    (messageId) => {
      togglePin(messageId);
    },
    [togglePin]
  );

  if (!conversation) return null;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        bgcolor: 'background.default',
      }}
    >
      <ChatHeader
        conversation={conversation}
        currentUserId={user?._id}
        isOnline={isOnline}
        isMobile={isMobile}
        onBack={onBack}
        onOpenSearch={onOpenSearch}
        onOpenPinned={onOpenPinned}
        onOpenSettings={onOpenSettings}
      />

      <MessageList
        messages={convMessages}
        hasMore={convPagination.hasMore}
        loading={convLoading}
        currentUserId={user?._id}
        canSend={canSend}
        canDeleteAny={canDeleteAny}
        canCreateTask={canCreateTask}
        isGroupAdmin={isGroupAdmin}
        conversationType={conversation.type}
        onLoadOlder={() => loadOlderMessages(conversationId)}
        onReply={(msg) => setReplyTo(msg)}
        onReact={handleReact}
        onPin={handlePin}
        onForward={(msg) => onForwardMessage?.(msg)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateTask={(msg) => onCreateTaskFromMessage?.(msg)}
      />

      <TypingIndicator text={typingText} />

      <MessageInput
        conversationId={conversationId}
        participants={conversation.participants}
        replyTo={replyTo}
        onSend={handleSend}
        onCancelReply={() => setReplyTo(null)}
        onTypingStart={() => handleTypingStart(conversationId)}
        onTypingStop={() => handleTypingStop(conversationId)}
        disabled={!canSend}
      />
    </Box>
  );
};

export default ChatView;

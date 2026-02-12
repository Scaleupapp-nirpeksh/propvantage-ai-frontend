import React, { useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, alpha, useTheme } from '@mui/material';
import MessageBubble from './MessageBubble';
import { messagesWithDateSeparators } from './utils/chatHelpers';

const MessageList = ({
  messages,
  hasMore,
  loading,
  currentUserId,
  canSend,
  canDeleteAny,
  canCreateTask,
  isGroupAdmin,
  conversationType,
  onLoadOlder,
  onReply,
  onReact,
  onPin,
  onForward,
  onEdit,
  onDelete,
  onCreateTask,
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isLoadingOlderRef = useRef(false);
  const sentinelRef = useRef(null);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // If we were loading older messages, preserve scroll position
    if (isLoadingOlderRef.current) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      isLoadingOlderRef.current = false;
      return;
    }

    // Auto-scroll to bottom if user is near bottom (within 200px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages?.length && !loading) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // IntersectionObserver for load-older trigger
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const container = containerRef.current;
          if (container) {
            prevScrollHeightRef.current = container.scrollHeight;
            isLoadingOlderRef.current = true;
          }
          onLoadOlder();
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadOlder]);

  const itemsWithSeparators = messagesWithDateSeparators(messages || []);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: alpha(theme.palette.grey[500], 0.2),
          borderRadius: 3,
        },
      }}
    >
      {/* Load older sentinel */}
      {hasMore && (
        <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          {loading && <CircularProgress size={24} />}
        </Box>
      )}

      {/* Messages */}
      {itemsWithSeparators.map((item, idx) => {
        if (item._type === 'date_separator') {
          return (
            <Box key={item._id} sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  bgcolor: alpha(theme.palette.grey[500], 0.08),
                  px: 2,
                  py: 0.5,
                  borderRadius: 3,
                  fontWeight: 500,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        }

        const msg = item;
        const prevMsg = idx > 0 ? itemsWithSeparators[idx - 1] : null;
        const prevMessage = prevMsg && !prevMsg._type ? prevMsg : null;
        const isOwn = msg.sender?._id === currentUserId;

        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            previousMessage={prevMessage}
            currentUserId={currentUserId}
            isOwnMessage={isOwn}
            canSend={canSend}
            canDeleteAny={canDeleteAny}
            canCreateTask={canCreateTask}
            isGroupAdmin={isGroupAdmin}
            conversationType={conversationType}
            onReply={onReply}
            onReact={onReact}
            onPin={onPin}
            onForward={onForward}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateTask={onCreateTask}
          />
        );
      })}

      {/* Empty state */}
      {(!messages || messages.length === 0) && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography variant="body2" color="text.secondary">
            No messages yet. Start the conversation!
          </Typography>
        </Box>
      )}

      {/* Initial loading */}
      {loading && (!messages || messages.length === 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;

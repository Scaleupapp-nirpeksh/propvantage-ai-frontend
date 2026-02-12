import React, { useState } from 'react';
import {
  Box, Typography, Avatar, Chip, TextField, alpha, useTheme,
} from '@mui/material';
import {
  PushPin, InsertDriveFile,
  Block, Forward as ForwardIcon, CheckCircle, DoneAll,
} from '@mui/icons-material';
import ReactionBar from './ReactionBar';
import MessageActions from './MessageActions';
import { getSystemMessageText, shouldShowSenderInfo } from './utils/chatHelpers';
import { formatTime, formatFileSize } from '../../utils/formatters';

// ─── System Message ────────────────────────────────────────────────────────

const SystemMessage = ({ message }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
        px: 2,
        py: 0.5,
        borderRadius: 3,
        fontStyle: 'italic',
      }}
    >
      {getSystemMessageText(message)}
    </Typography>
  </Box>
);

// ─── Deleted Message ───────────────────────────────────────────────────────

const DeletedMessage = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
    <Block sx={{ fontSize: 14, color: 'text.disabled' }} />
    <Typography variant="body2" color="text.disabled" fontStyle="italic">
      This message was deleted
    </Typography>
  </Box>
);

// ─── File Attachment Card ──────────────────────────────────────────────────

const FileAttachment = ({ attachment }) => {
  const theme = useTheme();
  const isImage = attachment.mimeType?.startsWith('image/');

  if (isImage) {
    return (
      <Box
        component="a"
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'block', borderRadius: 1.5, overflow: 'hidden', mt: 0.5, maxWidth: 300 }}
      >
        <Box
          component="img"
          src={attachment.url}
          alt={attachment.fileName}
          sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="a"
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        mt: 0.5,
        borderRadius: 1.5,
        bgcolor: alpha(theme.palette.grey[500], 0.06),
        border: `1px solid ${theme.palette.divider}`,
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.1) },
      }}
    >
      <InsertDriveFile sx={{ fontSize: 28, color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {attachment.fileName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatFileSize(attachment.fileSize)}
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Entity Reference Card ─────────────────────────────────────────────────

const EntityReferenceCard = ({ entityRef }) => {
  const theme = useTheme();
  if (!entityRef) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        mt: 0.5,
        borderRadius: 1.5,
        bgcolor: alpha(theme.palette.info.main, 0.04),
        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Chip
          label={entityRef.entityType}
          size="small"
          sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}
        />
        <Typography variant="subtitle2" noWrap>
          {entityRef.displayLabel}
        </Typography>
      </Box>
      {entityRef.metadata && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(entityRef.metadata).map(([key, value]) => (
            <Typography key={key} variant="caption" color="text.secondary">
              <strong>{key}:</strong> {String(value)}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ─── Reply Preview ─────────────────────────────────────────────────────────

const ReplyPreview = ({ replyTo }) => {
  const theme = useTheme();
  if (!replyTo) return null;

  return (
    <Box
      sx={{
        pl: 1.5,
        py: 0.5,
        mb: 0.5,
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        borderRadius: '0 4px 4px 0',
      }}
    >
      <Typography variant="caption" fontWeight={600} color="primary.main">
        {replyTo.senderName}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>
        {replyTo.text}
      </Typography>
    </Box>
  );
};

// ─── Main MessageBubble ────────────────────────────────────────────────────

const MessageBubble = ({
  message,
  previousMessage,
  currentUserId,
  isOwnMessage,
  canSend,
  canDeleteAny,
  canCreateTask,
  isGroupAdmin,
  conversationType,
  onReply,
  onReact,
  onPin,
  onForward,
  onEdit,
  onDelete,
  onCreateTask,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // System messages
  if (message.type === 'system') {
    return <SystemMessage message={message} />;
  }

  // Deleted messages
  if (message.isDeleted || message._isDeletedPlaceholder) {
    return (
      <Box sx={{ display: 'flex', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', px: 2, py: 0.25 }}>
        <DeletedMessage />
      </Box>
    );
  }

  const showSender = !isOwnMessage && conversationType !== 'direct' && shouldShowSenderInfo(message, previousMessage);
  const sender = message.sender;

  const handleEditSave = () => {
    if (editText.trim() && editText.trim() !== message.content?.text) {
      onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        px: 2,
        py: 0.25,
        '&:hover .message-actions': { display: 'flex' },
      }}
    >
      {/* Avatar */}
      {!isOwnMessage && (
        <Box sx={{ width: 32, flexShrink: 0 }}>
          {showSender && sender && (
            <Avatar
              src={sender.profileImage}
              sx={{ width: 32, height: 32, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}
            >
              {`${sender.firstName?.[0] || ''}${sender.lastName?.[0] || ''}`}
            </Avatar>
          )}
        </Box>
      )}

      {/* Bubble */}
      <Box sx={{ maxWidth: '70%', position: 'relative' }}>
        {/* Forwarded label */}
        {message.forwardedFrom && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <ForwardIcon sx={{ fontSize: 12 }} /> Forwarded from {message.forwardedFrom.senderName}
          </Typography>
        )}

        {/* Sender name */}
        {showSender && sender && (
          <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ mb: 0.25, display: 'block' }}>
            {sender.firstName} {sender.lastName}
          </Typography>
        )}

        <Box
          sx={{
            bgcolor: isOwnMessage
              ? theme.palette.primary.main
              : alpha(theme.palette.grey[500], 0.08),
            color: isOwnMessage ? 'white' : 'text.primary',
            borderRadius: isOwnMessage ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
            px: 1.5,
            py: 1,
            position: 'relative',
            ...(message._failed && {
              opacity: 0.6,
              border: `1px dashed ${theme.palette.error.main}`,
            }),
          }}
        >
          {/* Reply preview */}
          <ReplyPreview replyTo={message.replyTo} />

          {/* Content */}
          {isEditing ? (
            <TextField
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleEditSave}
              autoFocus
              multiline
              maxRows={6}
              fullWidth
              size="small"
              variant="standard"
              sx={{ '& .MuiInput-root': { color: isOwnMessage ? 'white' : 'text.primary' } }}
            />
          ) : (
            <>
              {message.content?.text && (
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    '& .mention': { fontWeight: 600, color: isOwnMessage ? 'white' : 'primary.main' },
                  }}
                >
                  {message.content.text}
                </Typography>
              )}
            </>
          )}

          {/* Attachments */}
          {message.attachments?.map((att, i) => (
            <FileAttachment key={i} attachment={att} />
          ))}

          {/* Entity reference */}
          {message.entityReference && (
            <EntityReferenceCard entityRef={message.entityReference} />
          )}

          {/* Timestamp + indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
            {message.isPinned && <PushPin sx={{ fontSize: 12, color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary' }} />}
            {message.isEdited && (
              <Typography variant="caption" sx={{ fontSize: '0.625rem', color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                (edited)
              </Typography>
            )}
            <Typography variant="caption" sx={{ fontSize: '0.625rem', color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
              {formatTime(message.createdAt)}
            </Typography>
            {isOwnMessage && message._isOptimistic && (
              <CheckCircle sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
            )}
            {isOwnMessage && !message._isOptimistic && !message._failed && (
              <DoneAll sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }} />
            )}
          </Box>

          {message._failed && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.25, fontSize: '0.625rem' }}>
              Failed to send
            </Typography>
          )}
        </Box>

        {/* Reactions */}
        <ReactionBar
          reactions={message.reactions}
          currentUserId={currentUserId}
          onToggleReaction={(emoji) => onReact(message._id, emoji)}
          disabled={!canSend}
        />

        {/* Actions (hover) */}
        <MessageActions
          message={message}
          isOwnMessage={isOwnMessage}
          canSend={canSend}
          canDeleteAny={canDeleteAny}
          canCreateTask={canCreateTask}
          isGroupAdmin={isGroupAdmin}
          onReply={() => onReply(message)}
          onReact={(emoji) => onReact(message._id, emoji)}
          onPin={() => onPin(message._id)}
          onForward={() => onForward(message)}
          onEdit={() => { setEditText(message.content?.text || ''); setIsEditing(true); }}
          onDelete={() => onDelete(message._id)}
          onCreateTask={() => onCreateTask(message)}
        />
      </Box>
    </Box>
  );
};

export default MessageBubble;

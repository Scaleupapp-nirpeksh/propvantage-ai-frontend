import React, { useState, useRef, useCallback } from 'react';
import {
  Box, TextField, IconButton, Typography, Chip, Paper, Popper,
  List, ListItemButton, ListItemAvatar, Avatar, ListItemText,
  alpha, useTheme,
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { parseMentions } from './utils/chatHelpers';

const MessageInput = ({
  conversationId,
  participants,
  replyTo,
  onSend,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  disabled,
}) => {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [mentionAnchor, setMentionAnchor] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef(null);

  // ─── Mention logic ────────────────────────────────────────────────
  const filteredParticipants = (participants || []).filter((p) => {
    if (!p.user || !p.isActive) return false;
    if (!mentionQuery) return true;
    const name = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    return name.includes(mentionQuery.toLowerCase());
  }).slice(0, 6);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Typing events
    if (val.length > 0) {
      onTypingStart?.();
    } else {
      onTypingStop?.();
    }

    // Mention detection
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex >= 0) {
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only show if no space after text started (or it's just the @)
      if (!afterAt.includes('\n') && afterAt.length < 30) {
        setMentionQuery(afterAt);
        setMentionStart(lastAtIndex);
        setMentionAnchor(inputRef.current);
        return;
      }
    }
    setMentionAnchor(null);
  };

  const handleMentionSelect = (participant) => {
    const fullName = `${participant.user.firstName} ${participant.user.lastName}`;
    const before = text.substring(0, mentionStart);
    const after = text.substring(mentionStart + 1 + mentionQuery.length);
    setText(`${before}@${fullName} ${after}`);
    setMentionAnchor(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !replyTo) return;

    const mentions = parseMentions(trimmed, participants);
    const data = {
      text: trimmed || undefined,
      mentions: mentions.length ? mentions : undefined,
      replyTo: replyTo?._id || undefined,
      _replyToPreview: replyTo ? {
        message: replyTo._id,
        text: replyTo.content?.text?.substring(0, 200) || '',
        senderName: replyTo.sender ? `${replyTo.sender.firstName} ${replyTo.sender.lastName}` : '',
      } : undefined,
    };

    onSend(data);
    setText('');
    onTypingStop?.();
    onCancelReply?.();
  }, [text, replyTo, participants, onSend, onTypingStop, onCancelReply]);

  return (
    <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
      {/* Reply preview */}
      {replyTo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Box
            sx={{
              width: 3,
              height: 32,
              borderRadius: 1,
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} color="primary.main">
              Replying to {replyTo.sender?.firstName} {replyTo.sender?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {replyTo.content?.text || 'Attachment'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* Input area */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, px: 2, py: 1.5 }}>
        <TextField
          inputRef={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'You cannot send messages' : 'Type a message...'}
          disabled={disabled}
          multiline
          maxRows={5}
          fullWidth
          size="small"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !replyTo)}
          color="primary"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            '&.Mui-disabled': { bgcolor: 'transparent' },
          }}
        >
          <Send sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Mention dropdown */}
      <Popper
        open={Boolean(mentionAnchor) && filteredParticipants.length > 0}
        anchorEl={mentionAnchor}
        placement="top-start"
        sx={{ zIndex: 1300 }}
      >
        <Paper
          elevation={8}
          sx={{ maxHeight: 200, overflow: 'auto', borderRadius: 2, minWidth: 220 }}
        >
          <List dense disablePadding>
            {filteredParticipants.map((p) => (
              <ListItemButton
                key={p.user._id}
                onClick={() => handleMentionSelect(p)}
                sx={{ py: 0.75 }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <Avatar
                    src={p.user.profileImage}
                    sx={{ width: 28, height: 28, fontSize: '0.65rem' }}
                  >
                    {`${p.user.firstName?.[0] || ''}${p.user.lastName?.[0] || ''}`}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${p.user.firstName} ${p.user.lastName}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                />
                {p.role === 'admin' && (
                  <Chip label="Admin" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                )}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
};

export default MessageInput;

import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Avatar, alpha, useTheme,
  Popper, Paper, List, ListItemButton, ListItemAvatar, ListItemText, CircularProgress,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { tasksAPI, userAPI } from '../../services/api';
import { formatRelativeTime, formatName } from '../../utils/formatters';

const CommentSection = ({ taskId, comments: initialComments = [], canComment = true }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialComments.length >= 10);
  const [loadingMore, setLoadingMore] = useState(false);

  // @mention state
  const [mentionAnchor, setMentionAnchor] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const inputRef = useRef(null);

  // Fetch users for @mention
  useEffect(() => {
    if (!mentionQuery) {
      setMentionUsers([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setMentionLoading(true);
      try {
        const res = await userAPI.getUsers({ search: mentionQuery, limit: 5 });
        if (!cancelled) {
          const users = res.data?.data?.users || res.data?.data || res.data || [];
          setMentionUsers(Array.isArray(users) ? users : []);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setMentionLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mentionQuery]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionAnchor(inputRef.current);
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionAnchor(null);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (user) => {
    const cursorPos = inputRef.current?.selectionStart || text.length;
    const textBefore = text.slice(0, cursorPos);
    const textAfter = text.slice(cursorPos);
    const name = formatName(user.firstName, user.lastName, { format: 'full' });
    const newText = textBefore.replace(/@\w*$/, `@${name} `) + textAfter;
    setText(newText);
    setMentionAnchor(null);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;

    const mentionRegex = /@([\w\s]+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1].trim());
    }

    setSubmitting(true);
    try {
      const res = await tasksAPI.addComment(taskId, { text: text.trim(), mentions });
      const newComment = res.data?.data?.comment || res.data?.comment || res.data?.data || {};
      setComments((prev) => [newComment, ...prev]);
      setText('');
    } catch {
      enqueueSnackbar('Failed to add comment', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await tasksAPI.getComments(taskId, { page: nextPage, limit: 10 });
      const moreComments = res.data?.data?.comments || res.data?.data || [];
      if (moreComments.length < 10) setHasMore(false);
      setComments((prev) => [...prev, ...moreComments]);
      setPage(nextPage);
    } catch {
      enqueueSnackbar('Failed to load comments', { variant: 'error' });
    } finally {
      setLoadingMore(false);
    }
  };

  const getInitials = (comment) => {
    const fn = comment.userId?.firstName || comment.user?.firstName || '';
    const ln = comment.userId?.lastName || comment.user?.lastName || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?';
  };

  const getCommentName = (comment) => {
    const user = comment.userId || comment.user || {};
    return formatName(user.firstName, user.lastName, { format: 'full' });
  };

  return (
    <Box>
      {/* Comment input */}
      {canComment && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
          <TextField
            inputRef={inputRef}
            placeholder="Add a comment... (use @ to mention)"
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !mentionAnchor) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            fullWidth
            size="small"
            multiline
            maxRows={4}
            disabled={submitting}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            sx={{ minWidth: 40, px: 1.5, alignSelf: 'flex-end' }}
          >
            <Send sx={{ fontSize: 18 }} />
          </Button>
        </Box>
      )}

      {/* @mention dropdown */}
      <Popper open={Boolean(mentionAnchor) && (mentionUsers.length > 0 || mentionLoading)} anchorEl={mentionAnchor} placement="top-start" sx={{ zIndex: 1300 }}>
        <Paper elevation={4} sx={{ width: 240, maxHeight: 200, overflow: 'auto', borderRadius: 2 }}>
          {mentionLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <List dense disablePadding>
              {mentionUsers.map((user) => {
                const id = user._id || user.id;
                return (
                  <ListItemButton key={id} onClick={() => handleMentionSelect(user)} sx={{ py: 0.75 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        {`${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={formatName(user.firstName, user.lastName, { format: 'full' })}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Paper>
      </Popper>

      {/* Comments list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {comments.map((comment, idx) => (
          <Box key={comment._id || idx} sx={{ display: 'flex', gap: 1.5 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mt: 0.25 }}>
              {getInitials(comment)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography variant="body2" fontWeight={600}>
                  {getCommentName(comment)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(comment.createdAt)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {comment.text}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Load more */}
      {hasMore && comments.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button size="small" onClick={handleLoadMore} disabled={loadingMore} sx={{ textTransform: 'none' }}>
            {loadingMore ? 'Loading...' : 'Load older comments'}
          </Button>
        </Box>
      )}

      {comments.length === 0 && (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
          No comments yet
        </Typography>
      )}
    </Box>
  );
};

export default CommentSection;

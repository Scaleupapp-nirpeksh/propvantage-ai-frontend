import React from 'react';
import { Box, Typography, IconButton, alpha, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../../constants/notificationConfig';
import { formatRelativeTime, formatName } from '../../utils/formatters';

const NotificationItem = ({ notification, onMarkRead, onDelete, compact = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const typeConfig = NOTIFICATION_TYPES[notification.type] || {};
  const priorityConfig = NOTIFICATION_PRIORITY[notification.priority] || NOTIFICATION_PRIORITY.medium;
  const TypeIcon = typeConfig.icon;

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(notification._id);
  };

  const actorName = notification.actor
    ? formatName(notification.actor.firstName, notification.actor.lastName, { format: 'full' })
    : null;

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: compact ? 1.5 : 2,
        cursor: 'pointer',
        bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.03),
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: 'background-color 150ms ease',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        },
        '&:last-child': { borderBottom: 'none' },
        position: 'relative',
      }}
    >
      {/* Priority dot */}
      <Box sx={{ pt: 0.75, flexShrink: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: notification.isRead ? theme.palette.grey[300] : priorityConfig.color,
          }}
        />
      </Box>

      {/* Icon */}
      {TypeIcon && (
        <Box sx={{ pt: 0.25, flexShrink: 0 }}>
          <TypeIcon sx={{ fontSize: 20, color: typeConfig.color || theme.palette.grey[500] }} />
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: notification.isRead ? 400 : 600,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              ...(compact ? { whiteSpace: 'nowrap' } : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }),
            }}
          >
            {notification.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            {formatRelativeTime(notification.createdAt)}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: compact ? 1 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.25,
          }}
        >
          {notification.message}
        </Typography>

        {!compact && actorName && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            by {actorName}
          </Typography>
        )}
      </Box>

      {/* Delete button */}
      {onDelete && (
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{
            position: 'absolute',
            top: compact ? 4 : 8,
            right: compact ? 4 : 8,
            opacity: 0,
            transition: 'opacity 150ms',
            '.MuiBox-root:hover > &': { opacity: 1 },
            '&:hover': { opacity: 1 },
          }}
        >
          <Close sx={{ fontSize: 14 }} />
        </IconButton>
      )}
    </Box>
  );
};

export default NotificationItem;

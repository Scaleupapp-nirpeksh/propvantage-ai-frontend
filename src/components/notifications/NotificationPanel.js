import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Popover, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { DoneAll, NotificationsNone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { notificationsAPI } from '../../services/api';
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ anchorEl, open, onClose, onCountChange }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getNotifications({ isRead: 'false', limit: 7 });
      const data = res.data?.data || res.data || {};
      setNotifications(data.notifications || []);
    } catch {
      // silent — panel is supplementary
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (onCountChange) onCountChange();
    } catch {
      // silent
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (onCountChange) onCountChange();
    } catch {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications([]);
      if (onCountChange) onCountChange();
      enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' });
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100vw' : 400,
            maxHeight: 480,
            borderRadius: isMobile ? 0 : 2,
            mt: 0.5,
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
        {notifications.length > 0 && (
          <Button
            size="small"
            startIcon={<DoneAll sx={{ fontSize: 16 }} />}
            onClick={handleMarkAllRead}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <NotificationsNone sx={{ fontSize: 40, color: theme.palette.grey[400], mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No new notifications</Typography>
            <Typography variant="caption" color="text.secondary">You're all caught up!</Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              compact
            />
          ))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
          py: 1,
        }}
      >
        <Button
          size="small"
          onClick={handleViewAll}
          sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'primary.main' }}
        >
          View all notifications
        </Button>
      </Box>
    </Popover>
  );
};

export default NotificationPanel;

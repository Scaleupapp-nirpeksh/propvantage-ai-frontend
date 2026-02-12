import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select,
  MenuItem, Button, Pagination, useTheme,
} from '@mui/material';
import { DoneAll, NotificationsNone } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { notificationsAPI } from '../../services/api';
import { PageHeader, EmptyState } from '../../components/common';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import NotificationItem from '../../components/notifications/NotificationItem';
import { NOTIFICATION_TYPES } from '../../constants/notificationConfig';

const PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low'];

const NotificationsPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters from URL
  const readFilter = searchParams.get('isRead') || ''; // '' = all, 'false' = unread, 'true' = read
  const typeFilter = searchParams.get('type') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const page = Number(searchParams.get('page')) || 1;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (readFilter) params.isRead = readFilter;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await notificationsAPI.getNotifications(params);
      const data = res.data?.data || res.data || {};
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
    } catch {
      enqueueSnackbar('Failed to load notifications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, readFilter, typeFilter, priorityFilter, enqueueSnackbar]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data?.data?.count ?? res.data?.count ?? 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      enqueueSnackbar('Failed to mark as read', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const n = notifications.find((x) => x._id === id);
      await notificationsAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((x) => x._id !== id));
      if (n && !n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' });
    }
  };

  const handlePageChange = (_, p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Notifications" loading />
        <CardGridSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAll />}
              onClick={handleMarkAllRead}
              sx={{ textTransform: 'none' }}
            >
              Mark all as read
            </Button>
          )
        }
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={readFilter}
          exclusive
          onChange={(_, v) => setFilter('isRead', v || '')}
          size="small"
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="false">Unread</ToggleButton>
          <ToggleButton value="true">Read</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setFilter('type', e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.entries(NOTIFICATION_TYPES).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={priorityFilter}
            label="Priority"
            onChange={(e) => setFilter('priority', e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {PRIORITY_OPTIONS.map((p) => (
              <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={NotificationsNone}
          title="No notifications"
          description={readFilter === 'false' ? "You're all caught up!" : 'No notifications match your filters.'}
        />
      ) : (
        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
          {notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default NotificationsPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';
import NotificationPanel from './NotificationPanel';

const POLL_INTERVAL = 30000; // 30 seconds

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const intervalRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      const c = res.data?.data?.count ?? res.data?.count ?? 0;
      setCount(c);
    } catch {
      // silent — polling is background
    }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchCount]);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton size="small" onClick={handleOpen}>
          <Badge
            badgeContent={count}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 18,
                minWidth: 18,
              },
            }}
          >
            <Notifications sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <NotificationPanel
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onCountChange={fetchCount}
      />
    </>
  );
};

export default NotificationBell;

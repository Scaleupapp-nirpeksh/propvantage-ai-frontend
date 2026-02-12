import React, { useState } from 'react';
import { Box, Typography, Popover, MenuItem, TextField, Button, useTheme } from '@mui/material';
import { StatusChip } from '../common';
import { STATUS_TRANSITIONS } from '../../constants/taskConfig';
import { TASK_STATUS } from '../../constants/statusConfig';

const StatusTransitionMenu = ({ currentStatus, onStatusChange, size = 'small', disabled = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [resolution, setResolution] = useState('');
  const [showResolution, setShowResolution] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled && validTransitions.length > 0) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowResolution(false);
    setResolution('');
    setPendingStatus(null);
  };

  const handleSelect = (status) => {
    if (status === 'Completed') {
      setPendingStatus(status);
      setShowResolution(true);
      return;
    }
    onStatusChange(status, {});
    handleClose();
  };

  const handleConfirmComplete = () => {
    onStatusChange(pendingStatus, { resolution: resolution.trim() || undefined });
    handleClose();
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{ cursor: disabled ? 'default' : 'pointer', display: 'inline-flex' }}
      >
        <StatusChip
          status={currentStatus}
          type="task"
          size={size}
          sx={!disabled ? {
            '&:hover': { opacity: 0.85, boxShadow: theme.shadows[1] },
            transition: 'all 0.15s ease',
          } : {}}
        />
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: 2 } } }}
      >
        {!showResolution ? (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
              Move to
            </Typography>
            {validTransitions.map((status) => {
              const config = TASK_STATUS[status] || {};
              const colorKey = config.color === 'default' ? 'grey' : (config.color || 'grey');
              const dotColor = theme.palette[colorKey]?.main || theme.palette.grey[500];
              return (
                <MenuItem key={status} onClick={() => handleSelect(status)} sx={{ gap: 1.5, py: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                  <Typography variant="body2">{config.label || status}</Typography>
                </MenuItem>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ p: 2, width: 280 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Complete Task
            </Typography>
            <TextField
              placeholder="Resolution notes (optional)"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleClose}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleConfirmComplete}>
                Complete
              </Button>
            </Box>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default StatusTransitionMenu;

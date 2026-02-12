import React, { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, alpha, useTheme } from '@mui/material';
import { Add, ChevronRight, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatusTransitionMenu from './StatusTransitionMenu';
import { formatDate } from '../../utils/formatters';

const SubTaskList = ({ subTasks = [], parentTaskId, onAddSubTask, onStatusChange, canCreate = false, canUpdate = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddSubTask({ title: newTitle.trim() });
      setNewTitle('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Sub-Tasks ({subTasks.length})
        </Typography>
      </Box>

      {subTasks.length === 0 && !showForm && (
        <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
          No sub-tasks
        </Typography>
      )}

      {/* Sub-task rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {subTasks.map((sub) => {
          const id = sub._id || sub.id;
          return (
            <Box
              key={id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
              }}
              onClick={() => navigate(`/tasks/${id}`)}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 60 }}>
                {sub.displayId || sub.taskNumber}
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {sub.title}
              </Typography>
              <Box onClick={(e) => e.stopPropagation()}>
                <StatusTransitionMenu
                  currentStatus={sub.status}
                  onStatusChange={(status, data) => onStatusChange && onStatusChange(id, status, data)}
                  size="small"
                  disabled={!canUpdate}
                />
              </Box>
              {sub.dueDate && (
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                  {formatDate(sub.dueDate, { format: 'medium' })}
                </Typography>
              )}
              <ChevronRight sx={{ fontSize: 16, color: 'text.disabled' }} />
            </Box>
          );
        })}
      </Box>

      {/* Inline add form */}
      {showForm && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            autoFocus
            placeholder="Sub-task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setShowForm(false); setNewTitle(''); }
            }}
            fullWidth
            size="small"
            disabled={submitting}
          />
          <Button size="small" variant="contained" onClick={handleAdd} disabled={!newTitle.trim() || submitting}>
            Add
          </Button>
          <IconButton size="small" onClick={() => { setShowForm(false); setNewTitle(''); }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      {/* Add button */}
      {canCreate && !showForm && (
        <Button
          size="small"
          startIcon={<Add sx={{ fontSize: 16 }} />}
          onClick={() => setShowForm(true)}
          sx={{ mt: 1, textTransform: 'none', color: 'text.secondary' }}
        >
          Add Sub-Task
        </Button>
      )}
    </Box>
  );
};

export default SubTaskList;

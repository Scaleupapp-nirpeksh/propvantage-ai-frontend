import React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress, Avatar, alpha, useTheme } from '@mui/material';
import { CalendarToday, SmartToy, Link as LinkIcon, ReportProblem, Repeat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '../common';
import { PRIORITY_COLORS, ENTITY_ROUTE_MAP, ESCALATION_COLORS } from '../../constants/taskConfig';
import { formatRelativeTime, formatName } from '../../utils/formatters';

const TaskCard = ({ task, onClick, onStatusChange, compact = false, showAssignee = true }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const priorityColor = PRIORITY_COLORS[task.priority] || theme.palette.grey[400];
  const isOverdue = task.isOverdue || task.overdueDays > 0;
  const isDueToday = task.daysUntilDue === 0 && !isOverdue;

  const getDueDateColor = () => {
    if (isOverdue) return theme.palette.error.main;
    if (isDueToday) return theme.palette.warning.main;
    return theme.palette.text.secondary;
  };

  const getDueDateText = () => {
    if (!task.dueDate) return null;
    if (isOverdue) return `${task.overdueDays}d overdue`;
    if (isDueToday) return 'Due today';
    if (task.daysUntilDue != null && task.daysUntilDue <= 7) return `${task.daysUntilDue}d left`;
    return formatRelativeTime(task.dueDate);
  };

  const handleEntityClick = (e) => {
    e.stopPropagation();
    const route = ENTITY_ROUTE_MAP[task.linkedEntity?.entityType];
    if (route && task.linkedEntity?.entityId) {
      navigate(`${route}/${task.linkedEntity.entityId}`);
    }
  };

  const assigneeName = task.assignedTo
    ? formatName(task.assignedTo.firstName, task.assignedTo.lastName, { format: 'full' })
    : null;

  const assigneeInitials = task.assignedTo
    ? `${(task.assignedTo.firstName || '')[0] || ''}${(task.assignedTo.lastName || '')[0] || ''}`.toUpperCase()
    : '';

  return (
    <Paper
      elevation={0}
      onClick={() => onClick ? onClick(task) : navigate(`/tasks/${task._id}`)}
      sx={{
        p: compact ? 1.5 : 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${priorityColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: alpha(priorityColor, 0.4),
          boxShadow: theme.shadows[2],
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Top row: task number + status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {task.displayId || task.taskNumber}
        </Typography>
        <StatusChip status={task.status} type="task" size="small" />
      </Box>

      {/* Title */}
      <Typography
        variant="body2"
        fontWeight={500}
        sx={{
          mb: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 1 : 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {task.title}
      </Typography>

      {/* Meta row: due date, assignee, checklist progress */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: compact ? 0 : 1 }}>
        {getDueDateText() && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: getDueDateColor() }} />
            <Typography variant="caption" sx={{ color: getDueDateColor(), fontWeight: isOverdue ? 600 : 400 }}>
              {getDueDateText()}
            </Typography>
          </Box>
        )}

        {showAssignee && assigneeName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar sx={{ width: 18, height: 18, fontSize: '0.625rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
              {assigneeInitials}
            </Avatar>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 80 }}>
              {assigneeName}
            </Typography>
          </Box>
        )}

        {task.checklistProgress != null && task.checklistProgress >= 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 60 }}>
            <LinearProgress
              variant="determinate"
              value={task.checklistProgress}
              sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
            />
            <Typography variant="caption" color="text.secondary">
              {task.checklistProgress}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bottom row: category, auto-generated badge, linked entity */}
      {!compact && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {task.category && task.category !== 'General' && (
            <Chip
              label={task.category}
              size="small"
              sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.grey[500], 0.08) }}
            />
          )}
          {task.autoGenerated?.isAutoGenerated && (
            <Chip
              icon={<SmartToy sx={{ fontSize: 12 }} />}
              label="Auto"
              size="small"
              sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.info.main, 0.08), color: 'info.main' }}
            />
          )}
          {task.currentEscalationLevel > 0 && (
            <Chip
              icon={<ReportProblem sx={{ fontSize: 12 }} />}
              label={`Escalated L${task.currentEscalationLevel}`}
              size="small"
              sx={{
                height: 20, fontSize: '0.625rem',
                bgcolor: alpha(ESCALATION_COLORS[task.currentEscalationLevel] || '#D32F2F', 0.1),
                color: ESCALATION_COLORS[task.currentEscalationLevel] || '#D32F2F',
              }}
            />
          )}
          {task.recurrence?.isRecurring && (
            <Chip
              icon={<Repeat sx={{ fontSize: 12 }} />}
              label="Recurring"
              size="small"
              sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.secondary.main, 0.08), color: 'secondary.main' }}
            />
          )}
          {task.linkedEntity?.displayLabel && (
            <Chip
              icon={<LinkIcon sx={{ fontSize: 12 }} />}
              label={task.linkedEntity.displayLabel}
              size="small"
              onClick={handleEntityClick}
              sx={{
                height: 20,
                fontSize: '0.625rem',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                cursor: 'pointer',
              }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TaskCard;

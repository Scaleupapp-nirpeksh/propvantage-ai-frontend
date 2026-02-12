import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Paper, Button, Chip, Tabs, Tab, Alert,
  alpha, useTheme, useMediaQuery, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, SmartToy, CalendarToday, Person, Category,
  LocalOffer, Visibility, Link as LinkIcon, ExpandMore, ReportProblem, Repeat,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';
import StatusTransitionMenu from '../../components/tasks/StatusTransitionMenu';
import ChecklistSection from '../../components/tasks/ChecklistSection';
import SubTaskList from '../../components/tasks/SubTaskList';
import CommentSection from '../../components/tasks/CommentSection';
import ActivityTimeline from '../../components/tasks/ActivityTimeline';
import { PRIORITY_COLORS, ENTITY_ROUTE_MAP, ESCALATION_COLORS } from '../../constants/taskConfig';
import { formatDate, formatName } from '../../utils/formatters';

const TaskDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();

  const canUpdate = checkPermission ? checkPermission('tasks:update') : true;
  const canDelete = checkPermission ? checkPermission('tasks:delete') : false;
  const canCreate = checkPermission ? checkPermission('tasks:create') : true;

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTask = async () => {
      setLoading(true);
      try {
        const res = await tasksAPI.getTask(taskId);
        if (!cancelled) {
          const t = res.data?.data?.task || res.data?.data || res.data?.task || res.data;
          setTask(t);
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar('Failed to load task', { variant: 'error' });
          navigate('/tasks');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTask();
    return () => { cancelled = true; };
  }, [taskId, enqueueSnackbar, navigate]);

  const handleStatusChange = async (newStatus, extra = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus, ...extra });
      enqueueSnackbar('Status updated', { variant: 'success' });
      setTask((prev) => ({ ...prev, status: newStatus }));
    } catch {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const handleChecklistToggle = async (itemId, isCompleted) => {
    try {
      await tasksAPI.toggleChecklistItem(taskId, itemId, { isCompleted });
      setTask((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) =>
          item._id === itemId ? { ...item, isCompleted } : item
        ),
      }));
    } catch {
      enqueueSnackbar('Failed to update checklist', { variant: 'error' });
    }
  };

  const handleAddSubTask = async (data) => {
    try {
      const res = await tasksAPI.createSubTask(taskId, data);
      const newSub = res.data?.data?.subTask || res.data?.data || res.data;
      setTask((prev) => ({
        ...prev,
        subTasks: [...(prev.subTasks || []), newSub],
      }));
      enqueueSnackbar('Sub-task added', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to add sub-task', { variant: 'error' });
    }
  };

  const handleStopRecurrence = async () => {
    try {
      await tasksAPI.updateTask(taskId, { recurrence: { isRecurring: false } });
      setTask((prev) => ({ ...prev, recurrence: { ...prev.recurrence, isRecurring: false } }));
      enqueueSnackbar('Recurrence stopped', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to stop recurrence', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await tasksAPI.deleteTask(taskId);
      enqueueSnackbar('Task deleted', { variant: 'success' });
      navigate('/tasks');
    } catch {
      enqueueSnackbar('Failed to delete task', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Task Detail"
          actions={<Button startIcon={<ArrowBack />} onClick={() => navigate('/tasks')} sx={{ textTransform: 'none' }}>Back</Button>}
          loading
        />
        <DetailPageSkeleton />
      </Box>
    );
  }

  if (!task) return null;

  const priorityColor = PRIORITY_COLORS[task.priority] || theme.palette.grey[400];
  const assignee = task.assignedTo;
  const assigneeName = assignee
    ? formatName(assignee.firstName, assignee.lastName, { format: 'full' })
    : 'Unassigned';

  // Sidebar details
  const detailItems = [
    { label: 'Category', icon: Category, value: task.category || '-' },
    {
      label: 'Priority',
      icon: null,
      value: (
        <Chip
          label={task.priority}
          size="small"
          sx={{ fontWeight: 600, bgcolor: alpha(priorityColor, 0.1), color: priorityColor }}
        />
      ),
    },
    { label: 'Assigned To', icon: Person, value: assigneeName },
    {
      label: 'Due Date',
      icon: CalendarToday,
      value: task.dueDate ? formatDate(task.dueDate, { format: 'medium' }) : '-',
      color: task.isOverdue ? 'error.main' : undefined,
    },
    { label: 'Tags', icon: LocalOffer, value: task.tags?.length > 0 ? task.tags.join(', ') : '-' },
    {
      label: 'Watchers',
      icon: Visibility,
      value: task.watchers?.length > 0 ? `${task.watchers.length} watching` : 'None',
    },
  ];

  if (task.linkedEntity?.displayLabel) {
    detailItems.push({
      label: 'Linked Entity',
      icon: LinkIcon,
      value: (
        <Chip
          label={task.linkedEntity.displayLabel}
          size="small"
          clickable
          onClick={() => {
            const route = ENTITY_ROUTE_MAP[task.linkedEntity.entityType];
            if (route) navigate(`${route}/${task.linkedEntity.entityId}`);
          }}
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
        />
      ),
    });
  }

  const SidebarContent = () => (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Details</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {detailItems.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            <Typography variant="body2" sx={{ color: item.color || 'text.primary', fontWeight: 500, textAlign: 'right' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* SLA indicator */}
      {task.sla && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: alpha(task.sla.breached ? theme.palette.error.main : theme.palette.success.main, 0.04) }}>
          <Typography variant="caption" fontWeight={600} color={task.sla.breached ? 'error.main' : 'success.main'}>
            SLA: {task.sla.breached ? 'Breached' : 'On Track'}
          </Typography>
        </Box>
      )}

      {/* Escalation indicator */}
      {task.currentEscalationLevel > 0 && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: alpha(ESCALATION_COLORS[task.currentEscalationLevel] || '#D32F2F', 0.06) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <ReportProblem sx={{ fontSize: 16, color: ESCALATION_COLORS[task.currentEscalationLevel] || '#D32F2F' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: ESCALATION_COLORS[task.currentEscalationLevel] || '#D32F2F' }}>
              Escalation Level {task.currentEscalationLevel}
            </Typography>
          </Box>
          {task.escalations?.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              {task.escalations.map((esc, idx) => (
                <Typography key={idx} variant="caption" color="text.secondary">
                  L{esc.level}: {esc.escalatedTo?.firstName} {esc.escalatedTo?.lastName} — {esc.reason}
                  {esc.acknowledged && ' (Acknowledged)'}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Recurring indicator */}
      {task.recurrence?.isRecurring && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <Repeat sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="caption" fontWeight={600} color="secondary.main">
              Recurring — {task.recurrence.pattern} (every {task.recurrence.interval || 1})
            </Typography>
          </Box>
          {task.recurrence.nextOccurrence && (
            <Typography variant="caption" color="text.secondary">
              Next: {formatDate(task.recurrence.nextOccurrence, { format: 'medium' })}
            </Typography>
          )}
          {canUpdate && (
            <Button
              size="small"
              color="secondary"
              onClick={handleStopRecurrence}
              sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
            >
              Stop Recurrence
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {task.displayId || task.taskNumber}
            </Typography>
            <Typography variant="h5" fontWeight={600}>{task.title}</Typography>
            <StatusTransitionMenu
              currentStatus={task.status}
              onStatusChange={handleStatusChange}
              disabled={!canUpdate}
            />
          </Box>
        }
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/tasks')} sx={{ textTransform: 'none' }}>
              Back
            </Button>
            {canUpdate && (
              <Button startIcon={<Edit />} variant="outlined" onClick={() => navigate(`/tasks/${taskId}/edit`)} sx={{ textTransform: 'none' }}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button startIcon={<Delete />} color="error" onClick={() => setDeleteDialog(true)} sx={{ textTransform: 'none' }}>
                Delete
              </Button>
            )}
          </Box>
        }
      />

      {/* Auto-generated banner */}
      {task.autoGenerated?.isAutoGenerated && (
        <Alert icon={<SmartToy />} severity="info" sx={{ mb: 3 }}>
          This task was auto-generated by the system ({task.autoGenerated.triggerType?.replace(/_/g, ' ') || 'system'}).
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid item xs={12} md={8}>
          {/* Mobile sidebar accordion */}
          {isMobile && (
            <Accordion defaultExpanded={false} sx={{ mb: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2" fontWeight={600}>Task Details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}><SidebarContent /></AccordionDetails>
            </Accordion>
          )}

          {/* Description */}
          {task.description && (
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.5, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Description</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {task.description}
              </Typography>
            </Paper>
          )}

          {/* Checklist */}
          {task.checklist?.length > 0 && (
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.5, mb: 3 }}>
              <ChecklistSection
                checklist={task.checklist}
                taskId={taskId}
                onToggle={handleChecklistToggle}
                disabled={!canUpdate}
                progress={task.checklistProgress}
              />
            </Paper>
          )}

          {/* Sub-tasks */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2.5, mb: 3 }}>
            <SubTaskList
              subTasks={task.subTasks || []}
              parentTaskId={taskId}
              onAddSubTask={handleAddSubTask}
              canCreate={canCreate}
              canUpdate={canUpdate}
            />
          </Paper>

          {/* Comments + Activity tabs */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Comments" sx={{ textTransform: 'none' }} />
              <Tab label="Activity" sx={{ textTransform: 'none' }} />
            </Tabs>
            <Box sx={{ p: 2.5 }}>
              {tabValue === 0 && (
                <CommentSection
                  taskId={taskId}
                  comments={task.comments || []}
                  canComment={canUpdate}
                />
              )}
              {tabValue === 1 && (
                <ActivityTimeline activityLog={task.activityLog || []} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar - desktop only */}
        {!isMobile && (
          <Grid item md={4}>
            <SidebarContent />
          </Grid>
        )}
      </Grid>

      <ConfirmDialog
        open={deleteDialog}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </Box>
  );
};

export default TaskDetailPage;

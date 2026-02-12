import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, alpha, useTheme, useMediaQuery,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Add, ViewList, ViewKanban } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import TaskCard from '../../components/tasks/TaskCard';
import TaskFilters from '../../components/tasks/TaskFilters';
import { KANBAN_COLUMNS, STATUS_TRANSITIONS } from '../../constants/taskConfig';

// Draggable task card wrapper
const DraggableTask = ({ task, id }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  } : {};

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes} sx={{ mb: 1.5, touchAction: 'none' }}>
      <TaskCard task={task} compact />
    </Box>
  );
};

// Droppable column
const KanbanColumn = ({ column, tasks, children }) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        flex: '0 0 280px',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${isOver ? alpha(column.color, 0.4) : theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: isOver ? alpha(column.color, 0.02) : 'background.default',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Column header */}
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color }} />
        <Typography variant="subtitle2" fontWeight={600}>{column.label}</Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{ height: 20, fontSize: '0.688rem', fontWeight: 600, bgcolor: alpha(column.color, 0.1), color: column.color }}
        />
      </Box>

      {/* Cards */}
      <Box sx={{ flex: 1, p: 1.5, pt: 0.5, overflow: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
};

const TaskKanbanPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();

  const canCreate = checkPermission ? checkPermission('tasks:create') : true;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const params = { limit: 200, status: 'Open,In Progress,Under Review,Completed,On Hold' };
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const res = await tasksAPI.getTasks(params);
      const result = res.data?.data || res.data || {};
      setTasks(result.tasks || []);
    } catch {
      enqueueSnackbar('Failed to load tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, enqueueSnackbar]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Group tasks by status
  const groupedTasks = {};
  KANBAN_COLUMNS.forEach((col) => { groupedTasks[col.id] = []; });
  tasks.forEach((task) => {
    if (groupedTasks[task.status]) groupedTasks[task.status].push(task);
  });

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Validate transition
    const validTransitions = STATUS_TRANSITIONS[task.status] || [];
    if (!validTransitions.includes(newStatus)) {
      enqueueSnackbar(`Cannot move from ${task.status} to ${newStatus}`, { variant: 'warning' });
      return;
    }

    // Optimistic update
    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus });
      enqueueSnackbar('Status updated', { variant: 'success' });
    } catch {
      // Revert
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: task.status } : t));
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const handleStatusChange = async (taskId, newStatus, extra = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus, ...extra });
      enqueueSnackbar('Status updated', { variant: 'success' });
      fetchTasks();
    } catch {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const handleViewChange = (_, mode) => {
    if (!mode) return;
    localStorage.setItem('taskViewMode', mode);
    if (mode === 'list') navigate('/tasks/all');
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Kanban Board" loading />
        <CardGridSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Kanban Board"
        subtitle={`${tasks.length} tasks`}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup value="kanban" exclusive onChange={handleViewChange} size="small">
              <ToggleButton value="list"><ViewList sx={{ fontSize: 18 }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewKanban sx={{ fontSize: 18 }} /></ToggleButton>
            </ToggleButtonGroup>
            {canCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tasks/create')} sx={{ textTransform: 'none' }}>
                Create Task
              </Button>
            )}
          </Box>
        }
      />

      <TaskFilters
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onClear={() => setFilters({})}
      />

      {/* Kanban board - Desktop: DnD, Mobile: scroll with StatusTransitionMenu */}
      {isMobile ? (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn key={col.id} column={col} tasks={groupedTasks[col.id]}>
              {groupedTasks[col.id].map((task) => (
                <Box key={task._id} sx={{ mb: 1.5 }}>
                  <TaskCard
                    task={task}
                    compact
                    onStatusChange={(s, d) => handleStatusChange(task._id, s, d)}
                  />
                </Box>
              ))}
            </KanbanColumn>
          ))}
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn key={col.id} column={col} tasks={groupedTasks[col.id]}>
                {groupedTasks[col.id].map((task) => (
                  <DraggableTask key={task._id} task={task} id={task._id} />
                ))}
              </KanbanColumn>
            ))}
          </Box>

          <DragOverlay>
            {activeTask ? (
              <Box sx={{ width: 260, opacity: 0.9 }}>
                <TaskCard task={activeTask} compact />
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Box>
  );
};

export default TaskKanbanPage;

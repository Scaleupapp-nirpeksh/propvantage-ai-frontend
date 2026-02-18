import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Grid, alpha, useTheme, useMediaQuery,
  ToggleButtonGroup, ToggleButton, Tooltip,
} from '@mui/material';
import { Add, ViewList, ViewKanban, TableRows } from '@mui/icons-material';
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

// ─── Draggable task wrapper (horizontal DnD) ─────────────────────────────────
const DraggableTask = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
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

// ─── Horizontal droppable column ─────────────────────────────────────────────
const HorizontalColumn = ({ column, tasks, children }) => {
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
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color, flexShrink: 0 }} />
        <Typography variant="subtitle2" fontWeight={600}>{column.label}</Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{ height: 20, fontSize: '0.688rem', fontWeight: 600, bgcolor: alpha(column.color, 0.1), color: column.color }}
        />
      </Box>
      <Box sx={{ flex: 1, p: 1.5, pt: 0.5, overflow: 'auto' }}>{children}</Box>
    </Paper>
  );
};

// ─── Vertical column (full width, tasks in a grid) — droppable ───────────────
const VerticalColumn = ({ column, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  if (tasks.length === 0) return null;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        mb: 3,
        border: `2px dashed ${isOver ? alpha(column.color, 0.5) : 'transparent'}`,
        borderRadius: 2,
        bgcolor: isOver ? alpha(column.color, 0.03) : 'transparent',
        transition: 'all 0.2s ease',
        p: isOver ? 1 : 0,
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          pb: 1,
          borderBottom: `2px solid ${alpha(column.color, 0.35)}`,
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color, flexShrink: 0 }} />
        <Typography variant="subtitle1" fontWeight={700}>{column.label}</Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{ height: 20, fontSize: '0.688rem', fontWeight: 600, bgcolor: alpha(column.color, 0.12), color: column.color }}
        />
      </Box>

      {/* Task grid — each task is draggable */}
      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={task._id}>
            <DraggableTask task={task} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
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

  // Orientation: 'horizontal' (columns side-by-side) | 'vertical' (stacked rows)
  const [orientation, setOrientation] = useState(
    () => localStorage.getItem('kanbanOrientation') || 'horizontal'
  );

  const handleOrientationChange = (_, value) => {
    if (!value) return;
    setOrientation(value);
    localStorage.setItem('kanbanOrientation', value);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const params = { limit: 200 };
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
    setActiveTask(tasks.find((t) => t._id === event.active.id) || null);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    const validTransitions = STATUS_TRANSITIONS[task.status] || [];
    if (!validTransitions.includes(newStatus)) {
      enqueueSnackbar(`Cannot move from ${task.status} to ${newStatus}`, { variant: 'warning' });
      return;
    }

    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus });
      enqueueSnackbar('Status updated', { variant: 'success' });
    } catch {
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: task.status } : t));
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

  // On mobile, always use vertical layout (horizontal columns are too narrow)
  const effectiveOrientation = isMobile ? 'vertical' : orientation;

  return (
    <Box>
      <PageHeader
        title="Kanban Board"
        subtitle={`${tasks.length} tasks`}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* List / Kanban view toggle */}
            <ToggleButtonGroup value="kanban" exclusive onChange={handleViewChange} size="small">
              <ToggleButton value="list"><ViewList sx={{ fontSize: 18 }} /></ToggleButton>
              <ToggleButton value="kanban"><ViewKanban sx={{ fontSize: 18 }} /></ToggleButton>
            </ToggleButtonGroup>

            {/* Orientation toggle — hidden on mobile (always vertical there) */}
            {!isMobile && (
              <Tooltip title={orientation === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}>
                <ToggleButtonGroup
                  value={orientation}
                  exclusive
                  onChange={handleOrientationChange}
                  size="small"
                >
                  <ToggleButton value="horizontal">
                    <ViewKanban sx={{ fontSize: 18 }} />
                  </ToggleButton>
                  <ToggleButton value="vertical">
                    <TableRows sx={{ fontSize: 18 }} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Tooltip>
            )}

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

      {/* ── Both layouts share the same DndContext ──────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Vertical layout */}
        {effectiveOrientation === 'vertical' && (
          <Box sx={{ mt: 2 }}>
            {KANBAN_COLUMNS.map((col) => (
              <VerticalColumn
                key={col.id}
                column={col}
                tasks={groupedTasks[col.id]}
              />
            ))}
            {tasks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Typography>No tasks found</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Horizontal layout */}
        {effectiveOrientation === 'horizontal' && (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mt: 2 }}>
            {KANBAN_COLUMNS.map((col) => (
              <HorizontalColumn key={col.id} column={col} tasks={groupedTasks[col.id]}>
                {groupedTasks[col.id].map((task) => (
                  <DraggableTask key={task._id} task={task} />
                ))}
              </HorizontalColumn>
            ))}
          </Box>
        )}

        <DragOverlay>
          {activeTask ? (
            <Box sx={{ width: 260, opacity: 0.9 }}>
              <TaskCard task={activeTask} compact />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};

export default TaskKanbanPage;

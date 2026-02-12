import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Checkbox, useTheme, Autocomplete, TextField, Popover,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Add, ViewKanban, ViewList, PersonAdd } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, userAPI } from '../../services/api';
import { PageHeader, DataTable, EmptyState, ConfirmDialog } from '../../components/common';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import TaskCard from '../../components/tasks/TaskCard';
import TaskFilters from '../../components/tasks/TaskFilters';
import StatusTransitionMenu from '../../components/tasks/StatusTransitionMenu';
import { PRIORITY_COLORS } from '../../constants/taskConfig';
import { formatDate, formatName } from '../../utils/formatters';

const TaskListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreate = checkPermission ? checkPermission('tasks:create') : true;
  const canBulk = checkPermission ? checkPermission('tasks:bulk_operations') : false;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [selected, setSelected] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [assignAnchor, setAssignAnchor] = useState(null);
  const [assignUsers, setAssignUsers] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);

  // View mode from localStorage
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('taskViewMode') || 'list'
  );

  // Filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    isOverdue: searchParams.get('isOverdue') || '',
    dueBefore: searchParams.get('dueBefore') || '',
    dueAfter: searchParams.get('dueAfter') || '',
    tags: searchParams.get('tags') || '',
  };

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const fetchTasks = useCallback(async () => {
    try {
      const params = {
        page: Number(searchParams.get('page')) || 1,
        limit: 20,
      };
      const search = searchParams.get('search');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const category = searchParams.get('category');
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      const isOverdue = searchParams.get('isOverdue');
      const dueBefore = searchParams.get('dueBefore');
      const dueAfter = searchParams.get('dueAfter');
      const tags = searchParams.get('tags');
      if (isOverdue) params.isOverdue = isOverdue;
      if (dueBefore) params.dueBefore = dueBefore;
      if (dueAfter) params.dueAfter = dueAfter;
      if (tags) params.tags = tags;

      const sortBy = searchParams.get('sortBy');
      const sortOrder = searchParams.get('sortOrder');
      if (sortBy) { params.sortBy = sortBy; params.sortOrder = sortOrder || 'desc'; }

      const res = await tasksAPI.getTasks(params);
      const result = res.data?.data || res.data || {};
      setTasks(result.tasks || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: 20 });
    } catch {
      enqueueSnackbar('Failed to load tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchParams, enqueueSnackbar]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus, extra = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus, ...extra });
      enqueueSnackbar('Status updated', { variant: 'success' });
      fetchTasks();
    } catch {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await tasksAPI.deleteTask(deleteDialog);
      enqueueSnackbar('Task deleted', { variant: 'success' });
      setDeleteDialog(null);
      fetchTasks();
    } catch {
      enqueueSnackbar('Failed to delete task', { variant: 'error' });
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selected.length === 0) return;
    try {
      await tasksAPI.bulkUpdateStatus({ taskIds: selected, status });
      enqueueSnackbar(`${selected.length} tasks updated`, { variant: 'success' });
      setSelected([]);
      fetchTasks();
    } catch {
      enqueueSnackbar('Bulk update failed', { variant: 'error' });
    }
  };

  const handleBulkAssignOpen = async (event) => {
    setAssignAnchor(event.currentTarget);
    if (assignUsers.length === 0) {
      try {
        const res = await userAPI.getUsers({ limit: 200 });
        const list = res.data?.data?.users || res.data?.data || res.data || [];
        setAssignUsers(Array.isArray(list) ? list : []);
      } catch { /* ignore */ }
    }
  };

  const handleBulkAssign = async () => {
    if (selected.length === 0 || !assignTarget) return;
    try {
      await tasksAPI.bulkAssign({ taskIds: selected, assignedTo: assignTarget._id || assignTarget.id });
      enqueueSnackbar(`${selected.length} tasks assigned`, { variant: 'success' });
      setSelected([]);
      setAssignAnchor(null);
      setAssignTarget(null);
      fetchTasks();
    } catch {
      enqueueSnackbar('Bulk assign failed', { variant: 'error' });
    }
  };

  const handleViewChange = (_, mode) => {
    if (!mode) return;
    setViewMode(mode);
    localStorage.setItem('taskViewMode', mode);
    if (mode === 'kanban') navigate('/tasks/kanban');
  };

  const handleSort = (field) => {
    const next = new URLSearchParams(searchParams);
    const currentSort = searchParams.get('sortBy');
    const currentOrder = searchParams.get('sortOrder') || 'desc';
    if (currentSort === field) {
      next.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      next.set('sortBy', field);
      next.set('sortOrder', 'desc');
    }
    setSearchParams(next);
  };

  const columns = [
    ...(canBulk ? [{
      id: 'select',
      label: '',
      width: 40,
      render: (row) => (
        <Checkbox
          size="small"
          checked={selected.includes(row._id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.checked) setSelected((prev) => [...prev, row._id]);
            else setSelected((prev) => prev.filter((id) => id !== row._id));
          }}
        />
      ),
    }] : []),
    { id: 'taskNumber', label: '#', width: 80, sortable: true },
    {
      id: 'title',
      label: 'Title',
      render: (row) => row.title,
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      render: (row) => (
        <StatusTransitionMenu
          currentStatus={row.status}
          onStatusChange={(s, d) => handleStatusChange(row._id, s, d)}
          size="small"
        />
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      width: 100,
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_COLORS[row.priority] || theme.palette.grey[400] }} />
          {row.priority}
        </Box>
      ),
    },
    {
      id: 'assignedTo',
      label: 'Assignee',
      width: 120,
      render: (row) => {
        const user = row.assignedTo;
        return user ? formatName(user.firstName, user.lastName, { format: 'full' }) : '-';
      },
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      width: 110,
      sortable: true,
      render: (row) => {
        if (!row.dueDate) return '-';
        const isOverdue = row.isOverdue || row.overdueDays > 0;
        return (
          <Box sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontWeight: isOverdue ? 600 : 400 }}>
            {formatDate(row.dueDate, { format: 'medium' })}
          </Box>
        );
      },
    },
    {
      id: 'category',
      label: 'Category',
      width: 120,
      sortable: true,
      render: (row) => row.category || '-',
    },
  ];

  if (loading) {
    return (
      <Box>
        <PageHeader title="All Tasks" loading />
        <TableSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="All Tasks"
        subtitle={`${pagination.total} tasks`}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
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
        onChange={setFilter}
        onClear={clearFilters}
        showAdvanced
        extraActions={
          selected.length > 0 && canBulk ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button size="small" variant="outlined" onClick={() => handleBulkStatusChange('Completed')} sx={{ textTransform: 'none' }}>
                Complete ({selected.length})
              </Button>
              <Button size="small" variant="outlined" startIcon={<PersonAdd sx={{ fontSize: 16 }} />} onClick={handleBulkAssignOpen} sx={{ textTransform: 'none' }}>
                Assign ({selected.length})
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setSelected([])} sx={{ textTransform: 'none' }}>
                Clear
              </Button>
              <Popover
                open={Boolean(assignAnchor)}
                anchorEl={assignAnchor}
                onClose={() => setAssignAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Box sx={{ p: 2, width: 280 }}>
                  <Autocomplete
                    options={assignUsers}
                    getOptionLabel={(u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || ''}
                    value={assignTarget}
                    onChange={(_, val) => setAssignTarget(val)}
                    renderInput={(params) => <TextField {...params} label="Assign to" size="small" autoFocus />}
                    isOptionEqualToValue={(opt, val) => (opt._id || opt.id) === (val?._id || val?.id)}
                    size="small"
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    disabled={!assignTarget}
                    onClick={handleBulkAssign}
                    sx={{ mt: 1.5, textTransform: 'none' }}
                  >
                    Assign {selected.length} task(s)
                  </Button>
                </Box>
              </Popover>
            </Box>
          ) : null
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters or create a new task"
          action={canCreate ? { label: 'Create Task', onClick: () => navigate('/tasks/create') } : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={tasks}
          getRowId={(row) => row._id}
          onRowClick={(row) => navigate(`/tasks/${row._id}`)}
          page={pagination.page}
          rowsPerPage={pagination.limit}
          totalRows={pagination.total}
          onPageChange={(p) => {
            const next = new URLSearchParams(searchParams);
            next.set('page', String(p));
            setSearchParams(next);
          }}
          sortBy={searchParams.get('sortBy') || ''}
          sortOrder={searchParams.get('sortOrder') || 'desc'}
          onSort={handleSort}
          responsive="card"
          mobileCardRenderer={(row) => (
            <TaskCard task={row} compact />
          )}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteDialog)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(null)}
      />
    </Box>
  );
};

export default TaskListPage;

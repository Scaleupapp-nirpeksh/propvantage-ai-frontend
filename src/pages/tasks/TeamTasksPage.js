import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, alpha, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { tasksAPI } from '../../services/api';
import { PageHeader, DataTable, EmptyState } from '../../components/common';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import TaskCard from '../../components/tasks/TaskCard';
import TaskFilters from '../../components/tasks/TaskFilters';
import StatusTransitionMenu from '../../components/tasks/StatusTransitionMenu';
import { PRIORITY_COLORS } from '../../constants/taskConfig';
import { formatDate, formatName } from '../../utils/formatters';

const TeamTasksPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;

      const res = await tasksAPI.getTeamTasks(params);
      const result = res.data?.data || res.data || {};
      setData(result);
    } catch {
      enqueueSnackbar('Failed to load team tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (taskId, newStatus, extra = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus, ...extra });
      enqueueSnackbar('Status updated', { variant: 'success' });
      fetchData();
    } catch {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const workload = data?.workload || [];
  const tasks = data?.tasks || [];
  const teamMembers = workload.map((w) => ({
    _id: w.userId?._id || w.userId,
    firstName: w.userId?.firstName || w.firstName || '',
    lastName: w.userId?.lastName || w.lastName || '',
  }));

  const columns = [
    { id: 'taskNumber', label: '#', width: 80 },
    { id: 'title', label: 'Title', render: (row) => row.title },
    {
      id: 'status',
      label: 'Status',
      width: 140,
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
      width: 130,
      render: (row) => {
        const user = row.assignedTo;
        return user ? formatName(user.firstName, user.lastName, { format: 'full' }) : '-';
      },
    },
    {
      id: 'dueDate',
      label: 'Due',
      width: 100,
      render: (row) => row.dueDate ? formatDate(row.dueDate, { format: 'medium' }) : '-',
    },
  ];

  if (loading) {
    return (
      <Box>
        <PageHeader title="Team Tasks" loading />
        <TableSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Team Tasks" subtitle={`${tasks.length} tasks across ${workload.length} members`} />

      {/* Workload cards */}
      {workload.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mb: 2 }}>
          {workload.map((w) => {
            const memberId = w.userId?._id || w.userId;
            const name = formatName(w.userId?.firstName || w.firstName, w.userId?.lastName || w.lastName, { format: 'full' });
            const initials = formatName(w.userId?.firstName || w.firstName, w.userId?.lastName || w.lastName, { format: 'initials' });
            const isSelected = filters.assignedTo === memberId;

            return (
              <Paper
                key={memberId}
                elevation={0}
                onClick={() => setFilters((prev) => ({
                  ...prev,
                  assignedTo: isSelected ? '' : memberId,
                }))}
                sx={{
                  flex: '0 0 180px',
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
                  '&:hover': { borderColor: theme.palette.primary.main },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                    {initials}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${w.total || 0} total`} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
                  {(w.overdue || 0) > 0 && (
                    <Chip label={`${w.overdue} overdue`} size="small" sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }} />
                  )}
                  {(w.critical || 0) > 0 && (
                    <Chip label={`${w.critical} critical`} size="small" sx={{ height: 20, fontSize: '0.625rem', bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }} />
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <TaskFilters
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onClear={() => setFilters({})}
        showTeamFilters
        teamMembers={teamMembers}
      />

      {tasks.length === 0 ? (
        <EmptyState title="No team tasks found" description="Try adjusting your filters" />
      ) : (
        <DataTable
          columns={columns}
          rows={tasks}
          getRowId={(row) => row._id}
          onRowClick={(row) => navigate(`/tasks/${row._id}`)}
          responsive="card"
          mobileCardRenderer={(row) => <TaskCard task={row} compact />}
        />
      )}
    </Box>
  );
};

export default TeamTasksPage;

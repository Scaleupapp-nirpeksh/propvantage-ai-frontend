import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Tabs, Tab, Chip, Button, alpha, useTheme, useMediaQuery } from '@mui/material';
import { Add, WarningAmber, Today, PlayArrow, CalendarMonth, DoneAll } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { PageHeader, KPICard, EmptyState } from '../../components/common';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import TaskCard from '../../components/tasks/TaskCard';
import TaskFilters from '../../components/tasks/TaskFilters';

const TAB_CONFIG = [
  { key: 'overdue', label: 'Overdue', icon: WarningAmber, color: 'error' },
  { key: 'dueToday', label: 'Due Today', icon: Today, color: 'warning' },
  { key: 'inProgress', label: 'In Progress', icon: PlayArrow, color: 'info' },
  { key: 'thisWeek', label: 'This Week', icon: CalendarMonth, color: 'primary' },
  { key: 'completed', label: 'Completed', icon: DoneAll, color: 'success' },
];

const MyTasksPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({});

  const canCreate = checkPermission ? checkPermission('tasks:create') : true;

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const res = await tasksAPI.getMyTasks(params);
      const result = res.data?.data || res.data || {};
      setData(result);
    } catch {
      enqueueSnackbar('Failed to load tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll every 60 seconds for near-real-time updates
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusChange = async (taskId, newStatus, extra = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status: newStatus, ...extra });
      enqueueSnackbar('Status updated', { variant: 'success' });
      fetchData();
    } catch {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const summary = data?.summary || {};
  const groups = data?.groups || {};

  const tabKey = TAB_CONFIG[activeTab]?.key;
  const currentTasks = groups[tabKey] || [];

  if (loading) {
    return (
      <Box>
        <PageHeader title="My Tasks" subtitle="Loading..." loading />
        <CardGridSkeleton />
      </Box>
    );
  }

  const totalOpen = (summary.overdue || 0) + (summary.dueToday || 0) + (summary.inProgress || 0);

  return (
    <Box>
      <PageHeader
        title="My Tasks"
        subtitle={`${totalOpen} open · ${summary.overdue || 0} overdue`}
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tasks/create')}
              sx={{ textTransform: 'none' }}
            >
              Create Task
            </Button>
          )
        }
      />

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {TAB_CONFIG.map((tab) => (
          <Grid item xs={6} sm={4} md key={tab.key}>
            <KPICard
              title={tab.label}
              value={summary[tab.key] || 0}
              icon={tab.icon}
              color={tab.color}
              onClick={() => setActiveTab(TAB_CONFIG.findIndex((t) => t.key === tab.key))}
            />
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <TaskFilters
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
        onClear={() => setFilters({})}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {TAB_CONFIG.map((tab) => {
          const count = summary[tab.key] || 0;
          return (
            <Tab
              key={tab.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {tab.label}
                  {count > 0 && (
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.688rem',
                        fontWeight: 600,
                        bgcolor: alpha(theme.palette[tab.color]?.main || theme.palette.grey[500], 0.1),
                        color: theme.palette[tab.color]?.main,
                      }}
                    />
                  )}
                </Box>
              }
              sx={{ textTransform: 'none' }}
            />
          );
        })}
      </Tabs>

      {/* Task list */}
      {currentTasks.length === 0 ? (
        <EmptyState
          title={`No ${TAB_CONFIG[activeTab]?.label?.toLowerCase()} tasks`}
          description="You're all caught up!"
        />
      ) : (
        <Grid container spacing={2}>
          {currentTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
              <TaskCard
                task={task}
                showAssignee={false}
                onStatusChange={(status, extra) => handleStatusChange(task._id, status, extra)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyTasksPage;

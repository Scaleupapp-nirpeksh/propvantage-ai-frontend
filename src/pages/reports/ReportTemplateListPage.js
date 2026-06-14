// File: src/pages/reports/ReportTemplateListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Stack, Typography, Tooltip } from '@mui/material';
import { Add, Summarize, Schedule as ScheduleIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, EmptyState } from '../../components/common';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Human-readable cadence, e.g. "Weekly · Mon 09:00 (Kolkata)".
const formatCadence = (schedule) => {
  const s = schedule || {};
  if (!s.enabled) return null;
  const time = s.time || '09:00';
  const tz = s.timezone ? ` (${s.timezone.split('/').pop().replace('_', ' ')})` : '';
  if (s.frequency === 'weekly') return `Weekly · ${DOW[s.dayOfWeek ?? 1]} ${time}${tz}`;
  if (s.frequency === 'monthly') return `Monthly · day ${s.dayOfMonth ?? 1} · ${time}${tz}`;
  if (s.frequency === 'quarterly') return `Quarterly · ${time}${tz}`;
  return `Scheduled · ${time}${tz}`;
};

const formatNextRun = (schedule) => {
  const s = schedule || {};
  if (!s.enabled || !s.nextRunAt) return '—';
  return new Date(s.nextRunAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const ReportTemplateListPage = () => {
  const navigate = useNavigate();
  const { checkPerm } = useAuth();
  const canManage = checkPerm('reports:manage');

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.listTemplates({ limit: 100 });
      setTemplates(res.data?.data?.templates || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await reportAPI.deleteTemplate(toDelete._id);
      setToDelete(null);
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Template', sortable: false },
    { id: 'blocks', label: 'Blocks', render: (row) => (row.blocks || []).length },
    {
      id: 'schedule', label: 'Schedule',
      render: (row) => {
        const cadence = formatCadence(row.schedule);
        return cadence
          ? <Chip size="small" icon={<ScheduleIcon sx={{ fontSize: 15 }} />} label={cadence} color="primary" variant="outlined" />
          : <Typography variant="body2" color="text.secondary">Manual</Typography>;
      },
    },
    {
      id: 'nextRun', label: 'Next run',
      render: (row) => <Typography variant="body2" color="text.secondary">{formatNextRun(row.schedule)}</Typography>,
    },
    {
      id: 'recipients', label: 'Recipients',
      render: (row) => {
        const list = row.delivery?.recipients || [];
        if (!list.length) return <Typography variant="body2" color="text.secondary">—</Typography>;
        const names = list.map((r) => r.name || r.email).filter(Boolean).join(', ');
        return (
          <Tooltip title={names}>
            <Typography variant="body2">{list.length} recipient{list.length > 1 ? 's' : ''}</Typography>
          </Tooltip>
        );
      },
    },
    {
      id: 'status', label: 'Status',
      render: (row) => <Chip size="small" label={row.status || 'active'} color={row.status === 'archived' ? 'default' : 'success'} variant="outlined" />,
    },
    {
      id: 'updatedAt', label: 'Updated',
      render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-IN') : '—'),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Build and manage leadership report templates"
        icon={Summarize}
        loading={loading}
        actions={
          <Stack direction="row" spacing={1}>
            <Button onClick={() => navigate('/reports/generated')}>Generated reports</Button>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/reports/templates/new')}>
                New Template
              </Button>
            )}
          </Stack>
        }
      />

      {!loading && templates.length === 0 ? (
        <EmptyState
          icon={Summarize}
          title="No report templates yet"
          description="Create a template to compose a one-page leadership report."
          action={canManage ? { label: 'New Template', onClick: () => navigate('/reports/templates/new'), icon: <Add /> } : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={templates}
          loading={loading}
          rowKey="_id"
          onRowClick={(row) => navigate(`/reports/templates/${row._id}/edit`)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete template?"
        message={`This permanently deletes "${toDelete?.name}". Generated reports are unaffected.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
      {error && <Box sx={{ color: 'error.main', mt: 2 }}>{error}</Box>}
    </Box>
  );
};

export default ReportTemplateListPage;

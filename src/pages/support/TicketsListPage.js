// File: src/pages/support/TicketsListPage.js
// Support tickets list — filter by status/category. Tickets are created from real
// inbound email (provisioned helpdesk address); there is no manual "create" here.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, MenuItem, TextField, Button, Typography } from '@mui/material';
import { SupportAgent, Settings } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { supportAPI } from '../../services/api';
import { PageHeader, DataTable } from '../../components/common';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'info' },
  { value: 'assigned', label: 'Assigned', color: 'primary' },
  { value: 'in_progress', label: 'In Progress', color: 'warning' },
  { value: 'waiting_on_client', label: 'Waiting on Client', color: 'secondary' },
  { value: 'resolved', label: 'Resolved', color: 'success' },
  { value: 'closed', label: 'Closed', color: 'default' },
];

const CATEGORY_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'legal', label: 'Legal' },
  { value: 'crm', label: 'CRM' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
];

const statusMeta = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status) || { label: status || '—', color: 'default' };

const categoryLabel = (cat) =>
  (CATEGORY_OPTIONS.find((c) => c.value === cat) || {}).label || cat || '—';

const truncate = (str, n = 60) =>
  str && str.length > n ? `${str.slice(0, n)}…` : (str || '—');

const getTimeAgo = (date) => {
  if (!date) return 'Never';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

const assigneeName = (assignee) =>
  assignee
    ? [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || 'Assigned'
    : 'Unassigned';

const TicketsListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (category) params.category = category;
      const res = await supportAPI.list(params);
      setTickets(res.data?.data || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load tickets.', { variant: 'error' });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [status, category, enqueueSnackbar]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const columns = [
    {
      id: 'displayId',
      label: 'Ticket',
      render: (v) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{v || '—'}</Typography>,
    },
    {
      id: 'subject',
      label: 'Subject',
      render: (v) => <Typography variant="body2" noWrap>{truncate(v)}</Typography>,
    },
    {
      id: 'category',
      label: 'Category',
      render: (v) => <Chip label={categoryLabel(v)} size="small" variant="outlined" />,
    },
    {
      id: 'status',
      label: 'Status',
      render: (v) => {
        const m = statusMeta(v);
        return <Chip label={m.label} size="small" color={m.color} />;
      },
    },
    {
      id: 'assignee',
      label: 'Assignee',
      render: (v) => (
        <Typography variant="body2" color={v ? 'text.primary' : 'text.secondary'}>
          {assigneeName(v)}
        </Typography>
      ),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      render: (v) => (
        <Typography variant="caption" color="text.secondary">{getTimeAgo(v)}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Support tickets"
        subtitle="Inbound client requests routed from email"
        icon={SupportAgent}
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Settings />}
            onClick={() => navigate('/settings/support')}
          >
            Helpdesk settings
          </Button>
        }
      >
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select size="small" label="Status" value={status}
            onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label="Category" value={category}
            onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {CATEGORY_OPTIONS.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={tickets}
        loading={loading}
        rowKey="_id"
        onRowClick={(row) => navigate(`/support/${row._id}`)}
        emptyState={{
          icon: SupportAgent,
          title: 'No tickets found',
          description: 'No support tickets match the current filters.',
        }}
      />
    </Box>
  );
};

export default TicketsListPage;

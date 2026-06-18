// File: src/pages/support/TicketsListPage.js
// Support tickets list — filter by status/category, dev "Simulate inbound" tool.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Chip, MenuItem, TextField, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
} from '@mui/material';
import { SupportAgent, Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
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
  const { isOwner, user } = useAuth();

  const canSimulate =
    isOwner || ['Business Head', 'admin', 'owner'].includes(user?.role);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const [simOpen, setSimOpen] = useState(false);
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simForm, setSimForm] = useState({ from: '', fromName: '', subject: '', text: '' });

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

  const handleSimulate = async () => {
    if (!simForm.from || !simForm.subject) {
      enqueueSnackbar('From email and subject are required.', { variant: 'warning' });
      return;
    }
    setSimSubmitting(true);
    try {
      await supportAPI.ingestTest({
        from: simForm.from,
        fromName: simForm.fromName,
        subject: simForm.subject,
        text: simForm.text,
        html: simForm.text ? `<p>${simForm.text}</p>` : undefined,
      });
      enqueueSnackbar('Simulated inbound email ingested.', { variant: 'success' });
      setSimOpen(false);
      setSimForm({ from: '', fromName: '', subject: '', text: '' });
      loadTickets();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to simulate inbound email.', { variant: 'error' });
    } finally {
      setSimSubmitting(false);
    }
  };

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
          canSimulate ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => setSimOpen(true)}
            >
              Simulate inbound
            </Button>
          ) : null
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

      <Dialog open={simOpen} onClose={() => setSimOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Simulate inbound email</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="From (email)" type="email" required fullWidth size="small"
              value={simForm.from}
              onChange={(e) => setSimForm((f) => ({ ...f, from: e.target.value }))}
            />
            <TextField
              label="From name" fullWidth size="small"
              value={simForm.fromName}
              onChange={(e) => setSimForm((f) => ({ ...f, fromName: e.target.value }))}
            />
            <TextField
              label="Subject" required fullWidth size="small"
              value={simForm.subject}
              onChange={(e) => setSimForm((f) => ({ ...f, subject: e.target.value }))}
            />
            <TextField
              label="Message" fullWidth multiline minRows={3} size="small"
              value={simForm.text}
              onChange={(e) => setSimForm((f) => ({ ...f, text: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimOpen(false)} disabled={simSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSimulate} disabled={simSubmitting}>
            {simSubmitting ? 'Sending…' : 'Create ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketsListPage;

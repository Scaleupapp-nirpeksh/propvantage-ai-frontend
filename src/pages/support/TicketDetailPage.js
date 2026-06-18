// File: src/pages/support/TicketDetailPage.js
// Support ticket detail — thread + reply/internal-note composer + public link.
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Chip, Typography, Stack, Divider, TextField,
  Button, IconButton, Tooltip, Alert, Link as MuiLink, Paper,
} from '@mui/material';
import {
  SupportAgent, ContentCopy, OpenInNew, Reply, NoteAdd, ArrowBack,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { supportAPI } from '../../services/api';
import { DetailPageSkeleton } from '../../components/common';

const STATUS_META = {
  new: { label: 'New', color: 'info' },
  assigned: { label: 'Assigned', color: 'primary' },
  in_progress: { label: 'In Progress', color: 'warning' },
  waiting_on_client: { label: 'Waiting on Client', color: 'secondary' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
};

const CATEGORY_LABEL = {
  sales: 'Sales', legal: 'Legal', crm: 'CRM', finance: 'Finance', other: 'Other',
};

const statusMeta = (s) => STATUS_META[s] || { label: s || '—', color: 'default' };

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const authorName = (msg, clientEmail) => {
  if (msg.direction === 'inbound') return msg.from || clientEmail || 'Client';
  if (msg.authorUser) {
    return [msg.authorUser.firstName, msg.authorUser.lastName].filter(Boolean).join(' ') || 'Support team';
  }
  return msg.from || 'Support team';
};

const MessageBubble = ({ msg, clientEmail }) => {
  const isInternal = msg.visibility === 'internal' || msg.direction === 'internal';
  const isInbound = msg.direction === 'inbound';
  const align = isInternal ? 'stretch' : isInbound ? 'flex-start' : 'flex-end';

  let bgcolor = 'grey.100';
  let borderColor = 'divider';
  if (isInternal) { bgcolor = 'warning.50'; borderColor = 'warning.light'; }
  else if (!isInbound) { bgcolor = 'primary.50'; borderColor = 'primary.light'; }

  return (
    <Box sx={{ display: 'flex', justifyContent: align, width: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          maxWidth: isInternal ? '100%' : '80%',
          width: isInternal ? '100%' : 'auto',
          bgcolor,
          borderColor,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {authorName(msg, clientEmail)}
          </Typography>
          {isInternal && (
            <Chip label="Internal note" size="small" color="warning"
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          )}
          <Typography variant="caption" color="text.secondary">{formatTime(msg.at)}</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {msg.body || '—'}
        </Typography>
      </Paper>
    </Box>
  );
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [composer, setComposer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supportAPI.get(id);
      setTicket(res.data?.data || null);
    } catch (err) {
      setError(err.response?.status === 404
        ? 'Ticket not found.'
        : (err.response?.data?.message || 'Failed to load ticket.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  const publicUrl = ticket?.publicToken
    ? `${window.location.origin}/t/${ticket.publicToken}`
    : '';

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard?.writeText(publicUrl);
    enqueueSnackbar('Public link copied to clipboard.', { variant: 'success' });
  };

  const handleSend = async (kind) => {
    const body = composer.trim();
    if (!body) {
      enqueueSnackbar('Write a message first.', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = kind === 'reply'
        ? await supportAPI.reply(id, body)
        : await supportAPI.addNote(id, body);
      setTicket(res.data?.data || ticket);
      setComposer('');
      enqueueSnackbar(
        kind === 'reply' ? 'Reply sent to the client.' : 'Internal note added.',
        { variant: 'success' },
      );
      loadTicket();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to send.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/support')} sx={{ mb: 2 }}>
          Back to tickets
        </Button>
        <Alert severity="warning">{error}</Alert>
      </Box>
    );
  }

  if (!ticket) return null;

  const m = statusMeta(ticket.status);
  const clientName = ticket.client?.name || ticket.client?.email || 'Client';
  const messages = (ticket.messages || []).slice().sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/support')} sx={{ mb: 2 }}>
        Back to tickets
      </Button>

      {/* Header card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <SupportAgent sx={{ color: 'primary.main' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">{ticket.displayId}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {ticket.subject || 'No subject'}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Chip label={m.label} color={m.color} size="small" />
            <Chip label={CATEGORY_LABEL[ticket.category] || ticket.category} size="small" variant="outlined" />
            {ticket.priority && <Chip label={`Priority: ${ticket.priority}`} size="small" variant="outlined" />}
          </Stack>

          <Stack spacing={0.5} sx={{ mb: 1.5 }}>
            <Typography variant="body2">
              <strong>Client:</strong> {clientName}
              {ticket.client?.email && ticket.client?.name ? ` <${ticket.client.email}>` : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Assignee:</strong>{' '}
              {ticket.assignee
                ? [ticket.assignee.firstName, ticket.assignee.lastName].filter(Boolean).join(' ') || ticket.assignee.email
                : 'Unassigned'}
            </Typography>
            {ticket.linkedTask && (
              <Typography variant="body2">
                <strong>Linked task:</strong>{' '}
                <MuiLink
                  component="button"
                  type="button"
                  onClick={() => navigate(`/tasks/${ticket.linkedTask._id}`)}
                  sx={{ verticalAlign: 'baseline' }}
                >
                  {ticket.linkedTask.taskNumber ? `#${ticket.linkedTask.taskNumber} ` : ''}
                  {ticket.linkedTask.title || 'View task'}
                </MuiLink>
              </Typography>
            )}
          </Stack>

          {publicUrl && (
            <Box>
              <Typography variant="caption" color="text.secondary">Public link</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  value={publicUrl} size="small" fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{ maxWidth: 480 }}
                />
                <Tooltip title="Copy link">
                  <IconButton size="small" onClick={handleCopyLink}><ContentCopy fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Open public page">
                  <IconButton size="small" component="a" href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Thread */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Conversation</Typography>
          {messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {messages.map((msg, i) => (
                <MessageBubble key={msg._id || i} msg={msg} clientEmail={ticket.client?.email} />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Composer */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Respond</Typography>
          <TextField
            fullWidth multiline minRows={3} placeholder="Type your message…"
            value={composer} onChange={(e) => setComposer(e.target.value)}
            disabled={submitting}
          />
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained" startIcon={<Reply />}
              onClick={() => handleSend('reply')} disabled={submitting}
            >
              Reply to client
            </Button>
            <Button
              variant="outlined" startIcon={<NoteAdd />}
              onClick={() => handleSend('note')} disabled={submitting}
            >
              Add internal note
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              “Reply to client” emails the client. Internal notes stay private.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TicketDetailPage;

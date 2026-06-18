// File: src/pages/public/PublicTicketPage.js
// PUBLIC, no-auth ticket status page (route /t/:token). Polls every ~20s.
// Uses publicTicketAPI which hits the interceptor-free `publicApi` instance,
// so anonymous viewers never send an auth header or trigger the 401-refresh flow.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, CircularProgress, Stack, Alert, Chip, Divider,
} from '@mui/material';
import { ConfirmationNumber } from '@mui/icons-material';
import { publicTicketAPI } from '../../services/api';

const STATUS_META = {
  new: { label: 'New', color: 'info' },
  assigned: { label: 'Assigned', color: 'primary' },
  in_progress: { label: 'In Progress', color: 'warning' },
  waiting_on_client: { label: 'Waiting on you', color: 'secondary' },
  resolved: { label: 'Resolved', color: 'success' },
  closed: { label: 'Closed', color: 'default' },
};

const statusMeta = (s) => STATUS_META[s] || { label: s || '—', color: 'default' };

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const POLL_MS = 20000;

const PublicTicketPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | viewing | error
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(async (initial) => {
    try {
      const res = await publicTicketAPI.get(token);
      if (!mounted.current) return;
      setTicket(res.data?.data || null);
      setStatus('viewing');
    } catch (err) {
      if (!mounted.current) return;
      // Only surface an error on the first load; transient poll failures are ignored.
      if (initial) {
        setError(err.response?.status === 404
          ? 'This ticket link is invalid or has expired.'
          : (err.response?.data?.message || 'Could not load this ticket.'));
        setStatus('error');
      }
    }
  }, [token]);

  useEffect(() => {
    mounted.current = true;
    load(true);
    const interval = setInterval(() => load(false), POLL_MS);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [load]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
        <Alert severity="warning" sx={{ maxWidth: 480 }}>{error}</Alert>
      </Box>
    );
  }

  const m = statusMeta(ticket?.status);
  const timeline = (ticket?.timeline || []).slice().sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 5 } }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 4 }, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ConfirmationNumber color="primary" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{ticket?.displayId}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {ticket?.subject || 'Support request'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Chip label={m.label} color={m.color} sx={{ fontWeight: 700 }} />
            </Box>

            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">Opened</Typography>
                <Typography variant="body2">{formatDate(ticket?.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last update</Typography>
                <Typography variant="body2">{formatDate(ticket?.updatedAt)}</Typography>
              </Box>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Activity</Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {timeline.map((item, i) => {
                  if (item.type === 'status') {
                    const sm = statusMeta(item.status);
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                          {formatTime(item.at)}
                        </Typography>
                        <Typography variant="body2">
                          Status changed to <Chip label={sm.label} color={sm.color} size="small" sx={{ ml: 0.5 }} />
                        </Typography>
                      </Box>
                    );
                  }
                  // message
                  const isInbound = item.direction === 'inbound';
                  return (
                    <Box
                      key={i}
                      sx={{ display: 'flex', justifyContent: isInbound ? 'flex-start' : 'flex-end', width: '100%' }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5, maxWidth: '85%', borderRadius: 2,
                          bgcolor: isInbound ? 'grey.100' : 'primary.50',
                          borderColor: isInbound ? 'divider' : 'primary.light',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {isInbound ? 'You' : (item.author || 'Support team')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{formatTime(item.at)}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {item.body || '—'}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })}
              </Stack>
            )}

            <Divider />
            <Typography variant="caption" color="text.secondary" textAlign="center">
              This page updates automatically · PropVantage AI
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicTicketPage;

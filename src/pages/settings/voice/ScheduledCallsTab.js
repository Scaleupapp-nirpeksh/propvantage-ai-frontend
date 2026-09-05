// File: src/pages/settings/voice/ScheduledCallsTab.js
// Description: The call-job queue — what the agent is about to do and what it
//   did — with cancel for scheduled jobs and a "run scan now" for admins.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Stack, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, CircularProgress, Link, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Refresh, Cancel, PlayArrow } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { voiceAPI } from '../../../services/api';
import { JOB_STATUS_COLOR } from './voiceConstants';

const fmt = (iso) => { try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };

const ScheduledCallsTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { isOwner, checkPerm } = useAuth();
  const canManage = isOwner || (checkPerm && checkPerm('voice:manage_playbooks'));

  const [filter, setFilter] = useState('upcoming');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'upcoming' ? 'scheduled,calling' : filter === 'done' ? 'completed,no_answer,failed' : 'skipped,cancelled';
      const res = await voiceAPI.listJobs({ status, limit: 200 });
      const list = res.data?.data || [];
      setJobs(filter === 'upcoming' ? list : list.slice().reverse());
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Failed to load scheduled calls.', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [filter, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (job) => {
    try { await voiceAPI.cancelJob(job._id); await load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Could not cancel.', { variant: 'error' }); }
  };

  const scan = async () => {
    setScanning(true);
    try {
      const res = await voiceAPI.scanNow();
      enqueueSnackbar(`Scan complete — ${res.data?.data?.jobs || 0} new call(s) queued.`, { variant: 'success' });
      await load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Scan failed.', { variant: 'error' }); }
    finally { setScanning(false); }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Scheduled calls</Typography>
          <Typography variant="body2" color="text.secondary">Playbooks queue calls here; the agent dials them inside their calling window.</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(e, v) => v && setFilter(v)}>
          <ToggleButton value="upcoming">Upcoming</ToggleButton>
          <ToggleButton value="done">Done</ToggleButton>
          <ToggleButton value="skipped">Skipped</ToggleButton>
        </ToggleButtonGroup>
        {canManage && (
          <Tooltip title="Check for missed follow-ups, upcoming visits and due instalments now (normally hourly)">
            <span><Button size="small" variant="outlined" startIcon={scanning ? <CircularProgress size={14} /> : <PlayArrow />} onClick={scan} disabled={scanning}>Run scan now</Button></span>
          </Tooltip>
        )}
        <Tooltip title="Refresh"><span><IconButton size="small" onClick={load} disabled={loading}><Refresh fontSize="small" /></IconButton></span></Tooltip>
      </Stack>

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={22} /></Box>
        ) : jobs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            {filter === 'upcoming' ? 'Nothing queued. Enable a playbook, or run a scan to pick up due situations.' : 'Nothing here yet.'}
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{filter === 'upcoming' ? 'Scheduled for' : 'When'}</TableCell>
                  <TableCell>Lead</TableCell><TableCell>Playbook</TableCell><TableCell>Status</TableCell>
                  <TableCell align="center">Attempts</TableCell><TableCell>Outcome / reason</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((j) => {
                  const leadId = j.lead?._id || j.lead;
                  const leadName = j.lead ? `${j.lead.firstName || ''} ${j.lead.lastName || ''}`.trim() || j.lead.phone : '—';
                  return (
                    <TableRow key={j._id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(filter === 'upcoming' ? j.scheduledFor : (j.updatedAt || j.scheduledFor))}</TableCell>
                      <TableCell>{leadId ? <Link component="button" underline="hover" onClick={() => navigate(`/leads/${leadId}`)}>{leadName}</Link> : leadName}</TableCell>
                      <TableCell>{j.playbook?.name || '—'}</TableCell>
                      <TableCell><Chip size="small" label={j.status.replace('_', ' ')} color={JOB_STATUS_COLOR[j.status] || 'default'} variant={j.status === 'calling' ? 'filled' : 'outlined'} /></TableCell>
                      <TableCell align="center">{j.attempts}/{j.maxAttempts}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}><Typography variant="body2" noWrap title={j.outcome || j.reason}>{j.outcome || j.reason || '—'}</Typography></TableCell>
                      <TableCell align="right">
                        {canManage && j.status === 'scheduled' && (
                          <Tooltip title="Cancel this call"><IconButton size="small" onClick={() => cancel(j)}><Cancel fontSize="small" /></IconButton></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ScheduledCallsTab;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert,
  IconButton, Tooltip, Tabs, Tab, Skeleton,
} from '@mui/material';
import { PersonAdd, Block, ContentCopy } from '@mui/icons-material';
import { cpPortalAPI, cpAnalyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AIInsightCard from '../../components/ai/AIInsightCard';

const INVITE_ROLES = ['CP Manager', 'CP Agent'];

const CpPortalTeamPage = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ firstName: '', lastName: '', email: '', role: 'CP Agent' });
  const [inviteLink, setInviteLink] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    cpPortalAPI.getTeam()
      .then((res) => setTeam(res.data?.data || []))
      .catch(() => setError('Could not load your team.'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitInvite = async () => {
    setBusy(true); setError(''); setInviteLink('');
    try {
      const res = await cpPortalAPI.inviteMember(invite);
      const link = res.data?.data?.invitationLink || res.data?.invitationLink || '';
      setInviteLink(link);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the invite.');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (userId) => {
    try { await cpPortalAPI.deactivateMember(userId); load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not deactivate the member.'); }
  };

  // SP5 — Performance tab. Gated by cp_analytics:view_team (only Owner /
  // Manager see it). The agents data is the same shape as the dashboard's
  // Agent Performance card.
  const canViewTeamPerf = useMemo(() => {
    const perms = user?.role?.permissions || user?.permissions || [];
    return Array.isArray(perms) && perms.includes('cp_analytics:view_team');
  }, [user]);

  const [tab, setTab] = useState(0); // 0 = Members, 1 = Performance
  const [agents, setAgents] = useState(null);
  const [agentsLoading, setAgentsLoading] = useState(false);

  useEffect(() => {
    if (tab !== 1 || !canViewTeamPerf) return;
    setAgentsLoading(true);
    cpAnalyticsAPI.getAgents({ range: '30d' })
      .then((r) => { setAgents(r.data?.data); setAgentsLoading(false); })
      .catch(() => { setAgents(null); setAgentsLoading(false); });
  }, [tab, canViewTeamPerf]);

  const fmtPct = (frac) => (typeof frac === 'number' ? `${Math.round(frac * 100)}%` : '—');
  const fmtMoneyIN = (v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Team</Typography>
        <Button variant="contained" startIcon={<PersonAdd />}
          onClick={() => { setInvite({ firstName: '', lastName: '', email: '', role: 'CP Agent' }); setInviteLink(''); setInviteOpen(true); }}>
          Invite member
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {canViewTeamPerf && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Members" />
          <Tab label="Performance" />
        </Tabs>
      )}

      {tab === 1 && canViewTeamPerf ? (
        <Box>
          {agentsLoading ? <Skeleton variant="rectangular" height={240} /> : (
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Agent</TableCell><TableCell align="right">Active</TableCell>
                <TableCell align="right">Booked</TableCell><TableCell align="right">Conversion</TableCell>
                <TableCell align="right">30d activity</TableCell><TableCell align="right">Commission</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(agents?.agents || []).map((a) => (
                  <TableRow key={String(a.userId)}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell align="right">{a.prospectsActive}</TableCell>
                    <TableCell align="right">{a.prospectsBooked}</TableCell>
                    <TableCell align="right">{fmtPct(a.conversionRate)}</TableCell>
                    <TableCell align="right">{a.activityVolume30d}</TableCell>
                    <TableCell align="right">{fmtMoneyIN(a.commissionGenerated)}</TableCell>
                    <TableCell align="right"><strong>{a.compositeScore}</strong></TableCell>
                  </TableRow>
                ))}
                {(agents?.agents || []).length === 0 && (
                  <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No agent activity yet.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <Box sx={{ mt: 2 }}>
            <AIInsightCard surface="agent_performance" range="30d" compact={false} />
          </Box>
        </Box>
      ) : (
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
          <TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {team.map((m) => (
            <TableRow key={m._id}>
              <TableCell>{m.firstName} {m.lastName}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.roleRef?.name || '—'}</TableCell>
              <TableCell>
                <Chip size="small"
                  label={m.invitationStatus === 'pending' ? 'Invited' : (m.isActive ? 'Active' : 'Inactive')}
                  color={m.invitationStatus === 'pending' ? 'warning' : (m.isActive ? 'success' : 'default')} />
              </TableCell>
              <TableCell align="right">
                {!m.roleRef?.isOwnerRole && m.isActive && String(m._id) !== String(user?._id) && (
                  <Tooltip title="Deactivate">
                    <IconButton size="small" onClick={() => deactivate(m._id)}><Block fontSize="small" /></IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invite a team member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {inviteLink ? (
            <Alert severity="success">
              Invite created. Share this link with the new member:
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <TextField fullWidth size="small" value={inviteLink} InputProps={{ readOnly: true }} />
                <IconButton onClick={() => navigator.clipboard?.writeText(inviteLink)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Alert>
          ) : (
            <>
              <TextField label="First name" value={invite.firstName}
                onChange={(e) => setInvite((i) => ({ ...i, firstName: e.target.value }))} />
              <TextField label="Last name" value={invite.lastName}
                onChange={(e) => setInvite((i) => ({ ...i, lastName: e.target.value }))} />
              <TextField label="Email" type="email" value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} />
              <TextField select label="Role" value={invite.role}
                onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value }))}>
                {INVITE_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Close</Button>
          {!inviteLink && (
            <Button variant="contained" onClick={submitInvite} disabled={busy}>
              {busy ? 'Creating…' : 'Create invite link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CpPortalTeamPage;

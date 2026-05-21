import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert,
  IconButton, Tooltip,
} from '@mui/material';
import { PersonAdd, Block, ContentCopy } from '@mui/icons-material';
import { cpPortalAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Avatar, Chip, Button, IconButton, Tooltip,
  CircularProgress, alpha, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, Checkbox, TextField,
  InputAdornment,
} from '@mui/material';
import { Add, Close, Search, PersonRemove, Warning } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAccessAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common';
import { formatDate, formatName } from '../../utils/formatters';

// ─── Add Users Modal ──────────────────────────────────────────────────────────
const AddUsersModal = ({ open, onClose, projectId, projectName, alreadyAssigned, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) { setSelected([]); setSearch(''); return; }
    setLoading(true);
    userAPI.getUsers({ status: 'active', limit: 100 })
      .then((res) => {
        const users = res.data?.data?.users || res.data?.data || res.data || [];
        setAllUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => enqueueSnackbar('Failed to load users', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [open, enqueueSnackbar]);

  const assignedIds = new Set(alreadyAssigned.map((a) => a.user?._id || a.user));
  const available = allUsers.filter(
    (u) => !assignedIds.has(u._id) &&
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await projectAccessAPI.bulkAssign(selected, [projectId]);
      enqueueSnackbar(`Added ${selected.length} member(s) to ${projectName}`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign users';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Add Team Members
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : available.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              {allUsers.length === 0 ? 'No users found' : 'All users already have access'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {available.map((user) => {
              const checked = selected.includes(user._id);
              return (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => toggleSelect(user._id)}
                  sx={{ px: 2, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.firstName} ${user.lastName}`}
                    secondary={user.roleRef?.name || user.role || user.email}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <Checkbox size="small" checked={checked} onChange={() => toggleSelect(user._id)} />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {selected.length} selected
        </Typography>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitting}
          startIcon={submitting ? <CircularProgress size={14} /> : <Add />}
        >
          Add Members
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
const ProjectTeamPanel = ({ projectId, projectName = 'this project' }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission, user: currentUser } = useAuth();

  const canManage = checkPermission ? checkPermission('project_access:manage') : false;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectAccessAPI.getProjectUsers(projectId);
      setMembers(res.data?.data || []);
    } catch {
      enqueueSnackbar('Failed to load team members', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [projectId, enqueueSnackbar]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRevoke = async (assignment) => {
    const userId = assignment.user?._id || assignment.user;
    setRevoking(userId);
    try {
      await projectAccessAPI.revokeUser(userId, projectId);
      enqueueSnackbar('Access revoked', { variant: 'success' });
      setMembers((prev) => prev.filter((m) => (m.user?._id || m.user) !== userId));
    } catch {
      enqueueSnackbar('Failed to revoke access', { variant: 'error' });
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {members.length} member{members.length !== 1 ? 's' : ''} with access
        </Typography>
        {canManage && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setAddOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Add Members
          </Button>
        )}
      </Box>

      {members.length === 0 ? (
        <EmptyState title="No team members" description="No users have been assigned to this project yet." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {members.map((assignment) => {
            const user = assignment.user || {};
            const userId = user._id || assignment.user;
            const name = formatName(user.firstName, user.lastName, { format: 'full' });
            const initials = formatName(user.firstName, user.lastName, { format: 'initials' });
            const assignedBy = assignment.assignedBy;
            const isSelf = userId === currentUser?._id;

            return (
              <Box
                key={assignment._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                  {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={600}>{name}</Typography>
                    {user.roleRef?.name && (
                      <Chip label={user.roleRef.name} size="small" sx={{ height: 18, fontSize: '0.625rem' }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Added by {assignedBy ? `${assignedBy.firstName} ${assignedBy.lastName}` : 'system'}
                    {assignment.assignedAt ? ` · ${formatDate(assignment.assignedAt, { format: 'medium' })}` : ''}
                  </Typography>
                </Box>
                {canManage && (
                  <Tooltip title={isSelf ? 'Remove your own access' : 'Revoke access'}>
                    <IconButton
                      size="small"
                      color={isSelf ? 'warning' : 'default'}
                      onClick={() => setConfirmRevoke(assignment)}
                      disabled={revoking === userId}
                    >
                      {revoking === userId ? <CircularProgress size={16} /> : <PersonRemove sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add Users Modal */}
      <AddUsersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        projectId={projectId}
        projectName={projectName}
        alreadyAssigned={members}
        onSuccess={fetchMembers}
      />

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {confirmRevoke?.user?._id === currentUser?._id && <Warning color="warning" />}
          Revoke Access
        </DialogTitle>
        <DialogContent>
          {confirmRevoke?.user?._id === currentUser?._id ? (
            <Typography variant="body2">
              You are about to remove your own access to <strong>{projectName}</strong>. You won't be able to see this project after this action.
            </Typography>
          ) : (
            <Typography variant="body2">
              Removing <strong>{formatName(confirmRevoke?.user?.firstName, confirmRevoke?.user?.lastName, { format: 'full' })}</strong> from <strong>{projectName}</strong> will hide all project data from them. Their existing work will NOT be deleted but they won't be able to see or edit it.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            color={confirmRevoke?.user?._id === currentUser?._id ? 'warning' : 'error'}
            onClick={() => handleRevoke(confirmRevoke)}
            disabled={!!revoking}
          >
            {revoking ? <CircularProgress size={14} /> : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTeamPanel;

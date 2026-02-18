import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton, Tooltip,
  TextField, InputAdornment, CircularProgress, alpha, useTheme,
  List, ListItem, ListItemAvatar, ListItemText, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Alert,
} from '@mui/material';
import {
  Search, Add, PersonRemove, FolderSpecial, Warning, Close,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAccessAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, EmptyState } from '../../components/common';
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
    if (!selected.length) return;
    setSubmitting(true);
    try {
      const res = await projectAccessAPI.bulkAssign(selected, [projectId]);
      enqueueSnackbar(
        res.data?.message || `Added ${selected.length} member(s) to ${projectName}`,
        { variant: 'success' }
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign users';
      enqueueSnackbar(msg, { variant: err.response?.status === 409 ? 'info' : 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Add Users to {projectName}
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Search users..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : available.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {allUsers.length === 0 ? 'No users found' : 'All users already have access'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {available.map((user) => (
              <ListItem key={user._id} button onClick={() => toggleSelect(user._id)} sx={{ px: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.roleRef?.name || user.email}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Checkbox size="small" checked={selected.includes(user._id)} onChange={() => toggleSelect(user._id)} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>{selected.length} selected</Typography>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained" size="small" onClick={handleSubmit}
          disabled={!selected.length || submitting}
          startIcon={submitting ? <CircularProgress size={14} /> : <Add />}
        >
          Add Users
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectAccessPage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission, user: currentUser } = useAuth();

  const canManage = checkPermission ? checkPermission('project_access:manage') : false;

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  // Load projects the current user has access to
  useEffect(() => {
    projectAccessAPI.getMyProjects()
      .then((res) => {
        const assignments = res.data?.data || [];
        setProjects(assignments.map((a) => a.project).filter(Boolean));
      })
      .catch(() => enqueueSnackbar('Failed to load projects', { variant: 'error' }))
      .finally(() => setLoadingProjects(false));
  }, [enqueueSnackbar]);

  // Load members for selected project
  const fetchMembers = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoadingMembers(true);
    try {
      const res = await projectAccessAPI.getProjectUsers(projectId);
      setMembers(res.data?.data || []);
    } catch {
      enqueueSnackbar('Failed to load team members', { variant: 'error' });
    } finally {
      setLoadingMembers(false);
    }
  }, [enqueueSnackbar]);

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    fetchMembers(project._id);
  };

  const handleRevoke = async (assignment) => {
    const userId = assignment.user?._id || assignment.user;
    setRevoking(userId);
    try {
      await projectAccessAPI.revokeUser(userId, selectedProject._id);
      enqueueSnackbar('Access revoked', { variant: 'success' });
      setMembers((prev) => prev.filter((m) => (m.user?._id || m.user) !== userId));
    } catch {
      enqueueSnackbar('Failed to revoke access', { variant: 'error' });
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <Box>
      <PageHeader
        title="Project Access"
        subtitle="Manage who has access to each project"
      />

      <Box sx={{ display: 'flex', gap: 2, minHeight: 500 }}>
        {/* Left Panel — Project List */}
        <Paper
          elevation={0}
          sx={{
            width: 240,
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <TextField
              size="small" fullWidth placeholder="Search projects..."
              value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16 }} /></InputAdornment> }}
              inputProps={{ style: { fontSize: '0.8125rem' } }}
            />
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loadingProjects ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : filteredProjects.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {projects.length === 0 ? 'No projects available' : 'No results'}
                </Typography>
              </Box>
            ) : (
              filteredProjects.map((project) => {
                const isSelected = selectedProject?._id === project._id;
                return (
                  <Box
                    key={project._id}
                    onClick={() => handleSelectProject(project)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      borderLeft: `3px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                      '&:hover': { bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'action.hover' },
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderSpecial sx={{ fontSize: 16, color: isSelected ? 'primary.main' : 'text.secondary' }} />
                      <Typography
                        variant="body2"
                        fontWeight={isSelected ? 700 : 500}
                        color={isSelected ? 'primary.main' : 'text.primary'}
                        noWrap
                      >
                        {project.name}
                      </Typography>
                    </Box>
                    {project.location?.city && (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>{project.location.city}</Typography>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Right Panel — Users with Access */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!selectedProject ? (
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                <FolderSpecial sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                <Typography variant="body2">Select a project to manage access</Typography>
              </Box>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {/* Panel header */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedProject.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {members.length} member{members.length !== 1 ? 's' : ''} with access
                  </Typography>
                </Box>
                {canManage && (
                  <Button
                    size="small" variant="contained" startIcon={<Add />}
                    onClick={() => setAddOpen(true)} sx={{ textTransform: 'none' }}
                  >
                    Add Users
                  </Button>
                )}
              </Box>

              {/* Members list */}
              <Box sx={{ p: 2 }}>
                {loadingMembers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
                ) : members.length === 0 ? (
                  <EmptyState title="No members assigned" description="No users have been assigned to this project." />
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
                                {revoking === userId
                                  ? <CircularProgress size={16} />
                                  : <PersonRemove sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Add Users Modal */}
      {selectedProject && (
        <AddUsersModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          projectId={selectedProject._id}
          projectName={selectedProject.name}
          alreadyAssigned={members}
          onSuccess={() => fetchMembers(selectedProject._id)}
        />
      )}

      {/* Revoke Confirmation */}
      <Dialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {confirmRevoke?.user?._id === currentUser?._id && <Warning color="warning" />}
          Revoke Access
        </DialogTitle>
        <DialogContent>
          {confirmRevoke?.user?._id === currentUser?._id ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>You are removing your own access to this project.</Alert>
              <Typography variant="body2">
                After revoking, you won't be able to see <strong>{selectedProject?.name}</strong> until someone re-assigns you.
              </Typography>
            </>
          ) : (
            <Typography variant="body2">
              Removing{' '}
              <strong>{formatName(confirmRevoke?.user?.firstName, confirmRevoke?.user?.lastName, { format: 'full' })}</strong>{' '}
              from <strong>{selectedProject?.name}</strong> will hide all project data from them. Their existing work will NOT be deleted but they won't be able to see or edit it. This can be reversed by re-assigning them.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button
            size="small" variant="contained"
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

export default ProjectAccessPage;

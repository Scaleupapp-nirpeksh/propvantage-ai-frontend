import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer, Box, Typography, Avatar, Chip, Button, IconButton, Alert,
  CircularProgress, alpha, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText,
  Checkbox, TextField, InputAdornment, Divider,
} from '@mui/material';
import { Close, Search, WorkOff, EditOutlined } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAccessAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common';
import { formatDate } from '../../utils/formatters';

// ─── Edit Access Modal ─────────────────────────────────────────────────────────
const EditAccessModal = ({ open, onClose, userId, userName, assignments, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [myProjects, setMyProjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setLoading(true);
    projectAccessAPI.getMyProjects()
      .then((res) => {
        const projects = (res.data?.data || []).map((a) => a.project).filter(Boolean);
        setMyProjects(projects);
        // Pre-check existing assignments
        const currentIds = new Set(assignments.map((a) => a.project?._id || a.project));
        setSelectedIds(projects.filter((p) => currentIds.has(p._id)).map((p) => p._id));
      })
      .catch(() => enqueueSnackbar('Failed to load projects', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [open, assignments, enqueueSnackbar]);

  const toggle = (id) => setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await projectAccessAPI.syncUserProjects(userId, selectedIds);
      enqueueSnackbar(`Project access updated for ${userName}`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update access', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = myProjects.filter((p) =>
    `${p.name} ${p.location?.city || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Edit Project Access
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Check the projects <strong>{userName}</strong> should have access to. Unchecking all removes all project access.
        </Typography>
        {selectedIds.length === 0 && !loading && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            This user will not be able to see any projects.
          </Alert>
        )}
        <TextField
          size="small"
          placeholder="Search projects..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ mb: 1 }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : myProjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">No accessible projects</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {filtered.map((project) => {
              const checked = selectedIds.includes(project._id);
              return (
                <ListItem
                  key={project._id}
                  button
                  onClick={() => toggle(project._id)}
                  sx={{ px: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Checkbox size="small" checked={checked} onChange={() => toggle(project._id)} disableRipple sx={{ mr: 1 }} />
                  <ListItemText
                    primary={project.name}
                    secondary={project.location?.city || project.type}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
          {selectedIds.length} of {myProjects.length} project{myProjects.length !== 1 ? 's' : ''} selected
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={14} /> : null}
        >
          Save Access
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Drawer ──────────────────────────────────────────────────────────────
const UserProjectsDrawer = ({ userId, userName, open, onClose }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();

  const canManage = checkPermission ? checkPermission('project_access:manage') : false;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!userId || !open) return;
    setLoading(true);
    try {
      const res = await projectAccessAPI.getUserProjects(userId);
      setAssignments(res.data?.data || []);
    } catch {
      enqueueSnackbar('Failed to load project assignments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [userId, open, enqueueSnackbar]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 0 } }}
      >
        {/* Header */}
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Project Access</Typography>
            <Typography variant="body2" color="text.secondary">{userName}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}><Close /></IconButton>
        </Box>
        <Divider />

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : assignments.length === 0 ? (
            <EmptyState
              title="No projects assigned"
              description="This user has not been assigned to any projects yet."
              icon={WorkOff}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {assignments.map((assignment) => {
                const project = assignment.project || {};
                const assignedBy = assignment.assignedBy;

                return (
                  <Box
                    key={assignment._id}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Avatar
                        variant="rounded"
                        sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                      >
                        {project.name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight={600}>{project.name}</Typography>
                          {project.type && (
                            <Chip label={project.type} size="small" sx={{ height: 18, fontSize: '0.625rem', textTransform: 'capitalize' }} />
                          )}
                        </Box>
                        {project.location?.city && (
                          <Typography variant="caption" color="text.secondary">{project.location.city}</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          Added by {assignedBy ? `${assignedBy.firstName} ${assignedBy.lastName}` : 'system'}
                          {assignment.assignedAt ? ` · ${formatDate(assignment.assignedAt, { format: 'medium' })}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Footer */}
        {canManage && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EditOutlined />}
                onClick={() => setEditOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Edit Access
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      {/* Edit Access Modal */}
      <EditAccessModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        userId={userId}
        userName={userName}
        assignments={assignments}
        onSuccess={fetchAssignments}
      />
    </>
  );
};

export default UserProjectsDrawer;

// File: src/pages/settings/RoleDetailPage.js
// Role detail view — read-only display of role info, permissions, and actions

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Grid,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  Edit,
  ContentCopy,
  Delete,
  ArrowBack,
  Shield,
  People,
  Star,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { rolesAPI } from '../../services/api';
import { PageHeader, ConfirmDialog } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';

const getLevelColor = (level, theme) => {
  if (level === 0) return theme.palette.error.main;
  if (level <= 2) return theme.palette.warning.main;
  if (level <= 3) return theme.palette.info.main;
  if (level <= 5) return theme.palette.primary.main;
  return theme.palette.grey[500];
};

const RoleDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roleId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPerm, roleLevel, isOwner } = useAuth();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRole = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getRole(roleId);
      setRole(response.data?.data?.role || response.data?.role || response.data);
    } catch (err) {
      enqueueSnackbar('Failed to load role details', { variant: 'error' });
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  }, [roleId, enqueueSnackbar, navigate]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const canEdit = role && !role.isOwnerRole && (isOwner || role.level > roleLevel);
  const canDelete = role && !role.isOwnerRole && (role.userCount || 0) === 0 && (isOwner || role.level > roleLevel);

  const handleDuplicate = async () => {
    try {
      await rolesAPI.duplicateRole(roleId);
      enqueueSnackbar('Role duplicated successfully', { variant: 'success' });
      navigate('/roles');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to duplicate role', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await rolesAPI.deleteRole(roleId);
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
      navigate('/roles');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete role', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  // Group permissions by module for display
  const permissionsByModule = (role?.permissions || []).reduce((acc, perm) => {
    const [mod] = perm.split(':');
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  if (loading) return <DetailPageSkeleton />;
  if (!role) return null;

  const levelColor = getLevelColor(role.level, theme);

  return (
    <Box>
      <PageHeader
        title={role.name}
        subtitle={role.description || 'No description'}
        icon={AdminPanelSettings}
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/roles')}
            >
              Back
            </Button>
            {checkPerm('roles:update') && canEdit && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={() => navigate(`/roles/${roleId}/edit`)}
              >
                Edit
              </Button>
            )}
            {checkPerm('roles:create') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopy />}
                onClick={handleDuplicate}
              >
                Duplicate
              </Button>
            )}
            {checkPerm('roles:delete') && canDelete && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Delete />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete
              </Button>
            )}
          </Box>
        }
      />

      {/* Role info cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: alpha(levelColor, 0.1),
                color: levelColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1,
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {role.level}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Hierarchy Level
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              <People sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="h6">{role.userCount || 0}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Assigned Users
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              <Shield sx={{ fontSize: 20, color: 'info.main' }} />
              <Typography variant="h6">{(role.permissions || []).length}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Permissions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap', mb: 1 }}>
              {role.isOwnerRole && (
                <Chip icon={<Star sx={{ fontSize: 14 }} />} label="Owner" size="small" color="warning" />
              )}
              {role.isDefault ? (
                <Chip label="Default" size="small" variant="outlined" />
              ) : (
                <Chip label="Custom" size="small" color="primary" variant="outlined" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Role Type
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Permissions grouped by module */}
      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Permissions ({(role.permissions || []).length})
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {Object.keys(permissionsByModule).length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
            No permissions assigned
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(permissionsByModule).map(([mod, perms]) => (
              <Box key={mod}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    letterSpacing: '0.05em',
                    mb: 0.75,
                    display: 'block',
                  }}
                >
                  {mod} ({perms.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {perms.map((perm) => {
                    const action = perm.split(':')[1];
                    return (
                      <Chip
                        key={perm}
                        label={action}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          fontWeight: 500,
                          fontSize: '0.688rem',
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        title="Delete Role"
        message={`Are you sure you want to delete "${role.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </Box>
  );
};

export default RoleDetailPage;

// File: src/pages/settings/RolesListPage.js
// Description: Roles list page showing all organization roles as cards in a grid

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper,
  Fade,
} from '@mui/material';
import {
  AdminPanelSettings,
  Add,
  Edit,
  ContentCopy,
  Delete,
  MoreVert,
  Shield,
  Star,
  People,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { rolesAPI } from '../../services/api';
import { PageHeader, ConfirmDialog, EmptyState } from '../../components/common';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';

// -- Helpers ----------------------------------------------------------------

/** Returns a color based on the role level (lower = more powerful = warmer). */
const getLevelColor = (level, theme) => {
  if (level === 0) return theme.palette.error.main;
  if (level <= 2) return theme.palette.warning.main;
  if (level === 3) return theme.palette.info.main;
  if (level <= 5) return theme.palette.primary.main;
  return theme.palette.grey[500];
};

/** Returns a human-readable label for a given level. */
const getLevelLabel = (level) => {
  if (level === 0) return 'Super';
  if (level === 1) return 'Admin';
  if (level === 2) return 'Manager';
  if (level === 3) return 'Lead';
  if (level <= 5) return 'Standard';
  return 'Basic';
};

// -- Role Card Component ----------------------------------------------------

const RoleCard = ({
  role,
  currentRoleLevel,
  isCurrentUserOwner,
  canCreate,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const {
    _id,
    name,
    description,
    level,
    isOwnerRole,
    isDefault,
    userCount = 0,
  } = role;

  const levelColor = getLevelColor(level, theme);

  // Permission checks for card actions
  const canEdit = !(isOwnerRole || level <= currentRoleLevel);
  const canDelete =
    !isOwnerRole && userCount === 0 && level > currentRoleLevel;

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(_id);
  };

  const handleDuplicate = () => {
    handleMenuClose();
    onDuplicate(_id, name);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(role);
  };

  return (
    <Fade in timeout={300}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          position: 'relative',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          borderColor: isOwnerRole
            ? alpha(theme.palette.warning.main, 0.5)
            : 'divider',
          '&:hover': {
            boxShadow: theme.shadows[3],
            borderColor: isOwnerRole
              ? theme.palette.warning.main
              : theme.palette.primary.main,
          },
        }}
      >
        {/* Top row: level badge + name + menu */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          {/* Level circle */}
          <Tooltip title={`Level ${level} - ${getLevelLabel(level)}`}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: alpha(levelColor, 0.12),
                color: levelColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {level}
            </Box>
          </Tooltip>

          {/* Name & description */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </Typography>
              {isOwnerRole && (
                <Star
                  sx={{
                    fontSize: 16,
                    color: theme.palette.warning.main,
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 40,
              }}
            >
              {description || 'No description provided'}
            </Typography>
          </Box>

          {/* Actions menu */}
          <IconButton size="small" onClick={handleMenuOpen} sx={{ mt: -0.5 }}>
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: { sx: { minWidth: 160 } },
            }}
          >
            <MenuItem onClick={handleEdit} disabled={!canEdit}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            {canCreate && (
              <MenuItem onClick={handleDuplicate}>
                <ListItemIcon>
                  <ContentCopy fontSize="small" />
                </ListItemIcon>
                <ListItemText>Duplicate</ListItemText>
              </MenuItem>
            )}
            <MenuItem
              onClick={handleDelete}
              disabled={!canDelete}
              sx={{ color: canDelete ? 'error.main' : undefined }}
            >
              <ListItemIcon>
                <Delete
                  fontSize="small"
                  color={canDelete ? 'error' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>
        </Box>

        {/* Bottom row: badges + user count */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {isOwnerRole && (
              <Chip
                icon={<Shield sx={{ fontSize: '14px !important' }} />}
                label="Owner"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.dark,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                }}
              />
            )}
            {isDefault && !isOwnerRole && (
              <Chip
                label="Default"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: theme.palette.info.dark,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                }}
              />
            )}
            {!isDefault && !isOwnerRole && (
              <Chip
                label="Custom"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.dark,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                }}
              />
            )}
          </Box>

          <Tooltip title={`${userCount} user${userCount !== 1 ? 's' : ''} assigned`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'text.secondary',
              }}
            >
              <People sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {userCount}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Paper>
    </Fade>
  );
};

// -- Main Page Component ----------------------------------------------------

const RolesListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPerm, roleLevel, isOwner } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Permission flags
  const canCreate = checkPerm('roles:create');

  // -- Data Fetching --

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rolesAPI.getRoles();
      const data = response.data?.data?.roles || response.data?.roles || [];
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      enqueueSnackbar('Failed to load roles', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // -- Handlers --

  const handleEdit = useCallback(
    (roleId) => {
      navigate(`/roles/${roleId}/edit`);
    },
    [navigate]
  );

  const handleDuplicate = useCallback(
    async (roleId, roleName) => {
      try {
        await rolesAPI.duplicateRole(roleId);
        enqueueSnackbar(`"${roleName}" duplicated successfully`, {
          variant: 'success',
        });
        fetchRoles();
      } catch (err) {
        console.error('Failed to duplicate role:', err);
        enqueueSnackbar(
          err.response?.data?.message || 'Failed to duplicate role',
          { variant: 'error' }
        );
      }
    },
    [enqueueSnackbar, fetchRoles]
  );

  const handleDeleteRequest = useCallback((role) => {
    setDeleteTarget(role);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    // Guard: cannot delete if users are assigned
    if (deleteTarget.userCount > 0) {
      enqueueSnackbar(
        `Reassign ${deleteTarget.userCount} user${deleteTarget.userCount !== 1 ? 's' : ''} first`,
        { variant: 'error' }
      );
      setDeleteTarget(null);
      return;
    }

    try {
      setDeleteLoading(true);
      await rolesAPI.deleteRole(deleteTarget._id);
      enqueueSnackbar(`"${deleteTarget.name}" deleted`, {
        variant: 'success',
      });
      setDeleteTarget(null);
      fetchRoles();
    } catch (err) {
      console.error('Failed to delete role:', err);
      enqueueSnackbar(
        err.response?.data?.message || 'Failed to delete role',
        { variant: 'error' }
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, enqueueSnackbar, fetchRoles]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleCreate = useCallback(() => {
    navigate('/roles/create');
  }, [navigate]);

  // -- Render --

  return (
    <Box>
      <PageHeader
        icon={AdminPanelSettings}
        title="Roles & Permissions"
        subtitle="Manage organization roles and access levels"
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
              size={isMobile ? 'small' : 'medium'}
            >
              Create Role
            </Button>
          )
        }
      />

      {/* Loading state */}
      {loading && <CardGridSkeleton count={6} />}

      {/* Empty state */}
      {!loading && roles.length === 0 && (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description="Create your first role to start managing access levels and permissions for your organization."
          action={
            canCreate
              ? {
                  label: 'Create Role',
                  onClick: handleCreate,
                  icon: <Add />,
                }
              : undefined
          }
        />
      )}

      {/* Roles grid */}
      {!loading && roles.length > 0 && (
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={role._id}
            >
              <RoleCard
                role={role}
                currentRoleLevel={roleLevel}
                isCurrentUserOwner={isOwner}
                canCreate={canCreate}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDeleteRequest}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Role"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete the "${deleteTarget.name}" role? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};

export default RolesListPage;

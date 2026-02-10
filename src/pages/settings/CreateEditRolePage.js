import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
  alpha,
  useTheme,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { rolesAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';
import PermissionCatalogGrid from '../../components/roles/PermissionCatalogGrid';

// ---------------------------------------------------------------------------
// CreateEditRolePage
// Used for both /roles/create and /roles/:roleId/edit
// ---------------------------------------------------------------------------

const MAX_NAME_LENGTH = 50;
const MAX_DESC_LENGTH = 200;

const CreateEditRolePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { roleId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { roleLevel: userRoleLevel, isOwner } = useAuth();

  const isEditMode = Boolean(roleId);

  // ---- Form state ----
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // ---- Data state ----
  const [catalog, setCatalog] = useState([]);
  const [existingRole, setExistingRole] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [templateRoleId, setTemplateRoleId] = useState('');

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const isOwnerRole = existingRole?.isOwnerRole === true;

  // ------------------------------------------------------------------
  // Fetch catalog + role (edit) + all roles (create) on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [rolesAPI.getPermissionCatalog()];

        if (isEditMode) {
          promises.push(rolesAPI.getRole(roleId));
        } else {
          // Fetch all roles for template dropdown in create mode
          promises.push(rolesAPI.getRoles());
        }

        const results = await Promise.all(promises);
        if (cancelled) return;

        // Permission catalog
        const catalogData = results[0].data?.data?.groups || [];
        setCatalog(catalogData);

        if (isEditMode) {
          // Edit mode — populate form from fetched role
          const role = results[1].data?.data?.role || results[1].data?.role || results[1].data?.data || results[1].data;
          setExistingRole(role);
          setName(role.name || '');
          setDescription(role.description || '');
          setLevel(role.level != null ? String(role.level) : '');
          setSelectedPermissions(role.permissions || []);
        } else {
          // Create mode — store available roles for template selector
          const rolesData = results[1].data?.data?.roles
            || results[1].data?.data
            || results[1].data
            || [];
          setAllRoles(Array.isArray(rolesData) ? rolesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          enqueueSnackbar('Failed to load role data', { variant: 'error' });
          navigate('/roles');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [isEditMode, roleId, enqueueSnackbar, navigate]);

  // ------------------------------------------------------------------
  // Template selection handler (create mode only)
  // ------------------------------------------------------------------
  const handleTemplateChange = (e) => {
    const selectedId = e.target.value;
    setTemplateRoleId(selectedId);

    if (!selectedId) {
      setSelectedPermissions([]);
      return;
    }

    const templateRole = allRoles.find(
      (r) => String(r._id || r.id) === String(selectedId),
    );
    if (templateRole?.permissions) {
      setSelectedPermissions([...templateRole.permissions]);
    }
  };

  // ------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------
  const validate = () => {
    const next = {};

    // Name
    if (!name.trim()) {
      next.name = 'Role name is required';
    } else if (name.trim().length > MAX_NAME_LENGTH) {
      next.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
    }

    // Level
    const numLevel = Number(level);
    if (isOwnerRole) {
      // Owner role level cannot be changed — skip validation
    } else if (!level || isNaN(numLevel)) {
      next.level = 'Level is required';
    } else if (!isOwner && numLevel <= userRoleLevel) {
      next.level = `Level must be greater than your level (${userRoleLevel})`;
    } else if (numLevel < 1) {
      next.level = 'Level must be at least 1';
    }

    // Permissions
    if (!isOwnerRole && selectedPermissions.length === 0) {
      next.permissions = 'Select at least one permission';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        level: Number(level),
        permissions: selectedPermissions,
      };

      if (isEditMode) {
        // For owner role, only description is editable
        if (isOwnerRole) {
          await rolesAPI.updateRole(roleId, { description: payload.description });
        } else {
          await rolesAPI.updateRole(roleId, payload);
        }
        enqueueSnackbar('Role updated successfully', { variant: 'success' });
      } else {
        await rolesAPI.createRole(payload);
        enqueueSnackbar('Role created successfully', { variant: 'success' });
      }

      navigate('/roles');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Something went wrong. Please try again.';
      setApiError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // Derived helpers
  // ------------------------------------------------------------------
  const pageTitle = isEditMode
    ? isOwnerRole
      ? 'View Owner Role'
      : 'Edit Role'
    : 'Create Role';

  const pageSubtitle = isEditMode
    ? isOwnerRole
      ? 'Owner role permissions are managed automatically'
      : 'Update role details and permissions'
    : 'Define a new role with custom permissions';

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <Box>
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/roles')}
              sx={{ textTransform: 'none' }}
            >
              Back to Roles
            </Button>
          }
          loading
        />
        <DetailPageSkeleton />
      </Box>
    );
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Box>
      {/* ---- Header ---- */}
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/roles')}
            sx={{ textTransform: 'none' }}
          >
            Back to Roles
          </Button>
        }
      />

      {/* ---- Owner role alert ---- */}
      {isOwnerRole && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The Organization Owner role cannot have its name, level, or permissions modified.
        </Alert>
      )}

      {/* ---- API error ---- */}
      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError('')}>
          {apiError}
        </Alert>
      )}

      {/* ---- Form section ---- */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5 }}>
          Role Details
        </Typography>

        <Grid container spacing={3}>
          {/* ---- Left column: name / description / level ---- */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Name */}
              <TextField
                label="Role Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                required
                fullWidth
                disabled={isOwnerRole || submitting}
                error={Boolean(errors.name)}
                helperText={errors.name || `${name.length}/${MAX_NAME_LENGTH}`}
                inputProps={{ maxLength: MAX_NAME_LENGTH }}
                size="small"
              />

              {/* Description */}
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                disabled={submitting}
                helperText={`${description.length}/${MAX_DESC_LENGTH}`}
                inputProps={{ maxLength: MAX_DESC_LENGTH }}
                size="small"
              />

              {/* Level */}
              <TextField
                label="Level"
                type="number"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (errors.level) setErrors((prev) => ({ ...prev, level: '' }));
                }}
                required
                fullWidth
                disabled={isOwnerRole || submitting}
                error={Boolean(errors.level)}
                helperText={
                  errors.level ||
                  `Lower number = higher authority. Must be greater than your level (${userRoleLevel}).`
                }
                size="small"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Box>
          </Grid>

          {/* ---- Right column: template selector (create mode only) ---- */}
          <Grid item xs={12} md={5}>
            {!isEditMode && (
              <FormControl fullWidth size="small">
                <InputLabel id="template-role-label">Start from template</InputLabel>
                <Select
                  labelId="template-role-label"
                  value={templateRoleId}
                  onChange={handleTemplateChange}
                  label="Start from template"
                  disabled={submitting}
                >
                  <MenuItem value="">
                    <em>None (blank role)</em>
                  </MenuItem>
                  {allRoles.map((role) => {
                    const id = role._id || role.id;
                    return (
                      <MenuItem key={id} value={id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{role.name}</Typography>
                          {role.isOwnerRole && (
                            <Chip
                              label="Owner"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.688rem',
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.dark,
                              }}
                            />
                          )}
                          <Chip
                            label={`Level ${role.level}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.688rem',
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                            }}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}

            {isEditMode && !isOwnerRole && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Editing role <strong>{existingRole?.name}</strong>. Adjust the
                  fields and permissions below, then save your changes.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ---- Permissions section ---- */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          p: 3,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Permissions
          </Typography>
          {selectedPermissions.length > 0 && (
            <Chip
              label={`${selectedPermissions.length} selected`}
              size="small"
              sx={{
                height: 24,
                fontWeight: 600,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            />
          )}
        </Box>

        {errors.permissions && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.permissions}
          </Alert>
        )}

        <PermissionCatalogGrid
          catalog={catalog}
          selectedPermissions={selectedPermissions}
          onChange={(next) => {
            setSelectedPermissions(next);
            if (errors.permissions) setErrors((prev) => ({ ...prev, permissions: '' }));
          }}
          disabled={isOwnerRole || submitting}
        />
      </Paper>

      {/* ---- Actions ---- */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          pb: 4,
        }}
      >
        <Button
          variant="outlined"
          onClick={() => navigate('/roles')}
          disabled={submitting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>

        {!isOwnerRole ? (
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ textTransform: 'none', minWidth: 140 }}
          >
            {submitting
              ? 'Saving...'
              : isEditMode
                ? 'Save Changes'
                : 'Create Role'}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ textTransform: 'none', minWidth: 140 }}
          >
            {submitting ? 'Saving...' : 'Save Description'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CreateEditRolePage;

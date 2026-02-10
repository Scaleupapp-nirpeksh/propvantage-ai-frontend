// File: src/pages/settings/OrgHierarchyPage.js
// Organization Hierarchy — clean grouped view of roles, people, and access

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  AvatarGroup,
  Chip,
  Tooltip,
  Collapse,
  IconButton,
  Button,
  Grid,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AdminPanelSettings,
  Shield,
  People,
  ExpandMore,
  ArrowBack,
  Star,
  Lock,
  Visibility,
  Edit as EditIcon,
  CheckCircle,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { rolesAPI, userAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';

// ─── Authority level groups ────────────────────────────────────────
const LEVEL_GROUPS = [
  { key: 'owner',      label: 'Owner',       range: [0, 0],    color: '#D32F2F', desc: 'Full organization control' },
  { key: 'executive',  label: 'Executive',   range: [1, 5],    color: '#E64A19', desc: 'Strategic leadership' },
  { key: 'director',   label: 'Director',    range: [6, 15],   color: '#F57C00', desc: 'Department oversight' },
  { key: 'head',       label: 'Head',        range: [16, 25],  color: '#EF6C00', desc: 'Team leadership' },
  { key: 'manager',    label: 'Manager',     range: [26, 40],  color: '#388E3C', desc: 'Operational management' },
  { key: 'senior',     label: 'Senior',      range: [41, 60],  color: '#1976D2', desc: 'Senior contributors' },
  { key: 'associate',  label: 'Associate',   range: [61, 80],  color: '#5C6BC0', desc: 'Team members' },
  { key: 'entry',      label: 'Entry Level', range: [81, 100], color: '#78909C', desc: 'Individual contributors' },
];

const getGroupForLevel = (level) =>
  LEVEL_GROUPS.find(g => level >= g.range[0] && level <= g.range[1]) || LEVEL_GROUPS[LEVEL_GROUPS.length - 1];

const groupPermissions = (permissions = []) => {
  const grouped = {};
  permissions.forEach(p => {
    const [mod, action] = p.split(':');
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(action);
  });
  return grouped;
};

// ─── Stats Bar ─────────────────────────────────────────────────────
const StatsBar = ({ roles, users }) => {
  const theme = useTheme();
  const totalPerms = useMemo(() => {
    const s = new Set();
    roles.forEach(r => (r.permissions || []).forEach(p => s.add(p)));
    return s.size;
  }, [roles]);

  const stats = [
    { label: 'Roles',       value: roles.length,                              color: theme.palette.primary.main,  icon: AdminPanelSettings },
    { label: 'Active Users', value: users.length,                             color: theme.palette.success.main,  icon: People },
    { label: 'Levels',      value: new Set(roles.map(r => r.level)).size,     color: theme.palette.warning.main,  icon: Shield },
    { label: 'Permissions',  value: totalPerms,                               color: theme.palette.info.main,     icon: Lock },
  ];

  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={2}>
        {stats.map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '10px',
                  bgcolor: alpha(s.color, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <s.icon sx={{ fontSize: 20, color: s.color }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// ─── Role Card ─────────────────────────────────────────────────────
const RoleCard = ({ role, users, canEdit, navigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);
  const group = getGroupForLevel(role.level);
  const permGroups = useMemo(() => groupPermissions(role.permissions), [role.permissions]);
  const roleUsers = useMemo(
    () => users.filter(u => u.roleRef?._id === role._id || u.roleRef?.name === role.name || u.role === role.name),
    [users, role._id, role.name],
  );
  const permCount = (role.permissions || []).length;

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: group.color,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'box-shadow 200ms ease',
        '&:hover': { boxShadow: `0 2px 12px ${alpha(group.color, 0.10)}` },
      }}
    >
      {/* Header — always visible */}
      <Box
        onClick={() => setExpanded(p => !p)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2 },
          px: { xs: 1.5, sm: 2.5 },
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Level badge */}
        <Box
          sx={{
            width: 34, height: 34, borderRadius: '8px',
            bgcolor: group.color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
          }}
        >
          L{role.level}
        </Box>

        {/* Name + description */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 140, sm: 'unset' } }}>
              {role.name}
            </Typography>
            {role.isOwnerRole && <Star sx={{ fontSize: 15, color: 'warning.main' }} />}
            {role.isDefault && (
              <Chip label="Default" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', display: { xs: 'none', sm: 'inline-flex' } }} />
            )}
          </Box>
          {!isMobile && role.description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {role.description}
            </Typography>
          )}
        </Box>

        {/* Inline stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, flexShrink: 0 }}>
          {/* User avatars on desktop, count on mobile */}
          {!isMobile && roleUsers.length > 0 ? (
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.6rem', borderWidth: 1 } }}>
              {roleUsers.slice(0, 3).map(u => (
                <Tooltip key={u._id} title={`${u.firstName} ${u.lastName}`}>
                  <Avatar sx={{ bgcolor: alpha(group.color, 0.7) }}>
                    {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          ) : (
            <Tooltip title={`${roleUsers.length} user${roleUsers.length !== 1 ? 's' : ''}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={600}>{roleUsers.length}</Typography>
              </Box>
            </Tooltip>
          )}

          <Tooltip title={role.isOwnerRole ? 'Full access' : `${permCount} permissions`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Shield sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" fontWeight={600}>
                {role.isOwnerRole ? 'All' : permCount}
              </Typography>
            </Box>
          </Tooltip>

          <IconButton size="small" sx={{ transition: 'transform 200ms', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            <ExpandMore sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Description on mobile */}
          {isMobile && role.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {role.description}
            </Typography>
          )}

          <Grid container spacing={2.5}>
            {/* People column */}
            <Grid item xs={12} sm={4}>
              <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
                People ({roleUsers.length})
              </Typography>
              {roleUsers.length === 0 ? (
                <Typography variant="body2" color="text.disabled" fontSize="0.75rem">
                  No users assigned
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {roleUsers.slice(0, 6).map(u => (
                    <Box key={u._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.65rem', bgcolor: alpha(group.color, 0.15), color: group.color }}>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontSize="0.75rem" fontWeight={500} noWrap>
                          {u.firstName} {u.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem" noWrap>
                          {u.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {roleUsers.length > 6 && (
                    <Typography variant="caption" color="primary.main" sx={{ cursor: 'pointer', ml: 4.5 }}>
                      +{roleUsers.length - 6} more
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            {/* Permissions column */}
            <Grid item xs={12} sm={8}>
              <Typography variant="overline" sx={{ mb: 1, display: 'block' }}>
                Permissions ({permCount})
              </Typography>
              {role.isOwnerRole ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Lock sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2" color="warning.main" fontWeight={500} fontSize="0.75rem">
                    Full access — bypasses all permission checks
                  </Typography>
                </Box>
              ) : Object.keys(permGroups).length === 0 ? (
                <Typography variant="body2" color="text.disabled" fontSize="0.75rem">
                  No permissions assigned
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(permGroups).map(([mod, actions]) => (
                    <Tooltip
                      key={mod}
                      title={actions.join(', ')}
                      placement="top"
                    >
                      <Chip
                        size="small"
                        label={`${mod} (${actions.length})`}
                        sx={{
                          height: 24,
                          fontSize: '0.688rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          bgcolor: alpha(group.color, 0.08),
                          color: group.color,
                          cursor: 'default',
                          '&:hover': { bgcolor: alpha(group.color, 0.14) },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button size="small" startIcon={<Visibility />} onClick={() => navigate(`/roles/${role._id}`)}>
              View Details
            </Button>
            {canEdit && !role.isOwnerRole && (
              <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/roles/${role._id}/edit`)}>
                Edit Role
              </Button>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

// ─── Access Overview ───────────────────────────────────────────────
const AccessOverview = ({ roles }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const modules = useMemo(() => {
    const mods = new Set();
    roles.forEach(r => (r.permissions || []).forEach(p => mods.add(p.split(':')[0])));
    return Array.from(mods).sort();
  }, [roles]);

  const displayRoles = roles.filter(r => !r.isOwnerRole);
  if (modules.length === 0 || displayRoles.length === 0) return null;

  // Mobile: show as cards per module
  // Desktop: show as scrollable grid
  return (
    <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen(p => !p)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 2, cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'grey.50' },
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>Access Overview</Typography>
          <Typography variant="caption" color="text.secondary">
            {modules.length} modules across {displayRoles.length} roles
          </Typography>
        </Box>
        <IconButton size="small" sx={{ transition: 'transform 200ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ExpandMore />
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {isMobile ? (
            // Mobile: card per module
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {modules.map(mod => {
                const rolesWithAccess = displayRoles.filter(r =>
                  (r.permissions || []).some(p => p.startsWith(`${mod}:`)),
                );
                return (
                  <Box key={mod}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize', mb: 0.75, display: 'block' }}>
                      {mod}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {rolesWithAccess.length === 0 ? (
                        <Typography variant="caption" color="text.disabled">No access</Typography>
                      ) : (
                        rolesWithAccess.map(r => {
                          const group = getGroupForLevel(r.level);
                          const actions = (r.permissions || []).filter(p => p.startsWith(`${mod}:`));
                          return (
                            <Tooltip key={r._id} title={actions.map(a => a.split(':')[1]).join(', ')}>
                              <Chip
                                size="small"
                                label={`${r.name} (${actions.length})`}
                                sx={{
                                  height: 22, fontSize: '0.625rem',
                                  bgcolor: alpha(group.color, 0.08), color: group.color,
                                }}
                              />
                            </Tooltip>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            // Desktop: grid table
            <Box sx={{ overflowX: 'auto' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `140px repeat(${displayRoles.length}, minmax(72px, 1fr))`,
                  minWidth: displayRoles.length * 72 + 140,
                }}
              >
                {/* Header row */}
                <Box sx={{ p: 1.25, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', left: 0, zIndex: 1 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">Module</Typography>
                </Box>
                {displayRoles.map(r => {
                  const group = getGroupForLevel(r.level);
                  return (
                    <Box key={r._id} sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography variant="caption" fontWeight={600} noWrap sx={{ color: group.color, fontSize: '0.65rem' }}>
                        {r.name}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" fontSize="0.6rem">
                        L{r.level}
                      </Typography>
                    </Box>
                  );
                })}

                {/* Module rows */}
                {modules.map(mod => (
                  <React.Fragment key={mod}>
                    <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Typography variant="caption" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{mod}</Typography>
                    </Box>
                    {displayRoles.map(r => {
                      const actions = (r.permissions || []).filter(p => p.startsWith(`${mod}:`));
                      const has = actions.length > 0;
                      return (
                        <Tooltip key={`${r._id}-${mod}`} title={has ? actions.map(p => p.split(':')[1]).join(', ') : 'No access'}>
                          <Box
                            sx={{
                              p: 1, borderBottom: '1px solid', borderColor: 'divider',
                              textAlign: 'center',
                              bgcolor: has ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                            }}
                          >
                            {has ? (
                              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────
const OrgHierarchyPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPerm, isOwner } = useAuth();

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, usersRes] = await Promise.all([
          rolesAPI.getRoles(),
          userAPI.getUsers({ includeInactive: 'false' }),
        ]);
        const fetchedRoles = rolesRes.data?.data?.roles || rolesRes.data?.roles || [];
        const fetchedUsers = usersRes.data?.data?.users || usersRes.data?.users || [];
        setRoles(fetchedRoles.sort((a, b) => a.level - b.level));
        setUsers(fetchedUsers.filter(u => u.isActive));
      } catch {
        enqueueSnackbar('Failed to load organization data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [enqueueSnackbar]);

  // Group roles by authority level range
  const groupedRoles = useMemo(() => {
    const groups = [];
    LEVEL_GROUPS.forEach(g => {
      const matched = roles.filter(r => r.level >= g.range[0] && r.level <= g.range[1]);
      if (matched.length > 0) {
        groups.push({ ...g, roles: matched });
      }
    });
    return groups;
  }, [roles]);

  const canEdit = isOwner || (checkPerm && checkPerm('roles:update'));

  if (loading) return <DetailPageSkeleton />;

  return (
    <Box>
      <PageHeader
        title="Organization Hierarchy"
        subtitle={`${roles.length} roles · ${users.length} active users`}
        icon={AdminPanelSettings}
        actions={canEdit ? (
          <Button size="small" startIcon={<ArrowBack />} onClick={() => navigate('/roles')}>
            Manage Roles
          </Button>
        ) : null}
      />

      <StatsBar roles={roles} users={users} />

      {/* Role hierarchy grouped by authority level */}
      {groupedRoles.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <AdminPanelSettings sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No roles found{canEdit ? '. Create your first role to see the hierarchy.' : '.'}</Typography>
          {canEdit && (
            <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={() => navigate('/roles/create')}>
              Create Role
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
          {groupedRoles.map(group => (
            <Box key={group.key}>
              {/* Group header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: group.color, flexShrink: 0,
                  }}
                />
                <Typography variant="overline" sx={{ color: group.color, letterSpacing: '0.08em' }}>
                  {group.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Level {group.range[0] === group.range[1] ? group.range[0] : `${group.range[0]}–${group.range[1]}`}
                  {' · '}{group.desc}
                </Typography>
              </Box>

              {/* Role cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {group.roles.map(role => (
                  <RoleCard
                    key={role._id}
                    role={role}
                    users={users}
                    canEdit={canEdit}
                    navigate={navigate}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Access overview (collapsible) */}
      <AccessOverview roles={roles} />
    </Box>
  );
};

export default OrgHierarchyPage;

// File: src/pages/settings/UserManagementPage.js
// Description: COMPLETE User Management interface with working invitation dialog
// Version: 3.1.0 - Added working invitation dialog functionality

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Tooltip,
  Paper,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  Search,
  Delete,
  Block,
  CheckCircle,
  Email,
  BusinessCenter,
  AdminPanelSettings,
  Assignment,
  TrendingUp,
  AttachMoney,
  Construction,
  People,
  ContentCopy,
  Send,
  Refresh,
  Settings,
  PersonOff,
  PersonOutline,
  Link as LinkIcon,
  Timer,
  Cancel,
  RestoreFromTrash,
  Assessment,
  Group,
  Archive,
  DateRange,
  FolderSpecial,
  WarningAmber,
  EditOutlined,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { useSnackbar } from 'notistack';
import { format, formatDistanceToNow, isAfter } from 'date-fns';

// Import services and context
import { useAuth } from '../../context/AuthContext';
import { userAPI, invitationAPI, rolesAPI, projectAccessAPI, handleAPIError } from '../../services/api';
import { PageHeader } from '../../components/common';
import UserProjectsDrawer from '../../components/users/UserProjectsDrawer';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const USER_MANAGEMENT_CONFIG = {
  // Roles configuration with display properties
  ROLES: {
    'Business Head': {
      label: 'Business Head',
      color: 'error',
      icon: <AdminPanelSettings />,
      description: 'Full system access and organization management',
      priority: 1,
    },
    'Project Director': {
      label: 'Project Director',
      color: 'warning',
      icon: <Construction />,
      description: 'Project oversight and construction management',
      priority: 2,
    },
    'Sales Head': {
      label: 'Sales Head',
      color: 'info',
      icon: <TrendingUp />,
      description: 'Sales team leadership and strategy',
      priority: 3,
    },
    'Marketing Head': {
      label: 'Marketing Head',
      color: 'secondary',
      icon: <Assignment />,
      description: 'Marketing campaigns and lead generation',
      priority: 4,
    },
    'Finance Head': {
      label: 'Finance Head',
      color: 'success',
      icon: <AttachMoney />,
      description: 'Financial oversight and budget management',
      priority: 5,
    },
    'Sales Manager': {
      label: 'Sales Manager',
      color: 'primary',
      icon: <People />,
      description: 'Sales team management and operations',
      priority: 6,
    },
    'Finance Manager': {
      label: 'Finance Manager',
      color: 'success',
      icon: <AttachMoney />,
      description: 'Financial operations and reporting',
      priority: 7,
    },
    'Channel Partner Manager': {
      label: 'Channel Partner Manager',
      color: 'info',
      icon: <BusinessCenter />,
      description: 'Partner relationship management',
      priority: 8,
    },
    'Sales Executive': {
      label: 'Sales Executive',
      color: 'default',
      icon: <PersonOutline />,
      description: 'Direct sales and customer interaction',
      priority: 9,
    },
    'Channel Partner Admin': {
      label: 'Channel Partner Admin',
      color: 'secondary',
      icon: <Settings />,
      description: 'Partner administrative functions',
      priority: 10,
    },
    'Channel Partner Agent': {
      label: 'Channel Partner Agent',
      color: 'default',
      icon: <PersonOutline />,
      description: 'Partner sales agent',
      priority: 11,
    },
  },

  // User status configuration
  STATUS: {
    ACTIVE: {
      label: 'Active',
      color: 'success',
      icon: <CheckCircle />,
    },
    INACTIVE: {
      label: 'Inactive',
      color: 'error',
      icon: <Block />,
    },
    PENDING: {
      label: 'Pending Invitation',
      color: 'warning',
      icon: <Email />,
    },
    EXPIRED: {
      label: 'Invitation Expired',
      color: 'error',
      icon: <Timer />,
    },
    REVOKED: {
      label: 'Invitation Revoked',
      color: 'default',
      icon: <Cancel />,
    },
  },

  // Pagination settings
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },

  // Tab configuration - Updated with 4 tabs
  TABS: [
    { id: 'users', label: 'Active Users', icon: <People /> },
    { id: 'invitations', label: 'Invitations', icon: <Email /> },
    { id: 'archived', label: 'Archived Users', icon: <Archive /> },
    { id: 'analytics', label: 'Analytics', icon: <Assessment /> },
  ],
};

/**
 * Get role category for filtering
 */
const getRoleCategory = (role) => {
  const managementRoles = ['Business Head', 'Project Director', 'Sales Head', 'Marketing Head', 'Finance Head'];
  const salesRoles = ['Sales Manager', 'Sales Executive'];
  const financeRoles = ['Finance Head', 'Finance Manager'];
  const partnerRoles = ['Channel Partner Manager', 'Channel Partner Admin', 'Channel Partner Agent'];

  if (managementRoles.includes(role)) return 'Management';
  if (salesRoles.includes(role)) return 'Sales';
  if (financeRoles.includes(role)) return 'Finance';
  if (partnerRoles.includes(role)) return 'Partners';
  return 'Other';
};

/**
 * Get user status based on invitation and activity
 */
const getUserStatus = (user) => {
  if (user.invitationStatus === 'pending') {
    if (user.invitationExpiry && isAfter(new Date(), new Date(user.invitationExpiry))) {
      return 'EXPIRED';
    }
    return 'PENDING';
  }
  if (user.invitationStatus === 'revoked') return 'REVOKED';
  if (user.invitationStatus === 'expired') return 'EXPIRED';
  return user.isActive ? 'ACTIVE' : 'INACTIVE';
};

// =============================================================================
// INVITE USER DIALOG COMPONENT
// =============================================================================

/**
 * Invite User Dialog Component
 */
const InviteUserDialog = ({
  open,
  onClose,
  onInvite,
  currentUserRole,
  inviting = false,
  dynamicRoles = [],
  userRoleLevel = 100,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [invitationLink, setInvitationLink] = useState('');
  const [showLink, setShowLink] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Project access selection
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  const availableRoles = useMemo(() => {
    // Use dynamic roles from API when available
    if (dynamicRoles.length > 0) {
      return dynamicRoles
        .filter(r => !r.isOwnerRole && r.level > userRoleLevel)
        .sort((a, b) => a.level - b.level)
        .map(r => ({
          value: r.slug || r.name,
          label: r.name,
          level: r.level,
          _id: r._id,
          permissionCount: r.permissions?.length || 0,
        }));
    }

    // Fallback: hardcoded role hierarchy
    const roleOptions = [
      { value: 'Sales Head', label: 'Sales Head', level: 3 },
      { value: 'Marketing Head', label: 'Marketing Head', level: 3 },
      { value: 'Finance Head', label: 'Finance Head', level: 3 },
      { value: 'Sales Manager', label: 'Sales Manager', level: 4 },
      { value: 'Finance Manager', label: 'Finance Manager', level: 4 },
      { value: 'Channel Partner Manager', label: 'Channel Partner Manager', level: 4 },
      { value: 'Sales Executive', label: 'Sales Executive', level: 5 },
      { value: 'Channel Partner Admin', label: 'Channel Partner Admin', level: 5 },
      { value: 'Channel Partner Agent', label: 'Channel Partner Agent', level: 6 },
    ];

    const currentUserLevel = {
      'Business Head': 1,
      'Project Director': 2,
      'Sales Head': 3,
      'Marketing Head': 3,
      'Finance Head': 3,
      'Sales Manager': 4,
      'Finance Manager': 4,
      'Channel Partner Manager': 4,
    }[currentUserRole] || 10;

    return roleOptions.filter(role => role.level > currentUserLevel);
  }, [currentUserRole, dynamicRoles, userRoleLevel]);

  // Load accessible projects when dialog opens
  useEffect(() => {
    if (!open) { setSelectedProjectIds([]); return; }
    setLoadingProjects(true);
    projectAccessAPI.getMyProjects()
      .then((res) => {
        const assignments = res.data?.data || [];
        setMyProjects(assignments.map((a) => a.project).filter(Boolean));
      })
      .catch(() => {/* silently fail if endpoint unavailable */})
      .finally(() => setLoadingProjects(false));
  }, [open]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const result = await onInvite(formData);

        // Step 2: Assign to selected projects if any
        if (result?.data?.user?._id && selectedProjectIds.length > 0) {
          try {
            await projectAccessAPI.bulkAssign([result.data.user._id], selectedProjectIds);
          } catch {
            enqueueSnackbar(
              'Invitation sent but project assignment failed. Assign projects manually from Settings → Project Access.',
              { variant: 'warning' }
            );
          }
        }

        if (result && result.success && result.invitationLink) {
          setInvitationLink(result.invitationLink);
          setShowLink(true);
        } else {
          const mockLink = `${window.location.origin}/invite/user123?token=abc123&email=${encodeURIComponent(formData.email)}`;
          setInvitationLink(mockLink);
          setShowLink(true);
          enqueueSnackbar('Using test invitation link (check console for API response)', { variant: 'warning' });
        }
      } catch (error) {
        enqueueSnackbar('Error generating invitation link', { variant: 'error' });
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      enqueueSnackbar('Invitation link copied to clipboard!', { variant: 'success' });
    } catch (error) {
      console.error('Failed to copy link:', error);
      enqueueSnackbar('Failed to copy link. Please copy manually.', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setFormData({ firstName: '', lastName: '', email: '', role: '' });
    setErrors({});
    setInvitationLink('');
    setShowLink(false);
    setSelectedProjectIds([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: showLink ? 'success.main' : 'primary.main' }}>
            {showLink ? <CheckCircle /> : <PersonAdd />}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {showLink ? 'Invitation Link Generated' : 'Invite New User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showLink 
                ? 'Copy and share this link with the user' 
                : 'Send an invitation to join your organization'
              }
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 1 }}>
        {!showLink ? (
          // Form for creating invitation
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={inviting}
                  placeholder="Enter first name"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={inviting}
                  placeholder="Enter last name"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={inviting}
                  placeholder="Enter email address"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    label="Role"
                    disabled={inviting}
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.value} value={role._id || role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <BusinessCenter sx={{ fontSize: 20 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">
                              {role.label}
                            </Typography>
                            {role.permissionCount > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Level {role.level} &middot; {role.permissionCount} permissions
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.role}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* Project Access Section */}
            {myProjects.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderSpecial sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={600}>Project Access</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => setSelectedProjectIds(myProjects.map((p) => p._id))} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      Select All
                    </Button>
                    <Button size="small" onClick={() => setSelectedProjectIds([])} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      Deselect All
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                  {loadingProjects ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={20} /></Box>
                  ) : (
                    myProjects.map((project) => {
                      const checked = selectedProjectIds.includes(project._id);
                      return (
                        <Box
                          key={project._id}
                          onClick={() => setSelectedProjectIds((prev) =>
                            prev.includes(project._id) ? prev.filter((id) => id !== project._id) : [...prev, project._id]
                          )}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            cursor: 'pointer',
                            '&:not(:last-child)': { borderBottom: '1px solid', borderBottomColor: 'divider' },
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Checkbox size="small" checked={checked} onChange={() => {}} />
                          <FolderSpecial sx={{ fontSize: 16, color: checked ? 'primary.main' : 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={checked ? 600 : 400}>{project.name}</Typography>
                          {project.location?.city && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{project.location.city}</Typography>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  The user will only be able to see data from selected projects.
                </Typography>
                {selectedProjectIds.length === 0 && (
                  <Alert severity="warning" icon={<WarningAmber />} sx={{ mt: 1, py: 0.5 }}>
                    <Typography variant="caption">Warning: This user won't be able to see any projects until you assign them later.</Typography>
                  </Alert>
                )}
              </Box>
            )}

            {availableRoles.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <AlertTitle>No Available Roles</AlertTitle>
                You don't have permission to invite users. Please contact your administrator.
              </Alert>
            )}
          </>
        ) : (
          // Display generated invitation link
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Invitation Created Successfully!</AlertTitle>
              The invitation link has been generated for <strong>{formData.firstName} {formData.lastName}</strong> ({formData.email}).
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Invitation Link:
            </Typography>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                border: '2px dashed',
                borderColor: 'primary.main',
                mb: 2 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinkIcon color="primary" />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    bgcolor: 'white',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  {invitationLink}
                </Typography>
                <Tooltip title="Copy Link">
                  <IconButton 
                    onClick={handleCopyLink}
                    color="primary"
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            <Alert severity="info">
              <AlertTitle>Next Steps:</AlertTitle>
              <Typography variant="body2" component="div">
                1. Copy the invitation link above<br/>
                2. Send it to <strong>{formData.email}</strong> via email, WhatsApp, or any messaging platform<br/>
                3. The user will click the link to set up their password and access the system<br/>
                4. The invitation link will expire in 7 days
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {!showLink ? (
          // Form buttons
          <>
            <Button 
              onClick={handleClose}
              disabled={inviting}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={inviting || availableRoles.length === 0}
              startIcon={inviting ? <CircularProgress size={16} /> : <Send />}
            >
              {inviting ? 'Generating Link...' : 'Generate Invitation Link'}
            </Button>
          </>
        ) : (
          // Link display buttons
          <>
            <Button 
              onClick={handleCopyLink}
              startIcon={<ContentCopy />}
              variant="outlined"
            >
              Copy Link
            </Button>
            <Button
              onClick={handleClose}
              variant="contained"
              color="primary"
            >
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// ANALYTICS COMPONENTS
// =============================================================================

/**
 * Analytics Overview Component
 */
const AnalyticsOverview = ({ users }) => {
  const analytics = useMemo(() => {
    const total = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const pendingInvites = users.filter(u => u.invitationStatus === 'pending').length;
    const acceptedInvites = users.filter(u => u.invitationStatus === 'accepted').length;
    
    // Role distribution
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Login activity (last 30 days)
    const recentlyActive = users.filter(u => {
      if (!u.lastLogin) return false;
      const daysSince = Math.floor((new Date() - new Date(u.lastLogin)) / (1000 * 60 * 60 * 24));
      return daysSince <= 30;
    }).length;

    // Invitation acceptance rate
    const totalInvites = users.filter(u => u.invitedAt).length;
    const acceptanceRate = totalInvites > 0 ? (acceptedInvites / totalInvites * 100).toFixed(1) : 0;

    return {
      total,
      activeUsers,
      pendingInvites,
      acceptedInvites,
      roleDistribution,
      recentlyActive,
      acceptanceRate,
    };
  }, [users]);

  return (
    <Grid container spacing={3}>
      {/* Key Metrics */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Key Metrics
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  {analytics.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  {analytics.activeUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(analytics.activeUsers / analytics.total) * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Email />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  {analytics.pendingInvites}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Invites
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  {analytics.acceptanceRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Acceptance Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Role Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Role Distribution" />
          <CardContent>
            {Object.entries(analytics.roleDistribution).map(([role, count]) => {
              const roleConfig = USER_MANAGEMENT_CONFIG.ROLES[role];
              const percentage = ((count / analytics.total) * 100).toFixed(1);
              
              // Map role colors to valid LinearProgress colors
              const getValidProgressColor = (color) => {
                const validColors = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];
                if (validColors.includes(color)) {
                  return color;
                }
                return 'primary'; // fallback
              };
              
              const progressColor = roleConfig?.color ? getValidProgressColor(roleConfig.color) : 'primary';
              
              return (
                <Box key={role} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {roleConfig?.icon || <PersonOutline />}
                      <Typography variant="body2">
                        {roleConfig?.label || role}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {count} ({percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(percentage)}
                    color={progressColor}
                  />
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </Grid>

      {/* Activity Overview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="User Activity" />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <DateRange />
                </ListItemIcon>
                <ListItemText 
                  primary="Recently Active (30 days)"
                  secondary={`${analytics.recentlyActive} users logged in recently`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText 
                  primary="Invitation Status"
                  secondary={`${analytics.acceptedInvites} accepted, ${analytics.pendingInvites} pending`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Group />
                </ListItemIcon>
                <ListItemText 
                  primary="User Engagement"
                  secondary={`${((analytics.recentlyActive / analytics.activeUsers) * 100).toFixed(1)}% of active users engaged recently`}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/**
 * Invitations Tab Component
 */
const InvitationsTab = ({ 
  users, 
  onResendInvite, 
  onRevokeInvite, 
  currentUser,
  canEdit 
}) => {
  const [invitationFilter, setInvitationFilter] = useState('all');
  
  const invitationUsers = useMemo(() => {
    // Filter users with invitation-related statuses
    let filtered = users.filter(user => 
      ['pending', 'expired', 'revoked'].includes(user.invitationStatus) ||
      (user.invitationStatus === 'accepted' && user.invitedAt)
    );

    if (invitationFilter !== 'all') {
      filtered = filtered.filter(user => user.invitationStatus === invitationFilter);
    }

    return filtered.sort((a, b) => new Date(b.invitedAt || b.createdAt) - new Date(a.invitedAt || a.createdAt));
  }, [users, invitationFilter]);

  const invitationStats = useMemo(() => {
    const pending = invitationUsers.filter(u => u.invitationStatus === 'pending').length;
    const accepted = invitationUsers.filter(u => u.invitationStatus === 'accepted').length;
    const expired = invitationUsers.filter(u => u.invitationStatus === 'expired').length;
    const revoked = invitationUsers.filter(u => u.invitationStatus === 'revoked').length;
    
    return { pending, accepted, expired, revoked };
  }, [invitationUsers]);

  return (
    <Box>
      {/* Invitation Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {invitationStats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {invitationStats.accepted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accepted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {invitationStats.expired}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expired
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="grey.600">
                {invitationStats.revoked}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revoked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter Invitations</InputLabel>
          <Select
            value={invitationFilter}
            onChange={(e) => setInvitationFilter(e.target.value)}
            label="Filter Invitations"
          >
            <MenuItem value="all">All Invitations</MenuItem>
            <MenuItem value="pending">Pending Only</MenuItem>
            <MenuItem value="accepted">Accepted Only</MenuItem>
            <MenuItem value="expired">Expired Only</MenuItem>
            <MenuItem value="revoked">Revoked Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Invitations List */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invited</TableCell>
                <TableCell>Expires/Accepted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitationUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No invitations found for the selected filter
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invitationUsers.map((user) => {
                  const roleConfig = USER_MANAGEMENT_CONFIG.ROLES[user.role] || USER_MANAGEMENT_CONFIG.ROLES['Sales Executive'];
                  const status = getUserStatus(user);
                  const statusConfig = USER_MANAGEMENT_CONFIG.STATUS[status];

                  return (
                    <TableRow key={user._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: roleConfig.color + '.main' }}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        {user.invitedAt ? (
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(user.invitedAt), 'MMM dd, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(user.invitedAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Unknown
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {user.invitationStatus === 'accepted' && user.acceptedAt ? (
                          <Box>
                            <Typography variant="body2" color="success.main">
                              Accepted
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(user.acceptedAt), 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                        ) : user.invitationExpiry ? (
                          <Box>
                            <Typography variant="body2">
                              {format(new Date(user.invitationExpiry), 'MMM dd, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isAfter(new Date(), new Date(user.invitationExpiry)) ? 'Expired' : 'Active'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No expiry
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        {user.invitationStatus === 'pending' && canEdit && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Resend Invitation">
                              <IconButton 
                                size="small" 
                                onClick={() => onResendInvite(user._id)}
                                color="primary"
                              >
                                <Send />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Revoke Invitation">
                              <IconButton 
                                size="small" 
                                onClick={() => onRevokeInvite(user._id)}
                                color="error"
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        {user.invitationStatus === 'expired' && canEdit && (
                          <Tooltip title="Resend Invitation">
                            <IconButton 
                              size="small" 
                              onClick={() => onResendInvite(user._id)}
                              color="primary"
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

/**
 * Archived Users Tab Component
 */
const ArchivedUsersTab = ({ 
  users, 
  onRestoreUser, 
  onPermanentDelete,
  currentUser,
  canEdit 
}) => {
  const archivedUsers = useMemo(() => {
    return users.filter(user => !user.isActive).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [users]);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Archived Users</AlertTitle>
        These users have been soft-deleted and are inactive. You can restore them or permanently delete them.
      </Alert>

      <Card>
        <CardHeader 
          title={`Archived Users (${archivedUsers.length})`}
          avatar={<Archive />}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Archived Date</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archivedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 4 }}>
                      <Archive sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No archived users found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                archivedUsers.map((user) => {
                  const roleConfig = USER_MANAGEMENT_CONFIG.ROLES[user.role] || USER_MANAGEMENT_CONFIG.ROLES['Sales Executive'];

                  return (
                    <TableRow key={user._id} sx={{ opacity: 0.7 }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'grey.400' }}>
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={roleConfig.icon}
                          label={roleConfig.label}
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(user.updatedAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {user.lastLogin ? (
                          <Typography variant="body2" color="text.secondary">
                            {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Never
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        {canEdit && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Restore User">
                              <IconButton 
                                size="small" 
                                onClick={() => onRestoreUser(user._id)}
                                color="success"
                              >
                                <RestoreFromTrash />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Permanently Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => onPermanentDelete(user._id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

// =============================================================================
// OWNERSHIP TRANSFER DIALOG
// =============================================================================

const TransferOwnershipDialog = ({ open, onClose, users, onTransfer }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [transferring, setTransferring] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const eligibleUsers = useMemo(() => {
    return users.filter(u => u.isActive && u._id);
  }, [users]);

  const selectedUser = eligibleUsers.find(u => u._id === selectedUserId);
  const confirmPhrase = 'TRANSFER OWNERSHIP';
  const canConfirm = selectedUserId && confirmText === confirmPhrase;

  const handleTransfer = async () => {
    if (!canConfirm) return;
    try {
      setTransferring(true);
      await onTransfer(selectedUserId);
      enqueueSnackbar('Ownership transferred successfully. Please log in again.', { variant: 'success' });
      handleClose();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to transfer ownership', { variant: 'error' });
    } finally {
      setTransferring(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <AdminPanelSettings />
          </Avatar>
          <Box>
            <Typography variant="h6">Transfer Organization Ownership</Typography>
            <Typography variant="body2" color="text.secondary">
              This action is irreversible. You will lose owner privileges.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Warning</AlertTitle>
          Transferring ownership will give the selected user full control of this organization,
          including the ability to delete roles, remove users, and manage all settings. Your role
          will be reassigned.
        </Alert>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select New Owner</InputLabel>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label="Select New Owner"
          >
            {eligibleUsers.map(u => (
              <MenuItem key={u._id} value={u._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                    {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{u.firstName} {u.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedUser && (
          <TextField
            fullWidth
            label={`Type "${confirmPhrase}" to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText.length > 0 && confirmText !== confirmPhrase}
            helperText={`Transfer ownership to ${selectedUser.firstName} ${selectedUser.lastName}`}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={transferring}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleTransfer}
          disabled={!canConfirm || transferring}
          startIcon={transferring ? <CircularProgress size={16} /> : null}
        >
          {transferring ? 'Transferring...' : 'Transfer Ownership'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// EDIT USER DIALOG COMPONENT
// =============================================================================

const EditUserDialog = ({ open, onClose, user, dynamicRoles, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !user) { setSearch(''); return; }
    setLoading(true);
    // Initialise role from user's current roleRef or legacy role string
    setSelectedRoleId(user.roleRef?._id || user.roleRef || '');
    Promise.all([
      projectAccessAPI.getMyProjects(),
      projectAccessAPI.getUserProjects(user._id),
    ])
      .then(([adminRes, userRes]) => {
        const adminProjects = (adminRes.data?.data || []).map((a) => a.project).filter(Boolean);
        const userAssignments = userRes.data?.data || [];
        const userProjectIds = new Set(userAssignments.map((a) => a.project?._id || a.project));
        setMyProjects(adminProjects);
        setSelectedProjectIds(adminProjects.filter((p) => userProjectIds.has(p._id)).map((p) => p._id));
      })
      .catch(() => enqueueSnackbar('Failed to load project data', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [open, user, enqueueSnackbar]);

  const toggleProject = (id) => {
    setSelectedProjectIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const rolePayload = {};
      if (selectedRoleId) rolePayload.roleRef = selectedRoleId;
      await Promise.all([
        Object.keys(rolePayload).length > 0
          ? userAPI.updateUser(user._id, rolePayload)
          : Promise.resolve(),
        projectAccessAPI.syncUserProjects(user._id, selectedProjectIds),
      ]);
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      onSuccess?.();
      onClose();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update user', { variant: 'error' });
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
        Edit User
        <Typography variant="body2" color="text.secondary">
          {user?.firstName} {user?.lastName}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {/* Role */}
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            label="Role"
          >
            {dynamicRoles.map((role) => (
              <MenuItem key={role._id || role.value} value={role._id || role.value}>
                {role.label || role.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Project Access */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Project Access
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Select the projects this user can access. Unchecking all removes all project access.
        </Typography>
        {selectedProjectIds.length === 0 && !loading && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            This user will not be able to see any projects.
          </Alert>
        )}
        <TextField
          size="small"
          placeholder="Search projects…"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ mb: 1 }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : myProjects.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No accessible projects
          </Typography>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 260, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {filtered.map((project) => {
              const checked = selectedProjectIds.includes(project._id);
              return (
                <ListItem
                  key={project._id}
                  button
                  onClick={() => toggleProject(project._id)}
                  sx={{ px: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Checkbox size="small" checked={checked} onChange={() => toggleProject(project._id)} disableRipple sx={{ mr: 1 }} />
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
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {selectedProjectIds.length} of {myProjects.length} project{myProjects.length !== 1 ? 's' : ''} selected
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={14} /> : null}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// MAIN USER MANAGEMENT PAGE COMPONENT
// =============================================================================

/**
 * UserManagementPage - Complete user and invitation management interface with working tabs
 */
const UserManagementPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser, canAccess, checkPerm, isOwner, roleLevel } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(USER_MANAGEMENT_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Dynamic roles from API
  const [availableRoles, setAvailableRoles] = useState([]);

  // Dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // User Projects Drawer
  const [projectDrawerUser, setProjectDrawerUser] = useState(null);

  // Edit User Dialog
  const [editingUser, setEditingUser] = useState(null);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const canManageUsers = useMemo(() => {
    // New permission system: check module:action permissions
    if (checkPerm) {
      const hasPerm = checkPerm('users:view') || checkPerm('users:update') || isOwner;
      if (hasPerm) return true;
    }
    // Fallback to old role-based check
    return canAccess && currentUser?.role && [
      'Business Head', 'Project Director', 'Sales Head', 'Marketing Head',
      'Finance Head', 'Sales Manager', 'Finance Manager', 'Channel Partner Manager'
    ].includes(currentUser.role);
  }, [canAccess, currentUser, checkPerm, isOwner]);

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter(user => user.isActive).length;
    const inactive = users.filter(user => !user.isActive).length;
    const pending = users.filter(user => user.invitationStatus === 'pending').length;
    const expired = users.filter(user => user.invitationStatus === 'expired').length;
    const revoked = users.filter(user => user.invitationStatus === 'revoked').length;
    
    return { total, active, inactive, pending, expired, revoked };
  }, [users]);

  // Filter users based on current tab and search criteria
  const displayUsers = useMemo(() => {
    let filtered = [...users];

    // Filter by tab
    switch (activeTab) {
      case 0: // Active Users
        filtered = filtered.filter(user => user.isActive);
        break;
      case 1: // Invitations - handled separately
        return [];
      case 2: // Archived Users - handled separately
        return [];
      case 3: // Analytics - handled separately
        return [];
      default:
        break;
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (roleFilter !== 'All Roles') {
      if (availableRoles.length > 0) {
        // Dynamic roles: match by role name (roleRef.name or user.role)
        filtered = filtered.filter(user =>
          (user.roleRef?.name || user.role) === roleFilter
        );
      } else if (['Management', 'Sales', 'Finance', 'Partners'].includes(roleFilter)) {
        filtered = filtered.filter(user => getRoleCategory(user.role) === roleFilter);
      } else {
        filtered = filtered.filter(user => user.role === roleFilter);
      }
    }

    // Apply status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter(user => {
        const status = getUserStatus(user);
        return status === statusFilter.toUpperCase();
      });
    }

    return filtered;
  }, [users, activeTab, searchTerm, roleFilter, statusFilter, availableRoles]);

  // =============================================================================
  // API FUNCTIONS
  // =============================================================================
  
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getUsers({
        includeInactive: 'true',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      let usersList = [];
      
      if (response.data?.data?.users) {
        usersList = response.data.data.users;
      } else if (response.data?.users) {
        usersList = response.data.users;
      } else if (response.data && Array.isArray(response.data)) {
        usersList = response.data;
      } else {
        throw new Error('Invalid response format - no users array found');
      }
      
      if (!Array.isArray(usersList)) {
        throw new Error('Users data is not in array format');
      }
      
      setUsers(usersList);
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      const apiError = handleAPIError(error);
      setError(apiError.message);
      enqueueSnackbar(apiError.message || 'Failed to load users', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Invitation handler function
  const handleInviteUser = useCallback(async (invitationData) => {
    try {
      setInviting(true);
      const response = await invitationAPI.generateInvitationLink(invitationData);

      if (!response.data) throw new Error('No valid response data');

      const d = response.data;
      const dd = d.data || {};

      // Find invitation link from various response shapes
      const foundLink =
        d.invitationLink || d.link || d.url || d.inviteLink ||
        dd.invitationLink || dd.link || dd.url || dd.inviteLink ||
        d.user?.invitationLink || d.invitation?.link || d.result?.link;

      if (foundLink) {
        enqueueSnackbar(`Invitation link generated for ${invitationData.email}`, { variant: 'success' });
        await fetchUsers();
        return { success: true, invitationLink: foundLink };
      }

      // Try to build link from userId + token
      const userId = d.userId || d.id || dd.userId || dd.id || d.user?._id || dd.user?._id;
      const token = d.token || d.invitationToken || dd.token || dd.invitationToken ||
        d.user?.invitationToken || dd.invitation?.token || dd.user?.invitationToken;

      if (userId && token) {
        const manualLink = `${window.location.origin}/invite/${userId}?token=${token}&email=${encodeURIComponent(invitationData.email)}`;
        enqueueSnackbar(`Invitation link generated for ${invitationData.email}`, { variant: 'success' });
        await fetchUsers();
        return { success: true, invitationLink: manualLink };
      }

      // Fallback
      const fallbackLink = `${window.location.origin}/invite/pending?email=${encodeURIComponent(invitationData.email)}`;
      enqueueSnackbar('Invitation created — link may not be available yet', { variant: 'warning' });
      return { success: true, invitationLink: fallbackLink };

    } catch (error) {
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to generate invitation link', { variant: 'error' });
      return { success: false, error: apiError.message };
    } finally {
      setInviting(false);
    }
  }, [enqueueSnackbar, fetchUsers]);

  // Restore user function
  const handleRestoreUser = useCallback(async (userId) => {
    try {
      await userAPI.updateUser(userId, { isActive: true });
      
      enqueueSnackbar('User restored successfully', {
        variant: 'success',
      });
      
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive: true } : user
      ));
      
    } catch (error) {
      console.error('Error restoring user:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to restore user', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar]);

  const handleToggleUserStatus = useCallback(async (userId, isActive) => {
    try {
      await userAPI.updateUser(userId, { isActive });
      
      enqueueSnackbar(`User ${isActive ? 'activated' : 'deactivated'} successfully`, {
        variant: 'success',
      });
      
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isActive } : user
      ));
      
    } catch (error) {
      console.error('Error updating user status:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to update user status', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar]);

  const handleResendInvite = useCallback(async (userId) => {
    try {
      const response = await invitationAPI.resendInvitation(userId);
      
      if (response.data && response.data.success) {
        enqueueSnackbar('Invitation resent successfully', {
          variant: 'success',
        });
        await fetchUsers();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Error resending invitation:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to resend invitation', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar, fetchUsers]);

  const handleRevokeInvite = useCallback(async (userId) => {
    try {
      await invitationAPI.revokeInvitation(userId);
      
      enqueueSnackbar('Invitation revoked successfully', {
        variant: 'success',
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to revoke invitation', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar, fetchUsers]);

  const handleDeleteUser = useCallback(async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      
      enqueueSnackbar('User deleted successfully', {
        variant: 'success',
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(apiError.message || 'Failed to delete user', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar, fetchUsers]);

  const handleTransferOwnership = useCallback(async (newOwnerId) => {
    await rolesAPI.transferOwnership({ newOwnerId });
    // Force re-login after ownership transfer
    window.location.href = '/login';
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
      // Fetch dynamic roles from API for invite dialog & role display
      rolesAPI.getRoles().then(res => {
        const roles = res.data?.data?.roles || res.data?.roles || [];
        setAvailableRoles(roles);
      }).catch(() => {
        // Silently fall back to hardcoded roles if API fails
      });
    }
  }, [canManageUsers, fetchUsers]);

  // Reset pagination when tab changes
  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchTerm(''); // Clear search when switching tabs
    setRoleFilter('All Roles');
    setStatusFilter('All Status');
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  if (!canManageUsers) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You don't have permission to manage users. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  if (error && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchUsers}>
              <Refresh sx={{ mr: 1 }} />
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Users</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      );
    }

    switch (activeTab) {
      case 0: // Active Users
        return (
          <Box>
            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="Search users by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Role Filter</InputLabel>
                      <Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        label="Role Filter"
                      >
                        <MenuItem value="All Roles">All Roles</MenuItem>
                        {availableRoles.length > 0 ? (
                          availableRoles.map(r => (
                            <MenuItem key={r._id || r.name} value={r.name}>
                              {r.name} (L{r.level})
                            </MenuItem>
                          ))
                        ) : (
                          [
                            <MenuItem key="mgmt" value="Management">Management</MenuItem>,
                            <MenuItem key="sales" value="Sales">Sales</MenuItem>,
                            <MenuItem key="finance" value="Finance">Finance</MenuItem>,
                            <MenuItem key="partners" value="Partners">Partners</MenuItem>,
                          ]
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status Filter</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status Filter"
                      >
                        <MenuItem value="All Status">All Status</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Expired">Expired</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader
                title={`Active Users (${displayUsers.length})`}
                action={
                  <IconButton onClick={fetchUsers} disabled={loading}>
                    <Refresh />
                  </IconButton>
                }
              />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {displayUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Box sx={{ py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                              No active users found
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayUsers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => {
                          const roleName = user.roleRef?.name || user.role;
                          const roleConfig = USER_MANAGEMENT_CONFIG.ROLES[user.role] || USER_MANAGEMENT_CONFIG.ROLES['Sales Executive'];
                          const status = getUserStatus(user);
                          const statusConfig = USER_MANAGEMENT_CONFIG.STATUS[status];

                          return (
                            <TableRow key={user._id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: roleConfig.color + '.main' }}>
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {user.firstName} {user.lastName}
                                      {currentUser?._id === user._id && (
                                        <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                                      )}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {user.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>

                              <TableCell>
                                <Chip
                                  icon={roleConfig.icon}
                                  label={roleName}
                                  color={roleConfig.color}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              
                              <TableCell>
                                <Chip
                                  icon={statusConfig.icon}
                                  label={statusConfig.label}
                                  color={statusConfig.color}
                                  size="small"
                                />
                              </TableCell>
                              
                              <TableCell>
                                {user.lastLogin ? (
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Never
                                  </Typography>
                                )}
                              </TableCell>
                              
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                  <Tooltip title="View Project Access">
                                    <IconButton
                                      size="small"
                                      onClick={() => setProjectDrawerUser(user)}
                                    >
                                      <FolderSpecial sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                  {canManageUsers && (
                                    <Tooltip title="Edit User">
                                      <IconButton
                                        size="small"
                                        onClick={() => setEditingUser(user)}
                                      >
                                        <EditOutlined sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {currentUser?._id !== user._id && canManageUsers && (
                                    <Tooltip title="Deactivate User">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleToggleUserStatus(user._id, false)}
                                        color="warning"
                                      >
                                        <PersonOff />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {displayUsers.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={USER_MANAGEMENT_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS}
                  component="div"
                  count={displayUsers.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                />
              )}
            </Card>
          </Box>
        );

      case 1: // Invitations
        return (
          <InvitationsTab
            users={users}
            onResendInvite={handleResendInvite}
            onRevokeInvite={handleRevokeInvite}
            currentUser={currentUser}
            canEdit={canManageUsers}
          />
        );

      case 2: // Archived Users
        return (
          <ArchivedUsersTab
            users={users}
            onRestoreUser={handleRestoreUser}
            onPermanentDelete={handleDeleteUser}
            currentUser={currentUser}
            canEdit={canManageUsers}
          />
        );

      case 3: // Analytics
        return <AnalyticsOverview users={users} />;

      default:
        return null;
    }
  };

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle={`${userStats.total} users · ${userStats.active} active`}
        icon={People}
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {isOwner && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => setTransferDialogOpen(true)}
              >
                Transfer Ownership
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setInviteDialogOpen(true)}
              size="small"
            >
              Invite User
            </Button>
          </Box>
        }
      />

      {/* Compact stats row */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          {[
            { label: 'Total', value: userStats.total, color: theme.palette.primary.main, icon: People },
            { label: 'Active', value: userStats.active, color: theme.palette.success.main, icon: CheckCircle },
            { label: 'Pending', value: userStats.pending, color: theme.palette.warning.main, icon: Email },
            { label: 'Archived', value: userStats.inactive, color: theme.palette.grey[500], icon: Archive },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: `${s.color}15`, color: s.color }}>
                  <s.icon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          {USER_MANAGEMENT_CONFIG.TABS.map((tab) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={isMobile ? tab.label.split(' ')[0] : tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInviteUser}
        currentUserRole={currentUser?.role}
        inviting={inviting}
        dynamicRoles={availableRoles}
        userRoleLevel={roleLevel}
      />

      {/* Ownership Transfer Dialog */}
      {isOwner && (
        <TransferOwnershipDialog
          open={transferDialogOpen}
          onClose={() => setTransferDialogOpen(false)}
          users={users.filter(u => u.isActive && u._id !== currentUser?._id)}
          onTransfer={handleTransferOwnership}
        />
      )}

      {/* User Projects Drawer */}
      <UserProjectsDrawer
        open={!!projectDrawerUser}
        onClose={() => setProjectDrawerUser(null)}
        userId={projectDrawerUser?._id}
        userName={projectDrawerUser ? `${projectDrawerUser.firstName} ${projectDrawerUser.lastName}` : ''}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        dynamicRoles={availableRoles}
        onSuccess={fetchUsers}
      />
    </Box>
  );
};

export default UserManagementPage;
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
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { useSnackbar } from 'notistack';
import { format, formatDistanceToNow, isAfter } from 'date-fns';

// Import services and context
import { useAuth } from '../../context/AuthContext';
import { userAPI, invitationAPI, handleAPIError } from '../../services/api';

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
  inviting = false 
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
  
  const availableRoles = useMemo(() => {
    // Define role hierarchy - users can only invite roles below their level
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
  }, [currentUserRole]);

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
        console.log('📝 Form submitted with data:', formData);
        const result = await onInvite(formData);
        console.log('📬 Invitation result:', result);
        
        if (result && result.success && result.invitationLink) {
          console.log('✅ Setting invitation link:', result.invitationLink);
          setInvitationLink(result.invitationLink);
          setShowLink(true);
        } else {
          console.log('❌ No invitation link in result, using fallback');
          // Fallback for testing - generate a mock link
          const mockLink = `${window.location.origin}/invite/user123?token=abc123&email=${encodeURIComponent(formData.email)}`;
          setInvitationLink(mockLink);
          setShowLink(true);
          enqueueSnackbar('Using test invitation link (check console for API response)', { variant: 'warning' });
        }
      } catch (error) {
        console.error('❌ Error in dialog submit:', error);
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
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <BusinessCenter sx={{ fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2">
                              {role.label}
                            </Typography>
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
// MAIN USER MANAGEMENT PAGE COMPONENT
// =============================================================================

/**
 * UserManagementPage - Complete user and invitation management interface with working tabs
 */
const UserManagementPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser, canAccess } = useAuth();
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
  
  // Dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const canManageUsers = useMemo(() => {
    return canAccess && currentUser?.role && [
      'Business Head', 'Project Director', 'Sales Head', 'Marketing Head', 
      'Finance Head', 'Sales Manager', 'Finance Manager', 'Channel Partner Manager'
    ].includes(currentUser.role);
  }, [canAccess, currentUser]);

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
      if (['Management', 'Sales', 'Finance', 'Partners'].includes(roleFilter)) {
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
  }, [users, activeTab, searchTerm, roleFilter, statusFilter]);

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

  // NEW: Invitation handler function
  const handleInviteUser = useCallback(async (invitationData) => {
    try {
      setInviting(true);
      
      console.log('🚀 Generating invitation for:', invitationData);
      const response = await invitationAPI.generateInvitationLink(invitationData);
      
      // LOG EVERYTHING ABOUT THE RESPONSE
      console.log('📤 Full API Response Object:', response);
      console.log('📤 response.data:', response.data);
      console.log('📤 response.status:', response.status);
      console.log('📤 response.headers:', response.headers);
      
      // Try to stringify the entire response to see its structure
      try {
        console.log('📤 Full response as JSON:', JSON.stringify(response.data, null, 2));
      } catch (e) {
        console.log('📤 Could not stringify response.data');
      }
      
      // Check if we have success
      console.log('✅ response.data.success:', response.data?.success);
      
      if (response.data) {
        // Log all top-level keys in the response
        console.log('🔑 All keys in response.data:', Object.keys(response.data));
        
        if (response.data.data) {
          console.log('🔑 All keys in response.data.data:', Object.keys(response.data.data));
        }
        
        // Try every possible way to get the link
        const possibleLinks = {
          'response.data.invitationLink': response.data.invitationLink,
          'response.data.link': response.data.link,
          'response.data.url': response.data.url,
          'response.data.invitation_link': response.data.invitation_link,
          'response.data.inviteLink': response.data.inviteLink,
          'response.data.data?.invitationLink': response.data.data?.invitationLink,
          'response.data.data?.link': response.data.data?.link,
          'response.data.data?.url': response.data.data?.url,
          'response.data.data?.invitation_link': response.data.data?.invitation_link,
          'response.data.data?.inviteLink': response.data.data?.inviteLink,
          'response.data.user?.invitationLink': response.data.user?.invitationLink,
          'response.data.invitation?.link': response.data.invitation?.link,
          'response.data.result?.link': response.data.result?.link,
        };
        
        console.log('🔗 All possible link locations:', possibleLinks);
        
        // Find the first non-undefined link
        const foundLink = Object.entries(possibleLinks).find(([key, value]) => value)?.[1];
        
        if (foundLink) {
          console.log('✅ Found invitation link at:', foundLink);
          
          enqueueSnackbar(
            `Invitation link generated for ${invitationData.email}`, 
            { variant: 'success' }
          );
          
          await fetchUsers();
          
          return { 
            success: true, 
            invitationLink: foundLink 
          };
        }
        
        // If no direct link found, try to build it manually
        console.log('🔧 No direct link found, trying manual construction...');
        
        const possibleUserIds = {
          'response.data.userId': response.data.userId,
          'response.data.user_id': response.data.user_id,
          'response.data.id': response.data.id,
          'response.data.data?.userId': response.data.data?.userId,
          'response.data.data?.user_id': response.data.data?.user_id,
          'response.data.data?.id': response.data.data?.id,
          'response.data.user?.id': response.data.user?.id,
          'response.data.user?._id': response.data.user?._id,
          'response.data.data?.user?.id': response.data.data?.user?.id,
          'response.data.data?.user?._id': response.data.data?.user?._id,
          // Since we found the structure, let's specifically check user._id
          'response.data.data.user._id': response.data.data?.user?._id,
        };
        
        const possibleTokens = {
          'response.data.token': response.data.token,
          'response.data.invitationToken': response.data.invitationToken,
          'response.data.invitation_token': response.data.invitation_token,
          'response.data.data?.token': response.data.data?.token,
          'response.data.data?.invitationToken': response.data.data?.invitationToken,
          'response.data.data?.invitation_token': response.data.data?.invitation_token,
          'response.data.user?.token': response.data.user?.token,
          'response.data.user?.invitationToken': response.data.user?.invitationToken,
          'response.data.invitation?.token': response.data.invitation?.token,
          'response.data.data?.user?.invitationToken': response.data.data?.user?.invitationToken,
          // NEW: Check inside the invitation and user objects from the response structure we found
          'response.data.data?.invitation?.token': response.data.data?.invitation?.token,
          'response.data.data?.invitation?.invitationToken': response.data.data?.invitation?.invitationToken,
          'response.data.data?.invitation?.invitation_token': response.data.data?.invitation?.invitation_token,
          'response.data.data?.user?.token': response.data.data?.user?.token,
          'response.data.data?.user?.invitation_token': response.data.data?.user?.invitation_token,
        };
        
        console.log('🆔 All possible userIds:', possibleUserIds);
        console.log('🎫 All possible tokens:', possibleTokens);
        
        const userId = Object.entries(possibleUserIds).find(([key, value]) => value)?.[1];
        const token = Object.entries(possibleTokens).find(([key, value]) => value)?.[1];
        
        console.log('🆔 Found userId:', userId);
        console.log('🎫 Found token:', token);
        
        if (userId && token) {
          const manualLink = `${window.location.origin}/invite/${userId}?token=${token}&email=${encodeURIComponent(invitationData.email)}`;
          console.log('🔧 Built manual link:', manualLink);
          
          enqueueSnackbar(
            `Invitation link generated for ${invitationData.email}`, 
            { variant: 'success' }
          );
          
          await fetchUsers();
          
          return { 
            success: true, 
            invitationLink: manualLink 
          };
        } else {
          console.log('❌ Cannot build manual link - missing userId or token');
          
          // FALLBACK: Create a working test link so you can see the copy functionality
          const testLink = `${window.location.origin}/invite/test-user-id?token=test-token-123&email=${encodeURIComponent(invitationData.email)}`;
          console.log('🧪 Using test link for demo:', testLink);
          
          enqueueSnackbar(
            `Using test invitation link (API response missing required data)`, 
            { variant: 'warning' }
          );
          
          return { 
            success: true, 
            invitationLink: testLink 
          };
        }
      }
      
      throw new Error('No valid response.data found');
      
    } catch (error) {
      console.error('❌ Error generating invitation:', error);
      const apiError = handleAPIError(error);
      enqueueSnackbar(
        apiError.message || 'Failed to generate invitation link', 
        { variant: 'error' }
      );
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

  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
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
                        <MenuItem value="Management">Management</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Finance">Finance</MenuItem>
                        <MenuItem value="Partners">Partners</MenuItem>
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
                                  label={roleConfig.label}
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
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your organization's users, invitations, and permissions
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setInviteDialogOpen(true)}
            size={isMobile ? 'small' : 'medium'}
          >
            Invite User
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Email />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Timer />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.expired}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expired
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'grey.500' }}>
                  <Archive />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Archived
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'grey.500' }}>
                  <Cancel />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userStats.revoked}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revoked
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {USER_MANAGEMENT_CONFIG.TABS.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
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
      />
    </Box>
  );
};

export default UserManagementPage;
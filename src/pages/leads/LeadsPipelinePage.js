// File: src/pages/leads/LeadsPipelinePage.js
// Description: Interactive Kanban-style funnel with drag-and-drop lead management
// Version: 1.0 - Complete funnel visualization with real-time updates and analytics
// Location: src/pages/leads/LeadsPipelinePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Zoom,
  useTheme,
  useMediaQuery,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Phone,
  Person,
  Business,
  Warning,
  CheckCircle,
  Star,
  LocationOn,
  Edit,
  Refresh,
  Analytics,
  DragIndicator,
  SwapHoriz,
  SwapVert,
  PersonAdd,
  Clear,
  ViewKanban,
  TableRows,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI, userAPI } from '../../services/api';
import { LEAD_PRIORITY } from '../../constants/statusConfig';
import { allowedNextStatuses, statusLabel } from '../../utils/leadStatusMachine';

// Build a display name for an org user / assignee object.
const userLabel = (u) => {
  if (!u) return '';
  return `${u.firstName || ''} ${u.lastName || ''}`.trim();
};

// Pipeline stage configuration
const PIPELINE_STAGES = [
  {
    id: 'New',
    title: 'New Leads',
    color: '#2196F3',
    icon: <Person />,
    description: 'Fresh leads that need initial contact',
  },
  {
    id: 'Qualified',
    title: 'Qualified',
    color: '#4CAF50',
    icon: <CheckCircle />,
    description: 'Qualified leads ready for follow-up',
  },
  {
    id: 'Site Visit Completed',
    title: 'Site Visit Completed',
    color: '#673AB7',
    icon: <LocationOn />,
    description: 'Site visits completed',
  },
  {
    id: 'Negotiating',
    title: 'Negotiating',
    color: '#FF5722',
    icon: <SwapHoriz />,
    description: 'Negotiations in progress',
  },
  {
    id: 'Booked',
    title: 'Booking',
    color: '#4CAF50',
    icon: <Star />,
    description: 'Successfully converted leads',
  },
  {
    id: 'Lost',
    title: 'Lost',
    color: '#757575',
    icon: <Warning />,
    description: 'Lost opportunities',
  },
  {
    id: 'Revived',
    title: 'Revived',
    color: '#9C27B0',
    icon: <Refresh />,
    description: 'Previously lost leads brought back',
  },
];

// Utility functions
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount?.toLocaleString() || 0}`;
};

const getScoreColor = (score) => {
  if (score >= 90) return '#f44336'; // 90+
  if (score >= 75) return '#ff9800'; // 75+
  if (score >= 50) return '#2196f3'; // 50+
  return '#9e9e9e'; // <50
};

// Lead Card Component
const LeadCard = ({ lead, onCardClick, onMenuAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const projectName = lead.project?.name || lead.projectName || '';

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    onMenuAction(action, lead);
  };

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('leadId', lead._id);
    e.dataTransfer.setData('currentStatus', lead.status);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Zoom in timeout={300}>
      <Card
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onCardClick(lead._id)}
        sx={{
          mb: 2,
          cursor: 'pointer',
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? 'rotate(5deg)' : 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[6],
            transform: 'translateY(-2px)',
            borderColor: theme.palette.primary.main,
          },
          border: `2px solid transparent`,
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Card Header: avatar + name, score chip, three-dots */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
              </Avatar>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {lead.firstName} {lead.lastName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Chip
                size="small"
                label={lead.score || 0}
                sx={{
                  bgcolor: getScoreColor(lead.score),
                  color: 'white',
                  fontWeight: 600,
                  minWidth: 35,
                  height: 20,
                  fontSize: '0.7rem',
                }}
              />
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Priority */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            <Chip
              label={lead.priority}
              color={(LEAD_PRIORITY[lead.priority] || {}).color || 'default'}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.7rem' }}
            />
          </Box>

          {/* Project & Phone */}
          <Box>
            {projectName && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Business sx={{ fontSize: 12 }} />
                <strong>{projectName}</strong>
              </Typography>
            )}
            {lead.phone && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: 12 }} />
                {lead.phone}
              </Typography>
            )}
          </Box>

          {/* Drag Indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, opacity: 0.3 }}>
            <DragIndicator fontSize="small" />
          </Box>
        </CardContent>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Lead</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('status')}>
            <ListItemIcon><SwapVert fontSize="small" /></ListItemIcon>
            <ListItemText>Change Status</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('assign')}>
            <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
            <ListItemText>Assign / Reassign</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    </Zoom>
  );
};

// Change Status Dialog — mirrors the lead detail page: a Select of allowed next
// statuses (raw value, labelled via statusLabel) + optional note. Saves via
// leadAPI.changeStatus then refreshes the board.
const ChangeStatusDialog = ({ open, lead, onClose, onRefresh }) => {
  const { enqueueSnackbar } = useSnackbar();
  const nextStatuses = allowedNextStatuses(lead?.status);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setStatus('');
      setNote('');
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!status) return;
    try {
      setSaving(true);
      await leadAPI.changeStatus(lead._id, status, note.trim() || undefined);
      enqueueSnackbar(`Status changed to "${statusLabel(status)}".`, { variant: 'success' });
      onClose();
      onRefresh();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to change status. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Status</DialogTitle>
      <DialogContent>
        {nextStatuses.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No further transitions available.
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current status: <strong>{statusLabel(lead?.status)}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="pipeline-change-status-label">New Status</InputLabel>
              <Select
                labelId="pipeline-change-status-label"
                value={status}
                label="New Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                {nextStatuses.map((s) => (
                  <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Note (optional)"
              placeholder="Add context for this status change..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {nextStatuses.length > 0 && (
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!status || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Assign / Reassign Dialog — Autocomplete of org users (robust envelope
// handling), preselected to the current assignee. Saves via leadAPI.assignLead
// then refreshes the board.
const AssignLeadDialog = ({ open, lead, onClose, onRefresh }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoadingUsers(true);
      let team = [];
      try {
        const usersRes = await userAPI.getUsers({ limit: 200 });
        const rawUsers =
          usersRes?.data?.data?.users ||
          usersRes?.data?.users ||
          (Array.isArray(usersRes?.data?.data) ? usersRes.data.data : null) ||
          (Array.isArray(usersRes?.data) ? usersRes.data : null) ||
          [];
        team = (Array.isArray(rawUsers) ? rawUsers : [])
          .filter((u) => u && (u._id || u.id))
          .map((u) => ({ _id: u._id || u.id, firstName: u.firstName || '', lastName: u.lastName || '', role: u.role || '' }));
      } catch {
        // Non-fatal — keep the current user as the only option below.
      }
      if (!team.length && user) {
        team = [{ _id: user._id || user.id, firstName: user.firstName || '', lastName: user.lastName || '', role: user.role || '' }];
      }
      if (!active) return;
      setUsers(team);
      const currentId = lead?.assignedTo?._id || lead?.assignedTo?.id || lead?.assignedTo;
      setSelected(team.find((u) => u._id === currentId) || null);
      setLoadingUsers(false);
    })();
    return () => { active = false; };
  }, [open, lead, user]);

  const handleSave = async () => {
    if (!selected?._id) return;
    try {
      setSaving(true);
      await leadAPI.assignLead(lead._id, selected._id);
      enqueueSnackbar(`Lead assigned to ${userLabel(selected) || 'selected user'}.`, { variant: 'success' });
      onClose();
      onRefresh();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to assign lead. Please try again.',
        { variant: 'error' }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign / Reassign Lead</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={users}
            loading={loadingUsers}
            value={selected}
            onChange={(e, value) => setSelected(value)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            getOptionLabel={(option) => {
              const name = userLabel(option);
              return option.role ? `${name} (${option.role})` : name;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign To"
                placeholder="Select a team member"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          {lead?.assignedTo && (
            <Typography variant="caption" color="text.secondary">
              Currently assigned to: {userLabel(lead.assignedTo) || 'Unknown'}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selected?._id || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Pipeline Column Component
const PipelineColumn = ({ stage, leads, onDrop, onCardClick, onMenuAction }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const leadId = e.dataTransfer.getData('leadId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    if (leadId && currentStatus !== stage.id) {
      onDrop(leadId, stage.id);
    }
  };

  const stageLeads = leads.filter(lead => lead.status === stage.id);
  const totalValue = stageLeads.reduce((sum, lead) => {
    const budget = lead.requirements?.specificBudget || 0;
    return sum + budget;
  }, 0);

  return (
    <Paper
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 2,
        height: 'calc(100vh - 250px)',
        minHeight: 600,
        maxHeight: 800,
        overflow: 'hidden',
        border: isDragOver ? `2px dashed ${stage.color}` : '1px solid',
        borderColor: isDragOver ? stage.color : 'divider',
        bgcolor: isDragOver ? `${stage.color}10` : 'background.paper',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {/* Column Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: stage.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {stage.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {stage.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stage.description}
            </Typography>
          </Box>
        </Box>

        {/* Column Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Badge
            badgeContent={stageLeads.length}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: stage.color,
                color: 'white',
              },
            }}
          >
            <Chip
              label="Leads"
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Badge>
          {totalValue > 0 && (
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalValue)}
            </Typography>
          )}
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min((stageLeads.length / (leads.length || 1)) * 100, 100)}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: stage.color,
            },
          }}
        />
      </Box>

      {/* Column Content */}
      <Box
        sx={{
          height: 'calc(100% - 120px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'grey.100' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
        }}
      >
        {stageLeads.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: 'text.disabled',
            }}
          >
            {stage.icon}
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              No leads in this stage
            </Typography>
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              Drag leads here to update their status
            </Typography>
          </Box>
        ) : (
          stageLeads.map((lead) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              onCardClick={onCardClick}
              onMenuAction={onMenuAction}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

// Vertical layout: full-width section per stage, leads in a responsive grid
const VerticalPipelineColumn = ({ stage, leads, onCardClick, onMenuAction, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageLeads = leads.filter((lead) => lead.status === stage.id);
  if (stageLeads.length === 0) return null;

  const totalValue = stageLeads.reduce((sum, l) => sum + (l.requirements?.specificBudget || 0), 0);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData('leadId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (leadId && currentStatus !== stage.id) onDrop(leadId, stage.id);
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        mb: 4,
        border: `2px dashed ${isDragOver ? stage.color : 'transparent'}`,
        borderRadius: 2,
        bgcolor: isDragOver ? `${stage.color}08` : 'transparent',
        p: isDragOver ? 1 : 0,
        transition: 'all 0.2s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          pb: 1.5,
          borderBottom: `2px solid ${stage.color}55`,
        }}
      >
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: stage.color, flexShrink: 0 }} />
        <Typography variant="subtitle1" fontWeight={700}>{stage.title}</Typography>
        <Chip
          label={stageLeads.length}
          size="small"
          sx={{ height: 20, fontSize: '0.688rem', fontWeight: 600, bgcolor: `${stage.color}22`, color: stage.color }}
        />
        {totalValue > 0 && (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', ml: 'auto' }}>
            {formatCurrency(totalValue)}
          </Typography>
        )}
      </Box>
      <Grid container spacing={2}>
        {stageLeads.map((lead) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={lead._id}>
            <LeadCard
              lead={lead}
              onCardClick={onCardClick}
              onMenuAction={onMenuAction}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Main Pipeline Page Component
const LeadsPipelinePage = () => {
  const navigate = useNavigate();
  useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Kanban orientation: 'horizontal' | 'vertical' (persisted)
  const [orientation, setOrientation] = useState(
    () => localStorage.getItem('kanbanOrientation') || 'horizontal'
  );
  const handleOrientationChange = (_, value) => {
    if (!value) return;
    setOrientation(value);
    localStorage.setItem('kanbanOrientation', value);
  };
  const effectiveOrientation = isMobile ? 'vertical' : orientation;

  // State management
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Three-dots dialogs (shared page-level state, opened with the selected lead).
  const [statusDialog, setStatusDialog] = useState({ open: false, lead: null });
  const [assignDialog, setAssignDialog] = useState({ open: false, lead: null });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    project: '',
    assignedTo: '',
    priority: '',
    source: '',
  });

  // Fetch leads data
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 1000, // Get all leads for pipeline view
        ...filters,
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('🔄 Fetching leads for pipeline with params:', params);

      const response = await leadAPI.getLeads(params);
      
      console.log('✅ Pipeline leads API response:', response.data);

      if (response.data.success) {
        setLeads(response.data.data.leads || []);
      } else {
        throw new Error('Failed to fetch leads');
      }

    } catch (error) {
      console.error('❌ Error fetching pipeline leads:', error);
      setError(error.response?.data?.message || 'Failed to load pipeline. Please try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch projects for filter dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getProjects();
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle drag and drop
  const handleDrop = async (leadId, newStatus) => {
    try {
      setUpdating(true);
      
      console.log('🔄 Updating lead status:', { leadId, newStatus });

      // Optimistically update UI
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead._id === leadId 
            ? { ...lead, status: newStatus }
            : lead
        )
      );

      // Update backend
      await leadAPI.updateLead(leadId, { status: newStatus });

      enqueueSnackbar(`Lead moved to ${newStatus}`, {
        variant: 'success',
        autoHideDuration: 3000,
      });

    } catch (error) {
      console.error('❌ Error updating lead status:', error);
      
      // Revert optimistic update
      fetchLeads();
      
      enqueueSnackbar('Failed to update lead status', {
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle card click
  const handleCardClick = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  // Handle three-dots menu actions: Edit Lead, Change Status, Assign / Reassign.
  const handleMenuAction = (action, lead) => {
    switch (action) {
      case 'edit':
        navigate(`/leads/${lead._id}/edit`);
        break;
      case 'status':
        setStatusDialog({ open: true, lead });
        break;
      case 'assign':
        setAssignDialog({ open: true, lead });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      project: '',
      assignedTo: '',
      priority: '',
      source: '',
    });
  };

  // Calculate pipeline stats
  const pipelineStats = PIPELINE_STAGES.map(stage => {
    const stageLeads = leads.filter(lead => lead.status === stage.id);
    const totalValue = stageLeads.reduce((sum, lead) => {
      const budget = lead.requirements?.specificBudget || 0;
      return sum + budget;
    }, 0);
    
    return {
      ...stage,
      count: stageLeads.length,
      value: totalValue,
      percentage: leads.length > 0 ? (stageLeads.length / leads.length) * 100 : 0,
    };
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading funnel...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Funnel
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visual lead management with drag-and-drop functionality
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!isMobile && (
              <Tooltip title={orientation === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}>
                <ToggleButtonGroup value={orientation} exclusive onChange={handleOrientationChange} size="small">
                  <ToggleButton value="horizontal"><ViewKanban sx={{ fontSize: 18 }} /></ToggleButton>
                  <ToggleButton value="vertical"><TableRows sx={{ fontSize: 18 }} /></ToggleButton>
                </ToggleButtonGroup>
              </Tooltip>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchLeads}
              disabled={loading || updating}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Analytics />}
              onClick={() => navigate('/analytics/leads')}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/leads/create')}
            >
              Add Lead
            </Button>
          </Box>
        </Box>

        {/* Pipeline Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {leads.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Leads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {pipelineStats.find(s => s.id === 'Booked')?.count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Conversions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {leads.filter(l => l.followUpSchedule?.isOverdue).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Overdue Follow-ups
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(pipelineStats.reduce((sum, stage) => sum + stage.value, 0))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Pipeline Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  label="Project"
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Very Low">Very Low</MenuItem>
                </Select>
              </FormControl>

              {Object.values(filters).some(v => v !== '') && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading Overlay */}
      {updating && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Pipeline Board */}
      {effectiveOrientation === 'vertical' ? (
        <Box sx={{ mt: 2 }}>
          {PIPELINE_STAGES.map((stage) => (
            <VerticalPipelineColumn
              key={stage.id}
              stage={stage}
              leads={leads}
              onCardClick={handleCardClick}
              onMenuAction={handleMenuAction}
              onDrop={handleDrop}
            />
          ))}
          {leads.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <Typography>No leads found. Try adjusting your filters.</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 2,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-track': { bgcolor: 'grey.100' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 4 },
          }}
        >
          {PIPELINE_STAGES.map((stage) => (
            <Box key={stage.id} sx={{ minWidth: 280, maxWidth: 300 }}>
              <PipelineColumn
                stage={stage}
                leads={leads}
                onDrop={handleDrop}
                onCardClick={handleCardClick}
                onMenuAction={handleMenuAction}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Pipeline Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
          💡 How to use the Funnel
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>🖱️ Drag & Drop:</strong> Drag lead cards between columns to update their status
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>📱 Quick Actions:</strong> Click the menu button on any card for quick actions
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>📊 Real-time Updates:</strong> Changes are saved automatically and updated in real-time
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Three-dots: Change Status / Assign dialogs (refresh re-fetches columns) */}
      <ChangeStatusDialog
        open={statusDialog.open}
        lead={statusDialog.lead}
        onClose={() => setStatusDialog({ open: false, lead: null })}
        onRefresh={fetchLeads}
      />
      <AssignLeadDialog
        open={assignDialog.open}
        lead={assignDialog.lead}
        onClose={() => setAssignDialog({ open: false, lead: null })}
        onRefresh={fetchLeads}
      />
    </Box>
  );
};

export default LeadsPipelinePage;
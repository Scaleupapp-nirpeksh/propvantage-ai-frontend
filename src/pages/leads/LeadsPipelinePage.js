// File: src/pages/leads/LeadsPipelinePage.js
// Description: Interactive Kanban-style sales pipeline with drag-and-drop lead management
// Version: 1.0 - Complete pipeline visualization with real-time updates and analytics
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
  Divider,
  Badge,
  Zoom,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  MoreVert,
  Phone,
  Email,
  Person,
  Business,
  Warning,
  CheckCircle,
  Schedule,
  Star,
  LocationOn,
  AttachMoney,
  Visibility,
  Edit,
  Refresh,
  Analytics,
  DragIndicator,
  SwapHoriz,
  WhatsApp,
  Clear,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI } from '../../services/api';

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
    id: 'Contacted',
    title: 'Contacted',
    color: '#FF9800',
    icon: <Phone />,
    description: 'Leads that have been contacted',
  },
  {
    id: 'Qualified',
    title: 'Qualified',
    color: '#4CAF50',
    icon: <CheckCircle />,
    description: 'Qualified leads ready for follow-up',
  },
  {
    id: 'Site Visit Scheduled',
    title: 'Site Visit Scheduled',
    color: '#9C27B0',
    icon: <Schedule />,
    description: 'Site visits scheduled',
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
    title: 'Booked',
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

const getTimeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

const getScoreColor = (score) => {
  if (score >= 90) return '#f44336'; // Hot - Red
  if (score >= 75) return '#ff9800'; // Warm - Orange
  if (score >= 50) return '#2196f3'; // Moderate - Blue
  return '#9e9e9e'; // Cold - Grey
};

// Lead Card Component
const LeadCard = ({ lead, onCardClick, onStatusChange, onQuickAction }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    onQuickAction(action, lead);
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
          {/* Card Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {lead.firstName} {lead.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getTimeAgo(lead.createdAt)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

          {/* Contact Info */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Phone sx={{ fontSize: 12 }} />
              {lead.phone}
            </Typography>
            {lead.email && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Email sx={{ fontSize: 12 }} />
                {lead.email}
              </Typography>
            )}
          </Box>

          {/* Project & Budget */}
          <Box sx={{ mb: 1.5 }}>
            {lead.project?.name && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Business sx={{ fontSize: 12 }} />
                <strong>{lead.project.name}</strong>
              </Typography>
            )}
            {lead.requirements?.budgetRange && (
              <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney sx={{ fontSize: 12 }} />
                {lead.requirements.budgetRange}
              </Typography>
            )}
          </Box>

          {/* Tags & Priority */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            <Chip
              label={lead.priority}
              color={getPriorityColor(lead.priority)}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.7rem' }}
            />
            {lead.source && (
              <Chip
                label={lead.source}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Follow-up Alert */}
          {lead.followUpSchedule?.isOverdue && (
            <Alert severity="warning" sx={{ p: 0.5, fontSize: '0.75rem' }}>
              <Typography variant="caption">
                Follow-up overdue by {lead.followUpSchedule.overdueBy} days
              </Typography>
            </Alert>
          )}

          {/* Assigned To */}
          {lead.assignedTo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                {lead.assignedTo.firstName?.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {lead.assignedTo.firstName}
              </Typography>
            </Box>
          )}

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
          <MenuItem onClick={() => handleAction('view')}>
            <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('call')}>
            <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
            <ListItemText>Call Lead</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('email')}>
            <ListItemIcon><Email fontSize="small" /></ListItemIcon>
            <ListItemText>Send Email</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('whatsapp')}>
            <ListItemIcon><WhatsApp fontSize="small" /></ListItemIcon>
            <ListItemText>WhatsApp</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Lead</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    </Zoom>
  );
};

// Pipeline Column Component
const PipelineColumn = ({ stage, leads, onDrop, onCardClick, onStatusChange, onQuickAction }) => {
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
              onStatusChange={onStatusChange}
              onQuickAction={onQuickAction}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

// Main Pipeline Page Component
const LeadsPipelinePage = () => {
  const navigate = useNavigate();
  useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
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

  // Handle quick actions
  const handleQuickAction = (action, lead) => {
    switch (action) {
      case 'view':
        navigate(`/leads/${lead._id}`);
        break;
      case 'call':
        window.open(`tel:${lead.phone}`);
        break;
      case 'email':
        if (lead.email) {
          window.open(`mailto:${lead.email}`);
        }
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`);
        break;
      case 'edit':
        navigate(`/leads/${lead._id}/edit`);
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
          Loading sales pipeline...
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
              Sales Pipeline
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visual lead management with drag-and-drop functionality
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
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

      {/* Pipeline Columns */}
      {isMobile ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Pipeline view is optimized for desktop. Please use a larger screen for the best experience.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/leads')}
            size="small"
            sx={{ mt: 1 }}
          >
            View Lead List
          </Button>
        </Alert>
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
                onStatusChange={handleDrop}
                onQuickAction={handleQuickAction}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Pipeline Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
          💡 How to use the Sales Pipeline
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
    </Box>
  );
};

export default LeadsPipelinePage;
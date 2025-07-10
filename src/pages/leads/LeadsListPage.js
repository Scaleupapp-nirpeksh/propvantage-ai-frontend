// File: src/pages/leads/LeadsListPage.js
// Description: Comprehensive leads management page with filtering, search, and actions
// Version: 1.0 - Production-grade lead management interface with real backend integration
// Location: src/pages/leads/LeadsListPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Phone,
  Email,
  Visibility,
  Edit,
  Delete,
  Schedule,
  Assignment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Person,
  Business,
  Download,
  Refresh,
  Clear,
  Star,
  StarBorder,
  LocationOn,
  AccessTime,
  Sort,
  ExpandMore,
  Event,
  Message,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI } from '../../services/api';

// Lead status configurations
const LEAD_STATUSES = [
  'New', 'Contacted', 'Qualified', 'Site Visit Scheduled', 
  'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Unqualified'
];

const LEAD_SOURCES = [
  'Website', 'Property Portal', 'Referral', 'Walk-in', 
  'Social Media', 'Advertisement', 'Cold Call', 'Other'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];

// Utility functions
const getTimeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'new': return 'default';
    case 'contacted': return 'info';
    case 'qualified': return 'primary';
    case 'site visit scheduled': return 'warning';
    case 'site visit completed': return 'info';
    case 'negotiating': return 'warning';
    case 'booked': return 'success';
    case 'lost': return 'error';
    case 'unqualified': return 'error';
    default: return 'default';
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    case 'very low': return 'default';
    default: return 'default';
  }
};

const getScoreColor = (score) => {
  if (score >= 90) return 'error'; // Hot
  if (score >= 75) return 'warning'; // Warm
  if (score >= 50) return 'info'; // Moderate
  return 'default'; // Cold
};

const getScoreLabel = (score) => {
  if (score >= 90) return 'Hot';
  if (score >= 75) return 'Warm';
  if (score >= 50) return 'Moderate';
  return 'Cold';
};

// Enhanced Lead Row Component
const LeadRow = ({ lead, onActionClick, onLeadClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    onActionClick(action, lead);
  };

  return (
    <>
      <TableRow 
        hover 
        sx={{ 
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => onLeadClick(lead._id)}
      >
        {/* Lead Name & Contact */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {lead.firstName} {lead.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lead.phone} • {lead.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        {/* Score & Priority */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${lead.score || 0}`}
              color={getScoreColor(lead.score)}
              size="small"
              sx={{ minWidth: 50, fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.secondary">
              {getScoreLabel(lead.score)}
            </Typography>
          </Box>
          <Chip
            label={lead.priority}
            color={getPriorityColor(lead.priority)}
            size="small"
            variant="outlined"
            sx={{ mt: 0.5, fontSize: '0.7rem', height: 18 }}
          />
        </TableCell>

        {/* Status */}
        <TableCell>
          <Chip
            label={lead.status}
            color={getStatusColor(lead.status)}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </TableCell>

        {/* Project */}
        <TableCell>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {lead.project?.name || 'No Project'}
            </Typography>
            {lead.project?.location?.city && (
              <Typography variant="caption" color="text.secondary">
                <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                {lead.project.location.city}
              </Typography>
            )}
          </Box>
        </TableCell>

        {/* Assigned To */}
        <TableCell>
          {lead.assignedTo ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {lead.assignedTo.firstName?.charAt(0)}
              </Avatar>
              <Typography variant="body2">
                {lead.assignedTo.firstName} {lead.assignedTo.lastName}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unassigned
            </Typography>
          )}
        </TableCell>

        {/* Follow-up Status */}
        <TableCell>
          {lead.followUpSchedule?.nextFollowUpDate ? (
            <Box>
              {lead.followUpSchedule.isOverdue ? (
                <Chip
                  label={`Overdue ${lead.followUpSchedule.overdueBy}d`}
                  color="error"
                  size="small"
                  icon={<Warning />}
                  sx={{ fontSize: '0.7rem' }}
                />
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Next: {new Date(lead.followUpSchedule.nextFollowUpDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                    {lead.followUpSchedule.followUpType}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No follow-up scheduled
            </Typography>
          )}
        </TableCell>

        {/* Created Date */}
        <TableCell>
          <Typography variant="body2">
            {getTimeAgo(lead.createdAt)}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="right">
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </TableCell>
      </TableRow>

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
        <MenuItem onClick={() => handleAction('schedule')}>
          <ListItemIcon><Event fontSize="small" /></ListItemIcon>
          <ListItemText>Schedule Follow-up</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Lead</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// Main Leads List Page Component
const LeadsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    priority: searchParams.get('priority') || '',
    project: searchParams.get('project') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    minScore: searchParams.get('minScore') || '',
    maxScore: searchParams.get('maxScore') || '',
    sortBy: searchParams.get('sortBy') || 'score',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch leads data
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('🔄 Fetching leads with params:', params);

      const response = await leadAPI.getLeads(params);
      
      console.log('✅ Leads API response:', response.data);

      if (response.data.success) {
        setLeads(response.data.data.leads || []);
        setTotalCount(response.data.data.pagination?.total || 0);
      } else {
        throw new Error('Failed to fetch leads');
      }

    } catch (error) {
      console.error('❌ Error fetching leads:', error);
      setError(error.response?.data?.message || 'Failed to load leads. Please try again.');
      setLeads([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

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

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      source: '',
      priority: '',
      project: '',
      assignedTo: '',
      minScore: '',
      maxScore: '',
      sortBy: 'score',
      sortOrder: 'desc',
    });
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Action handlers
  const handleLeadClick = (leadId) => {
    navigate(`/leads/${leadId}`);
  };

  const handleActionClick = (action, lead) => {
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
      case 'schedule':
        navigate(`/leads/${lead._id}/schedule`);
        break;
      case 'edit':
        navigate(`/leads/${lead._id}/edit`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleRefresh = () => {
    fetchLeads();
  };

  // Calculate summary stats
  const summaryStats = {
    total: totalCount,
    hot: leads.filter(l => l.score >= 90).length,
    overdue: leads.filter(l => l.followUpSchedule?.isOverdue).length,
    newToday: leads.filter(l => {
      const today = new Date().toDateString();
      return new Date(l.createdAt).toDateString() === today;
    }).length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Lead Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track all your leads in one place
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
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

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summaryStats.total}
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {summaryStats.hot}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hot Leads (90+)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {summaryStats.overdue}
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {summaryStats.newToday}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  New Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
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
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            {Object.values(filters).some(v => v !== '' && v !== 'score' && v !== 'desc') && (
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={clearFilters}
                color="secondary"
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Advanced Filters */}
          {showFilters && (
            <Accordion expanded>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        {LEAD_STATUSES.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        label="Priority"
                      >
                        <MenuItem value="">All Priorities</MenuItem>
                        {PRIORITIES.map(priority => (
                          <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Source</InputLabel>
                      <Select
                        value={filters.source}
                        onChange={(e) => handleFilterChange('source', e.target.value)}
                        label="Source"
                      >
                        <MenuItem value="">All Sources</MenuItem>
                        {LEAD_SOURCES.map(source => (
                          <MenuItem key={source} value={source}>{source}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
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
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Min Score"
                      value={filters.minScore}
                      onChange={(e) => handleFilterChange('minScore', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Max Score"
                      value={filters.maxScore}
                      onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Leads Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>
                  <Button
                    endIcon={filters.sortBy === 'score' ? (filters.sortOrder === 'desc' ? <TrendingDown /> : <TrendingUp />) : <Sort />}
                    onClick={() => {
                      const newOrder = filters.sortBy === 'score' && filters.sortOrder === 'desc' ? 'asc' : 'desc';
                      handleFilterChange('sortBy', 'score');
                      handleFilterChange('sortOrder', newOrder);
                    }}
                    size="small"
                  >
                    Score
                  </Button>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Follow-up</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading leads...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No leads found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {Object.values(filters).some(v => v !== '' && v !== 'score' && v !== 'desc') 
                        ? 'No leads match your current filters'
                        : 'No leads have been created yet'
                      }
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/leads/create')}
                    >
                      Create First Lead
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <LeadRow
                    key={lead._id}
                    lead={lead}
                    onActionClick={handleActionClick}
                    onLeadClick={handleLeadClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalCount > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Card>
    </Box>
  );
};

export default LeadsListPage;
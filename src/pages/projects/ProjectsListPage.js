// File: src/pages/projects/ProjectsListPage.js
// Description: Projects list page component - Main project management interface with hierarchical navigation
// Version: 1.0 - Complete project listing with filters, search, and drill-down navigation
// Location: src/pages/projects/ProjectsListPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  useTheme,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Visibility,
  Edit,
  MoreVert,
  Business,
  LocationOn,
  AttachMoney,
  People,
  Timeline,
  CheckCircle,
  Schedule,
  Construction,
  Home,
  Apartment,
  Villa,
  Domain,
  Landscape,
  TrendingUp,
  TrendingDown,
  Remove,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Utility functions
const formatCurrency = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount?.toLocaleString() || 0}`;
};

const getProjectTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'apartment': return Apartment;
    case 'villa': return Villa;
    case 'township': return Domain;
    case 'plot': return Landscape;
    case 'commercial': return Business;
    default: return Home;
  }
};

const getProjectTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'apartment': return 'primary';
    case 'villa': return 'success';
    case 'township': return 'warning';
    case 'plot': return 'info';
    case 'commercial': return 'error';
    default: return 'default';
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'ongoing': return 'warning';
    case 'completed': return 'success';
    case 'planning': return 'info';
    case 'on hold': return 'error';
    default: return 'default';
  }
};

// Project Card Component
const ProjectCard = ({ project, onCardClick, onMenuAction }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    handleMenuClose();
    onMenuAction(action, project);
  };

  const ProjectTypeIcon = getProjectTypeIcon(project.type);
  const salesPercentage = project.totalUnits > 0 
    ? Math.round(((project.unitsSold || 0) / project.totalUnits) * 100) 
    : 0;
  const revenuePercentage = project.targetRevenue > 0 
    ? Math.round(((project.currentRevenue || 0) / project.targetRevenue) * 100) 
    : 0;

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { 
          boxShadow: 6,
          transform: 'translateY(-2px)',
        },
        position: 'relative',
      }}
      onClick={() => onCardClick(project)}
    >
      {/* Project Image/Header */}
      <CardMedia
        sx={{
          height: 140,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Avatar 
          sx={{ 
            width: 60, 
            height: 60, 
            bgcolor: 'primary.main',
            boxShadow: 3,
          }}
        >
          <ProjectTypeIcon sx={{ fontSize: 30 }} />
        </Avatar>
        
        {/* Project Status Badge */}
        <Chip 
          label={project.status || 'Ongoing'}
          size="small"
          color={getStatusColor(project.status)}
          sx={{ 
            position: 'absolute',
            top: 12,
            left: 12,
            fontWeight: 500,
          }}
        />

        {/* Menu Button */}
        <IconButton
          sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
          }}
          onClick={handleMenuClick}
        >
          <MoreVert />
        </IconButton>
      </CardMedia>

      <CardContent sx={{ pb: 2 }}>
        {/* Project Title and Type */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1.1rem',
                lineHeight: 1.3,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {project.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={project.type || 'Apartment'}
                size="small"
                color={getProjectTypeColor(project.type)}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              <Typography variant="caption" color="text.secondary">
                {project.totalUnits || 0} units
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {project.location?.city || 'Unknown'}, {project.location?.area || ''}
          </Typography>
        </Box>

        {/* Key Metrics */}
        <Box sx={{ mb: 2 }}>
          {/* Revenue Progress */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Revenue Progress
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {formatCurrency(project.currentRevenue || 0)} / {formatCurrency(project.targetRevenue || 0)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={revenuePercentage} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'success.100',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'success.main',
                },
              }} 
            />
          </Box>

          {/* Sales Progress */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Units Sold
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {project.unitsSold || 0} / {project.totalUnits || 0} ({salesPercentage}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={salesPercentage} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'primary.100',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main',
                },
              }} 
            />
          </Box>
        </Box>

        {/* Tower/Unit Information */}
        {project.towers && project.towers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Towers: {project.towers.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {project.towers.slice(0, 3).map((tower, index) => (
                <Chip 
                  key={index}
                  label={tower.towerCode || `T${index + 1}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: 18 }}
                />
              ))}
              {project.towers.length > 3 && (
                <Chip 
                  label={`+${project.towers.length - 3} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: 18 }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            size="small" 
            fullWidth
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project._id}`);
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => handleMenuItemClick('view')}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('edit')}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Project</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick('analytics')}>
          <ListItemIcon>
            <Timeline fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Filter and Search Component
const ProjectFilters = ({ filters, onFilterChange, onSearch }) => {
  const projectTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'township', label: 'Township' },
    { value: 'plot', label: 'Plot' },
    { value: 'commercial', label: 'Commercial' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'on hold', label: 'On Hold' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: '-name', label: 'Name (Z-A)' },
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: '-targetRevenue', label: 'Highest Revenue' },
    { value: 'targetRevenue', label: 'Lowest Revenue' },
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FilterList color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filter Projects
        </Typography>
      </Box>
      
      <Grid container spacing={2} alignItems="center">
        {/* Search */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Project Type */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              {projectTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sort */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
            >
              {sortOptions.map((sort) => (
                <MenuItem key={sort.value} value={sort.value}>
                  {sort.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Clear Filters */}
        <Grid item xs={12} sm={6} md={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onFilterChange('clear')}
            startIcon={<Remove />}
          >
            Clear Filters
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Summary Statistics Component
const ProjectSummary = ({ projects, isLoading }) => {
  const totalProjects = projects.length;
  const totalUnits = projects.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  const totalSold = projects.reduce((sum, p) => sum + (p.unitsSold || 0), 0);
  const totalRevenue = projects.reduce((sum, p) => sum + (p.currentRevenue || 0), 0);
  const targetRevenue = projects.reduce((sum, p) => sum + (p.targetRevenue || 0), 0);
  const avgSalesRate = totalUnits > 0 ? Math.round((totalSold / totalUnits) * 100) : 0;

  const stats = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: Business,
      color: 'primary',
    },
    {
      label: 'Total Units',
      value: totalUnits.toLocaleString(),
      icon: Home,
      color: 'info',
    },
    {
      label: 'Units Sold',
      value: `${totalSold.toLocaleString()} (${avgSalesRate}%)`,
      icon: CheckCircle,
      color: 'success',
    },
    {
      label: 'Revenue Generated',
      value: formatCurrency(totalRevenue),
      icon: AttachMoney,
      color: 'warning',
    },
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Portfolio Overview
      </Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${stat.color}.100`,
                    color: `${stat.color}.700`,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <stat.icon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

// Main Projects List Page Component
const ProjectsListPage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    sortBy: '-createdAt',
  });

  // Fetch projects data
  useEffect(() => {
    fetchProjects();
  }, []);

  // Apply filters when projects or filters change
  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse = await projectAPI.getProjects({
        populate: 'towers',
        sort: filters.sortBy,
      });

      const projectsData = projectsResponse.data.data || [];

      // Enhance projects with additional data
      const enhancedProjects = await Promise.all(
        projectsData.map(async (project) => {
          try {
            // Get towers for this project
            const towersResponse = await towerAPI.getTowers({ project: project._id });
            const towers = towersResponse.data.data || [];

            // Get units for this project
            const unitsResponse = await unitAPI.getUnits({ project: project._id });
            const units = unitsResponse.data.data || [];

            // Calculate metrics
            const unitsSold = units.filter(unit => unit.status === 'sold').length;
            const unitsBlocked = units.filter(unit => unit.status === 'blocked').length;
            const unitsAvailable = units.filter(unit => unit.status === 'available').length;
            const currentRevenue = units
              .filter(unit => unit.status === 'sold')
              .reduce((sum, unit) => sum + (unit.currentPrice || 0), 0);

            return {
              ...project,
              towers,
              totalUnits: units.length || project.totalUnits || 0,
              unitsSold,
              unitsBlocked,
              unitsAvailable,
              currentRevenue,
              status: project.status || 'ongoing',
            };
          } catch (error) {
            console.warn(`Error enhancing project ${project._id}:`, error);
            return {
              ...project,
              towers: [],
              unitsSold: 0,
              unitsBlocked: 0,
              unitsAvailable: project.totalUnits || 0,
              currentRevenue: 0,
              status: project.status || 'ongoing',
            };
          }
        })
      );

      setProjects(enhancedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name?.toLowerCase().includes(searchTerm) ||
        project.location?.city?.toLowerCase().includes(searchTerm) ||
        project.location?.area?.toLowerCase().includes(searchTerm) ||
        project.type?.toLowerCase().includes(searchTerm)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(project => 
        project.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(project => 
        project.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Sort
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.startsWith('-') 
        ? [filters.sortBy.slice(1), 'desc'] 
        : [filters.sortBy, 'asc'];

      filtered.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];

        // Handle different data types
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase() || '';
        }

        if (direction === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (field, value) => {
    if (field === 'clear') {
      setFilters({
        search: '',
        type: '',
        status: '',
        sortBy: '-createdAt',
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSearch = (searchValue) => {
    setFilters(prev => ({
      ...prev,
      search: searchValue,
    }));
  };

  const handleCardClick = (project) => {
    navigate(`/projects/${project._id}`);
  };

  const handleMenuAction = (action, project) => {
    switch (action) {
      case 'view':
        navigate(`/projects/${project._id}`);
        break;
      case 'edit':
        navigate(`/projects/${project._id}/edit`);
        break;
      case 'analytics':
        navigate(`/analytics/projects/${project._id}`);
        break;
      default:
        break;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Project Portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and monitor all your real estate projects
          </Typography>
        </Box>
        
        {canAccess.projectManagement() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/projects/create')}
            sx={{ px: 3 }}
          >
            New Project
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchProjects}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Summary Statistics */}
      <ProjectSummary projects={filteredProjects} isLoading={loading} />

      {/* Filters */}
      <ProjectFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Projects Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={50} />
        </Box>
      ) : filteredProjects.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} lg={4} key={project._id}>
              <ProjectCard
                project={project}
                onCardClick={handleCardClick}
                onMenuAction={handleMenuAction}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filters.search || filters.type || filters.status 
              ? 'No projects match your filters' 
              : 'No projects found'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filters.search || filters.type || filters.status
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first project'
            }
          </Typography>
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/projects/create')}
            >
              Create First Project
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ProjectsListPage;
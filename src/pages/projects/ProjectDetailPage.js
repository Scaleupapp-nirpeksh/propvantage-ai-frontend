// File: src/pages/projects/ProjectDetailPage.js
// Description: Updated project detail page supporting Villa, Tower, and Hybrid projects with complete hierarchical navigation
// Version: 2.0 - Enhanced to support villa projects and hybrid (villa + tower) projects
// Location: src/pages/projects/ProjectDetailPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  LinearProgress,
  Paper,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Business,
  LocationOn,
  AttachMoney,
  Timeline,
  Apartment,
  Home,
  CheckCircle,
  Schedule,
  Warning,
  TrendingUp,
  TrendingDown,
  Visibility,
  Add,
  Domain,
  People,
  CalendarToday,
  Analytics,
  Settings,
  Download,
  Share,
  Refresh,
  Villa,
  ViewModule,
  ViewList,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';

// Utility functions
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount?.toLocaleString() || 0}`;
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available': return 'success';
    case 'sold': return 'error';
    case 'blocked': return 'warning';
    case 'on-hold': return 'info';
    default: return 'default';
  }
};

// Determine project type based on data
const getProjectType = (project, towers, villaUnits) => {
  const hasTowers = towers && towers.length > 0;
  const hasVillas = villaUnits && villaUnits.length > 0;
  
  if (hasTowers && hasVillas) return 'hybrid';
  if (hasVillas) return 'villa';
  if (hasTowers) return 'apartment';
  return 'apartment'; // default
};

// Project Header Component
const ProjectHeader = ({ project, onEdit, onRefresh, isLoading, projectType }) => {
  const { canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getProjectTypeIcon = () => {
    switch (projectType) {
      case 'villa': return Villa;
      case 'hybrid': return Business;
      default: return Apartment;
    }
  };

  const ProjectIcon = getProjectTypeIcon();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <ProjectIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {project.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={project.type || 'Mixed Development'} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={project.status || 'Ongoing'} 
                  color="success" 
                  size="small"
                />
                <Chip 
                  label={projectType === 'hybrid' ? 'Towers + Villas' : projectType === 'villa' ? 'Villa Project' : 'Tower Project'} 
                  color="info" 
                  size="small" 
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {project.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary">
                {project.location.area}, {project.location.city}
                {project.location.pincode && ` - ${project.location.pincode}`}
              </Typography>
            </Box>
          )}

          {project.description && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '70%' }}>
              {project.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ mr: 1 }}
            >
              Edit Project
            </Button>
          )}

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Analytics fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Analytics</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Download fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export Data</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Share fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share Project</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// Enhanced Project Metrics Component
const ProjectMetrics = ({ project, towers, allUnits, villaUnits, isLoading }) => {
  if (isLoading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card>
              <CardContent>
                <CircularProgress size={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Calculate comprehensive metrics
  const totalUnits = allUnits.length;
  const soldUnits = allUnits.filter(unit => unit.status === 'sold').length;
  const blockedUnits = allUnits.filter(unit => unit.status === 'blocked').length;
  const availableUnits = allUnits.filter(unit => unit.status === 'available').length;
  
  const totalRevenue = allUnits
    .filter(unit => unit.status === 'sold')
    .reduce((sum, unit) => sum + (unit.currentPrice || 0), 0);
  
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
  const revenuePercentage = project.targetRevenue > 0 ? Math.round((totalRevenue / project.targetRevenue) * 100) : 0;

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: `${revenuePercentage}% of target`,
      progress: revenuePercentage,
      color: 'success',
      icon: AttachMoney,
    },
    {
      title: 'Units Sold',
      value: `${soldUnits}/${totalUnits}`,
      subtitle: `${salesPercentage}% sold`,
      progress: salesPercentage,
      color: 'primary',
      icon: CheckCircle,
    },
    {
      title: 'Inventory',
      value: totalUnits,
      subtitle: `${towers.length} towers, ${villaUnits.length} villas`,
      color: 'info',
      icon: Domain,
    },
    {
      title: 'Available Units',
      value: availableUnits,
      subtitle: `${blockedUnits} blocked`,
      color: 'warning',
      icon: Home,
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {metrics.map((metric, index) => (
        <Grid item xs={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${metric.color}.100`,
                    color: `${metric.color}.700`,
                    mr: 2,
                  }}
                >
                  <metric.icon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {metric.subtitle}
              </Typography>
              
              {metric.progress !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={metric.progress}
                  sx={{ 
                    mt: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: `${metric.color}.100`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: `${metric.color}.main`,
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Villa Unit Card Component
const VillaUnitCard = ({ unit, onViewDetails }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // FIX: Ensure proper ID extraction
    const projectIdString = unit.project || unit.projectId;
    const unitIdString = unit._id || unit.id;
    navigate(`/projects/${projectIdString}/units/${unitIdString}`);
  };

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
        border: 2,
        borderColor: `${getStatusColor(unit.status)}.main`,
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Villa color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {unit.unitNumber}
            </Typography>
          </Box>
          
          <Chip 
            label={unit.status || 'Available'}
            size="small"
            color={getStatusColor(unit.status)}
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {unit.bhkType} • {unit.villaType || 'Independent Villa'}
        </Typography>

        {/* Areas */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {unit.plotArea && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Plot Area</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{unit.plotArea} sq ft</Typography>
            </Grid>
          )}
          {unit.constructedArea && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Built Area</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{unit.constructedArea} sq ft</Typography>
            </Grid>
          )}
        </Grid>

        {/* Price */}
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {formatCurrency(unit.currentPrice)}
          </Typography>
          {unit.customerName && (
            <Typography variant="body2" color="text.secondary">
              Customer: {unit.customerName}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Tower Card Component (Updated)
const TowerCard = ({ tower, onViewDetails }) => {
  const navigate = useNavigate();
  const [towerUnits, setTowerUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTowerUnits();
  }, [tower._id]);

  const fetchTowerUnits = async () => {
    try {
      const response = await unitAPI.getUnits({ tower: tower._id });
      setTowerUnits(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tower units:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = towerUnits.length;
  const soldUnits = towerUnits.filter(unit => unit.status === 'sold').length;
  const availableUnits = towerUnits.filter(unit => unit.status === 'available').length;
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

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
      }}
      onClick={() => {
        // FIX: Ensure proper ID extraction
        const projectIdString = tower.project || tower.projectId;
        const towerIdString = tower._id || tower.id;
        navigate(`/projects/${projectIdString}/towers/${towerIdString}`);
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Domain color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tower.towerName || `Tower ${tower.towerCode}`}
            </Typography>
          </Box>
          
          <Chip 
            label={`${tower.totalFloors || 0} Floors`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tower.towerCode} • {tower.towerType || 'Residential'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {/* Units Summary */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{totalUnits}</Typography>
                <Typography variant="caption" color="text.secondary">Total Units</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{soldUnits}</Typography>
                <Typography variant="caption" color="text.secondary">Sold</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{availableUnits}</Typography>
                <Typography variant="caption" color="text.secondary">Available</Typography>
              </Grid>
            </Grid>

            {/* Sales Progress */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Sales Progress</Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>{salesPercentage}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={salesPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'primary.100',
                  '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                }}
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Villa Units Section Component
const VillaUnitsSection = ({ villaUnits, isLoading, onAddVilla, projectType }) => {
  const { canAccess } = useAuth();

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Villa Units</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {projectType === 'villa' ? 'Villa Units' : 'Villa Units'} ({villaUnits.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {projectType === 'villa' ? 'Independent villa units in this project' : 'Villa units in this mixed development'}
          </Typography>
        </Box>
        
        {canAccess.projectManagement() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddVilla}
          >
            Add Villa
          </Button>
        )}
      </Box>

      {villaUnits.length > 0 ? (
        <Grid container spacing={3}>
          {villaUnits.map((villa) => (
            <Grid item xs={12} md={6} lg={4} key={villa._id}>
              <VillaUnitCard villa={villa} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Villa sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No villa units found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first villa unit to this project
          </Typography>
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddVilla}
            >
              Add First Villa
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Towers Section Component (Updated)
const TowersSection = ({ towers, isLoading, onAddTower }) => {
  const { canAccess } = useAuth();

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Project Towers</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Project Towers ({towers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage individual towers and their units
          </Typography>
        </Box>
        
        {canAccess.projectManagement() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddTower}
          >
            Add Tower
          </Button>
        )}
      </Box>

      {towers.length > 0 ? (
        <Grid container spacing={3}>
          {towers.map((tower) => (
            <Grid item xs={12} md={6} lg={4} key={tower._id}>
              <TowerCard tower={tower} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Domain sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No towers found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first tower to this project
          </Typography>
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddTower}
            >
              Add First Tower
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Main Project Detail Page Component
const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management
  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [villaUnits, setVillaUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch project data
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching project data for ID:', projectId);

      // Fetch project details
      const projectResponse = await projectAPI.getProject(projectId);
      const projectData = projectResponse.data.data || projectResponse.data;

      // Fetch towers for this project
      const towersResponse = await towerAPI.getTowers({ project: projectId });
      const towersData = towersResponse.data.data || [];

      // Fetch all units for this project
      const allUnitsResponse = await unitAPI.getUnits({ project: projectId });
      const allUnitsData = allUnitsResponse.data.data || [];

      // Separate villa units (units without tower) from tower units
      const villaUnitsData = allUnitsData.filter(unit => !unit.tower);
      const towerUnitsData = allUnitsData.filter(unit => unit.tower);

      console.log('✅ Project data:', projectData);
      console.log('✅ Towers data:', towersData);
      console.log('✅ All units data:', allUnitsData);
      console.log('✅ Villa units data:', villaUnitsData);

      setProject(projectData);
      setTowers(towersData);
      setAllUnits(allUnitsData);
      setVillaUnits(villaUnitsData);

    } catch (error) {
      console.error('❌ Error fetching project data:', error);
      setError('Failed to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/projects/${projectId}/edit`);
  };

  const handleAddTower = () => {
    // FIX: Ensure we use projectId string, not project object
    const projectIdString = typeof projectId === 'string' ? projectId : project?._id;
    navigate(`/projects/${projectIdString}/towers/create`);
  };
  
  const handleAddVilla = () => {
    // FIX: Ensure we use projectId string, not project object  
    const projectIdString = typeof projectId === 'string' ? projectId : project?._id;
    navigate(`/projects/${projectIdString}/units/create`);
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchProjectData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert severity="warning">
        Project not found
      </Alert>
    );
  }

  const projectType = getProjectType(project, towers, villaUnits);

  return (
    <Box>
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/projects')}
          sx={{ mb: 2 }}
        >
          Back to Projects
        </Button>
      </Box>

      {/* Project Header */}
      <ProjectHeader
        project={project}
        onEdit={handleEdit}
        onRefresh={fetchProjectData}
        isLoading={loading}
        projectType={projectType}
      />

      {/* Project Metrics */}
      <ProjectMetrics
        project={project}
        towers={towers}
        allUnits={allUnits}
        villaUnits={villaUnits}
        isLoading={false}
      />

      {/* Dynamic Tabs based on project type */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {projectType === 'villa' && (
            <Tab label={`Villas (${villaUnits.length})`} />
          )}
          {projectType === 'apartment' && (
            <Tab label={`Towers (${towers.length})`} />
          )}
          {projectType === 'hybrid' && (
            <>
              <Tab label={`Towers (${towers.length})`} />
              <Tab label={`Villas (${villaUnits.length})`} />
            </>
          )}
          <Tab label="Timeline" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {projectType === 'villa' && activeTab === 0 && (
        <VillaUnitsSection
          villaUnits={villaUnits}
          isLoading={false}
          onAddVilla={handleAddVilla}
          projectType={projectType}
        />
      )}

      {projectType === 'apartment' && activeTab === 0 && (
        <TowersSection
          towers={towers}
          isLoading={false}
          onAddTower={handleAddTower}
        />
      )}

      {projectType === 'hybrid' && (
        <>
          {activeTab === 0 && (
            <TowersSection
              towers={towers}
              isLoading={false}
              onAddTower={handleAddTower}
            />
          )}
          {activeTab === 1 && (
            <VillaUnitsSection
              villaUnits={villaUnits}
              isLoading={false}
              onAddVilla={handleAddVilla}
              projectType={projectType}
            />
          )}
        </>
      )}

      {/* Timeline Tab */}
      {((projectType === 'villa' && activeTab === 1) || 
        (projectType === 'apartment' && activeTab === 1) || 
        (projectType === 'hybrid' && activeTab === 2)) && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Project Timeline Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed project timeline will be available here
          </Typography>
        </Paper>
      )}

      {/* Analytics Tab */}
      {((projectType === 'villa' && activeTab === 2) || 
        (projectType === 'apartment' && activeTab === 2) || 
        (projectType === 'hybrid' && activeTab === 3)) && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Analytics Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed project analytics will be available here
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ProjectDetailPage;
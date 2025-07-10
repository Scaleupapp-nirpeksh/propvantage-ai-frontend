// File: src/pages/projects/TowerDetailPage.js
// Description: Complete tower detail page with floor-wise unit grid and comprehensive unit management
// Version: 1.0 - Production-grade tower detail view with real backend integration
// Location: src/pages/projects/TowerDetailPage.js

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
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Domain,
  Home,
  CheckCircle,
  Warning,
  Block,
  Add,
  Visibility,
  AttachMoney,
  Analytics,
  Settings,
  Download,
  Refresh,
  Timeline,
  People,
  NavigateNext,
  AspectRatio,
  Layers,
  Apartment,
  Business,
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

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'available': return CheckCircle;
    case 'sold': return Home;
    case 'blocked': return Block;
    case 'on-hold': return Warning;
    default: return Home;
  }
};

const TowerBreadcrumbs = ({ project, tower }) => {
  const navigate = useNavigate();

  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={() => navigate('/projects')}
      >
        <Business fontSize="small" />
        Projects
      </Link>
      <Link
        underline="hover"
        color="inherit"
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          // FIX: Ensure proper ID extraction
          const projectIdString = project?._id || project?.id;
          navigate(`/projects/${projectIdString}`);
        }}
      >
        {project?.name || 'Project'}
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Domain fontSize="small" />
        {tower?.towerName || tower?.towerCode || 'Tower'}
      </Typography>
    </Breadcrumbs>
  );
};

// Tower Header Component
const TowerHeader = ({ project, tower, onEdit, onRefresh, isLoading }) => {
  const { canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <Domain sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {tower.towerName || `Tower ${tower.towerCode}`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={tower.towerCode} 
                  color="primary" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={tower.towerType || 'Residential'} 
                  color="info" 
                  size="small"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {tower.totalFloors || 0} Floors • {tower.unitsPerFloor || 0} Units/Floor
                </Typography>
              </Box>
            </Box>
          </Box>

          {tower.description && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '70%' }}>
              {tower.description}
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
              Edit Tower
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
              <ListItemText>Export Units</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText>Bulk Add Units</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// Tower Metrics Component
const TowerMetrics = ({ tower, units, isLoading }) => {
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

  // Calculate metrics
  const totalUnits = units.length;
  const soldUnits = units.filter(unit => unit.status === 'sold').length;
  const blockedUnits = units.filter(unit => unit.status === 'blocked').length;
  const availableUnits = units.filter(unit => unit.status === 'available').length;
  
  const totalRevenue = units
    .filter(unit => unit.status === 'sold')
    .reduce((sum, unit) => sum + (unit.currentPrice || 0), 0);
  
  const averagePrice = units.length > 0 
    ? units.reduce((sum, unit) => sum + (unit.currentPrice || 0), 0) / units.length 
    : 0;
  
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  const metrics = [
    {
      title: 'Total Units',
      value: totalUnits,
      subtitle: `Across ${tower.totalFloors || 0} floors`,
      color: 'primary',
      icon: Home,
    },
    {
      title: 'Units Sold',
      value: `${soldUnits} (${salesPercentage}%)`,
      subtitle: `${availableUnits} available`,
      color: 'success',
      icon: CheckCircle,
    },
    {
      title: 'Revenue Generated',
      value: formatCurrency(totalRevenue),
      subtitle: 'From sold units',
      color: 'warning',
      icon: AttachMoney,
    },
    {
      title: 'Average Price',
      value: formatCurrency(averagePrice),
      subtitle: 'Per unit',
      color: 'info',
      icon: Analytics,
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
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Unit Card Component for Grid View
const UnitCard = ({ unit, onViewDetails, onEdit }) => {
  const navigate = useNavigate();
  const StatusIcon = getStatusIcon(unit.status);

  const handleClick = () => {
    // FIX: Ensure proper ID extraction
    const projectIdString = unit.project || unit.projectId;
    const towerIdString = unit.tower || unit.towerId;
    const unitIdString = unit._id || unit.id;
    navigate(`/projects/${projectIdString}/towers/${towerIdString}/units/${unitIdString}`);
  };

  return (
    <Card 
      sx={{ 
        height: 120,
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: 2,
        borderColor: `${getStatusColor(unit.status)}.main`,
        '&:hover': { 
          boxShadow: 4,
          transform: 'scale(1.02)',
        },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {unit.unitNumber}
          </Typography>
          <Chip 
            icon={<StatusIcon sx={{ fontSize: 14 }} />}
            label={unit.status}
            size="small"
            color={getStatusColor(unit.status)}
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {unit.bhkType} • {unit.carpetArea || unit.builtupArea} sq ft
        </Typography>
        
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {formatCurrency(unit.currentPrice)}
          </Typography>
          {unit.customerName && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {unit.customerName}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Floor View Component
const FloorView = ({ units, floor, onUnitClick }) => {
  const floorUnits = units.filter(unit => unit.floorNumber === floor);
  
  if (floorUnits.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.700', width: 40, height: 40 }}>
          <Layers />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Floor {floor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {floorUnits.length} units
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={1}>
        {floorUnits
          .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''))
          .map((unit) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={unit._id}>
              <UnitCard unit={unit} onViewDetails={onUnitClick} />
            </Grid>
          ))}
      </Grid>
    </Paper>
  );
};

// Units Grid Component
const UnitsGrid = ({ units, viewMode, onAddUnit }) => {
  const { canAccess } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter units by status
  const filteredUnits = selectedStatus === 'all' 
    ? units 
    : units.filter(unit => unit.status === selectedStatus);

  // Group units by floor for floor view
  const floors = [...new Set(units.map(unit => unit.floorNumber))]
    .filter(floor => floor !== undefined && floor !== null)
    .sort((a, b) => b - a); // Highest floor first

  const statusCounts = {
    all: units.length,
    available: units.filter(unit => unit.status === 'available').length,
    sold: units.filter(unit => unit.status === 'sold').length,
    blocked: units.filter(unit => unit.status === 'blocked').length,
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tower Units ({units.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'floor' ? 'Floor-wise view' : 'Grid view'}
          </Typography>
        </Box>
        
        {canAccess.projectManagement() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddUnit}
          >
            Add Units
          </Button>
        )}
      </Box>

      {/* Status Filter Chips */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`All (${statusCounts.all})`}
            onClick={() => setSelectedStatus('all')}
            color={selectedStatus === 'all' ? 'primary' : 'default'}
            variant={selectedStatus === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Available (${statusCounts.available})`}
            onClick={() => setSelectedStatus('available')}
            color={selectedStatus === 'available' ? 'success' : 'default'}
            variant={selectedStatus === 'available' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Sold (${statusCounts.sold})`}
            onClick={() => setSelectedStatus('sold')}
            color={selectedStatus === 'sold' ? 'error' : 'default'}
            variant={selectedStatus === 'sold' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Blocked (${statusCounts.blocked})`}
            onClick={() => setSelectedStatus('blocked')}
            color={selectedStatus === 'blocked' ? 'warning' : 'default'}
            variant={selectedStatus === 'blocked' ? 'filled' : 'outlined'}
          />
        </Stack>
      </Box>

      {filteredUnits.length > 0 ? (
        viewMode === 'floor' ? (
          // Floor View
          <Box>
            {floors.map((floor) => (
              <FloorView
                key={floor}
                units={filteredUnits}
                floor={floor}
                onUnitClick={() => {}}
              />
            ))}
          </Box>
        ) : (
          // Grid View
          <Grid container spacing={2}>
            {filteredUnits
              .sort((a, b) => {
                // Sort by floor first, then by unit number
                if (a.floorNumber !== b.floorNumber) {
                  return (b.floorNumber || 0) - (a.floorNumber || 0);
                }
                return (a.unitNumber || '').localeCompare(b.unitNumber || '');
              })
              .map((unit) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={unit._id}>
                  <UnitCard unit={unit} />
                </Grid>
              ))}
          </Grid>
        )
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Home sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {selectedStatus === 'all' ? 'No units found' : `No ${selectedStatus} units`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {selectedStatus === 'all' 
              ? 'Start by adding units to this tower'
              : `Try selecting a different status filter`
            }
          </Typography>
          {canAccess.projectManagement() && selectedStatus === 'all' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddUnit}
            >
              Add First Unit
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Tower Configuration Component
const TowerConfiguration = ({ tower }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Tower Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">Tower Code</Typography>
              <Typography variant="body1">{tower.towerCode}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Tower Type</Typography>
              <Typography variant="body1">{tower.towerType || 'Residential'}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Floors</Typography>
              <Typography variant="body1">{tower.totalFloors || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Units Per Floor</Typography>
              <Typography variant="body1">{tower.unitsPerFloor || 0}</Typography>
            </Box>
          </Stack>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Unit Configuration
          </Typography>
          {tower.configuration && Object.keys(tower.configuration).length > 0 ? (
            <Stack spacing={1}>
              {Object.entries(tower.configuration).map(([type, count]) => (
                <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{type}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{count} units</Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No configuration data available
            </Typography>
          )}
        </Grid>
        
        {tower.amenities && tower.amenities.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tower Amenities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tower.amenities.map((amenity, index) => (
                <Chip key={index} label={amenity} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

// Main Tower Detail Page Component
const TowerDetailPage = () => {
  const { projectId, towerId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management
  const [project, setProject] = useState(null);
  const [tower, setTower] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('floor'); // 'floor' or 'grid'

  // Fetch tower data
  useEffect(() => {
    if (projectId && towerId) {
      fetchTowerData();
    }
  }, [projectId, towerId]);

  const fetchTowerData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching tower data for ID:', towerId);

      // Fetch project details
      const projectResponse = await projectAPI.getProject(projectId);
      const projectData = projectResponse.data.data || projectResponse.data;

      // Fetch tower details
      const towerResponse = await towerAPI.getTower(towerId);
      const towerData = towerResponse.data.data || towerResponse.data;

      // Fetch units for this tower
      const unitsResponse = await unitAPI.getUnits({ tower: towerId });
      const unitsData = unitsResponse.data.data || [];

      console.log('✅ Tower data:', towerData);
      console.log('✅ Units data:', unitsData);

      setProject(projectData);
      setTower(towerData);
      setUnits(unitsData);

    } catch (error) {
      console.error('❌ Error fetching tower data:', error);
      setError('Failed to load tower details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // FIX: Ensure proper ID extraction
    const projectIdString = typeof projectId === 'string' ? projectId : project?._id;
    const towerIdString = typeof towerId === 'string' ? towerId : tower?._id;
    navigate(`/projects/${projectIdString}/towers/${towerIdString}/edit`);
  };
  
  const handleAddUnit = () => {
    // FIX: Ensure proper ID extraction
    const projectIdString = typeof projectId === 'string' ? projectId : project?._id;
    const towerIdString = typeof towerId === 'string' ? towerId : tower?._id;
    navigate(`/projects/${projectIdString}/towers/${towerIdString}/units/create`);
  };

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
          <Button color="inherit" size="small" onClick={fetchTowerData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!tower) {
    return (
      <Alert severity="warning">
        Tower not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumb Navigation */}
      <TowerBreadcrumbs project={project} tower={tower} />

      {/* Tower Header */}
      <TowerHeader
        project={project}
        tower={tower}
        onEdit={handleEdit}
        onRefresh={fetchTowerData}
        isLoading={loading}
      />

      {/* Tower Metrics */}
      <TowerMetrics
        tower={tower}
        units={units}
        isLoading={false}
      />

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Units (${units.length})`} />
            <Tab label="Configuration" />
            <Tab label="Analytics" />
          </Tabs>
          
          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Button
                variant={viewMode === 'floor' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('floor')}
                sx={{ mr: 1 }}
              >
                Floor View
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('grid')}
              >
                Grid View
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <UnitsGrid
          units={units}
          viewMode={viewMode}
          onAddUnit={handleAddUnit}
        />
      )}

      {activeTab === 1 && (
        <TowerConfiguration tower={tower} />
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Tower Analytics Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed tower analytics will be available here
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TowerDetailPage;
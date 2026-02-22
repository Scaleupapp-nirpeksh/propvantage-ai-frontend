// File: src/pages/projects/ProjectDetailPage.js
// Description: ENHANCED project detail page with integrated Budget Variance Dashboard
// Version: 3.0 - Integrated with real-time budget variance tracking
// Location: src/pages/projects/ProjectDetailPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Breadcrumbs,
  Link,
  Fade,
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
  Add,
  Domain,
  Download,
  Share,
  Refresh,
  Villa,
  QueryStats,
  NavigateNext,
  AutoGraph,
  PriceChange,
  NotificationsActive,
  AccountBalance,
  Chat as ChatIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { projectAPI, towerAPI, unitAPI } from '../../services/api';
import { budgetVarianceAPI } from '../../services/budgetAPI';
import MiniTowerSilhouette from '../../components/projects/MiniTowerSilhouette';
import ProjectTeamPanel from '../../components/projects/ProjectTeamPanel';

// Import Budget Variance Dashboard Components
import BudgetVarianceSummaryCards from '../analytics/BudgetVarianceSummaryCards';
import VarianceOverviewTab from '../analytics/VarianceOverviewTab';
import AlertsActionsTab from '../analytics/AlertsActionsTab';
import PricingSuggestionsTab from '../analytics/PricingSuggestionsTab';

// Utility function to safely extract ID from object or string with debugging
const extractId = (value, context = 'unknown') => {
  console.log(`🔍 extractId called for ${context}:`, { value, type: typeof value });
  
  if (!value) {
    console.log(`❌ ${context}: value is null/undefined`);
    return null;
  }
  
  if (typeof value === 'string') {
    console.log(`✅ ${context}: returning string value:`, value);
    return value;
  }
  
  if (typeof value === 'object') {
    const id = value._id || value.id;
    console.log(`🔄 ${context}: extracted from object:`, id);
    if (id && typeof id === 'string') {
      return id;
    }
    if (id && typeof id === 'object') {
      console.error(`❌ ${context}: nested object detected:`, id);
      return String(id);
    }
    console.error(`❌ ${context}: no valid ID found in object:`, value);
    return null;
  }
  
  const stringValue = String(value);
  console.log(`🔄 ${context}: converted to string:`, stringValue);
  return stringValue;
};

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
    case 'booked': return 'primary';
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

// Enhanced Project Header Component with Budget Variance Badge
const ProjectHeader = ({
  project,
  onEdit,
  onRefresh,
  isLoading,
  projectType,
  budgetVarianceData
}) => {
  const { canAccess } = useAuth();
  const { openEntityConversation } = useChat();
  const navigate = useNavigate();
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

  // Calculate budget variance status
  const getVarianceStatus = () => {
    if (!budgetVarianceData || !budgetVarianceData.calculations) {
      return { status: 'unknown', color: 'default', label: 'No Data' };
    }
    
    const variance = Math.abs(budgetVarianceData.calculations.variancePercentage || 0);
    
    if (variance >= 20) {
      return { 
        status: 'critical', 
        color: 'error', 
        label: `${budgetVarianceData.calculations.variancePercentage.toFixed(1)}% Critical` 
      };
    } else if (variance >= 10) {
      return { 
        status: 'warning', 
        color: 'warning', 
        label: `${budgetVarianceData.calculations.variancePercentage.toFixed(1)}% Warning` 
      };
    } else {
      return { 
        status: 'success', 
        color: 'success', 
        label: `${budgetVarianceData.calculations.variancePercentage.toFixed(1)}% On Track` 
      };
    }
  };

  const varianceStatus = getVarianceStatus();

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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                {/* Budget Variance Status Badge */}
                <Chip 
                  icon={varianceStatus.status === 'critical' ? <Warning /> : 
                        varianceStatus.status === 'warning' ? <Schedule /> : <CheckCircle />}
                  label={varianceStatus.label}
                  color={varianceStatus.color}
                  size="small"
                  sx={{ fontWeight: 600 }}
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
          <Tooltip title="Open Chat">
            <IconButton onClick={async () => {
              try {
                const conv = await openEntityConversation('Project', project?._id);
                if (conv?._id) navigate(`/chat/${conv._id}`);
              } catch { /* ignore */ }
            }}>
              <ChatIcon />
            </IconButton>
          </Tooltip>
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
                <QueryStats fontSize="small" />
              </ListItemIcon>
              <ListItemText>Budget Variance Dashboard</ListItemText>
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

// Enhanced Project Metrics Component with Budget Integration
const ProjectMetrics = ({ 
  project, 
  towers, 
  allUnits, 
  villaUnits, 
  isLoading,
  budgetVarianceData 
}) => {
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
    .reduce((sum, unit) => sum + (unit.currentPrice || unit.basePrice || 0), 0);
  
  const salesPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;
  const revenuePercentage = project.targetRevenue > 0 ? Math.round((totalRevenue / project.targetRevenue) * 100) : 0;

  // Use budget variance data if available, otherwise use calculated values
  const actualRevenue = budgetVarianceData?.sales?.totalRevenue || totalRevenue;
  const budgetTarget = budgetVarianceData?.project?.budgetTarget || project.targetRevenue;
  const variancePercentage = budgetVarianceData?.calculations?.variancePercentage || 0;
  const remainingUnits = budgetVarianceData?.calculations?.remainingUnits || availableUnits;

  const metrics = [
    {
      title: 'Budget Target',
      value: formatCurrency(budgetTarget),
      subtitle: `${Math.round((actualRevenue / budgetTarget) * 100)}% achieved`,
      progress: Math.round((actualRevenue / budgetTarget) * 100),
      color: 'info',
      icon: AccountBalance,
    },
    {
      title: 'Actual Revenue',
      value: formatCurrency(actualRevenue),
      subtitle: `${variancePercentage >= 0 ? '+' : ''}${variancePercentage.toFixed(1)}% variance`,
      progress: revenuePercentage,
      color: variancePercentage >= 0 ? 'success' : 'error',
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
      title: 'Remaining Units',
      value: remainingUnits,
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
const VillaUnitCard = ({ unit, projectId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const validProjectId = extractId(projectId);
    const validUnitId = extractId(unit._id || unit.id);
    
    console.log('🔗 Villa navigation:', { projectId: validProjectId, unitId: validUnitId });
    
    if (validProjectId && validUnitId) {
      navigate(`/projects/${validProjectId}/units/${validUnitId}`);
    } else {
      console.error('❌ Invalid villa unit navigation IDs:', { projectId: validProjectId, unitId: validUnitId });
    }
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
            {formatCurrency(unit.currentPrice || unit.basePrice)}
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

// Tower Card Component
const TowerCard = ({ tower, projectId }) => {
  const navigate = useNavigate();
  const [towerUnits, setTowerUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTowerUnits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tower._id]);

  const fetchTowerUnits = async () => {
    try {
      const towerId = extractId(tower._id || tower.id);
      const response = await unitAPI.getUnits({ tower: towerId });
      setTowerUnits(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tower units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    const validProjectId = extractId(projectId, 'TowerCard projectId');
    const validTowerId = extractId(tower._id || tower.id, 'TowerCard towerId');
    
    console.log('🔗 TowerCard click - Extracted IDs:', { 
      validProjectId, 
      validTowerId 
    });
    
    if (validProjectId && validTowerId) {
      const url = `/projects/${String(validProjectId)}/towers/${String(validTowerId)}`;
      console.log('🔗 Navigating to URL:', url);
      navigate(url);
    } else {
      console.error('❌ Invalid IDs for tower navigation:', { 
        validProjectId, 
        validTowerId,
        originalProjectId: projectId,
        originalTowerId: tower._id
      });
      alert('Navigation error: Invalid project or tower ID');
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
      onClick={handleClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MiniTowerSilhouette
              floors={tower.totalFloors || 5}
              soldPercentage={salesPercentage || 0}
              width={24}
              height={Math.max(32, Math.min(56, (tower.totalFloors || 5) * 3.5))}
            />
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
const VillaUnitsSection = ({ villaUnits, isLoading, onAddVilla, projectType, projectId }) => {
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
              <VillaUnitCard unit={villa} projectId={projectId} />
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

// Towers Section Component
const TowersSection = ({ towers, isLoading, onAddTower, projectId }) => {
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
              <TowerCard tower={tower} projectId={projectId} />
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

// ============================================================================
// INTEGRATED BUDGET VARIANCE DASHBOARD COMPONENT
// ============================================================================

const IntegratedBudgetVarianceDashboard = ({ 
  projectId, 
  projectName,
  onNavigateBack 
}) => {
  // Budget variance dashboard state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    portfolioSummary: {
      totalProjects: 0,
      projects: [],
    },
    projectVariance: null,
    alerts: [],
    recommendedActions: [],
    pricingSuggestions: [],
    loadingStates: {
      portfolio: false,
      projectDetails: true,
      alerts: false,
      actions: false,
      pricing: false,
    },
  });

  // Dashboard tabs configuration
  const DASHBOARD_TABS = [
    { 
      label: 'Budget Overview', 
      value: 0, 
      icon: <AutoGraph />,
      description: 'Real-time budget variance analysis'
    },
    { 
      label: 'Alerts & Actions', 
      value: 1, 
      icon: <NotificationsActive />,
      description: 'Critical alerts and recommendations'
    },
    { 
      label: 'Pricing Suggestions', 
      value: 2, 
      icon: <PriceChange />,
      description: 'AI-powered pricing optimization'
    },
  ];
  
  // =============================================================================
  // DATA FETCHING FUNCTIONS
  // =============================================================================
  
  const fetchProjectVariance = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setDashboardData(prev => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, projectDetails: true }
      }));
      
      console.log(`🔄 Fetching budget variance for project: ${projectId}`);
      
      const response = await budgetVarianceAPI.getProjectBudgetVariance(projectId);
      const varianceData = response.data?.data || {};
      
      console.log('✅ Project variance data loaded:', varianceData);
      
      setDashboardData(prev => ({
        ...prev,
        projectVariance: varianceData,
        pricingSuggestions: varianceData.pricingSuggestions || [],
        loadingStates: { ...prev.loadingStates, projectDetails: false }
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching project variance:`, error);
      setError('Failed to load budget variance data');
      setDashboardData(prev => ({
        ...prev,
        projectVariance: null,
        pricingSuggestions: [],
        loadingStates: { ...prev.loadingStates, projectDetails: false }
      }));
    }
  }, [projectId]);
  
  const refreshDashboard = useCallback(async (showRefreshIndicator = true) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }
      
      console.log('🔄 Refreshing budget variance dashboard...');
      
      await fetchProjectVariance();
      
      setLastUpdated(new Date());
      console.log('✅ Dashboard refresh completed');
      
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      setError('Failed to refresh dashboard data');
    } finally {
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
      setLoading(false);
    }
  }, [fetchProjectVariance]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);
  
  const handleManualRefresh = useCallback(() => {
    refreshDashboard(true);
  }, [refreshDashboard]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    console.log('🚀 Budget Variance Dashboard initializing for project:', projectId);
    refreshDashboard(false);
  }, [projectId, refreshDashboard]);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const dashboardStats = useMemo(() => {
    if (!dashboardData.projectVariance) {
      return {
        totalBudget: 0,
        totalRevenue: 0,
        totalVariance: 0,
        projectsCount: 1,
      };
    }
    
    const { project, calculations } = dashboardData.projectVariance;
    return {
      totalBudget: project?.budgetTarget || 0,
      totalRevenue: calculations?.actualRevenue || 0,
      totalVariance: calculations?.variancePercentage || 0,
      projectsCount: 1,
    };
  }, [dashboardData.projectVariance]);
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  const renderDashboardHeader = () => (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ mb: 2 }}
        separator={<NavigateNext fontSize="small" />}
      >
        <Link
          color="inherit"
          href="/projects"
          onClick={(e) => {
            e.preventDefault();
            onNavigateBack();
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          <Home fontSize="small" sx={{ mr: 0.5 }} />
          <Typography>Project Details</Typography>
        </Link>
        <Typography color="text.primary">Budget Variance</Typography>
      </Breadcrumbs>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
      }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Budget Variance Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time budget tracking for {projectName}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Refresh Dashboard">
            <IconButton 
              onClick={handleManualRefresh}
              disabled={refreshing}
              color="primary"
            >
              <Refresh sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        Last updated: {lastUpdated.toLocaleString()}
      </Typography>
    </Box>
  );

  const renderDashboardTabs = () => (
    <Paper sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth"
      >
        {DASHBOARD_TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.icon}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {tab.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tab.description}
                  </Typography>
                </Box>
              </Box>
            }
            sx={{ 
              textAlign: 'left',
              alignItems: 'flex-start',
              minHeight: 72,
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Budget Overview
        return (
          <VarianceOverviewTab
            portfolioSummary={{
              projects: dashboardData.projectVariance ? [dashboardData.projectVariance] : []
            }}
            projectVariance={dashboardData.projectVariance}
            loadingStates={dashboardData.loadingStates}
            onProjectSelect={() => {}} // Single project view
            onRefreshData={handleManualRefresh}
          />
        );
        
      case 1: // Alerts & Actions
        return (
          <AlertsActionsTab
            portfolioSummary={{}}
            projectVariance={dashboardData.projectVariance}
            alerts={dashboardData.alerts}
            recommendedActions={dashboardData.recommendedActions}
            loadingStates={dashboardData.loadingStates}
            onAlertAcknowledge={(alertId, userId) => console.log('Acknowledge alert:', alertId)}
            onActionStatusChange={(actionId, status, userId) => console.log('Update action:', actionId, status)}
          />
        );
        
      case 2: // Pricing Suggestions
        return (
          <PricingSuggestionsTab
            projectVariance={{
              ...dashboardData.projectVariance,
              pricingSuggestions: dashboardData.pricingSuggestions,
            }}
            loadingStates={{
              ...dashboardData.loadingStates,
              pricingSuggestions: dashboardData.loadingStates.pricing,
            }}
            onPriceUpdate={(unitNumber, newPrice) => console.log('Update price:', unitNumber, newPrice)}
            onBulkPriceUpdate={(updates) => console.log('Bulk update:', updates)}
          />
        );
        
      default:
        return null;
    }
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={handleManualRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  
  return (
    <Fade in timeout={500}>
      <Box>
        {renderDashboardHeader()}
        
        <BudgetVarianceSummaryCards
          dashboardStats={dashboardStats}
          portfolioSummary={{}}
          projectVariance={dashboardData.projectVariance}
          alerts={dashboardData.alerts}
          loadingStates={dashboardData.loadingStates}
          onNavigateToProject={() => {}}
          onViewAlerts={() => setActiveTab(1)}
          onRefreshData={handleManualRefresh}
        />
        
        {renderDashboardTabs()}
        
        <Box sx={{ mt: 3 }}>
          {renderTabContent()}
        </Box>
      </Box>
    </Fade>
  );
};

// ============================================================================
// MAIN PROJECT DETAIL PAGE COMPONENT
// ============================================================================

const ProjectDetailPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // State management - MUST come before any conditional returns
  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [villaUnits, setVillaUnits] = useState([]);
  const [budgetVarianceData, setBudgetVarianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // CRITICAL: Ensure projectId is always a string
  const projectId = extractId(params.projectId, 'useParams projectId');

  // DEBUG: Log the projectId from useParams
  console.log('🔍 ProjectDetailPage - params and projectId:', { 
    params,
    projectId, 
    type: typeof projectId 
  });

  // Fetch project data
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching project data for validated ID:', projectId);

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

      // Fetch budget variance data for the project
      try {
        const budgetResponse = await budgetVarianceAPI.getProjectBudgetVariance(projectId);
        const budgetData = budgetResponse.data?.data || null;
        setBudgetVarianceData(budgetData);
        console.log('✅ Budget variance data loaded:', budgetData);
      } catch (budgetError) {
        console.warn('⚠️ Budget variance data not available:', budgetError);
        setBudgetVarianceData(null);
      }

      console.log('✅ Project data loaded:', {
        project: projectData.name,
        towers: towersData.length,
        totalUnits: allUnitsData.length,
        villaUnits: villaUnitsData.length
      });

      setProject(projectData);
      setTowers(towersData);
      setAllUnits(allUnitsData);
      setVillaUnits(villaUnitsData);

    } catch (error) {
      console.error('❌ Error fetching project data:', error);
      if (error.projectAccessDenied) {
        setError('ACCESS_DENIED');
      } else {
        setError('Failed to load project details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/projects/${projectId}/edit`);
  };

  const handleAddTower = () => {
    navigate(`/projects/${projectId}/towers/create`);
  };
  
  const handleAddVilla = () => {
    navigate(`/projects/${projectId}/units/create`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNavigateBack = () => {
    setActiveTab(0); // Go back to overview tab
  };

  // Validate projectId - after hooks but before render
  if (!projectId) {
    console.error('❌ No valid projectId found in URL params:', params);
    return (
      <Alert severity="error">
        Invalid project ID in URL. Please check the URL and try again.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error === 'ACCESS_DENIED') {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <strong>Access Denied</strong> — You don't have access to this project. Contact your administrator to request access.
      </Alert>
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

  // Dynamic tab configuration based on project type and permissions
  const getProjectTabs = () => {
    const tabs = [];
    
    if (projectType === 'villa') {
      tabs.push({ label: `Villas (${villaUnits.length})`, value: 0 });
    } else if (projectType === 'apartment') {
      tabs.push({ label: `Towers (${towers.length})`, value: 0 });
    } else if (projectType === 'hybrid') {
      tabs.push({ label: `Towers (${towers.length})`, value: 0 });
      tabs.push({ label: `Villas (${villaUnits.length})`, value: 1 });
    }
    
    tabs.push({ label: 'Timeline', value: tabs.length });
    tabs.push({ label: 'Team', value: tabs.length });

    // Add Budget Analytics tab if user has financial permissions
    if (canAccess.viewFinancials()) {
      tabs.push({
        label: 'Budget Analytics',
        value: tabs.length,
        icon: <QueryStats />,
        badge: budgetVarianceData?.alerts?.hasVariance ? 'alert' : null
      });
    }

    return tabs;
  };

  const projectTabs = getProjectTabs();

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
        budgetVarianceData={budgetVarianceData}
      />

      {/* Project Metrics */}
      <ProjectMetrics
        project={project}
        towers={towers}
        allUnits={allUnits}
        villaUnits={villaUnits}
        isLoading={false}
        budgetVarianceData={budgetVarianceData}
      />

      {/* Dynamic Tabs based on project type */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {projectTabs.map((tab) => (
            <Tab 
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.icon && tab.icon}
                  <Typography>{tab.label}</Typography>
                  {tab.badge === 'alert' && (
                    <Badge badgeContent="!" color="error" />
                  )}
                </Box>
              }
              value={tab.value}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      
      {/* Villa Projects */}
      {projectType === 'villa' && activeTab === 0 && (
        <VillaUnitsSection
          villaUnits={villaUnits}
          isLoading={false}
          onAddVilla={handleAddVilla}
          projectType={projectType}
          projectId={projectId}
        />
      )}

      {/* Apartment Projects */}
      {projectType === 'apartment' && activeTab === 0 && (
        <TowersSection
          towers={towers}
          isLoading={false}
          onAddTower={handleAddTower}
          projectId={projectId}
        />
      )}

      {/* Hybrid Projects */}
      {projectType === 'hybrid' && (
        <>
          {activeTab === 0 && (
            <TowersSection
              towers={towers}
              isLoading={false}
              onAddTower={handleAddTower}
              projectId={projectId}
            />
          )}
          {activeTab === 1 && (
            <VillaUnitsSection
              villaUnits={villaUnits}
              isLoading={false}
              onAddVilla={handleAddVilla}
              projectType={projectType}
              projectId={projectId}
            />
          )}
        </>
      )}

      {/* Timeline Tab */}
      {((projectType === 'villa' && activeTab === 1) || 
        (projectType === 'apartment' && activeTab === 1) || 
        (projectType === 'hybrid' && activeTab === 2)) && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Project Timeline Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed project timeline and milestones will be available here
          </Typography>
        </Paper>
      )}

      {/* Team Tab — villa=2, apartment=2, hybrid=3 */}
      {((projectType === 'villa' && activeTab === 2) ||
        (projectType === 'apartment' && activeTab === 2) ||
        (projectType === 'hybrid' && activeTab === 3)) && (
        <Paper sx={{ p: 3 }}>
          <ProjectTeamPanel projectId={projectId} projectName={project?.name} />
        </Paper>
      )}

      {/* Budget Analytics Tab — villa=3, apartment=3, hybrid=4 */}
      {canAccess.viewFinancials() && (
        <>
          {/* Villa Projects - Budget Analytics */}
          {projectType === 'villa' && activeTab === 3 && (
            <IntegratedBudgetVarianceDashboard
              projectId={projectId}
              projectName={project.name}
              onNavigateBack={handleNavigateBack}
            />
          )}

          {/* Apartment Projects - Budget Analytics */}
          {projectType === 'apartment' && activeTab === 3 && (
            <IntegratedBudgetVarianceDashboard
              projectId={projectId}
              projectName={project.name}
              onNavigateBack={handleNavigateBack}
            />
          )}

          {/* Hybrid Projects - Budget Analytics */}
          {projectType === 'hybrid' && activeTab === 4 && (
            <IntegratedBudgetVarianceDashboard
              projectId={projectId}
              projectName={project.name}
              onNavigateBack={handleNavigateBack}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default ProjectDetailPage;
// File: src/pages/analytics/AlertsActionsTab.js
// Description: Alerts & Actions Tab for Budget Variance Dashboard - PRODUCTION READY
// Version: 2.0.0 - Production implementation with real API integration
// Author: PropVantage AI Development Team
// Created: 2025-01-13

import React, { useState, useMemo, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Tooltip,
  Paper,
  Stack,
  Divider,
  Badge,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Skeleton,
  Fade,
  Zoom,
  Collapse,
} from '@mui/material';
import {
  NotificationsActive,
  Warning,
  Error,
  Info,
  CheckCircle,
  Flag,
  Assignment,
  PlayArrow,
  Pause,
  Check,
  Close,
  Schedule,
  Person,
  Business,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Assessment,
  Lightbulb,
  Build,
  Timeline,
  Priority,
  ExpandMore,
  FilterList,
  Sort,
  Refresh,
  MarkAsUnread,
  DoneAll,
  Archive,
  Delete,
  Add,
  Edit,
  Send,
  Alarm,
  AlarmOff,
  CriticalComponent,
  PriorityHigh,
  Speed,
  Analytics,
  AutoGraph,
  QueryStats,
  Insights,
} from '@mui/icons-material';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { budgetHelpers } from '../../services/budgetAPI';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const ALERTS_CONFIG = {
  // Alert severity levels
  SEVERITY: {
    CRITICAL: {
      value: 'critical',
      label: 'Critical',
      color: '#d32f2f',
      bgColor: '#ffebee',
      icon: <Error />,
      priority: 1,
    },
    WARNING: {
      value: 'warning',
      label: 'Warning',
      color: '#ed6c02',
      bgColor: '#fff3e0',
      icon: <Warning />,
      priority: 2,
    },
    INFO: {
      value: 'info',
      label: 'Info',
      color: '#0288d1',
      bgColor: '#e3f2fd',
      icon: <Info />,
      priority: 3,
    },
  },
  
  // Action priority levels
  ACTION_PRIORITY: {
    HIGH: {
      value: 'high',
      label: 'High Priority',
      color: '#d32f2f',
      icon: <PriorityHigh />,
    },
    MEDIUM: {
      value: 'medium',
      label: 'Medium Priority',
      color: '#ed6c02',
      icon: <Flag />,
    },
    LOW: {
      value: 'low',
      label: 'Low Priority',
      color: '#2e7d32',
      icon: <Info />,
    },
  },
  
  // Action status
  ACTION_STATUS: {
    PENDING: {
      value: 'pending',
      label: 'Pending',
      color: '#ed6c02',
      icon: <Schedule />,
    },
    IN_PROGRESS: {
      value: 'in_progress',
      label: 'In Progress',
      color: '#1976d2',
      icon: <PlayArrow />,
    },
    COMPLETED: {
      value: 'completed',
      label: 'Completed',
      color: '#2e7d32',
      icon: <CheckCircle />,
    },
    CANCELLED: {
      value: 'cancelled',
      label: 'Cancelled',
      color: '#757575',
      icon: <Close />,
    },
  },
  
  // Action categories
  ACTION_CATEGORIES: [
    { value: 'pricing', label: 'Pricing Strategy', icon: <AttachMoney /> },
    { value: 'marketing', label: 'Marketing & Sales', icon: <Assessment /> },
    { value: 'financial', label: 'Financial Planning', icon: <Analytics /> },
    { value: 'operational', label: 'Operations', icon: <Build /> },
    { value: 'strategic', label: 'Strategic Planning', icon: <Lightbulb /> },
  ],
  
  // Tab configuration
  TABS: [
    { value: 0, label: 'Active Alerts', icon: <NotificationsActive /> },
    { value: 1, label: 'Recommended Actions', icon: <Assignment /> },
    { value: 2, label: 'Action Tracker', icon: <Timeline /> },
    { value: 3, label: 'Alert History', icon: <Archive /> },
  ],
};

// =============================================================================
// COMPONENT SECTIONS
// =============================================================================

/**
 * Alert Card Component
 */
const AlertCard = ({ 
  alert, 
  onAcknowledge,
  onViewDetails,
  onDismiss,
}) => {
  const severityConfig = ALERTS_CONFIG.SEVERITY[alert.severity?.toUpperCase()] || ALERTS_CONFIG.SEVERITY.INFO;
  const isOverdue = alert.dueDate && isAfter(new Date(), new Date(alert.dueDate));
  
  return (
    <Card 
      sx={{ 
        mb: 1,
        border: `1px solid ${severityConfig.color}40`,
        bgcolor: alert.acknowledged ? 'action.hover' : severityConfig.bgColor,
        opacity: alert.acknowledged ? 0.7 : 1,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: severityConfig.color, width: 32, height: 32 }}>
            {severityConfig.icon}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {alert.title || alert.message}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {alert.actionRequired && (
                  <Chip 
                    label="Action Required" 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    icon={<Flag />}
                  />
                )}
                
                {isOverdue && (
                  <Chip 
                    label="Overdue" 
                    size="small" 
                    color="error"
                    icon={<Alarm />}
                  />
                )}
                
                <Chip 
                  label={severityConfig.label}
                  size="small"
                  sx={{ 
                    bgcolor: severityConfig.color,
                    color: 'white',
                  }}
                />
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {alert.description || alert.message}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {alert.projectName && (
                  <Typography variant="caption" color="text.secondary">
                    <Business fontSize="inherit" sx={{ mr: 0.5 }} />
                    {alert.projectName}
                  </Typography>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(alert.createdAt || alert.generatedAt || new Date()), { addSuffix: true })}
                </Typography>
                
                {alert.acknowledged && alert.acknowledgedBy && (
                  <Typography variant="caption" color="success.main">
                    <CheckCircle fontSize="inherit" sx={{ mr: 0.5 }} />
                    Acknowledged
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!alert.acknowledged && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<Check />}
                    onClick={() => onAcknowledge(alert.id || alert._id)}
                  >
                    Acknowledge
                  </Button>
                )}
                
                {onViewDetails && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onViewDetails(alert)}
                  >
                    Details
                  </Button>
                )}
                
                {onDismiss && (
                  <IconButton size="small" onClick={() => onDismiss(alert.id || alert._id)}>
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Action Item Card Component
 */
const ActionItemCard = ({ 
  action, 
  onStatusChange,
  onAssign,
  onViewDetails,
  onEdit,
}) => {
  const priorityConfig = ALERTS_CONFIG.ACTION_PRIORITY[action.priority?.toUpperCase()] || ALERTS_CONFIG.ACTION_PRIORITY.LOW;
  const statusConfig = ALERTS_CONFIG.ACTION_STATUS[action.status?.toUpperCase()] || ALERTS_CONFIG.ACTION_STATUS.PENDING;
  const categoryConfig = ALERTS_CONFIG.ACTION_CATEGORIES.find(cat => cat.value === action.category) || ALERTS_CONFIG.ACTION_CATEGORIES[0];
  
  const isOverdue = action.dueDate && isAfter(new Date(), new Date(action.dueDate)) && action.status !== 'completed';
  const progress = action.status === 'completed' ? 100 : action.status === 'in_progress' ? 50 : 0;
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: priorityConfig.color }}>
            {categoryConfig.icon}
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {action.title}
            </Typography>
            {isOverdue && (
              <Chip 
                label="Overdue" 
                size="small" 
                color="error"
                icon={<Alarm />}
              />
            )}
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
            <Chip 
              label={priorityConfig.label}
              size="small"
              icon={priorityConfig.icon}
              sx={{ bgcolor: priorityConfig.color, color: 'white' }}
            />
            <Chip 
              label={statusConfig.label}
              size="small"
              icon={statusConfig.icon}
              color={statusConfig.value === 'completed' ? 'success' : 
                     statusConfig.value === 'in_progress' ? 'primary' : 'default'}
            />
            {action.projectName && (
              <Typography variant="caption" color="text.secondary">
                <Business fontSize="inherit" sx={{ mr: 0.5 }} />
                {action.projectName}
              </Typography>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onEdit && (
              <IconButton onClick={() => onEdit(action)}>
                <Edit />
              </IconButton>
            )}
            {onViewDetails && (
              <IconButton onClick={() => onViewDetails(action)}>
                <Assessment />
              </IconButton>
            )}
          </Box>
        }
      />
      
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {action.description}
        </Typography>
        
        {action.estimatedImpact && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Expected Impact:</strong> {action.estimatedImpact}
          </Alert>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Progress: {progress}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            color={action.status === 'completed' ? 'success' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Timeline: {action.timeline || 'Not specified'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Due: {action.dueDate ? format(new Date(action.dueDate), 'MMM dd, yyyy') : 'Not set'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Category: {categoryConfig.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Assigned: {action.assignedTo || 'Unassigned'}
            </Typography>
          </Grid>
        </Grid>
        
        {action.steps && action.steps.length > 0 && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">
                Action Steps ({action.steps.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {action.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Typography variant="body2" fontWeight={600}>
                        {index + 1}.
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {action.status === 'pending' && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => onStatusChange(action.id || action._id, 'in_progress')}
            >
              Start
            </Button>
          )}
          
          {action.status === 'in_progress' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => onStatusChange(action.id || action._id, 'completed')}
              >
                Complete
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Pause />}
                onClick={() => onStatusChange(action.id || action._id, 'pending')}
              >
                Pause
              </Button>
            </>
          )}
          
          {action.status !== 'completed' && onAssign && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Person />}
              onClick={() => onAssign(action.id || action._id)}
            >
              Assign
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN ALERTS & ACTIONS TAB COMPONENT
// =============================================================================

/**
 * AlertsActionsTab - Critical alerts management and automated recommendations
 * 
 * Features:
 * - Critical alerts dashboard with severity levels
 * - Automated recommendations based on variance analysis
 * - Action items tracker with priority levels
 * - Alert acknowledgment system with user tracking
 * - Recommended actions workflow with implementation guidance
 * 
 * @param {Object} props - Component props
 * @param {Object} props.portfolioSummary - Portfolio summary data
 * @param {Object} props.projectVariance - Single project variance data
 * @param {Array} props.alerts - Active alerts list
 * @param {Array} props.recommendedActions - Recommended actions list
 * @param {Object} props.loadingStates - Loading states
 * @param {Function} props.onAlertAcknowledge - Alert acknowledgment handler
 * @param {Function} props.onActionStatusChange - Action status change handler
 * @returns {JSX.Element} AlertsActionsTab component
 */
const AlertsActionsTab = ({
  portfolioSummary = {},
  projectVariance = null,
  alerts = [],
  recommendedActions = [],
  loadingStates = {},
  onAlertAcknowledge,
  onActionStatusChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // =============================================================================
  // LOCAL STATE
  // =============================================================================
  
  const [activeTab, setActiveTab] = useState(0);
  const [alertFilters, setAlertFilters] = useState({
    severity: 'all',
    acknowledged: 'all',
    actionRequired: false,
  });
  const [actionFilters, setActionFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedToMe: false,
  });
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Filter alerts based on current filters
   */
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (alertFilters.severity !== 'all' && alert.severity !== alertFilters.severity) return false;
      if (alertFilters.acknowledged === 'acknowledged' && !alert.acknowledged) return false;
      if (alertFilters.acknowledged === 'unacknowledged' && alert.acknowledged) return false;
      if (alertFilters.actionRequired && !alert.actionRequired) return false;
      return true;
    });
  }, [alerts, alertFilters]);
  
  /**
   * Filter actions based on current filters
   */
  const filteredActions = useMemo(() => {
    return recommendedActions.filter(action => {
      if (actionFilters.status !== 'all' && action.status !== actionFilters.status) return false;
      if (actionFilters.priority !== 'all' && action.priority !== actionFilters.priority) return false;
      if (actionFilters.category !== 'all' && action.category !== actionFilters.category) return false;
      if (actionFilters.assignedToMe && action.assignedTo !== user?.email) return false;
      return true;
    });
  }, [recommendedActions, actionFilters, user]);
  
  /**
   * Calculate summary statistics
   */
  const alertStats = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const warning = alerts.filter(a => a.severity === 'warning').length;
    const unacknowledged = alerts.filter(a => !a.acknowledged).length;
    const actionRequired = alerts.filter(a => a.actionRequired).length;
    
    return { total, critical, warning, unacknowledged, actionRequired };
  }, [alerts]);
  
  const actionStats = useMemo(() => {
    const total = recommendedActions.length;
    const pending = recommendedActions.filter(a => a.status === 'pending').length;
    const inProgress = recommendedActions.filter(a => a.status === 'in_progress').length;
    const completed = recommendedActions.filter(a => a.status === 'completed').length;
    const highPriority = recommendedActions.filter(a => a.priority === 'high').length;
    const overdue = recommendedActions.filter(a => 
      a.dueDate && isAfter(new Date(), new Date(a.dueDate)) && a.status !== 'completed'
    ).length;
    
    return { total, pending, inProgress, completed, highPriority, overdue };
  }, [recommendedActions]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleAlertAcknowledge = useCallback((alertId) => {
    if (onAlertAcknowledge) {
      onAlertAcknowledge(alertId, user?.email);
    }
  }, [onAlertAcknowledge, user]);
  
  const handleActionStatusChange = useCallback((actionId, newStatus) => {
    if (onActionStatusChange) {
      onActionStatusChange(actionId, newStatus, user?.email);
    }
  }, [onActionStatusChange, user]);
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  /**
   * Render alerts dashboard header
   */
  const renderAlertsHeader = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Alerts & Actions Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Monitor critical alerts and track recommended actions
      </Typography>
      
      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              {alertStats.critical}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Critical Alerts
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {alertStats.unacknowledged}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unacknowledged
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {actionStats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending Actions
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              {actionStats.overdue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overdue Actions
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
  
  /**
   * Render active alerts tab content
   */
  const renderActiveAlertsTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Alert Filters"
          avatar={<FilterList />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={alertFilters.severity}
                  onChange={(e) => setAlertFilters(prev => ({ ...prev, severity: e.target.value }))}
                  label="Severity"
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={alertFilters.acknowledged}
                  onChange={(e) => setAlertFilters(prev => ({ ...prev, acknowledged: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="all">All Alerts</MenuItem>
                  <MenuItem value="unacknowledged">Unacknowledged</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertFilters.actionRequired}
                    onChange={(e) => setAlertFilters(prev => ({ ...prev, actionRequired: e.target.checked }))}
                    color="error"
                  />
                }
                label="Action Required Only"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Alerts List */}
      {loadingStates.alerts ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : filteredAlerts.length === 0 ? (
        <Alert severity="success">
          <AlertTitle>No Active Alerts</AlertTitle>
          {alerts.length === 0 
            ? 'All systems are running smoothly - no alerts at this time.'
            : 'No alerts match your current filter criteria.'
          }
        </Alert>
      ) : (
        <Box>
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id || alert._id}
              alert={alert}
              onAcknowledge={handleAlertAcknowledge}
              onViewDetails={(alert) => console.log('View alert details:', alert)}
              onDismiss={(alertId) => console.log('Dismiss alert:', alertId)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
  
  /**
   * Render recommended actions tab content
   */
  const renderRecommendedActionsTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Action Filters"
          avatar={<FilterList />}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={actionFilters.priority}
                  onChange={(e) => setActionFilters(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High Priority</MenuItem>
                  <MenuItem value="medium">Medium Priority</MenuItem>
                  <MenuItem value="low">Low Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={actionFilters.status}
                  onChange={(e) => setActionFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={actionFilters.category}
                  onChange={(e) => setActionFilters(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {ALERTS_CONFIG.ACTION_CATEGORIES.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={actionFilters.assignedToMe}
                    onChange={(e) => setActionFilters(prev => ({ ...prev, assignedToMe: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Assigned to Me"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Actions List */}
      {loadingStates.actions ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={200} sx={{ mb: 2 }} />
          ))}
        </Box>
      ) : filteredActions.length === 0 ? (
        <Alert severity="info">
          <AlertTitle>No Recommended Actions</AlertTitle>
          {recommendedActions.length === 0 
            ? 'No actions are currently recommended - all metrics are within acceptable ranges.'
            : 'No actions match your current filter criteria.'
          }
        </Alert>
      ) : (
        <Box>
          {filteredActions.map((action) => (
            <ActionItemCard
              key={action.id || action._id}
              action={action}
              onStatusChange={handleActionStatusChange}
              onAssign={(actionId) => console.log('Assign action:', actionId)}
              onViewDetails={(action) => console.log('View action details:', action)}
              onEdit={(action) => console.log('Edit action:', action)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <Box>
      {/* Header */}
      {renderAlertsHeader()}
      
      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'fullWidth'}>
          {ALERTS_CONFIG.TABS.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.icon}
                  {!isMobile && tab.label}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      {activeTab === 0 && renderActiveAlertsTab()}
      {activeTab === 1 && renderRecommendedActionsTab()}
      {activeTab === 2 && (
        <Alert severity="info">
          <AlertTitle>Action Tracker</AlertTitle>
          Advanced action tracking features coming soon...
        </Alert>
      )}
      {activeTab === 3 && (
        <Alert severity="info">
          <AlertTitle>Alert History</AlertTitle>
          Historical alerts and analytics coming soon...
        </Alert>
      )}
    </Box>
  );
};

export default AlertsActionsTab;
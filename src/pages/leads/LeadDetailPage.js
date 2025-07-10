// File: src/pages/leads/LeadDetailPage.js
// Description: Comprehensive lead detail page with complete management functionality
// Version: 1.0 - Production-grade lead view with AI insights, interactions, and management tools
// Location: src/pages/leads/LeadDetailPage.js

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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Breadcrumbs,
  Link,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  Divider,
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
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  MoreVert,
  Phone,
  Email,
  WhatsApp,
  Schedule,
  Assignment,
  Person,
  Business,
  LocationOn,
  AttachMoney,
  Star,
  StarBorder,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  AccessTime,
  Message,
  Event,
  Visibility,
  Psychology,
  Analytics,
  History,
  Settings,
  Call,
  Send,
  Add,
  NavigateNext,
  Info,
  PriorityHigh,
  Source,
  Home,
  Timeline,
  ContactPhone,
  InsertComment,
  Refresh,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, aiAPI } from '../../services/api';

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

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

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
  if (score >= 90) return 'Hot Lead';
  if (score >= 75) return 'Warm Lead';
  if (score >= 50) return 'Moderate Lead';
  return 'Cold Lead';
};

// Lead Header Component
const LeadHeader = ({ lead, onEdit, onRefresh, isLoading }) => {
  const { canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCall = () => {
    window.open(`tel:${lead?.phone}`);
    handleMenuClose();
  };

  const handleEmail = () => {
    if (lead?.email) {
      window.open(`mailto:${lead.email}`);
    }
    handleMenuClose();
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${lead?.phone?.replace(/[^0-9]/g, '')}`);
    handleMenuClose();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
              {lead?.firstName?.charAt(0)}{lead?.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {lead?.firstName} {lead?.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip 
                  label={lead?.status || 'Unknown'} 
                  color={getStatusColor(lead?.status)} 
                  size="small"
                />
                <Chip 
                  label={lead?.priority || 'Medium'} 
                  color={getPriorityColor(lead?.priority)} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={lead?.source || 'Unknown'} 
                  color="info" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{lead?.phone}</Typography>
                </Box>
                {lead?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{lead?.email}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Lead Score */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="h3" color={`${getScoreColor(lead?.score)}.main`} sx={{ fontWeight: 700 }}>
                {lead?.score || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lead Score
              </Typography>
            </Box>
            <Box>
              <Chip
                label={getScoreLabel(lead?.score)}
                color={getScoreColor(lead?.score)}
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {getScoreLabel(lead?.score)}
              </Typography>
            </Box>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {lead?.requirements?.budgetRange || 'Not specified'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Budget Range
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {lead?.requirements?.propertyTypes?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Property Types
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {lead?.requirements?.interestedProjects?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Projects
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {getTimeAgo(lead?.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={onRefresh} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {canAccess.leadManagement() && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ mr: 1 }}
            >
              Edit Lead
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
            <MenuItem onClick={handleCall}>
              <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
              <ListItemText>Call Lead</ListItemText>
            </MenuItem>
            {lead?.email && (
              <MenuItem onClick={handleEmail}>
                <ListItemIcon><Email fontSize="small" /></ListItemIcon>
                <ListItemText>Send Email</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleWhatsApp}>
              <ListItemIcon><WhatsApp fontSize="small" /></ListItemIcon>
              <ListItemText>WhatsApp</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon><Analytics fontSize="small" /></ListItemIcon>
              <ListItemText>View Analytics</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
              <ListItemText>Generate Report</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// Lead Overview Component
const LeadOverview = ({ lead }) => {
  return (
    <Grid container spacing={3}>
      {/* Contact Information */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Contact Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {lead?.firstName} {lead?.lastName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {lead?.phone}
                </Typography>
              </Box>
              {lead?.email && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Email Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {lead?.email}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">Lead Source</Typography>
                <Chip label={lead?.source} color="info" size="small" />
                {lead?.sourceDetails && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {lead?.sourceDetails}
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Lead Management */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              Lead Management
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Current Status</Typography>
                <Chip 
                  label={lead?.status} 
                  color={getStatusColor(lead?.status)} 
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Priority Level</Typography>
                <Chip 
                  label={lead?.priority} 
                  color={getPriorityColor(lead?.priority)} 
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                {lead?.assignedTo ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {lead?.assignedTo?.firstName?.charAt(0)}
                    </Avatar>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {lead?.assignedTo?.firstName} {lead?.assignedTo?.lastName}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Unassigned
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Lead Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" color={`${getScoreColor(lead?.score)}.main`} sx={{ fontWeight: 700 }}>
                    {lead?.score || 0}/100
                  </Typography>
                  <Chip
                    label={getScoreLabel(lead?.score)}
                    color={getScoreColor(lead?.score)}
                    size="small"
                  />
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Property Requirements */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Home color="primary" />
              Property Requirements
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Budget Range
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {lead?.requirements?.budgetRange || 'Not specified'}
                </Typography>
                {lead?.requirements?.specificBudget && (
                  <Typography variant="body2" color="primary">
                    Specific: {formatCurrency(lead.requirements.specificBudget)}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Property Types
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {lead?.requirements?.propertyTypes?.map((type, index) => (
                    <Chip key={index} label={type} color="primary" size="small" variant="outlined" />
                  )) || <Typography variant="body2" color="text.secondary">Not specified</Typography>}
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Preferred Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {lead?.requirements?.preferredLocation || 'Any location'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Occupancy Timeline
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {lead?.requirements?.occupancyTimeline || 'Flexible'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Interested Projects
                </Typography>
                {lead?.requirements?.interestedProjects?.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {lead.requirements.interestedProjects.map((project, index) => (
                      <Chip 
                        key={index} 
                        label={project?.name || project} 
                        color="secondary" 
                        size="small" 
                        variant="outlined" 
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific project preferences
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Additional Notes */}
      {lead?.notes && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsertComment color="primary" />
                Notes
              </Typography>
              <Typography variant="body1">
                {lead.notes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// AI Insights Component
const AIInsights = ({ lead }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiAPI.getLeadInsights(lead._id);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, [lead._id]);

  useEffect(() => {
    if (lead._id) {
      fetchInsights();
    }
  }, [fetchInsights, lead._id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Generating AI insights...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" action={
        <Button color="inherit" size="small" onClick={fetchInsights}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Alert severity="info">
        AI insights will be generated automatically. Please check back later.
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              AI-Powered Sales Insights
            </Typography>
            
            {/* Talking Points */}
            {insights.talkingPoints && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Recommended Talking Points
                </Typography>
                <List dense>
                  {insights.talkingPoints.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Star color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Objection Handling */}
            {insights.objectionHandling && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Objection Handling Strategies
                </Typography>
                <List dense>
                  {insights.objectionHandling.map((strategy, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={strategy} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Next Best Actions */}
            {insights.nextBestActions && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Recommended Next Actions
                </Typography>
                <List dense>
                  {insights.nextBestActions.map((action, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TrendingUp color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Interactions Component
const Interactions = ({ lead }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'Call',
    notes: '',
    outcome: '',
  });

  const fetchInteractions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadAPI.getInteractions(lead._id);
      setInteractions(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  }, [lead._id]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const handleAddInteraction = async () => {
    try {
      setAddingInteraction(true);
      await leadAPI.addInteraction(lead._id, newInteraction);
      setNewInteraction({ type: 'Call', notes: '', outcome: '' });
      fetchInteractions();
    } catch (error) {
      console.error('Error adding interaction:', error);
    } finally {
      setAddingInteraction(false);
    }
  };

  const getInteractionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'call': return <Phone />;
      case 'email': return <Email />;
      case 'whatsapp': return <WhatsApp />;
      case 'meeting': return <Event />;
      case 'site visit': return <LocationOn />;
      default: return <Message />;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Add New Interaction */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Add New Interaction
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newInteraction.type}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, type: e.target.value }))}
                    label="Type"
                  >
                    <MenuItem value="Call">Phone Call</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                    <MenuItem value="Meeting">Meeting</MenuItem>
                    <MenuItem value="Site Visit">Site Visit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  placeholder="What was discussed?"
                  value={newInteraction.notes}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Outcome"
                  placeholder="Result of interaction"
                  value={newInteraction.outcome}
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, outcome: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddInteraction}
                  disabled={addingInteraction || !newInteraction.notes}
                  startIcon={addingInteraction ? <CircularProgress size={16} /> : <Add />}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Interactions History */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <History color="primary" />
              Interaction History
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : interactions.length === 0 ? (
              <Alert severity="info">
                No interactions recorded yet. Add the first interaction above.
              </Alert>
            ) : (
              <List>
                {interactions.map((interaction, index) => (
                  <React.Fragment key={interaction._id || index}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInteractionIcon(interaction.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {interaction.type}
                            </Typography>
                            <Chip label={interaction.outcome || 'No outcome'} size="small" color="info" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {interaction.notes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(interaction.createdAt)} • By {interaction.createdBy?.firstName || 'Unknown'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < interactions.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Follow-up Management Component
const FollowUpManagement = ({ lead, onRefresh }) => {
  const [followUpDialog, setFollowUpDialog] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    date: new Date(),
    type: 'Call',
    notes: '',
  });

  const handleScheduleFollowUp = async () => {
    try {
      // Update lead with follow-up schedule
      await leadAPI.updateLead(lead._id, {
        followUpSchedule: {
          nextFollowUpDate: newFollowUp.date,
          followUpType: newFollowUp.type,
          notes: newFollowUp.notes,
        }
      });
      
      setFollowUpDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="primary" />
                Follow-up Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Schedule />}
                onClick={() => setFollowUpDialog(true)}
              >
                Schedule Follow-up
              </Button>
            </Box>

            {/* Current Follow-up Status */}
            {lead?.followUpSchedule?.nextFollowUpDate ? (
              <Alert 
                severity={lead.followUpSchedule.isOverdue ? 'error' : 'info'}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {lead.followUpSchedule.isOverdue ? 'Overdue Follow-up' : 'Scheduled Follow-up'}
                </Typography>
                <Typography variant="body2">
                  {lead.followUpSchedule.followUpType} scheduled for {formatDate(lead.followUpSchedule.nextFollowUpDate)}
                </Typography>
                {lead.followUpSchedule.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Notes: {lead.followUpSchedule.notes}
                  </Typography>
                )}
              </Alert>
            ) : (
              <Alert severity="warning">
                No follow-up scheduled for this lead
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={followUpDialog} onClose={() => setFollowUpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Follow-up</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Follow-up Date & Time"
                  value={newFollowUp.date}
                  onChange={(value) => setNewFollowUp(prev => ({ ...prev, date: value }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Follow-up Type</InputLabel>
                <Select
                  value={newFollowUp.type}
                  onChange={(e) => setNewFollowUp(prev => ({ ...prev, type: e.target.value }))}
                  label="Follow-up Type"
                >
                  <MenuItem value="Call">Phone Call</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                  <MenuItem value="Site Visit">Site Visit</MenuItem>
                  <MenuItem value="Meeting">In-person Meeting</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                placeholder="Add notes for this follow-up..."
                value={newFollowUp.notes}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowUpDialog(false)}>Cancel</Button>
          <Button onClick={handleScheduleFollowUp} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

// Main Lead Detail Page Component
const LeadDetailPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // State management
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch lead data
  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching lead data for ID:', leadId);

      const response = await leadAPI.getLead(leadId);
      
      console.log('✅ Lead API response:', response.data);

      let leadData;
      if (response.data.data) {
        leadData = response.data.data;
      } else if (response.data.lead) {
        leadData = response.data.lead;
      } else {
        leadData = response.data;
      }

      setLead(leadData);

    } catch (error) {
      console.error('❌ Error fetching lead:', error);
      setError('Failed to load lead details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // Initial data load
  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [fetchLead, leadId]);

  const handleEdit = () => {
    navigate(`/leads/${leadId}/edit`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading lead details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchLead}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!lead) {
    return (
      <Alert severity="warning">
        Lead not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
          onClick={() => navigate('/leads')}
        >
          <Person fontSize="small" />
          Leads
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ContactPhone fontSize="small" />
          {lead.firstName} {lead.lastName}
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/leads')}
          variant="outlined"
        >
          Back to Leads
        </Button>
      </Box>

      {/* Lead Header */}
      <LeadHeader
        lead={lead}
        onEdit={handleEdit}
        onRefresh={fetchLead}
        isLoading={loading}
      />

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="AI Insights" />
          <Tab label="Interactions" />
          <Tab label="Follow-up" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <LeadOverview lead={lead} />}
      {activeTab === 1 && <AIInsights lead={lead} />}
      {activeTab === 2 && <Interactions lead={lead} />}
      {activeTab === 3 && <FollowUpManagement lead={lead} onRefresh={fetchLead} />}

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Stack spacing={2}>
          <Fab color="primary" onClick={() => window.open(`tel:${lead.phone}`)}>
            <Call />
          </Fab>
          {lead.email && (
            <Fab color="secondary" onClick={() => window.open(`mailto:${lead.email}`)}>
              <Send />
            </Fab>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default LeadDetailPage;
// File: src/pages/leads/LeadDetailPage.js
// Description: Comprehensive lead detail page with complete management functionality
// Version: 1.1 - PRODUCTION-READY with AI insights and interactions fixes
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
  List,
  ListItem,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
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
  LocationOn,
  Star,
  TrendingUp,
  CheckCircle,
  Message,
  Event,
  Psychology,
  Analytics,
  History,
  Call,
  Send,
  Add,
  NavigateNext,
  Home,
  ContactPhone,
  InsertComment,
  Refresh,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { leadAPI, aiAPI } from '../../services/api';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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

// =============================================================================
// LEAD HEADER COMPONENT
// =============================================================================

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

// =============================================================================
// LEAD OVERVIEW COMPONENT
// =============================================================================

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

// =============================================================================
// AI INSIGHTS COMPONENT - FIXED VERSION
// =============================================================================

const AIInsights = ({ lead }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching AI insights for lead:', lead._id);
      
      const response = await aiAPI.getLeadInsights(lead._id);
      console.log('✅ AI insights response:', response.data);
      
      // FIXED: Handle different response structures
      let insightsData = null;
      if (response.data.insights) {
        insightsData = response.data.insights;
      } else if (response.data.data) {
        insightsData = response.data.data;
      } else {
        insightsData = response.data;
      }
      
      // FIXED: Validate insights structure and provide fallbacks
      if (insightsData && typeof insightsData === 'object') {
        setInsights(insightsData);
      } else {
        // If AI insights are not properly formatted, create mock insights based on lead data
        setInsights(generateFallbackInsights(lead));
      }
      
    } catch (error) {
      console.error('❌ Error fetching AI insights:', error);
      
      // FIXED: Better error handling with specific messages
      let errorMessage = 'Failed to load AI insights';
      
      if (error.response?.status === 404) {
        errorMessage = 'AI insights not available for this lead yet';
      } else if (error.response?.status === 503) {
        errorMessage = 'AI service temporarily unavailable';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error - check your connection';
      }
      
      setError(errorMessage);
      
      // FIXED: Provide fallback insights even when AI fails
      setInsights(generateFallbackInsights(lead));

    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead._id]);

  // FIXED: Generate fallback insights based on lead data
  const generateFallbackInsights = (leadData) => {
    const fallbackInsights = {
      talkingPoints: [],
      objectionHandling: [],
      nextBestActions: []
    };

    // Generate talking points based on lead data
    if (leadData.requirements?.budgetRange) {
      fallbackInsights.talkingPoints.push(`Discuss properties within their ${leadData.requirements.budgetRange} budget range`);
    }
    
    if (leadData.requirements?.propertyTypes?.length > 0) {
      fallbackInsights.talkingPoints.push(`Focus on their preferred property types: ${leadData.requirements.propertyTypes.join(', ')}`);
    }
    
    if (leadData.requirements?.preferredLocation) {
      fallbackInsights.talkingPoints.push(`Highlight properties in their preferred location: ${leadData.requirements.preferredLocation}`);
    }
    
    if (leadData.source) {
      fallbackInsights.talkingPoints.push(`Reference their interest from ${leadData.source} when discussing the project`);
    }

    // Generate objection handling based on lead status
    if (leadData.status === 'New' || leadData.status === 'Contacted') {
      fallbackInsights.objectionHandling.push('Address any concerns about location and connectivity');
      fallbackInsights.objectionHandling.push('Provide detailed information about project amenities');
      fallbackInsights.objectionHandling.push('Offer virtual or physical site visit to build confidence');
    }
    
    if (leadData.priority === 'Low') {
      fallbackInsights.objectionHandling.push('Create urgency by highlighting limited inventory');
      fallbackInsights.objectionHandling.push('Offer attractive payment plans or incentives');
    }

    // Generate next best actions based on lead score and status
    if (leadData.score >= 75) {
      fallbackInsights.nextBestActions.push('Schedule immediate site visit');
      fallbackInsights.nextBestActions.push('Prepare cost sheet with attractive payment options');
      fallbackInsights.nextBestActions.push('Follow up within 24 hours with project brochure');
    } else if (leadData.score >= 50) {
      fallbackInsights.nextBestActions.push('Send detailed project information');
      fallbackInsights.nextBestActions.push('Schedule phone call to understand requirements better');
      fallbackInsights.nextBestActions.push('Invite to upcoming project presentation');
    } else {
      fallbackInsights.nextBestActions.push('Send weekly newsletter to maintain engagement');
      fallbackInsights.nextBestActions.push('Invite to upcoming events or webinars');
      fallbackInsights.nextBestActions.push('Schedule follow-up call in 2 weeks');
    }

    return fallbackInsights;
  };

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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              AI-Powered Sales Insights
              {error && (
                <Chip 
                  label="Fallback Mode" 
                  color="warning" 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Typography>
            
            {/* FIXED: Show error but still display fallback insights */}
            {error && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={fetchInsights}>
                    Retry AI
                  </Button>
                }
              >
                {error} • Showing generated insights based on lead data.
              </Alert>
            )}
            
            {/* Talking Points */}
            {insights?.talkingPoints && insights.talkingPoints.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="primary" fontSize="small" />
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
            {insights?.objectionHandling && insights.objectionHandling.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
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
            {insights?.nextBestActions && insights.nextBestActions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="warning" fontSize="small" />
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

            {/* FIXED: Show message if no insights available */}
            {(!insights || (
              (!insights.talkingPoints || insights.talkingPoints.length === 0) &&
              (!insights.objectionHandling || insights.objectionHandling.length === 0) &&
              (!insights.nextBestActions || insights.nextBestActions.length === 0)
            )) && !loading && (
              <Alert severity="info">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  No AI insights available yet
                </Typography>
                <Typography variant="body2">
                  AI insights are generated based on lead interactions and behavior patterns. 
                  Once this lead has more activity, personalized insights will be available.
                </Typography>
              </Alert>
            )}

            {/* FIXED: Add manual refresh button */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchInsights}
                disabled={loading}
                size="small"
              >
                {loading ? 'Generating...' : 'Refresh Insights'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// =============================================================================
// INTERACTIONS COMPONENT - FIXED VERSION
// =============================================================================

const Interactions = ({ lead }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'Call',
    content: '', // FIXED: Changed from 'notes' to 'content'
    outcome: '',
  });

  const fetchInteractions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching interactions for lead:', lead._id);
      
      const response = await leadAPI.getInteractions(lead._id);
      console.log('✅ Interactions response:', response.data);
      
      // FIXED: Handle different response structures
      let interactionData = [];
      if (response.data.success && response.data.data) {
        // Backend returns { success: true, data: { interactions: [...] } }
        interactionData = response.data.data.interactions || response.data.data || [];
      } else if (response.data.data) {
        // Backend returns { data: [...] }
        interactionData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Backend returns [...] directly
        interactionData = response.data;
      }
      
      setInteractions(interactionData);
      console.log('✅ Loaded interactions:', interactionData.length);
      
    } catch (error) {
      console.error('❌ Error fetching interactions:', error);
      
      // FIXED: Better error handling with user-friendly messages
      if (error.response?.status === 404) {
        console.log('ℹ️ No interactions found for this lead');
        setInteractions([]);
      } else if (error.response?.status === 403) {
        console.error('🚫 Access denied to interactions');
        setInteractions([]);
      } else {
        console.error('💥 Network or server error:', error.message);
        setInteractions([]);
      }
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
      
      // FIXED: Validate required fields before sending
      if (!newInteraction.content.trim()) {
        alert('Please enter interaction details');
        return;
      }
      
      console.log('🔄 Adding interaction:', newInteraction);
      
      // FIXED: Send correct field names to backend
      const interactionPayload = {
        type: newInteraction.type,
        content: newInteraction.content.trim(), // Backend expects 'content', not 'notes'
        outcome: newInteraction.outcome.trim(),
        direction: 'Outbound', // Add default direction
      };
      
      const response = await leadAPI.addInteraction(lead._id, interactionPayload);
      console.log('✅ Interaction added:', response.data);
      
      // FIXED: Reset form properly
      setNewInteraction({ 
        type: 'Call', 
        content: '', // FIXED: Reset content field
        outcome: '' 
      });
      
      // Refresh interactions list
      fetchInteractions();
      
    } catch (error) {
      console.error('❌ Error adding interaction:', error);
      
      // FIXED: Better error handling
      if (error.response?.data?.message) {
        alert(`Failed to add interaction: ${error.response.data.message}`);
      } else {
        alert('Failed to add interaction. Please try again.');
      }
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
<MenuItem value="call">Phone Call</MenuItem>
<MenuItem value="email">Email</MenuItem>
<MenuItem value="whatsapp">WhatsApp</MenuItem>
<MenuItem value="site_visit">Site Visit</MenuItem>
<MenuItem value="meeting">In-person Meeting</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Interaction Details" // FIXED: Updated label
                  placeholder="What was discussed?"
                  value={newInteraction.content} // FIXED: Use 'content' field
                  onChange={(e) => setNewInteraction(prev => ({ ...prev, content: e.target.value }))}
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
                  disabled={addingInteraction || !newInteraction.content.trim()} // FIXED: Check content field
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
              Interaction History ({interactions.length})
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading interactions...
                </Typography>
              </Box>
            ) : interactions.length === 0 ? (
              <Alert severity="info">
                No interactions recorded yet. Add the first interaction above to start tracking communication with this lead.
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {interaction.type}
                            </Typography>
                            {interaction.outcome && (
                              <Chip 
                                label={interaction.outcome} 
                                size="small" 
                                color="info" 
                                variant="outlined" 
                              />
                            )}
                            {interaction.direction && (
                              <Chip 
                                label={interaction.direction} 
                                size="small" 
                                color={interaction.direction === 'Inbound' ? 'success' : 'default'} 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {/* FIXED: Handle both 'content' and 'notes' fields */}
                              {interaction.content || interaction.notes || 'No details provided'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(interaction.createdAt)} • By {
                                interaction.user?.firstName 
                                  ? `${interaction.user.firstName} ${interaction.user.lastName || ''}`
                                  : interaction.createdBy?.firstName 
                                    ? `${interaction.createdBy.firstName} ${interaction.createdBy.lastName || ''}`
                                    : 'Unknown'
                              }
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

// =============================================================================
// FOLLOW-UP MANAGEMENT COMPONENT
// =============================================================================

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
                  <MenuItem value="call">Phone Call</MenuItem>
<MenuItem value="email">Email</MenuItem>
<MenuItem value="whatsapp">WhatsApp</MenuItem>
<MenuItem value="site_visit">Site Visit</MenuItem>
<MenuItem value="meeting">In-person Meeting</MenuItem>
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

// =============================================================================
// MAIN LEAD DETAIL PAGE COMPONENT
// =============================================================================

const LeadDetailPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();

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
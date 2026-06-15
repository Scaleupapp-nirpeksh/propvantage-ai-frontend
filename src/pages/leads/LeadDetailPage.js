// File: src/pages/leads/LeadDetailPage.js
// Description: Lead detail page — Phase 5 redesign (requirement #23).
//   Clean top bar (name / email / phone / source / priority / status +
//   research links — no score, no temperature), AI profile summary directly
//   below, three tabs (Overview · Property Requirements · Follow-up with
//   Interactions nested), CP shown ONLY in its percentage card, and a working
//   three-dots menu: Edit Lead · Change Status (valid next transitions only) ·
//   Assign / Reassign.
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
  Autocomplete,
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
  History,
  Add,
  NavigateNext,
  Home,
  ContactPhone,
  InsertComment,
  Refresh,
  Handshake,
  Chat as ChatIcon,
  ShoppingCart,
  SwapHoriz,
  PersonAdd,
  LinkedIn,
  Language,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { leadAPI, aiAPI, leadRegistrationsAPI, userAPI } from '../../services/api';
import { allowedNextStatuses, statusLabel } from '../../utils/leadStatusMachine';
import LeadEnrichmentCard from '../../components/leads/LeadEnrichmentCard';
import ChannelPartnerAttributionSummary from '../../components/channel-partners/ChannelPartnerAttributionSummary';
import DevCommissionInvoiceCard from '../../components/leads/DevCommissionInvoiceCard';

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
    case 'revived': return 'secondary';
    default: return 'default';
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'error';
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
    case 'very low': return 'default';
    default: return 'default';
  }
};

// Human label for the assignee object (handles populated user or bare id).
const userLabel = (u) => {
  if (!u || typeof u !== 'object') return '';
  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return name || u.email || '';
};

// =============================================================================
// CHANGE STATUS DIALOG
// =============================================================================

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
            No further transitions available from "{statusLabel(lead?.status)}".
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current status: <strong>{statusLabel(lead?.status)}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="change-status-label">New Status</InputLabel>
              <Select
                labelId="change-status-label"
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

// =============================================================================
// ASSIGN / REASSIGN DIALOG
// =============================================================================

const AssignLeadDialog = ({ open, lead, onClose, onRefresh }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load org members (same robust envelope handling as the lead wizard), then
  // preselect the current assignee. Falls back to the current user if the
  // users endpoint is unavailable.
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
          .map((u) => ({ _id: u._id || u.id, firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', role: u.role || '' }));
      } catch {
        // Non-fatal — keep the current user as the only option below.
      }
      if (!team.length && user) {
        team = [{ _id: user._id || user.id, firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', role: user.role || '' }];
      }
      if (!active) return;
      setUsers(team);
      // Preselect the current assignee if present in the list.
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

// =============================================================================
// LEAD HEADER COMPONENT (top bar)
// =============================================================================

const LeadHeader = ({ lead, onRefresh, isLoading }) => {
  const { canAccess } = useAuth();
  const { openEntityConversation } = useChat();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const linkedinUrl = lead?.enrichment?.sources?.linkedinUrl;
  const companyWebsite = lead?.enrichment?.sources?.companyWebsite;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
            {lead?.firstName?.charAt(0)}{lead?.lastName?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {lead?.firstName} {lead?.lastName}
            </Typography>

            {/* Status / priority / source + research links */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={statusLabel(lead?.status) || 'Unknown'}
                color={getStatusColor(lead?.status)}
                size="small"
              />
              {/* 2026-05-25 — site-visit aging chip. Visible only when the
                  lead is stuck at Site Visit Scheduled (visit booked but not
                  logged) or Site Visit Completed (visit done but lead not
                  advanced). Same logic as the Leads list column. */}
              {['Site Visit Completed'].includes(lead?.status) && (lead?.statusChangedAt || lead?.updatedAt) && (() => {
                const days = Math.max(0, Math.floor((Date.now() - new Date(lead.statusChangedAt || lead.updatedAt).getTime()) / 86400000));
                const color = days >= 10 ? 'error' : days >= 5 ? 'warning' : days >= 2 ? 'info' : 'success';
                const label = days === 0 ? 'Just completed' : `${days}d since visit`;
                const tip = 'Days since visit completed — lead not yet advanced.';
                return (
                  <Tooltip title={tip}>
                    <Chip label={label} color={color} size="small" variant="outlined" />
                  </Tooltip>
                );
              })()}
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
              {linkedinUrl && (
                <Tooltip title="LinkedIn profile">
                  <Chip
                    icon={<LinkedIn />}
                    label="LinkedIn"
                    size="small"
                    color="primary"
                    variant="outlined"
                    clickable
                    component="a"
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </Tooltip>
              )}
              {companyWebsite && (
                <Tooltip title="Company website">
                  <Chip
                    icon={<Language />}
                    label="Website"
                    size="small"
                    color="primary"
                    variant="outlined"
                    clickable
                    component="a"
                    href={companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </Tooltip>
              )}
            </Box>

            {/* Email + phone */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {lead?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{lead.phone}</Typography>
                </Box>
              )}
              {lead?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{lead.email}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Tooltip title="Open Chat">
            <IconButton onClick={async () => {
              try {
                const conv = await openEntityConversation('Lead', lead?._id);
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

          {/* 2026-05-24 lifecycle-repair (F1): "Convert to Booking" CTA.
              Gated on salesPipeline() — creating a booking is a sales action,
              so the button only shows to users who can actually create a sale
              (matching the /sales/create route guard + CreateSalePage's
              canCreateSales). Visible when the lead is in active pipeline (not
              pending / Booked / Lost). Routes to /sales/create with the leadId
              query param; CreateSalePage auto-pre-fills the customer +
              auto-hydrates channel-partner attribution from the lead so the
              dev never has to manually re-tag the CP. */}
          {canAccess.salesPipeline() && lead?.status &&
            !['pending', 'Booked', 'Lost'].includes(lead.status) && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ShoppingCart />}
              onClick={() => navigate(`/sales/create?leadId=${lead._id}`)}
              sx={{ mr: 1 }}
            >
              Convert to Booking
            </Button>
          )}

          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            {canAccess.leadManagement() && (
              <MenuItem onClick={() => { handleMenuClose(); navigate(`/leads/${lead._id}/edit`); }}>
                <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                <ListItemText>Edit Lead</ListItemText>
              </MenuItem>
            )}
            {canAccess.leadManagement() && (
              <MenuItem onClick={() => { handleMenuClose(); setStatusDialogOpen(true); }}>
                <ListItemIcon><SwapHoriz fontSize="small" /></ListItemIcon>
                <ListItemText>Change Status</ListItemText>
              </MenuItem>
            )}
            {canAccess.leadManagement() && (
              <MenuItem onClick={() => { handleMenuClose(); setAssignDialogOpen(true); }}>
                <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
                <ListItemText>Assign / Reassign</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      <ChangeStatusDialog
        open={statusDialogOpen}
        lead={lead}
        onClose={() => setStatusDialogOpen(false)}
        onRefresh={onRefresh}
      />
      <AssignLeadDialog
        open={assignDialogOpen}
        lead={lead}
        onClose={() => setAssignDialogOpen(false)}
        onRefresh={onRefresh}
      />
    </Paper>
  );
};

// =============================================================================
// AI INSIGHTS (talking points etc.) — folded into the Overview tab
// =============================================================================

const AIInsights = ({ lead }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate fallback insights based on lead data when AI is unavailable.
  const generateFallbackInsights = (leadData) => {
    const fallbackInsights = {
      talkingPoints: [],
      objectionHandling: [],
      nextBestActions: []
    };

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

    if (leadData.status === 'New') {
      fallbackInsights.objectionHandling.push('Address any concerns about location and connectivity');
      fallbackInsights.objectionHandling.push('Provide detailed information about project amenities');
      fallbackInsights.objectionHandling.push('Offer virtual or physical site visit to build confidence');
    }
    if (leadData.priority === 'Low') {
      fallbackInsights.objectionHandling.push('Create urgency by highlighting limited inventory');
      fallbackInsights.objectionHandling.push('Offer attractive payment plans or incentives');
    }

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

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await aiAPI.getLeadInsights(lead._id);

      let insightsData = null;
      if (response.data.insights) {
        insightsData = response.data.insights;
      } else if (response.data.data) {
        insightsData = response.data.data;
      } else {
        insightsData = response.data;
      }

      if (insightsData && typeof insightsData === 'object') {
        setInsights(insightsData);
      } else {
        setInsights(generateFallbackInsights(lead));
      }
    } catch (error) {
      let errorMessage = 'Failed to load AI insights';
      if (error.response?.status === 404) {
        errorMessage = 'AI insights not available for this lead yet';
      } else if (error.response?.status === 503) {
        errorMessage = 'AI service temporarily unavailable';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error - check your connection';
      }
      setError(errorMessage);
      setInsights(generateFallbackInsights(lead));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead._id]);

  useEffect(() => {
    if (lead._id) {
      fetchInsights();
    }
  }, [fetchInsights, lead._id]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology color="primary" />
          AI-Powered Sales Insights
          {error && (
            <Chip label="Fallback Mode" color="warning" size="small" variant="outlined" />
          )}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Generating AI insights...
            </Typography>
          </Box>
        ) : (
          <>
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
                      <ListItemIcon><Star color="primary" fontSize="small" /></ListItemIcon>
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
                      <ListItemIcon><CheckCircle color="success" fontSize="small" /></ListItemIcon>
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
                      <ListItemIcon><TrendingUp color="warning" fontSize="small" /></ListItemIcon>
                      <ListItemText primary={action} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {(!insights || (
              (!insights.talkingPoints || insights.talkingPoints.length === 0) &&
              (!insights.objectionHandling || insights.objectionHandling.length === 0) &&
              (!insights.nextBestActions || insights.nextBestActions.length === 0)
            )) && (
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// OVERVIEW TAB — lead-management essentials + CP percentage card + AI insights
// =============================================================================

const LeadOverview = ({ lead }) => {
  return (
    <Grid container spacing={3}>
      {/* Lead Management */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              Lead Management
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Current Status</Typography>
                <Chip
                  label={statusLabel(lead?.status)}
                  color={getStatusColor(lead?.status)}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Priority Level</Typography>
                <Chip
                  label={lead?.priority || 'Medium'}
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
                      {userLabel(lead.assignedTo) || 'Unknown'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body1" color="text.secondary">Unassigned</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Created</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(lead?.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(lead?.updatedAt)}
                </Typography>
              </Box>
              {lead?.sourceDetails && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Source Details</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{lead.sourceDetails}</Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Channel Partner — the ONLY place CP appears now */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Handshake color="primary" />
              Channel Partner
            </Typography>
            <ChannelPartnerAttributionSummary attribution={lead?.channelPartnerAttribution} />
          </CardContent>
        </Card>
      </Grid>

      {/* AI Insights (talking points / objection handling / next actions) */}
      <Grid item xs={12}>
        <AIInsights lead={lead} />
      </Grid>

      {/* SP5+ — Commission Invoices submitted by the CP for this lead.
          The card auto-hides if there are no invoices, so direct dev leads
          (no CP attribution) get no empty card. */}
      <Grid item xs={12}>
        <DevCommissionInvoiceCard leadId={lead?._id} />
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
              <Typography variant="body1">{lead.notes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// =============================================================================
// PROPERTY REQUIREMENTS TAB
// =============================================================================

const PropertyRequirements = ({ lead }) => {
  // Read from the actual Lead.requirements shape ({timeline, unitType, floor,
  // facing, amenities, specialRequirements}) + top-level .budget / .project.
  const TIMELINE_LABELS = {
    'immediate': 'Immediate',
    '1-3_months': '1–3 months',
    '3-6_months': '3–6 months',
    '6-12_months': '6–12 months',
    '12+_months': '12+ months',
  };
  const FLOOR_LABELS = { low: 'Low floor', medium: 'Mid floor', high: 'High floor', any: 'Any' };
  const r = lead?.requirements || {};
  const hasBudget = lead?.budget?.min || lead?.budget?.max;

  return (
    <Grid container spacing={3}>
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {hasBudget
                    ? `${formatCurrency(lead.budget.min || 0)} – ${formatCurrency(lead.budget.max || 0)}`
                    : 'Not specified'}
                </Typography>
                {lead?.budget?.currency && hasBudget && (
                  <Typography variant="caption" color="text.secondary">
                    {lead.budget.currency}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Unit Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {r.unitType || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Project
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {lead?.project?.name || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {r.timeline ? (TIMELINE_LABELS[r.timeline] || r.timeline) : 'Flexible'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Floor Preference
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {r.floor?.preference && r.floor.preference !== 'any'
                    ? (FLOOR_LABELS[r.floor.preference] || r.floor.preference)
                    : 'Any'}
                  {r.floor?.specific ? ` (floor ${r.floor.specific})` : ''}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Facing
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {r.facing && r.facing !== 'Any' ? r.facing : 'Any'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Preferred Amenities
                </Typography>
                {Array.isArray(r.amenities) && r.amenities.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {r.amenities.map((a, i) => (
                      <Chip key={i} label={a} color="primary" size="small" variant="outlined" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">None specified</Typography>
                )}
              </Grid>
              {r.specialRequirements && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Special Requirements
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {r.specialRequirements}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// =============================================================================
// INTERACTIONS (nested inside the Follow-up tab)
// =============================================================================

const Interactions = ({ lead }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'Call',
    content: '',
    outcome: '',
  });

  const fetchInteractions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadAPI.getInteractions(lead._id);

      let interactionData = [];
      if (response.data.success && response.data.data) {
        interactionData = response.data.data.interactions || response.data.data || [];
      } else if (response.data.data) {
        interactionData = response.data.data;
      } else if (Array.isArray(response.data)) {
        interactionData = response.data;
      }

      setInteractions(interactionData);
    } catch (error) {
      // 404 (none yet) / 403 (no access) / network — all degrade to empty list.
      setInteractions([]);
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

      if (!newInteraction.content.trim()) {
        alert('Please enter interaction details');
        return;
      }

      const interactionPayload = {
        type: newInteraction.type,
        content: newInteraction.content.trim(),
        outcome: newInteraction.outcome.trim(),
        direction: 'Outbound',
      };

      await leadAPI.addInteraction(lead._id, interactionPayload);

      setNewInteraction({ type: 'Call', content: '', outcome: '' });
      fetchInteractions();
    } catch (error) {
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
                    <MenuItem value="Call">Phone Call</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                    <MenuItem value="Site Visit">Site Visit</MenuItem>
                    <MenuItem value="Meeting">In-person Meeting</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Interaction Details"
                  placeholder="What was discussed?"
                  value={newInteraction.content}
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
                  disabled={addingInteraction || !newInteraction.content.trim()}
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
                              <Chip label={interaction.outcome} size="small" color="info" variant="outlined" />
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
// FOLLOW-UP TAB (follow-up management + nested interactions)
// =============================================================================

const FollowUpManagement = ({ lead, onRefresh }) => {
  const [followUpDialog, setFollowUpDialog] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    date: new Date(),
    type: 'call',
    notes: '',
  });

  const handleScheduleFollowUp = async () => {
    try {
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

      {/* Interactions — nested in the same tab */}
      <Grid item xs={12}>
        <Interactions lead={lead} />
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
                  <MenuItem value="meeting">In-person Meeting</MenuItem>
                  <MenuItem value="text">Text Message</MenuItem>
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
  const { checkPerm } = useAuth();

  // State management
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // SP4: proposal decision state
  const [proposalRejectMode, setProposalRejectMode] = useState(false);
  const [proposalRejectNote, setProposalRejectNote] = useState('');
  const [proposalBusy, setProposalBusy] = useState(false);
  const [proposalError, setProposalError] = useState('');

  // Fetch lead data
  const fetchLead = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await leadAPI.getLead(leadId);

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
      if (!silent) {
        setError('Failed to load lead details. Please try again.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [leadId]);

  // Initial data load
  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [fetchLead, leadId]);

  // Poll while AI enrichment is running.
  // Depends on `lead` (not just the status string) on purpose: each silent
  // refetch replaces the `lead` reference, re-running this effect to schedule
  // the next poll. It self-terminates once the status becomes terminal.
  useEffect(() => {
    const status = lead?.enrichment?.status;
    if (status === 'pending' || status === 'researching') {
      const timer = setTimeout(() => fetchLead({ silent: true }), 5000);
      return () => clearTimeout(timer);
    }
  }, [lead, fetchLead]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // SP4: accept / reject CP-proposed status change
  const handleProposalDecision = async (action, note) => {
    setProposalBusy(true);
    setProposalError('');
    try {
      await leadRegistrationsAPI.decideProposal(leadId, { action, note: note || undefined });
      setProposalRejectMode(false);
      setProposalRejectNote('');
      await fetchLead({ silent: true });
    } catch (err) {
      setProposalError(err.response?.data?.message || 'Could not complete action.');
    } finally {
      setProposalBusy(false);
    }
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

      {/* SP4: CP-proposed status banner (kept — distinct, actionable element) */}
      {lead.proposedStatusChange && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box>
            {(() => {
              const partner = lead.channelPartnerAttribution?.partners?.[0];
              const agent = partner?.agentUser;
              const agentName = agent && typeof agent === 'object'
                ? `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email
                : 'CP Agent';
              const cpOrg = (partner?.channelPartner && typeof partner.channelPartner === 'object'
                ? partner.channelPartner.firmName : null) || lead.cpOrgName || 'a Channel Partner';
              return (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>{agentName}</strong> from <strong>{cpOrg}</strong> proposes moving this lead to <strong>{lead.proposedStatusChange.status}</strong>.
                </Typography>
              );
            })()}
            {lead.proposedStatusChange.note && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Note: {lead.proposedStatusChange.note}
              </Typography>
            )}
            {proposalError && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>{proposalError}</Typography>
            )}
            {checkPerm && checkPerm('leads:update') && (
              !proposalRejectMode ? (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="success"
                    onClick={() => handleProposalDecision('accept')} disabled={proposalBusy}>
                    Accept Proposal
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    onClick={() => setProposalRejectMode(true)} disabled={proposalBusy}>
                    Reject Proposal
                  </Button>
                </Stack>
              ) : (
                <Box>
                  <TextField fullWidth size="small" multiline minRows={2} sx={{ mt: 1, mb: 1 }}
                    placeholder="Reason (optional)"
                    value={proposalRejectNote} onChange={(e) => setProposalRejectNote(e.target.value)} />
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" color="error"
                      onClick={() => handleProposalDecision('reject', proposalRejectNote)} disabled={proposalBusy}>
                      Confirm Reject
                    </Button>
                    <Button size="small" onClick={() => { setProposalRejectMode(false); setProposalRejectNote(''); }} disabled={proposalBusy}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              )
            )}
          </Box>
        </Alert>
      )}

      {/* Top bar */}
      <LeadHeader
        lead={lead}
        onRefresh={fetchLead}
        isLoading={loading}
      />

      {/* AI Profile Summary — directly below the top bar, above the tabs */}
      <Box sx={{ mb: 3 }}>
        <LeadEnrichmentCard lead={lead} onRefresh={() => fetchLead({ silent: true })} />
      </Box>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Property Requirements" />
          <Tab label="Follow-up" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && <LeadOverview lead={lead} />}
      {activeTab === 1 && <PropertyRequirements lead={lead} />}
      {activeTab === 2 && <FollowUpManagement lead={lead} onRefresh={fetchLead} />}
    </Box>
  );
};

export default LeadDetailPage;

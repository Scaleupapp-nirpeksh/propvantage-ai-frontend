import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Avatar, Chip, IconButton, Tooltip, Menu, MenuItem,
  ListItemIcon, ListItemText, Divider, Alert, Typography, Button,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Add, Phone, Email, Visibility, Edit, Schedule, Warning,
  Person, Refresh, Event, LocationOn, MoreVert,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { leadAPI, projectAPI, channelPartnerAPI } from '../../services/api';
import { PageHeader, KPICard, FilterBar, DataTable, StatusChip } from '../../components/common';
import { LEAD_STATUS, LEAD_PRIORITY } from '../../constants/statusConfig';

// Constants
const LEAD_STATUSES = Object.keys(LEAD_STATUS);
const LEAD_SOURCES = [
  'Channel Partner', 'Management', 'Direct', 'Referral', 'Marketing', 'Cold Calling',
];
const PRIORITIES = ['High', 'Medium', 'Low', 'Very Low'];

// Helpers
const getTimeAgo = (date) => {
  if (!date) return 'Never';
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

// Lead Action Menu (reused for both desktop and mobile)
const LeadActionMenu = ({ lead, anchorEl, onClose, onAction }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} onClick={(e) => e.stopPropagation()}>
    <MenuItem onClick={() => { onAction('view', lead); onClose(); }}>
      <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
      <ListItemText>View Details</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('call', lead); onClose(); }}>
      <ListItemIcon><Phone fontSize="small" /></ListItemIcon>
      <ListItemText>Call Lead</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('email', lead); onClose(); }}>
      <ListItemIcon><Email fontSize="small" /></ListItemIcon>
      <ListItemText>Send Email</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => { onAction('schedule', lead); onClose(); }}>
      <ListItemIcon><Event fontSize="small" /></ListItemIcon>
      <ListItemText>Schedule Follow-up</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={() => { onAction('edit', lead); onClose(); }}>
      <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
      <ListItemText>Edit Lead</ListItemText>
    </MenuItem>
  </Menu>
);

// Mobile card renderer for DataTable
const LeadMobileCard = ({ lead, onAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.813rem' }}>
            {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {lead.firstName} {lead.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {lead.phone}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
          <MoreVert fontSize="small" />
        </IconButton>
        <LeadActionMenu lead={lead} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} onAction={onAction} />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
        <StatusChip status={lead.status} type="lead" size="small" />
        <Chip label={`${lead.score || 0}`} size="small" sx={{ fontWeight: 600, minWidth: 40 }} />
        <Chip label={lead.priority || 'Very Low'} color={(LEAD_PRIORITY[lead.priority] || {}).color || 'default'} size="small" variant="outlined" sx={{ fontSize: '0.688rem', height: 22 }} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '60%' }}>
          {lead.project?.name || 'No Project'}
          {lead.project?.location?.city && ` · ${lead.project.location.city}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {getTimeAgo(lead.createdAt)}
        </Typography>
      </Box>

      {lead.followUpSchedule?.isOverdue && (
        <Chip
          label={`Overdue ${lead.followUpSchedule.overdueBy}d`}
          color="error"
          size="small"
          icon={<Warning sx={{ fontSize: 14 }} />}
          sx={{ mt: 0.75, height: 22, fontSize: '0.688rem' }}
        />
      )}
    </Box>
  );
};

// Main page component
const LeadsListPage = () => {
  const navigate = useNavigate();
  useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [channelPartners, setChannelPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [menuState, setMenuState] = useState({ anchorEl: null, lead: null });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    source: searchParams.get('source') || '',
    priority: searchParams.get('priority') || '',
    project: searchParams.get('project') || '',
    channelPartner: searchParams.get('channelPartner') || '',
    sortBy: searchParams.get('sortBy') || 'score',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: page + 1, limit: rowsPerPage, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const response = await leadAPI.getLeads(params);
      if (response.data.success) {
        setLeads(response.data.data.leads || []);
        setTotalCount(response.data.data.pagination?.total || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads.');
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
      if (response.data.success) setProjects(response.data.data || []);
    } catch (err) { /* silent */ }
  }, []);

  // Fetch channel partners for filter dropdown
  const fetchChannelPartners = useCallback(async () => {
    try {
      const response = await channelPartnerAPI.getChannelPartners({ status: 'active' });
      setChannelPartners(response.data?.data || []);
    } catch (err) { /* silent */ }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchChannelPartners(); }, [fetchChannelPartners]);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', source: '', priority: '', project: '', channelPartner: '', sortBy: 'score', sortOrder: 'desc' });
    setPage(0);
  };

  const handleAction = (action, lead) => {
    switch (action) {
      case 'view': navigate(`/leads/${lead._id}`); break;
      case 'call': window.open(`tel:${lead.phone}`); break;
      case 'email': if (lead.email) window.open(`mailto:${lead.email}`); break;
      case 'schedule': navigate(`/leads/${lead._id}/schedule`); break;
      case 'edit': navigate(`/leads/${lead._id}/edit`); break;
      default: break;
    }
  };

  // Summary stats
  const stats = useMemo(() => ({
    total: totalCount,
    hot: leads.filter(l => l.score >= 90).length,
    highPriority: leads.filter(l => l.priority === 'High').length,
    overdue: leads.filter(l => l.followUpSchedule?.isOverdue).length,
    newToday: leads.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
  }), [leads, totalCount]);

  // FilterBar config
  const filterConfig = [
    { key: 'search', type: 'search', label: 'Leads', placeholder: 'Search leads...' },
    { key: 'status', type: 'select', label: 'Status', options: LEAD_STATUSES.filter(s => s !== 'pending').map(s => ({ value: s, label: s })) },
    { key: 'priority', type: 'select', label: 'Priority', options: PRIORITIES.map(p => ({ value: p, label: p })) },
    { key: 'source', type: 'select', label: 'Source', options: LEAD_SOURCES.map(s => ({ value: s, label: s })) },
    { key: 'project', type: 'select', label: 'Project', options: projects.map(p => ({ value: p._id, label: p.name })) },
    { key: 'channelPartner', type: 'select', label: 'Channel Partner', options: channelPartners.map(cp => ({ value: cp._id, label: cp.firmName })) },
  ];

  // DataTable columns
  const columns = [
    {
      id: 'name', label: 'Lead', sortable: false,
      render: (_, lead) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {lead.firstName} {lead.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {lead.phone} {lead.email ? `· ${lead.email}` : ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'score', label: 'Score / Priority', sortable: true, width: 140,
      render: (_, lead) => (
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`${lead.score || 0}`} size="small" sx={{ fontWeight: 600, minWidth: 40 }} />
          <Chip label={lead.priority || 'Very Low'} color={(LEAD_PRIORITY[lead.priority] || {}).color || 'default'} size="small" />
        </Box>
      ),
    },
    {
      id: 'status', label: 'Status', sortable: false, width: 160,
      render: (_, lead) => {
        // 2026-05-25 — aging indicator for stuck site-visit stages.
        // Shows "X days at this status" beneath the StatusChip when the lead
        // is in 'Site Visit Completed' (visit done but status hasn't progressed).
        // Color-coded so the dev's eye is drawn to the leads going cold.
        const SITE_VISIT_AGING_STATUSES = ['Site Visit Completed'];
        const showAging = SITE_VISIT_AGING_STATUSES.includes(lead.status);
        let agingNode = null;
        if (showAging) {
          const since = lead.statusChangedAt || lead.updatedAt;
          if (since) {
            const days = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86400000));
            const color = days >= 10 ? 'error' : days >= 5 ? 'warning' : days >= 2 ? 'info' : 'success';
            const label = days === 0 ? 'Just completed' : `${days}d since visit`;
            agingNode = (
              <Tooltip
                title='Days since the visit was logged — lead has not moved to the next stage.'
              >
                <Chip
                  size="small"
                  color={color}
                  variant="outlined"
                  label={label}
                  sx={{ height: 18, fontSize: '0.65rem', mt: 0.5, '& .MuiChip-label': { px: 0.75 } }}
                />
              </Tooltip>
            );
          }
        }
        return (
          <Box>
            <StatusChip status={lead.status} type="lead" size="small" />
            {agingNode}
          </Box>
        );
      },
    },
    {
      id: 'project', label: 'Project', sortable: false, hideOnMobile: true,
      render: (_, lead) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {lead.project?.name || 'No Project'}
          </Typography>
          {lead.project?.location?.city && (
            <Typography variant="caption" color="text.secondary" noWrap>
              <LocationOn sx={{ fontSize: 11, mr: 0.25, verticalAlign: 'text-bottom' }} />
              {lead.project.location.city}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'channelPartner', label: 'Channel Partner', sortable: false, hideOnMobile: true,
      render: (_, row) => {
        const a = row.channelPartnerAttribution;
        if (!a || !a.viaChannelPartner || !(a.partners || []).length) {
          return <Typography variant="body2" color="text.secondary">—</Typography>;
        }
        const first = (a.partners[0]?.channelPartner?.firmName) || 'Channel partner';
        const extra = a.partners.length > 1 ? ` +${a.partners.length - 1}` : '';
        return <Chip size="small" label={`${first}${extra}`} />;
      },
    },
    {
      id: 'assignedTo', label: 'Assigned', sortable: false, hideOnMobile: true, width: 140,
      render: (_, lead) => lead.assignedTo ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar sx={{ width: 22, height: 22, fontSize: '0.688rem' }}>
            {lead.assignedTo.firstName?.charAt(0)}
          </Avatar>
          <Typography variant="body2" noWrap>
            {lead.assignedTo.firstName} {lead.assignedTo.lastName}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">Unassigned</Typography>
      ),
    },
    {
      id: 'followUp', label: 'Follow-up', sortable: false, hideOnMobile: true, width: 150,
      render: (_, lead) => {
        if (!lead.followUpSchedule?.nextFollowUpDate) {
          return <Typography variant="caption" color="text.disabled">Not scheduled</Typography>;
        }
        if (lead.followUpSchedule.isOverdue) {
          return (
            <Chip
              label={`Overdue ${lead.followUpSchedule.overdueBy}d`}
              color="error" size="small" icon={<Warning sx={{ fontSize: 14 }} />}
              sx={{ height: 22, fontSize: '0.688rem' }}
            />
          );
        }
        return (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {new Date(lead.followUpSchedule.nextFollowUpDate).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
              {lead.followUpSchedule.followUpType}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'created', label: 'Created', sortable: false, hideOnMobile: true, width: 80,
      render: (_, lead) => (
        <Typography variant="caption" color="text.secondary">{getTimeAgo(lead.createdAt)}</Typography>
      ),
    },
    {
      id: 'actions', label: '', sortable: false, width: 48, align: 'right',
      render: (_, lead) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuState({ anchorEl: e.currentTarget, lead }); }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Lead Management"
        subtitle="Manage and track all your leads in one place"
        icon={Person}
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchLeads} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => navigate('/leads/create')}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              {!isMobile && 'Add Lead'}
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }} data-coach="kpi-cards">
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Total Leads" value={stats.total} icon={Person} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="High Priority" value={stats.highPriority} icon={Warning} color="error" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="Overdue Follow-ups" value={stats.overdue} icon={Schedule} color="warning" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KPICard title="New Today" value={stats.newToday} icon={Add} color="success" loading={loading} />
        </Grid>
      </Grid>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={leads}
        loading={loading}
        onRowClick={(lead) => navigate(`/leads/${lead._id}`)}
        currentSort={{ field: filters.sortBy, direction: filters.sortOrder }}
        onSort={(field) => {
          const dir = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
          handleFilterChange('sortBy', field);
          handleFilterChange('sortOrder', dir);
        }}
        pagination={{
          page,
          rowsPerPage,
          total: totalCount,
          onPageChange: (p) => setPage(p),
          onRowsPerPageChange: (rpp) => { setRowsPerPage(rpp); setPage(0); },
        }}
        emptyState={{
          icon: Person,
          title: 'No leads found',
          description: Object.values(filters).some(v => v) ? 'No leads match your filters' : 'No leads created yet',
          action: { label: 'Create Lead', onClick: () => navigate('/leads/create') },
        }}
        mobileCardRenderer={(lead) => <LeadMobileCard lead={lead} onAction={handleAction} />}
        responsive="card"
      />

      {/* Shared action menu for desktop rows */}
      <LeadActionMenu
        lead={menuState.lead}
        anchorEl={menuState.anchorEl}
        onClose={() => setMenuState({ anchorEl: null, lead: null })}
        onAction={handleAction}
      />
    </Box>
  );
};

export default LeadsListPage;

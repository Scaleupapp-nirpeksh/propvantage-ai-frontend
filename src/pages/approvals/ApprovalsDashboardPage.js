// File: src/pages/approvals/ApprovalsDashboardPage.js
// Centralized approval dashboard — pending queue, my requests, recent activity, stats

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Chip,
  Button,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Percent,
  TrendingUp,
  Replay,
  EditCalendar,
  Paid,
  Receipt,
  Refresh,
  ThumbUp,
  ThumbDown,
  AccessTime,
  Assignment,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { approvalsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, KPICard, DataTable, FilterBar, EmptyState } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import { formatDistanceToNow } from 'date-fns';

// Approval type display config
const APPROVAL_TYPE_CONFIG = {
  DISCOUNT_APPROVAL:        { label: 'Discount',      icon: Percent,      color: '#f57c00' },
  SALE_CANCELLATION:        { label: 'Cancellation',   icon: Cancel,       color: '#e53935' },
  PRICE_OVERRIDE:           { label: 'Price Override',  icon: TrendingUp,   color: '#8e24aa' },
  REFUND_APPROVAL:          { label: 'Refund',         icon: Replay,       color: '#00897b' },
  INSTALLMENT_MODIFICATION: { label: 'Installment',    icon: EditCalendar, color: '#1e88e5' },
  COMMISSION_PAYOUT:        { label: 'Commission',     icon: Paid,         color: '#43a047' },
  INVOICE_APPROVAL:         { label: 'Invoice',        icon: Receipt,      color: '#3949ab' },
};

const PRIORITY_COLORS = {
  Critical: 'error',
  High: 'warning',
  Medium: 'info',
  Low: 'default',
};

// SLA countdown renderer
const SlaCountdown = ({ isOverdue, hoursUntilDeadline }) => {
  if (isOverdue) {
    return (
      <Chip
        label="OVERDUE"
        size="small"
        color="error"
        sx={{ fontWeight: 700, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }}
      />
    );
  }
  if (hoursUntilDeadline == null) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const color = hoursUntilDeadline > 12 ? 'success' : 'warning';
  const hours = Math.floor(hoursUntilDeadline);
  return <Chip label={`${hours}h left`} size="small" color={color} variant="outlined" />;
};

// Approval type chip
const ApprovalTypeChip = ({ type }) => {
  const cfg = APPROVAL_TYPE_CONFIG[type] || { label: type, color: '#757575' };
  const Icon = cfg.icon;
  return (
    <Chip
      icon={Icon ? <Icon sx={{ fontSize: 16 }} /> : undefined}
      label={cfg.label}
      size="small"
      sx={{ bgcolor: alpha(cfg.color, 0.1), color: cfg.color, fontWeight: 600, '& .MuiChip-icon': { color: cfg.color } }}
    />
  );
};

const ApprovalsDashboardPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dashboard, setDashboard] = useState({ pendingForMe: [], myRequests: [], recentlyResolved: [], stats: [] });

  // All requests tab state
  const [allRequests, setAllRequests] = useState([]);
  const [allPagination, setAllPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [allFilters, setAllFilters] = useState({ status: '', approvalType: '' });
  const [allLoading, setAllLoading] = useState(false);

  // Derive stats
  const deriveStats = (stats) => {
    const result = { pending: 0, approved: 0, rejected: 0 };
    stats.forEach(({ _id, count }) => {
      if (_id.status === 'pending') result.pending += count;
      if (_id.status === 'approved') result.approved += count;
      if (_id.status === 'rejected') result.rejected += count;
    });
    return result;
  };

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await approvalsAPI.getDashboard();
      const data = res.data?.data || res.data || {};
      setDashboard({
        pendingForMe: data.pendingForMe || [],
        myRequests: data.myRequests || [],
        recentlyResolved: data.recentlyResolved || [],
        stats: data.stats || [],
      });
    } catch (error) {
      enqueueSnackbar('Failed to load approvals dashboard', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchAllRequests = useCallback(async () => {
    try {
      setAllLoading(true);
      const params = {
        page: allPagination.page,
        limit: allPagination.limit,
        ...(allFilters.status && { status: allFilters.status }),
        ...(allFilters.approvalType && { approvalType: allFilters.approvalType }),
      };
      const res = await approvalsAPI.getAll(params);
      const data = res.data?.data || res.data || {};
      setAllRequests(data.approvals || []);
      setAllPagination(prev => ({ ...prev, ...(data.pagination || {}) }));
    } catch (error) {
      enqueueSnackbar('Failed to load all requests', { variant: 'error' });
    } finally {
      setAllLoading(false);
    }
  }, [allPagination.page, allPagination.limit, allFilters, enqueueSnackbar]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (activeTab === 2 && canAccess.approvalsViewAll()) fetchAllRequests(); }, [activeTab, fetchAllRequests, canAccess]);

  // Quick approve/reject from dashboard
  const handleQuickApprove = async (e, id) => {
    e.stopPropagation();
    try {
      await approvalsAPI.approve(id, {});
      enqueueSnackbar('Request approved', { variant: 'success' });
      fetchDashboard();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve', { variant: 'error' });
    }
  };

  const handleQuickReject = (e, id) => {
    e.stopPropagation();
    navigate(`/approvals/${id}`); // Reject requires comment — go to detail page
  };

  const handleCancelRequest = async (e, id) => {
    e.stopPropagation();
    try {
      await approvalsAPI.cancel(id, {});
      enqueueSnackbar('Request cancelled', { variant: 'success' });
      fetchDashboard();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to cancel', { variant: 'error' });
    }
  };

  const stats = deriveStats(dashboard.stats);

  // Helpers
  const getRequesterName = (item) => {
    const rb = item.requestedBy;
    if (!rb) return 'Unknown';
    return typeof rb === 'object' ? `${rb.firstName || ''} ${rb.lastName || ''}`.trim() : 'Unknown';
  };

  const getResolverName = (item) => {
    const rb = item.resolvedBy;
    if (!rb) return 'Unknown';
    return typeof rb === 'object' ? `${rb.firstName || ''} ${rb.lastName || ''}`.trim() : 'Unknown';
  };

  // Pending columns
  const pendingColumns = [
    { id: 'requestNumber', label: '#', width: 100 },
    { id: 'approvalType', label: 'Type', width: 140, render: (val) => <ApprovalTypeChip type={val} /> },
    { id: 'title', label: 'Title', width: 280, hideOnMobile: true },
    { id: 'requestedBy', label: 'Requested By', width: 140, render: (_, row) => getRequesterName(row), hideOnMobile: true },
    { id: 'priority', label: 'Priority', width: 90, render: (val) => <Chip label={val} size="small" color={PRIORITY_COLORS[val] || 'default'} variant="outlined" /> },
    { id: 'sla', label: 'SLA', width: 110, render: (_, row) => <SlaCountdown isOverdue={row.isOverdue} hoursUntilDeadline={row.hoursUntilDeadline} /> },
    { id: 'actions', label: 'Actions', width: 130, render: (_, row) => (
      <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Approve">
          <IconButton size="small" color="success" onClick={(e) => handleQuickApprove(e, row._id)}>
            <ThumbUp fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reject (requires comment)">
          <IconButton size="small" color="error" onClick={(e) => handleQuickReject(e, row._id)}>
            <ThumbDown fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )},
  ];

  // My requests columns
  const myRequestsColumns = [
    { id: 'requestNumber', label: '#', width: 100 },
    { id: 'approvalType', label: 'Type', width: 140, render: (val) => <ApprovalTypeChip type={val} /> },
    { id: 'title', label: 'Title', width: 280, hideOnMobile: true },
    { id: 'status', label: 'Status', width: 110, render: (val) => {
      const colors = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };
      return <Chip label={val} size="small" color={colors[val] || 'default'} sx={{ textTransform: 'capitalize' }} />;
    }},
    { id: 'createdAt', label: 'Created', width: 120, render: (val) => formatDate(val), hideOnMobile: true },
    { id: 'cancel', label: '', width: 80, render: (_, row) => row.status === 'pending' ? (
      <Button size="small" color="error" variant="text" onClick={(e) => handleCancelRequest(e, row._id)}>Cancel</Button>
    ) : null },
  ];

  // All requests columns
  const allColumns = [
    { id: 'requestNumber', label: '#', width: 100 },
    { id: 'approvalType', label: 'Type', width: 140, render: (val) => <ApprovalTypeChip type={val} /> },
    { id: 'title', label: 'Title', width: 250, hideOnMobile: true },
    { id: 'requestedBy', label: 'Requested By', width: 140, render: (_, row) => getRequesterName(row), hideOnMobile: true },
    { id: 'status', label: 'Status', width: 110, render: (val) => {
      const colors = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };
      return <Chip label={val} size="small" color={colors[val] || 'default'} sx={{ textTransform: 'capitalize' }} />;
    }},
    { id: 'createdAt', label: 'Created', width: 120, render: (val) => formatDate(val), hideOnMobile: true },
  ];

  // All requests filter config
  const allFilterConfig = [
    { key: 'status', type: 'select', label: 'Status', options: [
      { value: '', label: 'All Statuses' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'cancelled', label: 'Cancelled' },
    ]},
    { key: 'approvalType', type: 'select', label: 'Type', options: [
      { value: '', label: 'All Types' },
      ...Object.entries(APPROVAL_TYPE_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
    ]},
  ];

  // Mobile card renderers
  const pendingMobileCard = (row) => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">{row.requestNumber}</Typography>
        <SlaCountdown isOverdue={row.isOverdue} hoursUntilDeadline={row.hoursUntilDeadline} />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{row.title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <ApprovalTypeChip type={row.approvalType} />
        <Chip label={row.priority} size="small" color={PRIORITY_COLORS[row.priority] || 'default'} variant="outlined" />
      </Box>
      <Typography variant="caption" color="text.secondary">By {getRequesterName(row)}</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Button size="small" variant="contained" color="success" startIcon={<ThumbUp />} onClick={(e) => handleQuickApprove(e, row._id)}>Approve</Button>
        <Button size="small" variant="outlined" color="error" startIcon={<ThumbDown />} onClick={(e) => handleQuickReject(e, row._id)}>Reject</Button>
      </Box>
    </Box>
  );

  const myRequestsMobileCard = (row) => (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">{row.requestNumber}</Typography>
        <Chip label={row.status} size="small" color={{ pending: 'warning', approved: 'success', rejected: 'error' }[row.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{row.title}</Typography>
      <ApprovalTypeChip type={row.approvalType} />
      {row.status === 'pending' && (
        <Box sx={{ mt: 1.5 }}>
          <Button size="small" color="error" variant="text" onClick={(e) => handleCancelRequest(e, row._id)}>Cancel Request</Button>
        </Box>
      )}
    </Box>
  );

  // Recent activity section
  const RecentActivity = () => (
    <Box>
      {dashboard.recentlyResolved.length === 0 ? (
        <EmptyState icon={AccessTime} title="No recent activity" description="Resolved approvals will appear here" />
      ) : (
        dashboard.recentlyResolved.map((item) => (
          <Box
            key={item._id}
            onClick={() => navigate(`/approvals/${item._id}`)}
            sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1 }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.status === 'approved' ? 'success.main' : 'error.main', flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {getResolverName(item)} {item.status === 'approved' ? 'approved' : 'rejected'} {item.requestNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.resolvedAt ? formatDistanceToNow(new Date(item.resolvedAt), { addSuffix: true }) : ''}
              </Typography>
            </Box>
            <ApprovalTypeChip type={item.approvalType} />
          </Box>
        ))
      )}
    </Box>
  );

  // Build tabs
  const tabs = [
    { label: 'Pending For Me', count: dashboard.pendingForMe.length },
    { label: 'My Requests', count: dashboard.myRequests.length },
    ...(canAccess.approvalsViewAll() ? [{ label: 'All Requests', count: null }] : []),
    { label: 'Recent Activity', count: null },
  ];

  return (
    <Box>
      <PageHeader
        title="Approvals"
        subtitle="Manage approval requests across the platform"
        icon={Assignment}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchDashboard}><Refresh /></IconButton>
            </Tooltip>
            {canAccess.approvalsPolicies() && (
              <Button variant="outlined" size="small" onClick={() => navigate('/approvals/policies')}>
                Manage Policies
              </Button>
            )}
          </Box>
        }
      />

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KPICard title="Pending For Me" value={dashboard.pendingForMe.length} icon={HourglassEmpty} color="warning" loading={loading} onClick={() => setActiveTab(0)} />
        <KPICard title="My Requests" value={dashboard.myRequests.length} icon={Assignment} color="info" loading={loading} onClick={() => setActiveTab(1)} />
        <KPICard title="Approved (30d)" value={stats.approved} icon={CheckCircle} color="success" loading={loading} />
        <KPICard title="Rejected (30d)" value={stats.rejected} icon={Cancel} color="error" loading={loading} />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
      >
        {tabs.map((tab, i) => (
          <Tab
            key={i}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <Chip label={tab.count} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <DataTable
          columns={pendingColumns}
          rows={dashboard.pendingForMe}
          loading={loading}
          onRowClick={(row) => navigate(`/approvals/${row._id}`)}
          responsive="card"
          mobileCardRenderer={pendingMobileCard}
          emptyState={{ icon: CheckCircle, title: 'No pending approvals', description: "You're all caught up!" }}
        />
      )}

      {activeTab === 1 && (
        <DataTable
          columns={myRequestsColumns}
          rows={dashboard.myRequests}
          loading={loading}
          onRowClick={(row) => navigate(`/approvals/${row._id}`)}
          responsive="card"
          mobileCardRenderer={myRequestsMobileCard}
          emptyState={{ icon: Assignment, title: 'No requests', description: "You haven't submitted any approval requests yet" }}
        />
      )}

      {activeTab === 2 && canAccess.approvalsViewAll() && (
        <>
          <FilterBar
            filters={allFilterConfig}
            values={allFilters}
            onChange={(key, val) => {
              setAllFilters(prev => ({ ...prev, [key]: val }));
              setAllPagination(prev => ({ ...prev, page: 1 }));
            }}
            onClear={() => setAllFilters({ status: '', approvalType: '' })}
          />
          <DataTable
            columns={allColumns}
            rows={allRequests}
            loading={allLoading}
            onRowClick={(row) => navigate(`/approvals/${row._id}`)}
            responsive="card"
            pagination={{
              page: allPagination.page,
              rowsPerPage: allPagination.limit,
              total: allPagination.total,
              onPageChange: (newPage) => setAllPagination(prev => ({ ...prev, page: newPage })),
            }}
            emptyState={{ icon: Assignment, title: 'No requests found', description: 'Try adjusting your filters' }}
          />
        </>
      )}

      {/* Recent Activity tab — index depends on whether "All Requests" tab exists */}
      {((canAccess.approvalsViewAll() && activeTab === 3) || (!canAccess.approvalsViewAll() && activeTab === 2)) && (
        <RecentActivity />
      )}
    </Box>
  );
};

export default ApprovalsDashboardPage;

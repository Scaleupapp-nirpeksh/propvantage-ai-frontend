// File: src/pages/sales/CommissionDashboardPage.js
// Description: Main commission management dashboard with overview metrics, recent commissions, and quick actions
// Version: 1.0 - Complete commission dashboard with backend integration
// Location: src/pages/sales/CommissionDashboardPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  Error as ErrorIcon,
  AccountBalanceWallet,
  Assessment,
  MonetizationOn,
  PendingActions,
  Visibility,
  Refresh,
  Settings,
  ArrowForward,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Commission status configurations with colors and icons
const COMMISSION_STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    color: 'warning', 
    icon: Schedule,
    bgColor: '#fff3cd',
    textColor: '#856404'
  },
  approved: { 
    label: 'Approved', 
    color: 'success', 
    icon: CheckCircle,
    bgColor: '#d4edda',
    textColor: '#155724'
  },
  paid: { 
    label: 'Paid', 
    color: 'success', 
    icon: AccountBalanceWallet,
    bgColor: '#d1ecf1',
    textColor: '#0c5460'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'error', 
    icon: ErrorIcon,
    bgColor: '#f8d7da',
    textColor: '#721c24'
  },
  on_hold: { 
    label: 'On Hold', 
    color: 'default', 
    icon: PendingActions,
    bgColor: '#e2e3e5',
    textColor: '#383d41'
  },
};

// Quick action buttons configuration
const QUICK_ACTIONS = [
  {
    id: 'view-all',
    title: 'View All Commissions',
    description: 'Browse and manage all commission records',
    icon: Assignment,
    path: '/sales/commissions/list',
    color: 'primary',
  },
  {
    id: 'commission-structures',
    title: 'Commission Structures',
    description: 'Manage commission rules and structures',
    icon: Settings,
    path: '/sales/commissions/structures',
    color: 'secondary',
    requiresManagement: true,
  },
  {
    id: 'commission-payments',
    title: 'Process Payments',
    description: 'Process commission payments',
    icon: AccountBalanceWallet,
    path: '/sales/commissions/payments',
    color: 'success',
    requiresFinance: true,
  },
  {
    id: 'commission-reports',
    title: 'Commission Reports',
    description: 'View analytics and generate reports',
    icon: Assessment,
    path: '/sales/commissions/reports',
    color: 'info',
  },
];

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Commission Status Chip Component
 * Renders a status chip with appropriate styling based on commission status
 */
const CommissionStatusChip = ({ status, size = 'small' }) => {
  const config = COMMISSION_STATUS_CONFIG[status] || COMMISSION_STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <Chip
      icon={<StatusIcon sx={{ fontSize: 16 }} />}
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 500,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
};

/**
 * Metric Card Component
 * Displays key performance indicators and metrics
 */
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  isLoading = false 
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}.main`, 
              width: 48, 
              height: 48,
              mr: 2
            }}
          >
            <Icon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {value}
              </Typography>
            )}
          </Box>
        </Box>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && trendValue && !isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TrendIcon 
              sx={{ 
                fontSize: 16, 
                color: trend === 'up' ? 'success.main' : 'error.main',
                mr: 0.5 
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend === 'up' ? 'success.main' : 'error.main',
                fontWeight: 500 
              }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Quick Action Card Component
 * Renders actionable cards for common commission tasks
 */
const QuickActionCard = ({ action, onNavigate, canAccess }) => {
  const theme = useTheme();
  const ActionIcon = action.icon;

  // Check access permissions
  if (action.requiresManagement && !canAccess.projectManagement()) {
    return null;
  }
  if (action.requiresFinance && !canAccess.viewFinancials()) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => onNavigate(action.path)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${action.color}.main`, 
              width: 40, 
              height: 40,
              mr: 2
            }}
          >
            <ActionIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {action.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {action.description}
            </Typography>
          </Box>
          <ArrowForward sx={{ color: 'text.secondary', fontSize: 20 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Recent Commissions Table Component
 * Displays recent commission entries with quick actions
 */
const RecentCommissionsTable = ({ commissions, onNavigate, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!commissions || commissions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No recent commissions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Commission records will appear here once sales are made
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Partner</TableCell>
            <TableCell>Sale Amount</TableCell>
            <TableCell>Commission</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commissions.map((commission) => (
            <TableRow key={commission._id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                    {commission.partner?.firstName?.charAt(0) || 'P'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {commission.partner?.firstName} {commission.partner?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {commission.partner?.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(commission.saleDetails?.salePrice || 0)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {formatCurrency(commission.commissionCalculation?.netCommission || 0)}
                </Typography>
              </TableCell>
              <TableCell>
                <CommissionStatusChip status={commission.status} />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(commission.createdAt)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    onClick={() => onNavigate(`/sales/commissions/list/${commission._id}`)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission Dashboard Page Component
 * Main dashboard for commission management with metrics, recent data, and quick actions
 */
const CommissionDashboardPage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalCommissions: 0,
      totalCommissionAmount: 0,
      pendingCommissions: 0,
      overdueCommissions: 0,
      thisMonthCommissions: 0,
    },
    recentCommissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches dashboard data from backend with fallback for analytics API issues
   * FIXED: Added fallback mechanism when analytics endpoint fails
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch commission analytics first
      let analyticsData = {};
      try {
        const analyticsResponse = await commissionAPI.getCommissionAnalytics({
          period: 'current_month',
          includeOverview: true,
        });
        analyticsData = analyticsResponse.data?.data || {};
      } catch (analyticsError) {
        console.warn('Analytics endpoint failed, using fallback:', analyticsError);
        // Continue with empty analytics data - will be handled by fallback metrics
      }

      // Fetch recent commissions
      const commissionsResponse = await commissionAPI.getCommissions({
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const commissions = commissionsResponse.data?.data || [];

      // Calculate fallback metrics from commission list if analytics failed
      const fallbackMetrics = {
        totalCommissions: commissions.length,
        totalCommissionAmount: commissions.reduce((sum, c) => sum + (c.commissionCalculation?.netCommission || 0), 0),
        pendingCommissions: commissions.filter(c => c.status === 'pending').length,
        overdueCommissions: commissions.filter(c => c.status === 'overdue').length,
        thisMonthCommissions: commissions.filter(c => {
          const commissionDate = new Date(c.createdAt);
          const now = new Date();
          return commissionDate.getMonth() === now.getMonth() && 
                 commissionDate.getFullYear() === now.getFullYear();
        }).length,
      };

      setDashboardData({
        metrics: analyticsData.overview ? {
          totalCommissions: analyticsData.overview.totalCommissions || fallbackMetrics.totalCommissions,
          totalCommissionAmount: analyticsData.overview.totalCommissionAmount || fallbackMetrics.totalCommissionAmount,
          pendingCommissions: analyticsData.overview.pendingCommissions || fallbackMetrics.pendingCommissions,
          overdueCommissions: analyticsData.overview.overdueCommissions || fallbackMetrics.overdueCommissions,
          thisMonthCommissions: analyticsData.currentPeriod?.commissionCount || fallbackMetrics.thisMonthCommissions,
        } : fallbackMetrics,
        recentCommissions: commissions,
      });
    } catch (err) {
      console.error('Error fetching commission dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load commission dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show loading state
  if (loading && !dashboardData.recentCommissions.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Commission Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of commission performance and recent activity
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          {canAccess.projectManagement() && (
            <Button
              variant="contained"
              startIcon={<Settings />}
              onClick={() => handleNavigate('/sales/commissions/structures')}
            >
              Manage Structures
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics API Warning */}
      {!error && !loading && dashboardData.metrics.totalCommissions === dashboardData.recentCommissions.length && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Analytics data is temporarily unavailable. Showing metrics based on recent commissions.
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total Commissions"
            value={dashboardData.metrics.totalCommissions.toLocaleString()}
            icon={Assignment}
            color="primary"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Total Amount"
            value={formatCurrency(dashboardData.metrics.totalCommissionAmount)}
            icon={MonetizationOn}
            color="success"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Pending Approval"
            value={dashboardData.metrics.pendingCommissions.toLocaleString()}
            icon={Schedule}
            color="warning"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Overdue"
            value={dashboardData.metrics.overdueCommissions.toLocaleString()}
            icon={Warning}
            color="error"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="This Month"
            value={dashboardData.metrics.thisMonthCommissions.toLocaleString()}
            icon={TrendingUp}
            color="info"
            isLoading={loading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
        </Grid>
        {QUICK_ACTIONS.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.id}>
            <QuickActionCard
              action={action}
              onNavigate={handleNavigate}
              canAccess={canAccess}
            />
          </Grid>
        ))}
      </Grid>

      {/* Recent Commissions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Recent Commissions"
              subheader="Latest commission activity"
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleNavigate('/sales/commissions/list')}
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <RecentCommissionsTable
                commissions={dashboardData.recentCommissions}
                onNavigate={handleNavigate}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommissionDashboardPage;
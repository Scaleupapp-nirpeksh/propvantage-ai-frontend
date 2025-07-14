// File: src/pages/dashboard/SalesManagerDashboard.js
// Description: Sales Manager Dashboard with REAL backend data integration (NO MOCK DATA)
// Version: 3.2 - Fixed array type checking errors and robust data extraction
// Location: src/pages/dashboard/SalesManagerDashboard.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  LinearProgress,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Timeline,
  Assignment,
  Star,
  StarBorder,
  ThumbUp,
  ThumbDown,
  Warning,
  CheckCircle,
  Refresh,
  Visibility,
  AttachMoney,
  PersonAdd,
  Assessment,
  NotificationsActive,
  ArrowUpward,
  ArrowDownward,
  AutoGraph,
  PieChart,
  BarChart,
  Leaderboard,
  EmojiEvents,
  Group,
  Campaign,
  Phone,
  Email,
} from '@mui/icons-material';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart as RechartsBarChart, Bar, Legend } from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, leadAPI, userAPI } from '../../services/api';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#0088fe'];

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

const formatPercentage = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
};

const getPerformanceIcon = (achievement) => {
  if (achievement >= 120) return <EmojiEvents sx={{ color: '#FFD700' }} />; // Gold
  if (achievement >= 100) return <Star color="success" />;
  if (achievement >= 80) return <ThumbUp color="info" />;
  if (achievement >= 60) return <StarBorder color="warning" />;
  return <ThumbDown color="error" />;
};

const getPerformanceColor = (achievement) => {
  if (achievement >= 120) return '#FFD700'; // Gold
  if (achievement >= 100) return '#4CAF50'; // Green
  if (achievement >= 80) return '#2196F3'; // Blue
  if (achievement >= 60) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// =============================================================================
// COMPONENTS
// =============================================================================

// Sales KPI Card Component
const SalesKPICard = ({ title, value, subtitle, change, icon: Icon, color = 'primary', isLoading, onClick, target, progress }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Card sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="h6" sx={{ mt: 1 }}>Loading...</Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}.main` }}>
              <Icon />
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { elevation: 4 } : {},
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {target && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Target: {target}
              </Typography>
            )}
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change >= 0 ? (
                  <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 600 }}
                >
                  {formatPercentage(Math.abs(change))}
                </Typography>
              </Box>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  color={color}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {formatPercentage(progress)} Achievement
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// Team Performance Table Component
const TeamPerformanceTable = ({ teamData, isLoading, navigate }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Team Performance" />
        <CardContent>
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Loading team member {i}...</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!teamData || teamData.length === 0) {
    return (
      <Card>
        <CardHeader title="Team Performance" />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Team Data Available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No sales data found for team members this month
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh Data
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const sortedTeamData = teamData.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
  const displayedTeam = sortedTeamData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <CardHeader 
        title="Team Performance Leaderboard"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Leaderboard />}
            onClick={() => navigate('/analytics/sales')}
          >
            View Analytics
          </Button>
        }
      />
      <CardContent sx={{ px: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Sales Executive</TableCell>
                <TableCell align="right">Sales</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Conversion</TableCell>
                <TableCell align="center">Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedTeam.map((member, index) => {
                const actualRank = page * rowsPerPage + index + 1;
                const achievement = member.target > 0 ? (member.totalRevenue / member.target) * 100 : 0;
                const conversionRate = member.totalAssignedLeads > 0 ? (member.totalSales / member.totalAssignedLeads) * 100 : 0;
                
                return (
                  <TableRow key={member._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {actualRank <= 3 && (
                          <EmojiEvents 
                            sx={{ 
                              color: actualRank === 1 ? '#FFD700' : actualRank === 2 ? '#C0C0C0' : '#CD7F32',
                              fontSize: 20
                            }} 
                          />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          #{actualRank}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getPerformanceColor(achievement), width: 32, height: 32 }}>
                          {member.salesPersonName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {member.salesPersonName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.role || 'Sales Executive'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {member.totalSales || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg: {formatCurrency((member.totalRevenue || 0) / (member.totalSales || 1))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(member.totalRevenue || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target: {formatCurrency(member.target || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatPercentage(conversionRate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.totalAssignedLeads || 0} leads
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {getPerformanceIcon(achievement)}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600,
                            color: getPerformanceColor(achievement)
                          }}
                        >
                          {formatPercentage(achievement)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={sortedTeamData.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 15]}
        />
      </CardContent>
    </Card>
  );
};

// Sales Pipeline Chart Component
const SalesPipelineChart = ({ pipelineData, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Sales Pipeline Status" />
        <CardContent>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Sales Pipeline Status"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={pipelineData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActionsCard = ({ navigate }) => (
  <Card>
    <CardHeader 
      title="Quick Actions" 
      titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
    />
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => navigate('/leads/create')}
          >
            New Lead
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Timeline />}
            onClick={() => navigate('/leads/pipeline')}
          >
            Pipeline
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/sales/reports')}
          >
            Sales Reports
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<People />}
            onClick={() => navigate('/settings/users')}
          >
            Manage Team
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Team Alerts Component
const TeamAlertsCard = ({ alerts, isLoading }) => (
  <Card>
    <CardHeader 
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Team Alerts
          </Typography>
          {alerts.length > 0 && (
            <Badge badgeContent={alerts.length} color="error">
              <NotificationsActive color="error" />
            </Badge>
          )}
        </Box>
      }
    />
    <CardContent>
      {isLoading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading alert {i}...</Typography>
            </Box>
          ))}
        </Box>
      ) : alerts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No team alerts at this time
          </Typography>
        </Box>
      ) : (
        <List>
          {alerts.slice(0, 5).map((alert, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Warning color={alert.severity || 'warning'} />
                </ListItemIcon>
                <ListItemText
                  primary={alert.title}
                  secondary={alert.description}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {alert.member && (
                  <ListItemSecondaryAction>
                    <Chip 
                      label={alert.member} 
                      size="small" 
                      color={alert.severity || 'warning'}
                    />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              {index < alerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

// Main Sales Manager Dashboard Component
const SalesManagerDashboard = () => {
  const { user, getOrganizationDisplayName } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalTeamSales: 0,
      totalTeamRevenue: 0,
      teamTarget: 0,
      averageConversion: 0,
      activeLeads: 0,
      hotLeads: 0,
    },
    teamPerformance: [],
    pipelineData: [],
    alerts: [],
  });

  const [loading, setLoading] = useState({
    kpis: true,
    team: true,
    pipeline: true,
    alerts: true,
  });

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch team performance data
  const fetchTeamPerformance = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, team: true, kpis: true }));
      
      console.log('🔄 Fetching team performance data...');
      
      // Get real sales data and aggregate by salesperson
      const [salesResponse, leadsResponse, usersResponse] = await Promise.all([
        analyticsAPI.getSalesReport({ 
          period: 'current_month',
          include: 'detailed'
        }),
        leadAPI.getLeads({ 
          limit: 1000 // Get all leads - remove assignedTo: 'all' which causes ObjectId cast error
        }).catch((error) => {
          console.warn('⚠️ Leads API failed:', error.message);
          return { data: { data: [] } };
        }), // Fallback if leads API fails
        userAPI.getUsers({ 
          role: 'Sales Executive,Sales Manager,Sales Head',
          isActive: true 
        }).catch((error) => {
          console.warn('⚠️ Users API failed:', error.message);
          return { data: { data: [] } };
        }) // Get user data for roles and targets
      ]);
      
      console.log('🔄 Raw Sales Response:', salesResponse.data);
      console.log('🔄 Raw Leads Response Structure:', {
        hasData: !!leadsResponse.data,
        dataKeys: leadsResponse.data ? Object.keys(leadsResponse.data) : [],
        isArray: Array.isArray(leadsResponse.data),
        dataDataIsArray: leadsResponse.data?.data ? Array.isArray(leadsResponse.data.data) : false,
        leadsIsArray: leadsResponse.data?.leads ? Array.isArray(leadsResponse.data.leads) : false
      });
      console.log('🔄 Raw Users Response Structure:', {
        hasData: !!usersResponse.data,
        dataKeys: usersResponse.data ? Object.keys(usersResponse.data) : [],
        isArray: Array.isArray(usersResponse.data),
        dataDataIsArray: usersResponse.data?.data ? Array.isArray(usersResponse.data.data) : false,
        usersIsArray: usersResponse.data?.users ? Array.isArray(usersResponse.data.users) : false
      });
      
      const salesData = salesResponse.data?.sales || [];
      
      // Fix leads data extraction - handle different response structures
      let leadsData = [];
      if (leadsResponse.data) {
        if (Array.isArray(leadsResponse.data)) {
          leadsData = leadsResponse.data;
        } else if (leadsResponse.data.data && Array.isArray(leadsResponse.data.data)) {
          leadsData = leadsResponse.data.data;
        } else if (leadsResponse.data.leads && Array.isArray(leadsResponse.data.leads)) {
          leadsData = leadsResponse.data.leads;
        }
      }
      
      // Fix users data extraction - handle different response structures
      let usersData = [];
      if (usersResponse.data) {
        if (Array.isArray(usersResponse.data)) {
          usersData = usersResponse.data;
        } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
          usersData = usersResponse.data.data;
        } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
          usersData = usersResponse.data.users;
        }
      }
      
      console.log('📊 Extracted Arrays:', {
        salesCount: salesData.length,
        leadsCount: leadsData.length,
        usersCount: usersData.length,
        salesDataType: Array.isArray(salesData) ? 'array' : typeof salesData,
        leadsDataType: Array.isArray(leadsData) ? 'array' : typeof leadsData,
        usersDataType: Array.isArray(usersData) ? 'array' : typeof usersData
      });
      
      // Create user lookup for roles and targets - only if usersData is an array
      const userLookup = Array.isArray(usersData) ? usersData.reduce((acc, user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        acc[fullName] = {
          role: user.role || 'Sales Executive',
          target: user.monthlyTarget || user.salesTarget || 0, // Use real target if available
          email: user.email
        };
        return acc;
      }, {}) : {};
      
      // Aggregate sales data by salesperson
      const salesByPerson = salesData.reduce((acc, sale) => {
        const salesPerson = sale.salesPersonName || 'Unknown';
        if (!acc[salesPerson]) {
          acc[salesPerson] = {
            salesPersonName: salesPerson,
            totalSales: 0,
            totalRevenue: 0,
            sales: []
          };
        }
        acc[salesPerson].totalSales += 1;
        acc[salesPerson].totalRevenue += Number(sale.salePrice || 0);
        acc[salesPerson].sales.push(sale);
        return acc;
      }, {});
      
      // Aggregate leads data by assigned user for conversion calculation - only if leadsData is an array
      const leadsByPerson = Array.isArray(leadsData) ? leadsData.reduce((acc, lead) => {
        // Handle various ways the assigned user name might be stored
        let assignedName = 'Unknown';
        
        if (lead.assignedToName) {
          assignedName = lead.assignedToName;
        } else if (lead.assignedUser && lead.assignedUser.firstName) {
          assignedName = `${lead.assignedUser.firstName} ${lead.assignedUser.lastName || ''}`.trim();
        } else if (lead.assignedTo && typeof lead.assignedTo === 'object' && lead.assignedTo.firstName) {
          assignedName = `${lead.assignedTo.firstName} ${lead.assignedTo.lastName || ''}`.trim();
        }
        
        if (!acc[assignedName]) {
          acc[assignedName] = {
            totalAssignedLeads: 0,
            convertedLeads: 0
          };
        }
        acc[assignedName].totalAssignedLeads += 1;
        
        // Count converted leads (Booked status)
        if (lead.status === 'Booked' || lead.status === 'Converted') {
          acc[assignedName].convertedLeads += 1;
        }
        return acc;
      }, {}) : {};
      
      console.log('📊 Aggregated Sales by Person:', salesByPerson);
      console.log('📊 Aggregated Leads by Person:', leadsByPerson);
      
      // Create team performance array
      const teamData = Object.values(salesByPerson).map(member => {
        const leadData = leadsByPerson[member.salesPersonName] || { totalAssignedLeads: 0, convertedLeads: 0 };
        const userData = userLookup[member.salesPersonName] || {};
        const conversionRate = leadData.totalAssignedLeads > 0 ? (leadData.convertedLeads / leadData.totalAssignedLeads) * 100 : 0;
        
        // Calculate a reasonable default target if none exists (based on average deal size)
        const avgDealSize = member.totalSales > 0 ? member.totalRevenue / member.totalSales : 30000000; // 3 crore default
        const defaultTarget = avgDealSize * 3; // Target of 3 sales per month as default
        
        return {
          _id: member.salesPersonName.replace(/\s+/g, ''), // Create an ID from name
          salesPersonName: member.salesPersonName,
          role: userData.role || 'Sales Executive',
          totalSales: member.totalSales,
          totalRevenue: member.totalRevenue,
          averageSalePrice: member.totalSales > 0 ? member.totalRevenue / member.totalSales : 0,
          totalAssignedLeads: leadData.totalAssignedLeads,
          conversionRate: conversionRate,
          target: userData.target || defaultTarget, // Use real target or calculated default
          email: userData.email || null,
        };
      });
      
      console.log('✅ Final Team Performance Data:', teamData);
      
      // Calculate team KPIs
      const totalTeamSales = teamData.reduce((sum, member) => sum + (member.totalSales || 0), 0);
      const totalTeamRevenue = teamData.reduce((sum, member) => sum + (member.totalRevenue || 0), 0);
      const teamTarget = teamData.reduce((sum, member) => sum + (member.target || 0), 0);
      const totalLeads = teamData.reduce((sum, member) => sum + (member.totalAssignedLeads || 0), 0);
      const averageConversion = totalLeads > 0 ? (totalTeamSales / totalLeads) * 100 : 0;

      // Set fallback team data if no sales found
      if (teamData.length === 0) {
        console.log('⚠️ No sales data found, using fallback data');
        setDashboardData(prev => ({
          ...prev,
          kpis: {
            ...prev.kpis,
            totalTeamSales: 0,
            totalTeamRevenue: 0,
            teamTarget: 0,
            averageConversion: 0,
          },
          teamPerformance: []
        }));
      } else {
        setDashboardData(prev => ({
          ...prev,
          kpis: {
            ...prev.kpis,
            totalTeamSales,
            totalTeamRevenue,
            teamTarget,
            averageConversion,
          },
          teamPerformance: teamData
        }));
      }

    } catch (error) {
      console.error('❌ Error fetching team performance:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      setError('Failed to load team performance data');
    } finally {
      setLoading(prev => ({ ...prev, team: false, kpis: false }));
    }
  }, []);

  // Fetch lead pipeline data
  const fetchPipelineData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, pipeline: true }));
      
      console.log('🔄 Fetching pipeline data...');
      
      const response = await analyticsAPI.getLeadConversion({ 
        focus: 'conversion'
        // Removed groupBy: 'status' as it might not be supported
      });
      
      console.log('🔄 Lead Pipeline Response:', response.data);
      
      // Handle the actual response format: { "Booked": 23, "Contacted": 60, ... }
      const statusData = response.data || {};
      
      // Check if response is in expected format
      if (typeof statusData !== 'object' || Array.isArray(statusData)) {
        console.warn('⚠️ Unexpected pipeline data format:', statusData);
        throw new Error('Invalid pipeline data format');
      }
      
      // Transform to pipeline chart format
      const pipelineData = Object.entries(statusData).map(([status, count]) => ({
        name: status,
        value: Number(count) || 0,
        percentage: 0 // Will calculate after we have total
      }));
      
      // Calculate total and percentages
      const totalLeads = pipelineData.reduce((sum, item) => sum + item.value, 0);
      const pipelineDataWithPercentages = pipelineData.map(item => ({
        ...item,
        percentage: totalLeads > 0 ? ((item.value / totalLeads) * 100).toFixed(1) : '0'
      }));

      // Calculate active and hot leads
      const activeLeads = totalLeads;
      const hotLeads = statusData['Negotiating'] || 0; // Consider negotiating leads as "hot"

      console.log('✅ Processed Pipeline Data:', pipelineDataWithPercentages);

      setDashboardData(prev => ({
        ...prev,
        kpis: {
          ...prev.kpis,
          activeLeads,
          hotLeads,
        },
        pipelineData: pipelineDataWithPercentages
      }));

    } catch (error) {
      console.error('❌ Error fetching pipeline data:', error);
      console.error('Pipeline error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      // Set fallback data if API fails
      setDashboardData(prev => ({
        ...prev,
        kpis: {
          ...prev.kpis,
          activeLeads: 0,
          hotLeads: 0,
        },
        pipelineData: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, pipeline: false }));
    }
  }, []);

  // Fetch team alerts from real backend data
  const fetchTeamAlerts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, alerts: true }));
      
      console.log('🔄 Fetching team alerts data...');
      
      // Get real alerts based on actual team performance data
      const [salesResponse, leadsResponse] = await Promise.all([
        analyticsAPI.getSalesReport({ 
          period: 'current_month',
          include: 'detailed'
        }),
        leadAPI.getLeads({ 
          limit: 1000 // Get all leads - remove assignedTo: 'all' which causes ObjectId cast error
        }).catch((error) => {
          console.warn('⚠️ Leads API failed in alerts:', error.message);
          return { data: { data: [] } };
        })
      ]);
      
      const salesData = salesResponse.data?.sales || [];
      
      // Fix leads data extraction - handle different response structures
      let leadsData = [];
      if (leadsResponse.data) {
        if (Array.isArray(leadsResponse.data)) {
          leadsData = leadsResponse.data;
        } else if (leadsResponse.data.data && Array.isArray(leadsResponse.data.data)) {
          leadsData = leadsResponse.data.data;
        } else if (leadsResponse.data.leads && Array.isArray(leadsResponse.data.leads)) {
          leadsData = leadsResponse.data.leads;
        }
      }
      
      console.log('📊 Alerts - Extracted Arrays:', {
        salesCount: salesData.length,
        leadsCount: leadsData.length,
        leadsDataType: Array.isArray(leadsData) ? 'array' : typeof leadsData
      });
      
      // Generate real alerts based on actual data
      const realAlerts = [];
      
      // Aggregate performance data by salesperson - only if salesData is an array
      const performanceByPerson = Array.isArray(salesData) ? salesData.reduce((acc, sale) => {
        const salesPerson = sale.salesPersonName || 'Unknown';
        if (!acc[salesPerson]) {
          acc[salesPerson] = {
            name: salesPerson,
            sales: 0,
            revenue: 0,
            lastSaleDate: null
          };
        }
        acc[salesPerson].sales += 1;
        acc[salesPerson].revenue += Number(sale.salePrice || 0);
        
        const saleDate = new Date(sale.bookingDate);
        if (!acc[salesPerson].lastSaleDate || saleDate > acc[salesPerson].lastSaleDate) {
          acc[salesPerson].lastSaleDate = saleDate;
        }
        return acc;
      }, {}) : {};
      
      // Calculate conversion rates and overdue follow-ups - only if leadsData is an array
      const leadsByPerson = Array.isArray(leadsData) ? leadsData.reduce((acc, lead) => {
        // Handle various ways the assigned user name might be stored
        let assignedName = 'Unknown';
        
        if (lead.assignedToName) {
          assignedName = lead.assignedToName;
        } else if (lead.assignedUser && lead.assignedUser.firstName) {
          assignedName = `${lead.assignedUser.firstName} ${lead.assignedUser.lastName || ''}`.trim();
        } else if (lead.assignedTo && typeof lead.assignedTo === 'object' && lead.assignedTo.firstName) {
          assignedName = `${lead.assignedTo.firstName} ${lead.assignedTo.lastName || ''}`.trim();
        }
        
        if (!acc[assignedName]) {
          acc[assignedName] = {
            totalLeads: 0,
            overdueLeads: 0,
            hotLeads: 0
          };
        }
        acc[assignedName].totalLeads += 1;
        
        // Check for overdue follow-ups (leads not contacted in 7+ days)
        const lastContact = lead.lastContactDate ? new Date(lead.lastContactDate) : new Date(lead.createdAt);
        const daysSinceContact = Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24));
        
        if (daysSinceContact > 7 && lead.status !== 'Booked' && lead.status !== 'Lost') {
          acc[assignedName].overdueLeads += 1;
        }
        
        if (lead.status === 'Negotiating' || lead.score > 80) {
          acc[assignedName].hotLeads += 1;
        }
        
        return acc;
      }, {}) : {};
      
      // Generate alerts based on real performance data
      Object.entries(performanceByPerson).forEach(([name, data]) => {
        const leadData = leadsByPerson[name] || { totalLeads: 0, overdueLeads: 0, hotLeads: 0 };
        const conversionRate = leadData.totalLeads > 0 ? (data.sales / leadData.totalLeads) * 100 : 0;
        
        // Low conversion rate alert
        if (conversionRate > 0 && conversionRate < 20 && leadData.totalLeads >= 5) {
          realAlerts.push({
            title: `${name} - Low Conversion Rate`,
            description: `Conversion rate is ${conversionRate.toFixed(1)}% this month`,
            severity: 'warning',
            member: name.split(' ')[0] + ' ' + (name.split(' ')[1] || '').charAt(0) + '.'
          });
        }
        
        // High performance alert
        if (data.sales >= 5) {
          realAlerts.push({
            title: `${name} - Excellent Performance`,
            description: `Achieved ${data.sales} sales this month`,
            severity: 'success',
            member: name.split(' ')[0] + ' ' + (name.split(' ')[1] || '').charAt(0) + '.'
          });
        }
        
        // Overdue follow-ups alert
        if (leadData.overdueLeads > 0) {
          realAlerts.push({
            title: `${name} - Overdue Follow-ups`,
            description: `${leadData.overdueLeads} leads need immediate attention`,
            severity: 'error',
            member: name.split(' ')[0] + ' ' + (name.split(' ')[1] || '').charAt(0) + '.'
          });
        }
        
        // No recent sales alert
        const daysSinceLastSale = data.lastSaleDate ? 
          Math.floor((new Date() - data.lastSaleDate) / (1000 * 60 * 60 * 24)) : 999;
        
        if (daysSinceLastSale > 14 && leadData.totalLeads > 0) {
          realAlerts.push({
            title: `${name} - No Recent Sales`,
            description: `No sales in the last ${daysSinceLastSale} days`,
            severity: 'warning',
            member: name.split(' ')[0] + ' ' + (name.split(' ')[1] || '').charAt(0) + '.'
          });
        }
      });
      
      // If no real alerts, create a positive message
      if (realAlerts.length === 0) {
        realAlerts.push({
          title: 'Team Performance - All Good',
          description: 'No performance issues detected this month',
          severity: 'success',
          member: 'Team'
        });
      }
      
      console.log('✅ Generated Real Alerts:', realAlerts);

      setDashboardData(prev => ({
        ...prev,
        alerts: realAlerts.slice(0, 5) // Limit to top 5 alerts
      }));

    } catch (error) {
      console.error('❌ Error fetching team alerts:', error);
      console.error('Alert error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      // Fallback to no alerts rather than fake data
      setDashboardData(prev => ({
        ...prev,
        alerts: []
      }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      console.log('🔄 Starting Sales Manager Dashboard data fetch...');
      
      await Promise.all([
        fetchTeamPerformance(),
        fetchPipelineData(),
        fetchTeamAlerts()
      ]);
      
      console.log('✅ Sales Manager Dashboard data fetch completed');

    } catch (error) {
      console.error('❌ Error fetching Sales Manager dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [fetchTeamPerformance, fetchPipelineData, fetchTeamAlerts]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const { kpis, teamPerformance } = dashboardData;
    
    return {
      targetAchievement: kpis.teamTarget > 0 ? (kpis.totalTeamRevenue / kpis.teamTarget) * 100 : 0,
      topPerformer: teamPerformance.length > 0 ? teamPerformance[0]?.salesPersonName : 'N/A',
      teamSize: teamPerformance.length,
      averageDealSize: kpis.totalTeamSales > 0 ? kpis.totalTeamRevenue / kpis.totalTeamSales : 0,
    };
  }, [dashboardData]);

  return (
    <Box>
      {/* Header */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Sales Manager Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {user?.firstName}! Here's your team performance overview for {getOrganizationDisplayName()}.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Dashboard">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
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
              <Button 
                variant="outlined" 
                startIcon={<Assessment />}
                onClick={() => navigate('/analytics/sales')}
              >
                View Analytics
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Error Alert */}
      {error && (
        <Fade in>
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Team KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SalesKPICard
            title="Team Revenue (This Month)"
            value={formatCurrency(dashboardData.kpis.totalTeamRevenue)}
            subtitle={`Target: ${formatCurrency(dashboardData.kpis.teamTarget)}`}
            target={formatCurrency(dashboardData.kpis.teamTarget)}
            progress={derivedMetrics.targetAchievement}
            change={derivedMetrics.targetAchievement - 100}
            icon={AttachMoney}
            color="success"
            isLoading={loading.kpis}
            onClick={() => navigate('/analytics/revenue')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SalesKPICard
            title="Team Sales"
            value={dashboardData.kpis.totalTeamSales}
            subtitle={`Avg deal: ${formatCurrency(derivedMetrics.averageDealSize)}`}
            icon={TrendingUp}
            color="primary"
            isLoading={loading.kpis}
            onClick={() => navigate('/sales')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SalesKPICard
            title="Team Conversion Rate"
            value={formatPercentage(dashboardData.kpis.averageConversion)}
            subtitle={`${dashboardData.kpis.activeLeads} active leads`}
            icon={Timeline}
            color="info"
            isLoading={loading.kpis}
            onClick={() => navigate('/leads/pipeline')}
          />
        </Grid>
      </Grid>

      {/* Secondary KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {derivedMetrics.teamSize}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Team Members
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {dashboardData.kpis.hotLeads}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hot Leads
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {formatPercentage(derivedMetrics.targetAchievement)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target Achievement
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {derivedMetrics.topPerformer}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Top Performer
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Team Performance Table */}
        <Grid item xs={12} lg={8}>
          <TeamPerformanceTable 
            teamData={dashboardData.teamPerformance}
            isLoading={loading.team}
            navigate={navigate}
          />
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Sales Pipeline Chart */}
            <SalesPipelineChart 
              pipelineData={dashboardData.pipelineData}
              isLoading={loading.pipeline}
            />
            
            {/* Quick Actions */}
            <QuickActionsCard navigate={navigate} />
            
            {/* Team Alerts */}
            <TeamAlertsCard 
              alerts={dashboardData.alerts}
              isLoading={loading.alerts}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesManagerDashboard;
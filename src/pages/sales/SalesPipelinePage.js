/**
 * File: src/pages/sales/SalesPipelinePage.js
 * Description: Enhanced sales pipeline management with improved UX
 * Version: 2.0 - UX Enhancement Update
 * Location: src/pages/sales/SalesPipelinePage.js
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Skeleton,
  AppBar,
  Toolbar,
  Fade,
  Slide,
  Menu,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Clear,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Assessment,
  Assignment,
  ExpandMore,
  Visibility,
  Edit,
  Add,
  Person,
  Business,
  Schedule,
  CheckCircle,
  Warning,
  Cancel,
  PlayArrow,
  Pause,
  Stop,
  MonetizationOn,
  Timeline as TimelineIcon,
  PieChart,
  BarChart,
  ShowChart,
  CalendarToday,
  LocationOn,
  Phone,
  Email,
  ViewModule,
  ViewList,
  Sort,
  MoreVert,
  DragIndicator,
  ArrowForward,
  TuneRounded,
  SearchRounded,
  Analytics,
  Dashboard,
  Home,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, userAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const PIPELINE_STAGES = [
  {
    key: 'Booked',
    label: 'Booked',
    description: 'Initial booking completed',
    color: 'info',
    icon: PlayArrow,
    order: 1,
  },
  {
    key: 'Agreement Signed',
    label: 'Agreement Signed',
    description: 'Sale agreement executed',
    color: 'primary',
    icon: Assignment,
    order: 2,
  },
  {
    key: 'Registered',
    label: 'Registered',
    description: 'Property registration complete',
    color: 'warning',
    icon: CheckCircle,
    order: 3,
  },
  {
    key: 'Completed',
    label: 'Completed',
    description: 'Sale fully completed',
    color: 'success',
    icon: CheckCircle,
    order: 4,
  },
  {
    key: 'Cancelled',
    label: 'Cancelled',
    description: 'Sale cancelled or terminated',
    color: 'error',
    icon: Cancel,
    order: 5,
  },
];

const TIME_PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const VIEW_MODES = {
  KANBAN: 'kanban',
  LIST: 'list',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const safeString = (value, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'object' && value.name) return value.name;
  return String(value);
};

const getCustomerName = (sale) => {
  if (!sale?.lead) return 'Unknown Customer';
  const { firstName, lastName, email, phone } = sale.lead;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) return email;
  if (phone) return phone;
  return 'Unknown Customer';
};

const getProjectName = (sale) => {
  if (!sale?.project) return 'Unknown Project';
  return sale.project.name || sale.project.title || 'Unknown Project';
};

const getUnitDisplayName = (sale) => {
  if (!sale?.unit) return 'Unknown Unit';
  return sale.unit.unitNumber || sale.unit.fullAddress || 'Unknown Unit';
};

// ============================================================================
// COMPACT SALE CARD COMPONENT
// ============================================================================

const CompactSaleCard = ({ sale, onSaleClick, isDragging = false, viewDensity = 'comfortable' }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    onSaleClick(sale);
  };

  // Dynamic sizing based on view density
  const getPaddingConfig = () => {
    switch (viewDensity) {
      case 'compact':
        return { main: 1, gap: 0.5 };
      case 'spacious':
        return { main: 2, gap: 1.5 };
      default: // comfortable
        return { main: 1.5, gap: 1 };
    }
  };

  const paddingConfig = getPaddingConfig();

  return (
    <>
      <Paper
        sx={{
          mb: viewDensity === 'compact' ? 0.5 : 1,
          p: paddingConfig.main,
          cursor: 'pointer',
          transition: 'all 0.15s ease-in-out',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          opacity: isDragging ? 0.5 : 1,
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-1px)',
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: 1,
          },
        }}
        onClick={handleCardClick}
      >
        {/* Compact Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: paddingConfig.gap }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: paddingConfig.gap, flex: 1, minWidth: 0 }}>
            <Avatar 
              sx={{ 
                width: viewDensity === 'compact' ? 20 : 24, 
                height: viewDensity === 'compact' ? 20 : 24, 
                fontSize: viewDensity === 'compact' ? '0.65rem' : '0.75rem',
                bgcolor: 'primary.main'
              }}
            >
              {getCustomerName(sale)[0] || 'C'}
            </Avatar>
            <Typography 
              variant={viewDensity === 'compact' ? 'caption' : 'body2'} 
              fontWeight="600" 
              noWrap
              sx={{ color: 'text.primary', flex: 1 }}
            >
              {getCustomerName(sale)}
            </Typography>
          </Box>
          
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            sx={{ 
              width: viewDensity === 'compact' ? 20 : 24, 
              height: viewDensity === 'compact' ? 20 : 24 
            }}
          >
            <MoreVert sx={{ fontSize: viewDensity === 'compact' ? 14 : 16 }} />
          </IconButton>
        </Box>

        {/* Compact Details */}
        <Box sx={{ mb: paddingConfig.gap }}>
          <Typography 
            variant={viewDensity === 'compact' ? 'caption' : 'caption'} 
            color="text.secondary" 
            noWrap 
            sx={{ display: 'block', fontSize: viewDensity === 'compact' ? '0.65rem' : '0.75rem' }}
          >
            {getProjectName(sale)} • {getUnitDisplayName(sale)}
          </Typography>
          
          {viewDensity !== 'compact' && sale.bookingDate && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}
            >
              {formatDate(sale.bookingDate)}
            </Typography>
          )}
        </Box>

        {/* Price and Quick Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant={viewDensity === 'compact' ? 'caption' : 'body2'}
            fontWeight="bold"
            color="primary.main"
            sx={{ fontSize: viewDensity === 'compact' ? '0.7rem' : '0.875rem' }}
          >
            {formatCurrency(sale.salePrice || 0)}
          </Typography>
          
          {viewDensity !== 'compact' && (
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <Tooltip title="View Details">
                <IconButton size="small" sx={{ width: 24, height: 24 }}>
                  <Visibility sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => { onSaleClick(sale); handleMenuClose(); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Sale
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ArrowForward fontSize="small" sx={{ mr: 1 }} />
          Move Stage
        </MenuItem>
      </Menu>
    </>
  );
};

// ============================================================================
// COMPACT PIPELINE STAGE COMPONENT
// ============================================================================

const CompactPipelineStage = ({ stage, stageData, onSaleClick, isLoading, viewDensity = 'comfortable' }) => {
  const theme = useTheme();
  const count = stageData?.count || 0;
  const totalValue = stageData?.totalValue || 0;
  const sales = stageData?.sales || [];
  const StageIcon = stage.icon;

  // Dynamic sizing based on view density
  const getHeightConfig = () => {
    switch (viewDensity) {
      case 'compact':
        return { minHeight: 280, maxHeight: 450 };
      case 'spacious':
        return { minHeight: 400, maxHeight: 700 };
      default: // comfortable
        return { minHeight: 320, maxHeight: 600 };
    }
  };

  const getPaddingConfig = () => {
    switch (viewDensity) {
      case 'compact':
        return { header: 1, content: 0.75 };
      case 'spacious':
        return { header: 2, content: 1.5 };
      default: // comfortable
        return { header: 1.5, content: 1 };
    }
  };

  const heightConfig = getHeightConfig();
  const paddingConfig = getPaddingConfig();

  if (isLoading) {
    return (
      <Paper 
        sx={{ 
          height: '100%', 
          ...heightConfig,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ p: paddingConfig.header }}>
          <Skeleton variant="rectangular" height={viewDensity === 'compact' ? 40 : 50} sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={viewDensity === 'compact' ? 60 : 70} />
            ))}
          </Stack>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        height: '100%',
        ...heightConfig,
        bgcolor: 'background.paper',
        border: 2,
        borderColor: `${stage.color}.200`,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: `${stage.color}.400`,
          boxShadow: 3,
        },
      }}
    >
      {/* Compact Stage Header */}
      <Box
        sx={{
          p: paddingConfig.header,
          bgcolor: `${stage.color}.50`,
          borderBottom: 1,
          borderColor: `${stage.color}.200`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: viewDensity === 'compact' ? 0.5 : 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${stage.color}.main`, 
              width: viewDensity === 'compact' ? 24 : 28, 
              height: viewDensity === 'compact' ? 24 : 28,
              color: 'white'
            }}
          >
            <StageIcon sx={{ fontSize: viewDensity === 'compact' ? 14 : 16 }} />
          </Avatar>
          <Typography 
            variant={viewDensity === 'compact' ? 'body1' : 'subtitle1'} 
            fontWeight="bold" 
            sx={{ flex: 1 }}
          >
            {stage.label}
          </Typography>
          <Badge 
            badgeContent={count} 
            color={stage.color} 
            sx={{
              '& .MuiBadge-badge': {
                fontWeight: 'bold',
                fontSize: viewDensity === 'compact' ? '0.65rem' : '0.7rem',
                minWidth: viewDensity === 'compact' ? 16 : 18,
                height: viewDensity === 'compact' ? 16 : 18,
              }
            }}
          />
        </Box>
        
        {viewDensity !== 'compact' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {stage.description}
          </Typography>
        )}
        
        <Typography 
          variant={viewDensity === 'compact' ? 'body2' : 'subtitle1'} 
          color={`${stage.color}.dark`} 
          fontWeight="bold"
        >
          {formatCurrency(totalValue)}
        </Typography>
      </Box>

      {/* Compact Stage Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {sales.length === 0 ? (
          <Box 
            sx={{ 
              p: paddingConfig.content * 2, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: viewDensity === 'compact' ? 0.5 : 1,
              flex: 1,
            }}
          >
            <StageIcon 
              sx={{ 
                fontSize: viewDensity === 'compact' ? 24 : 32, 
                color: `${stage.color}.300`,
                opacity: 0.5,
              }} 
            />
            <Typography variant={viewDensity === 'compact' ? 'caption' : 'body2'} color="text.secondary">
              No sales yet
            </Typography>
            {viewDensity !== 'compact' && (
              <Button
                size="small"
                variant="outlined"
                color={stage.color}
                startIcon={<Add />}
                sx={{ mt: 1 }}
              >
                Add Sale
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ 
            p: paddingConfig.content, 
            overflow: 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              width: 4,
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: `${stage.color}.200`,
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: `${stage.color}.400`,
            },
          }}>
            <Stack spacing={0}>
              {sales.map((sale) => (
                <CompactSaleCard
                  key={sale._id}
                  sale={sale}
                  onSaleClick={onSaleClick}
                  viewDensity={viewDensity}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// ============================================================================
// ENHANCED ANALYTICS COMPONENT
// ============================================================================

const EnhancedAnalytics = ({ analytics, loading }) => {
  const totalSales = analytics.reduce((sum, stage) => sum + (stage.count || 0), 0);
  const totalValue = analytics.reduce((sum, stage) => sum + (stage.totalValue || 0), 0);
  const averageValue = totalSales > 0 ? totalValue / totalSales : 0;
  const completedSales = analytics.find(a => a.status === 'Completed')?.count || 0;
  const completionRate = totalSales > 0 ? (completedSales / totalSales * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card>
              <CardContent>
                <Skeleton height={80} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const metrics = [
    {
      title: 'Total Sales',
      value: totalSales.toString(),
      subtitle: 'All pipeline stages',
      icon: Assessment,
      color: 'primary',
      trend: null,
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      subtitle: 'Pipeline value',
      icon: MonetizationOn,
      color: 'success',
      trend: null,
    },
    {
      title: 'Average Value',
      value: formatCurrency(averageValue),
      subtitle: 'Per sale average',
      icon: TrendingUp,
      color: 'info',
      trend: null,
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtitle: 'Sales completed',
      icon: CheckCircle,
      color: 'warning',
      trend: null,
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" color={`${metric.color}.main`}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {metric.subtitle}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${metric.color}.main`, 
                      width: 56, 
                      height: 56,
                      ml: 2,
                    }}
                  >
                    <IconComponent />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// ============================================================================
// ENHANCED FILTERS COMPONENT
// ============================================================================

const EnhancedFilters = ({ 
  filters, 
  projects, 
  users, 
  onFilterChange, 
  onClearFilters,
  showFilters,
  onToggleFilters 
}) => {
  const activeFiltersCount = Object.values(filters).filter(
    (value, index) => {
      if (index < 2) return value !== 'all'; // project, salesperson
      if (index === 2) return value !== '30'; // timePeriod default
      return value !== null; // dates
    }
  ).length;

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Filter Header */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'background.default',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneRounded color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Pipeline Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} active`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeFiltersCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
            >
              Clear All
            </Button>
          )}
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            size="small"
            startIcon={<FilterList />}
            onClick={onToggleFilters}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </Box>
      </Box>

      {/* Filter Content */}
      <Slide direction="down" in={showFilters} mountOnEnter unmountOnExit>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filters.timePeriod}
                  label="Time Period"
                  onChange={onFilterChange('timePeriod')}
                >
                  {TIME_PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project}
                  label="Project"
                  onChange={onFilterChange('project')}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Salesperson</InputLabel>
                <Select
                  value={filters.salesperson}
                  label="Salesperson"
                  onChange={onFilterChange('salesperson')}
                >
                  <MenuItem value="all">All Salespeople</MenuItem>
                  {users.filter(u => u.role?.includes('Sales')).map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="From Date"
                value={filters.dateFrom}
                onChange={onFilterChange('dateFrom')}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>
      </Slide>
    </Paper>
  );
};

// ============================================================================
// MAIN ENHANCED SALES PIPELINE PAGE
// ============================================================================

const SalesPipelinePage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [pipelineData, setPipelineData] = useState([]);
  const [salesData, setSalesData] = useState({});
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.KANBAN);
  const [viewDensity, setViewDensity] = useState('comfortable'); // compact, comfortable, spacious
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || 'all',
    salesperson: searchParams.get('salesperson') || 'all',
    timePeriod: searchParams.get('timePeriod') || '30',
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')) : null,
    dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')) : null,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Check permissions
  const canViewPipeline = canAccess && canAccess.salesPipeline ? canAccess.salesPipeline() : true;

  // Fetch pipeline data (keeping original logic)
  const fetchPipelineData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      console.log('🔄 Fetching pipeline data with filters:', filters);

      const queryParams = {
        project: filters.project !== 'all' ? filters.project : undefined,
        salesperson: filters.salesperson !== 'all' ? filters.salesperson : undefined,
        period: filters.timePeriod !== 'all' ? filters.timePeriod : undefined,
        dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : undefined,
        dateTo: filters.dateTo ? filters.dateTo.toISOString() : undefined,
      };

      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      const [pipelineResult, salesResult, projectsResult, usersResult] = await Promise.allSettled([
        salesAPI.getSalesPipeline(queryParams),
        salesAPI.getSales({ 
          ...queryParams, 
          limit: 1000,
          sortBy: 'bookingDate',
          sortOrder: 'desc'
        }),
        projectAPI.getProjects(),
        canAccess && canAccess.userManagement() ? userAPI.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);

      if (pipelineResult.status === 'fulfilled') {
        const response = pipelineResult.value.data;
        const pipeline = response.data || [];
        console.log('✅ Pipeline data loaded:', pipeline);
        setPipelineData(pipeline);
      } else {
        console.error('❌ Pipeline API failed:', pipelineResult.reason);
        setPipelineData([]);
      }

      if (salesResult.status === 'fulfilled') {
        const response = salesResult.value.data;
        const sales = response.data || [];
        console.log('✅ Sales data loaded:', sales.length, 'sales');
        
        const groupedSales = sales.reduce((acc, sale) => {
          const status = sale.status || 'Booked';
          if (!acc[status]) acc[status] = [];
          acc[status].push(sale);
          return acc;
        }, {});
        
        setSalesData(groupedSales);
      } else {
        console.error('❌ Sales API failed:', salesResult.reason);
        setSalesData({});
      }

      if (projectsResult.status === 'fulfilled') {
        const response = projectsResult.value.data;
        const projectsData = response.data || response || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      if (usersResult.status === 'fulfilled') {
        const response = usersResult.value.data;
        const usersData = response.data || response || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching pipeline data:', error);
      setError('Failed to load pipeline data. Please try again.');
      setLoading(false);
      setPipelineData([]);
      setSalesData({});
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [filters, canAccess]);

  // Initial data load
  useEffect(() => {
    if (canViewPipeline) {
      fetchPipelineData();
    }
  }, [fetchPipelineData, canViewPipeline]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value);
        }
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle sale click
  const handleSaleClick = (sale) => {
    navigate(`/sales/${sale._id}`);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      project: 'all',
      salesperson: 'all',
      timePeriod: '30',
      dateFrom: null,
      dateTo: null,
    });
  };

  // Refresh data
  const refreshData = () => {
    fetchPipelineData(true);
  };

  // Filter sales by search query
  const filteredSalesData = useMemo(() => {
    if (!searchQuery) return salesData;
    
    const filtered = {};
    Object.entries(salesData).forEach(([status, sales]) => {
      filtered[status] = sales.filter(sale => {
        const customerName = getCustomerName(sale).toLowerCase();
        const projectName = getProjectName(sale).toLowerCase();
        const unitName = getUnitDisplayName(sale).toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return customerName.includes(query) || 
               projectName.includes(query) || 
               unitName.includes(query);
      });
    });
    
    return filtered;
  }, [salesData, searchQuery]);

  // Combine pipeline data with sales data for display
  const enhancedPipelineData = useMemo(() => {
    return PIPELINE_STAGES.map(stage => {
      const pipelineStage = pipelineData.find(p => p.status === stage.key) || {};
      const stageSales = filteredSalesData[stage.key] || [];
      
      return {
        ...stage,
        count: pipelineStage.count || stageSales.length,
        totalValue: pipelineStage.totalValue || stageSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
        sales: stageSales,
      };
    });
  }, [pipelineData, filteredSalesData]);

  // Permission check
  if (!canViewPipeline) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view the sales pipeline.
        </Alert>
      </Box>
    );
  }

  const speedDialActions = [
    { icon: <Add />, name: 'New Sale', onClick: () => navigate('/sales/create') },
    { icon: <Analytics />, name: 'Analytics', onClick: () => navigate('/sales/analytics') },
    { icon: <Assessment />, name: 'Reports', onClick: () => navigate('/sales/reports') },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        
        {/* Enhanced Header with Breadcrumbs */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
            border: 0,
            borderRadius: 0,
          }}
        >
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link color="inherit" href="/" onClick={() => navigate('/')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Home fontSize="small" />
                Dashboard
              </Box>
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimelineIcon />
              Sales Pipeline
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Sales Pipeline
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Track sales progress through different stages and analyze performance
              </Typography>
              
              {/* Search Bar */}
              <TextField
                placeholder="Search sales, customers, projects..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  maxWidth: 400,
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* View Mode Toggle */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value={VIEW_MODES.KANBAN}>
                  <Tooltip title="Kanban View">
                    <ViewModule />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={VIEW_MODES.LIST}>
                  <Tooltip title="List View">
                    <ViewList />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* View Density Toggle */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={viewDensity}
                  onChange={(e) => setViewDensity(e.target.value)}
                  displayEmpty
                  sx={{ 
                    '& .MuiSelect-select': { 
                      py: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }
                  }}
                >
                  <MenuItem value="compact">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewModule sx={{ fontSize: 16 }} />
                      Compact
                    </Box>
                  </MenuItem>
                  <MenuItem value="comfortable">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewModule sx={{ fontSize: 18 }} />
                      Comfortable
                    </Box>
                  </MenuItem>
                  <MenuItem value="spacious">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ViewModule sx={{ fontSize: 20 }} />
                      Spacious
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={refreshData}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/sales/create')}
                sx={{ fontWeight: 'bold' }}
              >
                New Sale
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ px: 3 }}>
          {/* Progress bar for refreshing */}
          {refreshing && <LinearProgress sx={{ mb: 2 }} />}

          {/* Error Alert */}
          {error && (
            <Fade in={Boolean(error)}>
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </Fade>
          )}

          {/* Enhanced Analytics */}
          <EnhancedAnalytics analytics={enhancedPipelineData} loading={loading} />

          {/* Enhanced Filters */}
          <EnhancedFilters
            filters={filters}
            projects={projects}
            users={users}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />

          {/* Pipeline Content */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" fontWeight="bold">
                Pipeline Stages
              </Typography>
              
              {searchQuery && (
                <Chip 
                  label={`Filtered by: "${searchQuery}"`}
                  onDelete={() => setSearchQuery('')}
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
            
            {viewMode === VIEW_MODES.KANBAN ? (
              <Box sx={{ 
                display: 'flex', 
                gap: viewDensity === 'compact' ? 1.5 : 2, 
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'background.default',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'primary.200',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'primary.400',
                },
              }}>
                {enhancedPipelineData.map((stage) => (
                  <Box 
                    key={stage.key} 
                    sx={{ 
                      minWidth: viewDensity === 'compact' ? 240 : viewDensity === 'spacious' ? 340 : 280, 
                      maxWidth: viewDensity === 'compact' ? 280 : viewDensity === 'spacious' ? 380 : 320,
                      flex: '0 0 auto',
                    }}
                  >
                    <CompactPipelineStage 
                      stage={stage}
                      stageData={stage}
                      onSaleClick={handleSaleClick}
                      isLoading={loading}
                      viewDensity={viewDensity}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  List View Coming Soon
                </Typography>
                <Typography color="text.secondary">
                  The list view is currently under development. Please use the Kanban view for now.
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesPipelinePage;
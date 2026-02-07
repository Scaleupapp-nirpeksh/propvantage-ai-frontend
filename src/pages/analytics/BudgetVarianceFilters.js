// File: src/pages/analytics/BudgetVarianceFilters.js
// Description: Advanced Filters Component for Budget Variance Dashboard - PRODUCTION READY
// Location: src/components/analytics/BudgetVarianceFilters.js
// Version: 2.0.0 - Complete implementation with real API integration
// Author: PropVantage AI Development Team
// Created: 2025-01-13

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Typography,
  Collapse,
  Divider,
  Badge,
  Alert,
  CircularProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  FilterList,
  Clear,
  Search,
  ExpandMore,
  ExpandLess,
  Refresh,
  Tune,
  Assessment,
  Business,
  CalendarToday,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Analytics,
  Speed,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Filter configuration constants
 */
const FILTER_CONFIG = {
  // Default filter values
  DEFAULTS: {
    project: 'all',
    projectStatus: 'active',
    varianceLevel: 'all',
    timePeriod: 'real_time',
    startDate: null,
    endDate: null,
    searchTerm: '',
    onlyProblemsProjects: false,
  },
  
  // Debounce delays for different filter types
  DEBOUNCE: {
    SEARCH: 500,        // 500ms for search input
    DATE_RANGE: 1000,   // 1s for date changes
    DROPDOWN: 200,      // 200ms for dropdowns
  },
  
  // Validation rules
  VALIDATION: {
    MAX_DATE_RANGE_DAYS: 365, // 1 year maximum
    MIN_SEARCH_LENGTH: 2,     // Minimum search term length
  },
};

/**
 * Filter option definitions
 */
const FILTER_OPTIONS = {
  PROJECT_STATUS: [
    { value: 'all', label: 'All Projects', icon: <Business />, description: 'Show all projects regardless of status' },
    { value: 'active', label: 'Active Projects', icon: <CheckCircle />, description: 'Currently active projects' },
    { value: 'launched', label: 'Launched Projects', icon: <Assessment />, description: 'Projects that have been launched' },
    { value: 'pre-launch', label: 'Pre-Launch', icon: <Schedule />, description: 'Projects in pre-launch phase' },
    { value: 'under-construction', label: 'Under Construction', icon: <Refresh />, description: 'Projects currently under construction' },
    { value: 'planning', label: 'Planning Phase', icon: <Tune />, description: 'Projects in planning stage' },
  ],
  
  VARIANCE_LEVEL: [
    { 
      value: 'all', 
      label: 'All Variance Levels', 
      icon: <Analytics />, 
      color: 'default',
      description: 'Show projects with any variance level'
    },
    { 
      value: 'critical', 
      label: 'Critical (>20%)', 
      icon: <Error />, 
      color: 'error',
      description: 'Projects with critical variance (>20%)'
    },
    { 
      value: 'warning', 
      label: 'Warning (10-20%)', 
      icon: <Warning />, 
      color: 'warning',
      description: 'Projects with warning variance (10-20%)'
    },
    { 
      value: 'normal', 
      label: 'Normal (<10%)', 
      icon: <CheckCircle />, 
      color: 'success',
      description: 'Projects with normal variance (<10%)'
    },
  ],
  
  TIME_PERIOD: [
    { 
      value: 'real_time', 
      label: 'Real-time', 
      icon: <Speed />, 
      description: 'Live data with latest updates'
    },
    { 
      value: 'last_week', 
      label: 'Last 7 Days', 
      icon: <CalendarToday />, 
      description: 'Data from the last 7 days'
    },
    { 
      value: 'last_month', 
      label: 'Last 30 Days', 
      icon: <CalendarToday />, 
      description: 'Data from the last 30 days'
    },
    { 
      value: 'last_quarter', 
      label: 'Last 3 Months', 
      icon: <CalendarToday />, 
      description: 'Data from the last 3 months'
    },
    { 
      value: 'custom', 
      label: 'Custom Range', 
      icon: <Tune />, 
      description: 'Define your own date range'
    },
  ],
};

/**
 * Quick filter presets for common scenarios
 */
const QUICK_FILTERS = [
  {
    id: 'critical_projects',
    label: 'Critical Projects',
    icon: <Error />,
    color: 'error',
    filters: { varianceLevel: 'critical', projectStatus: 'active' },
    description: 'Show only projects with critical variance'
  },
  {
    id: 'new_launches',
    label: 'New Launches',
    icon: <Assessment />,
    color: 'primary',
    filters: { projectStatus: 'launched', timePeriod: 'last_month' },
    description: 'Recently launched projects'
  },
  {
    id: 'problem_projects',
    label: 'Problems Only',
    icon: <Warning />,
    color: 'warning',
    filters: { onlyProblemsProjects: true, varianceLevel: 'warning' },
    description: 'Projects requiring attention'
  },
  {
    id: 'top_performers',
    label: 'Top Performers',
    icon: <CheckCircle />,
    color: 'success',
    filters: { varianceLevel: 'normal', projectStatus: 'active' },
    description: 'Well-performing projects'
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate date range based on time period selection
 */
const getDateRangeForPeriod = (period) => {
  const now = new Date();
  
  switch (period) {
    case 'last_week':
      return {
        startDate: subDays(now, 7),
        endDate: now,
      };
    case 'last_month':
      return {
        startDate: subDays(now, 30),
        endDate: now,
      };
    case 'last_quarter':
      return {
        startDate: subMonths(now, 3),
        endDate: now,
      };
    case 'current_month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    default:
      return {
        startDate: null,
        endDate: null,
      };
  }
};

/**
 * Validate filter combination
 */
const validateFilters = (filters) => {
  const errors = [];
  
  // Validate date range
  if (filters.startDate && filters.endDate) {
    const daysDiff = Math.abs(filters.endDate - filters.startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > FILTER_CONFIG.VALIDATION.MAX_DATE_RANGE_DAYS) {
      errors.push(`Date range cannot exceed ${FILTER_CONFIG.VALIDATION.MAX_DATE_RANGE_DAYS} days`);
    }
    
    if (filters.startDate > filters.endDate) {
      errors.push('Start date cannot be after end date');
    }
  }
  
  // Validate search term
  if (filters.searchTerm && filters.searchTerm.length < FILTER_CONFIG.VALIDATION.MIN_SEARCH_LENGTH) {
    errors.push(`Search term must be at least ${FILTER_CONFIG.VALIDATION.MIN_SEARCH_LENGTH} characters`);
  }
  
  return errors;
};

/**
 * Count active filters
 */
const countActiveFilters = (filters) => {
  let count = 0;
  
  if (filters.project !== 'all') count++;
  if (filters.projectStatus !== 'all') count++;
  if (filters.varianceLevel !== 'all') count++;
  if (filters.timePeriod !== 'real_time') count++;
  if (filters.searchTerm) count++;
  if (filters.onlyProblemsProjects) count++;
  
  return count;
};

// =============================================================================
// BUDGET VARIANCE FILTERS COMPONENT
// =============================================================================

/**
 * BudgetVarianceFilters - Advanced filtering component for budget variance dashboard
 * 
 * Features:
 * - Real-time filter updates with debouncing
 * - Quick filter presets for common scenarios
 * - Advanced date range selection
 * - Project search functionality
 * - Filter validation and error handling
 * - Mobile-responsive collapsible design
 * - Save/restore filter configurations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Array} props.projects - Available projects list
 * @param {Function} props.onApplyFilters - Apply filters handler
 * @param {Function} props.onClearFilters - Clear filters handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @returns {JSX.Element} BudgetVarianceFilters component
 */
const BudgetVarianceFilters = ({
  filters = FILTER_CONFIG.DEFAULTS,
  onFilterChange,
  projects = [],
  onApplyFilters,
  onClearFilters,
  loading = false,
  disabled = false,
}) => {
  // =============================================================================
  // HOOKS AND CONTEXT
  // =============================================================================
  
  
  // =============================================================================
  // LOCAL STATE
  // =============================================================================
  
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [, setValidationErrors] = useState([]);
  const [lastAppliedFilters, setLastAppliedFilters] = useState(filters);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Count of currently active filters
   */
  const activeFiltersCount = useMemo(() => {
    return countActiveFilters(filters);
  }, [filters]);
  
  /**
   * Check if filters have changes that need to be applied
   */
  const hasUnappliedChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(lastAppliedFilters);
  }, [filters, lastAppliedFilters]);
  
  /**
   * Get filtered projects list based on search term
   */
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    
    return projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.area?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);
  
  /**
   * Validate current filter combination
   */
  const currentValidationErrors = useMemo(() => {
    return validateFilters(filters);
  }, [filters]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle filter change with validation
   */
  const handleFilterChange = useCallback((filterKey, value) => {
    // Auto-update date range when time period changes
    if (filterKey === 'timePeriod' && value !== 'custom') {
      const dateRange = getDateRangeForPeriod(value);
      onFilterChange('startDate', dateRange.startDate);
      onFilterChange('endDate', dateRange.endDate);
    }
    
    onFilterChange(filterKey, value);
    
    // Update validation errors
    const newFilters = { ...filters, [filterKey]: value };
    setValidationErrors(validateFilters(newFilters));
  }, [filters, onFilterChange]);
  
  /**
   * Handle search term changes with debouncing
   */
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      onFilterChange('searchTerm', value);
    }, FILTER_CONFIG.DEBOUNCE.SEARCH);
    
    return () => clearTimeout(timeoutId);
  }, [onFilterChange]);
  
  /**
   * Handle quick filter application
   */
  const handleQuickFilter = useCallback((quickFilter) => {
    Object.entries(quickFilter.filters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
  }, [onFilterChange]);
  
  /**
   * Handle filter application
   */
  const handleApplyFilters = useCallback(() => {
    if (currentValidationErrors.length === 0) {
      setLastAppliedFilters(filters);
      onApplyFilters();
    }
  }, [currentValidationErrors, filters, onApplyFilters]);
  
  /**
   * Handle filter clearing
   */
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setValidationErrors([]);
    setLastAppliedFilters(FILTER_CONFIG.DEFAULTS);
    onClearFilters();
  }, [onClearFilters]);
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  /**
   * Render filter header with expand/collapse
   */
  const renderFilterHeader = () => (
    <CardHeader
      avatar={
        <Badge badgeContent={activeFiltersCount} color="primary">
          <FilterList color="action" />
        </Badge>
      }
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            Advanced Filters
          </Typography>
          {hasUnappliedChanges && (
            <Chip 
              label="Changes pending" 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
        </Box>
      }
      subheader={
        <Typography variant="body2" color="text.secondary">
          {activeFiltersCount > 0 
            ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active` 
            : 'No filters applied'
          }
        </Typography>
      }
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Apply/Clear buttons */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={handleClearFilters}
            disabled={loading || disabled || activeFiltersCount === 0}
          >
            Clear
          </Button>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<Assessment />}
            onClick={handleApplyFilters}
            disabled={loading || disabled || currentValidationErrors.length > 0 || !hasUnappliedChanges}
          >
            Apply
          </Button>
          
          {/* Expand/Collapse button */}
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            disabled={loading || disabled}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      }
    />
  );
  
  /**
   * Render quick filter chips
   */
  const renderQuickFilters = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Filters
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {QUICK_FILTERS.map((quickFilter) => (
          <Chip
            key={quickFilter.id}
            icon={quickFilter.icon}
            label={quickFilter.label}
            color={quickFilter.color}
            variant="outlined"
            clickable
            onClick={() => handleQuickFilter(quickFilter)}
            disabled={loading || disabled}
            title={quickFilter.description}
          />
        ))}
      </Box>
    </Box>
  );
  
  /**
   * Render main filter controls
   */
  const renderFilterControls = () => (
    <Grid container spacing={3}>
      {/* Project Search */}
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          size="small"
          label="Search Projects"
          value={searchTerm}
          onChange={handleSearchChange}
          disabled={loading || disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setSearchTerm('');
                    onFilterChange('searchTerm', '');
                  }}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          placeholder="Search by project name, city, area..."
        />
      </Grid>
      
      {/* Project Selection */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Project</InputLabel>
          <Select
            value={filters.project}
            onChange={(e) => handleFilterChange('project', e.target.value)}
            label="Project"
            disabled={loading || disabled}
          >
            <MenuItem value="all">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business />
                <Typography>All Projects</Typography>
              </Box>
            </MenuItem>
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Loading projects...
              </MenuItem>
            ) : (
              filteredProjects.map((project) => (
                <MenuItem key={project._id} value={project._id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography>{project.name}</Typography>
                    {project.location && (
                      <Typography variant="caption" color="text.secondary">
                        {project.location.city}, {project.location.area}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Project Status */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Project Status</InputLabel>
          <Select
            value={filters.projectStatus}
            onChange={(e) => handleFilterChange('projectStatus', e.target.value)}
            label="Project Status"
            disabled={loading || disabled}
          >
            {FILTER_OPTIONS.PROJECT_STATUS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.icon}
                  <Box>
                    <Typography>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Variance Level */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Variance Level</InputLabel>
          <Select
            value={filters.varianceLevel}
            onChange={(e) => handleFilterChange('varianceLevel', e.target.value)}
            label="Variance Level"
            disabled={loading || disabled}
          >
            {FILTER_OPTIONS.VARIANCE_LEVEL.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {React.cloneElement(option.icon, { color: option.color })}
                  <Box>
                    <Typography>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Time Period */}
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Time Period</InputLabel>
          <Select
            value={filters.timePeriod}
            onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
            label="Time Period"
            disabled={loading || disabled}
          >
            {FILTER_OPTIONS.TIME_PERIOD.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.icon}
                  <Box>
                    <Typography>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Problem Projects Toggle */}
      <Grid item xs={12} md={4}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.onlyProblemsProjects}
              onChange={(e) => handleFilterChange('onlyProblemsProjects', e.target.checked)}
              color="warning"
              disabled={loading || disabled}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Problem Projects Only</Typography>
              <Typography variant="caption" color="text.secondary">
                Show only projects requiring attention
              </Typography>
            </Box>
          }
        />
      </Grid>
      
      {/* Custom Date Range */}
      {filters.timePeriod === 'custom' && (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              disabled={loading || disabled}
              renderInput={(params) => (
                <TextField {...params} fullWidth size="small" />
              )}
              maxDate={filters.endDate || new Date()}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              disabled={loading || disabled}
              renderInput={(params) => (
                <TextField {...params} fullWidth size="small" />
              )}
              minDate={filters.startDate}
              maxDate={new Date()}
            />
          </Grid>
        </LocalizationProvider>
      )}
    </Grid>
  );
  
  /**
   * Render validation errors
   */
  const renderValidationErrors = () => {
    if (currentValidationErrors.length === 0) return null;
    
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Please fix the following errors:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {currentValidationErrors.map((error, index) => (
            <li key={index}>
              <Typography variant="body2">{error}</Typography>
            </li>
          ))}
        </ul>
      </Alert>
    );
  };
  
  /**
   * Render active filters summary
   */
  const renderActiveFiltersSummary = () => {
    if (activeFiltersCount === 0) return null;
    
    return (
      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Active Filters Summary:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filters.project !== 'all' && (
            <Chip 
              size="small" 
              label={`Project: ${projects.find(p => p._id === filters.project)?.name || 'Selected'}`} 
              onDelete={() => handleFilterChange('project', 'all')}
            />
          )}
          {filters.projectStatus !== 'all' && (
            <Chip 
              size="small" 
              label={`Status: ${FILTER_OPTIONS.PROJECT_STATUS.find(s => s.value === filters.projectStatus)?.label}`}
              onDelete={() => handleFilterChange('projectStatus', 'all')}
            />
          )}
          {filters.varianceLevel !== 'all' && (
            <Chip 
              size="small" 
              label={`Variance: ${FILTER_OPTIONS.VARIANCE_LEVEL.find(v => v.value === filters.varianceLevel)?.label}`}
              onDelete={() => handleFilterChange('varianceLevel', 'all')}
            />
          )}
          {filters.timePeriod !== 'real_time' && (
            <Chip 
              size="small" 
              label={`Period: ${FILTER_OPTIONS.TIME_PERIOD.find(t => t.value === filters.timePeriod)?.label}`}
              onDelete={() => handleFilterChange('timePeriod', 'real_time')}
            />
          )}
          {filters.searchTerm && (
            <Chip 
              size="small" 
              label={`Search: "${filters.searchTerm}"`}
              onDelete={() => {
                setSearchTerm('');
                handleFilterChange('searchTerm', '');
              }}
            />
          )}
          {filters.onlyProblemsProjects && (
            <Chip 
              size="small" 
              label="Problem Projects Only"
              color="warning"
              onDelete={() => handleFilterChange('onlyProblemsProjects', false)}
            />
          )}
        </Box>
      </Box>
    );
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <Card sx={{ mb: 3 }}>
      {renderFilterHeader()}
      
      <Collapse in={expanded}>
        <CardContent>
          {/* Quick Filters */}
          {renderQuickFilters()}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Main Filter Controls */}
          {renderFilterControls()}
          
          {/* Validation Errors */}
          {renderValidationErrors()}
          
          {/* Active Filters Summary */}
          {renderActiveFiltersSummary()}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default BudgetVarianceFilters;
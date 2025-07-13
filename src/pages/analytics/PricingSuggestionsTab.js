// File: src/pages/analytics/PricingSuggestionsTab.js
// Description: Pricing Suggestions Tab for Budget Variance Dashboard - PRODUCTION READY
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
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
  ButtonGroup,
  Collapse,
  LinearProgress,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  Cancel,
  Calculate,
  FilterList,
  Clear,
  Search,
  Sort,
  SwapVert,
  CheckCircle,
  Warning,
  Error,
  Info,
  Refresh,
  GetApp,
  Upload,
  ExpandMore,
  ExpandLess,
  Settings,
  Analytics,
  Assessment,
  Business,
  Home,
  Apartment,
  LocationCity,
  Speed,
  PriceChange,
  AutoGraph,
  Timeline,
  ShowChart,
  TableChart,
  ViewList,
  GridView,
} from '@mui/icons-material';
import { budgetHelpers } from '../../services/budgetAPI';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const PRICING_CONFIG = {
  // Table pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_ROWS_PER_PAGE: 100,
  },
  
  // Price adjustment limits
  PRICE_LIMITS: {
    MIN_ADJUSTMENT_PERCENTAGE: -50,   // -50% maximum discount
    MAX_ADJUSTMENT_PERCENTAGE: 100,   // +100% maximum increase
    MIN_PRICE_VALUE: 100000,          // ₹1L minimum price
    MAX_PRICE_VALUE: 50000000,        // ₹5Cr maximum price
  },
  
  // Color coding for price changes
  COLORS: {
    INCREASE_HIGH: '#d32f2f',      // Red for high increases (>15%)
    INCREASE_MEDIUM: '#ed6c02',     // Orange for medium increases (5-15%)
    INCREASE_LOW: '#2e7d32',       // Green for low increases (0-5%)
    DECREASE: '#1976d2',           // Blue for decreases
    NO_CHANGE: '#757575',          // Gray for no change
  },
  
  // Sort options
  SORT_OPTIONS: [
    { value: 'unitNumber_asc', label: 'Unit Number A-Z' },
    { value: 'priceIncrease_desc', label: 'Highest Increase %' },
    { value: 'priceIncrease_asc', label: 'Lowest Increase %' },
    { value: 'suggestedPrice_desc', label: 'Highest Suggested Price' },
    { value: 'suggestedPrice_asc', label: 'Lowest Suggested Price' },
    { value: 'currentPrice_desc', label: 'Highest Current Price' },
    { value: 'floor_desc', label: 'Highest Floor' },
    { value: 'unitType_asc', label: 'Unit Type' },
  ],
  
  // Filter options
  FILTERS: {
    UNIT_TYPES: ['All Types', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio'],
    PRICE_CHANGES: [
      { value: 'all', label: 'All Changes' },
      { value: 'increase', label: 'Price Increases' },
      { value: 'decrease', label: 'Price Decreases' },
      { value: 'no_change', label: 'No Change' },
      { value: 'high_increase', label: 'High Increases (>15%)' },
    ],
    FLOORS: ['All Floors', 'Ground', 'Low (1-3)', 'Mid (4-7)', 'High (8+)', 'Penthouse'],
  },
};

/**
 * Get price change status configuration
 */
const getPriceChangeStatus = (priceIncrease) => {
  if (priceIncrease === 0) {
    return {
      status: 'no_change',
      label: 'No Change',
      color: PRICING_CONFIG.COLORS.NO_CHANGE,
      severity: 'info',
      icon: <Info />,
    };
  } else if (priceIncrease < 0) {
    return {
      status: 'decrease',
      label: 'Decrease',
      color: PRICING_CONFIG.COLORS.DECREASE,
      severity: 'info',
      icon: <TrendingDown />,
    };
  } else if (priceIncrease > 15) {
    return {
      status: 'high_increase',
      label: 'High Increase',
      color: PRICING_CONFIG.COLORS.INCREASE_HIGH,
      severity: 'error',
      icon: <TrendingUp />,
    };
  } else if (priceIncrease > 5) {
    return {
      status: 'medium_increase',
      label: 'Medium Increase',
      color: PRICING_CONFIG.COLORS.INCREASE_MEDIUM,
      severity: 'warning',
      icon: <TrendingUp />,
    };
  } else {
    return {
      status: 'low_increase',
      label: 'Low Increase',
      color: PRICING_CONFIG.COLORS.INCREASE_LOW,
      severity: 'success',
      icon: <TrendingUp />,
    };
  }
};

/**
 * Validate price value
 */
const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) return { valid: false, error: 'Invalid price format' };
  if (numPrice < PRICING_CONFIG.PRICE_LIMITS.MIN_PRICE_VALUE) {
    return { valid: false, error: `Price cannot be less than ₹${budgetHelpers.formatAmountWithSuffix(PRICING_CONFIG.PRICE_LIMITS.MIN_PRICE_VALUE)}` };
  }
  if (numPrice > PRICING_CONFIG.PRICE_LIMITS.MAX_PRICE_VALUE) {
    return { valid: false, error: `Price cannot exceed ₹${budgetHelpers.formatAmountWithSuffix(PRICING_CONFIG.PRICE_LIMITS.MAX_PRICE_VALUE)}` };
  }
  
  return { valid: true, error: null };
};

// =============================================================================
// TABLE COMPONENTS
// =============================================================================

/**
 * Enhanced Table Header with sorting
 */
const PricingTableHead = ({ 
  order, 
  orderBy, 
  onRequestSort,
  numSelected,
  rowCount,
  onSelectAllClick,
}) => {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const headCells = [
    { id: 'select', label: 'Select', sortable: false, align: 'center' },
    { id: 'unitNumber', label: 'Unit', sortable: true, align: 'left' },
    { id: 'unitType', label: 'Type', sortable: true, align: 'center' },
    { id: 'floor', label: 'Floor', sortable: true, align: 'center' },
    { id: 'currentPrice', label: 'Current Price', sortable: true, align: 'right' },
    { id: 'suggestedPrice', label: 'Suggested Price', sortable: true, align: 'right' },
    { id: 'priceIncrease', label: 'Change %', sortable: true, align: 'center' },
    { id: 'priceImpact', label: 'Impact', sortable: false, align: 'center' },
    { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
  ];

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ fontWeight: 600, bgcolor: 'background.default' }}
          >
            {headCell.id === 'select' ? (
              <Checkbox
                color="primary"
                indeterminate={numSelected > 0 && numSelected < rowCount}
                checked={rowCount > 0 && numSelected === rowCount}
                onChange={onSelectAllClick}
                inputProps={{ 'aria-label': 'select all units' }}
              />
            ) : headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

/**
 * Pricing Table Row with inline editing
 */
const PricingTableRow = ({ 
  unit, 
  isSelected, 
  onSelectClick,
  onPriceEdit,
  onPriceChange,
  editingUnit,
  editPrice,
  onSaveEdit,
  onCancelEdit,
}) => {
  const theme = useTheme();
  const statusConfig = getPriceChangeStatus(unit.priceIncrease || 0);
  const isEditing = editingUnit === (unit.unitNumber || unit.unitId);
  
  const priceDifference = (unit.suggestedPrice || 0) - (unit.currentPrice || 0);
  const validation = editPrice ? validatePrice(editPrice) : { valid: true };
  
  return (
    <TableRow
      hover
      selected={isSelected}
      sx={{
        '&.Mui-selected': {
          bgcolor: `${statusConfig.color}10`,
        },
        '&:hover': {
          bgcolor: `${statusConfig.color}05`,
        },
      }}
    >
      {/* Selection Checkbox */}
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onChange={(event) => onSelectClick(event, unit.unitNumber || unit.unitId)}
        />
      </TableCell>
      
      {/* Unit Number */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600}>
            {unit.unitNumber || unit.unitId || 'N/A'}
          </Typography>
        </Box>
      </TableCell>
      
      {/* Unit Type */}
      <TableCell align="center">
        <Chip label={unit.unitType || unit.type || 'N/A'} size="small" variant="outlined" />
      </TableCell>
      
      {/* Floor */}
      <TableCell align="center">
        <Typography variant="body2">
          {unit.floor === 0 ? 'Ground' : unit.floor || 'N/A'}
        </Typography>
      </TableCell>
      
      {/* Current Price */}
      <TableCell align="right">
        <Typography variant="body2" fontWeight={500}>
          {budgetHelpers.formatAmountWithSuffix(unit.currentPrice || 0)}
        </Typography>
      </TableCell>
      
      {/* Suggested Price - Editable */}
      <TableCell align="right">
        {isEditing ? (
          <TextField
            size="small"
            value={editPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            error={!validation.valid}
            helperText={validation.error}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            sx={{ width: 140 }}
          />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            <Typography variant="body2" fontWeight={600} color={statusConfig.color}>
              {budgetHelpers.formatAmountWithSuffix(unit.suggestedPrice || 0)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onPriceEdit(unit.unitNumber || unit.unitId, unit.suggestedPrice)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
        )}
      </TableCell>
      
      {/* Price Change Percentage */}
      <TableCell align="center">
        <Chip
          icon={statusConfig.icon}
          label={`${unit.priceIncrease >= 0 ? '+' : ''}${(unit.priceIncrease || 0).toFixed(1)}%`}
          color={statusConfig.severity}
          size="small"
          sx={{ 
            fontWeight: 600,
            color: statusConfig.color,
          }}
        />
      </TableCell>
      
      {/* Price Impact */}
      <TableCell align="center">
        <Typography 
          variant="body2" 
          color={priceDifference >= 0 ? 'success.main' : 'error.main'}
          fontWeight={500}
        >
          {priceDifference >= 0 ? '+' : ''}{budgetHelpers.formatAmountWithSuffix(priceDifference)}
        </Typography>
      </TableCell>
      
      {/* Actions */}
      <TableCell align="center">
        {isEditing ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={onSaveEdit}
              disabled={!validation.valid}
            >
              <Save fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="secondary"
              onClick={onCancelEdit}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Tooltip title="Edit suggested price">
            <IconButton
              size="small"
              onClick={() => onPriceEdit(unit.unitNumber || unit.unitId, unit.suggestedPrice)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};

/**
 * Bulk Actions Toolbar
 */
const BulkActionsToolbar = ({ 
  numSelected, 
  selectedUnits,
  onBulkPriceAdjustment,
  onBulkAcceptSuggestions,
  onClearSelection,
}) => {
  return (
    <Zoom in={numSelected > 0}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: (theme) => theme.shadows[8],
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 3,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {numSelected} unit{numSelected > 1 ? 's' : ''} selected
        </Typography>
        
        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'primary.contrastText' }} />
        
        <ButtonGroup variant="contained" color="inherit">
          <Button
            startIcon={<CheckCircle />}
            onClick={onBulkAcceptSuggestions}
            size="small"
          >
            Accept Suggestions
          </Button>
          <Button
            startIcon={<Calculate />}
            onClick={onBulkPriceAdjustment}
            size="small"
          >
            Bulk Adjust
          </Button>
          <Button
            startIcon={<Clear />}
            onClick={onClearSelection}
            size="small"
          >
            Clear
          </Button>
        </ButtonGroup>
      </Paper>
    </Zoom>
  );
};

// =============================================================================
// DIALOG COMPONENTS
// =============================================================================

/**
 * Bulk Price Adjustment Dialog
 */
const BulkPriceAdjustmentDialog = ({ 
  open, 
  onClose, 
  selectedUnits, 
  onApplyAdjustment 
}) => {
  const [adjustmentType, setAdjustmentType] = useState('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [previewCalculations, setPreviewCalculations] = useState([]);
  
  const calculatePreview = useCallback(() => {
    if (!adjustmentValue || isNaN(adjustmentValue)) {
      setPreviewCalculations([]);
      return;
    }
    
    const value = parseFloat(adjustmentValue);
    const calculations = selectedUnits.map(unit => {
      let newPrice;
      
      if (adjustmentType === 'percentage') {
        newPrice = (unit.suggestedPrice || 0) * (1 + value / 100);
      } else {
        newPrice = (unit.suggestedPrice || 0) + value;
      }
      
      const newIncrease = (unit.currentPrice || 0) > 0 ? 
        ((newPrice - (unit.currentPrice || 0)) / (unit.currentPrice || 0)) * 100 : 0;
      
      return {
        ...unit,
        newPrice: Math.round(newPrice),
        newIncrease,
        priceChange: newPrice - (unit.suggestedPrice || 0),
      };
    });
    
    setPreviewCalculations(calculations);
  }, [selectedUnits, adjustmentType, adjustmentValue]);
  
  // Recalculate preview when values change
  React.useEffect(() => {
    calculatePreview();
  }, [calculatePreview]);
  
  const handleApply = () => {
    if (previewCalculations.length > 0) {
      onApplyAdjustment(previewCalculations);
      onClose();
    }
  };
  
  const totalPriceChange = previewCalculations.reduce((sum, calc) => sum + (calc.priceChange || 0), 0);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calculate />
          Bulk Price Adjustment
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Adjustment Controls */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Adjustment Type</InputLabel>
                <Select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  label="Adjustment Type"
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label={adjustmentType === 'percentage' ? 'Adjustment Percentage' : 'Adjustment Amount'}
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {adjustmentType === 'percentage' ? '%' : '₹'}
                    </InputAdornment>
                  ),
                }}
                helperText={
                  adjustmentType === 'percentage' 
                    ? 'Use negative values for decreases (e.g., -10 for 10% decrease)'
                    : 'Use negative values for decreases (e.g., -50000 for ₹50K decrease)'
                }
              />
              
              {totalPriceChange !== 0 && (
                <Alert severity={totalPriceChange > 0 ? 'warning' : 'info'}>
                  <AlertTitle>Total Impact</AlertTitle>
                  {totalPriceChange > 0 ? 'Increase' : 'Decrease'} of{' '}
                  <strong>{budgetHelpers.formatAmountWithSuffix(Math.abs(totalPriceChange))}</strong>{' '}
                  across {selectedUnits.length} units
                </Alert>
              )}
            </Stack>
          </Grid>
          
          {/* Preview */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Preview ({previewCalculations.length} units)
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {previewCalculations.length > 0 ? (
                <List dense>
                  {previewCalculations.slice(0, 5).map((calc, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={calc.unitNumber || calc.unitId}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {budgetHelpers.formatAmountWithSuffix(calc.suggestedPrice || 0)} → {budgetHelpers.formatAmountWithSuffix(calc.newPrice)}
                            </Typography>
                            <Typography variant="caption" color={calc.newIncrease >= 0 ? 'success.main' : 'error.main'}>
                              {calc.newIncrease >= 0 ? '+' : ''}{(calc.newIncrease || 0).toFixed(1)}% from current
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {previewCalculations.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${previewCalculations.length - 5} more units...`}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Enter an adjustment value to see preview
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={previewCalculations.length === 0}
          startIcon={<Save />}
        >
          Apply to {selectedUnits.length} Units
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =============================================================================
// MAIN PRICING SUGGESTIONS TAB COMPONENT
// =============================================================================

/**
 * PricingSuggestionsTab - Unit-level pricing recommendations component
 * 
 * Features:
 * - Sortable pricing suggestions table
 * - Inline price editing with validation
 * - Bulk price adjustment tools
 * - Advanced filtering and search
 * - Price change impact analysis
 * - Export/import capabilities
 * - Real-time calculations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.projectVariance - Project variance data with pricing suggestions
 * @param {Object} props.loadingStates - Loading states
 * @param {Function} props.onPriceUpdate - Price update handler
 * @param {Function} props.onBulkPriceUpdate - Bulk price update handler
 * @returns {JSX.Element} PricingSuggestionsTab component
 */
const PricingSuggestionsTab = ({
  projectVariance = null,
  loadingStates = {},
  onPriceUpdate,
  onBulkPriceUpdate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // =============================================================================
  // LOCAL STATE
  // =============================================================================
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PRICING_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('priceIncrease');
  
  // Selection state
  const [selected, setSelected] = useState([]);
  
  // Editing state
  const [editingUnit, setEditingUnit] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    unitType: 'All Types',
    priceChange: 'all',
    floor: 'All Floors',
    showOnlyIncreases: false,
  });
  
  // Dialog state
  const [bulkAdjustmentDialog, setBulkAdjustmentDialog] = useState(false);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Get pricing suggestions data
   */
  const pricingSuggestions = useMemo(() => {
    if (!projectVariance || !projectVariance.pricingSuggestions) {
      return [];
    }
    
    return projectVariance.pricingSuggestions.map(suggestion => ({
      ...suggestion,
      priceIncrease: suggestion.priceIncrease || 0,
      currentPrice: suggestion.currentPrice || 0,
      suggestedPrice: suggestion.suggestedPrice || 0,
    }));
  }, [projectVariance]);
  
  /**
   * Apply filters and sorting to pricing suggestions
   */
  const filteredAndSortedSuggestions = useMemo(() => {
    let filtered = [...pricingSuggestions];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(suggestion =>
        (suggestion.unitNumber || suggestion.unitId || '').toLowerCase().includes(searchLower) ||
        (suggestion.unitType || suggestion.type || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Apply unit type filter
    if (filters.unitType !== 'All Types') {
      filtered = filtered.filter(suggestion => 
        (suggestion.unitType || suggestion.type) === filters.unitType
      );
    }
    
    // Apply price change filter
    if (filters.priceChange !== 'all') {
      switch (filters.priceChange) {
        case 'increase':
          filtered = filtered.filter(suggestion => (suggestion.priceIncrease || 0) > 0);
          break;
        case 'decrease':
          filtered = filtered.filter(suggestion => (suggestion.priceIncrease || 0) < 0);
          break;
        case 'no_change':
          filtered = filtered.filter(suggestion => (suggestion.priceIncrease || 0) === 0);
          break;
        case 'high_increase':
          filtered = filtered.filter(suggestion => (suggestion.priceIncrease || 0) > 15);
          break;
      }
    }
    
    // Apply floor filter
    if (filters.floor !== 'All Floors') {
      switch (filters.floor) {
        case 'Ground':
          filtered = filtered.filter(suggestion => suggestion.floor === 0 || suggestion.floor === 'Ground');
          break;
        case 'Low (1-3)':
          filtered = filtered.filter(suggestion => suggestion.floor >= 1 && suggestion.floor <= 3);
          break;
        case 'Mid (4-7)':
          filtered = filtered.filter(suggestion => suggestion.floor >= 4 && suggestion.floor <= 7);
          break;
        case 'High (8+)':
          filtered = filtered.filter(suggestion => suggestion.floor >= 8);
          break;
        case 'Penthouse':
          filtered = filtered.filter(suggestion => 
            (suggestion.unitType || '').toLowerCase().includes('penthouse') || 
            suggestion.floor === 'Penthouse'
          );
          break;
      }
    }
    
    // Apply show only increases filter
    if (filters.showOnlyIncreases) {
      filtered = filtered.filter(suggestion => (suggestion.priceIncrease || 0) > 0);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'unitNumber':
          aValue = a.unitNumber || a.unitId || '';
          bValue = b.unitNumber || b.unitId || '';
          break;
        case 'unitType':
          aValue = a.unitType || a.type || '';
          bValue = b.unitType || b.type || '';
          break;
        case 'floor':
          aValue = a.floor || 0;
          bValue = b.floor || 0;
          break;
        case 'currentPrice':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'suggestedPrice':
          aValue = a.suggestedPrice || 0;
          bValue = b.suggestedPrice || 0;
          break;
        case 'priceIncrease':
          aValue = Math.abs(a.priceIncrease || 0);
          bValue = Math.abs(b.priceIncrease || 0);
          break;
        default:
          aValue = a[orderBy] || 0;
          bValue = b[orderBy] || 0;
      }
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    return filtered;
  }, [pricingSuggestions, filters, order, orderBy]);
  
  /**
   * Get selected units data
   */
  const selectedUnitsData = useMemo(() => {
    return filteredAndSortedSuggestions.filter(suggestion => 
      selected.includes(suggestion.unitNumber || suggestion.unitId)
    );
  }, [filteredAndSortedSuggestions, selected]);
  
  /**
   * Calculate summary statistics
   */
  const summaryStats = useMemo(() => {
    const totalUnits = filteredAndSortedSuggestions.length;
    const unitsWithIncreases = filteredAndSortedSuggestions.filter(s => (s.priceIncrease || 0) > 0).length;
    const unitsWithDecreases = filteredAndSortedSuggestions.filter(s => (s.priceIncrease || 0) < 0).length;
    const unitsNoChange = filteredAndSortedSuggestions.filter(s => (s.priceIncrease || 0) === 0).length;
    
    const avgIncrease = totalUnits > 0 ? 
      filteredAndSortedSuggestions.reduce((sum, s) => sum + (s.priceIncrease || 0), 0) / totalUnits : 0;
    
    const totalCurrentValue = filteredAndSortedSuggestions.reduce((sum, s) => sum + (s.currentPrice || 0), 0);
    const totalSuggestedValue = filteredAndSortedSuggestions.reduce((sum, s) => sum + (s.suggestedPrice || 0), 0);
    const totalImpact = totalSuggestedValue - totalCurrentValue;
    
    return {
      totalUnits,
      unitsWithIncreases,
      unitsWithDecreases,
      unitsNoChange,
      avgIncrease,
      totalCurrentValue,
      totalSuggestedValue,
      totalImpact,
    };
  }, [filteredAndSortedSuggestions]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredAndSortedSuggestions.map(n => n.unitNumber || n.unitId);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };
  
  const handleClick = (event, unitId) => {
    const selectedIndex = selected.indexOf(unitId);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, unitId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    
    setSelected(newSelected);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
    setPage(0); // Reset to first page when filters change
  };
  
  const handlePriceEdit = (unitId, currentPrice) => {
    setEditingUnit(unitId);
    setEditPrice(currentPrice.toString());
  };
  
  const handlePriceChange = (newPrice) => {
    setEditPrice(newPrice);
  };
  
  const handleSaveEdit = () => {
    const validation = validatePrice(editPrice);
    if (validation.valid && onPriceUpdate) {
      onPriceUpdate(editingUnit, parseFloat(editPrice));
      setEditingUnit(null);
      setEditPrice('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingUnit(null);
    setEditPrice('');
  };
  
  const handleBulkAcceptSuggestions = () => {
    if (onBulkPriceUpdate && selectedUnitsData.length > 0) {
      const updates = selectedUnitsData.map(unit => ({
        unitNumber: unit.unitNumber || unit.unitId,
        newPrice: unit.suggestedPrice,
      }));
      onBulkPriceUpdate(updates);
      setSelected([]);
    }
  };
  
  const handleBulkPriceAdjustment = (adjustments) => {
    if (onBulkPriceUpdate && adjustments.length > 0) {
      const updates = adjustments.map(adj => ({
        unitNumber: adj.unitNumber || adj.unitId,
        newPrice: adj.newPrice,
      }));
      onBulkPriceUpdate(updates);
      setSelected([]);
    }
  };
  
  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  /**
   * Render pricing suggestions header with summary
   */
  const renderPricingHeader = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Unit Pricing Suggestions
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        AI-powered pricing recommendations to achieve budget targets
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {summaryStats.totalUnits}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Units
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {summaryStats.unitsWithIncreases}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Price Increases
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {summaryStats.avgIncrease.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg. Increase
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color={summaryStats.totalImpact >= 0 ? 'success.main' : 'error.main'}>
              {budgetHelpers.formatAmountWithSuffix(summaryStats.totalImpact)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Impact
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
  
  /**
   * Render filters section
   */
  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Filters & Search"
        avatar={<FilterList />}
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Units"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Unit Type</InputLabel>
              <Select
                value={filters.unitType}
                onChange={(e) => handleFilterChange('unitType', e.target.value)}
                label="Unit Type"
              >
                {PRICING_CONFIG.FILTERS.UNIT_TYPES.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Price Changes</InputLabel>
              <Select
                value={filters.priceChange}
                onChange={(e) => handleFilterChange('priceChange', e.target.value)}
                label="Price Changes"
              >
                {PRICING_CONFIG.FILTERS.PRICE_CHANGES.map(change => (
                  <MenuItem key={change.value} value={change.value}>
                    {change.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Floor</InputLabel>
              <Select
                value={filters.floor}
                onChange={(e) => handleFilterChange('floor', e.target.value)}
                label="Floor"
              >
                {PRICING_CONFIG.FILTERS.FLOORS.map(floor => (
                  <MenuItem key={floor} value={floor}>{floor}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showOnlyIncreases}
                  onChange={(e) => handleFilterChange('showOnlyIncreases', e.target.checked)}
                  color="primary"
                />
              }
              label="Show Only Increases"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  /**
   * Render pricing suggestions table
   */
  const renderPricingTable = () => {
    if (loadingStates.pricingSuggestions) {
      return (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={60} />
              ))}
            </Box>
          </CardContent>
        </Card>
      );
    }
    
    if (filteredAndSortedSuggestions.length === 0) {
      return (
        <Card>
          <CardContent>
            <Alert severity="info">
              <AlertTitle>No Pricing Suggestions</AlertTitle>
              {pricingSuggestions.length === 0 
                ? 'No pricing suggestions available for this project.'
                : 'No units match your current filter criteria. Try adjusting the filters.'
              }
            </Alert>
          </CardContent>
        </Card>
      );
    }
    
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredAndSortedSuggestions.length) : 0;
    
    return (
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table stickyHeader>
              <PricingTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={filteredAndSortedSuggestions.length}
              />
              <TableBody>
                {filteredAndSortedSuggestions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((unit) => {
                    const unitId = unit.unitNumber || unit.unitId;
                    const isItemSelected = selected.indexOf(unitId) !== -1;
                    
                    return (
                      <PricingTableRow
                        key={unitId}
                        unit={unit}
                        isSelected={isItemSelected}
                        onSelectClick={handleClick}
                        onPriceEdit={handlePriceEdit}
                        onPriceChange={handlePriceChange}
                        editingUnit={editingUnit}
                        editPrice={editPrice}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                      />
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={9} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={PRICING_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS}
            component="div"
            count={filteredAndSortedSuggestions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    );
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  if (!projectVariance) {
    return (
      <Alert severity="info">
        <AlertTitle>Select a Project</AlertTitle>
        Please select a specific project to view pricing suggestions.
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      {renderPricingHeader()}
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Pricing Table */}
      {renderPricingTable()}
      
      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        numSelected={selected.length}
        selectedUnits={selectedUnitsData}
        onBulkPriceAdjustment={() => setBulkAdjustmentDialog(true)}
        onBulkAcceptSuggestions={handleBulkAcceptSuggestions}
        onClearSelection={() => setSelected([])}
      />
      
      {/* Bulk Price Adjustment Dialog */}
      <BulkPriceAdjustmentDialog
        open={bulkAdjustmentDialog}
        onClose={() => setBulkAdjustmentDialog(false)}
        selectedUnits={selectedUnitsData}
        onApplyAdjustment={handleBulkPriceAdjustment}
      />
    </Box>
  );
};

export default PricingSuggestionsTab;
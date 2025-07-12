// File: src/pages/sales/CommissionStructurePage.js
// Description: Commission structure management page for creating and managing commission rules and calculation methods
// Version: 1.0 - Complete commission structure management with backend integration
// Location: src/pages/sales/CommissionStructurePage.js

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
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  InputAdornment,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Menu,
  ListItemButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings,
  Visibility,
  MoreVert,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Calculate,
  TrendingUp,
  AttachMoney,
  Percent,
  Timeline,
  Business,
  Person,
  Assessment,
  Save,
  Clear,
  Preview,
  FileCopy,
  Archive,
  Restore,
  ExpandMore,
  Close,
  PlayArrow,
  Stop,
  Refresh,
  Download,
  Upload,
  Help,
  AccountBalance,
  Receipt,
  MonetizationOn,
  Assignment,
  Group,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { commissionAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Commission calculation methods
const CALCULATION_METHODS = [
  { value: 'percentage', label: 'Percentage of Sale', description: 'Fixed percentage of sale amount' },
  { value: 'tiered', label: 'Tiered Percentage', description: 'Different rates based on sale volume' },
  { value: 'flat_rate', label: 'Flat Rate', description: 'Fixed amount per sale' },
  { value: 'hybrid', label: 'Hybrid Model', description: 'Combination of percentage and flat rate' },
];

// Unit types for commission calculation (FIXED: Match backend enum values)
const UNIT_TYPES = [
  { value: '1BHK', label: '1 BHK' },
  { value: '2BHK', label: '2 BHK' },
  { value: '3BHK', label: '3 BHK' },
  { value: '4BHK', label: '4+ BHK' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Plot', label: 'Plot' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Other', label: 'Other' },
];

// Performance tier options
const PERFORMANCE_TIERS = [
  { value: 'bronze', label: 'Bronze', minSales: 0, maxSales: 5 },
  { value: 'silver', label: 'Silver', minSales: 6, maxSales: 10 },
  { value: 'gold', label: 'Gold', minSales: 11, maxSales: 20 },
  { value: 'platinum', label: 'Platinum', minSales: 21, maxSales: null },
];

// Deduction types
const DEDUCTION_TYPES = [
  { value: 'tds', label: 'TDS (Tax Deducted at Source)', defaultRate: 10 },
  { value: 'service_charge', label: 'Service Charge', defaultRate: 2 },
  { value: 'processing_fee', label: 'Processing Fee', defaultRate: 1 },
  { value: 'admin_fee', label: 'Administrative Fee', defaultRate: 0.5 },
];

// Form validation rules
const VALIDATION_RULES = {
  structureName: { required: true, minLength: 3, maxLength: 100 },
  commissionRate: { required: true, min: 0, max: 100 },
  description: { maxLength: 500 },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates commission structure form data
 */
const validateCommissionStructure = (formData) => {
  const errors = {};

  // Structure name validation
  if (!formData.structureName?.trim()) {
    errors.structureName = 'Structure name is required';
  } else if (formData.structureName.length < 3) {
    errors.structureName = 'Structure name must be at least 3 characters';
  }

  // Commission rate validation for percentage method
  if (formData.calculationMethod === 'percentage') {
    if (!formData.baseCommissionRate || formData.baseCommissionRate <= 0) {
      errors.baseCommissionRate = 'Commission rate must be greater than 0';
    } else if (formData.baseCommissionRate > 100) {
      errors.baseCommissionRate = 'Commission rate cannot exceed 100%';
    }
  }

  // Tiered rates validation
  if (formData.calculationMethod === 'tiered' && formData.tieredRates?.length === 0) {
    errors.tieredRates = 'At least one tier is required for tiered calculation';
  }

  // Unit type rates validation
  if (formData.unitTypeRates?.length === 0) {
    errors.unitTypeRates = 'At least one unit type rate is required';
  }

  return errors;
};

/**
 * Calculates preview commission based on structure
 */
const calculatePreviewCommission = (structure, saleAmount, unitType, salesVolume = 0) => {
  let baseRate = 0;
  let grossCommission = 0;

  // Calculate base commission
  switch (structure.calculationMethod) {
    case 'percentage':
      baseRate = structure.baseCommissionRate || 0;
      grossCommission = (saleAmount * baseRate) / 100;
      break;
    case 'flat_rate':
      grossCommission = structure.flatRateAmount || 0;
      break;
    case 'tiered':
      const tier = structure.tieredRates?.find(t => 
        salesVolume >= (t.minSales || 0) && 
        salesVolume < (t.maxSales || Infinity)
      );
      baseRate = tier?.commissionRate || 0;
      grossCommission = (saleAmount * baseRate) / 100;
      break;
    default:
      grossCommission = 0;
  }

  // Apply unit type specific rates
  const unitTypeRate = structure.unitTypeRates?.find(utr => utr.unitType === unitType);
  if (unitTypeRate) {
    grossCommission = (saleAmount * unitTypeRate.commissionRate) / 100;
  }

  // Calculate deductions
  let totalDeductions = 0;
  structure.deductions?.forEach(deduction => {
    if (deduction.isActive) {
      const deductionAmount = deduction.deductionPercentage 
        ? (grossCommission * deduction.deductionPercentage) / 100
        : deduction.deductionAmount || 0;
      totalDeductions += deductionAmount;
    }
  });

  const netCommission = grossCommission - totalDeductions;

  return {
    grossCommission,
    totalDeductions,
    netCommission,
    baseRate,
  };
};

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

/**
 * Commission Structure Status Chip
 */
const StructureStatusChip = ({ isActive, size = 'small' }) => {
  return (
    <Chip
      icon={isActive ? <CheckCircle /> : <Cancel />}
      label={isActive ? 'Active' : 'Inactive'}
      color={isActive ? 'success' : 'default'}
      size={size}
      variant="outlined"
    />
  );
};

/**
 * Commission Structure Card Component
 */
const CommissionStructureCard = ({ structure, onEdit, onToggleStatus, onDelete, onPreview, canEdit }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleAction = (action) => {
    switch (action) {
      case 'edit':
        onEdit(structure);
        break;
      case 'toggle':
        onToggleStatus(structure);
        break;
      case 'delete':
        onDelete(structure);
        break;
      case 'preview':
        onPreview(structure);
        break;
      default:
        console.log('Unknown action:', action);
    }
    handleMenuClose();
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
      onClick={() => onPreview(structure)}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: structure.validityPeriod?.isActive ? 'success.main' : 'default' }}>
            <Settings />
          </Avatar>
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" noWrap>
              {structure.structureName}
            </Typography>
            <StructureStatusChip isActive={structure.validityPeriod?.isActive} />
          </Box>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            {CALCULATION_METHODS.find(m => m.value === structure.calculationMethod)?.label}
          </Typography>
        }
        action={
          canEdit && (
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          {/* Base Rate Display */}
          {structure.calculationMethod === 'percentage' && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Base Commission Rate
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatPercentage(structure.baseCommissionRate || 0)}
              </Typography>
            </Box>
          )}

          {/* Unit Types Count */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Unit Types Configured
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {structure.unitTypeRates?.length || 0} types
            </Typography>
          </Box>

          {/* Usage Stats */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Usage
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {structure.usageStats?.totalPartnersUsing || 0} partners
            </Typography>
          </Box>

          {/* Last Modified */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last Modified
            </Typography>
            <Typography variant="body2">
              {structure.lastModifiedDate ? formatDate(structure.lastModifiedDate) : 'Never'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem onClick={() => handleAction('preview')}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('toggle')}>
          <ListItemIcon>
            {structure.validityPeriod?.isActive ? <Stop fontSize="small" /> : <PlayArrow fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {structure.validityPeriod?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

/**
 * Commission Structure Form Dialog
 */
const CommissionStructureFormDialog = ({ 
  open, 
  onClose, 
  structure, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    structureName: '',
    description: '',
    calculationMethod: 'percentage',
    baseCommissionRate: 5,
    flatRateAmount: 0,
    tieredRates: [],
    unitTypeRates: [
      { unitType: '1BHK', commissionRate: 5 },
      { unitType: '2BHK', commissionRate: 5 },
      { unitType: '3BHK', commissionRate: 5 },
    ],
    performanceBonuses: [],
    deductions: [
      { 
        deductionType: 'tds', 
        deductionPercentage: 10, 
        deductionAmount: 0, 
        isActive: true 
      },
    ],
    validityPeriod: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
    },
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Initialize form data when structure changes
  useEffect(() => {
    if (structure) {
      setFormData({
        ...structure,
        validityPeriod: {
          ...structure.validityPeriod,
          startDate: structure.validityPeriod?.startDate 
            ? new Date(structure.validityPeriod.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          endDate: structure.validityPeriod?.endDate 
            ? new Date(structure.validityPeriod.endDate).toISOString().split('T')[0]
            : '',
        },
      });
    } else {
      // Reset form for new structure (FIXED: Using uppercase unit types)
      setFormData({
        structureName: '',
        description: '',
        calculationMethod: 'percentage',
        baseCommissionRate: 5,
        flatRateAmount: 0,
        tieredRates: [],
        unitTypeRates: [
          { unitType: '1BHK', commissionRate: 5 },
          { unitType: '2BHK', commissionRate: 5 },
          { unitType: '3BHK', commissionRate: 5 },
        ],
        performanceBonuses: [],
        deductions: [
          { 
            deductionType: 'tds', 
            deductionPercentage: 10, 
            deductionAmount: 0, 
            isActive: true 
          },
        ],
        validityPeriod: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          isActive: true,
        },
      });
    }
    setErrors({});
    setActiveTab(0);
  }, [structure, open]);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedInputChange = (parentField, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: prev[parentField].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddItem = (field, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultItem],
    }));
  };

  const handleRemoveItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const validationErrors = validateCommissionStructure(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving commission structure:', err);
    } finally {
      setSaving(false);
    }
  };

  // Tab panels
  const tabPanels = [
    {
      label: 'Basic Info',
      content: (
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Structure Name"
            value={formData.structureName}
            onChange={(e) => handleInputChange('structureName', e.target.value)}
            error={!!errors.structureName}
            helperText={errors.structureName}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={3}
            error={!!errors.description}
            helperText={errors.description}
          />
          <FormControl fullWidth>
            <InputLabel>Calculation Method</InputLabel>
            <Select
              value={formData.calculationMethod}
              onChange={(e) => handleInputChange('calculationMethod', e.target.value)}
              label="Calculation Method"
            >
              {CALCULATION_METHODS.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  <Box>
                    <Typography variant="body1">{method.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Base Commission Rate for Percentage Method */}
          {formData.calculationMethod === 'percentage' && (
            <TextField
              fullWidth
              label="Base Commission Rate"
              type="number"
              value={formData.baseCommissionRate}
              onChange={(e) => handleInputChange('baseCommissionRate', parseFloat(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              error={!!errors.baseCommissionRate}
              helperText={errors.baseCommissionRate}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
          )}

          {/* Flat Rate Amount for Flat Rate Method */}
          {formData.calculationMethod === 'flat_rate' && (
            <TextField
              fullWidth
              label="Flat Rate Amount"
              type="number"
              value={formData.flatRateAmount}
              onChange={(e) => handleInputChange('flatRateAmount', parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 100 }}
            />
          )}
        </Stack>
      ),
    },
    {
      label: 'Unit Type Rates',
      content: (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Unit Type Commission Rates</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleAddItem('unitTypeRates', { unitType: '1BHK', commissionRate: 5 })}
            >
              Add Unit Type
            </Button>
          </Box>
          
          {formData.unitTypeRates?.map((unitTypeRate, index) => (
            <Paper key={index} sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Unit Type</InputLabel>
                    <Select
                      value={unitTypeRate.unitType}
                      onChange={(e) => handleNestedInputChange('unitTypeRates', index, 'unitType', e.target.value)}
                      label="Unit Type"
                    >
                      {UNIT_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Commission Rate"
                    type="number"
                    value={unitTypeRate.commissionRate}
                    onChange={(e) => handleNestedInputChange('unitTypeRates', index, 'commissionRate', parseFloat(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem('unitTypeRates', index)}
                      disabled={formData.unitTypeRates.length <= 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          {errors.unitTypeRates && (
            <Alert severity="error">{errors.unitTypeRates}</Alert>
          )}
        </Stack>
      ),
    },
    {
      label: 'Deductions',
      content: (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Commission Deductions</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleAddItem('deductions', { 
                deductionType: 'service_charge', 
                deductionPercentage: 2, 
                deductionAmount: 0, 
                isActive: true 
              })}
            >
              Add Deduction
            </Button>
          </Box>
          
          {formData.deductions?.map((deduction, index) => (
            <Paper key={index} sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Deduction Type</InputLabel>
                    <Select
                      value={deduction.deductionType}
                      onChange={(e) => handleNestedInputChange('deductions', index, 'deductionType', e.target.value)}
                      label="Deduction Type"
                    >
                      {DEDUCTION_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Percentage"
                    type="number"
                    value={deduction.deductionPercentage}
                    onChange={(e) => handleNestedInputChange('deductions', index, 'deductionPercentage', parseFloat(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={deduction.isActive}
                        onChange={(e) => handleNestedInputChange('deductions', index, 'isActive', e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem('deductions', index)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      ),
    },
    {
      label: 'Validity',
      content: (
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.validityPeriod?.isActive}
                onChange={(e) => handleInputChange('validityPeriod', {
                  ...formData.validityPeriod,
                  isActive: e.target.checked,
                })}
              />
            }
            label="Active Structure"
          />
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={formData.validityPeriod?.startDate}
            onChange={(e) => handleInputChange('validityPeriod', {
              ...formData.validityPeriod,
              startDate: e.target.value,
            })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End Date (Optional)"
            type="date"
            value={formData.validityPeriod?.endDate}
            onChange={(e) => handleInputChange('validityPeriod', {
              ...formData.validityPeriod,
              endDate: e.target.value,
            })}
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for no end date"
          />
        </Stack>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {structure ? 'Edit Commission Structure' : 'Create Commission Structure'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Tab Navigation */}
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            {tabPanels.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
          
          {/* Tab Content */}
          {tabPanels[activeTab]?.content}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
        >
          {saving ? 'Saving...' : 'Save Structure'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Commission Preview Dialog
 */
const CommissionPreviewDialog = ({ open, onClose, structure }) => {
  const [previewData, setPreviewData] = useState({
    saleAmount: 5000000, // 50 lakhs default
    unitType: '2BHK',
    salesVolume: 5,
  });

  const previewResult = useMemo(() => {
    if (!structure) return null;
    return calculatePreviewCommission(
      structure, 
      previewData.saleAmount, 
      previewData.unitType, 
      previewData.salesVolume
    );
  }, [structure, previewData]);

  if (!structure) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Commission Preview</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Preview Parameters */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview Parameters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sale Amount"
                  type="number"
                  value={previewData.saleAmount}
                  onChange={(e) => setPreviewData(prev => ({ 
                    ...prev, 
                    saleAmount: parseFloat(e.target.value) || 0 
                  }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit Type</InputLabel>
                  <Select
                    value={previewData.unitType}
                    onChange={(e) => setPreviewData(prev => ({ 
                      ...prev, 
                      unitType: e.target.value 
                    }))}
                    label="Unit Type"
                  >
                    {UNIT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sales Volume (for tiered)"
                  type="number"
                  value={previewData.salesVolume}
                  onChange={(e) => setPreviewData(prev => ({ 
                    ...prev, 
                    salesVolume: parseInt(e.target.value) || 0 
                  }))}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Structure Information */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Structure: {structure.structureName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Method: {CALCULATION_METHODS.find(m => m.value === structure.calculationMethod)?.label}
            </Typography>
          </Paper>

          {/* Commission Calculation Results */}
          {previewResult && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Commission Calculation
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Sale Amount:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(previewData.saleAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Commission Rate:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage(previewResult.baseRate)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="primary.main">Gross Commission:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main">
                    {formatCurrency(previewResult.grossCommission)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="error.main">Total Deductions:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="error.main">
                    {formatCurrency(previewResult.totalDeductions)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" color="success.main">Net Commission:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(previewResult.netCommission)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Commission Structure Management Page
 * Comprehensive commission structure management with creation, editing, and preview
 */
const CommissionStructurePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, canAccess } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog states
  const [formDialog, setFormDialog] = useState({ open: false, structure: null });
  const [previewDialog, setPreviewDialog] = useState({ open: false, structure: null });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
    data: null,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const canEdit = canAccess.projectManagement();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches commission structures from backend
   * FIXED: Added better error handling and API method validation
   */
  const fetchCommissionStructures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if the API method exists
      if (typeof commissionAPI.getCommissionStructures !== 'function') {
        throw new Error('Commission structure API method not available. Please check your API configuration.');
      }

      const response = await commissionAPI.getCommissionStructures();
      const structuresData = response.data?.data || [];

      setStructures(structuresData);
    } catch (err) {
      console.error('Error fetching commission structures:', err);
      const errorMessage = err.message.includes('not a function') 
        ? 'Commission structure API methods are not properly configured. Please update your API service.'
        : (err.response?.data?.message || 'Failed to load commission structures');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchCommissionStructures();
  }, [fetchCommissionStructures]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handles creating new structure
   */
  const handleCreateStructure = useCallback(() => {
    setFormDialog({ open: true, structure: null });
  }, []);

  /**
   * Handles editing structure
   */
  const handleEditStructure = useCallback((structure) => {
    setFormDialog({ open: true, structure });
  }, []);

  /**
   * Handles structure preview
   */
  const handlePreviewStructure = useCallback((structure) => {
    setPreviewDialog({ open: true, structure });
  }, []);

  /**
   * Handles structure save
   * FIXED: Added API method validation and better error handling
   */
  const handleSaveStructure = useCallback(async (structureData) => {
    try {
      if (formDialog.structure) {
        // Update existing structure
        if (typeof commissionAPI.updateCommissionStructure !== 'function') {
          throw new Error('Update commission structure API method not available');
        }
        await commissionAPI.updateCommissionStructure(formDialog.structure._id, structureData);
        setSnackbar({ 
          open: true, 
          message: 'Commission structure updated successfully', 
          severity: 'success' 
        });
      } else {
        // Create new structure
        if (typeof commissionAPI.createCommissionStructure !== 'function') {
          throw new Error('Create commission structure API method not available');
        }
        await commissionAPI.createCommissionStructure(structureData);
        setSnackbar({ 
          open: true, 
          message: 'Commission structure created successfully', 
          severity: 'success' 
        });
      }

      // Refresh data
      fetchCommissionStructures();
    } catch (err) {
      console.error('Error saving commission structure:', err);
      throw err; // Re-throw to be handled by form dialog
    }
  }, [formDialog.structure, fetchCommissionStructures]);

  /**
   * Handles structure status toggle
   */
  const handleToggleStructureStatus = useCallback((structure) => {
    const action = structure.validityPeriod?.isActive ? 'deactivate' : 'activate';
    setConfirmDialog({
      open: true,
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Commission Structure`,
      message: `Are you sure you want to ${action} "${structure.structureName}"?`,
      action: 'toggle_status',
      data: structure,
    });
  }, []);

  /**
   * Handles structure deletion
   */
  const handleDeleteStructure = useCallback((structure) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Commission Structure',
      message: `Are you sure you want to delete "${structure.structureName}"? This action cannot be undone.`,
      action: 'delete',
      data: structure,
    });
  }, []);

  /**
   * Handles confirmation dialog actions
   * FIXED: Added API method validation for delete operations
   */
  const handleConfirmAction = useCallback(async () => {
    const { action, data } = confirmDialog;

    try {
      switch (action) {
        case 'toggle_status':
          if (data.validityPeriod?.isActive) {
            if (typeof commissionAPI.deactivateCommissionStructure !== 'function') {
              throw new Error('Deactivate commission structure API method not available');
            }
            await commissionAPI.deactivateCommissionStructure(data._id);
            setSnackbar({ 
              open: true, 
              message: 'Commission structure deactivated successfully', 
              severity: 'success' 
            });
          } else {
            // For now, just show a message since activate might not be implemented
            setSnackbar({ 
              open: true, 
              message: 'Activate functionality will be implemented', 
              severity: 'info' 
            });
          }
          break;
        case 'delete':
          if (typeof commissionAPI.deleteCommissionStructure !== 'function') {
            throw new Error('Delete commission structure API method not available');
          }
          await commissionAPI.deleteCommissionStructure(data._id);
          setSnackbar({ 
            open: true, 
            message: 'Commission structure deleted successfully', 
            severity: 'success' 
          });
          break;
        default:
          break;
      }

      // Refresh data
      fetchCommissionStructures();
    } catch (err) {
      const errorMessage = err.message.includes('not available') 
        ? 'This feature requires API configuration updates'
        : (err.response?.data?.message || 'Action failed');
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }

    setConfirmDialog({ open: false, title: '', message: '', action: null, data: null });
  }, [confirmDialog, fetchCommissionStructures]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Check permissions
  if (!canEdit) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" color="warning.main" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You don't have permission to manage commission structures.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Commission Structures
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage commission calculation rules and structures
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCommissionStructures}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateStructure}
          >
            Create Structure
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
          {error.includes('API') && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Quick Fix:</strong> Update your services/api.js file to include commission structure methods.
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {/* API Configuration Warning */}
      {!loading && typeof commissionAPI.getCommissionStructures !== 'function' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Configuration Required:</strong> Commission structure API methods are missing. 
            Please update your API service configuration to enable full functionality.
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : structures.length === 0 ? (
        /* Empty State */
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No Commission Structures
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Create your first commission structure to start managing commission calculations
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateStructure}
            sx={{ mt: 2 }}
          >
            Create First Structure
          </Button>
        </Box>
      ) : (
        /* Commission Structures Grid */
        <Grid container spacing={3}>
          {structures.map((structure) => (
            <Grid item xs={12} sm={6} lg={4} key={structure._id}>
              <CommissionStructureCard
                structure={structure}
                onEdit={handleEditStructure}
                onToggleStatus={handleToggleStructureStatus}
                onDelete={handleDeleteStructure}
                onPreview={handlePreviewStructure}
                canEdit={canEdit}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleCreateStructure}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <Add />
        </Fab>
      )}

      {/* Form Dialog */}
      <CommissionStructureFormDialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false, structure: null })}
        structure={formDialog.structure}
        onSave={handleSaveStructure}
      />

      {/* Preview Dialog */}
      <CommissionPreviewDialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, structure: null })}
        structure={previewDialog.structure}
      />

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CommissionStructurePage;
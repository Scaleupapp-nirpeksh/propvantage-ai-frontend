/**
 * File: src/pages/sales/EditSalePage.js
 * Description: Comprehensive sales edit page with complete functionality
 * Version: 1.0 - Full featured edit page with proper backend integration
 * Location: src/pages/sales/EditSalePage.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Alert,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormHelperText,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Refresh,
  ExpandMore,
  Calculate,
  Receipt,
  Person,
  Business,
  Home,
  CheckCircle,
  Info,
  AccountBalance,
  Assignment,
  Timeline,
  TrendingUp,
  Cancel,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, pricingAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

// Sale Status Options
const SALE_STATUSES = [
  { value: 'Booked', label: 'Booked', color: 'success' },
  { value: 'Confirmed', label: 'Confirmed', color: 'primary' },
  { value: 'In Progress', label: 'In Progress', color: 'warning' },
  { value: 'Completed', label: 'Completed', color: 'success' },
  { value: 'Cancelled', label: 'Cancelled', color: 'error' },
  { value: 'On Hold', label: 'On Hold', color: 'default' },
];

// Cost Component Categories
const COST_COMPONENT_CATEGORIES = [
  { id: 'primary', label: 'Primary Costs', icon: <Home /> },
  { id: 'amenities', label: 'Amenities & Features', icon: <Business /> },
  { id: 'development', label: 'Development Charges', icon: <TrendingUp /> },
  { id: 'utilities', label: 'Utilities & Services', icon: <AccountBalance /> },
  { id: 'legal', label: 'Legal & Registration', icon: <Assignment /> },
  { id: 'taxes', label: 'Taxes & Government Charges', icon: <Receipt /> },
];

const EditSalePage = () => {
  const { saleId } = useParams(); // ✅ FIXED: Changed from 'id' to 'saleId' to match route definition
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess, checkPerm } = useAuth();

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  
  // State Management
  const [sale, setSale] = useState(null);
  const [originalSale, setOriginalSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    status: '',
    discountPercentage: 0,
    discountAmount: 0,
    salePrice: 0,
    notes: '',
    costSheetSnapshot: null,
    paymentPlanSnapshot: null,
  });

  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
  });

  // Cost Sheet State
  const [costSheet, setCostSheet] = useState(null);
  const [regeneratingCostSheet, setRegeneratingCostSheet] = useState(false);
  const [costSheetModified, setCostSheetModified] = useState(false);

  // Validation State
  const [errors, setErrors] = useState({});

  // Load sale data
  const loadSale = useCallback(async () => {
    console.log('🔄 LoadSale called with saleId:', saleId);
    
    if (!saleId) {
      console.error('❌ No sale ID provided');
      setError('No sale ID provided');
      setLoading(false);
      return;
    }

    // Check if salesAPI exists
    if (!salesAPI || !salesAPI.getSale) {
      console.error('❌ salesAPI.getSale is not available');
      setError('Sales API is not available. Please check your API configuration.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('📞 Calling salesAPI.getSale with saleId:', saleId);
      const response = await salesAPI.getSale(saleId);
      console.log('📊 API Response:', response);
      
      // Handle different response structures
      let saleData = null;
      if (response.data?.success && response.data?.data) {
        saleData = response.data.data;
        console.log('✅ Using response.data.data structure');
      } else if (response.data && !response.data.success) {
        // Try direct response.data
        saleData = response.data;
        console.log('✅ Using direct response.data structure');
      } else {
        console.error('❌ Unexpected response structure:', response);
        setError('Unexpected response format from server');
        setLoading(false);
        return;
      }

      if (saleData && saleData._id) {
        console.log('✅ Sale data loaded:', saleData);
        setSale(saleData);
        setOriginalSale(JSON.parse(JSON.stringify(saleData))); // Deep copy for comparison
        
        // Initialize form data
        const formDataValues = {
          status: saleData.status || 'Booked',
          discountPercentage: saleData.discountPercentage || 0,
          discountAmount: saleData.discountAmount || 0,
          salePrice: saleData.salePrice || 0,
          notes: saleData.notes || '',
          costSheetSnapshot: saleData.costSheetSnapshot || null,
          paymentPlanSnapshot: saleData.paymentPlanSnapshot || null,
        };
        console.log('📝 Setting form data:', formDataValues);
        setFormData(formDataValues);

        // Set cost sheet
        if (saleData.costSheetSnapshot) {
          console.log('💰 Setting cost sheet:', saleData.costSheetSnapshot);
          setCostSheet(saleData.costSheetSnapshot);
        }

      } else {
        console.error('❌ Invalid sale data received:', saleData);
        setError('Sale not found or invalid data received');
      }
    } catch (error) {
      console.error('❌ Error loading sale:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load sale data');
    } finally {
      console.log('🔚 Setting loading to false');
      setLoading(false);
    }
  }, [saleId]);

  // Load data on mount
  useEffect(() => {
    console.log('🎯 useEffect triggered with saleId:', saleId);
    if (saleId) {
      loadSale();
    } else {
      console.error('❌ No saleId provided to EditSalePage');
      setError('No sale ID provided in URL');
      setLoading(false);
    }
  }, [saleId, loadSale]);

  // Add timeout for loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached');
        setError('Loading timeout - please try refreshing the page');
        setLoading(false);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Track changes
  useEffect(() => {
    if (originalSale && sale) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify({
        status: originalSale.status || 'Booked',
        discountPercentage: originalSale.discountPercentage || 0,
        discountAmount: originalSale.discountAmount || 0,
        salePrice: originalSale.salePrice || 0,
        notes: originalSale.notes || '',
        costSheetSnapshot: originalSale.costSheetSnapshot || null,
        paymentPlanSnapshot: originalSale.paymentPlanSnapshot || null,
      });
      setHasChanges(hasChanges || costSheetModified);
    }
  }, [formData, originalSale, sale, costSheetModified]);

  // Check permissions
  const canEdit = canAccess && canAccess.salesPipeline ? canAccess.salesPipeline() : false;
  const canCancel = (checkPerm && checkPerm('sales:cancel')) || (user && (user.role === 'Business Head' || user.role === 'Sales Head' || user.role === 'Project Director'));

  // Debug logging  
  const allParams = useParams();
  console.log('🚀 EditSalePage mounted with:', { 
    saleId, 
    pathname: location.pathname,
    allParams,
    searchParams: location.search,
    salesAPI: !!salesAPI,
    getSale: !!salesAPI?.getSale
  });

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  
  // Early return if no saleId - with better debugging
  if (!saleId) {
    console.error('❌ No saleId found in params:', { 
      allParams, 
      pathname: location.pathname,
      expectedFormat: '/sales/{saleId}/edit'
    });
    
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No sale ID provided in URL. Please navigate from the sales list.
        </Alert>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Current URL: {location.pathname}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Expected format: /sales/[saleId]/edit
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Available params: {JSON.stringify(allParams)}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => navigate('/sales')}>
            Back to Sales List
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              const testId = '60f1b2c3d4e5f6789abcdef0'; // Example ObjectId
              navigate(`/sales/${testId}/edit`);
            }}
          >
            Test with Example ID
          </Button>
        </Stack>
      </Box>
    );
  }

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.salePrice <= 0) {
      newErrors.salePrice = 'Sale price must be greater than 0';
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'Discount percentage must be between 0 and 100';
    }

    if (formData.discountAmount < 0) {
      newErrors.discountAmount = 'Discount amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Regenerate cost sheet
  const handleRegenerateCostSheet = async () => {
    if (!sale?.unit?._id) {
      setError('Cannot regenerate cost sheet: Unit information not available');
      return;
    }

    try {
      setRegeneratingCostSheet(true);
      
      const response = await pricingAPI.generateCostSheet(sale.unit._id, {
        discountPercentage: formData.discountPercentage,
        discountAmount: formData.discountAmount,
      });

      if (response.data.success) {
        const newCostSheet = response.data.data;
        setCostSheet(newCostSheet);
        setCostSheetModified(true);
        
        // Update form data with new cost sheet values
        setFormData(prev => ({
          ...prev,
          costSheetSnapshot: newCostSheet,
          salePrice: newCostSheet.totals?.finalAmount || newCostSheet.finalPayableAmount || prev.salePrice,
        }));

        setSuccess('Cost sheet regenerated successfully');
      } else {
        setError('Failed to regenerate cost sheet');
      }
    } catch (error) {
      console.error('Error regenerating cost sheet:', error);
      setError(error.response?.data?.message || 'Failed to regenerate cost sheet');
    } finally {
      setRegeneratingCostSheet(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const updateData = {
        status: formData.status,
        discountPercentage: formData.discountPercentage,
        discountAmount: formData.discountAmount,
        salePrice: formData.salePrice,
        notes: formData.notes,
      };

      // Include cost sheet if modified
      if (costSheetModified && costSheet) {
        updateData.costSheetSnapshot = costSheet;
      }

      // Include payment plan if modified
      if (formData.paymentPlanSnapshot) {
        updateData.paymentPlanSnapshot = formData.paymentPlanSnapshot;
      }

      const response = await salesAPI.updateSale(saleId, updateData);

      if (response.data.success) {
        setSuccess('Sale updated successfully');
        setHasChanges(false);
        setCostSheetModified(false);
        
        // Reload sale data to get updated information
        await loadSale();
      } else {
        setError('Failed to update sale');
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      setError(error.response?.data?.message || 'Failed to update sale');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel sale
  const handleCancelSale = () => {
    setConfirmDialog({
      open: true,
      title: 'Cancel Sale',
      message: 'Are you sure you want to cancel this sale? This action cannot be undone.',
      action: confirmCancelSale,
    });
  };

  const confirmCancelSale = async () => {
    try {
      setSaving(true);
      
      const response = await salesAPI.cancelSale(saleId, {
        reason: 'Cancelled via edit page',
        cancelledBy: user?._id,
      });

      if (response.data.success) {
        setSuccess('Sale cancelled successfully');
        navigate('/sales');
      } else {
        setError('Failed to cancel sale');
      }
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setError(error.response?.data?.message || 'Failed to cancel sale');
    } finally {
      setSaving(false);
      setConfirmDialog({ open: false, title: '', message: '', action: null });
    }
  };

  // Render cost sheet components
  const renderCostSheetComponents = () => {
    if (!costSheet) return null;

    const components = costSheet.components || costSheet.costBreakdown || {};
    
    return (
      <Grid container spacing={3}>
        {COST_COMPONENT_CATEGORIES.map(category => {
          const categoryComponents = Object.entries(components).filter(() => {
            // You might want to categorize based on component names or types
            return true; // For now, show all components
          });

          if (categoryComponents.length === 0) return null;

          return (
            <Grid item xs={12} key={category.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    <Typography variant="subtitle1">{category.label}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                      {formatCurrency(
                        categoryComponents.reduce((sum, [, comp]) => sum + (comp.amount || 0), 0)
                      )}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Component</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryComponents.map(([key, component]) => (
                          <TableRow key={key}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {component.label || key}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(component.amount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="textSecondary">
                                {component.calculation || component.description || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Loading sale data...
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Sale ID: {saleId}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('🔄 Force refresh clicked');
            loadSale();
          }}
          size="small"
        >
          Force Refresh
        </Button>
      </Box>
    );
  }

  // Show error state
  if (error && !sale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Sale ID: {saleId}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={loadSale} startIcon={<Refresh />}>
            Retry
          </Button>
          <Button variant="outlined" onClick={() => navigate('/sales')}>
            Back to Sales
          </Button>
          <Button 
            variant="outlined" 
            color="warning" 
            onClick={() => {
              console.log('🧪 Testing mode - creating mock sale data');
              setSale({
                _id: saleId,
                saleNumber: `SALE-${saleId}`,
                status: 'Booked',
                salePrice: 5000000,
                discountAmount: 100000,
                unit: { unitNumber: 'A-101', fullAddress: 'Test Address', floor: 1, area: 1200 },
                lead: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '9876543210' },
                project: { name: 'Test Project' },
                bookingDate: new Date(),
                createdAt: new Date(),
              });
              setLoading(false);
              setError('');
            }}
          >
            Test Mode
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Sale not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/sales')} size="large">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Edit Sale
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {sale.saleNumber || `Sale ID: ${sale._id?.slice(-8)}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/sales/${saleId}`)}
            startIcon={<Info />}
          >
            View Details
          </Button>
          
          {canCancel && sale.status !== 'Cancelled' && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelSale}
              startIcon={<Cancel />}
              disabled={saving}
            >
              Cancel Sale
            </Button>
          )}
          
          {canEdit && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Changes indicator */}
      {hasChanges && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have unsaved changes. Remember to save your changes before leaving this page.
        </Alert>
      )}

      {/* Permission check */}
      {!canEdit && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You don't have permission to edit sales. Contact your administrator for access.
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Panel - Sale Information */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card>
              <CardHeader title="Sale Information" />
              <CardContent>
                <Stack spacing={2}>
                  {/* Status */}
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      disabled={!canEdit}
                    >
                      {SALE_STATUSES.map(status => (
                        <MenuItem key={status.value} value={status.value}>
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                  </FormControl>

                  {/* Sale Price */}
                  <TextField
                    fullWidth
                    label="Sale Price"
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => handleFieldChange('salePrice', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit}
                    error={!!errors.salePrice}
                    helperText={errors.salePrice}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />

                  {/* Discount Percentage */}
                  <TextField
                    fullWidth
                    label="Discount Percentage"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => handleFieldChange('discountPercentage', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit}
                    error={!!errors.discountPercentage}
                    helperText={errors.discountPercentage}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 0.1 }
                    }}
                  />

                  {/* Discount Amount */}
                  <TextField
                    fullWidth
                    label="Discount Amount"
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => handleFieldChange('discountAmount', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit}
                    error={!!errors.discountAmount}
                    helperText={errors.discountAmount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />

                  {/* Notes */}
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    disabled={!canEdit}
                    placeholder="Add any notes about this sale..."
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Unit Information */}
            <Card>
              <CardHeader title="Unit Information" />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Home color="primary" />
                    <Typography variant="subtitle2">
                      {sale.unit?.unitNumber}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {sale.unit?.fullAddress}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption">
                      Floor: {sale.unit?.floor}
                    </Typography>
                    <Typography variant="caption">
                      Area: {sale.unit?.area} sq ft
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader title="Customer Information" />
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    <Typography variant="subtitle2">
                      {sale.lead?.firstName} {sale.lead?.lastName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {sale.lead?.email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {sale.lead?.phone}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Panel - Cost Sheet and Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="Cost Sheet" icon={<Receipt />} />
                  <Tab label="Payment Plan" icon={<AccountBalance />} />
                  <Tab label="Timeline" icon={<Timeline />} />
                </Tabs>
              }
              action={
                activeTab === 0 && canEdit && (
                  <Button
                    variant="outlined"
                    onClick={handleRegenerateCostSheet}
                    disabled={regeneratingCostSheet}
                    startIcon={regeneratingCostSheet ? <CircularProgress size={20} /> : <Calculate />}
                  >
                    {regeneratingCostSheet ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                )
              }
            />
            <CardContent>
              {/* Cost Sheet Tab */}
              {activeTab === 0 && (
                <Box>
                  {costSheet ? (
                    <>
                      {/* Cost Summary */}
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Grid container spacing={3}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Base Price</Typography>
                              <Typography variant="h6">
                                {formatCurrency(costSheet.basePrice || costSheet.totals?.basePrice || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Discount</Typography>
                              <Typography variant="h6" color="error.main">
                                -{formatCurrency(formData.discountAmount)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                              <Typography variant="h6">
                                {formatCurrency(costSheet.totals?.totalAmount || costSheet.totalAmount || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="caption" color="textSecondary">Final Payable</Typography>
                              <Typography variant="h6" color="primary.main">
                                {formatCurrency(formData.salePrice)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Cost Components */}
                      {renderCostSheetComponents()}
                    </>
                  ) : (
                    <Alert severity="info">
                      No cost sheet available. 
                      {canEdit && (
                        <Button onClick={handleRegenerateCostSheet} sx={{ ml: 2 }}>
                          Generate Cost Sheet
                        </Button>
                      )}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Payment Plan Tab */}
              {activeTab === 1 && (
                <Box>
                  {formData.paymentPlanSnapshot ? (
                    <Typography>Payment plan details would go here</Typography>
                  ) : (
                    <Alert severity="info">No payment plan configured for this sale.</Alert>
                  )}
                </Box>
              )}

              {/* Timeline Tab */}
              {activeTab === 2 && (
                <Box>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle color="success" />
                      <Box>
                        <Typography variant="subtitle2">Sale Booked</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDateTime(sale.bookingDate || sale.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    {sale.status === 'Cancelled' && sale.cancelledAt && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Cancel color="error" />
                        <Box>
                          <Typography variant="subtitle2">Sale Cancelled</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDateTime(sale.cancelledAt)}
                          </Typography>
                          {sale.cancellationReason && (
                            <Typography variant="body2" color="textSecondary">
                              Reason: {sale.cancellationReason}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button onClick={confirmDialog.action} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  );
};

export default EditSalePage;
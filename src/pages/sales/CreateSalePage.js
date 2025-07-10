// File: src/pages/sales/CreateSalePage.js
// Description: Comprehensive sale creation page with unit selection, cost sheet generation, and booking
// Version: 1.0 - Production-grade sale creation interface with real-time calculations
// Location: src/pages/sales/CreateSalePage.js

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
  Autocomplete,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Tooltip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Fab,
  InputAdornment,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Receipt,
  Search,
  Clear,
  Add,
  ExpandMore,
  Visibility,
  Calculate,
  Person,
  Home,
  AttachMoney,
  Percent,
  Check,
  Warning,
  Info,
  AccountBalance,
  Print,
  Email,
  WhatsApp,
  Refresh,
  FilterList,
  ViewModule,
  ViewList,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, projectAPI, unitAPI, leadAPI, pricingAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/formatters';

// Steps configuration
const SALE_STEPS = [
  {
    label: 'Select Unit',
    description: 'Choose the unit to book',
    icon: Home,
  },
  {
    label: 'Select Customer',
    description: 'Choose or add customer',
    icon: Person,
  },
  {
    label: 'Generate Cost Sheet',
    description: 'Calculate pricing and discounts',
    icon: Calculate,
  },
  {
    label: 'Review & Book',
    description: 'Confirm and create sale',
    icon: Check,
  },
];

// Unit availability status
const UNIT_STATUSES = {
  available: { label: 'Available', color: 'success' },
  blocked: { label: 'Blocked', color: 'warning' },
  sold: { label: 'Sold', color: 'error' },
  reserved: { label: 'Reserved', color: 'info' },
};

// Safe display helper
const getSafeDisplayValue = (value, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    // Handle address objects
    if (value.city || value.state || value.addressLine1) {
      const parts = [];
      if (value.addressLine1) parts.push(value.addressLine1);
      if (value.addressLine2) parts.push(value.addressLine2);
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.pincode) parts.push(value.pincode);
      return parts.filter(Boolean).join(', ') || fallback;
    }
    return value.name || value.title || value.value || fallback;
  }
  return fallback;
};

// Unit Selection Component
const UnitSelection = ({ 
  selectedUnit, 
  onUnitSelect, 
  projects, 
  units, 
  loading,
  onRefresh,
  filters,
  onFilterChange 
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter units based on search and filters
  const filteredUnits = useMemo(() => {
    let filtered = units.filter(unit => unit.status === 'available');
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(unit => 
        unit.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.unitType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.tower?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply project filter
    if (filters.project && filters.project !== 'all') {
      filtered = filtered.filter(unit => unit.project === filters.project);
    }

    // Apply unit type filter
    if (filters.unitType && filters.unitType !== 'all') {
      filtered = filtered.filter(unit => unit.unitType === filters.unitType);
    }

    // Apply tower filter
    if (filters.tower && filters.tower !== 'all') {
      filtered = filtered.filter(unit => unit.tower?._id === filters.tower);
    }

    return filtered;
  }, [units, searchQuery, filters]);

  const handleUnitClick = (unit) => {
    onUnitSelect(unit);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchQuery && (
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <Clear />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project || 'all'}
                  label="Project"
                  onChange={(e) => onFilterChange('project', e.target.value)}
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Unit Type</InputLabel>
                <Select
                  value={filters.unitType || 'all'}
                  label="Unit Type"
                  onChange={(e) => onFilterChange('unitType', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="1BHK">1BHK</MenuItem>
                  <MenuItem value="2BHK">2BHK</MenuItem>
                  <MenuItem value="3BHK">3BHK</MenuItem>
                  <MenuItem value="4BHK">4BHK</MenuItem>
                  <MenuItem value="Studio">Studio</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                >
                  <ViewList />
                </IconButton>
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModule />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Units Display */}
      {filteredUnits.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No available units found matching your criteria.
        </Alert>
      ) : (
        <Card>
          <CardHeader
            title={`Available Units (${filteredUnits.length})`}
            action={
              <Typography variant="body2" color="textSecondary">
                Click on a unit to select
              </Typography>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Unit Number</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Tower</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Floor</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUnits.map((unit) => {
                    const project = projects.find(p => p._id === unit.project);
                    const isSelected = selectedUnit?._id === unit._id;
                    
                    return (
                      <TableRow
                        key={unit._id}
                        hover
                        selected={isSelected}
                        sx={{ 
                          cursor: 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: 'primary.50',
                          }
                        }}
                        onClick={() => handleUnitClick(unit)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {unit.unitNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {project?.name || 'Unknown Project'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getSafeDisplayValue(unit.tower?.name)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {unit.unitType || unit.type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {unit.builtupArea || unit.area} sq ft
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {unit.floor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {formatCurrency(unit.currentPrice || unit.basePrice)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={UNIT_STATUSES[unit.status]?.label || unit.status}
                            color={UNIT_STATUSES[unit.status]?.color || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isSelected ? 'contained' : 'outlined'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnitClick(unit);
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Selected Unit Summary */}
      {selectedUnit && (
        <Card sx={{ mt: 3, border: '2px solid', borderColor: 'primary.main' }}>
          <CardHeader
            title="Selected Unit"
            avatar={<Home color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Unit Number
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedUnit.unitNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Project
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {projects.find(p => p._id === selectedUnit.project)?.name || 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Type & Area
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedUnit.unitType} • {selectedUnit.builtupArea || selectedUnit.area} sq ft
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Base Price
                </Typography>
                <Typography variant="h6" fontWeight="medium" color="primary">
                  {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Customer Selection Component
const CustomerSelection = ({ 
  selectedCustomer, 
  onCustomerSelect, 
  leads, 
  loading,
  onRefresh,
  onCreateNew 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    
    return leads.filter(lead => 
      lead.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)
    );
  }, [leads, searchQuery]);

  const handleCustomerClick = (customer) => {
    onCustomerSelect(customer);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchQuery && (
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <Clear />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
                fullWidth
              >
                Add New Customer
              </Button>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Display */}
      {filteredLeads.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No customers found matching your criteria.
        </Alert>
      ) : (
        <Card>
          <CardHeader
            title={`Select Customer (${filteredLeads.length})`}
            action={
              <Typography variant="body2" color="textSecondary">
                Click on a customer to select
              </Typography>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedCustomer?._id === lead._id;
                    const customerName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
                    
                    return (
                      <TableRow
                        key={lead._id}
                        hover
                        selected={isSelected}
                        sx={{ 
                          cursor: 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: 'primary.50',
                          }
                        }}
                        onClick={() => handleCustomerClick(lead)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {customerName || 'Unknown Name'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lead.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatPhoneNumber(lead.phone) || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lead.source || lead.leadSource || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.status || 'New'}
                            color={lead.status === 'Hot' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isSelected ? 'contained' : 'outlined'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomerClick(lead);
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Selected Customer Summary */}
      {selectedCustomer && (
        <Card sx={{ mt: 3, border: '2px solid', borderColor: 'primary.main' }}>
          <CardHeader
            title="Selected Customer"
            avatar={<Person color="primary" />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Customer Name
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedCustomer.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Phone
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {formatPhoneNumber(selectedCustomer.phone) || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Lead Source
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedCustomer.source || selectedCustomer.leadSource || '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Create New Customer Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            For now, please use the Lead Management section to add new customers.
            You can navigate to Leads → Add New Lead to create a new customer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setShowCreateDialog(false);
              window.open('/leads/create', '_blank');
            }}
            variant="contained"
          >
            Go to Add Lead
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Cost Sheet Component
const CostSheet = ({ 
  selectedUnit, 
  selectedCustomer, 
  costSheet,
  onGenerateCostSheet,
  discount,
  onDiscountChange,
  loading 
}) => {
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
  const [discountValue, setDiscountValue] = useState(0);

  const handleDiscountChange = (type, value) => {
    setDiscountType(type);
    setDiscountValue(value);
    onDiscountChange(type, value);
  };

  if (!selectedUnit || !selectedCustomer) {
    return (
      <Alert severity="info">
        Please select both a unit and customer to generate the cost sheet.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Generate Cost Sheet */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Generate Cost Sheet"
          action={
            <Button
              variant="contained"
              startIcon={<Calculate />}
              onClick={onGenerateCostSheet}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Cost Sheet'}
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Discount Configuration */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Discount Configuration
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={discountType}
                  label="Discount Type"
                  onChange={(e) => handleDiscountChange(e.target.value, discountValue)}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="amount">Fixed Amount (₹)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label={`Discount ${discountType === 'percentage' ? 'Percentage' : 'Amount'}`}
                type="number"
                value={discountValue}
                onChange={(e) => handleDiscountChange(discountType, parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {discountType === 'percentage' ? <Percent /> : <AttachMoney />}
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  min: 0,
                  max: discountType === 'percentage' ? 100 : undefined,
                }}
              />
            </Grid>

            {/* Unit Summary */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Unit Summary
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Unit: {selectedUnit.unitNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Type: {selectedUnit.unitType}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Area: {selectedUnit.builtupArea || selectedUnit.area} sq ft
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Base Price: {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cost Sheet Display */}
      {costSheet && (
        <Card>
          <CardHeader
            title="Cost Sheet"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<Print />} size="small">
                  Print
                </Button>
                <Button variant="outlined" startIcon={<Email />} size="small">
                  Email
                </Button>
              </Box>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costSheet.breakdown?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={item.isBold ? 'bold' : 'normal'}>
                          {item.item}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={item.isBold ? 'bold' : 'normal'}
                          color={item.amount < 0 ? 'success.main' : 'inherit'}
                        >
                          {formatCurrency(item.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <Typography variant="h6" fontWeight="bold">
                        Total Payable Amount
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(costSheet.finalPayableAmount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Review and Book Component
const ReviewAndBook = ({ 
  selectedUnit, 
  selectedCustomer, 
  costSheet,
  onCreateSale,
  loading,
  projects 
}) => {
  if (!selectedUnit || !selectedCustomer || !costSheet) {
    return (
      <Alert severity="warning">
        Please complete all previous steps before reviewing the sale.
      </Alert>
    );
  }

  const project = projects.find(p => p._id === selectedUnit.project);
  const customerName = `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();

  return (
    <Box>
      {/* Sale Summary */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Sale Summary"
          action={
            <Typography variant="h6" color="primary">
              {formatCurrency(costSheet.finalPayableAmount)}
            </Typography>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Property Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Project: {project?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Unit: {selectedUnit.unitNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Type: {selectedUnit.unitType}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Area: {selectedUnit.builtupArea || selectedUnit.area} sq ft
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Floor: {selectedUnit.floor}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tower: {getSafeDisplayValue(selectedUnit.tower?.name)}
                </Typography>
              </Box>
            </Grid>

            {/* Customer Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Customer Details
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Name: {customerName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Email: {selectedCustomer.email || '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Phone: {formatPhoneNumber(selectedCustomer.phone) || '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Source: {selectedCustomer.source || selectedCustomer.leadSource || '-'}
                </Typography>
              </Box>
            </Grid>

            {/* Pricing Summary */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Pricing Summary
              </Typography>
              <Box sx={{ p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Base Price:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
                    </Typography>
                  </Grid>
                  
                  {costSheet.breakdown?.filter(item => item.item !== 'Base Price').map((item, index) => (
                    <React.Fragment key={index}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          {item.item}:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography 
                          variant="body2" 
                          align="right"
                          color={item.amount < 0 ? 'success.main' : 'inherit'}
                        >
                          {formatCurrency(item.amount)}
                        </Typography>
                      </Grid>
                    </React.Fragment>
                  ))}
                  
                  <Grid item xs={6}>
                    <Typography variant="h6" fontWeight="bold">
                      Total Amount:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" fontWeight="bold" color="primary" align="right">
                      {formatCurrency(costSheet.finalPayableAmount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Booking Actions */}
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ready to Book?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please review all details above before confirming the booking.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={onCreateSale}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Creating Sale...' : 'Confirm & Book Unit'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// Main Create Sale Page Component
const CreateSalePage = () => {
  const navigate = useNavigate();
  const { user, canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  // State management - ALL HOOKS MUST BE AT THE TOP
  const [activeStep, setActiveStep] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [costSheet, setCostSheet] = useState(null);
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  
  // Data states
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [leads, setLeads] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState({ projects: true, units: true, leads: true });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || 'all',
    unitType: 'all',
    tower: 'all',
  });

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Check permissions AFTER all hooks are defined
  if (!canAccess.salesPipeline()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to create sales.
        </Alert>
      </Box>
    );
  }

  const fetchAllData = async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [projectsResult, unitsResult, leadsResult] = await Promise.allSettled([
        projectAPI.getProjects(),
        unitAPI.getUnits(),
        leadAPI.getLeads(),
      ]);

      // Process projects
      if (projectsResult.status === 'fulfilled') {
        const projectsData = projectsResult.value.data.data || projectsResult.value.data || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      // Process units
      if (unitsResult.status === 'fulfilled') {
        const unitsData = unitsResult.value.data.data || unitsResult.value.data || [];
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      }

      // Process leads
      if (leadsResult.status === 'fulfilled') {
        const leadsData = leadsResult.value.data.data || leadsResult.value.data || [];
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      }

      setLoading({ projects: false, units: false, leads: false });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
      setLoading({ projects: false, units: false, leads: false });
    }
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  // Handle unit selection
  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setCostSheet(null); // Reset cost sheet when unit changes
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCostSheet(null); // Reset cost sheet when customer changes
  };

  // Handle cost sheet generation
  const handleGenerateCostSheet = async () => {
    if (!selectedUnit) return;

    try {
      setLoading(prev => ({ ...prev, costSheet: true }));
      
      const response = await pricingAPI.generateCostSheet(selectedUnit._id, {
        discountPercentage: discount.type === 'percentage' ? discount.value : 0,
        discountAmount: discount.type === 'amount' ? discount.value : 0,
      });

      const costSheetData = response.data.data || response.data;
      setCostSheet(costSheetData);
      
    } catch (error) {
      console.error('Error generating cost sheet:', error);
      setError('Failed to generate cost sheet. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, costSheet: false }));
    }
  };

  // Handle discount change
  const handleDiscountChange = (type, value) => {
    setDiscount({ type, value });
    setCostSheet(null); // Reset cost sheet when discount changes
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle create sale
  const handleCreateSale = async () => {
    if (!selectedUnit || !selectedCustomer || !costSheet) return;

    try {
      setSubmitting(true);
      
      const saleData = {
        unitId: selectedUnit._id,
        leadId: selectedCustomer._id,
        discountPercentage: discount.type === 'percentage' ? discount.value : 0,
        discountAmount: discount.type === 'amount' ? discount.value : 0,
      };

      const response = await salesAPI.createSale(saleData);
      const createdSale = response.data.data || response.data;

      // Navigate to sale detail page
      navigate(`/sales/${createdSale._id}`, {
        state: { message: 'Sale created successfully!' }
      });
      
    } catch (error) {
      console.error('Error creating sale:', error);
      setError('Failed to create sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <UnitSelection
            selectedUnit={selectedUnit}
            onUnitSelect={handleUnitSelect}
            projects={projects}
            units={units}
            loading={loading.units}
            onRefresh={fetchAllData}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        );
      case 1:
        return (
          <CustomerSelection
            selectedCustomer={selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
            leads={leads}
            loading={loading.leads}
            onRefresh={fetchAllData}
            onCreateNew={() => navigate('/leads/create')}
          />
        );
      case 2:
        return (
          <CostSheet
            selectedUnit={selectedUnit}
            selectedCustomer={selectedCustomer}
            costSheet={costSheet}
            onGenerateCostSheet={handleGenerateCostSheet}
            discount={discount}
            onDiscountChange={handleDiscountChange}
            loading={loading.costSheet}
          />
        );
      case 3:
        return (
          <ReviewAndBook
            selectedUnit={selectedUnit}
            selectedCustomer={selectedCustomer}
            costSheet={costSheet}
            onCreateSale={handleCreateSale}
            loading={submitting}
            projects={projects}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/sales')} size="large">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Create New Sale
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Book a unit for your customer
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Progress Steps */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
            {SALE_STEPS.map((step, index) => (
              <Step key={step.label} completed={index < activeStep}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Navigation Buttons */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep === SALE_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateSale}
                  disabled={!selectedUnit || !selectedCustomer || !costSheet || submitting}
                  startIcon={<Save />}
                >
                  {submitting ? 'Creating Sale...' : 'Create Sale'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && !selectedUnit) ||
                    (activeStep === 1 && !selectedCustomer) ||
                    (activeStep === 2 && !costSheet)
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateSalePage;
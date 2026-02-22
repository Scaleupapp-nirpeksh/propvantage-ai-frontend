/**
 * File: src/pages/sales/CreateSalePage.js
 * Description: CORRECTED Enhanced sale creation page with comprehensive cost sheet and payment plan integration
 * Version: 3.1 - Fixed project resolution and payment template loading
 * Location: src/pages/sales/CreateSalePage.js
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Receipt,
  Search,
  Clear,
  Add,
  Calculate,
  Person,
  Home,
  Check,
  Warning,
  Info,
  Print,
  Email,
  Refresh,
  ViewModule,
  ViewList,
  Phone,
  CheckCircle,
  Cancel,
  Star,
  ExpandMore,
  Assessment,
  Payment,
  Download,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { projectAPI, unitAPI, leadAPI, salesAPI, projectPaymentAPI } from '../../services/api';
import { formatCurrency, formatDate, formatPhoneNumber, formatPercentage } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const SALE_STEPS = [
  {
    id: 'unit',
    label: 'Select Unit',
    description: 'Choose the unit to book',
    icon: Home,
    required: true,
  },
  {
    id: 'customer',
    label: 'Select Customer',
    description: 'Choose or add customer',
    icon: Person,
    required: true,
  },
  {
    id: 'pricing',
    label: 'Generate Cost Sheet',
    description: 'Calculate detailed pricing',
    icon: Calculate,
    required: true,
  },
  {
    id: 'payment',
    label: 'Payment Plan',
    description: 'Select payment schedule',
    icon: Payment,
    required: true,
  },
  {
    id: 'review',
    label: 'Review & Book',
    description: 'Confirm and create sale',
    icon: CheckCircle,
    required: true,
  },
];

const UNIT_STATUSES = {
  available: { label: 'Available', color: 'success', icon: CheckCircle },
  blocked: { label: 'Blocked', color: 'warning', icon: Warning },
  sold: { label: 'Sold', color: 'error', icon: Cancel },
  reserved: { label: 'Reserved', color: 'info', icon: Info },
};

const COST_COMPONENTS = [
  {
    id: 'basePrice',
    label: 'Base Unit Price',
    description: 'Standard unit price as per rate card',
    category: 'primary',
    included: true,
    editable: false,
  },
  {
    id: 'premiumCharges',
    label: 'Premium Charges',
    description: 'Floor premium, corner premium, park facing, etc.',
    category: 'primary',
    included: true,
    editable: true,
  },
  {
    id: 'parkingCharges',
    label: 'Parking Charges',
    description: 'Covered/Open parking charges',
    category: 'primary',
    included: true,
    editable: true,
  },
  {
    id: 'clubMembership',
    label: 'Club Membership',
    description: 'Clubhouse and amenities access',
    category: 'amenities',
    included: true,
    editable: true,
  },
  {
    id: 'infrastructureDevelopment',
    label: 'Infrastructure Development Charges',
    description: 'IDC for common infrastructure',
    category: 'development',
    included: true,
    editable: false,
  },
  {
    id: 'powerBackup',
    label: 'Power Backup Charges',
    description: 'Generator and UPS infrastructure',
    category: 'utilities',
    included: true,
    editable: true,
  },
  {
    id: 'maintenanceDeposit',
    label: 'Maintenance Security Deposit',
    description: 'Refundable maintenance deposit',
    category: 'deposits',
    included: true,
    editable: true,
  },
  {
    id: 'legalCharges',
    label: 'Legal & Documentation',
    description: 'Registration, stamp duty, legal fees',
    category: 'legal',
    included: true,
    editable: false,
  },
  {
    id: 'gst',
    label: 'GST',
    description: 'Goods and Services Tax',
    category: 'taxes',
    included: true,
    editable: false,
  },
  {
    id: 'registrationCharges',
    label: 'Registration Charges',
    description: 'Property registration fees',
    category: 'legal',
    included: true,
    editable: false,
  },
];

const PREMIUM_FACTORS = {
  floor: {
    'ground': 0,
    'first': 2,
    'second': 4,
    'third': 6,
    'fourth': 8,
    'fifth': 10,
    'above_fifth': 12,
  },
  facing: {
    'east': 5,
    'west': 3,
    'north': 8,
    'south': 2,
    'northeast': 10,
    'northwest': 7,
    'southeast': 6,
    'southwest': 4,
  },
  features: {
    'park_facing': 15,
    'corner_unit': 10,
    'end_unit': 8,
    'terrace_access': 20,
    'garden_access': 12,
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getSafeDisplayValue = (value, fallback = '-') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
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

const getCustomerDisplayName = (customer) => {
  if (!customer) return 'Unknown Customer';
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return fullName || customer.email || customer.phone || 'Unknown Customer';
};


// FIXED: Enhanced project resolution function
const getProjectInfo = (projectId, projects) => {
  if (!projectId || !projects || !Array.isArray(projects)) return null;
  
  // Handle both string ID and object with _id
  let targetId;
  if (typeof projectId === 'string') {
    targetId = projectId;
  } else if (typeof projectId === 'object' && projectId._id) {
    targetId = projectId._id;
  } else if (typeof projectId === 'object' && projectId.id) {
    targetId = projectId.id;
  } else {
    console.warn('Invalid project identifier:', projectId);
    return null;
  }
  
  const foundProject = projects.find(p => p._id === targetId || p.id === targetId);
  if (!foundProject) {
    console.warn('Project not found for ID:', targetId, 'Available projects:', projects.map(p => ({ id: p._id, name: p.name })));
  }
  
  return foundProject || null;
};

// FIXED: Enhanced unit project resolution
const getUnitProject = (unit, projects) => {
  if (!unit || !projects) return null;
  
  // First try to get from unit.project object (if it's populated)
  if (unit.project && typeof unit.project === 'object' && unit.project.name) {
    // This is already a populated project object
    return unit.project;
  }
  
  // Then try to find by project ID
  const projectId = unit.project || unit.projectId;
  if (!projectId) {
    console.warn('No project ID found in unit:', unit);
    return null;
  }
  
  return getProjectInfo(projectId, projects);
};

// ============================================================================
// UNIT SELECTION COMPONENT
// ============================================================================

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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // FIXED: Enhanced filtering with proper project resolution and debugging
  const filteredUnits = useMemo(() => {
    let filtered = units.filter(unit => unit.status === 'available');
    
    console.log('🔍 Filtering units:', {
      totalUnits: units.length,
      availableUnits: filtered.length,
      projectFilter: filters.project,
      unitTypeFilter: filters.unitType,
      towerFilter: filters.tower
    });
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(unit => {
        const project = getUnitProject(unit, projects);
        return (
          unit.unitNumber?.toLowerCase().includes(query) ||
          unit.unitType?.toLowerCase().includes(query) ||
          unit.type?.toLowerCase().includes(query) ||
          unit.tower?.towerName?.toLowerCase().includes(query) ||
          unit.fullAddress?.toLowerCase().includes(query) ||
          project?.name?.toLowerCase().includes(query)
        );
      });
    }

    // Apply project filter
    if (filters.project && filters.project !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(unit => {
        const projectId = unit.project?._id || unit.project || unit.projectId;
        return projectId === filters.project;
      });
      console.log(`📊 Project filter applied: ${beforeFilter} -> ${filtered.length} units`);
    }

    // Apply unit type filter
    if (filters.unitType && filters.unitType !== 'all') {
      filtered = filtered.filter(unit => {
        const unitType = unit.unitType || unit.type;
        return unitType === filters.unitType;
      });
    }

    // Apply tower filter
    if (filters.tower && filters.tower !== 'all') {
      filtered = filtered.filter(unit => unit.tower?._id === filters.tower);
    }

    console.log('🎯 Final filtered units:', filtered.length);
    return filtered;
  }, [units, searchQuery, filters, projects]);

  const uniqueUnitTypes = useMemo(() => {
    const types = new Set();
    units.forEach(unit => {
      const unitType = unit.unitType || unit.type;
      if (unitType) types.add(unitType);
    });
    return Array.from(types);
  }, [units]);

  const uniqueTowers = useMemo(() => {
    const towersMap = new Map();
    units.forEach(unit => {
      if (unit.tower && unit.tower._id) {
        towersMap.set(unit.tower._id, unit.tower);
      }
    });
    return Array.from(towersMap.values());
  }, [units]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6">Loading available units...</Typography>
          <Typography variant="body2" color="textSecondary">
            Please wait while we fetch the latest unit availability
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Find Your Perfect Unit"
          subheader="Use the filters below to narrow down available units"
          action={
            <Badge badgeContent={filteredUnits.length} color="primary">
              <Home />
            </Badge>
          }
        />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by unit number, type, or address..."
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
                  {uniqueUnitTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tower</InputLabel>
                <Select
                  value={filters.tower || 'all'}
                  label="Tower"
                  onChange={(e) => onFilterChange('tower', e.target.value)}
                >
                  <MenuItem value="all">All Towers</MenuItem>
                  {uniqueTowers.map(tower => (
                    <MenuItem key={tower._id} value={tower._id}>
                      {getSafeDisplayValue(tower.towerName)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onRefresh}
                  fullWidth
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Units Display */}
      {filteredUnits.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">No units found</Typography>
          <Typography variant="body2">
            No available units match your current search criteria. Try adjusting your filters or search terms.
          </Typography>
        </Alert>
      ) : (
        <Card>
          <CardHeader
            title={`Available Units (${filteredUnits.length})`}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Table View">
                  <IconButton 
                    onClick={() => setViewMode('table')}
                    color={viewMode === 'table' ? 'primary' : 'default'}
                  >
                    <ViewList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Grid View">
                  <IconButton 
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <ViewModule />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Unit Details</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUnits.map((unit) => {
                    // FIXED: Proper project resolution
                    const project = getUnitProject(unit, projects);
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
                        onClick={() => onUnitSelect(unit)}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {unit.unitNumber}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {getSafeDisplayValue(unit.tower?.towerName)} • Floor {unit.floor}
                            </Typography>
                            {unit.features?.isParkFacing && (
                              <Chip label="Park Facing" size="small" color="success" sx={{ mt: 0.5, mr: 0.5 }} />
                            )}
                            {unit.features?.isCornerUnit && (
                              <Chip label="Corner Unit" size="small" color="info" sx={{ mt: 0.5, mr: 0.5 }} />
                            )}
                            {unit.features?.hasBalcony && (
                              <Chip label="Balcony" size="small" color="primary" sx={{ mt: 0.5, mr: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {project?.name || 'Unknown Project'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {project?.location?.city || project?.location || 'Unknown Location'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {unit.unitType || unit.type || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {unit.areaSqft || unit.builtupArea || unit.area || 'N/A'} sq ft
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {unit.specifications?.bedrooms || 'N/A'}BR • {unit.specifications?.bathrooms || 'N/A'}BA
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium" color="primary">
                            {formatCurrency(unit.currentPrice || unit.basePrice || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={UNIT_STATUSES[unit.status]?.label || unit.status}
                            color={UNIT_STATUSES[unit.status]?.color || 'default'}
                            size="small"
                            icon={React.createElement(UNIT_STATUSES[unit.status]?.icon || Info, { sx: { fontSize: 16 } })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isSelected ? 'contained' : 'outlined'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnitSelect(unit);
                            }}
                            startIcon={isSelected ? <Check /> : <Add />}
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

      {/* Selected Unit Summary (collapsible) */}
      {selectedUnit && (
        <Accordion defaultExpanded={false} sx={{ mt: 2, border: '1px solid', borderColor: 'primary.main' }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <CheckCircle color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                {selectedUnit.unitNumber} &mdash; {getUnitProject(selectedUnit, projects)?.name} &mdash; {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Unit Number
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedUnit.unitNumber}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getSafeDisplayValue(selectedUnit.tower?.towerName)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Project
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {getUnitProject(selectedUnit, projects)?.name || 'Unknown Project'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getUnitProject(selectedUnit, projects)?.location?.city || 'Unknown Location'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Configuration
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedUnit.unitType || selectedUnit.type}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedUnit.areaSqft || selectedUnit.builtupArea || selectedUnit.area} sq ft • Floor {selectedUnit.floor} • {selectedUnit.facing}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Base Price
                </Typography>
                <Typography variant="h6" fontWeight="medium" color="primary">
                  {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
                </Typography>
              </Grid>
              
              {/* Additional Details Row */}
              {selectedUnit.specifications && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Room Details
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedUnit.specifications.bedrooms}BR • {selectedUnit.specifications.bathrooms}BA • {selectedUnit.specifications.livingRooms}LR
                  </Typography>
                </Grid>
              )}
              
              {selectedUnit.features && Object.values(selectedUnit.features).some(Boolean) && (
                <Grid item xs={12} sm={6} md={9}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Special Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedUnit.features.isParkFacing && (
                      <Chip label="Park Facing" size="small" color="success" />
                    )}
                    {selectedUnit.features.isCornerUnit && (
                      <Chip label="Corner Unit" size="small" color="info" />
                    )}
                    {selectedUnit.features.hasBalcony && (
                      <Chip label="Has Balcony" size="small" color="primary" />
                    )}
                    {selectedUnit.features.hasServantRoom && (
                      <Chip label="Servant Room" size="small" color="secondary" />
                    )}
                    {selectedUnit.features.hasStudyRoom && (
                      <Chip label="Study Room" size="small" color="warning" />
                    )}
                    {selectedUnit.features.hasUtilityArea && (
                      <Chip label="Utility Area" size="small" color="default" />
                    )}
                    {selectedUnit.features.hasParkingSlot && (
                      <Chip label="Parking Included" size="small" color="success" />
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

// ============================================================================
// CUSTOMER SELECTION COMPONENT
// ============================================================================

const CustomerSelection = ({ 
  selectedCustomer, 
  onCustomerSelect, 
  leads, 
  loading,
  onRefresh,
  projects
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter leads based on search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      lead.firstName?.toLowerCase().includes(query) ||
      lead.lastName?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(searchQuery)
    );
  }, [leads, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6">Loading customers...</Typography>
          <Typography variant="body2" color="textSecondary">
            Fetching customer data from your CRM
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Select Customer"
          subheader="Choose an existing customer or create a new one"
          action={
            <Badge badgeContent={filteredLeads.length} color="primary">
              <Person />
            </Badge>
          }
        />
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or phone number..."
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
                variant="contained"
                startIcon={<Add />}
                onClick={() => window.open('/leads/create', '_blank')}
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
                Refresh List
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Display */}
      {filteredLeads.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">No customers found</Typography>
          <Typography variant="body2">
            {searchQuery ? 
              'No customers match your search criteria. Try a different search term.' :
              'No customers available. Add a new customer to get started.'
            }
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            startIcon={<Add />}
            onClick={() => window.open('/leads/create', '_blank')}
          >
            Add Your First Customer
          </Button>
        </Alert>
      ) : (
        <Card>
          <CardHeader
            title={`Choose Customer (${filteredLeads.length})`}
            action={
              <Typography variant="body2" color="textSecondary">
                Click on a customer to select them
              </Typography>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <List>
              {filteredLeads.map((lead, index) => {
                const isSelected = selectedCustomer?._id === lead._id;
                const customerName = getCustomerDisplayName(lead);
                // FIXED: Proper project resolution for leads
                const leadProject = getProjectInfo(lead.project?._id || lead.project, projects);
                
                return (
                  <React.Fragment key={lead._id}>
                    <ListItem
                      button
                      selected={isSelected}
                      onClick={() => onCustomerSelect(lead)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.50',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
                          {customerName[0] || 'C'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1" fontWeight="medium">
                              {customerName}
                            </Typography>
                            {lead.priority === 'Critical' && (
                              <Chip label="Critical" color="error" size="small" />
                            )}
                            {lead.priority === 'High' && (
                              <Chip label="High Priority" color="warning" size="small" />
                            )}
                            {lead.score && lead.score >= 90 && (
                              <Chip label={`Score: ${lead.score} (${lead.scoreGrade})`} color="success" size="small" />
                            )}
                            {lead.qualificationStatus === 'Pre-Approved' && (
                              <Chip label="Pre-Approved" color="info" size="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {lead.email && (
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Email sx={{ fontSize: 14 }} />
                                  {lead.email}
                                </Box>
                              )}
                              {lead.phone && (
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Phone sx={{ fontSize: 14 }} />
                                  {formatPhoneNumber(lead.phone)}
                                </Box>
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              {lead.source && (
                                <Chip 
                                  label={lead.source} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              )}
                              {lead.status && (
                                <Chip 
                                  label={lead.status} 
                                  size="small" 
                                  color={lead.status === 'Booked' ? 'success' : 'default'}
                                  variant="outlined" 
                                />
                              )}
                              {leadProject?.name && (
                                <Chip 
                                  label={leadProject.name} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined" 
                                />
                              )}
                              {lead.followUpSchedule?.isOverdue && (
                                <Chip 
                                  label={`Overdue: ${lead.followUpSchedule.overdueBy}d`} 
                                  size="small" 
                                  color="error"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {lead.phone && (
                            <Tooltip title="Call Customer">
                              <IconButton size="small" href={`tel:${lead.phone}`}>
                                <Phone fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {lead.email && (
                            <Tooltip title="Email Customer">
                              <IconButton size="small" href={`mailto:${lead.email}`}>
                                <Email fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Button
                            variant={isSelected ? 'contained' : 'outlined'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomerSelect(lead);
                            }}
                            startIcon={isSelected ? <Check /> : <Add />}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredLeads.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Selected Customer Summary (collapsible) */}
      {selectedCustomer && (
        <Accordion defaultExpanded={false} sx={{ mt: 2, border: '1px solid', borderColor: 'primary.main' }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <CheckCircle color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>
                {getCustomerDisplayName(selectedCustomer)} &mdash; {selectedCustomer.email || selectedCustomer.phone || ''}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Customer Name
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {getCustomerDisplayName(selectedCustomer)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Email Address
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedCustomer.email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Phone Number
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {formatPhoneNumber(selectedCustomer.phone) || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Lead Source
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {selectedCustomer.source || selectedCustomer.leadSource || '-'}
                </Typography>
              </Grid>
              
              {/* Additional Customer Details */}
              {(selectedCustomer.score || selectedCustomer.priority || selectedCustomer.qualificationStatus || selectedCustomer.status) && (
                <>
                  {selectedCustomer.score && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Lead Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="medium" color="success.main">
                          {selectedCustomer.score}
                        </Typography>
                        {selectedCustomer.scoreGrade && (
                          <Chip label={selectedCustomer.scoreGrade} size="small" color="success" />
                        )}
                      </Box>
                    </Grid>
                  )}
                  
                  {selectedCustomer.priority && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Priority Level
                      </Typography>
                      <Chip 
                        label={selectedCustomer.priority} 
                        color={
                          selectedCustomer.priority === 'Critical' ? 'error' : 
                          selectedCustomer.priority === 'High' ? 'warning' : 'default'
                        }
                        icon={<Star />}
                      />
                    </Grid>
                  )}
                  
                  {selectedCustomer.status && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Current Status
                      </Typography>
                      <Chip 
                        label={selectedCustomer.status} 
                        color={selectedCustomer.status === 'Booked' ? 'success' : 'primary'}
                        variant="outlined"
                      />
                    </Grid>
                  )}
                  
                  {selectedCustomer.project && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Interested Project
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {getProjectInfo(selectedCustomer.project._id || selectedCustomer.project, projects)?.name || 'Unknown Project'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {getProjectInfo(selectedCustomer.project._id || selectedCustomer.project, projects)?.location?.city || 'Unknown Location'}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedCustomer.engagementMetrics && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Engagement Details
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Response Rate: ${selectedCustomer.engagementMetrics.responseRate}%`} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`Preferred: ${selectedCustomer.engagementMetrics.preferredContactMethod}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        {selectedCustomer.followUpSchedule?.isOverdue && (
                          <Chip 
                            label={`Follow-up Overdue: ${selectedCustomer.followUpSchedule.overdueBy} days`} 
                            size="small" 
                            color="error"
                          />
                        )}
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

// ============================================================================
// ENHANCED COST SHEET COMPONENT
// ============================================================================

const EnhancedCostSheet = ({ 
  selectedUnit, 
  selectedCustomer, 
  costSheet,
  onGenerateCostSheet,
  discount,
  onDiscountChange,
  loading,
  projects 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [costComponents, setCostComponents] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // FIXED: Get project using proper resolution
  const project = getUnitProject(selectedUnit, projects);

  // Initialize cost components
  useEffect(() => {
    if (selectedUnit && project) {
      initializeCostComponents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, project]);

  const initializeCostComponents = () => {
    const basePrice = selectedUnit.currentPrice || selectedUnit.basePrice || 0;
    const unitArea = selectedUnit.areaSqft || selectedUnit.builtupArea || selectedUnit.area || 1000;
    
    const components = {
      basePrice: {
        amount: basePrice,
        calculation: `${formatCurrency(basePrice / unitArea)}/sq ft × ${unitArea} sq ft`,
        editable: false,
      },
      premiumCharges: {
        amount: calculatePremiumCharges(selectedUnit, basePrice),
        calculation: 'Floor + Facing + Feature premiums',
        editable: true,
      },
      parkingCharges: {
        amount: selectedUnit.features?.hasParkingSlot ? 200000 : 0,
        calculation: selectedUnit.features?.hasParkingSlot ? '1 covered parking slot' : 'No parking included',
        editable: true,
      },
      clubMembership: {
        amount: 150000,
        calculation: 'One-time club membership fee',
        editable: true,
      },
      infrastructureDevelopment: {
        amount: Math.round(basePrice * 0.02),
        calculation: '2% of base price',
        editable: false,
      },
      powerBackup: {
        amount: unitArea * 50,
        calculation: `₹50/sq ft × ${unitArea} sq ft`,
        editable: true,
      },
      maintenanceDeposit: {
        amount: unitArea * 25,
        calculation: `₹25/sq ft × ${unitArea} sq ft (Refundable)`,
        editable: true,
      },
      legalCharges: {
        amount: Math.round(basePrice * 0.01),
        calculation: '1% of base price',
        editable: false,
      },
      registrationCharges: {
        amount: Math.round(basePrice * 0.01),
        calculation: '1% of base price (approx)',
        editable: false,
      },
    };

    // Calculate GST on applicable components
    const gstApplicableAmount = components.basePrice.amount + 
                               components.premiumCharges.amount + 
                               components.parkingCharges.amount;
    components.gst = {
      amount: Math.round(gstApplicableAmount * 0.05),
      calculation: `5% GST on applicable components (${formatCurrency(gstApplicableAmount)})`,
      editable: false,
    };

    setCostComponents(components);
  };

  const calculatePremiumCharges = (unit, basePrice) => {
    let premium = 0;
    const premiumBase = basePrice * 0.01; // 1% base for premium calculations

    // Floor premium
    const floorKey = unit.floor <= 1 ? 'ground' : 
                     unit.floor === 2 ? 'first' :
                     unit.floor === 3 ? 'second' :
                     unit.floor === 4 ? 'third' :
                     unit.floor === 5 ? 'fourth' :
                     unit.floor === 6 ? 'fifth' : 'above_fifth';
    premium += premiumBase * (PREMIUM_FACTORS.floor[floorKey] || 0);

    // Facing premium
    const facingKey = unit.facing?.toLowerCase() || 'east';
    premium += premiumBase * (PREMIUM_FACTORS.facing[facingKey] || 0);

    // Feature premiums
    if (unit.features?.isParkFacing) premium += premiumBase * PREMIUM_FACTORS.features.park_facing;
    if (unit.features?.isCornerUnit) premium += premiumBase * PREMIUM_FACTORS.features.corner_unit;

    return Math.round(premium);
  };

  const handleComponentChange = (componentId, newAmount) => {
    setCostComponents(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        amount: parseFloat(newAmount) || 0,
      }
    }));
  };

  const calculateTotals = () => {
    const subtotal = Object.values(costComponents).reduce((sum, comp) => sum + (comp.amount || 0), 0);
    
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }

    const total = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      total,
      components: costComponents,
    };
  };

  const totals = calculateTotals();

  const generateDetailedCostSheet = async () => {
    try {
      
      const costSheetData = {
        unitDetails: {
          unitId: selectedUnit._id,
          unitNumber: selectedUnit.unitNumber,
          project: project?.name || 'Unknown Project',
          area: selectedUnit.areaSqft || selectedUnit.builtupArea || selectedUnit.area,
          type: selectedUnit.unitType || selectedUnit.type,
          floor: selectedUnit.floor,
          facing: selectedUnit.facing,
        },
        costBreakdown: Object.entries(costComponents).map(([key, component]) => {
          const componentDef = COST_COMPONENTS.find(c => c.id === key);
          return {
            id: key,
            item: componentDef?.label || key,
            description: componentDef?.description,
            category: componentDef?.category,
            amount: component.amount,
            calculation: component.calculation,
            editable: component.editable,
          };
        }),
        discountDetails: {
          type: discount.type,
          value: discount.value,
          amount: totals.discountAmount,
        },
        totals: {
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          finalAmount: totals.total,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: selectedCustomer._id,
      };

      onGenerateCostSheet(costSheetData);
      
    } catch (error) {
      console.error('Error generating cost sheet:', error);
    }
  };

  if (!selectedUnit || !selectedCustomer) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">Complete Previous Steps</Typography>
        <Typography variant="body2">
          Please select both a unit and customer before generating the cost sheet.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Cost Sheet Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Detailed Cost Sheet Generation"
          subheader="Configure all cost components and generate comprehensive pricing"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                  />
                }
                label="Advanced Mode"
              />
              <Button
                variant="contained"
                startIcon={<Calculate />}
                onClick={generateDetailedCostSheet}
                disabled={loading}
                size="large"
              >
                {loading ? 'Generating...' : 'Generate Cost Sheet'}
              </Button>
            </Box>
          }
        />
      </Card>

      {/* Cost Components Configuration */}
      <Grid container spacing={3}>
        {/* Unit & Customer Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Unit Summary" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Unit</Typography>
                  <Typography variant="h6">{selectedUnit.unitNumber}</Typography>
                  <Typography variant="caption">{project?.name || 'Unknown Project'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Configuration</Typography>
                  <Typography variant="body1">{selectedUnit.unitType || selectedUnit.type}</Typography>
                  <Typography variant="caption">
                    {selectedUnit.areaSqft || selectedUnit.area} sq ft • Floor {selectedUnit.floor} • {selectedUnit.facing}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Customer</Typography>
                  <Typography variant="body1">
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()}
                  </Typography>
                  <Typography variant="caption">{selectedCustomer.email}</Typography>
                </Box>
                <Divider />
                <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(totals.total)}
                  </Typography>
                  {totals.discountAmount > 0 && (
                    <Typography variant="caption" color="success.main">
                      Discount: {formatCurrency(totals.discountAmount)}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Components */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Cost Components" 
              action={
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="By Category" />
                  <Tab label="All Components" />
                </Tabs>
              }
            />
            <CardContent>
              {/* Component Categories */}
              {activeTab === 0 && (
                <Box>
                  {['primary', 'amenities', 'development', 'utilities', 'deposits', 'legal', 'taxes'].map(category => (
                    <Accordion key={category}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {category.replace(/([A-Z])/g, ' $1')} Components
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                          {formatCurrency(
                            Object.entries(costComponents)
                              .filter(([key]) => COST_COMPONENTS.find(c => c.id === key)?.category === category)
                              .reduce((sum, [, comp]) => sum + (comp.amount || 0), 0)
                          )}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {COST_COMPONENTS
                            .filter(comp => comp.category === category)
                            .map(componentDef => {
                              const component = costComponents[componentDef.id];
                              if (!component) return null;

                              return (
                                <Box key={componentDef.id}>
                                  <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="body2" fontWeight="medium">
                                        {componentDef.label}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {componentDef.description}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={component.amount}
                                        onChange={(e) => handleComponentChange(componentDef.id, e.target.value)}
                                        disabled={!component.editable || !showAdvanced}
                                        InputProps={{
                                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <Typography variant="caption" color="textSecondary">
                                        {component.calculation}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  <Divider sx={{ mt: 1 }} />
                                </Box>
                              );
                            })}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* All Components List */}
              {activeTab === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Component</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Calculation</TableCell>
                        <TableCell>Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(costComponents).map(([key, component]) => {
                        const componentDef = COST_COMPONENTS.find(c => c.id === key);
                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {componentDef?.label}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {componentDef?.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={component.amount}
                                onChange={(e) => handleComponentChange(key, e.target.value)}
                                disabled={!component.editable || !showAdvanced}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="textSecondary">
                                {component.calculation}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={componentDef?.category} 
                                size="small" 
                                variant="outlined"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Discount Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Discount Configuration" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={discount.type}
                      label="Discount Type"
                      onChange={(e) => onDiscountChange(e.target.value, discount.value)}
                    >
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="amount">Fixed Amount (₹)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Discount Value"
                    type="number"
                    value={discount.value}
                    onChange={(e) => onDiscountChange(discount.type, e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {discount.type === 'percentage' ? '%' : '₹'}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">Discount Amount</Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {formatCurrency(totals.discountAmount)}
                    </Typography>
                    <Typography variant="caption">
                      Customer saves {formatPercentage((totals.discountAmount / totals.subtotal) * 100)} on total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Generated Cost Sheet Display */}
      {costSheet && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Generated Cost Sheet"
            subheader={`Generated on ${formatDate(new Date())}`}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<Print />} size="small">
                  Print
                </Button>
                <Button variant="outlined" startIcon={<Email />} size="small">
                  Email
                </Button>
                <Button variant="outlined" startIcon={<Download />} size="small">
                  Export PDF
                </Button>
              </Box>
            }
          />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costSheet.costBreakdown?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.item}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {item.description}
                        </Typography>
                        {item.calculation && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {item.calculation}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.category} 
                          size="small" 
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Subtotal */}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="body1" fontWeight="bold">Subtotal</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(costSheet.totals?.subtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Discount */}
                  {costSheet.discountDetails?.amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body1" fontWeight="medium" color="success.main">
                          Discount ({costSheet.discountDetails.type === 'percentage' ? 
                            `${costSheet.discountDetails.value}%` : 
                            'Fixed Amount'})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="medium" color="success.main">
                          -{formatCurrency(costSheet.discountDetails.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}

                  {/* Final Total */}
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="h6" fontWeight="bold">Total Payable Amount</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(costSheet.totals?.finalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell />
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

// ============================================================================
// FIXED PAYMENT PLAN SELECTION COMPONENT
// ============================================================================

const PaymentPlanSelection = ({ 
  selectedUnit, 
  selectedCustomer, 
  costSheet,
  selectedPaymentPlan,
  onPaymentPlanSelect,
  paymentSchedule,
  onGenerateSchedule,
  loading,
  projects 
}) => {
  const [paymentTemplates, setPaymentTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showCustomPlan, setShowCustomPlan] = useState(false);

  // FIXED: Get project using proper resolution
  const project = getUnitProject(selectedUnit, projects);

  // FIXED: Use activePaymentTemplates from project data instead of API call
  useEffect(() => {
    if (selectedUnit && project) {
      console.log('🔄 Loading payment templates for project:', project.name, 'ID:', project._id);
      loadPaymentTemplates();
    } else {
      console.log('⚠️ Cannot load payment templates - missing unit or project:', {
        hasUnit: !!selectedUnit,
        hasProject: !!project,
        unitProject: selectedUnit?.project,
        resolvedProject: project?.name
      });
      setPaymentTemplates([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, project]);

  const loadPaymentTemplates = async () => {
    try {
      setTemplatesLoading(true);
      
      console.log('🔄 Loading payment templates for:', {
        unitId: selectedUnit._id,
        unitNumber: selectedUnit.unitNumber,
        projectId: project?._id,
        projectName: project?.name,
        projectHasTemplates: project?.activePaymentTemplates?.length > 0
      });
      
      // FIXED: Use activePaymentTemplates from project data
      if (project && project.activePaymentTemplates && project.activePaymentTemplates.length > 0) {
        console.log('✅ Using activePaymentTemplates from project:', project.activePaymentTemplates);
        const activeTemplates = project.activePaymentTemplates.filter(t => t.isActive !== false);
        setPaymentTemplates(activeTemplates);
      } else {
        console.log('⚠️ No activePaymentTemplates in project data, trying API fallback...');
        // Fallback: Try to fetch from API if not available in project data
        try {
          // FIXED: Extract proper project ID string
          const projectId = selectedUnit.project?._id || selectedUnit.project;
          if (!projectId) {
            console.error('❌ No project ID found for unit:', selectedUnit);
            setPaymentTemplates([]);
            return;
          }
          
          console.log('🌐 Fetching payment templates via API for project ID:', projectId);
          const response = await projectPaymentAPI.getPaymentPlanTemplates(projectId);
          const templates = response.data?.data || response.data || [];
          const activeTemplates = templates.filter(t => t.isActive);
          console.log('📦 API returned templates:', activeTemplates);
          setPaymentTemplates(activeTemplates);
        } catch (apiError) {
          console.error('❌ API fetch failed:', apiError);
          setPaymentTemplates([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading payment templates:', error);
      setPaymentTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateSelect = async (template) => {
    try {
      onPaymentPlanSelect(template);
      
      // Generate payment schedule based on template and cost sheet
      const schedule = generatePaymentSchedule(template, costSheet);
      onGenerateSchedule(schedule);
      
    } catch (error) {
      console.error('Error selecting payment template:', error);
    }
  };

  const generatePaymentSchedule = (template, costSheet) => {
    if (!template || !costSheet) return [];

    const totalAmount = costSheet.totals?.finalAmount || costSheet.finalPayableAmount || 0;
    const startDate = new Date();

    return template.installments.map((installment, index) => {
      const amount = Math.round((totalAmount * installment.percentage) / 100);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (installment.dueAfterDays || 0));

      return {
        installmentNumber: installment.installmentNumber,
        description: installment.description,
        percentage: installment.percentage,
        amount: amount,
        dueDate: dueDate,
        milestoneType: installment.milestoneType,
        status: 'pending',
        isOptional: installment.isOptional || false,
      };
    });
  };

  if (!selectedUnit || !selectedCustomer || !costSheet) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">Complete Previous Steps</Typography>
        <Typography variant="body2">
          Please complete unit selection, customer selection, and cost sheet generation before setting up payment plan.
        </Typography>
      </Alert>
    );
  }

  if (templatesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6">Loading payment plan templates...</Typography>
          <Typography variant="body2" color="textSecondary">
            Fetching available payment schedules for this project
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Payment Plan Header */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Select Payment Plan"
          subheader={`Choose a payment schedule for ${project?.name || 'this project'} that works best for your customer`}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Project: {project?.name || 'Unknown Project'}
              </Typography>
              <Typography variant="h6" color="primary">
                Total: {formatCurrency(costSheet.totals?.finalAmount || costSheet.finalPayableAmount)}
              </Typography>
            </Box>
          }
        />
      </Card>

      <Grid container spacing={3}>
        {/* Available Payment Templates */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title={`Available Payment Plans (${paymentTemplates.length})`}
              subheader={`For ${project?.name || 'this project'}`}
              action={
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setShowCustomPlan(true)}
                >
                  Create Custom Plan
                </Button>
              }
            />
            <CardContent>
              {paymentTemplates.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="h6">No payment templates available</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    No active payment plan templates found for {project?.name || 'this project'}.
                  </Typography>
                  
                  {/* Detailed Debug Information */}
                  <Box sx={{ bgcolor: 'warning.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      Debug Information:
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Project: {project?.name || 'Not found'} (ID: {project?._id || 'N/A'})
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Templates in project data: {project?.activePaymentTemplates?.length || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Payment configuration exists: {project?.paymentConfiguration ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      • Unit project ID: {selectedUnit?.project?._id || selectedUnit?.project || 'N/A'}
                    </Typography>
                    {project?.activePaymentTemplates?.length > 0 && (
                      <Typography variant="caption" display="block">
                        • Available template: "{project.activePaymentTemplates[0].name}"
                      </Typography>
                    )}
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    sx={{ mt: 1 }}
                    startIcon={<Add />}
                    onClick={() => setShowCustomPlan(true)}
                  >
                    Create Custom Payment Plan
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {paymentTemplates.map((template) => {
                    const isSelected = selectedPaymentPlan?._id === template._id;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={template._id}>
                        <Card 
                          variant="outlined"
                          sx={{ 
                            cursor: 'pointer',
                            border: isSelected ? '2px solid' : '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader
                            title={template.name}
                            subheader={template.planType?.replace('_', ' ')}
                            avatar={
                              <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'grey.400' }}>
                                {isSelected ? <Check /> : <Payment />}
                              </Avatar>
                            }
                          />
                          <CardContent>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {template.description || 'Payment plan with structured installments'}
                            </Typography>
                            
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                              <Chip 
                                label={`${template.installments?.length || 0} installments`} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${template.gracePeriodDays || 0} days grace`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Stack>

                            <Typography variant="caption" color="textSecondary" gutterBottom>
                              Key Installments:
                            </Typography>
                            {template.installments?.slice(0, 3).map((installment, index) => (
                              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" noWrap sx={{ maxWidth: '60%' }}>
                                  {installment.description}
                                </Typography>
                                <Typography variant="caption" fontWeight="medium">
                                  {formatPercentage(installment.percentage)}
                                </Typography>
                              </Box>
                            ))}
                            {(template.installments?.length || 0) > 3 && (
                              <Typography variant="caption" color="textSecondary">
                                +{(template.installments?.length || 0) - 3} more...
                              </Typography>
                            )}

                            <Button
                              variant={isSelected ? 'contained' : 'outlined'}
                              fullWidth
                              sx={{ mt: 2 }}
                              startIcon={isSelected ? <Check /> : <Add />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(template);
                              }}
                            >
                              {isSelected ? 'Selected' : 'Select Plan'}
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Plan Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Payment Summary"
              avatar={
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Assessment />
                </Avatar>
              }
            />
            <CardContent>
              {selectedPaymentPlan ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Selected Plan</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedPaymentPlan.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedPaymentPlan.planType?.replace('_', ' ')}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="textSecondary">Plan Details</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip 
                        label={`${selectedPaymentPlan.installments?.length} installments`} 
                        size="small" 
                        color="primary"
                      />
                      <Chip 
                        label={`${selectedPaymentPlan.gracePeriodDays} days grace`} 
                        size="small" 
                        color="info"
                      />
                    </Stack>
                    {selectedPaymentPlan.lateFeeRate > 0 && (
                      <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                        Late fee: {formatPercentage(selectedPaymentPlan.lateFeeRate)} per month
                      </Typography>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Total Amount</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(costSheet.totals?.finalAmount || costSheet.finalPayableAmount)}
                    </Typography>
                  </Box>

                  {paymentSchedule && paymentSchedule.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Next Payment Due
                        </Typography>
                        <Typography variant="h6" color="warning.main" fontWeight="bold">
                          {formatCurrency(paymentSchedule[0]?.amount)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {paymentSchedule[0]?.description} - {formatDate(paymentSchedule[0]?.dueDate)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Payment sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Select a payment plan to see details
                  </Typography>
                  {paymentTemplates.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      No templates available for {project?.name || 'this project'}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Schedule */}
        {paymentSchedule && paymentSchedule.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Payment Schedule"
                subheader="Detailed installment breakdown"
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<Print />} size="small">
                      Print Schedule
                    </Button>
                    <Button variant="outlined" startIcon={<Email />} size="small">
                      Email to Customer
                    </Button>
                  </Box>
                }
              />
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Milestone</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentSchedule.map((installment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              #{installment.installmentNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {installment.description}
                            </Typography>
                            {installment.isOptional && (
                              <Chip label="Optional" size="small" color="info" sx={{ mt: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={installment.milestoneType?.replace('_', ' ')} 
                              size="small" 
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatPercentage(installment.percentage)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              {formatCurrency(installment.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(installment.dueDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={installment.status} 
                              size="small" 
                              color="default"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow sx={{ bgcolor: 'primary.50' }}>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="h6" fontWeight="bold">Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight="bold">100%</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {formatCurrency(paymentSchedule.reduce((sum, inst) => sum + inst.amount, 0))}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ============================================================================
// ENHANCED REVIEW AND BOOK COMPONENT
// ============================================================================

const EnhancedReviewAndBook = ({ 
  selectedUnit, 
  selectedCustomer, 
  costSheet,
  selectedPaymentPlan,
  paymentSchedule,
  onCreateSale,
  loading,
  projects 
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!selectedUnit || !selectedCustomer || !costSheet || !selectedPaymentPlan) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6">Complete All Steps</Typography>
        <Typography variant="body2">
          Please complete all previous steps before reviewing the sale:
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0 }}>
          <li>Unit selection</li>
          <li>Customer selection</li>
          <li>Cost sheet generation</li>
          <li>Payment plan selection</li>
        </Box>
      </Alert>
    );
  }

  // FIXED: Get project using proper resolution
  const project = getUnitProject(selectedUnit, projects);
  const customerName = `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim();

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Sale Summary Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Sale Summary
            </Typography>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {formatCurrency(costSheet.totals?.finalAmount || costSheet.finalPayableAmount)}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {customerName} • {selectedUnit.unitNumber} • {project?.name || 'Unknown Project'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              Payment Plan: {selectedPaymentPlan.name} • {paymentSchedule?.length} installments
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tabbed Review Content */}
      <Card>
        <CardHeader
          title="Review Sale Details"
          subheader="Please review all details carefully before confirming the booking"
        />
        <CardContent>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
            <Tab label="Property Details" icon={<Home />} />
            <Tab label="Customer Details" icon={<Person />} />
            <Tab label="Cost Breakdown" icon={<Receipt />} />
            <Tab label="Payment Schedule" icon={<Payment />} />
          </Tabs>

          {/* Property Details Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Project Information</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Project Name</Typography>
                      <Typography variant="h6">{project?.name || 'Unknown Project'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Location</Typography>
                      <Typography variant="body1">
                        {project?.location?.city || 'Unknown City'}, {project?.location?.state || project?.location?.area || 'Unknown Location'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Project Type</Typography>
                      <Chip label={project?.type || 'Unknown Type'} color="primary" />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Unit Specifications</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Unit Number</Typography>
                      <Typography variant="h6">{selectedUnit.unitNumber}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Configuration</Typography>
                      <Typography variant="body1">{selectedUnit.unitType || selectedUnit.type}</Typography>
                      <Typography variant="caption">
                        {selectedUnit.specifications?.bedrooms || 'N/A'}BR • {selectedUnit.specifications?.bathrooms || 'N/A'}BA
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Area & Floor</Typography>
                      <Typography variant="body1">
                        {selectedUnit.areaSqft || selectedUnit.area || 'N/A'} sq ft • Floor {selectedUnit.floor}
                      </Typography>
                      <Typography variant="caption">{selectedUnit.facing} facing</Typography>
                    </Box>
                    {selectedUnit.features && Object.values(selectedUnit.features).some(Boolean) && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">Special Features</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {selectedUnit.features.isParkFacing && <Chip label="Park View" size="small" color="success" />}
                          {selectedUnit.features.isCornerUnit && <Chip label="Corner Unit" size="small" color="info" />}
                          {selectedUnit.features.hasBalcony && <Chip label="Balcony" size="small" color="primary" />}
                          {selectedUnit.features.hasParkingSlot && <Chip label="Parking" size="small" color="success" />}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Customer Details Tab */}
          <TabPanel value={activeTab} index={1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Customer Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Full Name</Typography>
                      <Typography variant="h6">{customerName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Email Address</Typography>
                      <Typography variant="body1">{selectedCustomer.email || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                      <Typography variant="body1">{formatPhoneNumber(selectedCustomer.phone) || '-'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Lead Source</Typography>
                      <Typography variant="body1">{selectedCustomer.source || selectedCustomer.leadSource || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Current Status</Typography>
                      <Chip label={selectedCustomer.status || 'Active'} color="primary" />
                    </Box>
                    {selectedCustomer.score && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">Lead Score</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip label={`${selectedCustomer.score} (${selectedCustomer.scoreGrade})`} color="success" />
                          {selectedCustomer.priority && (
                            <Chip label={selectedCustomer.priority} color="warning" />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>

          {/* Cost Breakdown Tab */}
          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cost Component</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costSheet.costBreakdown?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.item}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {item.description}
                        </Typography>
                        {item.calculation && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {item.calculation}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.category} 
                          size="small" 
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Subtotal, Discount, Total */}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell colSpan={2}><Typography fontWeight="bold">Subtotal</Typography></TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(costSheet.totals?.subtotal)}</Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  
                  {costSheet.discountDetails?.amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography color="success.main" fontWeight="medium">
                          Discount ({costSheet.discountDetails.type === 'percentage' ? 
                            `${costSheet.discountDetails.value}%` : 'Fixed Amount'})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight="medium">
                          -{formatCurrency(costSheet.discountDetails.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="h6" fontWeight="bold">Total Payable Amount</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatCurrency(costSheet.totals?.finalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Payment Schedule Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ mb: 3 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Payment Plan:</strong> {selectedPaymentPlan.name} • 
                  <strong> Grace Period:</strong> {selectedPaymentPlan.gracePeriodDays} days • 
                  {selectedPaymentPlan.lateFeeRate > 0 && (
                    <><strong> Late Fee:</strong> {formatPercentage(selectedPaymentPlan.lateFeeRate)}/month</>
                  )}
                </Typography>
              </Alert>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Installment</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Milestone</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentSchedule?.map((installment, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          #{installment.installmentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{installment.description}</Typography>
                        {installment.isOptional && (
                          <Chip label="Optional" size="small" color="info" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={installment.milestoneType?.replace('_', ' ')} 
                          size="small" 
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatPercentage(installment.percentage)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(installment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(installment.dueDate)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Final Confirmation */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Ready to Confirm This Booking?
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Please review all details above carefully. Once confirmed, this unit will be marked as sold,
              a sale record will be created, and the payment plan will be activated for this customer.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Print />}
                onClick={() => window.print()}
              >
                Print Summary
              </Button>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<Save />}
                onClick={onCreateSale}
                disabled={loading}
                sx={{ 
                  minWidth: 220,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Creating Sale...
                  </Box>
                ) : (
                  'Confirm & Book Unit'
                )}
              </Button>
            </Box>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              By clicking "Confirm & Book Unit", you acknowledge that all information is correct
              and authorize the booking with the selected payment plan.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// ============================================================================
// COMPACT STEPPER COMPONENT
// ============================================================================

const CompactStepper = ({ steps, activeStep, isStepCompleted, onStepClick, isMobile }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 0.5 : 1, py: 1.5, px: 1 }}>
      {steps.map((step, index) => {
        const completed = isStepCompleted(index);
        const active = index === activeStep;
        const isClickable = index <= activeStep || completed;

        return (
          <React.Fragment key={step.id}>
            <Box
              onClick={() => isClickable && onStepClick(index)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: isClickable ? 'pointer' : 'default', opacity: !isClickable ? 0.4 : 1, transition: 'all 200ms ease' }}
            >
              <Avatar
                sx={{
                  width: isMobile ? 28 : 32,
                  height: isMobile ? 28 : 32,
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  bgcolor: completed ? 'success.main' : active ? 'primary.main' : alpha(theme.palette.grey[500], 0.15),
                  color: completed || active ? '#fff' : 'text.secondary',
                  transition: 'all 200ms ease',
                  ...(active && { boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}` }),
                }}
              >
                {completed ? <Check sx={{ fontSize: 16 }} /> : (index + 1)}
              </Avatar>
              {!isMobile && active && (
                <Typography variant="subtitle2" fontWeight={600} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                  {step.label}
                </Typography>
              )}
            </Box>
            {index < steps.length - 1 && (
              <Box sx={{ flex: isMobile ? '0 0 16px' : '0 0 40px', height: 2, bgcolor: completed ? 'success.main' : 'grey.300', borderRadius: 1, transition: 'background-color 300ms ease' }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

// ============================================================================
// STICKY NAV BAR COMPONENT
// ============================================================================

const StickyNavBar = ({ activeStep, totalSteps, canProceed, onBack, onNext, onSubmit, submitting, stepLabel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLastStep = activeStep === totalSteps - 1;
  const progressPercent = ((activeStep + 1) / totalSteps) * 100;

  return (
    <Box sx={{ position: 'sticky', bottom: 0, zIndex: 10, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 1.5, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 0, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', transition: 'transform 400ms ease' } }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, mx: 'auto' }}>
        <Button disabled={activeStep === 0} onClick={onBack} variant="outlined" startIcon={<ArrowBack />} size={isMobile ? 'medium' : 'large'} sx={{ minWidth: isMobile ? 'auto' : 100 }}>
          {isMobile ? '' : 'Back'}
        </Button>
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>Step {activeStep + 1} of {totalSteps}</Typography>
            <Typography variant="body2" color="text.secondary">&mdash;</Typography>
            <Typography variant="body2" color="primary" fontWeight={600}>{stepLabel}</Typography>
          </Box>
        )}
        {isMobile && (
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{activeStep + 1} / {totalSteps}</Typography>
        )}
        {!isLastStep ? (
          <Button variant="contained" onClick={onNext} disabled={!canProceed} endIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />} size={isMobile ? 'medium' : 'large'} sx={{ minWidth: isMobile ? 'auto' : 140 }}>
            {isMobile ? 'Next' : 'Next Step'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onSubmit} disabled={!canProceed || submitting} startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />} size={isMobile ? 'medium' : 'large'} sx={{ minWidth: isMobile ? 'auto' : 160, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
            {submitting ? 'Creating...' : (isMobile ? 'Create' : 'Create Sale')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

// ============================================================================
// SELECTION SUMMARY CARD COMPONENT
// ============================================================================

const SelectionSummaryCard = ({ activeStep, selectedUnit, selectedCustomer, projects, onClearUnit, onClearCustomer }) => {
  const theme = useTheme();

  const showUnitSummary = selectedUnit && activeStep === 0;
  const showCustomerSummary = selectedCustomer && activeStep === 1;

  if (!showUnitSummary && !showCustomerSummary) return null;

  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {showUnitSummary && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.06), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
            <CheckCircle sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>{selectedUnit.unitNumber} selected</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {getUnitProject(selectedUnit, projects)?.name} &bull; {selectedUnit.unitType || selectedUnit.type} &bull; {formatCurrency(selectedUnit.currentPrice || selectedUnit.basePrice)}
            </Typography>
          </Box>
          <Button size="small" variant="text" onClick={onClearUnit} startIcon={<Clear sx={{ fontSize: 16 }} />} sx={{ color: 'text.secondary', flexShrink: 0 }}>
            Clear
          </Button>
        </Box>
      )}
      {showCustomerSummary && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.06), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
            <CheckCircle sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600}>{getCustomerDisplayName(selectedCustomer)} selected</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {selectedCustomer.email || ''} {selectedCustomer.phone ? `\u2022 ${formatPhoneNumber(selectedCustomer.phone)}` : ''}
            </Typography>
          </Box>
          <Button size="small" variant="text" onClick={onClearCustomer} startIcon={<Clear sx={{ fontSize: 16 }} />} sx={{ color: 'text.secondary', flexShrink: 0 }}>
            Clear
          </Button>
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// MAIN CREATE SALE PAGE COMPONENT
// ============================================================================

const CreateSalePage = () => {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  // All hooks must be at the top level - no conditional returns before all hooks
  const [activeStep, setActiveStep] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [costSheet, setCostSheet] = useState(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 });
  
  // Data states
  const [projects, setProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [leads, setLeads] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState({ 
    projects: false, 
    units: false, 
    leads: false, 
    costSheet: false 
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const stepContentRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    project: searchParams.get('project') || 'all',
    unitType: 'all',
    tower: 'all',
  });

  // Handle step navigation
  const scrollToTop = useCallback(() => {
    if (stepContentRef.current) {
      stepContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, SALE_STEPS.length - 1));
    setTimeout(scrollToTop, 50);
  }, [scrollToTop]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
    setTimeout(scrollToTop, 50);
  }, [scrollToTop]);

  const handleStepClick = useCallback((step) => {
    if (step <= activeStep || isStepCompleted(step)) {
      setActiveStep(step);
      setTimeout(scrollToTop, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, scrollToTop]);

  const isStepCompleted = (step) => {
    switch (step) {
      case 0: return !!selectedUnit;
      case 1: return !!selectedCustomer;
      case 2: return !!costSheet;
      case 3: return !!selectedPaymentPlan && !!paymentSchedule?.length;
      case 4: return !!selectedUnit && !!selectedCustomer && !!costSheet && !!selectedPaymentPlan;
      default: return false;
    }
  };

  const canProceedToNext = () => {
    return isStepCompleted(activeStep);
  };

  const handleUnitSelect = useCallback((unit) => {
    setSelectedUnit(unit);
    setCostSheet(null);
    setSelectedPaymentPlan(null);
    setPaymentSchedule([]);
    if (unit) setTimeout(scrollToTop, 50);
  }, [scrollToTop]);

  const handleCustomerSelect = useCallback((customer) => {
    setSelectedCustomer(customer);
    setCostSheet(null);
    setSelectedPaymentPlan(null);
    setPaymentSchedule([]);
    if (customer) setTimeout(scrollToTop, 50);
  }, [scrollToTop]);

  // Check permissions - this can be done after hooks
  const canCreateSales = canAccess?.salesPipeline ? canAccess.salesPipeline() : true;

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      setLoading({ projects: true, units: true, leads: true, costSheet: false });
      
      // Fetch all data in parallel
      const [projectsResult, unitsResult, leadsResult] = await Promise.allSettled([
        projectAPI.getProjects(),
        // FIXED: Ensure we fetch ALL units across all projects
        unitAPI.getUnits({ limit: 1000, status: 'available' }), // Increase limit and filter
        leadAPI.getLeads({ limit: 1000 }), // Increase limit to get all leads
      ]);

      // FIXED: Declare validProjects in broader scope
      let validProjects = [];

      // Process projects
      if (projectsResult.status === 'fulfilled') {
        const projectsData = projectsResult.value.data.data || projectsResult.value.data || [];
        validProjects = Array.isArray(projectsData) ? projectsData : [];
        console.log('✅ Loaded projects:', validProjects.length, 'projects');
        console.log('Projects data sample:', validProjects.map(p => ({ 
          id: p._id, 
          name: p.name, 
          hasActiveTemplates: p.activePaymentTemplates?.length > 0,
          templateCount: p.activePaymentTemplates?.length || 0
        })));
        setProjects(validProjects);
      } else {
        console.error('❌ Failed to fetch projects:', projectsResult.reason);
        setProjects([]);
      }

      // Process units
      if (unitsResult.status === 'fulfilled') {
        const unitsData = unitsResult.value.data.data || unitsResult.value.data || [];
        const validUnits = Array.isArray(unitsData) ? unitsData : [];
        
        // FIXED: Log detailed unit distribution by project
        const unitsByProject = validUnits.reduce((acc, unit) => {
          const projectId = unit.project?._id || unit.project;
          const projectName = unit.project?.name || 'Unknown';
          if (!acc[projectId]) {
            acc[projectId] = { name: projectName, count: 0, units: [] };
          }
          acc[projectId].count++;
          acc[projectId].units.push(unit.unitNumber);
          return acc;
        }, {});
        
        console.log('✅ Loaded units:', validUnits.length, 'total units');
        console.log('📊 Units by project:', Object.entries(unitsByProject).map(([id, data]) => ({
          projectId: id,
          projectName: data.name,
          unitCount: data.count,
          sampleUnits: data.units.slice(0, 3)
        })));
        
        // FIXED: Merge project data with unit data to ensure payment templates are available
        const unitsWithEnhancedProjects = validUnits.map(unit => {
          const projectId = unit.project?._id || unit.project;
          const fullProject = validProjects.find(p => p._id === projectId);
          
          if (fullProject && unit.project) {
            // Merge full project data into unit's project reference
            unit.project = {
              ...unit.project,
              activePaymentTemplates: fullProject.activePaymentTemplates || [],
              paymentConfiguration: fullProject.paymentConfiguration
            };
          }
          
          return unit;
        });
        
        setUnits(unitsWithEnhancedProjects);
      } else {
        console.error('❌ Failed to fetch units:', unitsResult.reason);
        setUnits([]);
      }

      // Process leads
      if (leadsResult.status === 'fulfilled') {
        const leadsData = leadsResult.value.data.data?.leads || leadsResult.value.data.leads || leadsResult.value.data || [];
        const validLeads = Array.isArray(leadsData) ? leadsData : [];
        
        // FIXED: Enhance leads with full project data
        const leadsWithEnhancedProjects = validLeads.map(lead => {
          const projectId = lead.project?._id || lead.project;
          const fullProject = validProjects.find(p => p._id === projectId);
          
          if (fullProject && lead.project) {
            lead.project = {
              ...lead.project,
              activePaymentTemplates: fullProject.activePaymentTemplates || [],
              paymentConfiguration: fullProject.paymentConfiguration
            };
          }
          
          return lead;
        });
        
        console.log('✅ Loaded leads:', validLeads.length, 'leads');
        setLeads(leadsWithEnhancedProjects);
      } else {
        console.error('❌ Failed to fetch leads:', leadsResult.reason);
        setLeads([]);
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading({ projects: false, units: false, leads: false, costSheet: false });
    }
  };

  // Permission check after hooks
  if (!canCreateSales) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have permission to create sales. Please contact your administrator.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          Back to Sales
        </Button>
      </Box>
    );
  }

  // Handle cost sheet generation
  const handleGenerateCostSheet = (costSheetData) => {
    setCostSheet(costSheetData);
    setSelectedPaymentPlan(null); // Reset payment plan when cost sheet changes
    setPaymentSchedule([]); // Reset payment schedule when cost sheet changes
  };

  // Handle discount change
  const handleDiscountChange = (type, value) => {
    setDiscount({ type, value });
    setCostSheet(null); // Reset cost sheet when discount changes
    setSelectedPaymentPlan(null); // Reset payment plan when discount changes
    setPaymentSchedule([]); // Reset payment schedule when discount changes
  };

  // Handle payment plan selection
  const handlePaymentPlanSelect = (plan) => {
    setSelectedPaymentPlan(plan);
  };

  // Handle payment schedule generation
  const handleGenerateSchedule = (schedule) => {
    setPaymentSchedule(schedule);
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
    if (!selectedUnit || !selectedCustomer || !costSheet || !selectedPaymentPlan) return;

    try {
      setSubmitting(true);
      
      const saleData = {
        unitId: selectedUnit._id,
        leadId: selectedCustomer._id,
        costSheetSnapshot: costSheet,
        paymentPlanSnapshot: {
          templateId: selectedPaymentPlan._id,
          templateName: selectedPaymentPlan.name,
          schedule: paymentSchedule,
        },
      };

      if (discount.type === 'percentage') {
        saleData.discountPercentage = discount.value;
      } else {
        saleData.discountAmount = discount.value;
      }

      const response = await salesAPI.createSale(saleData);
      const responseData = response.data;
      const createdSale = responseData.data || responseData;

      // Check if sale requires approval (e.g., discount exceeds user's limit)
      if (responseData.pendingApproval) {
        navigate('/sales', {
          state: { message: responseData.message || 'Sale submitted for approval' }
        });
        return;
      }

      // Navigate to sale detail page
      navigate(`/sales/${createdSale._id}`, {
        state: { message: 'Sale created successfully with payment plan!' }
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
            projects={projects}
          />
        );
      case 2:
        return (
          <EnhancedCostSheet
            selectedUnit={selectedUnit}
            selectedCustomer={selectedCustomer}
            costSheet={costSheet}
            onGenerateCostSheet={handleGenerateCostSheet}
            discount={discount}
            onDiscountChange={handleDiscountChange}
            loading={loading.costSheet}
            projects={projects}
          />
        );
      case 3:
        return (
          <PaymentPlanSelection
            selectedUnit={selectedUnit}
            selectedCustomer={selectedCustomer}
            costSheet={costSheet}
            selectedPaymentPlan={selectedPaymentPlan}
            onPaymentPlanSelect={handlePaymentPlanSelect}
            paymentSchedule={paymentSchedule}
            onGenerateSchedule={handleGenerateSchedule}
            loading={loading.paymentPlan}
            projects={projects}
          />
        );
      case 4:
        return (
          <EnhancedReviewAndBook
            selectedUnit={selectedUnit}
            selectedCustomer={selectedCustomer}
            costSheet={costSheet}
            selectedPaymentPlan={selectedPaymentPlan}
            paymentSchedule={paymentSchedule}
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', m: { xs: -2, sm: -3 } }}>
      {/* Sticky Header */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.default', px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate('/sales')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Create New Sale
          </Typography>
        </Box>
        <CompactStepper
          steps={SALE_STEPS}
          activeStep={activeStep}
          isStepCompleted={isStepCompleted}
          onStepClick={handleStepClick}
          isMobile={isMobile}
        />
      </Box>

      {/* Scrollable Step Content */}
      <Box ref={stepContentRef} sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: 2, pb: '100px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <SelectionSummaryCard
          activeStep={activeStep}
          selectedUnit={selectedUnit}
          selectedCustomer={selectedCustomer}
          projects={projects}
          onClearUnit={() => handleUnitSelect(null)}
          onClearCustomer={() => handleCustomerSelect(null)}
        />

        {getStepContent(activeStep)}
      </Box>

      {/* Sticky Bottom Navigation */}
      <StickyNavBar
        activeStep={activeStep}
        totalSteps={SALE_STEPS.length}
        canProceed={canProceedToNext()}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleCreateSale}
        submitting={submitting}
        stepLabel={SALE_STEPS[activeStep].label}
      />
    </Box>
  );
};

export default CreateSalePage;
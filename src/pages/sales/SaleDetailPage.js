/**
 * File: src/pages/sales/SaleDetailPage.js
 * Description: Enhanced sale detail page with complete data utilization
 * Version: 4.0 - Full featured with rich data display
 * Location: src/pages/sales/SaleDetailPage.js
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
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  LinearProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
  Skeleton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  Tabs,
  Tab,
  TabPanel,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  Edit,
  Delete,
  MoreVert,
  Receipt,
  AccountBalance,
  Phone,
  Email,
  Home,
  CheckCircle,
  Print,
  Download,
  Share,
  WhatsApp,
  AccountBalanceWallet,
  ExpandMore,
  Refresh,
  ContentCopy,
  Person,
  Business,
  LocationOn,
  Schedule,
  Bed,
  SquareFoot,
  DirectionsRun,
  Pool,
  FitnessCenter,
  Security,
  Elevator,
  LocalParking,
  Restaurant,
  Assignment,
  Timeline as TimelineIcon,
  TrendingUp,
  Info,
  Star,
  Visibility,
  Calculate,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, formatPhoneNumber } from '../../utils/formatters';

// ============================================================================
// SAFE API IMPORT
// ============================================================================
let salesAPI;
try {
  const { salesAPI: api } = require('../../services/api');
  salesAPI = api;
} catch (error) {
  salesAPI = {
    getSale: () => Promise.reject(new Error('API not available')),
    cancelSale: () => Promise.reject(new Error('API not available')),
    generateSaleDocuments: () => Promise.reject(new Error('API not available')),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const safeString = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value || '-';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && value !== null) {
    if (value.name) return String(value.name);
    if (value.value) return String(value.value);
    if (value.label) return String(value.label);
    if (value.title) return String(value.title);
    return '[Object]';
  }
  return String(value);
};

const getCustomerName = (sale) => {
  if (!sale?.lead) return 'Unknown Customer';
  
  if (typeof sale.lead === 'object') {
    const { firstName, lastName, email, phone } = sale.lead;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
    if (phone) return phone;
  }
  
  return typeof sale.lead === 'string' ? sale.lead : 'Unknown Customer';
};

const getProjectName = (sale) => {
  if (!sale?.project) return 'Unknown Project';
  if (typeof sale.project === 'object') {
    return sale.project.name || sale.project.title || 'Unknown Project';
  }
  return typeof sale.project === 'string' ? sale.project : 'Unknown Project';
};

const getUnitDisplayName = (sale) => {
  if (!sale?.unit) return 'Unknown Unit';
  if (typeof sale.unit === 'object') {
    return sale.unit.unitNumber || sale.unit.fullAddress || sale.unit.name || 'Unknown Unit';
  }
  return typeof sale.unit === 'string' ? sale.unit : 'Unknown Unit';
};

const getSalespersonName = (sale) => {
  if (!sale?.salesPerson) return 'Unassigned';
  if (typeof sale.salesPerson === 'object') {
    const { firstName, lastName, email } = sale.salesPerson;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
  }
  return typeof sale.salesPerson === 'string' ? sale.salesPerson : 'Unassigned';
};

const getStatusInfo = (status) => {
  const statusMap = {
    'booked': { color: 'success', label: 'Booked', icon: CheckCircle },
    'Booked': { color: 'success', label: 'Booked', icon: CheckCircle },
    'agreement_signed': { color: 'info', label: 'Agreement Signed', icon: Assignment },
    'registration_pending': { color: 'warning', label: 'Registration Pending', icon: Schedule },
    'registration_complete': { color: 'success', label: 'Registration Complete', icon: CheckCircle },
    'cancelled': { color: 'error', label: 'Cancelled', icon: Delete },
    'on_hold': { color: 'default', label: 'On Hold', icon: Schedule },
  };
  return statusMap[status] || { color: 'default', label: 'Pending', icon: Schedule };
};

const getBHKFromUnitType = (unitType) => {
  if (!unitType) return null;
  const match = unitType.match(/(\d+)BHK/i);
  return match ? parseInt(match[1]) : null;
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const LoadingSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Stack spacing={3}>
      <Skeleton variant="rectangular" height={200} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={150} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  </Box>
);

// ============================================================================
// ENHANCED SALE OVERVIEW CARD
// ============================================================================

const SaleOverviewCard = ({ sale, onEdit, onCancel, canEdit }) => {
  const handleCopyId = () => {
    if (navigator.clipboard && sale._id) {
      navigator.clipboard.writeText(sale._id);
    }
  };

  const statusInfo = getStatusInfo(sale.status);
  const StatusIcon = statusInfo.icon;
  
  // Calculate discount if available in cost sheet
  const costSheet = sale.costSheetSnapshot || {};
  const basePrice = costSheet.basePrice || sale.salePrice || 0;
  const negotiatedPrice = costSheet.negotiatedPrice || sale.salePrice || 0;
  const discountAmount = basePrice - negotiatedPrice;
  
  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h4" component="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
              Sale #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase() || 'N/A'}
            </Typography>
            <Chip
              icon={<StatusIcon sx={{ fontSize: 18, color: 'inherit' }} />}
              label={statusInfo.label}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              variant="outlined"
            />
            <Tooltip title="Copy Sale ID">
              <IconButton size="small" onClick={handleCopyId} sx={{ color: 'white' }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        action={
          canEdit && (
            <Box>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={onEdit}
                sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                Edit Sale
              </Button>
              <Button
                variant="outlined"
                startIcon={<Delete />}
                onClick={onCancel}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Cancel Sale
              </Button>
            </Box>
          )
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {formatCurrency(negotiatedPrice || sale.salePrice || 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Final Sale Amount
              </Typography>
              {discountAmount > 0 && (
                <Typography variant="body2" sx={{ color: '#4caf50', mt: 1 }}>
                  Saved: {formatCurrency(discountAmount)}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {formatDate(sale.bookingDate || sale.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Booking Date
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {getCustomerName(sale)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Customer
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Receipt />}
                size="small"
                fullWidth
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                onClick={() => console.log('Generate receipt for sale:', sale._id)}
              >
                Generate Receipt
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalance />}
                size="small"
                fullWidth
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                onClick={() => window.open(`/payments/plans/${sale._id}`, '_blank')}
              >
                Payment Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ENHANCED CUSTOMER INFO CARD
// ============================================================================

const CustomerInfoCard = ({ sale }) => {
  const customerName = getCustomerName(sale);
  const leadData = sale.lead || {};
  const requirements = leadData.requirements || {};
  
  return (
    <Card>
      <CardHeader
        title="Customer Information"
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem' }}>
            {customerName?.[0] || 'C'}
          </Avatar>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {leadData.phone && (
              <Tooltip title="Call Customer">
                <IconButton color="primary" href={`tel:${leadData.phone}`}>
                  <Phone />
                </IconButton>
              </Tooltip>
            )}
            {leadData.email && (
              <Tooltip title="Email Customer">
                <IconButton color="primary" href={`mailto:${leadData.email}`}>
                  <Email />
                </IconButton>
              </Tooltip>
            )}
            {leadData.phone && (
              <Tooltip title="WhatsApp">
                <IconButton 
                  color="primary" 
                  href={`https://wa.me/${leadData.phone?.replace(/\D/g, '')}`} 
                  target="_blank"
                >
                  <WhatsApp />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Customer Name
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {customerName}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Phone Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {leadData.phone ? formatPhoneNumber(leadData.phone) : '-'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Email Address
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {safeString(leadData.email)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Lead Source
                </Typography>
                <Chip 
                  label={safeString(leadData.source)} 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                />
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Priority Level
                </Typography>
                <Chip
                  label={safeString(leadData.priority) || 'Medium'}
                  color={leadData.priority === 'High' ? 'error' : leadData.priority === 'Low' ? 'default' : 'warning'}
                  icon={<Star />}
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Purchase Timeline
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {requirements.timeline?.replace('_', '-') || '-'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Preferred Unit Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {safeString(requirements.unitType)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Requirements
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {requirements.facing && `Facing: ${requirements.facing}`}
                  {requirements.floor?.preference && ` • Floor: ${requirements.floor.preference}`}
                  {requirements.amenities?.length > 0 && ` • Amenities: ${requirements.amenities.join(', ')}`}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ENHANCED PROPERTY DETAILS CARD
// ============================================================================

const PropertyDetailsCard = ({ sale }) => {
  const projectData = sale.project || {};
  const unitData = sale.unit || {};
  const requirements = sale.lead?.requirements || {};
  const configuration = projectData.configuration || {};
  
  // Use requirements data to fill missing unit info
  const unitType = requirements.unitType || unitData.unitType;
  const facing = requirements.facing || unitData.facing;
  const bedrooms = getBHKFromUnitType(unitType);
  
  return (
    <Card>
      <CardHeader
        title="Property Details"
        avatar={
          <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
            <Home />
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Basic Property Info */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Project Name
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {getProjectName(sale)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Unit Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {getUnitDisplayName(sale)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Project Type
                </Typography>
                <Chip 
                  label={safeString(projectData.type)} 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Project Status
                </Typography>
                <Chip 
                  label={safeString(projectData.status)} 
                  color={projectData.status === 'planning' ? 'warning' : 'success'} 
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Grid>
          
          {/* Unit Specifications */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Configuration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {bedrooms && <Bed fontSize="small" />}
                  <Typography variant="body1" fontWeight="medium">
                    {unitType || '-'}
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Floor
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {unitData.floor ? `Floor ${unitData.floor}` : '-'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Facing Direction
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {facing || '-'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body1" fontWeight="medium">
                    {projectData.location?.city || safeString(projectData.location) || '-'}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          {/* Project Amenities */}
          {Object.keys(configuration).length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Project Amenities & Features
              </Typography>
              <Grid container spacing={2}>
                {configuration.gym && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FitnessCenter color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Gym</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.gym}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {configuration.swimmingPool && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Pool color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Swimming Pool</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.swimmingPool}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {configuration.security && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Security</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.security}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {configuration.elevators && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Elevator color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Elevators</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.elevators}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {configuration.powerBackup && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Power Backup</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.powerBackup}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {configuration.amenities && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Restaurant color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Additional Amenities</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {configuration.amenities}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ENHANCED PAYMENT BREAKDOWN CARD
// ============================================================================

const PaymentBreakdownCard = ({ sale }) => {
  const costSheet = sale.costSheetSnapshot || {};
  const basePrice = costSheet.basePrice || 0;
  const negotiatedPrice = costSheet.negotiatedPrice || sale.salePrice || 0;
  const additionalCharges = costSheet.additionalCharges || 0;
  const gst = costSheet.gst || 0;
  const totalAmount = costSheet.totalAmount || negotiatedPrice + additionalCharges + gst;
  const discountAmount = basePrice - negotiatedPrice;
  
  return (
    <Card>
      <CardHeader
        title="Payment Breakdown"
        avatar={
          <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
            <Calculate />
          </Avatar>
        }
        action={
          costSheet.timestamp && (
            <Tooltip title={`Updated: ${formatDateTime(costSheet.timestamp)}`}>
              <IconButton>
                <Info />
              </IconButton>
            </Tooltip>
          )
        }
      />
      <CardContent>
        <Stack spacing={2}>
          {/* Base Price */}
          {basePrice > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Base Price</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(basePrice)}
              </Typography>
            </Box>
          )}
          
          {/* Discount */}
          {discountAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" color="success.main">Discount Applied</Typography>
              <Typography variant="body1" fontWeight="medium" color="success.main">
                -{formatCurrency(discountAmount)}
              </Typography>
            </Box>
          )}
          
          {/* Negotiated Price */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              {basePrice > 0 ? 'Negotiated Price' : 'Sale Price'}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(negotiatedPrice)}
            </Typography>
          </Box>
          
          {/* Additional Charges */}
          {additionalCharges > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Additional Charges</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(additionalCharges)}
              </Typography>
            </Box>
          )}
          
          {/* GST */}
          {gst > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">GST</Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(gst)}
              </Typography>
            </Box>
          )}
          
          <Divider />
          
          {/* Total Amount */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="h6" fontWeight="bold">Total Amount</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              {formatCurrency(totalAmount)}
            </Typography>
          </Box>
          
          {/* Savings Summary */}
          {discountAmount > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You saved <strong>{formatCurrency(discountAmount)}</strong> on this purchase!
              </Typography>
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ENHANCED SALE TIMELINE
// ============================================================================

const SaleTimeline = ({ sale }) => {
  const timelineEvents = [
    {
      date: sale.createdAt,
      title: 'Sale Created',
      description: 'Sale record was created in the system',
      color: 'info',
      icon: Assignment,
    },
    {
      date: sale.bookingDate || sale.createdAt,
      title: 'Sale Booked',
      description: 'Customer confirmed the booking',
      color: 'success',
      icon: CheckCircle,
    },
    sale.costSheetSnapshot?.timestamp && {
      date: sale.costSheetSnapshot.timestamp,
      title: 'Cost Sheet Finalized',
      description: `Final amount: ${formatCurrency(sale.costSheetSnapshot.totalAmount || 0)}`,
      color: 'info',
      icon: Calculate,
    },
    sale.agreementDate && {
      date: sale.agreementDate,
      title: 'Agreement Signed',
      description: 'Sale agreement was signed by customer',
      color: 'info',
      icon: Assignment,
    },
    sale.registrationDate && {
      date: sale.registrationDate,
      title: 'Registration Complete',
      description: 'Property registration was completed',
      color: 'success',
      icon: CheckCircle,
    },
    sale.cancelledAt && {
      date: sale.cancelledAt,
      title: 'Sale Cancelled',
      description: safeString(sale.cancellationReason) || 'Sale was cancelled',
      color: 'error',
      icon: Delete,
    },
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader 
        title="Sale Timeline" 
        avatar={
          <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
            <TimelineIcon />
          </Avatar>
        }
      />
      <CardContent>
        <Timeline>
          {timelineEvents.map((event, index) => {
            const EventIcon = event.icon;
            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="textSecondary" sx={{ maxWidth: '120px' }}>
                  <Typography variant="body2">
                    {formatDate(event.date)}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(event.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={event.color}>
                    <EventIcon fontSize="small" />
                  </TimelineDot>
                  {index < timelineEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {event.description}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ENHANCED SALESPERSON CARD
// ============================================================================

const SalesPersonCard = ({ sale }) => {
  const salespersonName = getSalespersonName(sale);
  const salespersonData = sale.salesPerson || {};
  
  return (
    <Card>
      <CardHeader
        title="Sales Representative"
        avatar={
          <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, fontSize: '1.5rem' }}>
            {salespersonName?.[0] || 'S'}
          </Avatar>
        }
        action={
          salespersonData.email && (
            <Tooltip title="Email Sales Rep">
              <IconButton color="primary" href={`mailto:${salespersonData.email}`}>
                <Email />
              </IconButton>
            </Tooltip>
          )
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Name
            </Typography>
            <Typography variant="h6" fontWeight="medium">
              {salespersonName}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Role
            </Typography>
            <Chip 
              label={safeString(salespersonData.role)} 
              color="primary" 
              variant="outlined" 
              size="small"
            />
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Email
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {safeString(salespersonData.email)}
            </Typography>
          </Box>
          
          {salespersonData.phone && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Phone
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatPhoneNumber(salespersonData.phone)}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SaleDetailPage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSnackbar({ open: true, message: location.state.message, severity: 'success' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch sale data
  const fetchSaleData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      
      const response = await salesAPI.getSale(saleId);
      const saleData = response.data.data || response.data;
      setSale(saleData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching sale data:', error);
      
      if (error.response?.status === 404) {
        setError('Sale not found.');
      } else {
        setError('Failed to load sale details. Please try again.');
      }
      
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [saleId]);

  // Initial data load
  useEffect(() => {
    if (saleId) {
      fetchSaleData();
    }
  }, [fetchSaleData, saleId]);

  // Handle actions
  const handleEditSale = () => {
    navigate(`/sales/${saleId}/edit`);
  };

  const handleCancelSale = async () => {
    try {
      await salesAPI.cancelSale(saleId, {
        reason: 'Cancelled by user',
        cancelledBy: user._id,
      });
      setCancelDialog(false);
      setSnackbar({ open: true, message: 'Sale cancelled successfully', severity: 'success' });
      fetchSaleData(true);
    } catch (error) {
      console.error('Error cancelling sale:', error);
      setSnackbar({ open: true, message: 'Failed to cancel sale', severity: 'error' });
    }
  };

  const handleActionMenuClick = (event) => {
    setActionMenu(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenu(null);
  };

  const refreshData = () => {
    fetchSaleData(true);
  };

  const handleGenerateDocuments = async () => {
    try {
      await salesAPI.generateSaleDocuments(saleId);
      setSnackbar({ open: true, message: 'Documents generated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate documents', severity: 'error' });
    }
  };

  // Check permissions safely
  const canEditSales = hasPermission && typeof hasPermission === 'function' ? hasPermission('SALES') : false;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={refreshData} sx={{ mr: 2 }}>
          Try Again
        </Button>
        <Button variant="outlined" onClick={() => navigate('/sales')}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Sale not found.
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
              Sale Details
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {getCustomerName(sale)} • {getProjectName(sale)} • {formatDate(sale.bookingDate || sale.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <IconButton onClick={handleActionMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Progress bar for refreshing */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Sale Overview */}
      <SaleOverviewCard
        sale={sale}
        onEdit={handleEditSale}
        onCancel={() => setCancelDialog(true)}
        canEdit={canEditSales}
      />

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <CustomerInfoCard sale={sale} />
            <PropertyDetailsCard sale={sale} />
            <SaleTimeline sale={sale} />
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <PaymentBreakdownCard sale={sale} />
            <SalesPersonCard sale={sale} />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<Receipt />}
                    fullWidth
                    onClick={handleGenerateDocuments}
                  >
                    Generate Documents
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AccountBalance />}
                    fullWidth
                    onClick={() => navigate(`/payments/plans/${saleId}`)}
                  >
                    View Payment Plan
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    fullWidth
                    onClick={() => window.print()}
                  >
                    Print Details
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    fullWidth
                    href={`mailto:${sale.lead?.email || ''}`}
                    disabled={!sale.lead?.email}
                  >
                    Email Customer
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    fullWidth
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Sale #${sale.saleNumber || sale._id?.slice(-6)}`,
                          text: `Sale details for ${getCustomerName(sale)}`,
                          url: window.location.href
                        });
                      }
                    }}
                  >
                    Share Details
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenu}
        open={Boolean(actionMenu)}
        onClose={handleActionMenuClose}
      >
        {canEditSales && (
          <MenuItem onClick={handleEditSale}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Sale</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => navigate(`/payments/plans/${saleId}`)}>
          <ListItemIcon><AccountBalance fontSize="small" /></ListItemIcon>
          <ListItemText>Payment Plan</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGenerateDocuments}>
          <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
          <ListItemText>Generate Documents</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => window.print()}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Print Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => navigator.clipboard?.writeText(window.location.href)}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        <Divider />
        {canEditSales && (
          <MenuItem onClick={() => setCancelDialog(true)} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Cancel Sale</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Cancel Sale Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this sale? This action cannot be undone.
            <br /><br />
            <strong>Sale ID:</strong> #{sale.saleNumber || sale._id?.slice(-6)?.toUpperCase()}<br />
            <strong>Customer:</strong> {getCustomerName(sale)}<br />
            <strong>Amount:</strong> {formatCurrency(sale.salePrice || 0)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Keep Sale
          </Button>
          <Button onClick={handleCancelSale} color="error" variant="contained">
            Cancel Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && canEditSales && (
        <Fab
          color="primary"
          aria-label="edit sale"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleEditSale}
        >
          <Edit />
        </Fab>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SaleDetailPage;
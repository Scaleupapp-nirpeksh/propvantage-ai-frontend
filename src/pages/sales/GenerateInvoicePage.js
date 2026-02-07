// File: src/pages/sales/GenerateInvoicePage.js
// Description: Generate invoice from sale page for PropVantage AI
// Version: 1.0 - Complete invoice generation with sale integration and customization
// Location: src/pages/sales/GenerateInvoicePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  Snackbar,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import {
  ArrowBack,
  Receipt,
  Person,
  Business,
  AttachMoney,
  CalendarToday,
  CheckCircle,
  ExpandMore,
  Refresh,
} from '@mui/icons-material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { invoiceAPI, salesAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ============================================================================
// CONSTANTS AND CONFIGURATIONS
// ============================================================================

// Invoice types with descriptions
const INVOICE_TYPES = [
  {
    value: 'booking_invoice',
    label: 'Booking Invoice',
    description: 'Initial booking invoice for property purchase',
    color: 'primary'
  },
  {
    value: 'milestone_invoice',
    label: 'Milestone Invoice',
    description: 'Payment milestone based invoice',
    color: 'info'
  },
  {
    value: 'final_invoice',
    label: 'Final Invoice',
    description: 'Final payment invoice before handover',
    color: 'success'
  },
  {
    value: 'adjustment_invoice',
    label: 'Adjustment Invoice',
    description: 'Price adjustment or correction invoice',
    color: 'warning'
  },
  {
    value: 'additional_charges',
    label: 'Additional Charges',
    description: 'Invoice for additional charges or extras',
    color: 'secondary'
  }
];

// Invoice templates
const INVOICE_TEMPLATES = [
  {
    templateId: 'default',
    templateName: 'Standard Invoice',
    description: 'Standard invoice template with company branding',
    preview: '/templates/standard-preview.png'
  },
  {
    templateId: 'detailed',
    templateName: 'Detailed Invoice',
    description: 'Detailed invoice with itemized breakdown',
    preview: '/templates/detailed-preview.png'
  },
  {
    templateId: 'minimal',
    templateName: 'Minimal Invoice',
    description: 'Clean, minimal invoice design',
    preview: '/templates/minimal-preview.png'
  }
];

// Generation steps
const GENERATION_STEPS = [
  'Verify Sale Details',
  'Configure Invoice',
  'Review & Generate'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Calculate due date based on payment terms
const calculateDueDate = (invoiceDate, paymentTerms = 30) => {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + paymentTerms);
  return date;
};

// Get customer display name
const getCustomerName = (customer) => {
  if (!customer) return 'Unknown Customer';
  const { firstName, lastName, email, phone } = customer;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  if (email) return email;
  if (phone) return phone;
  return 'Unknown Customer';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GenerateInvoicePage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Data state
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Step state
  const [activeStep, setActiveStep] = useState(0);

  // Invoice configuration state
  const [invoiceConfig, setInvoiceConfig] = useState({
    type: 'booking_invoice',
    invoiceDate: new Date(),
    dueDate: calculateDueDate(new Date(), 30),
    paymentTerms: 30,
    template: {
      templateId: 'default',
      templateName: 'Standard Invoice'
    },
    customerNotes: '',
    paymentInstructions: 'Please make payment within the due date.',
    includeDiscounts: true,
    includeTaxBreakdown: true,
    autoSend: false
  });

  // UI state
  const [expandedSection, setExpandedSection] = useState('sale-details');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch sale details
  const fetchSaleDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getSale(saleId);
      
      if (response.data.success) {
        const saleData = response.data.data;
        setSale(saleData);
        
        // Set default customer notes
        const customerName = getCustomerName(saleData.lead);
        setInvoiceConfig(prev => ({
          ...prev,
          customerNotes: `Dear ${customerName},\n\nThank you for your purchase. Please find your invoice details below.`,
        }));
      } else {
        throw new Error('Failed to fetch sale details');
      }
    } catch (error) {
      console.error('Error fetching sale:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load sale details. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (saleId) {
      fetchSaleDetails();
    }
  }, [saleId, fetchSaleDetails]);

  // Update due date when invoice date or payment terms change
  useEffect(() => {
    setInvoiceConfig(prev => ({
      ...prev,
      dueDate: calculateDueDate(prev.invoiceDate, prev.paymentTerms)
    }));
  }, [invoiceConfig.invoiceDate, invoiceConfig.paymentTerms]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle configuration changes
  const handleConfigChange = (field, value) => {
    setInvoiceConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle template selection
  const handleTemplateChange = (template) => {
    setInvoiceConfig(prev => ({
      ...prev,
      template: template
    }));
  };

  // Handle invoice generation
  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      
      const invoiceData = {
        type: invoiceConfig.type,
        dueDate: invoiceConfig.dueDate.toISOString(),
        customerNotes: invoiceConfig.customerNotes,
        paymentInstructions: invoiceConfig.paymentInstructions,
        template: invoiceConfig.template
      };

      const response = await invoiceAPI.createInvoiceFromSale(saleId, invoiceData);
      
      if (response.data.success) {
        const invoice = response.data.data;
        
        setSnackbar({
          open: true,
          message: `Invoice ${invoice.invoiceNumber} generated successfully!`,
          severity: 'success'
        });

        // Navigate to invoice detail page after a short delay
        setTimeout(() => {
          navigate(`/sales/invoices/${invoice._id}`);
        }, 2000);
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to generate invoice. Please try again.',
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Handle back navigation
  const handleBackToSale = () => {
    navigate(`/sales/${saleId}`);
  };

  // Handle refresh sale data
  const handleRefreshSale = () => {
    fetchSaleDetails();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSaleDetailsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Verify Sale Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the sale information before generating the invoice.
      </Typography>

      {/* Sale Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Sale Information"
          action={
            <Tooltip title="Refresh sale data">
              <IconButton onClick={handleRefreshSale} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getCustomerName(sale?.lead)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sale?.lead?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sale?.lead?.phone}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Property Information */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {sale?.project?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unit: {sale?.unit?.unitNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {sale?.unit?.area} sq ft
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Sale Amount */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Sale Amount
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(sale?.salePrice)}
                  </Typography>
                  {sale?.discountAmount > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Discount: {formatCurrency(sale?.discountAmount)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Sale Date */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Booking Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(sale?.bookingDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {sale?.status}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cost Sheet Breakdown */}
      {sale?.costSheetSnapshot && (
        <Accordion 
          expanded={expandedSection === 'cost-breakdown'} 
          onChange={() => setExpandedSection(expandedSection === 'cost-breakdown' ? '' : 'cost-breakdown')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Cost Sheet Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.costSheetSnapshot.components?.map((component, index) => {
                    const gstAmount = (component.amount * (component.gstRate || 0)) / 100;
                    const total = component.amount + gstAmount;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{component.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={component.category} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(component.amount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(gstAmount)}
                          {component.gstRate > 0 && (
                            <Typography variant="caption" display="block">
                              ({component.gstRate}%)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );

  const renderConfigurationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Invoice
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize your invoice settings and preferences.
      </Typography>

      <Grid container spacing={3}>
        {/* Invoice Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Invoice Type</InputLabel>
            <Select
              value={invoiceConfig.type}
              onChange={(e) => handleConfigChange('type', e.target.value)}
              label="Invoice Type"
            >
              {INVOICE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box>
                    <Typography variant="body1">{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Payment Terms */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Payment Terms (Days)</InputLabel>
            <Select
              value={invoiceConfig.paymentTerms}
              onChange={(e) => handleConfigChange('paymentTerms', e.target.value)}
              label="Payment Terms (Days)"
            >
              <MenuItem value={0}>Due Immediately</MenuItem>
              <MenuItem value={15}>Net 15 Days</MenuItem>
              <MenuItem value={30}>Net 30 Days</MenuItem>
              <MenuItem value={45}>Net 45 Days</MenuItem>
              <MenuItem value={60}>Net 60 Days</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Invoice Date */}
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Invoice Date"
            value={invoiceConfig.invoiceDate}
            onChange={(date) => handleConfigChange('invoiceDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>

        {/* Due Date */}
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Due Date"
            value={invoiceConfig.dueDate}
            onChange={(date) => handleConfigChange('dueDate', date)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>

        {/* Template Selection */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Invoice Template
          </Typography>
          <Grid container spacing={2}>
            {INVOICE_TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.templateId}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: invoiceConfig.template.templateId === template.templateId
                      ? `2px solid ${theme.palette.primary.main}`
                      : '1px solid',
                    borderColor: invoiceConfig.template.templateId === template.templateId
                      ? 'primary.main'
                      : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => handleTemplateChange(template)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {template.templateName}
                      </Typography>
                      {invoiceConfig.template.templateId === template.templateId && (
                        <CheckCircle 
                          sx={{ ml: 'auto', color: 'primary.main' }} 
                          fontSize="small" 
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Customer Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Customer Notes"
            value={invoiceConfig.customerNotes}
            onChange={(e) => handleConfigChange('customerNotes', e.target.value)}
            placeholder="Add a personal message for the customer..."
          />
        </Grid>

        {/* Payment Instructions */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Payment Instructions"
            value={invoiceConfig.paymentInstructions}
            onChange={(e) => handleConfigChange('paymentInstructions', e.target.value)}
            placeholder="Provide payment instructions..."
          />
        </Grid>

        {/* Additional Options */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Additional Options
          </Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={invoiceConfig.includeTaxBreakdown}
                  onChange={(e) => handleConfigChange('includeTaxBreakdown', e.target.checked)}
                />
              }
              label="Include detailed tax breakdown"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={invoiceConfig.includeDiscounts}
                  onChange={(e) => handleConfigChange('includeDiscounts', e.target.checked)}
                />
              }
              label="Show discount details"
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Generate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review all details before generating the invoice.
      </Typography>

      {/* Invoice Summary */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Invoice Summary" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Invoice Type</Typography>
              <Typography variant="body1" fontWeight="bold">
                {INVOICE_TYPES.find(t => t.value === invoiceConfig.type)?.label}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Template</Typography>
              <Typography variant="body1" fontWeight="bold">
                {invoiceConfig.template.templateName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Invoice Date</Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatDate(invoiceConfig.invoiceDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Due Date</Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatDate(invoiceConfig.dueDate)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(sale?.salePrice)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Receipt />}
          onClick={handleGenerateInvoice}
          disabled={generating}
          sx={{ minWidth: 200 }}
        >
          {generating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            'Generate Invoice'
          )}
        </Button>
      </Box>
    </Box>
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Sale not found. Please check the sale ID and try again.
        </Alert>
      </Box>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBackToSale} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Generate Invoice
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create invoice for sale #{sale._id?.slice(-8)}
            </Typography>
          </Box>
        </Box>

        {/* Progress Stepper */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {GENERATION_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent sx={{ minHeight: 400 }}>
            {activeStep === 0 && renderSaleDetailsStep()}
            {activeStep === 1 && renderConfigurationStep()}
            {activeStep === 2 && renderReviewStep()}
          </CardContent>
          
          {/* Navigation Buttons */}
          <CardContent sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              
              {activeStep < GENERATION_STEPS.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default GenerateInvoicePage;
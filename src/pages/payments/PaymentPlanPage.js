/**
 * File: src/pages/payments/PaymentPlanPage.js
 * Description: COMPLETE FIXED - Comprehensive payment plan management page with installments and transactions
 * Version: 2.0 - Fixed payment plan creation flow and API integration
 * Location: src/pages/payments/PaymentPlanPage.js
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Snackbar,
  InputAdornment,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
  Payment,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  CheckCircle,
  Schedule,
  Warning,
  Receipt,
  AttachMoney,
  AccountBalance,
  Timeline,
  Assessment,
  Calculate,
  Refresh,
  Print,
  Download,
  Email,
  Phone,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
  Info,
  History,
  CreditCard,
  AccountBalanceWallet,
  MonetizationOn,
  TrendingUp,
  CalendarToday,
  PieChart,
  BarChart,
  Visibility,
  VisibilityOff,
  Settings,
  Build,
  ArrowForward,
  Clear,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useAuth } from '../../context/AuthContext';
import { salesAPI, paymentAPI, projectPaymentAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '../../utils/formatters';

// Constants
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'online_payment', label: 'Online Payment', icon: '💳' },
  { value: 'card_payment', label: 'Card Payment', icon: '💳' },
  { value: 'demand_draft', label: 'Demand Draft', icon: '📄' },
  { value: 'home_loan', label: 'Home Loan', icon: '🏠' },
];

const INSTALLMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'due', label: 'Due', color: 'warning' },
  { value: 'overdue', label: 'Overdue', color: 'error' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'info' },
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'waived', label: 'Waived', color: 'secondary' },
];

const PLAN_TYPES = [
  { value: 'construction_linked', label: 'Construction Linked', description: 'Payments tied to construction milestones' },
  { value: 'time_based', label: 'Time Based', description: 'Fixed schedule based on time intervals' },
  { value: 'milestone_based', label: 'Milestone Based', description: 'Payments based on project milestones' },
  { value: 'custom', label: 'Custom', description: 'Customized payment schedule' },
];

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// FIXED CREATE PAYMENT PLAN COMPONENT - FOLLOWING CreateSalePage.js PATTERN
// ============================================================================

const CreatePaymentPlan = ({ 
  sale, 
  onPlanCreated, 
  onClose,
  open = false 
}) => {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState('');

  const steps = [
    'Select Payment Template',
    'Review Payment Schedule', 
    'Confirm & Create Plan'
  ];

  // Load payment templates when component mounts or sale changes
  useEffect(() => {
    if (sale && open) {
      loadPaymentTemplates();
    }
  }, [sale, open]);

  const loadPaymentTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setError('');
      
      console.log('🔄 Loading payment templates for sale:', sale._id, 'project:', sale.project);
      
      // Get project ID - handle both populated and non-populated project
      const projectId = sale.project?._id || sale.project;
      
      if (!projectId) {
        throw new Error('Project information not found for this sale');
      }
      
      // FIXED: Use the correct API method that matches your CreateSalePage.js
      const response = await projectPaymentAPI.getPaymentPlanTemplates(projectId);
      const templatesData = response.data?.data || response.data || [];
      
      console.log('📊 Templates loaded:', templatesData.length);
      setTemplates(templatesData);
      
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load payment templates');
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Generate payment schedule when template is selected
  const generatePaymentSchedule = useCallback((template) => {
    if (!template || !sale) return [];

    const totalAmount = sale.salePrice || sale.finalAmount || 0;
    const startDate = new Date();

    return template.installments.map((installment, index) => {
      const amount = Math.round((totalAmount * installment.percentage) / 100);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (installment.dueAfterDays || 0));

      return {
        installmentNumber: installment.installmentNumber || index + 1,
        description: installment.description,
        percentage: installment.percentage,
        amount: amount,
        dueDate: dueDate,
        milestoneType: installment.milestoneType,
        status: 'pending',
        isOptional: installment.isOptional || false,
      };
    });
  }, [sale]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const schedule = generatePaymentSchedule(template);
    setPaymentSchedule(schedule);
  };

  // Handle payment plan creation
  const handleCreatePlan = async () => {
    if (!selectedTemplate || !paymentSchedule.length) {
      setError('Please select a payment template first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // FIXED: Use the correct API method and data structure
      const planData = {
        saleId: sale._id,
        templateName: selectedTemplate.name,
        paymentPlanSnapshot: {
          templateId: selectedTemplate._id,
          templateName: selectedTemplate.name,
          planType: selectedTemplate.planType,
          installments: paymentSchedule,
          gracePeriodDays: selectedTemplate.gracePeriodDays || 7,
          lateFeeRate: selectedTemplate.lateFeeRate || 0,
        }
      };

      console.log('📝 Creating payment plan with data:', planData);
      
      // FIXED: Use the correct API method name that exists in your backend
      const response = await paymentAPI.createPaymentPlan(planData);
      
      console.log('✅ Payment plan created successfully:', response.data);
      
      // Call the callback to refresh parent data
      if (onPlanCreated) {
        onPlanCreated();
      }
      
      // Close the dialog
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('❌ Error creating payment plan:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create payment plan');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !selectedTemplate) {
      setError('Please select a payment template');
      return;
    }
    setStep(prev => prev + 1);
    setError('');
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError('');
  };

  const renderStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Select Payment Template
        if (loadingTemplates) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading payment templates...</Typography>
            </Box>
          );
        }

        if (templates.length === 0) {
          return (
            <Alert severity="warning">
              <Typography variant="h6" gutterBottom>No Payment Templates Available</Typography>
              <Typography variant="body2">
                This project doesn't have any active payment plan templates. 
                Please contact your administrator to set up payment templates for this project.
              </Typography>
            </Alert>
          );
        }

        return (
          <Grid container spacing={2}>
            {templates.map(template => (
              <Grid item xs={12} sm={6} md={4} key={template._id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate?._id === template._id ? 2 : 1,
                    borderColor: selectedTemplate?._id === template._id ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: selectedTemplate?._id === template._id ? 'primary.main' : 'grey.400' }}>
                        {selectedTemplate?._id === template._id ? <CheckCircle /> : <AccountBalance />}
                      </Avatar>
                    }
                    title={template.name}
                    subheader={template.planType?.replace('_', ' ')}
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
                        <Typography variant="caption" noWrap sx={{ maxWidth: '70%' }}>
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        );

      case 1: // Review Payment Schedule
        if (!selectedTemplate || !paymentSchedule.length) {
          return (
            <Alert severity="warning">
              No payment schedule generated. Please go back and select a template.
            </Alert>
          );
        }

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Schedule Preview
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Template: {selectedTemplate.name} • Total Amount: {formatCurrency(sale.salePrice || 0)}
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Milestone</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentSchedule.map((installment, index) => (
                    <TableRow key={index}>
                      <TableCell>#{installment.installmentNumber}</TableCell>
                      <TableCell>{installment.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={installment.milestoneType?.replace('_', ' ')} 
                          size="small" 
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatPercentage(installment.percentage)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(installment.amount)}
                      </TableCell>
                      <TableCell>{formatDate(installment.dueDate)}</TableCell>
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
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2: // Confirm & Create
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Payment Plan Creation
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Sale Information
                    </Typography>
                    <Typography variant="body2">
                      Sale ID: {sale.saleNumber || sale._id}
                    </Typography>
                    <Typography variant="body2">
                      Customer: {sale.lead?.firstName} {sale.lead?.lastName}
                    </Typography>
                    <Typography variant="body2">
                      Unit: {sale.unit?.unitNumber}
                    </Typography>
                    <Typography variant="body2">
                      Sale Amount: {formatCurrency(sale.salePrice || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Payment Plan Details
                    </Typography>
                    <Typography variant="body2">
                      Template: {selectedTemplate?.name}
                    </Typography>
                    <Typography variant="body2">
                      Plan Type: {selectedTemplate?.planType?.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2">
                      Total Installments: {paymentSchedule.length}
                    </Typography>
                    <Typography variant="body2">
                      Grace Period: {selectedTemplate?.gracePeriodDays || 0} days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Confirmation:</strong> You are about to create a payment plan for this sale. 
                This will generate {paymentSchedule.length} installments with the payment schedule shown above.
                This action cannot be undone.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5">
              Create Payment Plan
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Set up installment schedule for sale: {sale?.saleNumber || sale?._id}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Clear />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={step} orientation="horizontal" sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(step)}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        {step > 0 && (
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
        )}
        
        {step < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
            disabled={step === 0 && !selectedTemplate}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleCreatePlan}
            disabled={loading || !selectedTemplate}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {loading ? 'Creating Plan...' : 'Create Payment Plan'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// FIXED PAYMENT PLAN OVERVIEW COMPONENT
// ============================================================================

const PaymentPlanOverview = ({ paymentPlan, sale, onRefresh, financialSummary, installments }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // FIXED: If no payment plan exists, show the create option with dialog
  if (!paymentPlan) {
    return (
      <>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>No Payment Plan Available</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This sale doesn't have a payment plan configured yet. You can create one now using 
            the available payment plan templates for this project.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
            size="large"
          >
            Create Payment Plan
          </Button>
        </Alert>

        {/* FIXED: Use the corrected CreatePaymentPlan component */}
        <CreatePaymentPlan
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          sale={sale}
          onPlanCreated={() => {
            setShowCreateDialog(false);
            onRefresh(); // Refresh the parent component to load the new payment plan
          }}
        />
      </>
    );
  }

  // Use the ROOT LEVEL financialSummary, not the nested one in paymentPlan
  const totalAmount = financialSummary?.totalAmount || paymentPlan.totalAmount || 0;
  const totalPaid = financialSummary?.totalPaid || 0;
  const totalOutstanding = financialSummary?.totalOutstanding || 0;
  
  // Calculate next due with fallback logic
  let nextDueAmount = financialSummary?.nextDueAmount || 0;
  let nextDueDate = financialSummary?.nextDueDate;

  // FALLBACK: If API doesn't provide next due info, calculate from installments
  if ((!nextDueDate || nextDueAmount === 0) && installments?.length > 0) {
    const nextDueInstallment = installments
      .filter(inst => inst.status === 'pending' || inst.status === 'due')
      .sort((a, b) => new Date(a.currentDueDate) - new Date(b.currentDueDate))[0];
    
    if (nextDueInstallment) {
      nextDueDate = nextDueInstallment.currentDueDate;
      nextDueAmount = nextDueInstallment.pendingAmount || nextDueInstallment.currentAmount;
    }
  }

  const completionPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <Grid container spacing={3}>
      {/* Payment Plan Summary Cards */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <MonetizationOn sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(totalAmount)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Plan Amount
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(totalPaid)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Amount Paid
            </Typography>
            {totalPaid > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                ✅ Payment Recorded
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(totalOutstanding)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Outstanding
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {formatPercentage(completionPercentage)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Completion
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Progress Bar */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Payment Progress</Typography>
              <Typography variant="body2" color="textSecondary">
                {formatPercentage(completionPercentage)} Complete
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ 
                height: 12, 
                borderRadius: 6, 
                mb: 2,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: completionPercentage > 50 ? '#4caf50' : '#ff9800'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="success.main" fontWeight="medium">
                Paid: {formatCurrency(totalPaid)}
              </Typography>
              <Typography variant="body2" color="warning.main" fontWeight="medium">
                Remaining: {formatCurrency(totalOutstanding)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Plan Details */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Payment Plan Details" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Plan Type</Typography>
                    <Chip 
                      label={PLAN_TYPES.find(t => t.value === paymentPlan.planType)?.label || paymentPlan.planType} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Template Used</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {paymentPlan.templateUsed || 'Custom Plan'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Grace Period</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {paymentPlan.paymentTerms?.gracePeriodDays || 0} days
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Chip 
                      label={paymentPlan.status || 'Active'} 
                      color={paymentPlan.status === 'completed' ? 'success' : 'primary'}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Late Fee Rate</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatPercentage(paymentPlan.paymentTerms?.lateFeeRate || 0)} per month
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Created Date</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(paymentPlan.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Next Payment Due */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader 
            title="Next Payment Due" 
            avatar={
              <Avatar sx={{ bgcolor: nextDueDate ? 'warning.main' : 'success.main' }}>
                {nextDueDate ? <CalendarToday /> : <CheckCircle />}
              </Avatar>
            }
          />
          <CardContent>
            {nextDueDate && nextDueAmount > 0 ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    {formatCurrency(nextDueAmount)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Due on {formatDate(nextDueDate)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Payment />}
                  fullWidth
                  onClick={() => {/* Switch to transactions tab */}}
                >
                  Record Payment
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mx: 'auto' }} />
                <Typography variant="body1" color="success.main" fontWeight="medium">
                  All Current Payments Complete
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  No pending payments at this time
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ============================================================================
// INSTALLMENTS MANAGEMENT COMPONENT
// ============================================================================

const InstallmentsManagement = ({ saleId, paymentPlan, installments, onRefresh }) => {
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [waiveDialog, setWaiveDialog] = useState({ open: false, installment: null });
  const [formData, setFormData] = useState({ amount: 0, dueDate: null, reason: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleEditInstallment = (installment) => {
    setEditingInstallment(installment);
    setFormData({
      amount: installment.currentAmount,
      dueDate: new Date(installment.currentDueDate),
      reason: ''
    });
    setEditDialog(true);
  };

  const handleSaveInstallment = async () => {
    try {
      setLoading(true);
      await paymentAPI.updateInstallment(editingInstallment._id, {
        amount: formData.amount,
        dueDate: formData.dueDate,
        reason: formData.reason
      });
      
      setSnackbar({ open: true, message: 'Installment updated successfully', severity: 'success' });
      setEditDialog(false);
      onRefresh();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update installment', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleWaiveInstallment = async () => {
    try {
      setLoading(true);
      await paymentAPI.waiveInstallment(waiveDialog.installment._id, {
        reason: formData.reason
      });
      
      setSnackbar({ open: true, message: 'Installment waived successfully', severity: 'success' });
      setWaiveDialog({ open: false, installment: null });
      onRefresh();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to waive installment', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const config = INSTALLMENT_STATUSES.find(s => s.value === status) || INSTALLMENT_STATUSES[0];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getRowColor = (installment) => {
    if (installment.status === 'overdue') return 'error.50';
    if (installment.status === 'due') return 'warning.50';
    if (installment.status === 'paid') return 'success.50';
    return 'transparent';
  };

  return (
    <Box>
      <Card>
        <CardHeader 
          title={`Installment Schedule (${installments?.length || 0})`}
          action={
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {installments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No installments found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  installments?.map((installment) => (
                    <TableRow 
                      key={installment._id}
                      sx={{ backgroundColor: getRowColor(installment) }}
                    >
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
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(installment.currentAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {formatCurrency(installment.paidAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          {formatCurrency(installment.pendingAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(installment.currentDueDate)}
                        </Typography>
                        {installment.isOverdue && (
                          <Typography variant="caption" color="error">
                            {installment.daysOverdue} days overdue
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(installment.status)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Installment">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditInstallment(installment)}
                              disabled={installment.status === 'paid' || installment.status === 'waived'}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {installment.canBeWaived && installment.status !== 'paid' && (
                            <Tooltip title="Waive Installment">
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={() => setWaiveDialog({ open: true, installment })}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Installment Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Installment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <TextField
              fullWidth
              label="Reason for Change"
              multiline
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveInstallment} 
            variant="contained"
            disabled={loading || !formData.reason}
          >
            {loading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Waive Installment Dialog */}
      <Dialog open={waiveDialog.open} onClose={() => setWaiveDialog({ open: false, installment: null })}>
        <DialogTitle>Waive Installment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to waive this installment? This action cannot be undone.
          </DialogContentText>
          <TextField
            fullWidth
            label="Reason for Waiver"
            multiline
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaiveDialog({ open: false, installment: null })}>Cancel</Button>
          <Button 
            onClick={handleWaiveInstallment} 
            color="warning" 
            variant="contained"
            disabled={loading || !formData.reason}
          >
            {loading ? <CircularProgress size={20} /> : 'Waive Installment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ============================================================================
// PAYMENT TRANSACTIONS COMPONENT
// ============================================================================

const PaymentTransactions = ({ saleId, paymentPlan, transactions, onRefresh }) => {
  const [addPaymentDialog, setAddPaymentDialog] = useState(false);
  const [editTransactionDialog, setEditTransactionDialog] = useState({ open: false, transaction: null });
  const [verifyDialog, setVerifyDialog] = useState({ open: false, transaction: null });
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date(),
    paymentMethod: 'bank_transfer',
    notes: '',
    methodDetails: {}
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddPayment = async () => {
    try {
      setLoading(true);
      await paymentAPI.recordPayment({
        paymentPlanId: paymentPlan._id,
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
        paymentMethodDetails: paymentForm.methodDetails
      });
      
      setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' });
      setAddPaymentDialog(false);
      resetPaymentForm();
      
      // Force immediate refresh of all data
      onRefresh();
      
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to record payment', severity: 'error' });
      console.error('Payment recording error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: 'bank_transfer',
      notes: '',
      methodDetails: {}
    });
  };

  const getPaymentMethodIcon = (method) => {
    const config = PAYMENT_METHODS.find(m => m.value === method);
    return config?.icon || '💳';
  };

  const getTransactionStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'verified': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader 
          title={`Payment History (${transactions?.length || 0})`}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddPaymentDialog(true)}
              >
                Record Payment
              </Button>
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No payment transactions found
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setAddPaymentDialog(true)}
                        sx={{ mt: 2 }}
                      >
                        Record First Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions?.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.transactionNumber || transaction._id?.slice(-8)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDateTime(transaction.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(transaction.amount)}
                        </Typography>
                        {transaction.processingFee > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Fee: {formatCurrency(transaction.processingFee)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                          </Typography>
                          <Typography variant="body2">
                            {PAYMENT_METHODS.find(m => m.value === transaction.paymentMethod)?.label || transaction.paymentMethod}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(transaction.paymentDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.status} 
                          color={getTransactionStatusColor(transaction.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {transaction.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Transaction">
                            <IconButton 
                              size="small"
                              onClick={() => setEditTransactionDialog({ open: true, transaction })}
                              disabled={transaction.status === 'completed'}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {transaction.status === 'pending' && (
                            <Tooltip title="Verify Payment">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => setVerifyDialog({ open: true, transaction })}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialog} onClose={() => setAddPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record New Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Payment Date"
                  value={paymentForm.paymentDate}
                  onChange={(date) => setPaymentForm(prev => ({ ...prev, paymentDate: date }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentForm.paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  {PAYMENT_METHODS.map(method => (
                    <MenuItem key={method.value} value={method.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{method.icon}</Typography>
                        <Typography>{method.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={paymentForm.methodDetails.referenceNumber || ''}
                onChange={(e) => setPaymentForm(prev => ({ 
                  ...prev, 
                  methodDetails: { ...prev.methodDetails, referenceNumber: e.target.value }
                }))}
                placeholder="Transaction/Cheque number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional payment details..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPayment} 
            variant="contained"
            disabled={loading || paymentForm.amount <= 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ============================================================================
// MAIN PAYMENT PLAN PAGE COMPONENT - FIXED VERSION
// ============================================================================

const PaymentPlanPage = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management - ADDED financialSummary state
  const [sale, setSale] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null); // NEW STATE
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canViewPayments = hasPermission && typeof hasPermission === 'function' ? hasPermission('SALES') : true;
  const canEditPayments = hasPermission && typeof hasPermission === 'function' ? hasPermission('SALES') : true;

  // FIXED loadData function to handle the correct data structure
  const loadData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      // Load sale data first
      const saleResponse = await salesAPI.getSale(saleId);
      const saleData = saleResponse.data.data || saleResponse.data;
      setSale(saleData);

      // Try to load payment plan
      try {
        const planResponse = await paymentAPI.getPaymentPlanDetails(saleId);
        const planData = planResponse.data.data;
        
        // Extract the correct data from API response
        setPaymentPlan(planData.paymentPlan);
        setInstallments(planData.installments || []);
        setTransactions(planData.transactions || []);
        setFinancialSummary(planData.financialSummary); // USE ROOT LEVEL financialSummary
        
        console.log('=== PAYMENT DATA LOADING DEBUG ===');
        console.log('Full API Response:', planData);
        console.log('Root financialSummary:', planData.financialSummary);
        console.log('Nested financialSummary:', planData.paymentPlan?.financialSummary);
        console.log('Using ROOT level for accuracy');
        console.log('Installments count:', planData.installments?.length);
        console.log('Transactions count:', planData.transactions?.length);
        console.log('=== END LOADING DEBUG ===');
        
      } catch (planError) {
        console.error('Payment plan loading error:', planError);
        // Payment plan doesn't exist - this is expected for new sales
        if (planError.response?.status === 404) {
          console.log('📝 No payment plan exists yet - showing creation option');
          setPaymentPlan(null);
          setInstallments([]);
          setTransactions([]);
          setFinancialSummary(null);
        } else {
          throw planError; // Re-throw other errors
        }
      }

    } catch (error) {
      console.error('Error loading payment plan data:', error);
      setError('Failed to load payment plan data. Please try again.');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [saleId]);

  // Initial load
  useEffect(() => {
    if (saleId) {
      loadData();
    }
  }, [loadData, saleId]);

  // Auto-refresh on tab change
  useEffect(() => {
    if (activeTab === 0 && paymentPlan) {
      // Silently refresh overview when switching to it
      loadData(false);
    }
  }, [activeTab, paymentPlan, loadData]);

  // Handle refresh
  const handleRefresh = () => {
    loadData(true);
  };

  // Handle plan created
  const handlePlanCreated = () => {
    loadData(true);
    setActiveTab(0); // Switch to overview tab
  };

  if (!canViewPayments) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to view payment plans.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={60} />
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6">Loading payment plan...</Typography>
          <Typography variant="body2" color="textSecondary">
            Please wait while we fetch the data
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh} startIcon={<Refresh />}>
          Retry
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
              Payment Plan
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sale #{sale.saleNumber || sale._id?.slice(-6)} • {sale.lead?.firstName} {sale.lead?.lastName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => navigate(`/sales/${saleId}`)}
          >
            View Sale
          </Button>
          {paymentPlan && (
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          )}
        </Box>
      </Box>

      {/* Progress bar for refreshing */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Main Content */}
      <Box>
        {/* Tabs - Only show if payment plan exists */}
        {paymentPlan && (
          <Card sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
              <Tab label="Overview" icon={<Assessment />} />
              <Tab label="Installments" icon={<Schedule />} />
              <Tab label="Transactions" icon={<AccountBalance />} />
              <Tab label="Reports" icon={<BarChart />} />
            </Tabs>
          </Card>
        )}

        {/* Tab Content - PASS CORRECT DATA */}
        <TabPanel value={activeTab} index={0}>
          <PaymentPlanOverview 
            paymentPlan={paymentPlan} 
            sale={sale} 
            onRefresh={handleRefresh}
            financialSummary={financialSummary} // PASS THE ROOT LEVEL DATA
            installments={installments} // PASS INSTALLMENTS FOR NEXT DUE CALCULATION
          />
        </TabPanel>

        {paymentPlan && (
          <>
            <TabPanel value={activeTab} index={1}>
              <InstallmentsManagement 
                saleId={saleId}
                paymentPlan={paymentPlan}
                installments={installments}
                onRefresh={handleRefresh}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <PaymentTransactions 
                saleId={saleId}
                paymentPlan={paymentPlan}
                transactions={transactions}
                onRefresh={handleRefresh}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Card>
                <CardHeader title="Payment Reports" />
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Payment reports and analytics will be available here.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>
          </>
        )}
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && paymentPlan && canEditPayments && (
        <Fab
          color="primary"
          aria-label="add payment"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setActiveTab(2)} // Switch to transactions tab
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default PaymentPlanPage;
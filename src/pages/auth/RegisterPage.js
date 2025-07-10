// File: src/pages/auth/RegisterPage.js
// Description: Registration page component for PropVantage AI - Complete organization and user setup
// Version: 1.0 - Multi-step registration form with real database integration
// Location: src/pages/auth/RegisterPage.js

import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

// Form validation utilities
const validateOrganizationStep = (data) => {
  const errors = {};

  if (!data.organizationName?.trim()) {
    errors.organizationName = 'Organization name is required';
  } else if (data.organizationName.trim().length < 2) {
    errors.organizationName = 'Organization name must be at least 2 characters';
  }

  if (!data.organizationType) {
    errors.organizationType = 'Please select organization type';
  }

  if (!data.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!data.country?.trim()) {
    errors.country = 'Country is required';
  }

  if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
    errors.website = 'Please enter a valid website URL';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateUserStep = (data) => {
  const errors = {};

  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and number';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the terms and conditions';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Step components
const OrganizationStep = ({ formData, errors, onChange, isLoading }) => {
  const organizationTypes = [
    { value: 'builder', label: 'Real Estate Builder' },
    { value: 'developer', label: 'Property Developer' },
    { value: 'consultant', label: 'Real Estate Consultant' },
    { value: 'broker', label: 'Real Estate Broker' },
    { value: 'agency', label: 'Real Estate Agency' },
    { value: 'other', label: 'Other' },
  ];

  const countries = [
    { value: 'India', label: 'India' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Organization Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Organization Name"
            placeholder="Enter your company/organization name"
            value={formData.organizationName}
            onChange={onChange('organizationName')}
            error={!!errors.organizationName}
            helperText={errors.organizationName}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business color={errors.organizationName ? 'error' : 'action'} />
                </InputAdornment>
              ),
            }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Organization Type"
            value={formData.organizationType}
            onChange={onChange('organizationType')}
            error={!!errors.organizationType}
            helperText={errors.organizationType}
            disabled={isLoading}
            required
          >
            {organizationTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={onChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone color={errors.phone ? 'error' : 'action'} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            placeholder="Mumbai"
            value={formData.city}
            onChange={onChange('city')}
            error={!!errors.city}
            helperText={errors.city}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color={errors.city ? 'error' : 'action'} />
                </InputAdornment>
              ),
            }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Country"
            value={formData.country}
            onChange={onChange('country')}
            error={!!errors.country}
            helperText={errors.country}
            disabled={isLoading}
            required
          >
            {countries.map((country) => (
              <MenuItem key={country.value} value={country.value}>
                {country.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Website (Optional)"
            placeholder="https://yourcompany.com"
            value={formData.website}
            onChange={onChange('website')}
            error={!!errors.website}
            helperText={errors.website}
            disabled={isLoading}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Address (Optional)"
            placeholder="Complete business address"
            value={formData.address}
            onChange={onChange('address')}
            disabled={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const UserStep = ({ formData, errors, onChange, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Admin Account Setup
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChange={onChange('firstName')}
            error={!!errors.firstName}
            helperText={errors.firstName}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color={errors.firstName ? 'error' : 'action'} />
                </InputAdornment>
              ),
            }}
            required
            autoComplete="given-name"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={onChange('lastName')}
            error={!!errors.lastName}
            helperText={errors.lastName}
            disabled={isLoading}
            required
            autoComplete="family-name"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            placeholder="john.doe@yourcompany.com"
            value={formData.email}
            onChange={onChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color={errors.email ? 'error' : 'action'} />
                </InputAdornment>
              ),
            }}
            required
            autoComplete="email"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={onChange('password')}
            error={!!errors.password}
            helperText={errors.password || 'Must contain uppercase, lowercase, and number'}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color={errors.password ? 'error' : 'action'} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            required
            autoComplete="new-password"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={onChange('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            required
            autoComplete="new-password"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.agreeToTerms}
                onChange={onChange('agreeToTerms')}
                disabled={isLoading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </Link>
              </Typography>
            }
          />
          {errors.agreeToTerms && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              {errors.agreeToTerms}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// Main Registration Page Component
const RegisterPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { register, isLoading, error: authError, clearError } = useAuth();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Organization Details', 'Admin Account', 'Complete Setup'];

  // Form data state
  const [formData, setFormData] = useState({
    // Organization data
    organizationName: '',
    organizationType: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: 'India',

    // User data
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  // Error state
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Clear auth error on component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const value = field === 'agreeToTerms' ? event.target.checked : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }

    // Clear auth error when user modifies form
    if (authError) {
      clearError();
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 0) {
      // Validate organization step
      const validation = validateOrganizationStep(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setSubmitAttempted(true);
        return;
      }
    } else if (activeStep === 1) {
      // Validate user step
      const validation = validateUserStep(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setSubmitAttempted(true);
        return;
      }
    }

    setErrors({});
    setSubmitAttempted(false);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitAttempted(true);

    // Final validation
    const orgValidation = validateOrganizationStep(formData);
    const userValidation = validateUserStep(formData);

    if (!orgValidation.isValid || !userValidation.isValid) {
      setErrors({ ...orgValidation.errors, ...userValidation.errors });
      setActiveStep(0); // Go back to first step with errors
      return;
    }

    try {
      // Prepare registration data
      const registrationData = {
        // Organization data
        name: formData.organizationName.trim(),
        type: formData.organizationType,
        country: formData.country,
        city: formData.city.trim(),
        contactInfo: {
          phone: formData.phone?.trim() || '',
          website: formData.website?.trim() || '',
          address: formData.address?.trim() || '',
        },

        // Admin user data
        adminUser: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: 'Business Head',
        },

        // Subscription plan (default)
        subscriptionPlan: 'professional',
      };

      // Submit registration
      const result = await register(registrationData);

      if (result.success) {
        enqueueSnackbar(
          `Welcome to PropVantage AI, ${result.user.firstName}! Your account has been created successfully.`,
          { 
            variant: 'success',
            autoHideDuration: 5000,
          }
        );

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Registration error:', error);
      enqueueSnackbar('Registration failed. Please try again.', { 
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  };

  // Step content renderer
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <OrganizationStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
            isLoading={isLoading}
          />
        );
      case 1:
        return (
          <UserStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                mb: 3,
              }} 
            />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Ready to Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Review your information and create your PropVantage AI account to start managing your real estate business.
            </Typography>
            
            <Paper sx={{ p: 3, textAlign: 'left', bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Account Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Organization
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.organizationName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Admin User
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.firstName} {formData.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.city}, {formData.country}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Set up your PropVantage AI account to start managing your real estate business with AI-powered insights."
    >
      <Box>
        {/* Auth Error Display */}
        {authError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={clearError}
          >
            {authError}
          </Alert>
        )}

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || isLoading}
            startIcon={<ArrowBack />}
            sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckCircle />
                )
              }
              sx={{ px: 4 }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isLoading}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          )}
        </Box>

        {/* Login Link */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Already have an account?
          </Typography>
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign in to your account
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default RegisterPage;
// File: src/pages/auth/RegisterPage.js
// Description: Professional registration page matching login design for PropVantage AI
// Version: 2.0 - Complete redesign with multi-step form and professional styling
// Location: src/pages/auth/RegisterPage.js

import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
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
  MenuItem,
  Grid,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
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
  BusinessCenter,
  PersonAdd,
  Language,
  AccountBalance,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';

// PropVantage AI Logo Component (matching login page)
const PropVantageLogo = ({ size = 'large' }) => {
  const theme = useTheme();
  
  const logoSizes = {
    small: { fontSize: '1.5rem', iconSize: 24 },
    medium: { fontSize: '2rem', iconSize: 32 },
    large: { fontSize: '2.5rem', iconSize: 40 },
  };
  
  const currentSize = logoSizes[size];
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: theme.palette.primary.main,
          width: currentSize.iconSize * 1.5,
          height: currentSize.iconSize * 1.5,
        }}
      >
        <BusinessCenter sx={{ fontSize: currentSize.iconSize }} />
      </Avatar>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: currentSize.fontSize,
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          PropVantage
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            letterSpacing: '0.1em',
            mt: -0.5,
          }}
        >
          AI POWERED CRM
        </Typography>
      </Box>
    </Box>
  );
};

// Multi-step form configuration
const steps = ['Organization Details', 'Admin User Setup', 'Confirmation'];

// Organization types
const organizationTypes = [
  'Real Estate Developer',
  'Construction Company',
  'Property Consulting',
  'Real Estate Agency',
  'Architecture Firm',
  'Other',
];

// Countries list (simplified)
const countries = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'UAE',
  'Other',
];

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

const RegisterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    // Organization data
    organizationName: '',
    organizationType: '',
    city: '',
    country: '',
    phone: '',
    website: '',
    address: '',
    
    // User data
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    agreeToTerms: false,
    agreeToMarketing: false,
  });

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
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
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0) {
      const validation = validateOrganizationStep(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
    } else if (activeStep === 1) {
      const validation = validateUserStep(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
    }

    setErrors({});
    setActiveStep(prev => prev + 1);
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Prepare registration data
      const registrationData = {
        orgName: formData.organizationName,
        orgType: formData.organizationType,
        city: formData.city,
        country: formData.country,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
      };

      const result = await register(registrationData);

      if (result.success) {
        enqueueSnackbar('Account created successfully! Welcome to PropVantage AI.', {
          variant: 'success',
        });
        
        // Redirect to dashboard
        navigate(result.redirectTo || '/dashboard');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      enqueueSnackbar(error.message || 'Registration failed. Please try again.', {
        variant: 'error',
      });
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Render organization step
  const renderOrganizationStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Organization Name"
          placeholder="Enter your company name"
          value={formData.organizationName}
          onChange={handleInputChange('organizationName')}
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
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Organization Type"
          value={formData.organizationType}
          onChange={handleInputChange('organizationType')}
          error={!!errors.organizationType}
          helperText={errors.organizationType}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountBalance color={errors.organizationType ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        >
          {organizationTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Country"
          value={formData.country}
          onChange={handleInputChange('country')}
          error={!!errors.country}
          helperText={errors.country}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Language color={errors.country ? 'error' : 'action'} />
              </InputAdornment>
            ),
          }}
        >
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          placeholder="Enter city"
          value={formData.city}
          onChange={handleInputChange('city')}
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
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number (Optional)"
          placeholder="+1 234 567 8900"
          value={formData.phone}
          onChange={handleInputChange('phone')}
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

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Website (Optional)"
          placeholder="https://yourcompany.com"
          value={formData.website}
          onChange={handleInputChange('website')}
          disabled={isLoading}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address (Optional)"
          placeholder="Enter full address"
          value={formData.address}
          onChange={handleInputChange('address')}
          disabled={isLoading}
          multiline
          rows={2}
        />
      </Grid>
    </Grid>
  );

  // Render user step
  const renderUserStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={handleInputChange('firstName')}
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
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          placeholder="Enter last name"
          value={formData.lastName}
          onChange={handleInputChange('lastName')}
          error={!!errors.lastName}
          helperText={errors.lastName}
          disabled={isLoading}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleInputChange('email')}
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
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={!!errors.password}
          helperText={errors.password || 'Min 8 characters with uppercase, lowercase & number'}
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
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
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
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Phone Number (Optional)"
          placeholder="+1 234 567 8900"
          value={formData.phoneNumber}
          onChange={handleInputChange('phoneNumber')}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.agreeToTerms}
              onChange={handleInputChange('agreeToTerms')}
              disabled={isLoading}
              color={errors.agreeToTerms ? 'error' : 'primary'}
            />
          }
          label={
            <Typography variant="body2" color={errors.agreeToTerms ? 'error' : 'text.secondary'}>
              I agree to the{' '}
              <Link href="#" sx={{ textDecoration: 'none' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" sx={{ textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </Typography>
          }
        />
        {errors.agreeToTerms && (
          <Typography variant="body2" color="error" sx={{ mt: 1, ml: 4 }}>
            {errors.agreeToTerms}
          </Typography>
        )}
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.agreeToMarketing}
              onChange={handleInputChange('agreeToMarketing')}
              disabled={isLoading}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              I would like to receive marketing emails about PropVantage AI updates and features
            </Typography>
          }
        />
      </Grid>
    </Grid>
  );

  // Render confirmation step
  const renderConfirmationStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Ready to Create Your Account
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Organization: <strong>{formData.organizationName}</strong>
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Admin User: <strong>{formData.firstName} {formData.lastName}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Click "Create Account" to set up your PropVantage AI account.
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="md">
        {/* Logo */}
        <PropVantageLogo size={isMobile ? 'medium' : 'large'} />

        {/* Registration Card */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.grey[200]}`,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Create Your Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Join thousands of real estate professionals using PropVantage AI
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Display */}
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.submit}
              </Alert>
            )}

            {/* Form Content */}
            <Box sx={{ mb: 4 }}>
              {activeStep === 0 && renderOrganizationStep()}
              {activeStep === 1 && renderUserStep()}
              {activeStep === 2 && renderConfirmationStep()}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isLoading}
                startIcon={<ArrowBack />}
                sx={{ 
                  visibility: activeStep === 0 ? 'hidden' : 'visible',
                  color: 'text.secondary',
                }}
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
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                    },
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading}
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                    },
                  }}
                >
                  Next
                </Button>
              )}
            </Box>

            {/* Login Link */}
            <Divider sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
            </Divider>

            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              startIcon={<PersonAdd />}
              sx={{
                py: 1.5,
                fontWeight: 500,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.50',
                },
              }}
            >
              Sign In to Existing Account
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            © 2024 PropVantage AI. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;
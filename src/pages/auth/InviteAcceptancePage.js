// File: src/pages/auth/InviteAcceptancePage.js
// Description: FIXED Invitation acceptance page with proper API response handling and state management
// Version: 2.2.0 - Fixed response structure parsing and prevented re-verification after acceptance
// Location: src/pages/auth/InviteAcceptancePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Error as ErrorIcon,
  BusinessCenter,
  Person,
  Email,
  Security,
  Login,
  VpnKey,
  Check,
  Close,
  Timer,
  Warning,
  Refresh,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Import services and context
import { useAuth } from '../../context/AuthContext';
import { invitationAPI, handleAPIError } from '../../services/api';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const INVITE_CONFIG = {
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  
  STEPS: [
    'Verify Invitation',
    'Set Password',
    'Complete Setup',
  ],
  
  STATUS: {
    LOADING: 'loading',
    VALID: 'valid',
    INVALID: 'invalid',
    EXPIRED: 'expired',
    USED: 'used',
    ERROR: 'error',
  },
};

// PropVantage AI Logo Component
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

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

const validatePassword = (password) => {
  const requirements = INVITE_CONFIG.PASSWORD_REQUIREMENTS;
  const errors = [];
  const checks = {
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    specialChar: false,
  };

  if (password.length >= requirements.MIN_LENGTH) {
    checks.length = true;
  } else {
    errors.push(`Password must be at least ${requirements.MIN_LENGTH} characters long`);
  }

  if (requirements.REQUIRE_UPPERCASE) {
    if (/[A-Z]/.test(password)) {
      checks.uppercase = true;
    } else {
      errors.push('Password must contain at least one uppercase letter');
    }
  }

  if (requirements.REQUIRE_LOWERCASE) {
    if (/[a-z]/.test(password)) {
      checks.lowercase = true;
    } else {
      errors.push('Password must contain at least one lowercase letter');
    }
  }

  if (requirements.REQUIRE_NUMBER) {
    if (/\d/.test(password)) {
      checks.numbers = true;
    } else {
      errors.push('Password must contain at least one number');
    }
  }

  if (requirements.REQUIRE_SPECIAL) {
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      checks.specialChar = true;
    } else {
      errors.push('Password must contain at least one special character');
    }
  }

  const strength = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;

  return {
    isValid: errors.length === 0,
    errors,
    checks,
    strength: Math.round(strength),
  };
};

// =============================================================================
// COMPONENT SECTIONS
// =============================================================================

const PasswordStrengthIndicator = ({ password }) => {
  const validation = validatePassword(password);
  
  const getStrengthColor = (strength) => {
    if (strength < 40) return 'error';
    if (strength < 70) return 'warning';
    return 'success';
  };

  const getStrengthLabel = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography variant="caption" color={`${getStrengthColor(validation.strength)}.main`}>
          {getStrengthLabel(validation.strength)} ({validation.strength}%)
        </Typography>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={validation.strength}
        color={getStrengthColor(validation.strength)}
        sx={{ height: 6, borderRadius: 3 }}
      />
      
      <Box sx={{ mt: 1 }}>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.25, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              {validation.checks.length ? (
                <Check color="success" sx={{ fontSize: 16 }} />
              ) : (
                <Close color="error" sx={{ fontSize: 16 }} />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={`At least ${INVITE_CONFIG.PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`}
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.25, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              {validation.checks.uppercase ? (
                <Check color="success" sx={{ fontSize: 16 }} />
              ) : (
                <Close color="error" sx={{ fontSize: 16 }} />
              )}
            </ListItemIcon>
            <ListItemText 
              primary="One uppercase letter"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.25, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              {validation.checks.lowercase ? (
                <Check color="success" sx={{ fontSize: 16 }} />
              ) : (
                <Close color="error" sx={{ fontSize: 16 }} />
              )}
            </ListItemIcon>
            <ListItemText 
              primary="One lowercase letter"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.25, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              {validation.checks.numbers ? (
                <Check color="success" sx={{ fontSize: 16 }} />
              ) : (
                <Close color="error" sx={{ fontSize: 16 }} />
              )}
            </ListItemIcon>
            <ListItemText 
              primary="One number"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          
          <ListItem sx={{ py: 0.25, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 24 }}>
              {validation.checks.specialChar ? (
                <Check color="success" sx={{ fontSize: 16 }} />
              ) : (
                <Close color="error" sx={{ fontSize: 16 }} />
              )}
            </ListItemIcon>
            <ListItemText 
              primary="One special character (!@#$%^&*)"
              primaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

const InvitationStatus = ({ status, invitationData, error }) => {
  const getStatusConfig = () => {
    switch (status) {
      case INVITE_CONFIG.STATUS.LOADING:
        return {
          icon: <CircularProgress size={48} />,
          title: 'Verifying Invitation',
          message: 'Please wait while we verify your invitation...',
          color: 'info',
        };
      case INVITE_CONFIG.STATUS.VALID:
        return {
          icon: <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />,
          title: 'Invitation Verified',
          message: `Welcome to ${invitationData?.organization?.name || 'PropVantage AI'}!`,
          color: 'success',
        };
      case INVITE_CONFIG.STATUS.INVALID:
        return {
          icon: <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />,
          title: 'Invalid Invitation',
          message: 'This invitation link is not valid. Please check the link or contact your administrator.',
          color: 'error',
        };
      case INVITE_CONFIG.STATUS.EXPIRED:
        return {
          icon: <Timer sx={{ fontSize: 48, color: 'warning.main' }} />,
          title: 'Invitation Expired',
          message: 'This invitation has expired. Please request a new invitation from your administrator.',
          color: 'warning',
        };
      case INVITE_CONFIG.STATUS.USED:
        return {
          icon: <CheckCircle sx={{ fontSize: 48, color: 'info.main' }} />,
          title: 'Already Activated',
          message: 'This invitation has already been used. You can sign in with your existing credentials.',
          color: 'info',
        };
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />,
          title: 'Error',
          message: error || 'An unexpected error occurred. Please try again.',
          color: 'error',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Zoom in timeout={500}>
        <Box sx={{ mb: 2 }}>
          {config.icon}
        </Box>
      </Zoom>
      
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        {config.title}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {config.message}
      </Typography>

      {invitationData && status === INVITE_CONFIG.STATUS.VALID && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>User:</strong> {invitationData.user.firstName} {invitationData.user.lastName}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Email:</strong> {invitationData.user.email}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Role:</strong> {invitationData.user.role}
            </Typography>
            <Typography variant="body2">
              <strong>Organization:</strong> {invitationData.organization.name}
            </Typography>
            {invitationData.invitation?.daysRemaining && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Days remaining:</strong> {invitationData.invitation.daysRemaining}
              </Typography>
            )}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

// =============================================================================
// MAIN INVITE ACCEPTANCE PAGE COMPONENT
// =============================================================================

const InviteAcceptancePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const { login } = useAuth(); // Use login function from auth context
  const { enqueueSnackbar } = useSnackbar();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  const [currentStep, setCurrentStep] = useState(0);
  const [invitationStatus, setInvitationStatus] = useState(INVITE_CONFIG.STATUS.LOADING);
  const [invitationData, setInvitationData] = useState(null);
  const [error, setError] = useState(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false); // NEW: Track verification completion
  
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const invitationToken = searchParams.get('token');
  const invitationEmail = searchParams.get('email');
  
  const passwordValidation = validatePassword(formData.password);
  const isFormValid = passwordValidation.isValid && 
                     formData.password === formData.confirmPassword &&
                     formData.password.length > 0;

  // =============================================================================
  // API FUNCTIONS
  // =============================================================================
  
  /**
   * FIXED: Verify invitation token with proper response structure handling and prevent re-verification
   */
  const verifyInvitation = useCallback(async () => {
    // Prevent re-verification after successful completion
    if (isVerificationComplete) {
      console.log('🔄 Verification already completed, skipping...');
      return;
    }

    if (!userId || !invitationToken || !invitationEmail) {
      setInvitationStatus(INVITE_CONFIG.STATUS.INVALID);
      setError('Missing invitation parameters. Please check your invitation link.');
      return;
    }

    try {
      setInvitationStatus(INVITE_CONFIG.STATUS.LOADING);
      setError(null);
      
      console.log('🔍 Verifying invitation with:', {
        userId,
        token: invitationToken.substring(0, 20) + '...',
        email: invitationEmail
      });
      
      // Call invitation API to verify
      const response = await invitationAPI.verifyInvitation(userId, {
        token: invitationToken,
        email: invitationEmail,
      });
      
      console.log('📥 Verification response:', response);
      
      // FIXED: Handle the correct response structure
      // Backend returns: { success: true, data: { isValid: true, user: {...}, organization: {...} } }
      if (response.data && response.data.success && response.data.data && response.data.data.isValid) {
        console.log('✅ Invitation is valid');
        setInvitationData(response.data.data);
        setInvitationStatus(INVITE_CONFIG.STATUS.VALID);
        setCurrentStep(1); // Move to password setup step
        setIsVerificationComplete(true); // Mark verification as complete
      } else {
        console.error('❌ Invalid invitation response structure:', response.data);
        throw new Error('Invalid invitation response structure');
      }
    } catch (error) {
      console.error('❌ Error verifying invitation:', error);
      const apiError = handleAPIError(error);
      
      console.log('🔍 API Error details:', {
        status: apiError.status,
        message: apiError.message,
        data: apiError.data
      });
      
      // Determine status based on error response
      if (apiError.status === 404) {
        setInvitationStatus(INVITE_CONFIG.STATUS.INVALID);
        setError('Invitation not found. Please check your invitation link.');
      } else if (apiError.status === 410) {
        setInvitationStatus(INVITE_CONFIG.STATUS.EXPIRED);
        setError('This invitation has expired. Please request a new invitation.');
      } else if (apiError.status === 409) {
        setInvitationStatus(INVITE_CONFIG.STATUS.USED);
        setError('This invitation has already been used. You can sign in with your existing credentials.');
      } else {
        setInvitationStatus(INVITE_CONFIG.STATUS.ERROR);
        setError(apiError.message || 'Failed to verify invitation. Please try again.');
      }
    }
  }, [userId, invitationToken, invitationEmail, isVerificationComplete]); // Added isVerificationComplete to dependencies

  /**
   * FIXED: Accept invitation with proper response structure handling
   */
  const acceptInvitation = useCallback(async () => {
    if (!isFormValid) {
      return;
    }

    try {
      setIsSettingPassword(true);
      setFormErrors({});
      
      console.log('🔄 Accepting invitation...');
      
      // Call invitation API to accept and set password
      const response = await invitationAPI.acceptInvitation(userId, {
        token: invitationToken,
        email: invitationEmail,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      
      console.log('📥 Acceptance response:', response);
      
      // FIXED: Handle the correct response structure
      // Backend returns: { success: true, data: { user: {...}, token: "...", redirectTo: "/dashboard" } }
      if (response.data && response.data.success && response.data.data && response.data.data.user && response.data.data.token) {
        console.log('✅ Invitation accepted successfully');
        setCurrentStep(2); // Move to completion step
        
        const userData = response.data.data.user;
        const authToken = response.data.data.token;
        
        enqueueSnackbar(`Welcome to ${userData.organization?.name || 'PropVantage AI'}!`, {
          variant: 'success',
        });
        
        // FIXED: Use the login function from AuthContext to properly set authentication state
        // This will handle storing the token and user data correctly
        const loginResult = await login({
          email: invitationEmail,
          password: formData.password,
        });
        
        if (loginResult.success) {
          // Auto-redirect after a short delay
          setTimeout(() => {
            const redirectTo = response.data.data.redirectTo || '/dashboard';
            navigate(redirectTo);
          }, 2000);
        } else {
          // If login fails, manually set the data and redirect
          console.warn('⚠️ Login after acceptance failed, manually setting auth data');
          localStorage.setItem('token', authToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setTimeout(() => {
            const redirectTo = response.data.data.redirectTo || '/dashboard';
            navigate(redirectTo);
          }, 2000);
        }
        
      } else {
        console.error('❌ Invalid acceptance response structure:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      const apiError = handleAPIError(error);
      
      // Handle specific errors
      if (apiError.status === 410) {
        setInvitationStatus(INVITE_CONFIG.STATUS.EXPIRED);
        setError('This invitation has expired. Please request a new invitation.');
      } else if (apiError.status === 409) {
        setInvitationStatus(INVITE_CONFIG.STATUS.USED);
        setError('This invitation has already been used.');
      } else {
        setFormErrors({ submit: apiError.message });
        enqueueSnackbar(apiError.message || 'Failed to set up account', {
          variant: 'error',
        });
      }
    } finally {
      setIsSettingPassword(false);
    }
  }, [userId, invitationToken, invitationEmail, formData, isFormValid, login, navigate, enqueueSnackbar]);

  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  useEffect(() => {
    // Only run verification if not completed yet
    if (!isVerificationComplete) {
      verifyInvitation();
    }
  }, [verifyInvitation, isVerificationComplete]); // Added isVerificationComplete dependency

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // Clear field error
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const errors = {};
    
    if (!passwordValidation.isValid) {
      errors.password = 'Password does not meet requirements';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    acceptInvitation();
  };

  // =============================================================================
  // RENDER FUNCTIONS
  // =============================================================================
  
  const renderPasswordSetup = () => (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
        Set Your Password
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Create a secure password to complete your account setup
      </Typography>
      
      {invitationData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Account Details</AlertTitle>
          <Typography variant="body2">
            <strong>Name:</strong> {invitationData.user.firstName} {invitationData.user.lastName}
            <br />
            <strong>Email:</strong> {invitationData.user.email}
            <br />
            <strong>Role:</strong> {invitationData.user.role}
            <br />
            <strong>Organization:</strong> {invitationData.organization.name}
          </Typography>
        </Alert>
      )}
      
      {formErrors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {formErrors.submit}
        </Alert>
      )}
      
      {/* Password Field */}
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleInputChange('password')}
        error={!!formErrors.password}
        helperText={formErrors.password}
        disabled={isSettingPassword}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color={formErrors.password ? 'error' : 'action'} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                disabled={isSettingPassword}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />
      
      {/* Password Strength Indicator */}
      <PasswordStrengthIndicator password={formData.password} />
      
      {/* Confirm Password Field */}
      <TextField
        fullWidth
        label="Confirm Password"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        error={!!formErrors.confirmPassword}
        helperText={formErrors.confirmPassword}
        disabled={isSettingPassword}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Security color={formErrors.confirmPassword ? 'error' : 'action'} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                edge="end"
                disabled={isSettingPassword}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, mt: 2 }}
      />
      
      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!isFormValid || isSettingPassword}
        startIcon={
          isSettingPassword ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <VpnKey />
          )
        }
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          '&:hover': {
            background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
          },
        }}
      >
        {isSettingPassword ? 'Setting Up Account...' : 'Activate Account'}
      </Button>
    </Box>
  );
  
  const renderCompletion = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Zoom in timeout={500}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      </Zoom>
      
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Welcome to PropVantage AI!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your account has been successfully activated. You are now signed in and will be redirected to your dashboard.
      </Typography>
      
      <CircularProgress sx={{ mb: 2 }} />
      
      <Typography variant="body2" color="text.secondary">
        Redirecting you to the dashboard...
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
      <Container maxWidth="sm">
        {/* Logo */}
        <PropVantageLogo size={isMobile ? 'medium' : 'large'} />

        {/* Main Card */}
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
            {/* Stepper */}
            <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
              {INVITE_CONFIG.STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{!isMobile && label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Content */}
            <Fade in timeout={500}>
              <Box>
                {currentStep === 0 && (
                  <InvitationStatus
                    status={invitationStatus}
                    invitationData={invitationData}
                    error={error}
                  />
                )}
                
                {currentStep === 1 && invitationStatus === INVITE_CONFIG.STATUS.VALID && (
                  renderPasswordSetup()
                )}
                
                {currentStep === 2 && renderCompletion()}
              </Box>
            </Fade>

            {/* Action Buttons for Error States */}
            {(invitationStatus === INVITE_CONFIG.STATUS.INVALID || 
              invitationStatus === INVITE_CONFIG.STATUS.ERROR) && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  startIcon={<Login />}
                  sx={{ mr: 2 }}
                >
                  Go to Login
                </Button>
                <Button
                  variant="text"
                  onClick={() => window.location.reload()}
                  startIcon={<Refresh />}
                >
                  Retry
                </Button>
              </Box>
            )}

            {invitationStatus === INVITE_CONFIG.STATUS.EXPIRED && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Invitation Expired</AlertTitle>
                  Please contact your administrator to request a new invitation.
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  startIcon={<Login />}
                >
                  Go to Login
                </Button>
              </Box>
            )}
            
            {invitationStatus === INVITE_CONFIG.STATUS.USED && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  startIcon={<Login />}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            © 2025 PropVantage AI. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default InviteAcceptancePage;
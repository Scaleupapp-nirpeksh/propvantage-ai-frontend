// File: src/pages/auth/LoginPage.js
// Description: Login form content rendered inside AuthLayout's form column.
// Version: 3.0 - Redesigned presentation (architectural-luxury). Auth logic unchanged.

import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockOutlined,
  ArrowForward,
  PersonAddAlt,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';

const DISPLAY = '"Playfair Display", Georgia, serif';

// Refined field styling shared by both inputs.
const fieldSx = {
  mb: 2,
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    backgroundColor: '#fff',
    fontSize: '0.95rem',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '& fieldset': { borderColor: '#E6DFD0' },
    '&:hover fieldset': { borderColor: '#CBBE99' },
    '&.Mui-focused fieldset': { borderColor: '#C9A33B', borderWidth: '1.5px' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(212,175,55,0.10)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(26,20,10,0.55)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#9A7B1F' },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isChannelPartnerOrg, error: authError, clearError } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Clear auth errors on component mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const defaultDest = isChannelPartnerOrg ? '/partner/dashboard' : '/dashboard';
      const candidate = location.state?.from?.pathname;
      const goodCandidate =
        candidate &&
        (isChannelPartnerOrg
          ? candidate.startsWith('/partner')
          : !candidate.startsWith('/partner'));
      navigate(goodCandidate ? candidate : defaultDest, { replace: true });
    }
  }, [isAuthenticated, isChannelPartnerOrg, navigate, location]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.success) {
        enqueueSnackbar(`Welcome back, ${result.user.firstName}!`, { variant: 'success' });
        const isCp = result.organization?.type === 'channel_partner';
        const defaultDest = isCp ? '/partner/dashboard' : '/dashboard';
        const candidate = location.state?.from?.pathname || result.redirectTo;
        const goodCandidate =
          candidate &&
          (isCp ? candidate.startsWith('/partner') : !candidate.startsWith('/partner'));
        const dest = goodCandidate ? candidate : defaultDest;
        setTimeout(() => navigate(dest, { replace: true }), 100);
      } else if (result.status === 429) {
        // Rate limited
        setRateLimitSeconds(60);
        const msg = result.error || 'Too many login attempts. Please try again later.';
        enqueueSnackbar(msg, { variant: 'warning' });
        setErrors({ submit: msg });
      } else if (result.status === 423) {
        // Account locked
        setIsLocked(true);
        const msg = result.error || 'Account locked due to too many failed attempts.';
        enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 10000 });
        setErrors({ submit: msg });
      } else {
        const errorMessage = result.error || 'Login failed. Please check your credentials.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error('Login error:', error);
      enqueueSnackbar('An unexpected error occurred. Please try again.', { variant: 'error' });
      setErrors({ submit: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading || rateLimitSeconds > 0 || isLocked;

  return (
    <Box>
      {/* Header */}
      <Typography
        sx={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: '2rem',
          lineHeight: 1.1,
          color: '#1A140A',
          mb: 0.75,
        }}
      >
        Welcome back
      </Typography>
      <Typography sx={{ color: 'rgba(26,20,10,0.6)', fontSize: '0.95rem', mb: 3.5 }}>
        Sign in to your PropVantage workspace.
      </Typography>

      {/* Error / Rate Limit / Lockout Display */}
      {isLocked && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
          Your account has been locked after multiple failed login attempts. Please try again later or contact your administrator.
        </Alert>
      )}
      {rateLimitSeconds > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
          Too many attempts. Please wait {rateLimitSeconds} seconds before trying again.
        </Alert>
      )}
      {!isLocked && rateLimitSeconds <= 0 && (errors.submit || authError) && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
          {errors.submit || authError}
        </Alert>
      )}

      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Email address"
          type="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          disabled={isLoading}
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlined sx={{ fontSize: 20, color: errors.email ? 'error.main' : 'rgba(26,20,10,0.4)' }} />
              </InputAdornment>
            ),
          }}
          sx={fieldSx}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={!!errors.password}
          helperText={errors.password}
          disabled={isLoading}
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined sx={{ fontSize: 20, color: errors.password ? 'error.main' : 'rgba(26,20,10,0.4)' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isLoading}
                  size="small"
                  sx={{ color: 'rgba(26,20,10,0.45)' }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ ...fieldSx, mb: 1 }}
        />

        {/* Remember Me & Forgot Password */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.rememberMe}
                onChange={handleInputChange('rememberMe')}
                disabled={isLoading}
                size="small"
                sx={{ color: 'rgba(26,20,10,0.3)', '&.Mui-checked': { color: '#C9A33B' } }}
              />
            }
            label={<Typography variant="body2" sx={{ color: 'rgba(26,20,10,0.65)' }}>Remember me</Typography>}
          />
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            sx={{ textDecoration: 'none', color: '#9A7B1F', fontWeight: 600, '&:hover': { color: '#7A6018' } }}
          >
            Forgot password?
          </Link>
        </Box>

        {/* Sign In */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={disabled}
          endIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
          sx={{
            py: 1.35,
            mb: 3,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '0.98rem',
            fontWeight: 600,
            bgcolor: '#1A140A',
            color: '#FCFAF4',
            boxShadow: '0 10px 26px rgba(26,20,10,0.20)',
            '&:hover': { bgcolor: '#2A2014', boxShadow: '0 12px 30px rgba(212,175,55,0.30)' },
            '&.Mui-disabled': { bgcolor: '#DED7C8', color: '#fff' },
          }}
        >
          {isLoading
            ? 'Signing in…'
            : rateLimitSeconds > 0
              ? `Try again in ${rateLimitSeconds}s`
              : isLocked
                ? 'Account locked'
                : 'Sign in'}
        </Button>

        {/* Register */}
        <Divider sx={{ mb: 2.5, '&::before, &::after': { borderColor: '#EAE3D4' } }}>
          <Typography variant="caption" sx={{ color: 'rgba(26,20,10,0.45)', px: 1, letterSpacing: '0.04em' }}>
            New to PropVantage?
          </Typography>
        </Divider>

        <Button
          component={RouterLink}
          to="/register"
          variant="outlined"
          fullWidth
          startIcon={<PersonAddAlt />}
          sx={{
            py: 1.25,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: '#1A140A',
            borderColor: '#D9CFB8',
            '&:hover': { borderColor: '#C9A33B', backgroundColor: 'rgba(212,175,55,0.06)' },
          }}
        >
          Create a new account
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;

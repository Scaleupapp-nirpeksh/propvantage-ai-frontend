// File: src/pages/auth/LoginPage.js
// Description: Login form rendered inside AuthLayout's immersive glass card.
//   Label-above, solid-white high-contrast input fields on the navy glass.
// Version: 5.0 — Immersive ("Option 3") presentation. Auth logic unchanged from v4.0.

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
  LoginOutlined,
  PersonAddAlt,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAuth } from '../../context/AuthContext';

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

  // ── presentation helpers (on-glass) ───────────────────────────────────────
  const labelSx = { display: 'block', fontSize: '0.79rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', mb: 0.9 };
  const fieldSx = {
    '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '11px', boxShadow: '0 3px 10px rgba(0,0,0,0.18)' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: 2 },
    '& .MuiOutlinedInput-input': { color: '#16202b' },
    '& .MuiOutlinedInput-input::placeholder': { color: '#8a94a2', opacity: 1 },
    '& .MuiFormHelperText-root': { color: '#ffb4ab', ml: 0.25, mt: 0.75 },
  };

  return (
    <Box>
      {/* Header */}
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', mb: 0.5 }}>
        Welcome back
      </Typography>
      <Typography sx={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.74)', mb: 3 }}>
        Sign in to your workspace.
      </Typography>

      {/* Error / Rate Limit / Lockout Display */}
      {isLocked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your account has been locked after multiple failed login attempts. Please try again later or contact your administrator.
        </Alert>
      )}
      {rateLimitSeconds > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Too many attempts. Please wait {rateLimitSeconds} seconds before trying again.
        </Alert>
      )}
      {!isLocked && rateLimitSeconds <= 0 && (errors.submit || authError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.submit || authError}
        </Alert>
      )}

      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <Box sx={{ mb: 2 }}>
          <Typography component="label" htmlFor="login-email" sx={labelSx}>Email address</Typography>
          <TextField
            id="login-email"
            fullWidth
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
                  <EmailOutlined color={errors.email ? 'error' : 'action'} fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Box>

        {/* Password */}
        <Box sx={{ mb: 1.5 }}>
          <Typography component="label" htmlFor="login-password" sx={labelSx}>Password</Typography>
          <TextField
            id="login-password"
            fullWidth
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
                  <LockOutlined color={errors.password ? 'error' : 'action'} fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading} size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Box>

        {/* Remember Me & Forgot Password */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.75 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.rememberMe}
                onChange={handleInputChange('rememberMe')}
                disabled={isLoading}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.82)' }}>Remember me</Typography>}
          />
          <Link
            component={RouterLink}
            to="/forgot-password"
            sx={{ fontSize: '0.86rem', fontWeight: 600, textDecoration: 'none' }}
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
          disableElevation
          disabled={disabled}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <LoginOutlined />}
          sx={{ py: 1.3, fontSize: '1rem', fontWeight: 700, borderRadius: '11px', boxShadow: '0 14px 28px rgba(30,136,229,0.4)' }}
        >
          {isLoading
            ? 'Signing In...'
            : rateLimitSeconds > 0
              ? `Try again in ${rateLimitSeconds}s`
              : isLocked
                ? 'Account Locked'
                : 'Sign In'}
        </Button>

        {/* Register */}
        <Divider sx={{ my: 2.75, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.18)' } }}>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>New to PropVantage AI?</Typography>
        </Divider>

        <Button
          component={RouterLink}
          to="/register"
          variant="outlined"
          fullWidth
          startIcon={<PersonAddAlt />}
          sx={{ py: 1.1, fontWeight: 700, borderRadius: '11px' }}
        >
          Create a New Account
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;

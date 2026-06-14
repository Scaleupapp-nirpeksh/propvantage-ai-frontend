import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const ForgotPasswordPage = () => (
  <Box>
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', mb: 0.5 }}>
      Forgot password
    </Typography>
    <Typography sx={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.74)', mb: 3, lineHeight: 1.6 }}>
      Self-service password reset is coming soon. In the meantime, please contact your
      organization administrator to have your password reset.
    </Typography>
    <Link
      component={RouterLink}
      to="/login"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600, textDecoration: 'none' }}
    >
      <ArrowBack fontSize="small" /> Back to sign in
    </Link>
  </Box>
);

export default ForgotPasswordPage;

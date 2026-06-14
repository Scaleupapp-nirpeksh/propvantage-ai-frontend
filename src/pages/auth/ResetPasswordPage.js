import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const ResetPasswordPage = () => (
  <Box>
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', mb: 0.5 }}>
      Reset password
    </Typography>
    <Typography sx={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.74)', mb: 3, lineHeight: 1.6 }}>
      This page is coming soon. If you were sent a reset link, please contact your
      organization administrator if you have trouble completing the reset.
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

export default ResetPasswordPage;

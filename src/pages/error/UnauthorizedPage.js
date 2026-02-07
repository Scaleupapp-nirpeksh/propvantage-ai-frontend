import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { Home, ArrowBack, Lock } from '@mui/icons-material';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        px: 3,
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          bgcolor: alpha(theme.palette.error.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Lock sx={{ fontSize: 40, color: 'error.main' }} />
      </Box>

      {/* Error code */}
      <Typography
        variant="h1"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '4rem', sm: '6rem' },
          lineHeight: 1,
          background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
        }}
      >
        403
      </Typography>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Access Denied
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4 }}>
        You don't have permission to view this page. Contact your administrator if you believe this is an error.
      </Typography>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ borderRadius: 2 }}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: 2 }}
        >
          Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default UnauthorizedPage;

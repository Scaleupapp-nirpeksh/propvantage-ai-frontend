// File: src/components/layout/AuthLayout.js
// Description: Authentication layout component for PropVantage AI - Professional auth page layout
// Version: 1.0 - Complete auth layout with branding and responsive design
// Location: src/components/layout/AuthLayout.js

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
} from '@mui/material';
import {
  BusinessCenter,
  TrendingUp,
  Psychology,
  Analytics,
  Security,
  CloudDone,
} from '@mui/icons-material';

// PropVantage AI Logo Component (text-based since no logo provided)
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
        gap: 2,
        mb: 1,
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
      <Box>
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

// Feature Highlight Component
const FeatureHighlight = ({ icon: Icon, title, description, color }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: `${color}.50`,
        border: `1px solid ${theme.palette[color]?.[200] || theme.palette.grey[200]}`,
      }}
    >
      <Avatar
        sx={{
          bgcolor: `${color}.100`,
          color: `${color}.700`,
          width: 40,
          height: 40,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

// Key Features List
const keyFeatures = [
  {
    icon: TrendingUp,
    title: 'Sales Pipeline',
    description: 'Track leads from inquiry to closure with AI-powered insights',
    color: 'success',
  },
  {
    icon: Psychology,
    title: 'AI Insights',
    description: 'Get intelligent recommendations for lead conversion',
    color: 'primary',
  },
  {
    icon: Analytics,
    title: 'Advanced Analytics',
    description: 'Real-time dashboards and predictive sales forecasting',
    color: 'info',
  },
  {
    icon: Security,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access control',
    color: 'warning',
  },
];

// Stats Component
const PlatformStats = () => {
  const theme = useTheme();
  
  const stats = [
    { label: 'Projects Managed', value: '500+', color: 'primary' },
    { label: 'Units Sold', value: '10K+', color: 'success' },
    { label: 'Revenue Tracked', value: '₹1000Cr+', color: 'warning' },
  ];
  
  return (
    <Box sx={{ mt: 4, mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          mb: 2,
          color: theme.palette.text.secondary,
          fontWeight: 500,
        }}
      >
        Trusted by Leading Builders
      </Typography>
  
    </Box>
  );
};

// Main Auth Layout Component
const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Left Side - Branding & Features (Hidden on mobile) */}
          {!isMobile && (
            <Grid item xs={12} md={6} lg={7}>
              <Box sx={{ pr: isTablet ? 2 : 4 }}>
                {/* Logo and Main Heading */}
                <PropVantageLogo size="large" />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                    mt: 2,
                  }}
                >
                  AI-Powered Real Estate CRM
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Streamline your real estate business with intelligent project management, 
                  lead tracking, and predictive analytics.
                </Typography>

                {/* Feature Highlights */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 3,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Why Choose PropVantage AI?
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {keyFeatures.slice(0, 3).map((feature, index) => (
                      <FeatureHighlight key={index} {...feature} />
                    ))}
                  </Box>
                </Box>

                {/* Platform Stats */}
                <PlatformStats />

                {/* Technology Stack */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 2,
                      textAlign: 'center',
                    }}
                  >
                    Powered by Advanced Technology
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Right Side - Auth Form */}
          <Grid item xs={12} md={6} lg={5}>
            <Paper
              elevation={8}
              sx={{
                p: isMobile ? 3 : 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.grey[200]}`,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Mobile Logo */}
              {isMobile && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <PropVantageLogo size="medium" />
                </Box>
              )}

              {/* Page Title */}
              {title && (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 1,
                    textAlign: isMobile ? 'center' : 'left',
                  }}
                >
                  {title}
                </Typography>
              )}

              {/* Page Subtitle */}
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3,
                    textAlign: isMobile ? 'center' : 'left',
                  }}
                >
                  {subtitle}
                </Typography>
              )}

              {/* Auth Form Content */}
              {children}

              {/* Mobile Features (shown only on mobile) */}
              {isMobile && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      color: theme.palette.text.secondary,
                      mb: 2,
                    }}
                  >
                    Key Features
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                    {['Lead Management', 'AI Insights', 'Real-time Analytics', 'Project Tracking'].map((feature) => (
                      <Chip
                        key={feature}
                        label={feature}
                        size="small"
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          fontSize: '0.7rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          © 2025 PropVantage AI.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
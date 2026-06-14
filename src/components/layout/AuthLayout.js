// File: src/components/layout/AuthLayout.js
// Description: Immersive authentication shell for PropVantage AI ("Option 3").
//   A full-bleed property photograph with a deep brand-blue overlay, editorial copy,
//   and a frosted navy glass card that hosts the auth form. On mobile the photo becomes
//   a vibrant hero and the form rises as a rounded bottom sheet. A scoped on-glass theme
//   keeps MUI form controls legible (white text, high-contrast white inputs, themed stepper).
//
//   Variants:
//     • default ("focused") — copy + compact card (login / forgot / reset / register choice)
//     • wide                — a single centered wide glass card for longer, multi-field flows
//                             (developer / channel-partner registration)
//     • bare                — passthrough (escape hatch; renders children on the app background)
// Version: 5.1 — adds the `wide` variant so registration shares the immersive experience.

import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, ThemeProvider, createTheme } from '@mui/material';
import { Apartment } from '@mui/icons-material';

const SKYLINE = `${process.env.PUBLIC_URL || ''}/images/auth-skyline.jpg`;

// Brand lockup — Apartment mark + "PropVantage" wordmark (gold "Vantage").
const Logo = ({ compact = false, center = false }) => {
  const theme = useTheme();
  const gold = theme.palette.secondary.light;
  const mark = compact ? 34 : 44;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start', gap: compact ? 1.1 : 1.4 }}>
      <Box
        sx={{
          width: mark,
          height: mark,
          flexShrink: 0,
          borderRadius: compact ? 2.25 : 2.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.20)',
        }}
      >
        <Apartment sx={{ fontSize: compact ? 19 : 23, color: '#fff' }} />
      </Box>
      <Box sx={{ lineHeight: 1 }}>
        <Typography
          component="div"
          sx={{ fontWeight: 800, fontSize: compact ? '1.12rem' : '1.5rem', letterSpacing: '-0.01em', lineHeight: 1.05, color: '#fff' }}
        >
          Prop<Box component="span" sx={{ color: gold }}>Vantage</Box>
        </Typography>
        {!compact && (
          <Typography
            component="div"
            sx={{ mt: 0.45, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}
          >
            AI-Powered Real Estate CRM
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Editorial copy shown over the photo (left column on desktop, hero on mobile).
const BrandCopy = ({ theme, mobile = false }) => (
  <Box sx={{ maxWidth: mobile ? 'none' : 440 }}>
    <Box sx={{ mb: mobile ? 3 : 6, animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both' }}>
      <Logo />
    </Box>
    <Typography
      sx={{
        fontSize: mobile ? '0.66rem' : '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: theme.palette.secondary.light,
        mb: mobile ? 1.25 : 2,
        animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
        animationDelay: '0.05s',
      }}
    >
      For developers of distinction
    </Typography>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: mobile ? '1.9rem' : { md: '2.4rem', lg: '3rem' },
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        color: '#fff',
        m: 0,
        textShadow: mobile ? '0 2px 18px rgba(7,18,33,0.55)' : 'none',
        animation: 'pvFadeUp 0.75s cubic-bezier(0.2,0.7,0.2,1) both',
        animationDelay: '0.12s',
      }}
    >
      Where landmark developments are sold.
    </Typography>
    {!mobile && (
      <Typography
        sx={{
          mt: 2.25,
          fontSize: '1.02rem',
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.82)',
          maxWidth: 430,
          animation: 'pvFadeUp 0.8s cubic-bezier(0.2,0.7,0.2,1) both',
          animationDelay: '0.2s',
        }}
      >
        The intelligence layer behind premium real estate — projects, leads, payments
        and revenue, in one refined workspace.
      </Typography>
    )}
  </Box>
);

const AuthLayout = ({ children, wide = false, bare = false }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Escape hatch — render children on the plain app background.
  if (bare) {
    return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;
  }

  // Scoped theme so MUI controls rendered by the auth pages stay legible on the navy glass.
  const components = {
    MuiLink: {
      styleOverrides: { root: { color: theme.palette.secondary.light, fontWeight: 600, textDecorationColor: 'rgba(255,202,40,0.45)' } },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255,255,255,0.42)',
          color: '#fff',
          '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' },
        },
      },
    },
    // Outlined inputs (login uses these, styled solid white)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 11,
          boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main, borderWidth: 2 },
        },
        input: { color: '#16202b' },
      },
    },
    // Filled inputs (the register flows use these — solid white, label sits inside)
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 11,
          overflow: 'hidden',
          boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
          '&:hover': { backgroundColor: '#fff' },
          '&.Mui-focused': { backgroundColor: '#fff' },
          '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.85)' },
          '&::before': { borderBottom: 'none !important' },
          '&::after': { borderBottom: `2px solid ${theme.palette.primary.main}` },
        },
        input: { color: '#16202b' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#5f6b7a',
          '&.Mui-focused': { color: theme.palette.primary.main },
          '&.Mui-error': { color: theme.palette.error.main },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.05)' } },
    },
    MuiCheckbox: {
      styleOverrides: { root: { color: 'rgba(255,255,255,0.55)', '&.Mui-checked': { color: theme.palette.secondary.light } } },
    },
    // Stepper (developer registration) — legible on navy
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: 'rgba(255,255,255,0.55)',
          '&.Mui-active': { color: '#fff', fontWeight: 700 },
          '&.Mui-completed': { color: 'rgba(255,255,255,0.85)' },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.22)',
          '&.Mui-active': { color: theme.palette.secondary.light },
          '&.Mui-completed': { color: theme.palette.secondary.main },
        },
        text: { fill: '#0d2748', fontWeight: 700 },
      },
    },
    MuiStepConnector: {
      styleOverrides: { line: { borderColor: 'rgba(255,255,255,0.2)' } },
    },
  };
  // In the wide flows, default TextFields to the filled (label-inside) style.
  if (wide) {
    components.MuiTextField = { defaultProps: { variant: 'filled' } };
  }
  const glassOverrides = {
    palette: { text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.74)' }, divider: 'rgba(255,255,255,0.20)' },
    components,
  };

  // Shared frosted-navy glass surface.
  const glassBg = wide
    ? 'linear-gradient(165deg, rgba(16,34,62,0.88), rgba(9,20,38,0.82))'
    : 'linear-gradient(165deg, rgba(16,34,62,0.82), rgba(9,20,38,0.74))';

  // Focused card (login etc.): compact floating card on desktop, bottom sheet on mobile.
  const FocusedCard = ({ sheet = false }) => (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        color: '#fff',
        background: glassBg,
        backdropFilter: 'blur(22px) saturate(140%)',
        WebkitBackdropFilter: 'blur(22px) saturate(140%)',
        ...(sheet
          ? {
              width: '100%',
              borderRadius: '28px 28px 0 0',
              border: '1px solid rgba(255,255,255,0.18)',
              borderBottom: 'none',
              mt: 3,
              px: 3,
              pt: 3,
              pb: 4.5,
              boxShadow: '0 -16px 44px rgba(0,0,0,0.42)',
              '&::before': {
                content: '""',
                display: 'block',
                width: 42,
                height: 4,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.30)',
                margin: '0 auto 18px',
              },
            }
          : {
              width: 412,
              flex: 'none',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.20)',
              p: '36px 34px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              maxHeight: 'calc(100vh - 56px)',
              overflowY: 'auto',
              animation: 'pvFadeUp 0.75s cubic-bezier(0.2,0.7,0.2,1) both',
              animationDelay: '0.15s',
            }),
      }}
    >
      {!sheet && (
        <Box sx={{ mb: 2.5 }}>
          <Logo compact />
        </Box>
      )}
      {children}
    </Box>
  );

  const root = {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: wide ? 'flex-start' : 'center',
    background: 'linear-gradient(135deg, #0d2748, #0d47a1)', // fallback behind the photo
    '@keyframes pvFadeUp': {
      from: { opacity: 0, transform: 'translateY(14px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  };

  return (
    <ThemeProvider theme={(outer) => createTheme(outer, glassOverrides)}>
      <Box sx={root}>
        {/* Photograph */}
        <Box
          aria-hidden
          sx={{ position: 'absolute', inset: 0, backgroundImage: `url("${SKYLINE}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        {/* Overlay */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: wide
              ? 'linear-gradient(0deg, rgba(7,18,33,0.78), rgba(7,18,33,0.6))'
              : 'linear-gradient(180deg, rgba(7,18,33,0.58) 0%, rgba(7,18,33,0.2) 26%, rgba(7,18,33,0) 50%)',
            ...(wide
              ? {}
              : {
                  [theme.breakpoints.up('md')]: {
                    background:
                      'linear-gradient(90deg, rgba(7,18,33,0.92) 0%, rgba(7,18,33,0.74) 38%, rgba(7,18,33,0.32) 72%, rgba(7,18,33,0.14) 100%), linear-gradient(0deg, rgba(7,18,33,0.55), transparent 50%)',
                  },
                }),
          }}
        />

        {wide ? (
          /* ── WIDE: one centered glass card for longer, multi-field flows ── */
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              px: { xs: 2, sm: 4 },
              py: { xs: 4, md: 7 },
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 720,
                color: '#fff',
                background: glassBg,
                backdropFilter: 'blur(22px) saturate(140%)',
                WebkitBackdropFilter: 'blur(22px) saturate(140%)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '22px',
                p: { xs: 3, sm: 5 },
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Logo center />
              </Box>
              {children}
            </Box>
          </Box>
        ) : isDesktop ? (
          /* ── DESKTOP focused: copy on the left, glass card on the right ── */
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 1240,
              mx: 'auto',
              px: { md: 7, lg: 9 },
              py: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <BrandCopy theme={theme} />
            <FocusedCard />
          </Box>
        ) : (
          /* ── MOBILE focused: photo hero up top, sign-in sheet at the bottom ── */
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ px: 3, pt: '30px' }}>
              <BrandCopy theme={theme} mobile />
            </Box>
            <FocusedCard sheet />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default AuthLayout;

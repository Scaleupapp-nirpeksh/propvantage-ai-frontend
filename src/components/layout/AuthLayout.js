// File: src/components/layout/AuthLayout.js
// Description: Authentication shell for PropVantage AI. A cohesive full-height split
//   that uses the APP's own design system (blue primary + amber-gold secondary, Inter).
//   Left: a deep professional-blue brand panel with subtle gold accents. Right: a clean
//   white column that hosts the auth form (styled with theme defaults for consistency).
// Version: 4.0 — re-skinned to match the app theme (was off-brand charcoal/serif).

import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Apartment, TrendingUp, AutoAwesome, Insights } from '@mui/icons-material';

// Logo lockup — single source of truth, matches the app's blue + gold brand.
const Logo = ({ onDark = true, compact = false }) => {
  const theme = useTheme();
  const gold = theme.palette.secondary.main; // #ffb300
  const markSize = compact ? 38 : 44;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: markSize,
          height: markSize,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: onDark ? 'rgba(255,255,255,0.12)' : theme.palette.primary.main,
          border: onDark ? '1px solid rgba(255,255,255,0.18)' : 'none',
          boxShadow: onDark ? 'none' : '0 6px 16px rgba(30,136,229,0.30)',
        }}
      >
        <Apartment sx={{ fontSize: compact ? 20 : 24, color: '#fff' }} />
      </Box>
      <Box sx={{ lineHeight: 1 }}>
        <Typography
          component="div"
          sx={{
            fontWeight: 800,
            fontSize: compact ? '1.3rem' : '1.5rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            color: onDark ? '#fff' : theme.palette.text.primary,
          }}
        >
          Prop<Box component="span" sx={{ color: onDark ? theme.palette.secondary.light : theme.palette.secondary.dark }}>Vantage</Box>
        </Typography>
        <Typography
          component="div"
          sx={{
            mt: 0.35,
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: onDark ? 'rgba(255,255,255,0.62)' : theme.palette.text.secondary,
          }}
        >
          AI-Powered Real Estate CRM
        </Typography>
      </Box>
    </Box>
  );
};

const VALUE_PROPS = [
  { icon: TrendingUp, title: 'Sales pipeline', desc: 'Track every lead from first enquiry to final booking.' },
  { icon: AutoAwesome, title: 'AI insights', desc: 'Recommendations that show your team where to focus next.' },
  { icon: Insights, title: 'Revenue intelligence', desc: 'Live dashboards and predictive sales forecasting.' },
];

const ValueRow = ({ icon: Icon, title, desc, delay }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        py: 2,
        borderTop: '1px solid rgba(255,255,255,0.12)',
        animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
        animationDelay: delay,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
        }}
      >
        <Icon sx={{ fontSize: 19, color: theme.palette.secondary.light }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', mb: 0.25 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.66)', lineHeight: 1.5 }}>{desc}</Typography>
      </Box>
    </Box>
  );
};

const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const gold = theme.palette.secondary.light; // #ffca28-ish for accents on blue

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: theme.palette.background.default,
        '@keyframes pvFadeUp': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes pvFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {/* ── LEFT · blue brand panel (desktop only) ───────────────────────── */}
      {isDesktop && (
        <Box
          sx={{
            position: 'relative',
            flex: '1 1 56%',
            maxWidth: '58%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#fff',
            px: { md: 7, lg: 10 },
            py: { md: 7, lg: 8 },
            background: `linear-gradient(157deg, #0d47a1 0%, ${theme.palette.primary.dark} 52%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          {/* atmosphere */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: [
                'radial-gradient(56% 46% at 86% 4%, rgba(255,255,255,0.16), transparent 70%)',
                `radial-gradient(46% 40% at -6% 104%, ${theme.palette.secondary.main}1f, transparent 70%)`,
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 72px)',
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 72px)',
              ].join(','),
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              width: 720,
              height: 720,
              right: -260,
              bottom: -300,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.14)',
              pointerEvents: 'none',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 90,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.10)',
              },
            }}
          />

          {/* top: logo */}
          <Box sx={{ position: 'relative', zIndex: 1, animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both' }}>
            <Logo onDark />
          </Box>

          {/* middle: headline + value props */}
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 540, my: 4 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: gold,
                mb: 2,
                animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
                animationDelay: '0.05s',
              }}
            >
              AI-Powered Revenue Intelligence
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { md: '2.4rem', lg: '2.9rem' },
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                color: '#fff',
                mb: 2.5,
                animation: 'pvFadeUp 0.75s cubic-bezier(0.2,0.7,0.2,1) both',
                animationDelay: '0.12s',
              }}
            >
              Intelligence for the people who build{' '}
              <Box component="span" sx={{ color: gold }}>landmarks.</Box>
            </Typography>
            <Typography
              sx={{
                fontSize: '1.02rem',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.74)',
                maxWidth: 460,
                animation: 'pvFadeUp 0.8s cubic-bezier(0.2,0.7,0.2,1) both',
                animationDelay: '0.2s',
              }}
            >
              One command center for your projects, leads, payments and reporting —
              with the precision your developments deserve.
            </Typography>

            <Box sx={{ mt: 3 }}>
              {VALUE_PROPS.map((v, i) => (
                <ValueRow key={v.title} {...v} delay={`${0.32 + i * 0.1}s`} />
              ))}
            </Box>
          </Box>

          {/* bottom: trust line */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              animation: 'pvFadeIn 1s ease both',
              animationDelay: '0.7s',
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: gold }} />
            <Typography sx={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.66)' }}>
              Trusted by leading developers
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── RIGHT · form column (white, theme-default styling) ────────────── */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          px: { xs: 3, sm: 6 },
          py: { xs: 6, sm: 8 },
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 408,
            animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
            animationDelay: isDesktop ? '0.15s' : '0s',
          }}
        >
          {!isDesktop && (
            <Box sx={{ mb: 4 }}>
              <Logo onDark={false} compact />
            </Box>
          )}

          {title && (
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}

          {children}
        </Box>

        <Typography
          variant="caption"
          sx={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: 'text.secondary' }}
        >
          © {new Date().getFullYear()} PropVantage AI · Elite Real Estate CRM
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;

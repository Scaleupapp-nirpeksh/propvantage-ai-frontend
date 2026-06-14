// File: src/components/layout/AuthLayout.js
// Description: Authentication shell for PropVantage AI — a refined, "architectural
//   luxury" split screen. Left: a deep warm-charcoal brand panel with gold accents
//   and editorial Playfair type. Right: a clean cream column that hosts the auth form.
// Version: 3.0 — full redesign (cohesive split, single legible logo, brand-true palette)

import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Apartment, TrendingUp, AutoAwesome, Insights } from '@mui/icons-material';

// ── Brand tokens (auth-scoped) ───────────────────────────────────────────────
const C = {
  ink: '#15120B',
  ink2: '#241B10',
  ink3: '#2C2014',
  gold: '#D4AF37',
  goldHi: '#EBCB63',
  goldLine: 'rgba(212, 175, 55, 0.22)',
  cream: '#FAF7F1',
  hairline: 'rgba(255, 255, 255, 0.08)',
  bodyOnDark: 'rgba(247, 242, 232, 0.72)',
};
const DISPLAY = '"Playfair Display", Georgia, "Times New Roman", serif';

// Single source of truth for the logo lockup (used on both panels).
const Logo = ({ variant = 'light', compact = false }) => {
  const onDark = variant === 'light';
  const markSize = compact ? 38 : 46;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: markSize,
          height: markSize,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: onDark
            ? 'linear-gradient(145deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))'
            : 'linear-gradient(145deg, #1d1810, #2c2415)',
          border: `1px solid ${onDark ? C.goldLine : 'transparent'}`,
          boxShadow: onDark ? 'none' : '0 6px 18px rgba(26,22,12,0.25)',
        }}
      >
        <Apartment sx={{ fontSize: compact ? 20 : 24, color: C.gold }} />
      </Box>
      <Box sx={{ lineHeight: 1 }}>
        <Typography
          component="div"
          sx={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: compact ? '1.35rem' : '1.6rem',
            letterSpacing: '0.01em',
            color: onDark ? '#FBF8F0' : '#1A140A',
            lineHeight: 1.05,
          }}
        >
          Prop<Box component="span" sx={{ color: C.gold }}>Vantage</Box>
        </Typography>
        <Typography
          component="div"
          sx={{
            mt: 0.4,
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: onDark ? C.bodyOnDark : 'rgba(26,20,10,0.5)',
          }}
        >
          Elite Real Estate CRM
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

const ValueRow = ({ icon: Icon, title, desc, delay }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      py: 2,
      borderTop: `1px solid ${C.hairline}`,
      animation: 'pvFadeUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
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
        border: `1px solid ${C.goldLine}`,
        bgcolor: 'rgba(212,175,55,0.06)',
      }}
    >
      <Icon sx={{ fontSize: 19, color: C.gold }} />
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#FBF8F0', mb: 0.25 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: C.bodyOnDark, lineHeight: 1.5 }}>
        {desc}
      </Typography>
    </Box>
  </Box>
);

const AuthLayout = ({ children, title, subtitle }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: C.cream,
        // keyframes registered once here; referenced by name below
        '@keyframes pvFadeUp': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes pvFadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {/* ── LEFT · brand panel (desktop only) ─────────────────────────────── */}
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
            background: `linear-gradient(157deg, ${C.ink} 0%, ${C.ink2} 52%, ${C.ink3} 100%)`,
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
                'radial-gradient(58% 48% at 88% 6%, rgba(212,175,55,0.20), transparent 70%)',
                'radial-gradient(46% 38% at -5% 104%, rgba(212,175,55,0.07), transparent 70%)',
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 72px)',
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 72px)',
              ].join(','),
            }}
          />
          {/* architect's arc */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              width: 720,
              height: 720,
              right: -260,
              bottom: -300,
              borderRadius: '50%',
              border: `1px solid ${C.goldLine}`,
              pointerEvents: 'none',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 90,
                borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.10)',
              },
            }}
          />

          {/* top: logo */}
          <Box sx={{ position: 'relative', zIndex: 1, animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both' }}>
            <Logo variant="light" />
          </Box>

          {/* middle: headline + value props */}
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 540, my: 4 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: C.gold,
                mb: 2.5,
                animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
                animationDelay: '0.05s',
              }}
            >
              AI-Powered Revenue Intelligence
            </Typography>
            <Typography
              sx={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                fontSize: { md: '2.6rem', lg: '3.1rem' },
                lineHeight: 1.08,
                letterSpacing: '-0.01em',
                color: '#FCFAF4',
                mb: 2.5,
                animation: 'pvFadeUp 0.75s cubic-bezier(0.2,0.7,0.2,1) both',
                animationDelay: '0.12s',
              }}
            >
              Intelligence for the people who build{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.goldHi }}>landmarks.</Box>
            </Typography>
            <Typography
              sx={{
                fontSize: '1.02rem',
                lineHeight: 1.6,
                color: C.bodyOnDark,
                maxWidth: 460,
                mb: 1,
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
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.gold }} />
            <Typography sx={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.bodyOnDark }}>
              Trusted by leading developers
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── RIGHT · form column ───────────────────────────────────────────── */}
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
          bgcolor: C.cream,
          // subtle texture so the cream panel isn't flat
          backgroundImage:
            'radial-gradient(60% 50% at 100% 0%, rgba(212,175,55,0.06), transparent 60%)',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 416,
            animation: 'pvFadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) both',
            animationDelay: isDesktop ? '0.15s' : '0s',
          }}
        >
          {/* compact logo on mobile (left panel is hidden) */}
          {!isDesktop && (
            <Box sx={{ mb: 4 }}>
              <Logo variant="dark" compact />
            </Box>
          )}

          {title && (
            <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.9rem', color: '#1A140A', mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography sx={{ color: 'rgba(26,20,10,0.6)', mb: 3 }}>{subtitle}</Typography>
          )}

          {children}
        </Box>

        {/* footer */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'rgba(26,20,10,0.4)',
          }}
        >
          © {new Date().getFullYear()} PropVantage AI · Elite Real Estate CRM
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;

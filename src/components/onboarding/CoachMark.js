import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Paper, Fade,
  useTheme, alpha, Chip,
} from '@mui/material';
import { Close, ArrowForward, ArrowBack, Check } from '@mui/icons-material';

/**
 * CoachMark — spotlight overlay that highlights a target element
 * with an attached tooltip/popover providing guidance.
 *
 * @param {object}   props
 * @param {string}   props.target      - CSS selector for the element to highlight
 * @param {string}   props.title       - Tooltip title
 * @param {string}   props.description - Tooltip description
 * @param {'top'|'bottom'|'left'|'right'} [props.placement='bottom'] - Tooltip placement
 * @param {number}   props.step        - Current step number (1-based)
 * @param {number}   props.totalSteps  - Total number of steps
 * @param {Function} props.onNext      - Next step callback
 * @param {Function} props.onPrev      - Previous step callback
 * @param {Function} props.onSkip      - Skip all callback
 * @param {Function} props.onComplete  - Final step complete callback
 * @param {boolean}  props.open        - Whether this coach mark is visible
 */
const CoachMark = ({
  target,
  title,
  description,
  placement = 'bottom',
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  open,
}) => {
  const theme = useTheme();
  const [rect, setRect] = useState(null);
  const tooltipRef = useRef(null);
  const isLast = step === totalSteps;
  const isFirst = step === 1;

  // Measure the target element
  const measureTarget = useCallback(() => {
    if (!target || !open) return;
    const el = document.querySelector(target);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
        clientTop: r.top,
        clientLeft: r.left,
      });
      // Scroll into view if needed
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [target, open]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
    };
  }, [measureTarget]);

  if (!open || !rect) return null;

  // Calculate tooltip position
  const padding = 12;
  const tooltipStyle = {};

  switch (placement) {
    case 'bottom':
      tooltipStyle.top = rect.clientTop + rect.height + padding;
      tooltipStyle.left = rect.clientLeft + rect.width / 2;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'top':
      tooltipStyle.bottom = window.innerHeight - rect.clientTop + padding;
      tooltipStyle.left = rect.clientLeft + rect.width / 2;
      tooltipStyle.transform = 'translateX(-50%)';
      break;
    case 'right':
      tooltipStyle.top = rect.clientTop + rect.height / 2;
      tooltipStyle.left = rect.clientLeft + rect.width + padding;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
    case 'left':
      tooltipStyle.top = rect.clientTop + rect.height / 2;
      tooltipStyle.right = window.innerWidth - rect.clientLeft + padding;
      tooltipStyle.transform = 'translateY(-50%)';
      break;
    default:
      break;
  }

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: theme.zIndex.modal + 1,
          pointerEvents: 'none',
        }}
      >
        {/* Semi-transparent overlay with hole */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'all' }}>
          <defs>
            <mask id={`coach-mask-${step}`}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.clientLeft - 6}
                y={rect.clientTop - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx={8}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="rgba(0,0,0,0.5)"
            mask={`url(#coach-mask-${step})`}
            onClick={onSkip}
          />
        </svg>

        {/* Highlight ring around target */}
        <Box
          sx={{
            position: 'fixed',
            top: rect.clientTop - 6,
            left: rect.clientLeft - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`,
            pointerEvents: 'none',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}` },
              '50%': { boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.1)}` },
            },
          }}
        />
      </Box>

      {/* Tooltip */}
      <Fade in>
        <Paper
          ref={tooltipRef}
          elevation={8}
          sx={{
            position: 'fixed',
            ...tooltipStyle,
            zIndex: theme.zIndex.modal + 2,
            maxWidth: 340,
            minWidth: 280,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Chip
              label={`Step ${step} of ${totalSteps}`}
              size="small"
              color="primary"
              sx={{ height: 22, fontSize: '0.688rem', fontWeight: 600 }}
            />
            <IconButton size="small" onClick={onSkip} sx={{ mt: -0.5, mr: -0.5 }}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Content */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            {description}
          </Typography>

          {/* Progress dots */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i + 1 === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: i + 1 <= step ? 'primary.main' : alpha(theme.palette.primary.main, 0.2),
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" onClick={onSkip} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              Skip tour
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isFirst && (
                <Button size="small" startIcon={<ArrowBack sx={{ fontSize: 14 }} />} onClick={onPrev}>
                  Back
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                endIcon={isLast ? <Check sx={{ fontSize: 14 }} /> : <ArrowForward sx={{ fontSize: 14 }} />}
                onClick={isLast ? onComplete : onNext}
                sx={{ borderRadius: 2 }}
              >
                {isLast ? 'Got it!' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  );
};

export default CoachMark;

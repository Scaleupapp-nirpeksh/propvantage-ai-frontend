import React from 'react';
import {
  Card, CardContent, Box, Typography, Skeleton, useTheme, useMediaQuery,
} from '@mui/material';

/**
 * Wrapper for Recharts charts with consistent loading, title, and responsive height.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} props.children - the Recharts chart (wrapped in ResponsiveContainer)
 * @param {boolean} [props.loading]
 * @param {number|{xs?:number,sm?:number,md?:number}} [props.height] - chart height
 * @param {React.ReactNode} [props.actions] - top-right controls (period selector, etc.)
 * @param {boolean} [props.noPadding] - remove card padding around chart
 */
const ChartCard = ({
  title, subtitle, children, loading, height = 300,
  actions, noPadding = false, ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Resolve responsive height
  let chartHeight = height;
  if (typeof height === 'object') {
    if (isMobile && height.xs) chartHeight = height.xs;
    else if (!isMobile && height.md) chartHeight = height.md;
    else if (height.sm) chartHeight = height.sm;
    else chartHeight = height.md || height.sm || height.xs || 300;
  }

  return (
    <Card sx={{ height: '100%' }} {...rest}>
      <CardContent sx={noPadding ? { p: 0, '&:last-child': { pb: 0 } } : {}}>
        {/* Header */}
        {(title || actions) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
              px: noPadding ? 2.5 : 0,
              pt: noPadding ? 2.5 : 0,
            }}
          >
            <Box>
              {title && (
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
          </Box>
        )}

        {/* Chart area */}
        <Box sx={{ width: '100%', height: chartHeight }}>
          {loading ? (
            <Box sx={{ px: noPadding ? 2.5 : 0 }}>
              <Skeleton variant="rounded" width="100%" height={chartHeight - 20} />
            </Box>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartCard;

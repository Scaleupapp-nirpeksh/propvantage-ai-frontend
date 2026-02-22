import React from 'react';
import { Box, Typography, Skeleton, Chip, useTheme, useMediaQuery } from '@mui/material';

/**
 * Consistent page header used across all pages.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {import('@mui/material').SvgIconComponent} [props.icon]
 * @param {React.ReactNode} [props.actions] - right-aligned buttons / controls
 * @param {boolean} [props.loading]
 * @param {React.ReactNode} [props.children] - content rendered below the header (filters, tabs, etc.)
 */
const PageHeader = ({ title, subtitle, icon: Icon, actions, loading, badge, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={200} height={36} />
        <Skeleton variant="text" width={300} height={20} sx={{ mt: 0.5 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {Icon && (
            <Icon sx={{ fontSize: 28, color: 'primary.main', flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {title}
              </Typography>
              {badge && (
                <Chip label={badge} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'warning.main', color: '#fff' }} />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {actions && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
            {actions}
          </Box>
        )}
      </Box>

      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
};

export default PageHeader;

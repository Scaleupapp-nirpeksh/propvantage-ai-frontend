import React from 'react';
import { Box, Typography, Button, Fade, alpha, useTheme } from '@mui/material';
import { SearchOff } from '@mui/icons-material';

/**
 * Empty state placeholder shown when there's no data.
 *
 * @param {object} props
 * @param {import('@mui/material').SvgIconComponent} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{ label: string, onClick: Function, icon?: any }} [props.action]
 * @param {'small'|'medium'|'large'} [props.size]
 */
const EmptyState = ({ icon: Icon = SearchOff, title, description, action, size = 'medium' }) => {
  const theme = useTheme();
  const sizes = { small: { icon: 40, py: 3 }, medium: { icon: 56, py: 5 }, large: { icon: 72, py: 8 } };
  const s = sizes[size];

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: s.py,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: s.icon + 24,
            height: s.icon + 24,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.grey[500], 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: s.icon, color: 'text.disabled' }} />
        </Box>

        <Typography variant={size === 'large' ? 'h5' : 'h6'} sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>

        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: action ? 2.5 : 0 }}>
            {description}
          </Typography>
        )}

        {action && (
          <Button
            variant="contained"
            size={size === 'small' ? 'small' : 'medium'}
            startIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </Fade>
  );
};

export default EmptyState;

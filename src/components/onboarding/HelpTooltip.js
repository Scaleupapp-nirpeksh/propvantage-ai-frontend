import React from 'react';
import { Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

/**
 * Small contextual help icon with tooltip.
 * Place next to any complex UI element to explain what it does.
 *
 * @param {string} props.text - Help text to display on hover
 * @param {string} [props.size='small'] - Icon size
 */
const HelpTooltip = ({ text, size = 'small' }) => {
  const theme = useTheme();

  return (
    <Tooltip
      title={text}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 240,
            fontSize: '0.75rem',
            lineHeight: 1.5,
            p: 1.25,
          },
        },
      }}
    >
      <IconButton
        size={size}
        tabIndex={-1}
        sx={{
          color: 'text.disabled',
          p: 0.25,
          '&:hover': {
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        <HelpOutline sx={{ fontSize: size === 'small' ? 16 : 20 }} />
      </IconButton>
    </Tooltip>
  );
};

export default HelpTooltip;

import React from 'react';
import { Chip, alpha, useTheme } from '@mui/material';
import { getStatusConfig } from '../../constants/statusConfig';

/**
 * Auto-colored status chip. Looks up color & icon from statusConfig.
 *
 * @param {object} props
 * @param {string} props.status - raw status value
 * @param {'lead'|'unit'|'project'|'sale'|'payment'} props.type
 * @param {'small'|'medium'} [props.size]
 * @param {'soft'|'filled'|'outlined'} [props.variant]
 * @param {boolean} [props.showIcon]
 */
const StatusChip = ({ status, type, size = 'small', variant = 'soft', showIcon = false, ...rest }) => {
  const theme = useTheme();
  const config = getStatusConfig(type, status);
  const Icon = config.icon;
  const colorKey = config.color === 'default' ? 'primary' : config.color;
  const paletteColor = theme.palette[colorKey]?.main || theme.palette.grey[500];

  const sxByVariant = {
    soft: {
      bgcolor: alpha(paletteColor, 0.1),
      color: paletteColor,
      border: 'none',
      fontWeight: 600,
    },
    filled: {
      bgcolor: paletteColor,
      color: '#fff',
      border: 'none',
      fontWeight: 600,
    },
    outlined: {
      bgcolor: 'transparent',
      color: paletteColor,
      border: `1px solid ${alpha(paletteColor, 0.4)}`,
      fontWeight: 500,
    },
  };

  return (
    <Chip
      label={config.label}
      size={size}
      icon={showIcon && Icon ? <Icon sx={{ fontSize: 14 }} /> : undefined}
      sx={sxByVariant[variant] || sxByVariant.soft}
      {...rest}
    />
  );
};

export default StatusChip;

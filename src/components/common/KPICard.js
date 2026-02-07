import React from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Skeleton,
  useTheme, alpha, Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import AnimatedCounter from './AnimatedCounter';

const TrendBadge = ({ value, direction }) => {
  if (value === undefined && direction === undefined) return null;
  const dir = direction || (Number(value) > 0 ? 'up' : Number(value) < 0 ? 'down' : 'flat');
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : TrendingFlat;
  const color = dir === 'up' ? 'success' : dir === 'down' ? 'error' : 'default';
  const label = value !== undefined ? `${Number(value) > 0 ? '+' : ''}${value}%` : dir;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: 14 }} />}
      label={label}
      size="small"
      color={color}
      sx={{ height: 22, fontSize: '0.688rem', fontWeight: 600 }}
    />
  );
};

/**
 * Reusable KPI metric card.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string|number} props.value - displayed value (string for pre-formatted, number for animated)
 * @param {string} [props.subtitle]
 * @param {{ value?: number, direction?: 'up'|'down'|'flat' }} [props.trend]
 * @param {import('@mui/material').SvgIconComponent} [props.icon]
 * @param {string} [props.color] - theme palette key (primary, success, error, warning, info)
 * @param {boolean} [props.loading]
 * @param {Function} [props.onClick]
 * @param {(n:number)=>string} [props.formatter] - custom formatter for animated number
 */
const KPICard = ({
  title, value, subtitle, trend, icon: Icon, color = 'primary',
  loading = false, onClick, formatter, ...rest
}) => {
  const theme = useTheme();
  const paletteColor = theme.palette[color]?.main || theme.palette.primary.main;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }} {...rest}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="rounded" width={40} height={40} />
            <Skeleton variant="rounded" width={60} height={22} />
          </Box>
          <Skeleton variant="text" width="50%" height={32} />
          <Skeleton variant="text" width="70%" height={18} sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    );
  }

  const isNumeric = typeof value === 'number';

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          borderColor: alpha(paletteColor, 0.3),
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 16px ${alpha(paletteColor, 0.12)}`,
        } : {},
      }}
      onClick={onClick}
      {...rest}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          {Icon && (
            <Avatar
              sx={{
                width: 40, height: 40,
                bgcolor: alpha(paletteColor, 0.1),
                color: paletteColor,
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </Avatar>
          )}
          {trend && <TrendBadge value={trend.value} direction={trend.direction} />}
        </Box>

        <Typography
          variant="h4"
          sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}
        >
          {isNumeric ? <AnimatedCounter value={value} formatter={formatter} /> : value}
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', mt: 0.25 }}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;

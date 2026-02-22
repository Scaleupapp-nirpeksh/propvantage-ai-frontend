// File: src/components/projects/FloorContextBar.js
// Horizontal bar showing sibling units on the same floor with current unit highlighted
// Used in UnitDetailPage for quick navigation between floor units

import React from 'react';
import { Box, Typography, Tooltip, alpha, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Layers } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLORS = {
  available: 'success',
  sold: 'error',
  blocked: 'warning',
  booked: 'primary',
};

const FloorContextBar = ({
  units = [],
  currentUnitId,
  projectId,
  towerId,
  floorNumber,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const sorted = [...units].sort((a, b) => {
    const numA = parseInt(a.unitNumber) || 0;
    const numB = parseInt(b.unitNumber) || 0;
    return numA - numB;
  });

  if (sorted.length <= 1) return null;

  const handleClick = (unit) => {
    const unitId = unit._id || unit.id;
    if (unitId === currentUnitId) return;
    if (towerId) {
      navigate(`/projects/${projectId}/towers/${towerId}/units/${unitId}`);
    } else {
      navigate(`/projects/${projectId}/units/${unitId}`);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        mb: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <Layers sx={{ fontSize: 14, color: 'primary.main' }} />
        <Typography sx={{ fontSize: '0.688rem', fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Floor {floorNumber}
        </Typography>
      </Box>

      {/* Unit blocks */}
      <Box
        sx={{
          display: 'flex',
          gap: '5px',
          flex: 1,
          overflowX: 'auto',
          py: 0.5,
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
        }}
      >
        {sorted.map((unit) => {
          const unitId = unit._id || unit.id;
          const isCurrent = unitId === currentUnitId;
          const statusKey = STATUS_COLORS[unit.status?.toLowerCase()] || 'grey';
          const color = theme.palette[statusKey]?.main || theme.palette.grey[400];

          return (
            <Tooltip
              key={unitId}
              arrow
              title={
                isCurrent ? 'Current unit' : (
                  <Box sx={{ p: 0.25 }}>
                    <Typography sx={{ fontSize: '0.688rem', fontWeight: 600 }}>
                      Unit {unit.unitNumber}
                    </Typography>
                    <Typography sx={{ fontSize: '0.625rem' }}>
                      {unit.status} &middot; {unit.unitType || unit.type || ''}
                    </Typography>
                    {unit.currentPrice && (
                      <Typography sx={{ fontSize: '0.625rem' }}>
                        {formatCurrency(unit.currentPrice, { compact: true })}
                      </Typography>
                    )}
                  </Box>
                )
              }
            >
              <Box
                onClick={() => handleClick(unit)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: isCurrent ? 48 : 36,
                  height: isCurrent ? 36 : 28,
                  px: 0.75,
                  borderRadius: isCurrent ? '8px' : '5px',
                  bgcolor: isCurrent ? color : alpha(color, 0.7),
                  border: isCurrent ? '2px solid' : '1px solid',
                  borderColor: isCurrent ? 'text.primary' : alpha(color, 0.4),
                  cursor: isCurrent ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isCurrent ? 'scale(1.1)' : 'none',
                  boxShadow: isCurrent
                    ? `0 0 0 3px ${alpha(color, 0.2)}, 0 2px 8px rgba(0,0,0,0.12)`
                    : 'none',
                  zIndex: isCurrent ? 2 : 1,
                  flexShrink: 0,
                  '&:hover': !isCurrent
                    ? {
                        transform: 'scale(1.08)',
                        bgcolor: color,
                        boxShadow: `0 2px 6px ${alpha(color, 0.4)}`,
                      }
                    : {},
                }}
              >
                <Typography
                  sx={{
                    fontSize: isCurrent ? '0.688rem' : '0.563rem',
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: 1,
                  }}
                >
                  {unit.unitNumber}
                </Typography>
                {isCurrent && (
                  <Typography
                    sx={{
                      fontSize: '0.438rem',
                      color: alpha('#fff', 0.8),
                      lineHeight: 1,
                      mt: 0.125,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    You are here
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Count */}
      <Typography
        sx={{
          fontSize: '0.625rem',
          color: 'text.disabled',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {sorted.length} units
      </Typography>
    </Box>
  );
};

export default FloorContextBar;

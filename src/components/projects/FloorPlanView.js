// File: src/components/projects/FloorPlanView.js
// 2D top-down floor layout showing unit positions as colored rectangles
// Used in TowerDetailPage (per-floor view) and UnitDetailPage (context view)

import React, { useState } from 'react';
import { Box, Typography, Tooltip, alpha, useTheme, Chip } from '@mui/material';
import { Layers } from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLORS = {
  available: 'success',
  sold: 'error',
  blocked: 'warning',
  'on-hold': 'info',
  booked: 'primary',
};

const FloorPlanView = ({
  units = [],
  floorNumber,
  projectId,
  towerId,
  onUnitClick,
  highlightedUnitId,
  compact = false,
}) => {
  const theme = useTheme();
  const [hoveredId, setHoveredId] = useState(null);

  const sorted = [...units].sort((a, b) => {
    const numA = parseInt(a.unitNumber) || 0;
    const numB = parseInt(b.unitNumber) || 0;
    return numA - numB;
  });

  if (sorted.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          color: 'text.disabled',
        }}
      >
        <Typography variant="caption">No units on this floor</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Floor header */}
      {floorNumber != null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Layers sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary' }}>
            Floor {floorNumber}
          </Typography>
          <Chip
            label={`${sorted.length} units`}
            size="small"
            sx={{ height: 20, fontSize: '0.625rem' }}
          />
        </Box>
      )}

      {/* Floor plan grid */}
      <Box
        sx={{
          display: 'flex',
          gap: compact ? '4px' : '6px',
          flexWrap: 'wrap',
          p: compact ? 0.5 : 1,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.grey[100], 0.5),
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {sorted.map((unit) => {
          const unitId = unit._id || unit.id;
          const statusKey = STATUS_COLORS[unit.status?.toLowerCase()] || 'grey';
          const color = theme.palette[statusKey]?.main || theme.palette.grey[400];
          const isHighlighted = highlightedUnitId === unitId;
          const isHovered = hoveredId === unitId;

          const cellWidth = compact ? 36 : 64;
          const cellHeight = compact ? 36 : 52;

          return (
            <Tooltip
              key={unitId}
              arrow
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    Unit {unit.unitNumber}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem' }}>
                    {unit.unitType || unit.type} &middot; {unit.areaSqft || '—'} sq ft
                  </Typography>
                  {unit.currentPrice && (
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600 }}>
                      {formatCurrency(unit.currentPrice, { compact: true })}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Box
                onClick={() => onUnitClick?.(unit)}
                onMouseEnter={() => setHoveredId(unitId)}
                onMouseLeave={() => setHoveredId(null)}
                sx={{
                  width: cellWidth,
                  height: cellHeight,
                  borderRadius: compact ? '4px' : '6px',
                  bgcolor: isHighlighted ? color : alpha(color, isHovered ? 0.9 : 0.75),
                  border: isHighlighted ? '2.5px solid' : '1.5px solid',
                  borderColor: isHighlighted ? 'text.primary' : alpha(color, 0.5),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isHighlighted
                    ? 'scale(1.1)'
                    : isHovered
                    ? 'scale(1.05)'
                    : 'none',
                  boxShadow: isHighlighted
                    ? `0 0 0 3px ${alpha(color, 0.3)}, 0 4px 12px rgba(0,0,0,0.15)`
                    : isHovered
                    ? `0 2px 8px ${alpha(color, 0.4)}`
                    : 'none',
                  zIndex: isHighlighted ? 3 : isHovered ? 2 : 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: compact ? '0.563rem' : '0.688rem',
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    lineHeight: 1,
                  }}
                >
                  {unit.unitNumber}
                </Typography>
                {!compact && (
                  <Typography
                    sx={{
                      fontSize: '0.5rem',
                      color: alpha('#fff', 0.8),
                      lineHeight: 1,
                      mt: 0.25,
                    }}
                  >
                    {unit.unitType || unit.type || ''}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default FloorPlanView;

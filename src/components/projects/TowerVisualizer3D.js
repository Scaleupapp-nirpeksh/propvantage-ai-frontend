// File: src/components/projects/TowerVisualizer3D.js
// Interactive CSS 3D tower visualization with rotatable floors and clickable units
// Features: drag rotation, zoom, floor expansion, hover tooltips, status legend, mobile fallback

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Popper,
  Paper,
  Fade,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ThreeDRotation,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Layers,
} from '@mui/icons-material';
import use3DInteraction from '../../hooks/use3DInteraction';
import { formatCurrency } from '../../utils/formatters';

// Status → theme color key
const STATUS_COLORS = {
  available: 'success',
  sold: 'error',
  blocked: 'warning',
  booked: 'primary',
};

// Group units by floor
const groupByFloor = (units, totalFloors) => {
  const floors = {};
  for (let i = 0; i < totalFloors; i++) {
    floors[i] = [];
  }
  units.forEach((unit) => {
    const floor = unit.floor ?? unit.floorNumber ?? 0;
    if (!floors[floor]) floors[floor] = [];
    floors[floor].push(unit);
  });
  // Sort units within each floor by unit number
  Object.values(floors).forEach((floorUnits) => {
    floorUnits.sort((a, b) => {
      const numA = parseInt(a.unitNumber) || 0;
      const numB = parseInt(b.unitNumber) || 0;
      return numA - numB;
    });
  });
  return floors;
};

// ─── Status Legend ───────────────────────────────────────────
const StatusLegend = () => {
  const theme = useTheme();
  const items = [
    { label: 'Available', color: theme.palette.success.main },
    { label: 'Sold', color: theme.palette.error.main },
    { label: 'Blocked', color: theme.palette.warning.main },
    { label: 'On Hold', color: theme.palette.info.main },
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        zIndex: 5,
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              bgcolor: item.color,
              border: '1px solid',
              borderColor: alpha(item.color, 0.5),
            }}
          />
          <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary', fontWeight: 500 }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ─── Tower Stats Overlay ────────────────────────────────────
const TowerStatsOverlay = ({ units, tower }) => {
  const sold = units.filter((u) => u.status === 'sold').length;
  const available = units.filter((u) => u.status === 'available').length;
  const total = units.length;
  const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        bgcolor: alpha('#fff', 0.92),
        backdropFilter: 'blur(8px)',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        p: 1.5,
        zIndex: 5,
        minWidth: 120,
      }}
    >
      <Typography sx={{ fontSize: '0.688rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {tower?.towerName || 'Tower'}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>
          {sold} sold / {total} total ({soldPct}%)
        </Typography>
        <Typography sx={{ fontSize: '0.625rem', color: 'success.main' }}>
          {available} available
        </Typography>
      </Box>
    </Box>
  );
};

// ─── View Controls ──────────────────────────────────────────
const ViewControls = ({ onZoomIn, onZoomOut, onReset, onPreset, scale }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        zIndex: 5,
      }}
    >
      <Tooltip title="Reset view" placement="right">
        <IconButton
          size="small"
          onClick={onReset}
          sx={{
            bgcolor: alpha('#fff', 0.9),
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: '#fff' },
            width: 32,
            height: 32,
          }}
        >
          <CenterFocusStrong sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom in" placement="right">
        <IconButton
          size="small"
          onClick={onZoomIn}
          disabled={scale >= 2}
          sx={{
            bgcolor: alpha('#fff', 0.9),
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: '#fff' },
            width: 32,
            height: 32,
          }}
        >
          <ZoomIn sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out" placement="right">
        <IconButton
          size="small"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          sx={{
            bgcolor: alpha('#fff', 0.9),
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: '#fff' },
            width: 32,
            height: 32,
          }}
        >
          <ZoomOut sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Box sx={{ height: 4 }} />
      {['front', 'isometric', 'top', 'side'].map((preset) => (
        <Tooltip key={preset} title={preset.charAt(0).toUpperCase() + preset.slice(1)} placement="right">
          <IconButton
            size="small"
            onClick={() => onPreset(preset)}
            sx={{
              bgcolor: alpha('#fff', 0.9),
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: '#fff' },
              width: 32,
              height: 32,
              fontSize: '0.563rem',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            {preset[0].toUpperCase()}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

// ─── Unit Tooltip Content ───────────────────────────────────
const UnitTooltipContent = ({ unit }) => {
  const theme = useTheme();
  const statusKey = STATUS_COLORS[unit.status?.toLowerCase()] || 'grey';
  const color = theme.palette[statusKey]?.main || theme.palette.grey[500];

  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 2,
        maxWidth: 200,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.813rem', fontWeight: 600 }}>
          Unit {unit.unitNumber}
        </Typography>
        <Chip
          label={unit.status}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.563rem',
            fontWeight: 600,
            bgcolor: alpha(color, 0.1),
            color: color,
          }}
        />
      </Box>
      <Typography sx={{ fontSize: '0.688rem', color: 'text.secondary' }}>
        {unit.unitType || unit.type} &middot; Floor {unit.floor ?? unit.floorNumber}
      </Typography>
      {unit.areaSqft && (
        <Typography sx={{ fontSize: '0.688rem', color: 'text.secondary' }}>
          {unit.areaSqft} sq ft
        </Typography>
      )}
      {unit.currentPrice && (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.main', mt: 0.25 }}>
          {formatCurrency(unit.currentPrice, { compact: true })}
        </Typography>
      )}
      <Typography sx={{ fontSize: '0.563rem', color: 'text.disabled', mt: 0.5 }}>
        Click to view details
      </Typography>
    </Paper>
  );
};

// ─── Flattened Tower View (Mobile Fallback) ─────────────────
const FlattenedTowerView = ({ floors, units, onUnitClick, selectedUnitId }) => {
  const theme = useTheme();
  const grouped = useMemo(
    () => groupByFloor(units, floors),
    [units, floors]
  );
  const floorNumbers = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1 }}>
      {floorNumbers.map((floorNum) => {
        const floorUnits = grouped[floorNum] || [];
        if (floorUnits.length === 0) return null;
        return (
          <Box key={floorNum} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                fontSize: '0.625rem',
                color: 'text.secondary',
                width: 28,
                textAlign: 'right',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              F{floorNum}
            </Typography>
            <Box sx={{ display: 'flex', gap: '3px', flex: 1, flexWrap: 'wrap' }}>
              {floorUnits.map((unit) => {
                const statusKey = STATUS_COLORS[unit.status?.toLowerCase()] || 'grey';
                const color = theme.palette[statusKey]?.main || theme.palette.grey[400];
                const isSelected = selectedUnitId === (unit._id || unit.id);
                return (
                  <Tooltip
                    key={unit._id || unit.id}
                    title={`Unit ${unit.unitNumber} — ${unit.status}`}
                    arrow
                  >
                    <Box
                      onClick={() => onUnitClick?.(unit)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '4px',
                        bgcolor: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #fff' : '1px solid',
                        borderColor: isSelected ? '#fff' : alpha(color, 0.6),
                        boxShadow: isSelected ? `0 0 8px ${alpha(color, 0.5)}` : 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          boxShadow: `0 0 8px ${alpha(color, 0.5)}`,
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff' }}>
                        {unit.unitNumber}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// ─── Main 3D Tower Visualizer ───────────────────────────────
const TowerVisualizer3D = ({
  tower,
  units = [],
  projectId,
  towerId,
  onUnitClick,
  selectedUnitId,
  height = 500,
  showLegend = true,
  showStats = true,
  mini = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef(null);

  const {
    rotateX,
    rotateY,
    scale,
    isDragging,
    handlers,
    resetView,
    setPreset,
  } = use3DInteraction();

  const [hoveredUnit, setHoveredUnit] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [expandedFloor, setExpandedFloor] = useState(null);

  const totalFloors = tower?.totalFloors || 10;
  const grouped = useMemo(() => groupByFloor(units, totalFloors), [units, totalFloors]);
  const floorNumbers = useMemo(
    () => Object.keys(grouped).map(Number).sort((a, b) => b - a),
    [grouped]
  );
  const maxUnitsPerFloor = useMemo(
    () => Math.max(...Object.values(grouped).map((f) => f.length), 1),
    [grouped]
  );

  const containerWidth = mini ? 200 : undefined;
  const cellSize = mini ? 20 : Math.max(28, Math.min(44, 320 / maxUnitsPerFloor));
  const floorSpacing = Math.min(mini ? 24 : 44, (height - 80) / Math.max(totalFloors, 1));

  const handleUnitHover = useCallback((e, unit) => {
    setHoveredUnit(unit);
    setTooltipAnchor(e.currentTarget);
  }, []);

  const handleUnitLeave = useCallback(() => {
    setHoveredUnit(null);
    setTooltipAnchor(null);
  }, []);

  const handleFloorClick = useCallback((floorNum) => {
    setExpandedFloor((prev) => (prev === floorNum ? null : floorNum));
  }, []);

  // Mobile fallback
  if (isMobile) {
    return (
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Layers sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {tower?.towerName || 'Tower'} — Floor View
          </Typography>
        </Box>
        <FlattenedTowerView
          floors={totalFloors}
          units={units}
          onUnitClick={onUnitClick}
          selectedUnitId={selectedUnitId}
        />
        {showLegend && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <StatusLegend />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: containerWidth || '100%',
        height: mini ? 200 : height,
        borderRadius: mini ? 2 : 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        perspective: '1200px',
        perspectiveOrigin: '50% 40%',
      }}
      {...handlers}
    >
      {/* 3D Scene */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transformStyle: 'preserve-3d',
          transform: `
            translate(-50%, -50%)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale(${scale})
          `,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        {floorNumbers.map((floorNum) => {
          const floorUnits = grouped[floorNum] || [];
          const isExpanded = expandedFloor === floorNum;
          const yOffset = -(floorNum * floorSpacing);

          return (
            <Box
              key={floorNum}
              onClick={() => handleFloorClick(floorNum)}
              sx={{
                position: 'absolute',
                top: yOffset,
                left: '50%',
                transform: `
                  translateX(-50%)
                  translateZ(${floorNum * 1.5}px)
                  ${isExpanded ? 'scale(1.06) translateZ(16px)' : ''}
                `,
                transformStyle: 'preserve-3d',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                p: '4px',
                borderRadius: '4px',
                bgcolor: isExpanded
                  ? alpha(theme.palette.primary.main, 0.06)
                  : alpha(theme.palette.grey[300], 0.35),
                border: isExpanded ? '1.5px solid' : '1px solid',
                borderColor: isExpanded ? 'primary.main' : alpha(theme.palette.grey[400], 0.5),
                boxShadow: isExpanded
                  ? '0 4px 16px rgba(0,0,0,0.12)'
                  : '0 1px 2px rgba(0,0,0,0.04)',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  borderColor: 'primary.light',
                },
                // Depth edge (bottom face)
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -3,
                  left: 2,
                  right: 2,
                  height: 3,
                  bgcolor: alpha(theme.palette.grey[400], 0.2),
                  borderRadius: '0 0 2px 2px',
                  transform: 'rotateX(90deg)',
                  transformOrigin: 'top',
                },
              }}
            >
              {/* Floor label */}
              <Typography
                sx={{
                  fontSize: '0.563rem',
                  fontWeight: 700,
                  color: isExpanded ? 'primary.main' : 'text.secondary',
                  width: mini ? 16 : 24,
                  textAlign: 'center',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {mini ? floorNum : `F${floorNum}`}
              </Typography>

              {/* Unit cells */}
              {floorUnits.map((unit) => {
                const statusKey = STATUS_COLORS[unit.status?.toLowerCase()] || 'grey';
                const color = theme.palette[statusKey]?.main || theme.palette.grey[400];
                const unitId = unit._id || unit.id;
                const isHovered = hoveredUnit?._id === unitId || hoveredUnit?.id === unitId;
                const isSelected = selectedUnitId === unitId;

                return (
                  <Box
                    key={unitId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnitClick?.(unit);
                    }}
                    onMouseEnter={(e) => handleUnitHover(e, unit)}
                    onMouseLeave={handleUnitLeave}
                    sx={{
                      width: cellSize,
                      height: cellSize,
                      minWidth: 20,
                      minHeight: 20,
                      bgcolor: color,
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '2px solid #fff' : '1px solid',
                      borderColor: isSelected ? '#fff' : alpha(color, 0.6),
                      boxShadow: isHovered
                        ? `0 0 12px ${alpha(color, 0.6)}`
                        : isSelected
                        ? `0 0 8px ${alpha(color, 0.5)}`
                        : 'none',
                      transform: isHovered ? 'scale(1.2) translateZ(6px)' : 'none',
                      zIndex: isHovered ? 10 : 1,
                    }}
                  >
                    {!mini && (
                      <Typography
                        sx={{
                          fontSize: cellSize > 30 ? '0.563rem' : '0.5rem',
                          fontWeight: 700,
                          color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: 1,
                        }}
                      >
                        {unit.unitNumber}
                      </Typography>
                    )}
                  </Box>
                );
              })}

              {/* Empty floor placeholder */}
              {floorUnits.length === 0 && (
                <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled', fontStyle: 'italic' }}>
                  No units
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Unit Tooltip */}
      <Popper
        open={Boolean(hoveredUnit && tooltipAnchor)}
        anchorEl={tooltipAnchor}
        placement="top"
        transition
        sx={{ zIndex: 20 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Box>
              {hoveredUnit && <UnitTooltipContent unit={hoveredUnit} />}
            </Box>
          </Fade>
        )}
      </Popper>

      {/* Controls */}
      {!mini && (
        <ViewControls
          onReset={resetView}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onPreset={setPreset}
          scale={scale}
        />
      )}

      {/* Legend */}
      {showLegend && !mini && <StatusLegend />}

      {/* Stats */}
      {showStats && !mini && <TowerStatsOverlay units={units} tower={tower} />}

      {/* Drag hint */}
      {!mini && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 5,
            opacity: 0.5,
          }}
        >
          <ThreeDRotation sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: '0.563rem', color: 'text.disabled' }}>
            Drag to rotate &middot; Scroll to zoom
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TowerVisualizer3D;

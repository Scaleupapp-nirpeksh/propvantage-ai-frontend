// File: src/components/projects/MiniTowerSilhouette.js
// Pure CSS mini building silhouette for project/tower cards
// Height proportional to floors, fill from bottom based on sold percentage

import React from 'react';
import { Box, alpha, useTheme, Tooltip, Typography } from '@mui/material';

const MiniTowerSilhouette = ({
  floors = 10,
  soldPercentage = 0,
  width = 32,
  height: propHeight,
  color,
  label,
  onClick,
}) => {
  const theme = useTheme();
  const baseColor = color || theme.palette.primary.main;
  const towerHeight = propHeight || Math.max(40, Math.min(80, floors * 4));
  const fillHeight = (soldPercentage / 100) * towerHeight;
  const floorHeight = towerHeight / Math.max(floors, 1);

  const content = (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width,
        height: towerHeight,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : {},
      }}
    >
      {/* Building outline */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: towerHeight,
          borderRadius: '3px 3px 0 0',
          border: '1.5px solid',
          borderColor: alpha(baseColor, 0.3),
          borderBottom: 'none',
          bgcolor: alpha(baseColor, 0.04),
          overflow: 'hidden',
        }}
      >
        {/* Sold fill from bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: fillHeight,
            bgcolor: alpha(baseColor, 0.2),
            transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />

        {/* Floor lines */}
        {Array.from({ length: Math.max(floors - 1, 0) }, (_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              bottom: (i + 1) * floorHeight,
              left: '15%',
              width: '70%',
              height: '1px',
              bgcolor: alpha(baseColor, 0.15),
            }}
          />
        ))}

        {/* Window dots */}
        {floors <= 15 &&
          Array.from({ length: Math.min(floors, 12) }, (_, i) => (
            <Box
              key={`w-${i}`}
              sx={{
                position: 'absolute',
                bottom: i * floorHeight + floorHeight * 0.3,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '2px',
              }}
            >
              {[0, 1].map((w) => (
                <Box
                  key={w}
                  sx={{
                    width: Math.max(3, width * 0.12),
                    height: Math.max(3, floorHeight * 0.35),
                    borderRadius: '1px',
                    bgcolor: alpha(baseColor, 0.25),
                  }}
                />
              ))}
            </Box>
          ))}
      </Box>

      {/* Rooftop accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -2,
          left: '20%',
          width: '60%',
          height: 2,
          borderRadius: 1,
          bgcolor: baseColor,
        }}
      />

      {/* Base/ground */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -2,
          left: -2,
          width: width + 4,
          height: 2,
          bgcolor: alpha(baseColor, 0.3),
          borderRadius: 1,
        }}
      />
    </Box>
  );

  if (label) {
    return (
      <Tooltip title={label} placement="top" arrow>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          {content}
          <Typography
            variant="caption"
            sx={{ fontSize: '0.563rem', color: 'text.secondary', lineHeight: 1, textAlign: 'center' }}
            noWrap
          >
            {label}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return content;
};

export default MiniTowerSilhouette;

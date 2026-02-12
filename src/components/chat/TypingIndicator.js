import React from 'react';
import { Box, Typography, alpha, useTheme, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
`;

const TypingIndicator = ({ text }) => {
  const theme = useTheme();
  if (!text) return null;

  return (
    <Box sx={{ px: 2, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.4 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.text.secondary, 0.4),
              animation: `${bounce} 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap>
        {text}
      </Typography>
    </Box>
  );
};

export default TypingIndicator;

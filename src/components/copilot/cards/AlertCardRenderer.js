// File: src/components/copilot/cards/AlertCardRenderer.js
// Renders an alert banner using MUI Alert

import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

const AlertCardRenderer = ({ card }) => {
  return (
    <Box sx={{ mb: 1 }}>
      <Alert
        severity={card.severity || 'info'}
        variant="standard"
        sx={{ fontSize: '0.75rem', py: 0.5 }}
      >
        {card.title && <AlertTitle sx={{ fontSize: '0.75rem', mb: 0.25 }}>{card.title}</AlertTitle>}
        {card.message}
      </Alert>
    </Box>
  );
};

export default AlertCardRenderer;

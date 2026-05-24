// File: src/components/ai/AINarrative.jsx
// Description: SP5 — renders the LLM narrative prose. Plain rendering for v1
//   (no inline citation pills yet — the AICitationsPanel handles citations
//   below the prose). Supports a compact mode that truncates long narratives.

import React, { useState } from 'react';
import { Typography, Box, Button } from '@mui/material';

const AINarrative = ({ narrative, compact = false, maxChars = 280 }) => {
  const [expanded, setExpanded] = useState(false);
  const text = String(narrative || '').trim();
  if (!text) return null;

  const tooLong = compact && text.length > maxChars && !expanded;
  const display = tooLong ? `${text.slice(0, maxChars).trim()}…` : text;

  return (
    <Box>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
        {display}
      </Typography>
      {compact && text.length > maxChars && (
        <Button size="small" onClick={() => setExpanded((e) => !e)} sx={{ mt: 0.5, textTransform: 'none', p: 0, minWidth: 'auto' }}>
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </Box>
  );
};

export default AINarrative;

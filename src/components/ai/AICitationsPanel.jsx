// File: src/components/ai/AICitationsPanel.jsx
// Description: SP5 — expandable list of cited record links. Citations arrive
//   as either string URLs or { label, url } shapes; this component handles both.

import React, { useState } from 'react';
import { Box, Collapse, List, ListItemButton, ListItemText, Typography, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore, Link as LinkIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const AICitationsPanel = ({ citations = [], defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  // Normalise — accept string[] or { label, url }[].
  const items = (citations || [])
    .map((c) => (typeof c === 'string' ? { label: c, url: c } : c))
    .filter((c) => c && c.url);

  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 1, borderTop: '1px dashed', borderColor: 'divider', pt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen((o) => !o)}>
        <LinkIcon sx={{ fontSize: 16, mr: 0.5 }} color="action" />
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {items.length} {items.length === 1 ? 'source' : 'sources'} cited
        </Typography>
        <IconButton size="small">{open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}</IconButton>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 1 }}>
          {items.map((c, i) => (
            <ListItemButton key={`${c.url}-${i}`} component={RouterLink} to={c.url} sx={{ py: 0.25 }}>
              <ListItemText
                primary={c.label || c.url}
                primaryTypographyProps={{ variant: 'caption', sx: { color: 'primary.main' } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

export default AICitationsPanel;

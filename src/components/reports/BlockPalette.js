// File: src/components/reports/BlockPalette.js
import React from 'react';
import { Box, Typography, Paper, List, ListItemButton, ListItemText, Chip } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { groupCatalogByCategory } from '../../utils/reportCatalog';

/**
 * Left rail: catalog grouped by category. Clicking a block calls onAdd(blockDef).
 * @param {{ catalog: Array, onAdd: (block) => void, loading?: boolean }} props
 */
const BlockPalette = ({ catalog = [], onAdd, loading = false }) => {
  const groups = groupCatalogByCategory(catalog);

  if (loading) return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Loading blocks…</Typography>;

  return (
    <Box sx={{ p: 1.5, overflowY: 'auto' }}>
      <Typography variant="overline" color="text.secondary">Add blocks</Typography>
      {groups.map((group) => (
        <Paper key={group.category} variant="outlined" sx={{ mb: 1.5, borderRadius: 2 }}>
          <Box sx={{ px: 1.5, pt: 1 }}>
            <Chip size="small" label={group.category} />
          </Box>
          <List dense disablePadding>
            {group.blocks.map((block) => (
              <ListItemButton key={block.type} onClick={() => onAdd(block)}>
                <AddCircleOutline fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <ListItemText primary={block.label} secondary={block.description} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
};

export default BlockPalette;

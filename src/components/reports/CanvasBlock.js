// File: src/components/reports/CanvasBlock.js
// Wraps a report block on the agent canvas with one-tap controls (move/remove/retitle).
import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Popover, TextField, Button } from '@mui/material';
import { ArrowUpward, ArrowDownward, DeleteOutline, EditOutlined } from '@mui/icons-material';
import ReportBlockRenderer from './ReportBlockRenderer';

const CanvasBlock = ({ block, images, themePreset, accentColor, isFirst, isLast, onMoveUp, onMoveDown, onRemove, onRetitle }) => {
  const [anchor, setAnchor] = useState(null);
  const [title, setTitle] = useState(block.title || '');

  const openRetitle = (e) => { setTitle(block.title || ''); setAnchor(e.currentTarget); };
  const saveTitle = () => { onRetitle(title); setAnchor(null); };

  return (
    <Box sx={{ position: 'relative', '&:hover .canvas-block-tools': { opacity: 1 } }}>
      <Box className="canvas-block-tools"
        sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity .15s',
          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 1 }}>
        <Tooltip title="Move up"><span><IconButton size="small" disabled={isFirst} onClick={onMoveUp}><ArrowUpward fontSize="inherit" /></IconButton></span></Tooltip>
        <Tooltip title="Move down"><span><IconButton size="small" disabled={isLast} onClick={onMoveDown}><ArrowDownward fontSize="inherit" /></IconButton></span></Tooltip>
        <Tooltip title="Rename"><IconButton size="small" onClick={openRetitle}><EditOutlined fontSize="inherit" /></IconButton></Tooltip>
        <Tooltip title="Remove"><IconButton size="small" onClick={onRemove}><DeleteOutline fontSize="inherit" /></IconButton></Tooltip>
      </Box>
      <ReportBlockRenderer block={block} images={images} themePreset={themePreset} accentColor={accentColor} />
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField size="small" label="Block title" value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }} autoFocus />
          <Button size="small" variant="contained" onClick={saveTitle}>Save</Button>
        </Box>
      </Popover>
    </Box>
  );
};

export default CanvasBlock;

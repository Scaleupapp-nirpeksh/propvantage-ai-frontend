// File: src/components/reports/SortableBlockItem.js
import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DragIndicator, DeleteOutline } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Wraps a preview block with a drag handle + remove button + select-on-click.
 * @param {{ id, selected, onSelect, onRemove, children }} props
 */
const SortableBlockItem = ({ id, selected, onSelect, onRemove, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(id)}
      sx={{
        position: 'relative', mb: 1.5, p: 1, borderRadius: 2,
        border: (t) => `2px solid ${selected ? t.palette.primary.main : 'transparent'}`,
        '&:hover .block-controls': { opacity: 1 },
      }}
    >
      <Box className="block-controls" sx={{
        position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5,
        opacity: 0, transition: 'opacity 0.15s', zIndex: 2,
        bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1,
      }}>
        <Tooltip title="Drag to reorder">
          <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', touchAction: 'none' }}>
            <DragIndicator fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {children}
    </Box>
  );
};

export default SortableBlockItem;

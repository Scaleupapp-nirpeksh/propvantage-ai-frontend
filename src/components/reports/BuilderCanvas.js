// File: src/components/reports/BuilderCanvas.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableBlockItem from './SortableBlockItem';
import ReportBlockRenderer from './ReportBlockRenderer';

/**
 * Center canvas: live preview of blocks, drag-to-reorder.
 * @param {{ blocks, images, selectedBlockId, onSelect, onRemove, onReorder }} props
 *   onReorder(fromIndex, toIndex)
 */
const BuilderCanvas = ({ blocks = [], images = [], selectedBlockId, onSelect, onRemove, onReorder }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  if (blocks.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">Add blocks from the left to start building your report.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              id={block.id}
              selected={block.id === selectedBlockId}
              onSelect={onSelect}
              onRemove={onRemove}
            >
              <ReportBlockRenderer block={block} images={images} />
            </SortableBlockItem>
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
};

export default BuilderCanvas;

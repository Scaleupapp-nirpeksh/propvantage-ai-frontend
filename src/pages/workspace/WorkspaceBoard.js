// src/pages/workspace/WorkspaceBoard.js
import React, { useMemo, useRef, useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkspace } from '../../context/WorkspaceContext';
import WorkspaceCardView from './WorkspaceCardView';

// Flexbox basis (%) per size at the md+ breakpoint = cards per row.
// lg = 1/row (full), md = 2/row (half), sm = 3/row (third).
const SIZE_BASIS = { sm: '33.333%', md: '50%', lg: '100%' };

// Drag a card's right grip → snap width to the nearest of {1/3, 1/2, full}.
const fractionToSize = (frac) => (frac <= 0.417 ? 'sm' : frac <= 0.75 ? 'md' : 'lg');

const SortableCard = ({ item, card, displaySize, onResizeStart }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.cardId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Box
      ref={setNodeRef}
      data-card-wrapper
      style={style}
      sx={{
        position: 'relative',
        p: 1,
        boxSizing: 'border-box',
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: { xs: '100%', sm: '50%', md: SIZE_BASIS[displaySize] || SIZE_BASIS.md },
        minWidth: { xs: '100%', sm: 320 },
      }}
    >
      <WorkspaceCardView
        card={card}
        size={displaySize}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      {/* Drag-to-resize grip (right edge). Reorder is bound to the header icon
          only, so this never triggers a sort. */}
      <Tooltip title="Drag to resize" placement="left">
        <Box
          onPointerDown={(e) => onResizeStart(item.cardId, e)}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 2,
            transform: 'translateY(-50%)',
            width: 8,
            height: 48,
            borderRadius: 1,
            bgcolor: 'divider',
            cursor: 'ew-resize',
            touchAction: 'none',
            opacity: 0,
            transition: 'opacity 0.15s',
            zIndex: 3,
            '&:hover': { bgcolor: 'primary.main', opacity: 1 },
            'div[data-card-wrapper]:hover &': { opacity: 0.5 },
          }}
        />
      </Tooltip>
    </Box>
  );
};

const WorkspaceBoard = () => {
  const { cards, layout, saveLayout } = useWorkspace();
  const containerRef = useRef(null);
  const [resizing, setResizing] = useState(null); // { cardId, size } during a drag-resize

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Build the ordered, resolved list of { item, card } the board renders.
  const cardById = useMemo(() => {
    const map = new Map();
    cards.forEach((c) => map.set(c._id, c));
    return map;
  }, [cards]);

  const orderedItems = useMemo(
    () =>
      [...(layout.items || [])]
        .sort((a, b) => a.order - b.order)
        .filter((it) => cardById.has(it.cardId)),
    [layout.items, cardById],
  );

  const [activeIds, setActiveIds] = useState(orderedItems.map((it) => it.cardId));

  // Keep local order in sync when layout changes from elsewhere.
  React.useEffect(() => {
    setActiveIds(orderedItems.map((it) => it.cardId));
  }, [orderedItems]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeIds.indexOf(active.id);
    const newIndex = activeIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeIds, oldIndex, newIndex);
    setActiveIds(reordered);

    // Persist new order, preserving each item's size.
    const sizeByCard = new Map(orderedItems.map((it) => [it.cardId, it.size]));
    const nextItems = reordered.map((cardId, i) => ({
      cardId,
      order: i,
      size: sizeByCard.get(cardId) || 'md',
    }));
    saveLayout(nextItems);
  };

  // Persist a single card's new width, preserving the current order + other sizes.
  const persistSize = (cardId, size) => {
    const sizeByCard = new Map(orderedItems.map((it) => [it.cardId, it.size]));
    sizeByCard.set(cardId, size);
    const nextItems = activeIds.map((id, i) => ({
      cardId: id,
      order: i,
      size: sizeByCard.get(id) || 'md',
    }));
    saveLayout(nextItems);
  };

  // Start a drag-resize from a card's right grip. Tracks the pointer against the
  // board width, snaps to 1/3·1/2·full, previews live, and persists on release.
  const startResize = (cardId, e) => {
    const wrapper = e.currentTarget.closest('[data-card-wrapper]');
    const container = containerRef.current;
    if (!wrapper || !container) return;
    e.preventDefault();
    e.stopPropagation();

    let latest = null;
    const onMove = (ev) => {
      const cw = container.getBoundingClientRect().width;
      const left = wrapper.getBoundingClientRect().left;
      const frac = cw > 0 ? (ev.clientX - left) / cw : 0.5;
      const size = fractionToSize(Math.max(0.1, Math.min(1, frac)));
      latest = size;
      setResizing({ cardId, size });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setResizing(null);
      if (latest) persistSize(cardId, latest);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activeIds} strategy={rectSortingStrategy}>
        <Box ref={containerRef} sx={{ display: 'flex', flexWrap: 'wrap', m: -1 }}>
          {activeIds.map((cardId) => {
            const item = orderedItems.find((it) => it.cardId === cardId);
            const card = cardById.get(cardId);
            if (!item || !card) return null;
            const displaySize = resizing && resizing.cardId === cardId ? resizing.size : item.size;
            return (
              <SortableCard
                key={cardId}
                item={item}
                card={card}
                displaySize={displaySize}
                onResizeStart={startResize}
              />
            );
          })}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default WorkspaceBoard;

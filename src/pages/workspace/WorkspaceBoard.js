// src/pages/workspace/WorkspaceBoard.js
import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkspace } from '../../context/WorkspaceContext';
import WorkspaceCardView from './WorkspaceCardView';

// Map a card size to a responsive column span (12-col grid).
// eslint-disable-next-line no-unused-vars
const SIZE_SPAN = {
  sm: { xs: 12, sm: 6, md: 4, lg: 3 },
  md: { xs: 12, sm: 6, md: 6, lg: 4 },
  lg: { xs: 12, sm: 12, md: 8, lg: 6 },
};

// Flexbox basis (%) per size at the md+ breakpoint — keeps dnd hit-areas simple.
const SIZE_BASIS = { sm: '25%', md: '33.333%', lg: '50%' };

const SortableCard = ({ item, card }) => {
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
      style={style}
      sx={{
        p: 1,
        boxSizing: 'border-box',
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: { xs: '100%', sm: '50%', md: SIZE_BASIS[item.size] || SIZE_BASIS.md },
        minWidth: { xs: '100%', sm: 320 },
      }}
    >
      <WorkspaceCardView
        card={card}
        size={item.size}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Box>
  );
};

const WorkspaceBoard = () => {
  const { cards, layout, saveLayout } = useWorkspace();

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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activeIds} strategy={rectSortingStrategy}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', m: -1 }}>
          {activeIds.map((cardId) => {
            const item = orderedItems.find((it) => it.cardId === cardId);
            const card = cardById.get(cardId);
            if (!item || !card) return null;
            return <SortableCard key={cardId} item={item} card={card} />;
          })}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default WorkspaceBoard;

# Board Layout & Density (Theme B) — Design Spec

**Date:** 2026-06-17
**Status:** Approved (drag-to-resize + capped height/internal scroll)
**Scope:** Let users restructure the My-View board: resize each card's width by dragging, and keep tall list cards compact via a capped body height with internal scroll. **Frontend-only** — the `WorkspaceLayout` `size` enum (`sm`/`md`/`lg`) already exists; this repurposes it as a per-row width and adds the interaction.

## Width = per-row fraction (repurpose the existing enum, no migration)
Remap `SIZE_BASIS` at the md+ breakpoint:
- `lg` → **100%** (1 per row, full width)
- `md` → **50%** (2 per row, half)
- `sm` → **33.333%** (3 per row, third)

(xs stays 100%, sm-breakpoint stays 50% as today.) Defaults on add are unchanged (`addToBoard`: list→`md`, metric/insight→`sm`), so new list cards land at half-width and tiles at third — both resizable.

## Drag-to-resize (`WorkspaceBoard.js`)
- Each card wrapper gets `data-card-wrapper` + `position:relative` and a thin **resize grip** on its right edge (`cursor: ew-resize`, visible on hover/drag).
- The grip's `onPointerDown` starts a resize (NOT a reorder — reorder is bound only to the header drag icon via `dragHandleProps`, so the two never collide). `stopPropagation` + `preventDefault` to avoid text selection.
- Board `Box` holds a `containerRef`. On `pointermove` (window listener): `fraction = (clientX - wrapperRect.left) / containerWidth`; snap to the nearest of {0.333, 0.5, 1.0}:
  - `fraction ≤ 0.417` → `sm`; `≤ 0.75` → `md`; else `lg`.
- A transient `resizing = { cardId, size }` state drives live visual feedback (the wrapper's `flexBasis` follows the previewed size). On `pointerup`: persist via `saveLayout` (rebuild items preserving order, updating only this card's `size`), clear `resizing`, remove listeners.
- Touch: the same pointer events cover touch; the grip has a comfortable hit area (≥16px).

## Capped height + internal scroll (`WorkspaceCardView.js`)
- **List** cards: wrap the `DataTable` in a `Box` with a fixed `maxHeight` (~320px) and `overflowY:auto` so rows scroll inside the card; the card no longer grows with row count.
- **Metric / insight** cards: unchanged (short/auto height) — no cap.
- The card keeps `height:100%`; only the list body region scrolls.

## Non-goals
- No 4th (quarter) width. No board-level "scroll to top" button (capped cards make the board short enough). No backend changes. No drag-to-resize for height (height is auto/capped, not user-set). No per-breakpoint width overrides beyond the existing xs/sm rules.

## Testing / verification
- Frontend: `CI=true npm run build` compiles; ESLint clean. Extend/adjust the WorkspacePage smoke test only if it asserts board sizing.
- Live (demo board): drag a card's right grip → it snaps between 1/2/3 per row and the choice persists across reload; a long list card shows a fixed-height scrollable body; reorder-by-drag-icon still works and doesn't trigger resize.

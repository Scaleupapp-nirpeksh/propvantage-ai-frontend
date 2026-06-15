# Report Agent — Phase 4d: Per-block canvas controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-tap controls on each canvas block (move up/down, remove, retitle) so the user can adjust the report directly (not only by chat), and fix the recipients list-key bug in the schedule dialog.

**Architecture:** Frontend-only. A `CanvasBlock` wrapper renders a block via `ReportBlockRenderer` and shows a hover toolbar. Its actions edit `definition.blocks` (the client-owned working definition from 4b) and call `repreview(newDefinition)` (4c's override form) to re-resolve the canvas with real data — so manual edits and chat stay in sync (the agent sees the updated definition on the next turn).

**Tech Stack:** React/MUI, CRA. Branch `feature/report-agent` (frontend). Build: `CI=true npm run build`.

**Repo:** `propvantage-ai-frontend` only.

**Confirmed:** `ReportBlockRenderer({ block, images, themePreset, accentColor })`. `useReportAgent` exposes `{ definition, previewBlocks, setDefinition, repreview, ... }`; `repreview(defOverride)` previews `defOverride || definition`. Preview/agent blocks carry a stable `id` (matches `definition.blocks[].id`). `ScheduleDeliveryDialog` maps `recipients` with `key={i}` (the bug).

---

## File Structure
- **Create** `src/components/reports/CanvasBlock.js` — block + hover toolbar (up/down/remove/retitle).
- **Modify** `src/pages/reports/ReportAgentPage.js` — render canvas via `CanvasBlock` + block-edit handlers.
- **Modify** `src/components/reports/ScheduleDeliveryDialog.js` — stable recipient keys.

(No new unit tests — interactive page glue verified by build; the hook/renderer are unchanged.)

---

## Task 1: `CanvasBlock` (block + hover toolbar)

**Files:** Create `src/components/reports/CanvasBlock.js`

- [ ] **Step 1: Implement.**

```js
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
```

- [ ] **Step 2: Verify build** — `CI=true npm run build` → "Compiled successfully."
- [ ] **Step 3: Commit** — `git add src/components/reports/CanvasBlock.js && git commit -m "feat(reports): CanvasBlock — per-block one-tap controls"`

---

## Task 2: Wire per-block edits into the page

**Files:** Modify `src/pages/reports/ReportAgentPage.js` (read it first — keep all 4a/4b/4c behavior)

- [ ] **Step 1: Add block-edit handlers.** Near the other handlers, add (using 4c's `repreview(defOverride)` so the canvas re-resolves from the edited definition without a stale read):

```js
const applyBlocks = (fn) => {
  const newBlocks = fn(definition.blocks || []);
  const newDef = { ...definition, blocks: newBlocks };
  setDefinition(newDef);
  repreview(newDef);
};
const reindex = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));
const moveBlock = (id, dir) => applyBlocks((blocks) => {
  const i = blocks.findIndex((b) => b.id === id); const j = i + dir;
  if (i < 0 || j < 0 || j >= blocks.length) return blocks;
  const next = [...blocks]; [next[i], next[j]] = [next[j], next[i]]; return reindex(next);
});
const removeBlock = (id) => applyBlocks((blocks) => reindex(blocks.filter((b) => b.id !== id)));
const retitleBlock = (id, title) => applyBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, title } : b)));
```

- [ ] **Step 2: Render the canvas via `CanvasBlock`.** Replace the canvas `blocks.map(...)` that currently renders `<ReportBlockRenderer .../>` with:

```jsx
{blocks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((block, i, arr) => (
  <CanvasBlock
    key={block.id || block.type}
    block={block} images={imageSlots} themePreset={definition.theme?.preset} accentColor={definition.theme?.accentColor}
    isFirst={i === 0} isLast={i === arr.length - 1}
    onMoveUp={() => moveBlock(block.id, -1)}
    onMoveDown={() => moveBlock(block.id, 1)}
    onRemove={() => removeBlock(block.id)}
    onRetitle={(title) => retitleBlock(block.id, title)}
  />
))}
```

(Import `CanvasBlock` from `../../components/reports/CanvasBlock`. Pull `repreview` from `useReportAgent()` if not already destructured. `imageSlots` is from 4c — pass it through.)

- [ ] **Step 3: Verify build** — `CI=true npm run build` → clean (no unused imports — the page may no longer import `ReportBlockRenderer` directly if `CanvasBlock` now owns it; remove it if unused).
- [ ] **Step 4: Commit** — `git add src/pages/reports/ReportAgentPage.js && git commit -m "feat(reports): per-block move/remove/retitle on the agent canvas"`

---

## Task 3: Stable recipient keys (fix 4c review m4)

**Files:** Modify `src/components/reports/ScheduleDeliveryDialog.js` (read it first)

The recipients list is keyed by array index, which corrupts controlled inputs when a row is deleted. Give each recipient a stable client key.

- [ ] **Step 1: Implement.**
- When a recipient is ADDED (the "Add recipient" handler), include a stable client key, e.g. `{ email: '', name: '', role: '', _key: `r_${Date.now()}_${Math.random().toString(36).slice(2)}` }`.
- Where existing recipients are mapped without a `_key` (e.g. loaded from the server), fall back gracefully: in the render `map`, use `key={r._key || r.email || i}` instead of `key={i}`. (Backfill a `_key` on load if convenient, but the `|| r.email || i` fallback is sufficient.)
- `_key` is a client-only field; the backend `recipientSchema` (`{email,name,role}`) ignores unknown fields, so it is safe to carry in state and harmless if sent.

- [ ] **Step 2: Verify build** — `CI=true npm run build` → clean.
- [ ] **Step 3: Commit** — `git add src/components/reports/ScheduleDeliveryDialog.js && git commit -m "fix(reports): stable recipient keys (no controlled-input corruption on delete)"`

---

## Self-Review (done while writing)
- **Spec coverage:** Delivers the per-block one-tap controls (reorder/hide/retitle) from the curated-controls requirement (spec §9) + fixes the recipients bug. Logo/cover (needs the Phase-5 image proxy to render), scope/period picker chips, and the `flag-number` control (the instance-review flow) are explicitly deferred — flagged, not gaps.
- **Placeholder scan:** none.
- **Type consistency:** handlers edit `definition.blocks` (`{id,type,title,config,order}`) and call `repreview(newDef)` (4c override form); `CanvasBlock` props match the handlers; canvas matches block ids between `previewBlocks` and `definition.blocks` (both carry `id`); `imageSlots` passed through (4c).
- **Numbers-integrity:** unchanged — `repreview` re-resolves via `reportAPI.preview` (server); block edits change only types/order/title, never data.
- **Sync:** edits update the client-owned `definition`, which the hook already sends to the agent on the next turn (4b) — manual + chat stay coherent.

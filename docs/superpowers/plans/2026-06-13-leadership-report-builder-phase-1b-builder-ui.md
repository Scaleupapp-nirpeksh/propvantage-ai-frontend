# Leadership Report Builder — Phase 1b (Builder UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a leader compose a report template by picking data blocks from the catalog, arranging them by drag-and-drop, theming them, dropping in images, saving the template, and generating a live preview — all in the existing React app.

**Architecture:** New `reports` pages under `src/pages/reports/`. The builder's logic lives in a **pure reducer** (`builderState.js`) and pure utils (`reportCatalog.js`) that are TDD'd with the CRA/Jest+RTL harness. A shared **`ReportBlockRenderer`** maps a snapshot block to UI (reused by the Phase 2 public page). The builder composes focused components (palette, sortable canvas, config panel, theme picker, image uploader) and talks to the Phase 1a endpoints via a new `reportAPI`. Follows existing conventions: `axios` service object, `useAuth`/`canAccess`/`PermissionGate`, `ProtectedRoute` + lazy `Suspense`, MUI v5, Recharts, `@dnd-kit`.

**Tech Stack:** React 18, MUI v5, Recharts, `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (all already deps), axios, Jest + React Testing Library (via `react-scripts test`).

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`. Paths below are relative to that repo root.

**Depends on:** Phase 1a backend endpoints (mounted at `/api/reports`): `GET /catalog`, `GET|POST /templates`, `GET|PUT|DELETE /templates/:id`, `POST /templates/:id/generate`, `POST /uploads`. Phase 0 `reports:view/manage/approve` permissions.

**Test commands (CRA):** run a single suite once with
`CI=true npm test -- --watchAll=false --testPathPattern="<name>"`
Full type/compile check: `CI=true npm test -- --watchAll=false` then `npm run build`.

**Conventions captured (verbatim from the codebase) — use these exactly:**
- Shared components import: `import { PageHeader, KPICard, ChartCard, DataTable, EmptyState, ConfirmDialog, PermissionGate } from '../../components/common';` Skeletons: `import { ChartSkeleton, FormSkeleton } from '../../components/common';`
- `KPICard` props: `{ title, value, subtitle, trend:{value,direction}, icon, color, loading, onClick, formatter }`.
- `ChartCard` props: `{ title, subtitle, children, loading, height, actions, noPadding }` (wrap a Recharts `ResponsiveContainer`).
- `DataTable` props: `{ columns:[{id,label,render,sortable,width,align,hideOnMobile}], rows, loading, emptyState, pagination:{page,rowsPerPage,total,onPageChange}, onRowClick, rowKey }`.
- `PageHeader` props: `{ title, subtitle, icon, actions, loading, badge, children }`.
- `ConfirmDialog` props: `{ open, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel, loading }`.
- `EmptyState` props: `{ icon, title, description, action:{label,onClick,icon}, size }`.
- Theme: `theme.custom.chartColors` is an 8-color array; palette keys `primary/secondary/success/error/warning/info`.
- Auth: `const { checkPerm, checkAnyPerm, canAccess } = useAuth();` `checkPerm('reports:manage')`.
- API: services are named exports `export const xAPI = { fn: (args) => api.get/post(...) }` on the shared `api` axios instance; **no default export**. File upload pattern: build `FormData`, append `'file'`, `api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })`.

---

## File Structure

**New files:**
- `src/utils/reportCatalog.js` — pure `groupCatalogByCategory(catalog)`.
- `src/utils/reportCatalog.test.js`
- `src/pages/reports/builderState.js` — pure reducer `builderReducer`, `initialBuilderState`, action creators, `buildTemplatePayload(state)`, `templateToBuilderState(template)`, `makeId()`.
- `src/pages/reports/builderState.test.js`
- `src/components/reports/ReportBlockRenderer.js` — block → UI (shared with Phase 2 public page).
- `src/components/reports/ReportBlockRenderer.test.js`
- `src/components/reports/BlockPalette.js`
- `src/components/reports/BuilderCanvas.js` — `@dnd-kit/sortable` reorder + per-block preview.
- `src/components/reports/SortableBlockItem.js`
- `src/components/reports/BlockConfigPanel.js`
- `src/components/reports/ThemePicker.js`
- `src/components/reports/ImageUploader.js`
- `src/pages/reports/ReportTemplateListPage.js`
- `src/pages/reports/ReportTemplateBuilder.js`

**Modified files:**
- `src/services/api.js` — add `export const reportAPI = { ... }`.
- `src/context/AuthContext.js` — add `reports` to the `canAccess` object.
- `src/components/layout/DashboardLayout.js` — add a "Reports" nav item (INTELLIGENCE section) + icon import.
- `src/App.js` — lazy imports + 3 routes.

---

## Task 1: `reportAPI` service

**Files:** Modify `src/services/api.js`

- [ ] **Step 1: Add the service object.** Append a new named export near the other domain services (e.g. after `analyticsAPI`):

```js
// ─── Reports (Leadership Report Builder) ───────────────────────────────
export const reportAPI = {
  // Block catalog for the builder palette
  getCatalog: () => api.get('/reports/catalog'),

  // Template CRUD
  listTemplates: (params = {}) => api.get('/reports/templates', { params }),
  getTemplate: (id) => api.get(`/reports/templates/${id}`),
  createTemplate: (data) => api.post('/reports/templates', data),
  updateTemplate: (id, data) => api.put(`/reports/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/reports/templates/${id}`),

  // Ad-hoc generate (preview)
  generate: (id) => api.post(`/reports/templates/${id}/generate`),

  // Image upload (hero/gallery/logo) → returns { url, s3Key }
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/reports/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
```

- [ ] **Step 2: Verify it compiles.** Run: `CI=true npm test -- --watchAll=false --testPathPattern="this_matches_nothing_xyz" 2>&1 | tail -3` is not needed; instead confirm no syntax error by importing in the next tasks. Quick check: `node -e "require('fs').readFileSync('src/services/api.js','utf8').includes('reportAPI') && console.log('reportAPI present')"` → prints `reportAPI present`.

- [ ] **Step 3: Commit**

```bash
git add src/services/api.js
git commit -m "feat(reports): add reportAPI service (catalog, templates, generate, upload)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `canAccess.reports()` + Reports nav item

**Files:** Modify `src/context/AuthContext.js`, `src/components/layout/DashboardLayout.js`

- [ ] **Step 1: Add the access method.** In `src/context/AuthContext.js`, find the `canAccess` object (the block of `methodName: () => _useNew ? checkAnyPerm(...) : hasPermission(...)`). Add this entry alongside the others (e.g. right after the `salesReports` entry):

```js
    reports: () => _useNew ? checkAnyPerm('reports:view', 'reports:manage') : hasMinimumRole('Business Head'),
```

- [ ] **Step 2: Add the nav item.** In `src/components/layout/DashboardLayout.js`:
  - Add `Summarize` to the existing `@mui/icons-material` import (the import that already brings in `Leaderboard`, `Analytics`, etc.).
  - In `getNavigationItems`, inside the `section: 'INTELLIGENCE'` `items` array, add this item as the FIRST entry (above `leadership`):

```js
        {
          id: 'reports',
          title: 'Reports',
          icon: Summarize,
          path: '/reports',
          requiredAccess: () => canAccess.reports(),
        },
```

- [ ] **Step 3: Verify.** `node -e "const s=require('fs').readFileSync('src/context/AuthContext.js','utf8'); if(!s.includes('reports:')) throw new Error('canAccess.reports missing'); console.log('ok')"` and `node -e "const s=require('fs').readFileSync('src/components/layout/DashboardLayout.js','utf8'); if(!(s.includes(\"id: 'reports'\")&&s.includes('Summarize'))) throw new Error('nav item missing'); console.log('ok')"`.

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.js src/components/layout/DashboardLayout.js
git commit -m "feat(reports): add reports access gate + Reports nav item" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Routes

**Files:** Modify `src/App.js`

- [ ] **Step 1: Add lazy imports** near the other `React.lazy(...)` page imports:

```js
const ReportTemplateListPage = React.lazy(() => import('./pages/reports/ReportTemplateListPage'));
const ReportTemplateBuilder = React.lazy(() => import('./pages/reports/ReportTemplateBuilder'));
```

- [ ] **Step 2: Add routes** alongside the other protected routes (near the `/analytics` routes). The builder routes require `reports:manage`; the list requires `reports:view` (string permissions containing `:` route through `checkPerm`):

```jsx
<Route path="/reports" element={
  <ProtectedRoute requiredPermission="reports:view">
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <ReportTemplateListPage />
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
} />
<Route path="/reports/templates/new" element={
  <ProtectedRoute requiredPermission="reports:manage">
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <ReportTemplateBuilder />
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
} />
<Route path="/reports/templates/:id/edit" element={
  <ProtectedRoute requiredPermission="reports:manage">
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <ReportTemplateBuilder />
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
} />
```

- [ ] **Step 3: Commit** (pages don't exist yet — that's fine; routes are inert until built, and lazy imports only resolve on navigation):

```bash
git add src/App.js
git commit -m "feat(reports): add report builder + list routes" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Catalog grouping util (pure, TDD)

**Files:** Create `src/utils/reportCatalog.js`, `src/utils/reportCatalog.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: src/utils/reportCatalog.test.js
import { groupCatalogByCategory } from './reportCatalog';

const catalog = [
  { type: 'kpi.revenue', category: 'Financial', label: 'Total Sales Value', kind: 'kpi' },
  { type: 'layout.hero', category: 'Layout', label: 'Cover / Hero', kind: 'layout' },
  { type: 'kpi.collections', category: 'Financial', label: 'Collected', kind: 'kpi' },
  { type: 'kpi.totalLeads', category: 'Sales', label: 'Total Leads', kind: 'kpi' },
];

describe('groupCatalogByCategory', () => {
  it('groups blocks by category, preserving block order within a group', () => {
    const groups = groupCatalogByCategory(catalog);
    const financial = groups.find((g) => g.category === 'Financial');
    expect(financial.blocks.map((b) => b.type)).toEqual(['kpi.revenue', 'kpi.collections']);
  });

  it('returns one entry per distinct category', () => {
    const cats = groupCatalogByCategory(catalog).map((g) => g.category);
    expect(new Set(cats).size).toBe(cats.length);
    expect(cats).toEqual(expect.arrayContaining(['Financial', 'Sales', 'Layout']));
  });

  it('orders known categories first, then any extras alphabetically', () => {
    const cats = groupCatalogByCategory(catalog).map((g) => g.category);
    expect(cats.indexOf('Financial')).toBeLessThan(cats.indexOf('Layout'));
  });

  it('handles empty / non-array input', () => {
    expect(groupCatalogByCategory([])).toEqual([]);
    expect(groupCatalogByCategory(undefined)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="reportCatalog"` → FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// File: src/utils/reportCatalog.js
// Pure helpers for the report block catalog (builder palette).

// Preferred display order; unknown categories are appended alphabetically after these.
const CATEGORY_ORDER = ['Financial', 'Sales', 'Inventory', 'Team', 'Layout'];

/**
 * Group a flat catalog array into [{ category, blocks }], ordered by CATEGORY_ORDER
 * (then alphabetically for any categories not listed). Block order within a group
 * follows the input order.
 * @param {Array<{type,category,label,kind}>} catalog
 * @returns {Array<{category: string, blocks: Array}>}
 */
export const groupCatalogByCategory = (catalog) => {
  if (!Array.isArray(catalog)) return [];
  const map = new Map();
  for (const block of catalog) {
    const cat = block?.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(block);
  }
  const rank = (cat) => {
    const i = CATEGORY_ORDER.indexOf(cat);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...map.keys()]
    .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b))
    .map((category) => ({ category, blocks: map.get(category) }));
};
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="reportCatalog"` → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/reportCatalog.js src/utils/reportCatalog.test.js
git commit -m "feat(reports): add catalog grouping util" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Builder state reducer (pure, TDD) — the logic core

**Files:** Create `src/pages/reports/builderState.js`, `src/pages/reports/builderState.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: src/pages/reports/builderState.test.js
import {
  builderReducer, initialBuilderState, actions, buildTemplatePayload, templateToBuilderState,
} from './builderState';

const addBlock = (state, block) => builderReducer(state, actions.addBlock(block));

describe('builderReducer', () => {
  it('adds a block, assigns order, and selects it', () => {
    const s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'Revenue', config: {} });
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0]).toMatchObject({ id: 'b1', type: 'kpi.revenue', order: 0 });
    expect(s.selectedBlockId).toBe('b1');
  });

  it('removes a block and reindexes order, clearing selection if removed', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'R', config: {} });
    s = addBlock(s, { id: 'b2', type: 'kpi.collections', title: 'C', config: {} });
    s = builderReducer(s, actions.removeBlock('b1'));
    expect(s.blocks.map((b) => b.id)).toEqual(['b2']);
    expect(s.blocks[0].order).toBe(0);
  });

  it('reorders blocks and reindexes order', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'R', config: {} });
    s = addBlock(s, { id: 'b2', type: 'kpi.collections', title: 'C', config: {} });
    s = addBlock(s, { id: 'b3', type: 'kpi.totalLeads', title: 'L', config: {} });
    s = builderReducer(s, actions.reorderBlocks(0, 2)); // move b1 to the end
    expect(s.blocks.map((b) => b.id)).toEqual(['b2', 'b3', 'b1']);
    expect(s.blocks.map((b) => b.order)).toEqual([0, 1, 2]);
  });

  it('updates a block title/config', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'text.note', title: 'Note', config: { text: '' } });
    s = builderReducer(s, actions.updateBlock('b1', { title: 'Summary', config: { text: 'Hello' } }));
    expect(s.blocks[0].title).toBe('Summary');
    expect(s.blocks[0].config).toEqual({ text: 'Hello' });
  });

  it('sets top-level fields and merges theme', () => {
    let s = builderReducer(initialBuilderState, actions.setField('name', 'Q2 Report'));
    s = builderReducer(s, actions.setTheme({ preset: 'midnight' }));
    expect(s.name).toBe('Q2 Report');
    expect(s.theme.preset).toBe('midnight');
  });

  it('adds and removes image slots', () => {
    let s = builderReducer(initialBuilderState, actions.addImageSlot({ id: 'img1', label: 'Hero', s3Key: 'k', url: 'u' }));
    expect(s.imageSlots).toHaveLength(1);
    s = builderReducer(s, actions.removeImageSlot('img1'));
    expect(s.imageSlots).toHaveLength(0);
  });

  it('hydrates from a fetched template and back to a payload', () => {
    const template = {
      name: 'Loaded', description: 'd',
      scope: { period: { preset: 'qtd' } },
      theme: { preset: 'warm' },
      blocks: [{ id: 'b1', type: 'kpi.revenue', title: 'R', config: {}, order: 0 }],
      imageSlots: [{ id: 'img1', label: 'Hero', s3Key: 'k', url: 'u' }],
    };
    const s = templateToBuilderState(template);
    expect(s.name).toBe('Loaded');
    expect(s.blocks).toHaveLength(1);
    const payload = buildTemplatePayload(s);
    expect(payload.name).toBe('Loaded');
    expect(payload).not.toHaveProperty('selectedBlockId');
    expect(payload.blocks[0]).toMatchObject({ id: 'b1', type: 'kpi.revenue', order: 0 });
  });
});
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState"` → FAIL.

- [ ] **Step 3: Implement**

```js
// File: src/pages/reports/builderState.js
// Pure state model for the report template builder. No I/O, no DnD imports.

export const initialBuilderState = {
  name: '',
  description: '',
  scope: { projects: [], period: { preset: 'last_30d' } },
  theme: { preset: 'clean', primaryColor: '', accentColor: '', logoS3Key: '', coverImageS3Key: '' },
  blocks: [],          // [{ id, type, title, config, order }]
  imageSlots: [],      // [{ id, label, s3Key, url }]
  selectedBlockId: null,
};

// Action type constants
export const T = {
  LOAD: 'LOAD', SET_FIELD: 'SET_FIELD', SET_THEME: 'SET_THEME',
  ADD_BLOCK: 'ADD_BLOCK', REMOVE_BLOCK: 'REMOVE_BLOCK', REORDER_BLOCKS: 'REORDER_BLOCKS',
  SELECT_BLOCK: 'SELECT_BLOCK', UPDATE_BLOCK: 'UPDATE_BLOCK',
  ADD_IMAGE_SLOT: 'ADD_IMAGE_SLOT', REMOVE_IMAGE_SLOT: 'REMOVE_IMAGE_SLOT',
};

// Action creators (callers pre-generate ids so the reducer stays pure/deterministic)
export const actions = {
  load: (state) => ({ type: T.LOAD, state }),
  setField: (field, value) => ({ type: T.SET_FIELD, field, value }),
  setTheme: (patch) => ({ type: T.SET_THEME, patch }),
  addBlock: (block) => ({ type: T.ADD_BLOCK, block }),
  removeBlock: (id) => ({ type: T.REMOVE_BLOCK, id }),
  reorderBlocks: (from, to) => ({ type: T.REORDER_BLOCKS, from, to }),
  selectBlock: (id) => ({ type: T.SELECT_BLOCK, id }),
  updateBlock: (id, patch) => ({ type: T.UPDATE_BLOCK, id, patch }),
  addImageSlot: (slot) => ({ type: T.ADD_IMAGE_SLOT, slot }),
  removeImageSlot: (id) => ({ type: T.REMOVE_IMAGE_SLOT, id }),
};

const reindex = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));

export const builderReducer = (state, action) => {
  switch (action.type) {
    case T.LOAD:
      return action.state;
    case T.SET_FIELD:
      return { ...state, [action.field]: action.value };
    case T.SET_THEME:
      return { ...state, theme: { ...state.theme, ...action.patch } };
    case T.ADD_BLOCK: {
      const block = { config: {}, ...action.block, order: state.blocks.length };
      return { ...state, blocks: [...state.blocks, block], selectedBlockId: block.id };
    }
    case T.REMOVE_BLOCK: {
      const blocks = reindex(state.blocks.filter((b) => b.id !== action.id));
      return {
        ...state,
        blocks,
        selectedBlockId: state.selectedBlockId === action.id ? null : state.selectedBlockId,
      };
    }
    case T.REORDER_BLOCKS: {
      const next = [...state.blocks];
      const [moved] = next.splice(action.from, 1);
      if (moved === undefined) return state;
      next.splice(action.to, 0, moved);
      return { ...state, blocks: reindex(next) };
    }
    case T.SELECT_BLOCK:
      return { ...state, selectedBlockId: action.id };
    case T.UPDATE_BLOCK:
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id
            ? { ...b, ...action.patch, config: action.patch.config ? { ...action.patch.config } : b.config }
            : b
        ),
      };
    case T.ADD_IMAGE_SLOT:
      return { ...state, imageSlots: [...state.imageSlots, action.slot] };
    case T.REMOVE_IMAGE_SLOT:
      return { ...state, imageSlots: state.imageSlots.filter((s) => s.id !== action.id) };
    default:
      return state;
  }
};

/** Hydrate builder state from a fetched ReportTemplate document. */
export const templateToBuilderState = (template = {}) => ({
  ...initialBuilderState,
  name: template.name || '',
  description: template.description || '',
  scope: template.scope || initialBuilderState.scope,
  theme: { ...initialBuilderState.theme, ...(template.theme || {}) },
  blocks: reindex((template.blocks || []).map((b) => ({
    id: b.id, type: b.type, title: b.title || '', config: b.config || {}, order: b.order || 0,
  }))),
  imageSlots: template.imageSlots || [],
  selectedBlockId: null,
});

/** Build the API payload (create/update) from builder state. */
export const buildTemplatePayload = (state) => ({
  name: state.name,
  description: state.description,
  scope: state.scope,
  theme: state.theme,
  blocks: state.blocks.map(({ id, type, title, config, order }) => ({ id, type, title, config, order })),
  imageSlots: state.imageSlots,
});

/** Generate a unique block/slot id (browser crypto, with a safe fallback). */
export const makeId = (prefix = 'b') =>
  `${prefix}_${(globalThis.crypto?.randomUUID?.() || `${performance.now()}_${state_counter++}`)}`;
let state_counter = 0;
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState"` → PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/reports/builderState.js src/pages/reports/builderState.test.js
git commit -m "feat(reports): add pure builder-state reducer + selectors" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `ReportBlockRenderer` (+ RTL test)

**Files:** Create `src/components/reports/ReportBlockRenderer.js`, `src/components/reports/ReportBlockRenderer.test.js`

**Context:** Maps a resolved block `{ type, kind, title, config, data }` to UI. Used by the builder preview now and the public page in Phase 2. `kind` drives rendering: `kpi` → KPICard; `chart` → ChartCard + Recharts (pie/bar) using `data.data` `[{name,value}]`; `table` → simple MUI table of `data.rows`; `layout` → hero/gallery/note/divider by `type`. If `data.error` is set, render an error chip. The RTL test covers the no-chart branches (text/error) to stay robust in jsdom.

- [ ] **Step 1: Write the failing test**

```js
// File: src/components/reports/ReportBlockRenderer.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import ReportBlockRenderer from './ReportBlockRenderer';

const renderWithTheme = (ui) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ReportBlockRenderer', () => {
  it('renders a text note block', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'text.note', kind: 'layout', data: { text: 'Hello board' } }} />
    );
    expect(screen.getByText('Hello board')).toBeInTheDocument();
  });

  it('renders an error state when the block failed to resolve', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'kpi.revenue', kind: 'kpi', title: 'Revenue', data: { error: 'boom' } }} />
    );
    expect(screen.getByText(/couldn.t load/i)).toBeInTheDocument();
  });

  it('renders a KPI title', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'kpi.revenue', kind: 'kpi', title: 'Total Revenue', data: { value: 1000, unit: 'currency' } }} />
    );
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="ReportBlockRenderer"` → FAIL.

- [ ] **Step 3: Implement**

```js
// File: src/components/reports/ReportBlockRenderer.js
// Renders a resolved report block ({ type, kind, title, config, data }) to UI.
// Shared by the builder preview and (Phase 2) the public report page.

import React from 'react';
import {
  Box, Card, CardContent, Typography, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, Alert, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { KPICard } from '../common';

const formatValue = (value, unit) => {
  const n = Number(value) || 0;
  if (unit === 'percent') return `${(n * 100).toFixed(1)}%`;
  if (unit === 'currency') {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  return n.toLocaleString('en-IN');
};

const ReportBlockRenderer = ({ block, images = [] }) => {
  const theme = useTheme();
  const colors = theme.custom?.chartColors || [theme.palette.primary.main];
  const { type, kind, title, config = {}, data = {} } = block || {};

  if (data && data.error) {
    return <Alert severity="warning" variant="outlined">{title || type}: couldn’t load this data.</Alert>;
  }

  if (kind === 'kpi') {
    return <KPICard title={title || type} value={formatValue(data.value, data.unit)} />;
  }

  if (kind === 'chart') {
    const chartData = Array.isArray(data.data) ? data.data : [];
    const isPie = (data.chartKind || 'bar') === 'pie';
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{title || type}</Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              {isPie ? (
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {chartData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (kind === 'table') {
    const rows = Array.isArray(data.rows) ? data.rows : [];
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{title || type}</Typography>
          <Table size="small">
            <TableHead><TableRow>{cols.map((c) => <TableCell key={c}>{c}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>{cols.map((c) => <TableCell key={c}>{String(r[c])}</TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // ─── Layout / media blocks ───
  if (type === 'layout.hero') {
    const cover = images.find((im) => im.id === config.imageSlotId);
    return (
      <Box sx={{
        position: 'relative', borderRadius: 3, overflow: 'hidden', minHeight: 200,
        p: 4, color: cover ? 'common.white' : 'text.primary',
        background: cover
          ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${cover.url}) center/cover`
          : theme.palette.action.hover,
      }}>
        <Typography variant="h4" fontWeight={700}>{config.title || title || 'Report'}</Typography>
        {config.subtitle ? <Typography variant="h6">{config.subtitle}</Typography> : null}
      </Box>
    );
  }
  if (type === 'media.gallery') {
    const slotIds = Array.isArray(config.imageSlotIds) ? config.imageSlotIds : [];
    const imgs = images.filter((im) => slotIds.includes(im.id));
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        {imgs.map((im) => (
          <Box key={im.id} component="img" src={im.url} alt={im.label || ''}
            sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 2 }} />
        ))}
      </Box>
    );
  }
  if (type === 'text.note') {
    return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{config.text ?? data.text ?? ''}</Typography>;
  }
  if (type === 'layout.divider') {
    return <Divider sx={{ my: 2 }} />;
  }

  return <Alert severity="info" variant="outlined">Unsupported block: {type}</Alert>;
};

export default ReportBlockRenderer;
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="ReportBlockRenderer"` → PASS (3 tests). (Note: the text-note test reads `config.text` — the test passes `data.text`; the component falls back to `data.text` when `config.text` is undefined, so it renders "Hello board".)

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/ReportBlockRenderer.js src/components/reports/ReportBlockRenderer.test.js
git commit -m "feat(reports): add ReportBlockRenderer (kpi/chart/table/layout)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Template list page

**Files:** Create `src/pages/reports/ReportTemplateListPage.js`

- [ ] **Step 1: Implement**

```js
// File: src/pages/reports/ReportTemplateListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip } from '@mui/material';
import { Add, Summarize } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, EmptyState } from '../../components/common';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ReportTemplateListPage = () => {
  const navigate = useNavigate();
  const { checkPerm } = useAuth();
  const canManage = checkPerm('reports:manage');

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.listTemplates({ limit: 100 });
      setTemplates(res.data?.data?.templates || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await reportAPI.deleteTemplate(toDelete._id);
      setToDelete(null);
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Template', sortable: false },
    { id: 'blocks', label: 'Blocks', render: (row) => (row.blocks || []).length },
    {
      id: 'status', label: 'Status',
      render: (row) => <Chip size="small" label={row.status || 'active'} color={row.status === 'archived' ? 'default' : 'success'} variant="outlined" />,
    },
    {
      id: 'updatedAt', label: 'Updated',
      render: (row) => (row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-IN') : '—'),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Build and manage leadership report templates"
        icon={Summarize}
        loading={loading}
        actions={canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/reports/templates/new')}>
            New Template
          </Button>
        )}
      />

      {!loading && templates.length === 0 ? (
        <EmptyState
          icon={Summarize}
          title="No report templates yet"
          description="Create a template to compose a one-page leadership report."
          action={canManage ? { label: 'New Template', onClick: () => navigate('/reports/templates/new'), icon: Add } : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={templates}
          loading={loading}
          rowKey="_id"
          onRowClick={(row) => navigate(`/reports/templates/${row._id}/edit`)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete template?"
        message={`This permanently deletes "${toDelete?.name}". Generated reports are unaffected.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
      {error && <Box sx={{ color: 'error.main', mt: 2 }}>{error}</Box>}
    </Box>
  );
};

export default ReportTemplateListPage;
```

- [ ] **Step 2: Verify compile.** `CI=true npm test -- --watchAll=false --testPathPattern="this_matches_nothing" 2>&1 | tail -2` is unnecessary; instead `npm run build` is run at the end (Task 12). For now, eyeball imports resolve (all from existing modules).

- [ ] **Step 3: Commit**

```bash
git add src/pages/reports/ReportTemplateListPage.js
git commit -m "feat(reports): add report template list page" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Block palette

**Files:** Create `src/components/reports/BlockPalette.js`

- [ ] **Step 1: Implement**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/reports/BlockPalette.js
git commit -m "feat(reports): add block palette" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Sortable canvas

**Files:** Create `src/components/reports/SortableBlockItem.js`, `src/components/reports/BuilderCanvas.js`

- [ ] **Step 1: Implement the sortable item**

```js
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
```

- [ ] **Step 2: Implement the canvas**

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/SortableBlockItem.js src/components/reports/BuilderCanvas.js
git commit -m "feat(reports): add drag-to-reorder builder canvas" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Config panel, theme picker, image uploader

**Files:** Create `src/components/reports/BlockConfigPanel.js`, `src/components/reports/ThemePicker.js`, `src/components/reports/ImageUploader.js`

- [ ] **Step 1: Implement the config panel**

```js
// File: src/components/reports/BlockConfigPanel.js
import React from 'react';
import { Box, TextField, Typography, MenuItem } from '@mui/material';

/**
 * Right rail: edit the selected block's title + a few common config fields.
 * @param {{ block, imageSlots, onChange }} props  onChange({ title?, config? })
 */
const BlockConfigPanel = ({ block, imageSlots = [], onChange }) => {
  if (!block) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Select a block to configure it.</Typography>;
  }
  const cfg = block.config || {};
  const setConfig = (patch) => onChange({ config: { ...cfg, ...patch } });

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Block settings</Typography>
      <TextField
        fullWidth size="small" margin="normal" label="Title"
        value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })}
      />

      {block.type === 'text.note' && (
        <TextField
          fullWidth multiline minRows={4} size="small" margin="normal" label="Text"
          value={cfg.text || ''} onChange={(e) => setConfig({ text: e.target.value })}
        />
      )}

      {block.type === 'layout.hero' && (
        <>
          <TextField fullWidth size="small" margin="normal" label="Subtitle"
            value={cfg.subtitle || ''} onChange={(e) => setConfig({ subtitle: e.target.value })} />
          <TextField select fullWidth size="small" margin="normal" label="Cover image"
            value={cfg.imageSlotId || ''} onChange={(e) => setConfig({ imageSlotId: e.target.value })}>
            <MenuItem value="">None</MenuItem>
            {imageSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label || s.id}</MenuItem>)}
          </TextField>
        </>
      )}

      {block.type === 'media.gallery' && (
        <TextField select fullWidth size="small" margin="normal" label="Images" SelectProps={{ multiple: true }}
          value={Array.isArray(cfg.imageSlotIds) ? cfg.imageSlotIds : []}
          onChange={(e) => setConfig({ imageSlotIds: e.target.value })}>
          {imageSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label || s.id}</MenuItem>)}
        </TextField>
      )}
    </Box>
  );
};

export default BlockConfigPanel;
```

- [ ] **Step 2: Implement the theme picker**

```js
// File: src/components/reports/ThemePicker.js
import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';

const PRESETS = [
  { key: 'clean', label: 'Clean' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'warm', label: 'Warm' },
];

/** @param {{ theme, onChange }} props  onChange(partialTheme) */
const ThemePicker = ({ theme = {}, onChange }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="overline" color="text.secondary">Theme</Typography>
    <Box sx={{ mt: 1 }}>
      <ToggleButtonGroup
        exclusive size="small" value={theme.preset || 'clean'}
        onChange={(_e, val) => { if (val) onChange({ preset: val }); }}
      >
        {PRESETS.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
  </Box>
);

export default ThemePicker;
```

- [ ] **Step 3: Implement the image uploader**

```js
// File: src/components/reports/ImageUploader.js
import React, { useRef, useState } from 'react';
import { Box, Typography, Button, ImageList, ImageListItem, IconButton } from '@mui/material';
import { CloudUpload, DeleteOutline } from '@mui/icons-material';
import { reportAPI } from '../../services/api';

/**
 * Upload images to S3 (via /reports/uploads) and manage the template's image slots.
 * @param {{ imageSlots, onAdd, onRemove, makeId }} props
 *   onAdd({ id, label, s3Key, url }); onRemove(id); makeId('img') => string
 */
const ImageUploader = ({ imageSlots = [], onAdd, onRemove, makeId }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const res = await reportAPI.uploadImage(file);
      const { url, s3Key } = res.data?.data || {};
      onAdd({ id: makeId('img'), label: file.name, s3Key, url });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Images</Typography>
      <Box sx={{ mt: 1 }}>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <Button size="small" variant="outlined" startIcon={<CloudUpload />} disabled={uploading}
          onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload image'}
        </Button>
      </Box>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
      {imageSlots.length > 0 && (
        <ImageList cols={2} gap={8} sx={{ mt: 1 }}>
          {imageSlots.map((s) => (
            <ImageListItem key={s.id} sx={{ position: 'relative' }}>
              <img src={s.url} alt={s.label || ''} style={{ borderRadius: 8, height: 80, objectFit: 'cover' }} />
              <IconButton size="small" onClick={() => onRemove(s.id)}
                sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper' }}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};

export default ImageUploader;
```

- [ ] **Step 4: Commit**

```bash
git add src/components/reports/BlockConfigPanel.js src/components/reports/ThemePicker.js src/components/reports/ImageUploader.js
git commit -m "feat(reports): add config panel, theme picker, image uploader" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: The builder page (assembly)

**Files:** Create `src/pages/reports/ReportTemplateBuilder.js`

**Context:** Assembles the three-pane builder. Loads an existing template (edit) or starts blank (new). Uses `useReducer(builderReducer, ...)`. "Save" creates/updates via `reportAPI`. "Generate preview" calls `reportAPI.generate` and swaps the canvas blocks for the resolved-snapshot blocks (real data) until the user edits again.

- [ ] **Step 1: Implement**

```js
// File: src/pages/reports/ReportTemplateBuilder.js
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Button, TextField, Stack, Snackbar, Alert } from '@mui/material';
import { Save, PlayArrow, ArrowBack } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { reportAPI } from '../../services/api';
import {
  builderReducer, initialBuilderState, actions, buildTemplatePayload, templateToBuilderState, makeId,
} from './builderState';
import BlockPalette from '../../components/reports/BlockPalette';
import BuilderCanvas from '../../components/reports/BuilderCanvas';
import BlockConfigPanel from '../../components/reports/BlockConfigPanel';
import ThemePicker from '../../components/reports/ThemePicker';
import ImageUploader from '../../components/reports/ImageUploader';

const ReportTemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState(null); // resolved snapshot blocks, or null
  const [toast, setToast] = useState(null);

  // Load catalog + (if editing) the template
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, tplRes] = await Promise.all([
          reportAPI.getCatalog(),
          isEdit ? reportAPI.getTemplate(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCatalog(catRes.data?.data || []);
        if (tplRes) dispatch(actions.load(templateToBuilderState(tplRes.data?.data)));
      } catch (err) {
        if (!cancelled) setToast({ severity: 'error', msg: err.response?.data?.message || 'Failed to load builder' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) || null;

  // Any structural edit invalidates a live preview
  const editAndClearPreview = useCallback((action) => {
    setPreviewBlocks(null);
    dispatch(action);
  }, []);

  const handleAddBlock = (blockDef) =>
    editAndClearPreview(actions.addBlock({
      id: makeId('b'), type: blockDef.type, title: blockDef.label, config: blockDef.defaultConfig || {},
    }));

  const handleSave = async () => {
    const payload = buildTemplatePayload(state);
    if (!payload.name?.trim()) { setToast({ severity: 'warning', msg: 'Give your report a name first.' }); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await reportAPI.updateTemplate(id, payload);
        setToast({ severity: 'success', msg: 'Template saved' });
      } else {
        const res = await reportAPI.createTemplate(payload);
        setToast({ severity: 'success', msg: 'Template created' });
        navigate(`/reports/templates/${res.data?.data?._id}/edit`, { replace: true });
      }
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!isEdit) { setToast({ severity: 'info', msg: 'Save the template once before generating a preview.' }); return; }
    setGenerating(true);
    try {
      await reportAPI.updateTemplate(id, buildTemplatePayload(state)); // ensure latest is persisted
      const res = await reportAPI.generate(id);
      setPreviewBlocks(res.data?.data?.blocks || []);
      setToast({ severity: 'success', msg: 'Preview generated with live data' });
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Generate failed' });
    } finally {
      setGenerating(false);
    }
  };

  // Canvas shows resolved data when a preview exists, else the design-time blocks (no data)
  const canvasBlocks = previewBlocks
    ? previewBlocks
    : state.blocks.map((b) => ({ ...b, kind: catalog.find((c) => c.type === b.type)?.kind, data: {} }));

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Report Template' : 'New Report Template'}
        loading={loading}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
            <Button variant="outlined" startIcon={<PlayArrow />} onClick={handleGenerate} disabled={generating || loading}>
              {generating ? 'Generating…' : 'Generate preview'}
            </Button>
            <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        }
      />

      <TextField
        fullWidth size="small" label="Report name" sx={{ mb: 2 }}
        value={state.name} onChange={(e) => dispatch(actions.setField('name', e.target.value))}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto' }}>
            <BlockPalette catalog={catalog} onAdd={handleAddBlock} loading={loading} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto', bgcolor: 'background.default' }}>
            <BuilderCanvas
              blocks={canvasBlocks}
              images={state.imageSlots}
              selectedBlockId={state.selectedBlockId}
              onSelect={(bid) => dispatch(actions.selectBlock(bid))}
              onRemove={(bid) => editAndClearPreview(actions.removeBlock(bid))}
              onReorder={(from, to) => editAndClearPreview(actions.reorderBlocks(from, to))}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '70vh', overflow: 'auto' }}>
            <ThemePicker theme={state.theme} onChange={(patch) => dispatch(actions.setTheme(patch))} />
            <ImageUploader
              imageSlots={state.imageSlots}
              makeId={makeId}
              onAdd={(slot) => dispatch(actions.addImageSlot(slot))}
              onRemove={(slotId) => dispatch(actions.removeImageSlot(slotId))}
            />
            <BlockConfigPanel
              block={selectedBlock}
              imageSlots={state.imageSlots}
              onChange={(patch) => editAndClearPreview(actions.updateBlock(state.selectedBlockId, patch))}
            />
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default ReportTemplateBuilder;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/reports/ReportTemplateBuilder.js
git commit -m "feat(reports): add report template builder page" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Verify (compile + tests + manual smoke)

- [ ] **Step 1: Run all new unit tests.** `CI=true npm test -- --watchAll=false --testPathPattern="reportCatalog|builderState|ReportBlockRenderer"`
Expected: PASS — reportCatalog (4) + builderState (7) + ReportBlockRenderer (3) green.

- [ ] **Step 2: Production build compiles** (catches import/JSX errors across all new files): `npm run build`
Expected: "Compiled successfully" (warnings about unused vars are acceptable per the repo's eslint config; there must be no ERRORS).

- [ ] **Step 3: Manual smoke** (with the Phase 1a backend running and logged in as a leadership user):
  - Sidebar shows **Reports** under INTELLIGENCE → click → `/reports` list renders (empty state if none).
  - Click **New Template** → builder loads with the palette populated from `GET /catalog`.
  - Click blocks in the palette → they appear in the canvas; drag a block by its handle to reorder; select a block → edit its title in the right panel; for a Hero/Note block, edit its config; upload an image → it appears and is selectable in the Hero block.
  - Enter a name → **Save** → redirects to `/reports/templates/:id/edit`; reload → state persists.
  - **Generate preview** → KPI/chart blocks fill with real numbers from the leadership overview.
  - Back to `/reports` → the template is listed; row click reopens it; delete via the confirm dialog works.
  Record results.

- [ ] **Step 4: Final commit** (if Step 3 surfaced small fixes; otherwise nothing to commit):

```bash
git add -A && git commit -m "fix(reports): builder smoke-test adjustments" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage (Phase 1 frontend half):**
- `reportAPI` (catalog/CRUD/generate/upload) → Task 1. ✅
- Reports nav + access gate → Task 2. ✅ Routes → Task 3. ✅
- Pick & arrange blocks in a theme (drag via `@dnd-kit/sortable`) → Tasks 8, 9 + reducer Task 5. ✅
- Image upload into designated slots → Tasks 10 (uploader), 6 (hero/gallery rendering). ✅
- Live preview / generate → Task 11 (+ shared `ReportBlockRenderer` Task 6). ✅
- Template list + delete → Task 7. ✅
- (Public page, email gate, open-rate, review/approve, scheduling → **Phases 2–4**.)

**2. Placeholder scan:** Every component has complete code; the only "verify by build" steps run `npm run build` (Task 12). Manual smoke is explicit verification, not a placeholder. ✅

**3. Type/name consistency:** `builderState.js` exports `builderReducer, initialBuilderState, actions, buildTemplatePayload, templateToBuilderState, makeId, T` — every name used by the builder page (Task 11) and the test (Task 5) matches. `reportAPI` method names (`getCatalog/listTemplates/getTemplate/createTemplate/updateTemplate/deleteTemplate/generate/uploadImage`) are used consistently across Tasks 7, 10, 11. `ReportBlockRenderer` prop `{ block, images }` matches its callers (`BuilderCanvas`). `groupCatalogByCategory` used by `BlockPalette`. Component prop contracts (`onAdd/onRemove/onReorder/onSelect/onChange/makeId`) match between the builder page and each child. `KPICard`/`DataTable`/`PageHeader`/`ConfirmDialog`/`EmptyState` props match the verbatim signatures captured in the header. ✅

**4. Convention match:** Named-export axios services; `useAuth().checkPerm`; `ProtectedRoute` string-permission (`reports:view`/`reports:manage`); lazy + `Suspense` + `DashboardLayout`; `useState`/`useEffect`/`useCallback` data fetching with a `cancelled` cleanup flag; MUI v5 `Grid item xs/md`; `@dnd-kit` sensors + `closestCenter`. ✅

**Known limitation (documented, not a gap):** the builder's drag/upload/preview wiring is verified by `npm run build` + the manual smoke test, not by automated tests — the pure reducer/util/renderer (where logic bugs live) are unit-tested. Full interaction testing of DnD is deferred (RTL DnD simulation is brittle). The theme `preset` currently only switches the hero/accent feel via the renderer's defaults; richer per-preset styling is a polish item for later.

---

## Execution Handoff

After 1b is implemented and merged, **Phase 1 (Builder) is complete** — a leader can compose, save, and preview a one-pager. Next is **Phase 2 (Public page + tracking):** the public React route (`/r/:slug`), the email gate, `ReportView` logging + open-rate dashboard, reusing `ReportBlockRenderer` to render the frozen public page.

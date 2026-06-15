# Report Agent — Phase 4b: Canvas correctness + design control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the agent canvas actually render data blocks (attach `kind`), make the client own the working definition so manual controls and chat stay in sync, and add the first curated **design control** (theme preset + accent color) with a live re-preview. Plus the two 4a polish items.

**Architecture:** `buildSnapshotBlocks` attaches each block's `kind` (from the registry) so preview/agent blocks render correctly (the renderer needs `kind` for kpi/chart/table). The client (`useReportAgent`) becomes the source of truth for the working `definition` between turns: it sends its current `definition` with each agent message and re-resolves the canvas via `reportAPI.preview` after a manual control edit. The renderer honors a per-report `accentColor` override.

**Scope boundary (4b vs 4c):** 4b = `kind` fix, client-owns-definition, theme+accent control, chat-dock extraction, name fix. **Deferred to 4c:** logo/cover upload, per-block one-tap controls (reorder/hide/retitle/flag), scope/period pickers, the Schedule & send dialog, edit-existing-via-agent, and retiring the drag-drop builder.

**Tech Stack:** Backend Node ESM + Jest (`--config jest.unit.config.mjs`); Frontend React/MUI + CRA Jest. Branch `feature/report-agent` in both repos.

**Repos:** `propvantage-ai-backend` (Tasks 1–2) + `propvantage-ai-frontend` (Tasks 3–6).

**Confirmed shapes:** `ReportBlockRenderer({ block, images, themePreset })` branches on `kind === 'kpi'|'chart'|'table'` and `type` for layout/narrative — so data blocks REQUIRE `kind`. `buildSnapshotBlocks` currently returns `{ ...block, data }` (no `kind`). `getReportTheme(preset)` → tokens incl. `.accent`. `getBlock(type).kind` exists. `useReportAgent` returns `{ sessionId, messages, definition, previewBlocks, isLoading, error, sendMessage, setDefinition }` and calls `reportAgentAPI.message({ sessionId, message })`.

---

## File Structure
- **Modify** (backend) `services/reports/snapshotService.js` — `buildSnapshotBlocks` attaches `kind`.
- **Modify** (backend) `tests/unit/resolveReportData.test.js` + `tests/unit/snapshotService.test.js` — account for `kind`.
- **Modify** (backend) `controllers/reportAgentController.js` — accept an optional client `definition`.
- **Modify** (frontend) `src/services/api.js` — `reportAPI.preview` already added (4a); no change unless needed.
- **Modify** (frontend) `src/pages/reports/useReportAgent.js` (+ test) — send `definition`, add `repreview`.
- **Create** (frontend) `src/components/reports/ReportChatDock.js` — extracted dock.
- **Create** (frontend) `src/components/reports/ReportDesignControls.js` — theme + accent.
- **Modify** (frontend) `src/components/reports/ReportBlockRenderer.js` (+ test) — `accentColor` override.
- **Modify** (frontend) `src/pages/reports/ReportAgentPage.js` — use the dock + design controls + name fix.

---

## Task 1: Attach `kind` to resolved blocks (backend)

**Files:** Modify `services/reports/snapshotService.js`; update `tests/unit/resolveReportData.test.js`, `tests/unit/snapshotService.test.js`.

- [ ] **Step 1: Update the failing tests.** In `tests/unit/snapshotService.test.js`, the `buildSnapshotBlocks` "attaches resolved data" test asserts the resolved block; update it to also expect `kind`:

```js
    const out = await buildSnapshotBlocks([{ id: 'b1', type: 'kpi.revenue', config: {} }], overview);
    expect(out[0]).toMatchObject({ id: 'b1', type: 'kpi.revenue', kind: 'kpi', data: { value: 100, unit: 'currency' } });
```

In `tests/unit/resolveReportData.test.js`, the block `toEqual` becomes `toMatchObject` (or add `kind: 'kpi'`):

```js
    expect(out.blocks[0]).toMatchObject({ id: 'r', type: 'kpi.revenue', config: {}, kind: 'kpi', data: { value: 100, unit: 'currency' } });
```

- [ ] **Step 2: Run; verify FAIL** — `node --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.unit.config.mjs tests/unit/snapshotService.test.js` (the `kind` is missing).

- [ ] **Step 3: Implement.** In `services/reports/snapshotService.js` `buildSnapshotBlocks`, change the success return from `return { ...block, data };` to:

```js
      return { ...block, kind: def.kind, data };
```

(Unknown-type/error branches unchanged — they have no resolved `kind`.)

- [ ] **Step 4: Run; verify PASS** + full suite `npm run test:unit` (the public page already re-derives `kind` via `withKind`, so this is additive and harmless for instances).

- [ ] **Step 5: Commit** — `git add services/reports/snapshotService.js tests/unit/snapshotService.test.js tests/unit/resolveReportData.test.js && git commit -m "fix(reports): attach block kind in buildSnapshotBlocks (canvas renders data blocks)"`

---

## Task 2: Accept a client definition on the agent message (backend)

**Files:** Modify `controllers/reportAgentController.js`. (Thin glue — no new unit test; covered by e2e.)

- [ ] **Step 1: Implement.** In `postAgentMessage`, the working definition should prefer a client-supplied one (so manual control edits the client made are honored), falling back to the session's. After loading/creating `session`, replace the `runAgentTurn` call's `definition: session.definition` with a resolved working definition:

```js
  const workingDefinition = (req.body?.definition && typeof req.body.definition === 'object')
    ? req.body.definition
    : session.definition;

  const ctx = ctxFromReq(req);
  const { definition, reply, transcript } = await runAgentTurn(
    { definition: workingDefinition, transcript: session.transcript, userMessage: String(message) },
    ctx,
    { client, tools, model: MODEL },
  );
```

(Everything else — persisting `session.definition = definition`, the preview, the response — stays.)

- [ ] **Step 2: Verify boot + suite** — `node --check controllers/reportAgentController.js` then `npm run test:unit` (green).

- [ ] **Step 3: Commit** — `git add controllers/reportAgentController.js && git commit -m "feat(reports): agent honors the client's working definition (manual + chat stay in sync)"`

---

## Task 3: `useReportAgent` — send definition + `repreview` (frontend)

**Files:** Modify `src/pages/reports/useReportAgent.js` + `useReportAgent.test.js`.

- [ ] **Step 1: Update tests.** In `useReportAgent.test.js`:
- Change the "sends a message" assertion to expect the definition is included:
  ```js
  expect(reportAgentAPI.message).toHaveBeenCalledWith(expect.objectContaining({ sessionId: null, message: 'show revenue' }));
  ```
- Add a test for `repreview` (mock `reportAPI.preview`):
  ```js
  it('repreview re-resolves the canvas from the current definition', async () => {
    reportAPI.preview.mockResolvedValue({ data: { data: { blocks: [{ id: 'b', type: 'kpi.revenue', kind: 'kpi', data: { value: 5, unit: 'currency' } }] } } });
    const { result } = renderHook(() => useReportAgent());
    act(() => { result.current.setDefinition({ name: 'R', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [{ id: 'b', type: 'kpi.revenue' }] }); });
    await act(async () => { await result.current.repreview(); });
    expect(reportAPI.preview).toHaveBeenCalled();
    expect(result.current.previewBlocks[0].data).toEqual({ value: 5, unit: 'currency' });
  });
  ```
  (Update the `jest.mock('../../services/api', …)` to also mock `reportAPI: { preview: jest.fn() }`.)

- [ ] **Step 2: Run; verify FAIL.**

- [ ] **Step 3: Implement.** In `useReportAgent.js`:
- Import `reportAPI` too: `import { reportAgentAPI, reportAPI } from '../../services/api';`
- In `sendMessage`, include the current definition: `reportAgentAPI.message({ sessionId, message: trimmed, definition })`.
- Add a `repreview` callback that re-resolves the canvas from the current `definition` (used after manual control edits):
  ```js
  const repreview = useCallback(async () => {
    try {
      const res = await reportAPI.preview(definition);
      const blocks = res.data?.data?.blocks;
      if (Array.isArray(blocks)) setPreviewBlocks(blocks);
    } catch (_err) { /* leave the canvas as-is on a transient preview error */ }
  }, [definition]);
  ```
- Return `repreview` in the hook's object. (`definition` must be in `sendMessage`'s dep array now.)

- [ ] **Step 4: Run; verify PASS** (incl. the existing 4a tests, adjusted).
- [ ] **Step 5: Commit** — `git add src/pages/reports/useReportAgent.js src/pages/reports/useReportAgent.test.js && git commit -m "feat(reports): hook sends working definition + repreview() for manual edits"`

---

## Task 4: Renderer honors `accentColor` (frontend)

**Files:** Modify `src/components/reports/ReportBlockRenderer.js` + `ReportBlockRenderer.test.js`.

- [ ] **Step 1: Add a test.** In `ReportBlockRenderer.test.js`, add:

```js
  it('applies an accentColor override to the AI narrative accent', () => {
    const { container } = renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', title: 'S', data: { text: 'Hi' } }} themePreset="clean" accentColor="#e91e63" />
    );
    // the narrative left-accent bar uses the override
    expect(container.innerHTML).toMatch(/#e91e63/i);
  });
```

- [ ] **Step 2: Run; verify FAIL.**

- [ ] **Step 3: Implement.** In `ReportBlockRenderer.js`, accept `accentColor` and override the theme accent:

```js
const ReportBlockRenderer = ({ block, images = [], themePreset, accentColor }) => {
  const base = getReportTheme(themePreset);
  const t = accentColor ? { ...base, accent: accentColor, accentSoft: `${accentColor}14` } : base;
```

(`#RRGGBB14` is ~8% alpha. The rest of the component already reads `t.accent` / `t.accentSoft`, so no other change is needed.)

- [ ] **Step 4: Run; verify PASS.**
- [ ] **Step 5: Commit** — `git add src/components/reports/ReportBlockRenderer.js src/components/reports/ReportBlockRenderer.test.js && git commit -m "feat(reports): ReportBlockRenderer honors a per-report accentColor"`

---

## Task 5: Extract `ReportChatDock` + create `ReportDesignControls` (frontend)

**Files:** Create `src/components/reports/ReportChatDock.js`, `src/components/reports/ReportDesignControls.js`.

- [ ] **Step 1: `ReportChatDock`.** Move the chat-dock JSX out of `ReportAgentPage` into a focused component:

```js
// File: src/components/reports/ReportChatDock.js
import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, CircularProgress, Stack, Chip } from '@mui/material';
import { AutoAwesome, Send } from '@mui/icons-material';

const STARTERS = [
  'Quarterly review for the whole portfolio — sales, collections, lead funnel.',
  'Monthly collections report for one project.',
  'Compare my projects on sales and collection rate.',
];

const ReportChatDock = ({ messages = [], isLoading = false, onSend }) => {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  const submit = (text) => { const t = (text != null ? text : input); if (t.trim()) { onSend(t); setInput(''); } };

  return (
    <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 2, p: 1.5 }}>
      {messages.length > 0 && (
        <Box sx={{ maxHeight: 180, overflow: 'auto', mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: m.role === 'user' ? 'grey.200' : 'primary.main', color: m.role === 'user' ? 'text.primary' : '#fff', fontSize: 13, fontWeight: 700 }}>
                {m.role === 'user' ? 'You' : <AutoAwesome sx={{ fontSize: 15 }} />}
              </Box>
              <Typography variant="body2" sx={{ bgcolor: m.role === 'user' ? 'grey.100' : 'action.hover', px: 1.5, py: 1, borderRadius: 2, maxWidth: '80%' }}>
                {m.content}
              </Typography>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
              <CircularProgress size={14} /> <Typography variant="caption">Working…</Typography>
            </Box>
          )}
          <div ref={endRef} />
        </Box>
      )}
      {messages.length === 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
          {STARTERS.map((s) => (
            <Chip key={s} label={s} variant="outlined" size="small" onClick={() => submit(s)} sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }} />
          ))}
        </Stack>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField fullWidth multiline maxRows={4} size="small" placeholder="Ask the assistant to build or change the report…"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} disabled={isLoading} />
        <IconButton color="primary" onClick={() => submit()} disabled={isLoading || !input.trim()}><Send /></IconButton>
      </Box>
    </Paper>
  );
};

export default ReportChatDock;
```

- [ ] **Step 2: `ReportDesignControls`.** A small popover/inline control for theme preset + accent:

```js
// File: src/components/reports/ReportDesignControls.js
import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, TextField } from '@mui/material';
import { REPORT_THEME_PRESETS, REPORT_THEME_LABELS } from '../../utils/reportThemes';

/** @param {{ theme, onChange }} props  theme={preset, accentColor?}; onChange(partialTheme) */
const ReportDesignControls = ({ theme = {}, onChange }) => (
  <Box sx={{ p: 2, minWidth: 240 }}>
    <Typography variant="overline" color="text.secondary">Theme</Typography>
    <Box sx={{ mt: 0.5, mb: 2 }}>
      <ToggleButtonGroup exclusive size="small" value={theme.preset || 'clean'}
        onChange={(_e, val) => { if (val) onChange({ preset: val }); }}>
        {REPORT_THEME_PRESETS.map((p) => <ToggleButton key={p} value={p}>{REPORT_THEME_LABELS[p]}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
    <Typography variant="overline" color="text.secondary">Accent colour</Typography>
    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
      <input type="color" value={theme.accentColor || '#1e88e5'} onChange={(e) => onChange({ accentColor: e.target.value })}
        style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Accent colour" />
      <TextField size="small" value={theme.accentColor || ''} placeholder="#1e88e5"
        onChange={(e) => onChange({ accentColor: e.target.value })} sx={{ width: 120 }} />
    </Box>
  </Box>
);

export default ReportDesignControls;
```

- [ ] **Step 3: Commit** — `git add src/components/reports/ReportChatDock.js src/components/reports/ReportDesignControls.js && git commit -m "feat(reports): extract ReportChatDock + add ReportDesignControls (theme + accent)"`

---

## Task 6: Wire the page (use dock + design controls + name fix)

**Files:** Modify `src/pages/reports/ReportAgentPage.js`.

- [ ] **Step 1: Implement.** Update `ReportAgentPage.js`:
- Import `ReportChatDock`, `ReportDesignControls`, and add a `Popover` (MUI) for the design controls (a "Theme" button in the top bar opens it).
- Replace the inline chat-dock JSX with `<ReportChatDock messages={messages} isLoading={isLoading} onSend={(t) => sendMessage(t)} />` (remove the now-unused `input`/`endRef` state + the `Send`/`CircularProgress`/`Stack`/`Chip` imports that moved to the dock; keep what the page still uses).
- **Name fix (functional updater):** `onChange={(e) => setDefinition((d) => ({ ...d, name: e.target.value }))}`.
- Add a "Theme" top-bar button that opens a `Popover` containing `<ReportDesignControls theme={definition.theme} onChange={(patch) => { setDefinition((d) => ({ ...d, theme: { ...d.theme, ...patch } })); }} />`. After the popover closes (or on change, debounced/simple), call `repreview()` so the canvas reflects the new theme/accent. Simplest correct approach: call `repreview()` in the Popover's `onClose`.
- Pass `accentColor={definition.theme?.accentColor}` to each `<ReportBlockRenderer … />` on the canvas.
- Pull `repreview` from `useReportAgent()`.

- [ ] **Step 2: Verify build** — `CI=true npm run build` → "Compiled successfully." (no unused imports).

- [ ] **Step 3: Commit** — `git add src/pages/reports/ReportAgentPage.js && git commit -m "feat(reports): agent page uses chat dock + theme/accent design control; fix name updater"`

---

## Self-Review (done while writing)
- **Spec coverage:** Fixes the canvas data-block rendering (correctness for spec §9), establishes client-owns-definition (so spec §9 curated controls can coexist with chat), and delivers the first curated design control (theme + accent, spec §"curated controls"). Logo/cover, per-block one-tap, scope/period pickers, schedule, edit-via-agent, builder retirement are explicitly 4c — flagged, not gaps.
- **Placeholder scan:** none.
- **Type consistency:** `buildSnapshotBlocks` now returns `{ ...block, kind, data }`; `ReportBlockRenderer({ block, images, themePreset, accentColor })`; hook returns `…, repreview`; `definition.theme` carries `{ preset, accentColor }`; design-control `onChange(partialTheme)` merges into `definition.theme`. `getReportTheme` token `.accent`/`.accentSoft` overridden consistently.
- **Numbers-integrity:** unchanged — canvas still renders only server `previewBlocks`; `repreview` re-resolves via `reportAPI.preview` (server). Accent is cosmetic.

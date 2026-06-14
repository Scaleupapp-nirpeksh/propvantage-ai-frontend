# Report Agent — Phase 4a: Workspace UI core (canvas + chat dock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the core conversational report-creation UI: an API client for the agent, a `useReportAgent` hook (conversation state machine), and a `ReportAgentPage` (report canvas + chat dock, in the app's design system) wired to `POST /reports/agent/message`. Point "New Template" at it.

**Architecture:** `ReportAgentPage` = top bar (report name + Save) · a live **report canvas** (renders `previewBlocks` from the agent via the existing themed `ReportBlockRenderer`) · a **chat dock** (modeled on the existing `CopilotChat`/`useCopilotChat`). State lives in `useReportAgent`: it sends each user message to the agent, receives `{ sessionId, reply, definition, previewBlocks }`, and updates the transcript + working definition + live preview. Numbers come only from `previewBlocks` (server-resolved). Save persists the working definition as a template via the existing `reportAPI.createTemplate`.

**Scope boundary (4a vs 4b):** 4a = the **new-report** create flow + page shell + chat + live preview + Save. **Deferred to 4b:** scope/period pickers, theme/brand/cover design controls, per-block reorder/hide/retitle/flag, the Schedule dialog, edit-existing-via-agent, and retiring the dnd-kit builder. During 4a the old `/reports/templates/:id/edit` builder stays as-is (no regression).

**Tech Stack:** React 18, MUI 5 (Inter; primary `#1e88e5`, secondary `#ffb300`; bg `#f8f9fa`), notistack (`useSnackbar`), CRA Jest + `@testing-library/react`. Run UI tests: `CI=true npm test -- --watchAll=false --testPathPattern="<x>"`. Build: `CI=true npm run build`.

**Repo:** `propvantage-ai-frontend`, branch `feature/report-agent` (already exists).

**Reuse:** `ReportBlockRenderer` (`{ block, images, themePreset }`), `src/utils/reportThemes.js`. **Mirror (styling):** `src/components/copilot/CopilotChat.js`. **Do not** import dnd-kit or the builder palette/canvas here.

---

## File Structure

- **Modify** `src/services/api.js` — add `reportAgentAPI` (`message`, `getSession`) + `reportAPI.preview`.
- **Create** `src/pages/reports/useReportAgent.js` — conversation state hook.
- **Create** `src/pages/reports/ReportAgentPage.js` — the canvas + chat-dock page.
- **Modify** `src/App.js` — lazy-import `ReportAgentPage`; point `/reports/templates/new` at it.
- **Create** `src/pages/reports/useReportAgent.test.js`.

---

## Task 1: API client

**Files:** Modify `src/services/api.js`

- [ ] **Step 1:** In `src/services/api.js`, immediately after the `reportAPI` object (ends ~L1662, after `sendReport`), add a `preview` method to `reportAPI` (inside the object, next to `generate`):

```js
  // Resolve an unsaved definition → live blocks (canvas preview)
  preview: (definition) => api.post('/reports/preview', definition),
```

And add a new named export right after the `reportAPI` object closes:

```js
// ─── Report Agent (conversational builder) ─────────────────────────────
export const reportAgentAPI = {
  // body: { sessionId?, message } → { sessionId, reply, definition, previewBlocks }
  message: (body) => api.post('/reports/agent/message', body),
  getSession: (id) => api.get(`/reports/agent/sessions/${id}`),
};
```

- [ ] **Step 2: Verify build** — `CI=true npm run build` → "Compiled successfully." (No test for a one-line axios wrapper, consistent with the rest of `api.js`.)

- [ ] **Step 3: Commit**

```bash
git add src/services/api.js
git commit -m "feat(reports): reportAgentAPI (message/session) + reportAPI.preview"
```

---

## Task 2: `useReportAgent` hook

**Files:** Create `src/pages/reports/useReportAgent.js`; Test `src/pages/reports/useReportAgent.test.js`

- [ ] **Step 1: Failing test**

```js
// src/pages/reports/useReportAgent.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { reportAgentAPI } from '../../services/api';
import useReportAgent from './useReportAgent';

jest.mock('../../services/api', () => ({ reportAgentAPI: { message: jest.fn() } }));

describe('useReportAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts empty', () => {
    const { result } = renderHook(() => useReportAgent());
    expect(result.current.messages).toEqual([]);
    expect(result.current.definition.blocks).toEqual([]);
    expect(result.current.previewBlocks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sends a message and applies the agent response', async () => {
    reportAgentAPI.message.mockResolvedValue({ data: { data: {
      sessionId: 's1', reply: 'Added revenue.',
      definition: { name: 'Q2', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [{ id: 'b', type: 'kpi.revenue' }] },
      previewBlocks: [{ id: 'b', type: 'kpi.revenue', kind: 'kpi', data: { value: 100, unit: 'currency' } }],
    } } });
    const { result } = renderHook(() => useReportAgent());

    await act(async () => { await result.current.sendMessage('show revenue'); });

    expect(reportAgentAPI.message).toHaveBeenCalledWith({ sessionId: null, message: 'show revenue' });
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'show revenue' },
      { role: 'assistant', content: 'Added revenue.' },
    ]);
    expect(result.current.sessionId).toBe('s1');
    expect(result.current.definition.name).toBe('Q2');
    expect(result.current.previewBlocks[0].data).toEqual({ value: 100, unit: 'currency' });
    expect(result.current.isLoading).toBe(false);
  });

  it('passes the sessionId on subsequent turns', async () => {
    reportAgentAPI.message.mockResolvedValue({ data: { data: { sessionId: 's1', reply: 'ok', definition: { blocks: [] }, previewBlocks: [] } } });
    const { result } = renderHook(() => useReportAgent());
    await act(async () => { await result.current.sendMessage('one'); });
    await act(async () => { await result.current.sendMessage('two'); });
    expect(reportAgentAPI.message).toHaveBeenLastCalledWith({ sessionId: 's1', message: 'two' });
  });

  it('surfaces an error turn without throwing', async () => {
    reportAgentAPI.message.mockRejectedValue({ response: { data: { message: 'boom' } } });
    const { result } = renderHook(() => useReportAgent());
    await act(async () => { await result.current.sendMessage('hi'); });
    expect(result.current.error).toBe('boom');
    expect(result.current.messages[1].role).toBe('assistant'); // a friendly error turn was appended
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores blank input and re-entrancy while loading', async () => {
    let resolve;
    reportAgentAPI.message.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useReportAgent());
    act(() => { result.current.sendMessage('   '); }); // blank → ignored
    expect(reportAgentAPI.message).not.toHaveBeenCalled();
    act(() => { result.current.sendMessage('real'); });   // starts loading
    act(() => { result.current.sendMessage('again'); });  // ignored (loading)
    expect(reportAgentAPI.message).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ data: { data: { sessionId: 's', reply: 'k', definition: { blocks: [] }, previewBlocks: [] } } }); });
  });
});
```

- [ ] **Step 2: Run; verify FAIL** — `CI=true npm test -- --watchAll=false --testPathPattern="useReportAgent"`

- [ ] **Step 3: Implement the hook**

```js
// File: src/pages/reports/useReportAgent.js
// Conversation state for the report agent. Sends each user turn to the backend agent
// and applies the returned { reply, definition, previewBlocks }. Mirrors useCopilotChat.
import { useState, useCallback } from 'react';
import { reportAgentAPI } from '../../services/api';

const EMPTY_DEFINITION = { name: '', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [] };

const useReportAgent = (initialDefinition) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);        // { role: 'user'|'assistant', content }
  const [definition, setDefinition] = useState(initialDefinition || EMPTY_DEFINITION);
  const [previewBlocks, setPreviewBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setIsLoading(true);
    try {
      const res = await reportAgentAPI.message({ sessionId, message: trimmed });
      const data = res.data?.data || {};
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.definition) setDefinition(data.definition);
      if (Array.isArray(data.previewBlocks)) setPreviewBlocks(data.previewBlocks);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '' }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry — I hit an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  return { sessionId, messages, definition, previewBlocks, isLoading, error, sendMessage, setDefinition };
};

export default useReportAgent;
```

- [ ] **Step 4: Run; verify PASS.**
- [ ] **Step 5: Commit** — `git add src/pages/reports/useReportAgent.js src/pages/reports/useReportAgent.test.js && git commit -m "feat(reports): useReportAgent conversation hook"`

---

## Task 3: `ReportAgentPage` (canvas + chat dock) + route

**Files:** Create `src/pages/reports/ReportAgentPage.js`; Modify `src/App.js`. (Rendered/verified visually by the controller after build; no RTL test for the page shell — consistent with the repo not unit-testing pages.)

- [ ] **Step 1: Implement the page**

```js
// File: src/pages/reports/ReportAgentPage.js
// Conversational report builder: a live report canvas driven by a chat dock.
// Built entirely in the app design system (MUI / Inter / blue+gold).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, IconButton, CircularProgress, Stack, Chip,
} from '@mui/material';
import { AutoAwesome, Send, Save, ArrowBack } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { reportAPI } from '../../services/api';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';
import { getReportTheme } from '../../utils/reportThemes';
import useReportAgent from './useReportAgent';

const STARTERS = [
  'Quarterly review for the whole portfolio — sales, collections, lead funnel.',
  'Monthly collections report for one project.',
  'Compare my projects on sales and collection rate.',
];

const ReportAgentPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { messages, definition, previewBlocks, isLoading, sendMessage, setDefinition } = useReportAgent();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const tokens = getReportTheme(definition.theme?.preset);
  // Show resolved preview blocks (with data) when available; before the first turn the canvas is empty.
  const blocks = previewBlocks.length ? previewBlocks : [];

  const submit = (text) => { const t = text ?? input; if (t.trim()) { sendMessage(t); setInput(''); } };

  const handleSave = async () => {
    if (!definition.blocks?.length) { enqueueSnackbar('Ask the agent to build something first.', { variant: 'info' }); return; }
    setSaving(true);
    try {
      const payload = {
        name: definition.name || 'Untitled report',
        scope: definition.scope, theme: definition.theme, blocks: definition.blocks,
      };
      const res = await reportAPI.createTemplate(payload);
      enqueueSnackbar('Report saved.', { variant: 'success' });
      navigate(`/reports/templates/${res.data?.data?._id}/edit`);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Back</Button>
        <TextField
          size="small" placeholder="Untitled report" value={definition.name || ''}
          onChange={(e) => setDefinition({ ...definition, name: e.target.value })}
          sx={{ minWidth: 280 }}
        />
        <Chip size="small" icon={<AutoAwesome sx={{ fontSize: 16 }} />} label="AI builder" color="primary" variant="outlined" />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>

      {/* Canvas (the report — the star) */}
      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', borderRadius: 2, bgcolor: tokens.page, p: { xs: 2, md: 3 } }}>
        {blocks.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'text.secondary', gap: 1 }}>
            <AutoAwesome sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Describe the report you want</Typography>
            <Typography variant="body2">Tell the assistant below what to build. It pulls your real numbers — it never makes figures up.</Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: 820, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {blocks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((block) => (
              <ReportBlockRenderer key={block.id || block.type} block={block} images={[]} themePreset={definition.theme?.preset} />
            ))}
          </Box>
        )}
      </Paper>

      {/* Chat dock */}
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
          <TextField
            fullWidth multiline maxRows={4} size="small" placeholder="Ask the assistant to build or change the report…"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            disabled={isLoading}
          />
          <IconButton color="primary" onClick={() => submit()} disabled={isLoading || !input.trim()}><Send /></IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportAgentPage;
```

- [ ] **Step 2: Route swap.** In `src/App.js`, add the lazy import near the other report imports (~L201):

```js
const ReportAgentPage = React.lazy(() => import('./pages/reports/ReportAgentPage'));
```

Then in the `/reports/templates/new` route (~L1111), replace `<ReportTemplateBuilder />` with `<ReportAgentPage />` (keep the `ProtectedRoute requiredPermission="reports:manage"` + `DashboardLayout` + `Suspense` wrapper). Leave `/reports/templates/:id/edit` on `ReportTemplateBuilder` for now (4b).

- [ ] **Step 3: Verify build** — `CI=true npm run build` → "Compiled successfully." (Confirm no unused-import/lint errors.)

- [ ] **Step 4: Commit** — `git add src/pages/reports/ReportAgentPage.js src/App.js && git commit -m "feat(reports): ReportAgentPage (canvas + chat dock); /reports/templates/new uses it"`

---

## Self-Review (done while writing)

- **Spec coverage:** Delivers the core of spec §9 (workspace UI, layout B canvas + chat dock, app design system, live preview via the themed renderer, Save). Scope/period/theme/design controls, per-block controls, schedule dialog, edit-via-agent, and builder retirement are explicitly 4b — flagged, not a gap. Numbers-integrity preserved (canvas shows only `previewBlocks` from the server).
- **Placeholder scan:** none — full code, exact commands.
- **Type consistency:** hook returns `{ sessionId, messages, definition, previewBlocks, isLoading, error, sendMessage, setDefinition }`; the page consumes those; `definition` shape `{ name, scope, theme, blocks }` matches the backend agent output + the Save payload subset; `ReportBlockRenderer` called with `{ block, images, themePreset }` (the confirmed signature); `getReportTheme(preset)` tokens (`.page`) used for the canvas bg, matching Phase 2's renderer work.
- **Design-system compliance:** MUI components only, primary/secondary from theme, Inter via the app theme, `useSnackbar` per app convention, wrapped by `DashboardLayout` via the route — no bespoke styling.

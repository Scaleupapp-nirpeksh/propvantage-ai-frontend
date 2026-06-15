# Report Agent — Phase 4c: Edit-existing + Schedule & send Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ReportAgentPage` the full report builder — create AND edit existing reports by chat, Save in place, and configure delivery via the existing **Schedule & send** dialog. Point `/reports/templates/:id/edit` at the agent. (Deleting the old drag-drop builder files + removing `@dnd-kit` is a later cleanup, not this plan.)

**Architecture:** Frontend-only. Editing leverages 4b's "client owns the definition": the page loads a template, seeds the working `definition` (`{name, scope, theme, blocks}`) + a live preview (`reportAPI.preview`), and the existing `useReportAgent` already sends that `definition` on every turn — so no backend change is needed. Save is create-or-update by `templateId`. Delivery reuses the existing `ScheduleDeliveryDialog` (the report must be saved first so it has an id) and persists `{schedule, delivery, access}` via `reportAPI.updateTemplate`.

**Tech Stack:** React/MUI, CRA. Branch `feature/report-agent` (frontend). Build check: `CI=true npm run build`.

**Repo:** `propvantage-ai-frontend` only.

**Confirmed:** `ScheduleDeliveryDialog({ open, schedule, delivery, access, onScheduleChange, onDeliveryChange, onAccessChange, onClose })` exists and is reusable. `reportAPI`: `getTemplate(id)`, `createTemplate(data)`, `updateTemplate(id, data)`, `preview(definition)`. `useReportAgent` exposes `{ definition, previewBlocks, setDefinition, repreview, ... }` and already sends `definition` with each message. The schedule/delivery/access default shapes live in `builderState.js` (`initialBuilderState.schedule/delivery/access`).

---

## File Structure
- **Modify** `src/pages/reports/ReportAgentPage.js` — `useParams` edit support, load-on-mount, Save (create/update), Schedule dialog wiring, image-slots preservation.
- **Modify** `src/App.js` — point `/reports/templates/:id/edit` at `ReportAgentPage`.

(No new tests: the page is integration glue over already-tested hook/API; verified by build + the controller's manual visual pass. The hook and dialog are unchanged.)

---

## Task 1: Edit-existing + Save-in-place

**Files:** Modify `src/pages/reports/ReportAgentPage.js`

The page currently supports new-report only. Add, integrating with the existing structure (read the current file first):

- [ ] **Step 1: Imports + params + state.** Add to the top of the component:

```js
import { useParams, useNavigate } from 'react-router-dom';
// ...
const { id } = useParams();
const isEdit = Boolean(id);
const [templateId, setTemplateId] = useState(id || null);
// page-level template fields the agent definition doesn't own (kept across saves):
const [schedule, setSchedule] = useState(null);   // null until loaded/defaulted
const [delivery, setDelivery] = useState(null);
const [access, setAccess] = useState(null);
const [imageSlots, setImageSlots] = useState([]);
const [loading, setLoading] = useState(isEdit);
```

(Import the schedule/delivery/access defaults: `import { initialBuilderState } from './builderState';`.)

- [ ] **Step 2: Load-on-mount (edit).** Add an effect that, when `isEdit`, fetches the template, seeds the working definition + schedule/delivery/access + image slots, and previews:

```js
useEffect(() => {
  if (!isEdit) return;
  let cancelled = false;
  (async () => {
    try {
      const res = await reportAPI.getTemplate(id);
      const tpl = res.data?.data || {};
      if (cancelled) return;
      setDefinition({
        name: tpl.name || '', scope: tpl.scope || { mode: 'portfolio' },
        theme: { preset: 'clean', ...(tpl.theme || {}) }, blocks: tpl.blocks || [],
      });
      setSchedule({ ...initialBuilderState.schedule, ...(tpl.schedule || {}) });
      setDelivery({ ...initialBuilderState.delivery, ...(tpl.delivery || {}) });
      setAccess({ ...initialBuilderState.access, ...(tpl.access || {}) });
      setImageSlots(tpl.imageSlots || []);
      setTemplateId(id);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load report', { variant: 'error' });
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id, isEdit]);

// After the definition is seeded on edit, resolve a live preview once.
useEffect(() => {
  if (isEdit && !loading && definition.blocks?.length) { repreview(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);
```

- [ ] **Step 3: Save (create or update in place).** Replace the existing `handleSave` body so it updates when there's a `templateId`, else creates and stays on the page (navigating to the edit URL so a refresh resumes):

```js
const buildPayload = () => ({
  name: definition.name || 'Untitled report',
  scope: definition.scope, theme: definition.theme, blocks: definition.blocks,
  imageSlots,
  ...(schedule ? { schedule } : {}), ...(delivery ? { delivery } : {}), ...(access ? { access } : {}),
});

const handleSave = async () => {
  if (!definition.blocks?.length) { enqueueSnackbar('Ask the agent to build something first.', { variant: 'info' }); return; }
  setSaving(true);
  try {
    if (templateId) {
      await reportAPI.updateTemplate(templateId, buildPayload());
      enqueueSnackbar('Report saved.', { variant: 'success' });
    } else {
      const res = await reportAPI.createTemplate(buildPayload());
      const newId = res.data?.data?._id;
      setTemplateId(newId);
      enqueueSnackbar('Report saved.', { variant: 'success' });
      if (newId) navigate(`/reports/templates/${newId}/edit`, { replace: true });
    }
  } catch (err) {
    enqueueSnackbar(err.response?.data?.message || 'Save failed', { variant: 'error' });
  } finally { setSaving(false); }
};
```

- [ ] **Step 4: Loading guard.** While `loading` (edit fetch in flight), render a centered `<CircularProgress />` instead of the page body (add the import if removed in 4b).

- [ ] **Step 5: Verify build** — `CI=true npm run build` → "Compiled successfully."
- [ ] **Step 6: Commit** — `git add src/pages/reports/ReportAgentPage.js && git commit -m "feat(reports): agent page edits existing reports + saves in place"`

---

## Task 2: Schedule & send dialog

**Files:** Modify `src/pages/reports/ReportAgentPage.js`

- [ ] **Step 1: Import + state.** Add `import ScheduleDeliveryDialog from '../../components/reports/ScheduleDeliveryDialog';` and `const [scheduleOpen, setScheduleOpen] = useState(false);`.

- [ ] **Step 2: Top-bar button.** Add a "Schedule & send" button to the top bar (left of Save). Scheduling requires a saved report, so it saves first if needed:

```js
const openSchedule = async () => {
  if (!templateId) {
    if (!definition.blocks?.length) { enqueueSnackbar('Build and save the report first.', { variant: 'info' }); return; }
    await handleSave();              // creates + sets templateId
  }
  // ensure the schedule/delivery/access objects exist (defaults for a brand-new report)
  setSchedule((s) => s || { ...initialBuilderState.schedule });
  setDelivery((d) => d || { ...initialBuilderState.delivery });
  setAccess((a) => a || { ...initialBuilderState.access });
  setScheduleOpen(true);
};
```

```jsx
<Button startIcon={<Schedule />} onClick={openSchedule}>Schedule &amp; send</Button>
```
(Import `Schedule` from `@mui/icons-material`.)

- [ ] **Step 3: Dialog + persist on close.** Render the dialog; persist `{schedule, delivery, access}` to the saved template when it closes:

```jsx
<ScheduleDeliveryDialog
  open={scheduleOpen}
  schedule={schedule || initialBuilderState.schedule}
  delivery={delivery || initialBuilderState.delivery}
  access={access || initialBuilderState.access}
  onScheduleChange={(patch) => setSchedule((s) => ({ ...(s || initialBuilderState.schedule), ...patch }))}
  onDeliveryChange={(patch) => setDelivery((d) => ({ ...(d || initialBuilderState.delivery), ...patch }))}
  onAccessChange={(patch) => setAccess((a) => ({ ...(a || initialBuilderState.access), ...patch }))}
  onClose={async () => {
    setScheduleOpen(false);
    if (templateId) {
      try {
        await reportAPI.updateTemplate(templateId, buildPayload());
        enqueueSnackbar('Schedule saved.', { variant: 'success' });
      } catch (err) {
        enqueueSnackbar(err.response?.data?.message || 'Could not save schedule', { variant: 'error' });
      }
    }
  }}
/>
```

- [ ] **Step 4: Verify build** — `CI=true npm run build` → clean.
- [ ] **Step 5: Commit** — `git add src/pages/reports/ReportAgentPage.js && git commit -m "feat(reports): Schedule & send dialog on the agent page"`

---

## Task 3: Route the edit path to the agent

**Files:** Modify `src/App.js`

- [ ] **Step 1:** In the `/reports/templates/:id/edit` route (the one currently rendering `<ReportTemplateBuilder />`), replace it with `<ReportAgentPage />` (keep the `ProtectedRoute requiredPermission="reports:manage"` → `DashboardLayout` → `Suspense` wrapper). `ReportAgentPage` is already lazy-imported (4a). Leave the `ReportTemplateBuilder` lazy import in place for now (file deletion is a later cleanup); it is simply no longer routed.

- [ ] **Step 2: Verify build** — `CI=true npm run build` → "Compiled successfully." (If `ReportTemplateBuilder` becomes an unused import and CI flags it, leave a `// eslint-disable-next-line no-unused-vars` on its lazy import line OR remove the import line — prefer removing the import line if nothing else references it.)

- [ ] **Step 3: Commit** — `git add src/App.js && git commit -m "feat(reports): edit route now uses the agent (builder fully replaced for create+edit)"`

---

## Self-Review (done while writing)
- **Spec coverage:** Completes the "agent replaces the builder for create + edit" goal (spec §1/§9) and wires delivery (the original schedule/auto-send requirement) by reusing `ScheduleDeliveryDialog` (spec — scheduling is the separate screen). Logo/cover, per-block one-tap controls, scope/period pickers, and the physical deletion of the old builder/dnd-kit are explicitly deferred — flagged, not gaps.
- **Placeholder scan:** none.
- **Type consistency:** `definition` = `{name, scope, theme, blocks}`; page-level `{schedule, delivery, access, imageSlots, templateId}` mirror the template + dialog shapes; `buildPayload()` is the single source for both create + update + schedule persistence; defaults pulled from `initialBuilderState`. The hook already sends `definition` (4b), so edit needs no hook change.
- **Numbers-integrity:** unchanged — canvas still renders only server `previewBlocks` (via `repreview`/agent); editing seeds block *types* + scope, resolved server-side.
- **No regression risk to the old builder:** its file stays; only the route changes. `/reports/generated/*` review/analytics routes are untouched.

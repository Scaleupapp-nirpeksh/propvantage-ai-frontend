# Leadership Report Builder — Phase 3b (Review UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give reviewers a screen to inspect a generated report, override a wrong value (with a reason) or flag it to a data owner, request changes, and approve — after which the public share link works.

**Architecture:** A review page renders the frozen snapshot via the existing `ReportBlockRenderer` (kind derived from the catalog), with per-block Override/Flag controls and a flags side panel. Pure helpers (`availableReviewActions`, `applyOverrides`) are TDD'd. Override/Flag use focused dialog components; the flag owner picker uses `userAPI.getUsers`. State actions hit the Phase 3a endpoints via `reportAPI`. The public share link is surfaced only once the report is `approved`.

**Tech Stack:** React 18, MUI v5, axios, Jest + RTL, `react-router-dom`.

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`. Paths relative to that root.

**Depends on:** Phase 3a endpoints (`/instances/:id/submit-review|approve|request-changes|overrides|flags`, `PATCH /flags/:flagId`); Phase 2 `reportAPI.getInstance`, `reportAPI.getCatalog`, `ReportBlockRenderer`, `reportShareUrl`; `userAPI.getUsers`; `useAuth().checkPerm`.

**Test command (CRA):** `CI=true npm test -- --watchAll=false --testPathPattern="<name>"`; build `CI=false npm run build`.

**Conventions (verbatim):** shared components import `{ PageHeader, ConfirmDialog }`; `useAuth().checkPerm('reports:approve')`; `userAPI.getUsers()` → `res.data.data` (array of users with `_id`, `firstName`, `lastName`); protected route uses `requiredPermission="reports:view"` + DashboardLayout + Suspense.

---

## File Structure

**New files:**
- `src/utils/review.js` — pure `availableReviewActions(status, canApprove)`, `applyOverrides(blocks, overrides)`.
- `src/utils/review.test.js`
- `src/components/reports/OverrideDialog.js`
- `src/components/reports/FlagDialog.js`
- `src/pages/reports/ReportReviewPage.js`

**Modified files:**
- `src/services/api.js` — review methods on `reportAPI`.
- `src/App.js` — `/reports/generated/:id/review` route.
- `src/pages/reports/ReportInstanceListPage.js` — a "Review" row action / status column.

---

## Task 1: Review API methods

**Files:** Modify `src/services/api.js` (inside the existing `reportAPI` object)

- [ ] **Step 1: Add the methods**

```js
  // Review & approval workflow
  submitReview: (id) => api.post(`/reports/instances/${id}/submit-review`),
  approveReport: (id, notes) => api.post(`/reports/instances/${id}/approve`, { notes }),
  requestChanges: (id, notes) => api.post(`/reports/instances/${id}/request-changes`, { notes }),
  addOverride: (id, data) => api.post(`/reports/instances/${id}/overrides`, data),
  addFlag: (id, data) => api.post(`/reports/instances/${id}/flags`, data),
  resolveFlag: (id, flagId) => api.patch(`/reports/instances/${id}/flags/${flagId}`),
```

- [ ] **Step 2: Verify.** `node -e "const s=require('fs').readFileSync('src/services/api.js','utf8'); if(!(s.includes('submitReview')&&s.includes('addOverride')&&s.includes('resolveFlag'))) throw new Error('missing'); console.log('ok')"`.

- [ ] **Step 3: Commit**

```bash
git add src/services/api.js
git commit -m "feat(reports): add review workflow API methods" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Review utils (pure, TDD)

**Files:** Create `src/utils/review.js`, `src/utils/review.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: src/utils/review.test.js
import { availableReviewActions, applyOverrides } from './review';

describe('availableReviewActions', () => {
  it('offers submit in draft/changes_requested', () => {
    expect(availableReviewActions('draft', true)).toEqual({ submit: true, approve: false, requestChanges: false });
    expect(availableReviewActions('changes_requested', false)).toEqual({ submit: true, approve: false, requestChanges: false });
  });
  it('offers approve/request-changes only to approvers when in_review', () => {
    expect(availableReviewActions('in_review', true)).toEqual({ submit: false, approve: true, requestChanges: true });
    expect(availableReviewActions('in_review', false)).toEqual({ submit: false, approve: false, requestChanges: false });
  });
  it('offers nothing when approved', () => {
    expect(availableReviewActions('approved', true)).toEqual({ submit: false, approve: false, requestChanges: false });
  });
});

describe('applyOverrides', () => {
  const blocks = [
    { id: 'b1', type: 'kpi.revenue', kind: 'kpi', data: { value: 100, unit: 'currency' } },
    { id: 'b2', type: 'text.note', kind: 'layout', data: { text: 'hi' } },
  ];
  it('patches the targeted field without mutating input', () => {
    const out = applyOverrides(blocks, [{ blockId: 'b1', fieldPath: 'data.value', newValue: 250 }]);
    expect(out[0].data.value).toBe(250);
    expect(out[0].data.unit).toBe('currency');
    expect(blocks[0].data.value).toBe(100); // input untouched
  });
  it('returns input when no overrides', () => {
    expect(applyOverrides(blocks, [])).toBe(blocks);
  });
});
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="utils/review"`.

- [ ] **Step 3: Implement**

```js
// File: src/utils/review.js
// Pure helpers for the report review screen.

/** Which review actions are available for a status (approve/request-changes need approver rights). */
export const availableReviewActions = (status, canApprove) => {
  switch (status) {
    case 'draft':
    case 'changes_requested':
      return { submit: true, approve: false, requestChanges: false };
    case 'in_review':
      return { submit: false, approve: !!canApprove, requestChanges: !!canApprove };
    case 'approved':
    default:
      return { submit: false, approve: false, requestChanges: false };
  }
};

const setPath = (obj, path, value) => {
  const clone = JSON.parse(JSON.stringify(obj));
  const keys = String(path).split('.');
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
};

/** Apply review overrides to snapshot blocks for display. Pure (input unchanged). */
export const applyOverrides = (blocks = [], overrides = []) => {
  if (!overrides || overrides.length === 0) return blocks;
  const byBlock = new Map();
  for (const o of overrides) {
    if (!byBlock.has(o.blockId)) byBlock.set(o.blockId, []);
    byBlock.get(o.blockId).push(o);
  }
  return blocks.map((b) => {
    const ovs = byBlock.get(b.id);
    if (!ovs) return b;
    let nb = b;
    for (const o of ovs) nb = setPath(nb, o.fieldPath, o.newValue);
    return nb;
  });
};
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="utils/review"` → PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/review.js src/utils/review.test.js
git commit -m "feat(reports): add review action + override-display utils" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Override & Flag dialogs

**Files:** Create `src/components/reports/OverrideDialog.js`, `src/components/reports/FlagDialog.js`

- [ ] **Step 1: Override dialog**

```js
// File: src/components/reports/OverrideDialog.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box } from '@mui/material';

/**
 * Override a KPI block's value (fieldPath 'data.value').
 * @param {{ open, block, onClose, onSave }} props  onSave({ blockId, fieldPath, originalValue, newValue, reason })
 */
const OverrideDialog = ({ open, block, onClose, onSave }) => {
  const original = block?.data?.value ?? '';
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => { if (open) { setNewValue(String(original)); setReason(''); } }, [open, original]);

  const handleSave = () => {
    const num = Number(newValue);
    onSave({
      blockId: block.id,
      fieldPath: 'data.value',
      originalValue: original,
      newValue: Number.isNaN(num) ? newValue : num,
      reason,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Override “{block?.title || block?.type}”</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Current value</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{String(original)}</Typography>
          <TextField fullWidth size="small" label="Corrected value" value={newValue}
            onChange={(e) => setNewValue(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={2} size="small" label="Reason (recorded for the audit trail)"
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!reason.trim()}>Save override</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OverrideDialog;
```

- [ ] **Step 2: Flag dialog**

```js
// File: src/components/reports/FlagDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
} from '@mui/material';

const SEVERITIES = [{ v: 'info', l: 'Info' }, { v: 'warn', l: 'Warning' }, { v: 'critical', l: 'Critical' }];

/**
 * Flag a block for correction and assign an owner.
 * @param {{ open, block, users, onClose, onSave }} props
 *   users = [{ _id, firstName, lastName }]; onSave({ blockId, note, severity, assignedTo })
 */
const FlagDialog = ({ open, block, users = [], onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState('warn');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => { if (open) { setNote(''); setSeverity('warn'); setAssignedTo(''); } }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Flag “{block?.title || block?.type}”</DialogTitle>
      <DialogContent>
        <TextField fullWidth multiline minRows={2} size="small" label="What's wrong?" value={note}
          onChange={(e) => setNote(e.target.value)} sx={{ mt: 1, mb: 2 }} />
        <TextField select fullWidth size="small" label="Severity" value={severity}
          onChange={(e) => setSeverity(e.target.value)} sx={{ mb: 2 }}>
          {SEVERITIES.map((s) => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
        </TextField>
        <TextField select fullWidth size="small" label="Assign to (notified to fix the source)" value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}>
          <MenuItem value="">Unassigned</MenuItem>
          {users.map((u) => <MenuItem key={u._id} value={u._id}>{u.firstName} {u.lastName}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={() => onSave({ blockId: block.id, note, severity, assignedTo: assignedTo || undefined })}
          disabled={!note.trim()}>Raise flag</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlagDialog;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/OverrideDialog.js src/components/reports/FlagDialog.js
git commit -m "feat(reports): add override + flag dialogs" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Review page + route

**Files:** Create `src/pages/reports/ReportReviewPage.js`; modify `src/App.js`

- [ ] **Step 1: Implement the review page**

```js
// File: src/pages/reports/ReportReviewPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Button, Chip, Stack, Typography, IconButton, Tooltip, Alert,
  List, ListItem, ListItemText, Snackbar, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, EditNote, Flag, CheckCircle, Send, Undo, OpenInNew, DoneAll } from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { reportAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';
import OverrideDialog from '../../components/reports/OverrideDialog';
import FlagDialog from '../../components/reports/FlagDialog';
import { availableReviewActions, applyOverrides } from '../../utils/review';
import { reportShareUrl } from '../../utils/reportShare';

const ReportReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checkPerm } = useAuth();
  const canApprove = checkPerm('reports:approve');

  const [instance, setInstance] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [overrideBlock, setOverrideBlock] = useState(null);
  const [flagBlock, setFlagBlock] = useState(null);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, catRes, usersRes] = await Promise.all([
        reportAPI.getInstance(id), reportAPI.getCatalog(), userAPI.getUsers(),
      ]);
      setInstance(instRes.data?.data || null);
      setCatalog(catRes.data?.data || []);
      setUsers(usersRes.data?.data || usersRes.data?.users || []);
    } catch (err) {
      setToast({ severity: 'error', msg: err.response?.data?.message || 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const status = instance?.review?.status || 'draft';
  const actions = availableReviewActions(status, canApprove);
  const overrides = instance?.overrides || [];
  const flags = instance?.flags || [];

  // Blocks enriched with kind (from catalog) + overrides applied, for the review canvas.
  const blocks = applyOverrides(
    (instance?.blocks || [])
      .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((b) => ({ ...b, kind: b.kind || catalog.find((c) => c.type === b.type)?.kind })),
    overrides
  );

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); setToast({ severity: 'success', msg: okMsg }); await load(); }
    catch (err) { setToast({ severity: 'error', msg: err.response?.data?.message || 'Action failed' }); }
    finally { setBusy(false); }
  };

  const shareUrl = reportShareUrl(instance?.publicSlug);

  return (
    <Box>
      <PageHeader
        title={instance?.title || 'Review report'}
        subtitle="Check every value. Override or flag anything wrong, then approve."
        loading={loading}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports/generated')}>Back</Button>
            <Chip label={status.replace('_', ' ')} color={status === 'approved' ? 'success' : status === 'in_review' ? 'info' : 'default'} />
            {actions.submit && <Button variant="contained" startIcon={<Send />} disabled={busy}
              onClick={() => run(() => reportAPI.submitReview(id), 'Submitted for review')}>Submit for review</Button>}
            {actions.requestChanges && <Button color="warning" startIcon={<Undo />} disabled={busy}
              onClick={() => setChangesOpen(true)}>Request changes</Button>}
            {actions.approve && <Button variant="contained" color="success" startIcon={<CheckCircle />} disabled={busy}
              onClick={() => run(() => reportAPI.approveReport(id), 'Report approved')}>Approve</Button>}
          </Stack>
        }
      />

      {status === 'approved' && shareUrl && (
        <Alert severity="success" sx={{ mb: 2 }}
          action={<>
            <Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy</Button>
            <Button color="inherit" size="small" startIcon={<OpenInNew />} href={shareUrl} target="_blank" rel="noreferrer">Open</Button>
          </>}>
          Approved — public link is live: {shareUrl}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {blocks.map((block) => {
              const overridden = overrides.some((o) => o.blockId === block.id);
              const canOverride = block.kind === 'kpi' && status !== 'approved';
              const canFlag = status !== 'approved';
              return (
                <Paper key={block.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    {overridden && <Chip size="small" color="info" label="overridden" />}
                    {canOverride && <Tooltip title="Override value"><IconButton size="small" onClick={() => setOverrideBlock(block)}><EditNote fontSize="small" /></IconButton></Tooltip>}
                    {canFlag && <Tooltip title="Flag for correction"><IconButton size="small" onClick={() => setFlagBlock(block)}><Flag fontSize="small" /></IconButton></Tooltip>}
                  </Box>
                  <ReportBlockRenderer block={block} images={instance?.images || []} />
                </Paper>
              );
            })}
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Flags ({flags.filter((f) => f.status === 'open').length} open)</Typography>
            {flags.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No flags. Hover a block and use the flag icon to raise one.</Typography>
            ) : (
              <List dense>
                {flags.map((f) => (
                  <ListItem key={f.id} disableGutters
                    secondaryAction={f.status === 'open' && status !== 'approved'
                      ? <Tooltip title="Mark resolved"><IconButton edge="end" size="small"
                          onClick={() => run(() => reportAPI.resolveFlag(id, f.id), 'Flag resolved')}><DoneAll fontSize="small" /></IconButton></Tooltip>
                      : null}>
                    <ListItemText
                      primary={<><Chip size="small" label={f.severity} sx={{ mr: 1 }} />{f.note}</>}
                      secondary={f.status === 'resolved' ? 'Resolved' : 'Open'} />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <OverrideDialog open={!!overrideBlock} block={overrideBlock}
        onClose={() => setOverrideBlock(null)}
        onSave={(payload) => { setOverrideBlock(null); run(() => reportAPI.addOverride(id, payload), 'Override saved'); }} />
      <FlagDialog open={!!flagBlock} block={flagBlock} users={users}
        onClose={() => setFlagBlock(null)}
        onSave={(payload) => { setFlagBlock(null); run(() => reportAPI.addFlag(id, payload), 'Flag raised'); }} />

      <Dialog open={changesOpen} onClose={() => setChangesOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request changes</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline minRows={3} size="small" label="What needs to change?" value={changesNote}
            onChange={(e) => setChangesNote(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangesOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning"
            onClick={() => { setChangesOpen(false); run(() => reportAPI.requestChanges(id, changesNote), 'Changes requested'); }}>Send</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default ReportReviewPage;
```

- [ ] **Step 2: Add the route in `App.js`.** Lazy import + route (requires `reports:view`; approve actions are further gated inside the page by `checkPerm('reports:approve')`):

```js
const ReportReviewPage = React.lazy(() => import('./pages/reports/ReportReviewPage'));
```

```jsx
<Route path="/reports/generated/:id/review" element={
  <ProtectedRoute requiredPermission="reports:view">
    <DashboardLayout><Suspense fallback={<LoadingFallback />}><ReportReviewPage /></Suspense></DashboardLayout>
  </ProtectedRoute>
} />
```

(Declare it BEFORE `/reports/generated/:id` is unnecessary — paths differ by the `/review` suffix and react-router v6 matches the more specific path — but declaring `/reports/generated/:id/review` before `/reports/generated/:id` is harmless and clear. Place it adjacent.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/reports/ReportReviewPage.js src/App.js
git commit -m "feat(reports): add review screen (override/flag/approve)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire Review into the generated-reports list

**Files:** Modify `src/pages/reports/ReportInstanceListPage.js`

- [ ] **Step 1: Add a review status column + a Review action.** Add a `Review` button column and make the existing row click go to review. Replace the `columns` array's `review` column render and add a trailing actions column:

```js
    {
      id: 'review', label: 'Review',
      render: (r) => <Chip size="small" variant="outlined"
        color={r.review?.status === 'approved' ? 'success' : r.review?.status === 'in_review' ? 'info' : 'default'}
        label={(r.review?.status || 'draft').replace('_', ' ')} />,
    },
```

And change the `onRowClick` to open the review screen:

```js
        onRowClick={(row) => navigate(`/reports/generated/${row._id}/review`)}
```

(Keep the analytics page reachable from the review screen header and the per-report open-rate view; the list's primary action is now Review, which is the Phase-3 entry point.)

- [ ] **Step 2: Commit**

```bash
git add src/pages/reports/ReportInstanceListPage.js
git commit -m "feat(reports): open the review screen from the generated-reports list" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verify (tests + build + manual smoke)

- [ ] **Step 1: Unit tests.** `CI=true npm test -- --watchAll=false --testPathPattern="utils/review|reportShare|reportCatalog|builderState|ReportBlockRenderer"` → all green (review utils 5 + prior suites).

- [ ] **Step 2: Build.** `CI=false npm run build` → "Compiled successfully" (no ERRORS; warnings OK). Fix any compile error and re-run.

- [ ] **Step 3: Manual smoke** (Phase 3a backend running; logged in as a user with `reports:approve`):
  - **Reports → Generated reports** → row shows a status chip; click a row → the **review screen** opens with the snapshot.
  - Hover a KPI block → **override** icon → set a corrected value + reason → save → the block shows the new value with an "overridden" chip.
  - Hover any block → **flag** icon → write a note, pick an owner → raise → it appears in the Flags panel (and the owner gets an in-app notification).
  - Click **Submit for review** → status → "in review"; **Approve** → status → "approved" and a green "public link is live" banner appears.
  - Open the public `/r/:slug` (incognito) → email gate → the report renders **with the overridden value**. A *non-approved* report's slug returns the "not found" state.
  Record results.

- [ ] **Step 4: Final commit** (only if Step 3 surfaced small fixes).

---

## Self-Review

**1. Spec coverage (Phase 3 frontend):** review screen rendering the snapshot → Task 4 ✅; override a value with reason (audit trail) → Tasks 3,4 ✅; flag → assign owner (notified) → Tasks 3,4 ✅; request changes / approve, gated by `reports:approve` → Tasks 2,4 ✅; public link surfaced only when approved → Task 4 ✅; status visible in the list → Task 5 ✅.

**2. Placeholder scan:** complete code + exact commands; manual smoke is explicit verification. ✅

**3. Type/name consistency:** `availableReviewActions`/`applyOverrides` (Task 2) used by the review page (Task 4). `reportAPI.submitReview/approveReport/requestChanges/addOverride/addFlag/resolveFlag` (Task 1) consumed by the review page + dialogs (Task 4). `OverrideDialog`/`FlagDialog` prop contracts (`{open, block, users, onClose, onSave}`) match the page's usage. `ReportBlockRenderer` prop `{block, images}`; kind derived from catalog like the builder. `userAPI.getUsers` returns `res.data.data` (handled with a fallback). `checkPerm('reports:approve')` gates approve. ✅

**4. Convention match:** protected route `reports:view` + DashboardLayout + Suspense; MUI v5 dialogs/Grid; raw fetch with `useCallback`; `reportShareUrl` reused. ✅

**Known limitations (documented):** override is offered only for KPI blocks (`data.value`) — the common "this number is wrong" case; chart/table overrides are out of scope for v1. The review page is verified by build + manual smoke (RTL of the dialog/approve flow is brittle); the pure utils are unit-tested. Internal alerts are in-app notifications (the NotificationBell) — email arrives in Phase 4.

---

## Execution Handoff

After 3b, **Phase 3 is complete** — reports are reviewed, corrected, and approved before their public link goes live. Next is **Phase 4 (Scheduling & delivery):** the `node-cron` job that generates instances weekly/monthly/quarterly and routes them to review-or-send; emailing the link to stakeholders — which **must first install + fix the email service** (`nodemailer`+`date-fns` deps, `createTransport` fix, SMTP env) discovered broken in Phase 3.

# Leadership Report Builder — Phase 4b (Schedule & Delivery UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a creator configure a report's schedule (weekly/monthly/quarterly), delivery mode (review-then-send vs auto-send), and stakeholder recipient list in the builder, and let a reviewer send an approved report to stakeholders on demand.

**Architecture:** Extend the existing builder-state reducer with `schedule` + `delivery` (TDD'd), so a normal "Save" persists them through `buildTemplatePayload`. A `ScheduleDeliveryDialog` edits those via dispatch. The approved review screen gains a "Send to stakeholders" action calling the Phase 4a send endpoint.

**Tech Stack:** React 18, MUI v5, axios, Jest + RTL.

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`. Paths relative to that root.

**Depends on:** Phase 4a `POST /reports/instances/:id/send`; Phase 1b `builderState` reducer + `ReportTemplateBuilder`; Phase 3b `ReportReviewPage`. `ReportTemplate.schedule`/`delivery` already persist (Phase 0 model).

**Test command (CRA):** `CI=true npm test -- --watchAll=false --testPathPattern="<name>"`; build `CI=false npm run build`.

---

## File Structure

**New files:**
- `src/components/reports/ScheduleDeliveryDialog.js`

**Modified files:**
- `src/services/api.js` — `reportAPI.sendReport`.
- `src/pages/reports/builderState.js` — `schedule`/`delivery` in state + `setSchedule`/`setDelivery` actions (+ payload/hydrate).
- `src/pages/reports/builderState.test.js` — cover the additions.
- `src/pages/reports/ReportTemplateBuilder.js` — a "Schedule & delivery" button + dialog.
- `src/pages/reports/ReportReviewPage.js` — "Send to stakeholders" on the approved banner.

---

## Task 1: Send API method

**Files:** Modify `src/services/api.js` (inside `reportAPI`)

- [ ] **Step 1: Add**

```js
  sendReport: (id) => api.post(`/reports/instances/${id}/send`),
```

- [ ] **Step 2: Verify.** `node -e "const s=require('fs').readFileSync('src/services/api.js','utf8'); if(!s.includes('sendReport:')) throw new Error('missing'); console.log('ok')"`.

- [ ] **Step 3: Commit**

```bash
git add src/services/api.js
git commit -m "feat(reports): add sendReport API method" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Builder state — schedule + delivery (TDD)

**Files:** Modify `src/pages/reports/builderState.js`, `src/pages/reports/builderState.test.js`

- [ ] **Step 1: Add failing tests.** Append to `builderState.test.js` inside `describe('builderReducer', ...)`:

```js
  it('has schedule and delivery defaults', () => {
    expect(initialBuilderState.schedule.frequency).toBe('monthly');
    expect(initialBuilderState.schedule.enabled).toBe(false);
    expect(initialBuilderState.delivery.mode).toBe('review_then_send');
    expect(initialBuilderState.delivery.recipients).toEqual([]);
  });

  it('merges schedule and delivery patches', () => {
    let s = builderReducer(initialBuilderState, actions.setSchedule({ enabled: true, frequency: 'weekly', dayOfWeek: 3 }));
    expect(s.schedule).toMatchObject({ enabled: true, frequency: 'weekly', dayOfWeek: 3, time: '09:00' });
    s = builderReducer(s, actions.setDelivery({ mode: 'auto_send', recipients: [{ email: 'a@b.com', name: 'A' }] }));
    expect(s.delivery.mode).toBe('auto_send');
    expect(s.delivery.recipients).toEqual([{ email: 'a@b.com', name: 'A' }]);
  });

  it('round-trips schedule/delivery through hydrate + payload', () => {
    const tpl = {
      name: 'T', blocks: [],
      schedule: { enabled: true, frequency: 'quarterly', time: '08:00' },
      delivery: { mode: 'auto_send', recipients: [{ email: 'x@y.com' }] },
    };
    const s = templateToBuilderState(tpl);
    expect(s.schedule.frequency).toBe('quarterly');
    expect(s.delivery.recipients).toHaveLength(1);
    const payload = buildTemplatePayload(s);
    expect(payload.schedule.frequency).toBe('quarterly');
    expect(payload.delivery.mode).toBe('auto_send');
  });
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState"`.

- [ ] **Step 3: Implement the additions in `builderState.js`:**

In `initialBuilderState`, add two keys (after `imageSlots: []`):

```js
  schedule: { enabled: false, frequency: 'monthly', dayOfWeek: 1, dayOfMonth: 1, time: '09:00', timezone: 'Asia/Kolkata' },
  delivery: { mode: 'review_then_send', recipients: [], reviewers: [] },
```

Add the action type constants to `T`:

```js
  SET_SCHEDULE: 'SET_SCHEDULE', SET_DELIVERY: 'SET_DELIVERY',
```

Add the action creators to `actions`:

```js
  setSchedule: (patch) => ({ type: T.SET_SCHEDULE, patch }),
  setDelivery: (patch) => ({ type: T.SET_DELIVERY, patch }),
```

Add the reducer cases (before `default:`):

```js
    case T.SET_SCHEDULE:
      return { ...state, schedule: { ...state.schedule, ...action.patch } };
    case T.SET_DELIVERY:
      return { ...state, delivery: { ...state.delivery, ...action.patch } };
```

In `templateToBuilderState`, add to the returned object:

```js
  schedule: { ...initialBuilderState.schedule, ...(template.schedule || {}) },
  delivery: { ...initialBuilderState.delivery, ...(template.delivery || {}) },
```

In `buildTemplatePayload`, add to the returned object:

```js
  schedule: state.schedule,
  delivery: state.delivery,
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState"` → PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/reports/builderState.js src/pages/reports/builderState.test.js
git commit -m "feat(reports): add schedule + delivery to builder state" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Schedule & Delivery dialog

**Files:** Create `src/components/reports/ScheduleDeliveryDialog.js`

- [ ] **Step 1: Implement**

```js
// File: src/components/reports/ScheduleDeliveryDialog.js
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Switch, FormControlLabel,
  TextField, MenuItem, Grid, Typography, IconButton, Box, Divider,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';

const DOW = [['Sun', 0], ['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6]];

/**
 * Edits a template's schedule + delivery (controlled).
 * @param {{ open, schedule, delivery, onScheduleChange, onDeliveryChange, onClose }} props
 *   onScheduleChange(patch); onDeliveryChange(patch)
 */
const ScheduleDeliveryDialog = ({ open, schedule = {}, delivery = {}, onScheduleChange, onDeliveryChange, onClose }) => {
  const recipients = Array.isArray(delivery.recipients) ? delivery.recipients : [];

  const setRecipient = (i, patch) => {
    const next = recipients.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onDeliveryChange({ recipients: next });
  };
  const addRecipient = () => onDeliveryChange({ recipients: [...recipients, { email: '', name: '' }] });
  const removeRecipient = (i) => onDeliveryChange({ recipients: recipients.filter((_, idx) => idx !== i) });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule & delivery</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={<Switch checked={!!schedule.enabled} onChange={(e) => onScheduleChange({ enabled: e.target.checked })} />}
          label="Send on a recurring schedule"
        />
        {schedule.enabled && (
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Frequency" value={schedule.frequency || 'monthly'}
                onChange={(e) => onScheduleChange({ frequency: e.target.value })}>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </TextField>
            </Grid>
            {schedule.frequency === 'weekly' && (
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Day" value={schedule.dayOfWeek ?? 1}
                  onChange={(e) => onScheduleChange({ dayOfWeek: Number(e.target.value) })}>
                  {DOW.map(([l, v]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            {schedule.frequency === 'monthly' && (
              <Grid item xs={6}>
                <TextField type="number" fullWidth size="small" label="Day of month (1–28)" value={schedule.dayOfMonth ?? 1}
                  onChange={(e) => onScheduleChange({ dayOfMonth: Math.min(Math.max(Number(e.target.value) || 1, 1), 28) })} />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField type="time" fullWidth size="small" label="Time" InputLabelProps={{ shrink: true }}
                value={schedule.time || '09:00'} onChange={(e) => onScheduleChange({ time: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Timezone" value={schedule.timezone || 'Asia/Kolkata'}
                onChange={(e) => onScheduleChange({ timezone: e.target.value })} />
            </Grid>
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        <TextField select fullWidth size="small" label="When generated" value={delivery.mode || 'review_then_send'}
          onChange={(e) => onDeliveryChange({ mode: e.target.value })} sx={{ mb: 2 }}>
          <MenuItem value="review_then_send">Hold for review, then send after approval</MenuItem>
          <MenuItem value="auto_send">Send automatically (no review)</MenuItem>
        </TextField>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Stakeholder recipients</Typography>
        {recipients.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No recipients yet.</Typography>}
        {recipients.map((r, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField size="small" type="email" label="Email" value={r.email || ''} sx={{ flex: 2 }}
              onChange={(e) => setRecipient(i, { email: e.target.value })} />
            <TextField size="small" label="Name" value={r.name || ''} sx={{ flex: 1 }}
              onChange={(e) => setRecipient(i, { name: e.target.value })} />
            <IconButton size="small" onClick={() => removeRecipient(i)}><DeleteOutline fontSize="small" /></IconButton>
          </Box>
        ))}
        <Button size="small" startIcon={<Add />} onClick={addRecipient}>Add recipient</Button>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDeliveryDialog;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/reports/ScheduleDeliveryDialog.js
git commit -m "feat(reports): add schedule & delivery dialog" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire the dialog into the builder

**Files:** Modify `src/pages/reports/ReportTemplateBuilder.js`

- [ ] **Step 1: Import + state.** Add the import:

```js
import ScheduleDeliveryDialog from '../../components/reports/ScheduleDeliveryDialog';
import { Schedule } from '@mui/icons-material';
```

Add state near the other `useState` hooks:

```js
  const [scheduleOpen, setScheduleOpen] = useState(false);
```

- [ ] **Step 2: Add a header button.** In the `PageHeader` `actions` `<Stack>`, add (before the Save button):

```jsx
            <Button startIcon={<Schedule />} onClick={() => setScheduleOpen(true)}>Schedule & delivery</Button>
```

- [ ] **Step 3: Render the dialog** (just before the closing `</Box>` of the component, after the `<Snackbar>`):

```jsx
      <ScheduleDeliveryDialog
        open={scheduleOpen}
        schedule={state.schedule}
        delivery={state.delivery}
        onScheduleChange={(patch) => dispatch(actions.setSchedule(patch))}
        onDeliveryChange={(patch) => dispatch(actions.setDelivery(patch))}
        onClose={() => setScheduleOpen(false)}
      />
```

(`Schedule` config is part of builder state, so the existing "Save" persists it. The `Schedule` icon name doesn't collide — it's the MUI clock icon.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/reports/ReportTemplateBuilder.js
git commit -m "feat(reports): add schedule & delivery to the builder" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: "Send to stakeholders" on the approved review screen

**Files:** Modify `src/pages/reports/ReportReviewPage.js`

- [ ] **Step 1: Add a send action to the approved banner.** In the `status === 'approved'` `<Alert>`'s `action`, add a Send button (the `<>...</>` already wraps Copy + Open — add a third button):

```jsx
            <Button color="inherit" size="small" startIcon={<Send />} disabled={busy}
              onClick={() => run(() => reportAPI.sendReport(id), 'Report sent to stakeholders')}>Send to stakeholders</Button>
```

(`Send` is already imported in the review page; `reportAPI` and `run` are already in scope.)

- [ ] **Step 2: Commit**

```bash
git add src/pages/reports/ReportReviewPage.js
git commit -m "feat(reports): send approved report to stakeholders from review screen" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verify (tests + build + manual smoke)

- [ ] **Step 1: Unit tests.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState|utils/review|reportShare|reportCatalog|ReportBlockRenderer"` → all green (builderState now 11).

- [ ] **Step 2: Build.** `CI=false npm run build` → "Compiled successfully" (no ERRORS; warnings OK). Fix any compile error and re-run.

- [ ] **Step 3: Manual smoke** (Phase 4a backend running with `EMAIL_*` set):
  - In the builder, click **Schedule & delivery** → enable a schedule (weekly/monthly/quarterly + day/time), choose **Hold for review** or **Send automatically**, add a recipient (a real test inbox) → **Done** → **Save**.
  - Open a report → review → **Approve** → on the approved banner click **Send to stakeholders** → toast "Sent to 1/1 recipients"; the test inbox receives the email with the `/r/:slug` link → opening it (email-gated) renders the report and shows the viewer as a **Recipient** (matched) in the open-rate dashboard.
  - (Optional) Set a near-future schedule + watch the backend cron logs generate the instance and route it to review/auto-send.
  Record results.

- [ ] **Step 4: Final commit** (only if Step 3 surfaced small fixes).

---

## Self-Review

**1. Spec coverage (Phase 4 frontend):** schedule config (weekly/monthly/quarterly + day/time/timezone) → Tasks 2,3,4 ✅; recipient list (stakeholder emails) → Task 3 ✅; delivery mode (review-then-send vs auto) → Task 3 ✅; manual send of an approved report → Tasks 1,5 ✅; persists via existing Save (`buildTemplatePayload`) → Task 2 ✅.

**2. Placeholder scan:** complete code + exact commands; manual smoke is explicit verification. ✅

**3. Type/name consistency:** `actions.setSchedule/setDelivery` + state `schedule`/`delivery` (Task 2) used by `ScheduleDeliveryDialog` (Tasks 3,4). `reportAPI.sendReport` (Task 1) used in the review screen (Task 5). `ScheduleDeliveryDialog` props (`open, schedule, delivery, onScheduleChange, onDeliveryChange, onClose`) match the builder's usage. `buildTemplatePayload` now includes schedule/delivery → the existing Save persists them; the backend computes `nextRunAt` (Phase 4a Task 5). ✅

**4. Convention match:** MUI v5 dialog/Grid/Switch; builder dispatches to the existing reducer; review screen reuses `run`/`reportAPI`. ✅

**Known limitations (documented):** the dialog/builder/send wiring is verified by build + manual smoke (RTL of dialogs is brittle); the reducer additions are unit-tested. Day-of-month is capped at 28 (avoids 29–31 edge cases), matching the backend helper. Reviewers picker is omitted from the dialog v1 (the cron notifies all `reports:approve` holders) — can be added later.

---

## Execution Handoff

After 4b, **Phase 4 is complete and the feature is end-to-end**: build → schedule → generate (cron) → review/approve (or auto-send) → email the tracked public link to stakeholders → see who opened it. Remaining is **Phase 5 (future):** PDF export/attachment, OTP-verified gate, per-recipient unique links, and an AI-written narrative block.

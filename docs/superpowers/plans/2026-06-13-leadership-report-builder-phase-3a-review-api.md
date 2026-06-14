# Leadership Report Builder — Phase 3a (Review & Approve API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a governed review workflow to generated reports — submit for review, override or flag values, request changes, and approve — driving internal alerts through the in-app notification system, and gate public visibility on approval.

**Architecture:** Extends the `reports` domain. A pure review state machine and a pure `applyOverrides` transform are TDD'd; thin DB controllers run the transitions, append overrides/flags, and fire **in-app notifications** (`notificationService`). The Phase 2 public controller is tightened to serve only `approved` reports and to apply overrides on read. **Email is intentionally NOT used here** — the backend's email service is currently non-functional (`nodemailer`/`date-fns` not installed; `emailService.js` calls `nodemailer.createTransporter`, which is not a function). Internal alerts therefore use in-app notifications (reliable, used across the app); real email is deferred to Phase 4, which must install + fix the email infra before it can email external stakeholders.

**Tech Stack:** Node.js (ESM), Express, Mongoose 8, `express-async-handler`, `notificationService`, Jest 29 (`npm run test:unit`).

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-backend`. Paths relative to that root.

**Depends on (on `main`):** `ReportInstance` (fields `review.status` enum `draft|in_review|changes_requested|approved`, `overrides[]`, `flags[]`, `blocks[]`, `createdBy`, `organization`, `publicSlug`, `expiresAt`); `reports:manage`/`reports:approve` permissions; `notificationService.createNotification`/`notifyUsersWithPermission`; `notificationModel` (`NOTIFICATION_TYPES`, `RELATED_ENTITY_TYPES`); Phase 2 `controllers/publicReportController.js`.

**Scope note:** Phase 3 = **3a (this — backend)** + **3b (review UI)**. 3a produces testable software: the review state machine + override/flag endpoints + approval-gated public access, with green unit tests on the pure helpers.

**Notification API (verbatim):**
- `createNotification({ organization, recipient, type, title, message, actionUrl, relatedEntity:{entityType,entityId,displayLabel}, priority, actor })` → notification|null (handles self-suppression + per-user prefs).
- `notifyUsersWithPermission({ organizationId, permission, excludeUserIds, type, title, message, actionUrl, relatedEntity, actor })` → `{ sent }`.

---

## File Structure

**New files:**
- `services/reports/reviewState.js` — pure `nextReviewStatus(current, action)`, `applyOverrides(blocks, overrides)`.
- `tests/unit/reviewState.test.js`
- `controllers/reportReviewController.js` — submit/approve/request-changes/override/flag/resolve-flag.

**Modified files:**
- `models/notificationModel.js` — add report notification types + `ReportInstance` related-entity type.
- `routes/reportRoutes.js` — add review routes.
- `controllers/publicReportController.js` — require `approved`; apply overrides on read.

---

## Task 1: Review state machine + override transform (pure, TDD)

**Files:** Create `services/reports/reviewState.js`, `tests/unit/reviewState.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: tests/unit/reviewState.test.js
import { nextReviewStatus, applyOverrides } from '../../services/reports/reviewState.js';

describe('nextReviewStatus', () => {
  it('allows the legal transitions', () => {
    expect(nextReviewStatus('draft', 'submit')).toBe('in_review');
    expect(nextReviewStatus('in_review', 'approve')).toBe('approved');
    expect(nextReviewStatus('in_review', 'request_changes')).toBe('changes_requested');
    expect(nextReviewStatus('changes_requested', 'submit')).toBe('in_review');
  });
  it('returns null for illegal transitions', () => {
    expect(nextReviewStatus('draft', 'approve')).toBeNull();
    expect(nextReviewStatus('approved', 'approve')).toBeNull();
    expect(nextReviewStatus('approved', 'submit')).toBeNull();
    expect(nextReviewStatus('in_review', 'submit')).toBeNull();
    expect(nextReviewStatus('whatever', 'submit')).toBeNull();
  });
});

describe('applyOverrides', () => {
  const blocks = [
    { id: 'b1', type: 'kpi.revenue', data: { value: 100, unit: 'currency' } },
    { id: 'b2', type: 'text.note', data: { text: 'hi' } },
  ];
  it('applies an override to the targeted block/field without touching others', () => {
    const out = applyOverrides(blocks, [{ blockId: 'b1', fieldPath: 'data.value', newValue: 250 }]);
    expect(out[0].data.value).toBe(250);
    expect(out[0].data.unit).toBe('currency'); // sibling preserved
    expect(out[1].data.text).toBe('hi');       // other block untouched
  });
  it('does not mutate the input blocks', () => {
    applyOverrides(blocks, [{ blockId: 'b1', fieldPath: 'data.value', newValue: 999 }]);
    expect(blocks[0].data.value).toBe(100);
  });
  it('returns the blocks unchanged when there are no overrides', () => {
    expect(applyOverrides(blocks, [])).toBe(blocks);
    expect(applyOverrides(blocks, undefined)).toBe(blocks);
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- reviewState` → module not found.

- [ ] **Step 3: Implement**

```js
// File: services/reports/reviewState.js
// Pure review state machine + override transform. No I/O.

// Legal transitions: current status → { action: nextStatus }
const TRANSITIONS = {
  draft: { submit: 'in_review' },
  in_review: { approve: 'approved', request_changes: 'changes_requested' },
  changes_requested: { submit: 'in_review' },
  approved: {}, // terminal w.r.t. these actions
};

/** Return the next review status for an action, or null if the transition is illegal. */
export const nextReviewStatus = (current, action) => TRANSITIONS[current]?.[action] ?? null;

// Set a dotted path on a deep-cloned object (block data is JSON-safe).
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

/**
 * Apply review overrides to snapshot blocks. Pure — returns a new array (or the
 * same reference if there are no overrides). Each override = { blockId, fieldPath, newValue }.
 */
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

- [ ] **Step 4: Run → pass.** `npm run test:unit -- reviewState` → PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add services/reports/reviewState.js tests/unit/reviewState.test.js
git commit -m "feat(reports): add review state machine + override transform" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Notification types for reports

**Files:** Modify `models/notificationModel.js`
**Test:** `tests/unit/reportNotificationTypes.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: tests/unit/reportNotificationTypes.test.js
import mongoose from 'mongoose';
import Notification, { NOTIFICATION_TYPES, RELATED_ENTITY_TYPES } from '../../models/notificationModel.js';

describe('report notification types', () => {
  it('registers the report workflow types', () => {
    expect(NOTIFICATION_TYPES).toEqual(expect.arrayContaining([
      'report_ready_for_review', 'report_approved', 'report_changes_requested', 'report_flag_raised',
    ]));
    expect(RELATED_ENTITY_TYPES).toContain('ReportInstance');
  });
  it('a report notification validates', () => {
    const n = new Notification({
      organization: new mongoose.Types.ObjectId(),
      recipient: new mongoose.Types.ObjectId(),
      type: 'report_flag_raised',
      title: 'A value was flagged',
      relatedEntity: { entityType: 'ReportInstance', entityId: new mongoose.Types.ObjectId() },
    });
    expect(n.validateSync()).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- reportNotificationTypes` → FAIL (enum value not allowed / type missing).

- [ ] **Step 3: Add the types.** In `models/notificationModel.js`, append to the `NOTIFICATION_TYPES` array (before its closing `]`), with a section comment matching the file's style:

```js
  // Leadership Report Builder (Phase 3) — review workflow
  'report_ready_for_review',   // → approvers: a report was submitted for review
  'report_approved',           // → author: their report was approved
  'report_changes_requested',  // → author: a reviewer requested changes
  'report_flag_raised',        // → data owner: a value was flagged for correction
```

And add `'ReportInstance'` to the `RELATED_ENTITY_TYPES` array:

```js
  // Leadership Report Builder
  'ReportInstance',
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- reportNotificationTypes` → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/notificationModel.js tests/unit/reportNotificationTypes.test.js
git commit -m "feat(reports): add report review notification types" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Review controller

**Files:** Create `controllers/reportReviewController.js`

**Context:** Thin DB orchestration over the Task 1 helpers + `notificationService`. Org-scoped. Overrides/flags are only mutable while the report is NOT `approved` (approval locks the snapshot). Not unit-tested (verified by `node --check` + import + manual smoke).

- [ ] **Step 1: Create the controller**

```js
// File: controllers/reportReviewController.js
// Description: Review & approval workflow for generated report instances.
// Internal alerts go through the in-app notification system (email is Phase 4).

import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import ReportInstance from '../models/reportInstanceModel.js';
import { nextReviewStatus } from '../services/reports/reviewState.js';
import { createNotification, notifyUsersWithPermission } from '../services/notificationService.js';

const findOwned = async (req) => {
  const instance = await ReportInstance.findOne({ _id: req.params.id, organization: req.user.organization });
  if (!instance) { req.res.status(404); throw new Error('Report not found'); }
  return instance;
};

const relatedEntity = (instance) => ({
  entityType: 'ReportInstance', entityId: instance._id, displayLabel: instance.title || 'Report',
});

/**
 * @desc    Submit a report for review (draft|changes_requested → in_review)
 * @route   POST /api/reports/instances/:id/submit-review
 * @access  Private (reports:manage)
 */
export const submitForReview = asyncHandler(async (req, res) => {
  const instance = await findOwned(req);
  const next = nextReviewStatus(instance.review?.status || 'draft', 'submit');
  if (!next) { res.status(409); throw new Error(`Cannot submit a report that is '${instance.review?.status}'`); }

  instance.review.status = next;
  instance.review.submittedBy = req.user._id;
  await instance.save();

  await notifyUsersWithPermission({
    organizationId: req.user.organization,
    permission: 'reports:approve',
    excludeUserIds: [req.user._id],
    type: 'report_ready_for_review',
    title: 'A report is ready for review',
    message: `${instance.title || 'A report'} was submitted and is awaiting approval.`,
    actionUrl: `/reports/generated/${instance._id}/review`,
    relatedEntity: relatedEntity(instance),
    actor: req.user._id,
  });

  res.json({ success: true, data: instance, message: 'Submitted for review' });
});

/**
 * @desc    Approve a report (in_review → approved). Locks the snapshot.
 * @route   POST /api/reports/instances/:id/approve
 * @access  Private (reports:approve)
 */
export const approveReport = asyncHandler(async (req, res) => {
  const instance = await findOwned(req);
  const next = nextReviewStatus(instance.review?.status, 'approve');
  if (!next) { res.status(409); throw new Error(`Cannot approve a report that is '${instance.review?.status}'`); }

  instance.review.status = next;
  instance.review.approvedBy = req.user._id;
  instance.review.approvedAt = new Date();
  if (req.body?.notes) instance.review.notes = req.body.notes;
  await instance.save();

  await createNotification({
    organization: req.user.organization,
    recipient: instance.createdBy,
    type: 'report_approved',
    title: 'Your report was approved',
    message: `${instance.title || 'Your report'} was approved and can now be shared.`,
    actionUrl: `/reports/generated/${instance._id}`,
    relatedEntity: relatedEntity(instance),
    actor: req.user._id,
  });

  res.json({ success: true, data: instance, message: 'Report approved' });
});

/**
 * @desc    Request changes (in_review → changes_requested)
 * @route   POST /api/reports/instances/:id/request-changes
 * @access  Private (reports:approve)
 */
export const requestChanges = asyncHandler(async (req, res) => {
  const instance = await findOwned(req);
  const next = nextReviewStatus(instance.review?.status, 'request_changes');
  if (!next) { res.status(409); throw new Error(`Cannot request changes on a report that is '${instance.review?.status}'`); }

  instance.review.status = next;
  instance.review.reviewedBy = req.user._id;
  if (req.body?.notes) instance.review.notes = req.body.notes;
  await instance.save();

  await createNotification({
    organization: req.user.organization,
    recipient: instance.createdBy,
    type: 'report_changes_requested',
    title: 'Changes requested on your report',
    message: req.body?.notes ? `Reviewer note: ${req.body.notes}` : `${instance.title || 'Your report'} needs changes before approval.`,
    actionUrl: `/reports/generated/${instance._id}/review`,
    relatedEntity: relatedEntity(instance),
    actor: req.user._id,
  });

  res.json({ success: true, data: instance, message: 'Changes requested' });
});

/**
 * @desc    Add an override to a (non-approved) report's snapshot value
 * @route   POST /api/reports/instances/:id/overrides   body: { blockId, fieldPath, originalValue, newValue, reason }
 * @access  Private (reports:manage)
 */
export const addOverride = asyncHandler(async (req, res) => {
  const { blockId, fieldPath, originalValue, newValue, reason } = req.body || {};
  if (!blockId || !fieldPath) { res.status(400); throw new Error('blockId and fieldPath are required'); }

  const instance = await findOwned(req);
  if (instance.review?.status === 'approved') { res.status(409); throw new Error('Approved reports are locked'); }

  instance.overrides.push({
    id: crypto.randomUUID(), blockId, fieldPath, originalValue, newValue, reason, by: req.user._id, at: new Date(),
  });
  await instance.save();
  res.status(201).json({ success: true, data: instance, message: 'Override added' });
});

/**
 * @desc    Flag a value and notify the assigned owner to fix the source data
 * @route   POST /api/reports/instances/:id/flags   body: { blockId, note, severity, assignedTo }
 * @access  Private (reports:manage)
 */
export const addFlag = asyncHandler(async (req, res) => {
  const { blockId, note, severity, assignedTo } = req.body || {};
  if (!note) { res.status(400); throw new Error('A flag note is required'); }

  const instance = await findOwned(req);
  if (instance.review?.status === 'approved') { res.status(409); throw new Error('Approved reports are locked'); }

  const flag = {
    id: crypto.randomUUID(), blockId, note, severity: severity || 'warn',
    assignedTo: assignedTo || undefined, status: 'open', createdBy: req.user._id, createdAt: new Date(),
  };
  instance.flags.push(flag);
  await instance.save();

  if (assignedTo) {
    await createNotification({
      organization: req.user.organization,
      recipient: assignedTo,
      type: 'report_flag_raised',
      title: 'A report value was flagged for you',
      message: `${instance.title || 'A report'}: ${note}`,
      actionUrl: `/reports/generated/${instance._id}/review`,
      relatedEntity: relatedEntity(instance),
      actor: req.user._id,
    });
  }

  res.status(201).json({ success: true, data: instance, message: 'Flag added' });
});

/**
 * @desc    Resolve a flag
 * @route   PATCH /api/reports/instances/:id/flags/:flagId
 * @access  Private (reports:manage)
 */
export const resolveFlag = asyncHandler(async (req, res) => {
  const instance = await findOwned(req);
  const flag = instance.flags.find((f) => f.id === req.params.flagId);
  if (!flag) { res.status(404); throw new Error('Flag not found'); }
  flag.status = 'resolved';
  flag.resolvedAt = new Date();
  await instance.save();
  res.json({ success: true, data: instance, message: 'Flag resolved' });
});
```

- [ ] **Step 2: Syntax check.** `node --check controllers/reportReviewController.js` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add controllers/reportReviewController.js
git commit -m "feat(reports): add review/approve/override/flag controller" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Review routes

**Files:** Modify `routes/reportRoutes.js`

- [ ] **Step 1: Add the import**

```js
import {
  submitForReview, approveReport, requestChanges, addOverride, addFlag, resolveFlag,
} from '../controllers/reportReviewController.js';
```

- [ ] **Step 2: Add the routes** (after the existing `/instances/:id/analytics` line):

```js
// Review & approval workflow
router.post('/instances/:id/submit-review', hasPermission(PERMISSIONS.REPORTS.MANAGE), submitForReview);
router.post('/instances/:id/approve', hasPermission(PERMISSIONS.REPORTS.APPROVE), approveReport);
router.post('/instances/:id/request-changes', hasPermission(PERMISSIONS.REPORTS.APPROVE), requestChanges);
router.post('/instances/:id/overrides', hasPermission(PERMISSIONS.REPORTS.MANAGE), addOverride);
router.post('/instances/:id/flags', hasPermission(PERMISSIONS.REPORTS.MANAGE), addFlag);
router.patch('/instances/:id/flags/:flagId', hasPermission(PERMISSIONS.REPORTS.MANAGE), resolveFlag);
```

- [ ] **Step 3: Verify.** `node --check routes/reportRoutes.js` → exit 0; `node --input-type=module -e "import('./routes/reportRoutes.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK.

- [ ] **Step 4: Commit**

```bash
git add routes/reportRoutes.js
git commit -m "feat(reports): wire review workflow routes" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Approval-gate public access + apply overrides on read

**Files:** Modify `controllers/publicReportController.js`

**Context:** Tightens Phase 2 — the public page now serves ONLY `approved` reports (an unapproved/draft report's slug returns 404, indistinguishable from a missing report), and applies review overrides to the snapshot so viewers see corrected values.

- [ ] **Step 1: Import the override transform.** Add at the top of `controllers/publicReportController.js`:

```js
import { applyOverrides } from '../services/reports/reviewState.js';
```

- [ ] **Step 2: Add an approval guard.** Add this helper near the existing `isExpired`:

```js
const isPubliclyViewable = (instance) =>
  instance.review?.status === 'approved' && !isExpired(instance);
```

- [ ] **Step 3: Gate both handlers.** In `getPublicReportMeta`, replace the expiry check block:

```js
  if (isExpired(instance)) { res.status(410); throw new Error('This report link has expired'); }
```

with:

```js
  if (isExpired(instance)) { res.status(410); throw new Error('This report link has expired'); }
  if (instance.review?.status !== 'approved') { res.status(404); throw new Error('Report not found'); }
```

Apply the **same two added lines** in `accessPublicReport` (right after its existing `isExpired` check).

- [ ] **Step 4: Apply overrides to the returned blocks.** In `accessPublicReport`, change the response `blocks` line from:

```js
      blocks: withKind(instance.blocks),
```

to:

```js
      blocks: applyOverrides(withKind(instance.blocks), instance.overrides || []),
```

(`withKind` enriches `kind`; `applyOverrides` then patches any reviewer-corrected values. Order matters — enrich first, then override.)

- [ ] **Step 5: Verify.** `node --check controllers/publicReportController.js` → exit 0; `node --input-type=module -e "import('./routes/publicReportRoutes.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK.

- [ ] **Step 6: Commit**

```bash
git add controllers/publicReportController.js
git commit -m "feat(reports): gate public reports on approval + apply overrides on read" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verify + manual smoke (documented)

- [ ] **Step 1: Full unit suite.** `npm run test:unit` → all green (incl. `reviewState` + `reportNotificationTypes`; expect 64 tests).

- [ ] **Step 2: Manual smoke** (server running; leadership token; a generated instance id + slug from Phase 1/2):

```bash
ID=<instanceId>; SLUG=<publicSlug>; TOKEN=<jwt-with-reports:approve>
# Before approval, the public link is hidden:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/public/reports/$SLUG   # → 404
# Add an override + a flag (manage):
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"blockId":"<blockId>","fieldPath":"data.value","originalValue":100,"newValue":250,"reason":"Excludes cancelled deal"}' \
  http://localhost:3000/api/reports/instances/$ID/overrides | head -c 120   # → 201
# Submit → approve:
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/reports/instances/$ID/submit-review | head -c 120
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/reports/instances/$ID/approve | head -c 120
# Now the public link works AND shows the overridden value:
curl -s -X POST -H "Content-Type: application/json" -d '{"email":"investor@example.com"}' \
  http://localhost:3000/api/public/reports/$SLUG/access | grep -o '"value":250'   # → "value":250
```

- [ ] **Step 3:** Confirm: draft slug → 404; override/flag accepted (201); submit then approve succeed (and the approver/author get in-app notifications); after approval the public access returns the overridden value. Record results. (Defer if no running server.)

---

## Self-Review

**1. Spec coverage (Phase 3 backend):** review state machine (draft→in_review→changes_requested→approved) → Tasks 1,3,4 ✅; override-in-snapshot (source untouched) → Tasks 1,3,5 ✅; flag→notify owner → Tasks 2,3 ✅; internal "ready for review"/"approved"/"changes" alerts (in-app) → Tasks 2,3 ✅; approval-gated public visibility (the Phase 2 deferred item) → Task 5 ✅. (Email alerts → Phase 4, with the email-infra fix.)

**2. Placeholder scan:** complete code + exact commands; manual smoke is explicit verification. ✅

**3. Type/name consistency:** `nextReviewStatus`/`applyOverrides` (Task 1) consumed by `reportReviewController` (Task 3) and `publicReportController` (Task 5). The six review handlers exported (Task 3) → imported in `reportRoutes` (Task 4). New notification types (Task 2) used by the controller (Task 3). `createNotification`/`notifyUsersWithPermission` param shapes match the service. `PERMISSIONS.REPORTS.MANAGE`/`APPROVE` exist (Phase 0). `ReportInstance.review`/`overrides`/`flags` subschemas exist (Phase 0). ✅

**4. Convention match:** `asyncHandler` + `{success,data}` + org-scoped `findOne`; `409` for illegal state transitions; notification calls mirror existing `notify*` helpers. ✅

**Notes:** `findOwned` uses `req.res` to set status before throwing inside a helper — acceptable in Express/asyncHandler (the thrown error is caught and the pre-set status is respected by the error handler, the same pattern `protect` uses). Overrides apply only to JSON-safe `data` values (the snapshot is plain JSON). Approval locks overrides/flags (409). **Deferred to Phase 4:** emailing approvers/author/stakeholders (requires installing `nodemailer`+`date-fns`, fixing `emailService.createTransport`, and SMTP env).

---

## Execution Handoff

After 3a, **Phase 3b (Review UI)**: a review screen (`/reports/generated/:id/review`) that renders the snapshot via `ReportBlockRenderer` with per-block Override/Flag controls, a flags side panel, the review state shown with Submit/Approve/Request-changes actions (Approve gated by `reports:approve`), an override dialog and a flag dialog (owner picker via `userAPI.getUsers`), and surfacing the public share link only once `approved`.

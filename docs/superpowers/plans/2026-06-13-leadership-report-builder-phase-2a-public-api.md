# Leadership Report Builder — Phase 2a (Public API + Tracking) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve a generated report at a public, unauthenticated URL behind a lightweight email gate, log each viewer for open-rate tracking, and expose authenticated endpoints so the creator can list generated reports and see who opened them.

**Architecture:** A new **public** route group (`/api/public/reports`, no `protect`, rate-limited, expiry-checked) reads a frozen `ReportInstance` by `publicSlug`, enriches each block with its `kind` from the registry on read (so the catalog-less public page can render), logs/updates a `ReportView` (upsert by instance+email), and recomputes the instance's denormalized `stats`. Pure helpers (`classifyViewer`, `computeInstanceStats`) are TDD'd; thin DB controllers orchestrate. Authenticated `instances` endpoints (list / detail / analytics) are added under the existing `/api/reports`.

**Tech Stack:** Node.js (ESM), Express, Mongoose 8, `express-async-handler`, `express-rate-limit`, `crypto` (SHA-256 IP hashing), Jest 29 (`npm run test:unit`).

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-backend`. Paths relative to that root.

**Depends on (Phase 0/1, on `main`):** `ReportInstance` (fields `publicSlug`, `gate`, `expiresAt`, `stats.*`, `distribution.recipients`, `blocks[]`, `theme`, `images[]`, `title`, `periodLabel`), `ReportView` (unique index `{reportInstance, email}`, fields incl. `matchedRecipient`/`isForwarded`/`ipHash`/`viewCount`), `blockRegistry.getBlock`, `reports:view` permission, `routes/reportRoutes.js`.

**Scope note:** Phase 2 = **2a (this — backend)** + **2b (public page + open-rate UI)**. 2a produces testable software: working public access/tracking endpoints + creator analytics endpoints, with green unit tests on the pure tracking helpers and import/`node --check` verification of wiring.

**Conventions (verbatim from the repo):**
- Public route group mounts with NO `protect` (like `app.use('/api/invitations', ...)`); global middleware is helmet/cors/json/sanitize/xss/hpp only — no global auth.
- Rate limiter: `import rateLimit from 'express-rate-limit'; const xLimiter = rateLimit({ windowMs, max, message:{success,message,code,retryAfter}, standardHeaders:true, legacyHeaders:false, keyGenerator })`.
- Client IP: `req.ip` (fallback `req.connection?.remoteAddress`).
- Controllers: `asyncHandler`, `res.status(N); throw new Error(...)`, `{ success, data }` envelope.

---

## File Structure

**New files:**
- `services/reports/viewTracking.js` — pure `classifyViewer(email, recipientEmails)`, `computeInstanceStats(views)`.
- `tests/unit/viewTracking.test.js`
- `controllers/publicReportController.js` — `getPublicReportMeta`, `accessPublicReport`.
- `controllers/reportInstanceController.js` — `getInstances`, `getInstanceById`, `getInstanceAnalytics`.
- `routes/publicReportRoutes.js` — public, rate-limited.

**Modified files:**
- `routes/reportRoutes.js` — add authenticated `/instances` routes.
- `server.js` — mount `publicReportRoutes` at `/api/public/reports`.

---

## Task 1: View-tracking helpers (pure, TDD)

**Files:** Create `services/reports/viewTracking.js`, `tests/unit/viewTracking.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: tests/unit/viewTracking.test.js
import { classifyViewer, computeInstanceStats } from '../../services/reports/viewTracking.js';

describe('classifyViewer', () => {
  it('flags a known recipient as matched (case-insensitive)', () => {
    expect(classifyViewer('Boss@Corp.com', ['boss@corp.com', 'cfo@corp.com']))
      .toEqual({ matchedRecipient: true, isForwarded: false });
  });
  it('flags an unknown email as forwarded', () => {
    expect(classifyViewer('stranger@x.com', ['boss@corp.com']))
      .toEqual({ matchedRecipient: false, isForwarded: true });
  });
  it('treats empty recipient list as all-forwarded', () => {
    expect(classifyViewer('a@b.com', [])).toEqual({ matchedRecipient: false, isForwarded: true });
    expect(classifyViewer('a@b.com', undefined)).toEqual({ matchedRecipient: false, isForwarded: true });
  });
});

describe('computeInstanceStats', () => {
  it('rolls up unique viewers, total views, matched/forwarded, and first/last open', () => {
    const d1 = new Date('2026-06-01T10:00:00Z');
    const d2 = new Date('2026-06-03T12:00:00Z');
    const d3 = new Date('2026-06-02T09:00:00Z');
    const views = [
      { email: 'boss@corp.com', matchedRecipient: true, isForwarded: false, viewCount: 3, firstViewedAt: d1, lastViewedAt: d2 },
      { email: 'x@y.com', matchedRecipient: false, isForwarded: true, viewCount: 1, firstViewedAt: d3, lastViewedAt: d3 },
    ];
    expect(computeInstanceStats(views)).toEqual({
      uniqueViewers: 2,
      totalViews: 4,
      recipientsOpened: 1,
      forwardedOpens: 1,
      firstOpenAt: d1,
      lastOpenAt: d2,
    });
  });
  it('returns zeroed stats for no views', () => {
    expect(computeInstanceStats([])).toEqual({
      uniqueViewers: 0, totalViews: 0, recipientsOpened: 0, forwardedOpens: 0, firstOpenAt: null, lastOpenAt: null,
    });
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- viewTracking` → module not found.

- [ ] **Step 3: Implement**

```js
// File: services/reports/viewTracking.js
// Pure helpers for public report view tracking. No I/O.

/**
 * Classify a viewer email against the report's intended recipient list.
 * Matching is case-insensitive. An empty/absent recipient list means we can't
 * attribute the view to a known stakeholder → treated as forwarded.
 * @returns {{ matchedRecipient: boolean, isForwarded: boolean }}
 */
export const classifyViewer = (email, recipientEmails) => {
  const set = new Set((recipientEmails || []).map((e) => String(e).toLowerCase().trim()));
  const matched = set.has(String(email || '').toLowerCase().trim());
  return { matchedRecipient: matched, isForwarded: !matched };
};

/**
 * Roll up ReportView documents into the instance's denormalized stats block.
 * @param {Array} views - ReportView-like objects
 * @returns {{ uniqueViewers, totalViews, recipientsOpened, forwardedOpens, firstOpenAt, lastOpenAt }}
 */
export const computeInstanceStats = (views = []) => {
  if (!views.length) {
    return { uniqueViewers: 0, totalViews: 0, recipientsOpened: 0, forwardedOpens: 0, firstOpenAt: null, lastOpenAt: null };
  }
  let totalViews = 0, recipientsOpened = 0, forwardedOpens = 0;
  let firstOpenAt = null, lastOpenAt = null;
  for (const v of views) {
    totalViews += v.viewCount || 0;
    if (v.matchedRecipient) recipientsOpened += 1;
    if (v.isForwarded) forwardedOpens += 1;
    if (v.firstViewedAt && (!firstOpenAt || v.firstViewedAt < firstOpenAt)) firstOpenAt = v.firstViewedAt;
    if (v.lastViewedAt && (!lastOpenAt || v.lastViewedAt > lastOpenAt)) lastOpenAt = v.lastViewedAt;
  }
  return { uniqueViewers: views.length, totalViews, recipientsOpened, forwardedOpens, firstOpenAt, lastOpenAt };
};
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- viewTracking` → PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add services/reports/viewTracking.js tests/unit/viewTracking.test.js
git commit -m "feat(reports): add pure view-tracking helpers" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Public report controller

**Files:** Create `controllers/publicReportController.js`

**Context:** Two unauthenticated handlers. `kind` is enriched on read from the registry (so the catalog-less public page can render). Thin DB orchestration over the Task 1 pure helpers; not unit-tested (verified by `node --check` + import + manual smoke).

- [ ] **Step 1: Create the controller**

```js
// File: controllers/publicReportController.js
// Description: Unauthenticated endpoints that serve a frozen report behind an
// email gate and log viewers for open-rate tracking.

import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import ReportInstance from '../models/reportInstanceModel.js';
import ReportView from '../models/reportViewModel.js';
import { getBlock } from '../services/reports/blockRegistry.js';
import { classifyViewer, computeInstanceStats } from '../services/reports/viewTracking.js';

const hashIp = (ip) => crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex');

const isExpired = (instance) => instance.expiresAt && instance.expiresAt.getTime() < Date.now();

// Enrich each frozen block with its rendering `kind` from the registry (the public
// page has no block catalog). Strips nothing; just adds `kind`.
const withKind = (blocks = []) =>
  blocks.map((b) => {
    const plain = typeof b.toObject === 'function' ? b.toObject() : b;
    return { ...plain, kind: getBlock(plain.type)?.kind || null };
  });

/**
 * @desc    Public: fetch report meta + gate type (no data until the gate is passed)
 * @route   GET /api/public/reports/:slug
 * @access  Public
 */
export const getPublicReportMeta = asyncHandler(async (req, res) => {
  const instance = await ReportInstance.findOne({ publicSlug: req.params.slug });
  if (!instance) { res.status(404); throw new Error('Report not found'); }
  if (isExpired(instance)) { res.status(410); throw new Error('This report link has expired'); }

  res.json({
    success: true,
    data: {
      title: instance.title,
      periodLabel: instance.periodLabel,
      gate: instance.gate || 'email',
      theme: instance.theme || {},
    },
  });
});

/**
 * @desc    Public: pass the email gate, log the view, return the frozen snapshot
 * @route   POST /api/public/reports/:slug/access   body: { email }
 * @access  Public
 */
export const accessPublicReport = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    res.status(400); throw new Error('A valid email is required to view this report');
  }

  const instance = await ReportInstance.findOne({ publicSlug: req.params.slug });
  if (!instance) { res.status(404); throw new Error('Report not found'); }
  if (isExpired(instance)) { res.status(410); throw new Error('This report link has expired'); }

  const normEmail = String(email).toLowerCase().trim();
  const recipientEmails = (instance.distribution?.recipients || []).map((r) => r.email);
  const { matchedRecipient, isForwarded } = classifyViewer(normEmail, recipientEmails);
  const now = new Date();

  // Upsert one ReportView per (instance, email); increment viewCount on repeats.
  await ReportView.findOneAndUpdate(
    { reportInstance: instance._id, email: normEmail },
    {
      $setOnInsert: {
        organization: instance.organization,
        reportInstance: instance._id,
        publicSlug: instance.publicSlug,
        email: normEmail,
        matchedRecipient,
        isForwarded,
        firstViewedAt: now,
      },
      $set: { lastViewedAt: now, ipHash: hashIp(req.ip), userAgent: req.get('User-Agent') || '' },
      $inc: { viewCount: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recompute denormalized stats from all views (low volume; correctness over cleverness).
  const views = await ReportView.find({ reportInstance: instance._id }).lean();
  instance.stats = computeInstanceStats(views);
  await instance.save();

  res.json({
    success: true,
    data: {
      title: instance.title,
      periodLabel: instance.periodLabel,
      theme: instance.theme || {},
      images: instance.images || [],
      blocks: withKind(instance.blocks),
    },
  });
});
```

- [ ] **Step 2: Syntax check.** `node --check controllers/publicReportController.js` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add controllers/publicReportController.js
git commit -m "feat(reports): add public report access + view-logging controller" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Public routes + mount

**Files:** Create `routes/publicReportRoutes.js`; modify `server.js`

- [ ] **Step 1: Create the public route file**

```js
// File: routes/publicReportRoutes.js
// Description: Unauthenticated, rate-limited routes for viewing a shared report.
// NO `protect` — access is controlled by the unguessable slug + email gate + expiry.

import express from 'express';
import rateLimit from 'express-rate-limit';
import { getPublicReportMeta, accessPublicReport } from '../controllers/publicReportController.js';

const router = express.Router();

const reportViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // generous: legitimate viewers may refresh; throttles slug-guessing
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'REPORT_VIEW_RATE_LIMITED',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.params.slug || 'unknown'}_${req.ip}`,
});

router.get('/:slug', reportViewLimiter, getPublicReportMeta);
router.post('/:slug/access', reportViewLimiter, accessPublicReport);

export default router;
```

- [ ] **Step 2: Mount in server.js.** Add the import next to the other route imports (after `import reportRoutes ...`):

```js
import publicReportRoutes from './routes/publicReportRoutes.js';
```

Add the mount near the other `/api/...` mounts (e.g. right after `app.use('/api/reports', reportRoutes);`):

```js
app.use('/api/public/reports', publicReportRoutes);
```

- [ ] **Step 3: Verify wiring.**
- `node --check routes/publicReportRoutes.js server.js` → exit 0.
- `node --input-type=module -e "import('./routes/publicReportRoutes.js').then(() => console.log('publicReportRoutes import OK')).catch((e) => { console.error(e); process.exit(1); })"` → `publicReportRoutes import OK`.

- [ ] **Step 4: Commit**

```bash
git add routes/publicReportRoutes.js server.js
git commit -m "feat(reports): mount public report routes (no auth, rate-limited)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Authenticated instances + analytics endpoints

**Files:** Create `controllers/reportInstanceController.js`; modify `routes/reportRoutes.js`

**Context:** Lets the creator list generated reports, view one, and see open-rate analytics. Org-scoped like all authenticated controllers. `reports:view` gate.

- [ ] **Step 1: Create the controller**

```js
// File: controllers/reportInstanceController.js
// Description: Authenticated read endpoints for generated report instances + open-rate analytics.

import asyncHandler from 'express-async-handler';
import ReportInstance from '../models/reportInstanceModel.js';
import ReportView from '../models/reportViewModel.js';

/**
 * @desc    List generated report instances for the org (paginated, newest first)
 * @route   GET /api/reports/instances
 * @access  Private (reports:view)
 */
export const getInstances = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, template } = req.query;
  const query = { organization: req.user.organization };
  if (template) query.template = template;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [instances, total] = await Promise.all([
    ReportInstance.find(query)
      .select('title periodLabel publicSlug gate expiresAt review.status distribution.status stats createdAt template')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip),
    ReportInstance.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);
  res.json({
    success: true,
    data: {
      instances,
      pagination: { total, currentPage: pageNum, totalPages, hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum },
    },
  });
});

/**
 * @desc    Get a single generated instance (full snapshot, for an internal preview)
 * @route   GET /api/reports/instances/:id
 * @access  Private (reports:view)
 */
export const getInstanceById = asyncHandler(async (req, res) => {
  const instance = await ReportInstance.findOne({ _id: req.params.id, organization: req.user.organization });
  if (!instance) { res.status(404); throw new Error('Report not found'); }
  res.json({ success: true, data: instance });
});

/**
 * @desc    Open-rate analytics for an instance (stats rollup + per-viewer rows)
 * @route   GET /api/reports/instances/:id/analytics
 * @access  Private (reports:view)
 */
export const getInstanceAnalytics = asyncHandler(async (req, res) => {
  const instance = await ReportInstance.findOne({ _id: req.params.id, organization: req.user.organization })
    .select('title stats distribution.recipients publicSlug');
  if (!instance) { res.status(404); throw new Error('Report not found'); }

  const views = await ReportView.find({ reportInstance: instance._id })
    .select('email matchedRecipient isForwarded viewCount firstViewedAt lastViewedAt')
    .sort({ lastViewedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      title: instance.title,
      publicSlug: instance.publicSlug,
      stats: instance.stats,
      recipients: instance.distribution?.recipients || [],
      views,
    },
  });
});
```

- [ ] **Step 2: Add routes.** In `routes/reportRoutes.js`, add the import:

```js
import { getInstances, getInstanceById, getInstanceAnalytics } from '../controllers/reportInstanceController.js';
```

and add these routes (place the static `/instances` routes BEFORE the existing `/templates/:id` group is fine since paths differ; put them after the `/templates/:id/generate` line):

```js
// Generated instances + open-rate analytics
router.get('/instances', hasPermission(PERMISSIONS.REPORTS.VIEW), getInstances);
router.get('/instances/:id', hasPermission(PERMISSIONS.REPORTS.VIEW), getInstanceById);
router.get('/instances/:id/analytics', hasPermission(PERMISSIONS.REPORTS.VIEW), getInstanceAnalytics);
```

- [ ] **Step 3: Verify.**
- `node --check controllers/reportInstanceController.js routes/reportRoutes.js` → exit 0.
- `node --input-type=module -e "import('./routes/reportRoutes.js').then(() => console.log('reportRoutes import OK')).catch((e) => { console.error(e); process.exit(1); })"` → OK.

- [ ] **Step 4: Commit**

```bash
git add controllers/reportInstanceController.js routes/reportRoutes.js
git commit -m "feat(reports): add instances list + open-rate analytics endpoints" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Verify + manual smoke (documented)

- [ ] **Step 1: Full unit suite.** `npm run test:unit` → all green (incl. new `viewTracking` suite; expect 57 tests total).

- [ ] **Step 2: Manual smoke** (server running + a generated instance's `publicSlug` from Phase 1, e.g. via `POST /reports/templates/:id/generate`):

```bash
SLUG=<publicSlug>
# Gate meta (no data):
curl -s http://localhost:3000/api/public/reports/$SLUG | head -c 200
#   → {"success":true,"data":{"title":...,"gate":"email",...}}  (NO blocks)
# Pass the gate → snapshot returned, view logged:
curl -s -X POST -H "Content-Type: application/json" -d '{"email":"investor@example.com"}' \
  http://localhost:3000/api/public/reports/$SLUG/access | head -c 400
#   → {"success":true,"data":{"blocks":[{"type":"kpi.revenue","kind":"kpi","data":{...}}],...}}
# Invalid email → 400:
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"email":"nope"}' \
  http://localhost:3000/api/public/reports/$SLUG/access   # → 400
# Creator analytics (authenticated):
INSTANCE_ID=<id>
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/reports/instances/$INSTANCE_ID/analytics | head -c 300
#   → {"success":true,"data":{"stats":{"uniqueViewers":1,"totalViews":1,...},"views":[{"email":"investor@example.com",...}]}}
```

- [ ] **Step 3:** Confirm: gate meta omits `blocks`; access returns `blocks` each with a `kind`; a second access with the same email increments `viewCount` (not a new row); analytics reflects the view. Record results. (Defer to your environment if no running server.)

---

## Self-Review

**1. Spec coverage (Phase 2 backend):** public render endpoint (gate meta + access) → Tasks 2,3 ✅; email-gated view logging + matched/forwarded classification → Tasks 1,2 ✅; denormalized stats rollup → Tasks 1,2 ✅; `kind` enrichment for the catalog-less public page → Task 2 ✅; creator open-rate analytics + instance list → Task 4 ✅. (Public page UI, share link, dashboard UI → 2b.)

**2. Placeholder scan:** complete code + exact commands throughout; manual smoke is explicit verification. ✅

**3. Type/name consistency:** `classifyViewer`/`computeInstanceStats` (Task 1) consumed by `publicReportController` (Task 2). `getPublicReportMeta`/`accessPublicReport` exported (Task 2) → imported in `publicReportRoutes` (Task 3). `getInstances`/`getInstanceById`/`getInstanceAnalytics` exported (Task 4) → imported in `reportRoutes` (Task 4). `getBlock` (Phase 0), `ReportInstance`/`ReportView` (Phase 0), `PERMISSIONS.REPORTS.VIEW` (Phase 0) all exist. `ReportView` unique index `{reportInstance, email}` supports the upsert. ✅

**4. Convention match:** public mount like `/api/invitations`; `rateLimit` config mirrors `invitationAccessLimiter`; `req.ip`; `asyncHandler` + `{success,data}` envelope + org-scoped `findOne`. ✅

**Security notes:** public endpoints are slug-gated (unguessable) + rate-limited + expiry-checked; IP stored hashed (SHA-256), never raw; email validated; `getInstanceById`/analytics are org-scoped so one org can't read another's reports. **Deferred to Phase 3:** gating public visibility on `review.status === 'approved'` — in Phase 2 any non-expired instance is viewable via its slug (acceptable since the creator controls who gets the link). Noted in code via this plan.

---

## Execution Handoff

After 2a, **Phase 2b (public page + open-rate UI)**: a bare public route `/r/:slug` (`PublicReportPage`) with the email gate that renders the snapshot via the existing `ReportBlockRenderer`; surfacing the shareable link in the builder after "Generate"; a generated-reports list + per-report open-rate dashboard (stats cards + viewer table) under `/reports`. Uses a bare (interceptor-free) axios instance for the public calls and `reportAPI` for the authenticated instance/analytics endpoints from Task 4.

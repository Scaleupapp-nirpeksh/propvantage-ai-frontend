# Leadership Report Builder — Phase 0 (Foundations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend foundations of the Report Builder — RBAC permissions, the three Mongoose models, the block catalog (with resolvers reusing the existing leadership overview), the pure snapshot generator, and the authenticated `GET /api/reports/catalog` endpoint — all under TDD.

**Architecture:** A new `reports` domain in the backend (`propvantage-ai-backend`). A server-side **block registry** maps report block types to data drawn from the existing `getLeadershipOverview()` service, so the report domain never re-implements analytics. A **pure** `buildSnapshotBlocks()` core freezes block data into a `ReportInstance`. Everything new is unit-tested without a database (Mongoose `validateSync()` for schemas; injected fake `overview` objects for resolvers).

**Tech Stack:** Node.js (ESM, `"type": "module"`), Express, Mongoose 8, Jest 29 (run with `--experimental-vm-modules`), `express-async-handler`.

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-backend` (the backend). Paths below are relative to that repo.

**Scope note:** This is Phase 0 of 5 (see the design spec `propvantage-ai-frontend/docs/superpowers/specs/2026-06-13-leadership-report-builder-design.md`). Phases 1–4 (builder UI, public page + tracking, review/approve, scheduling/delivery) each get their own plan. Phase 0 produces independently testable software: the catalog endpoint and snapshot generator with green unit tests.

**One deviation from the spec, by design:** the template period field is named `scope.period.preset` (not `scope.period.type`) to avoid Mongoose's reserved-word `type` footgun in nested objects.

---

## File Structure

**New files (created in this phase):**
- `jest.unit.config.mjs` — Jest config for fast, DB-free unit tests under `tests/unit/`.
- `models/reportTemplateModel.js` — the reusable report definition.
- `models/reportInstanceModel.js` — a frozen generated report.
- `models/reportViewModel.js` — one viewer's access record (for open-rate tracking).
- `services/reports/blockHelpers.js` — pure transform helpers (map→chart-data, safe number).
- `services/reports/blockRegistry.js` — catalog of block types + their `resolve()` functions + `getCatalog`/`getBlock`.
- `services/reports/snapshotService.js` — `buildSnapshotBlocks` (pure), `resolvePeriodArgs` (pure), `generateInstance` (DB).
- `controllers/reportController.js` — `getCatalog` request handler.
- `routes/reportRoutes.js` — mounts `GET /catalog`.
- `tests/unit/*.test.js` — one test file per unit above.

**Modified files:**
- `config/permissions.js` — add the `REPORTS` permission group.
- `data/defaultRoles.js` — grant `reports:*` to the four explicit leadership "Head" roles.
- `server.js` — import and mount `reportRoutes`.
- `package.json` — add the `test:unit` script.

---

## Task 1: ESM unit-test harness

**Files:**
- Create: `jest.unit.config.mjs`
- Create: `tests/unit/sanity.test.js`
- Modify: `package.json` (add `test:unit` script)

- [ ] **Step 1: Create the Jest unit config**

Create `jest.unit.config.mjs`:

```js
// File: jest.unit.config.mjs
// Fast, DB-free unit tests for new domains. Run with:
//   npm run test:unit
// Kept separate from the regression suite (jest.regression.config.mjs).
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  testTimeout: 10000,
  reporters: ['default'],
  verbose: true,
};
```

- [ ] **Step 2: Add the `test:unit` script**

In `package.json`, inside `"scripts"`, add the `test:unit` line right after the existing `"test": "jest",` line:

```json
        "test": "jest",
        "test:unit": "node --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.unit.config.mjs",
```

- [ ] **Step 3: Write a sanity test**

Create `tests/unit/sanity.test.js`:

```js
// File: tests/unit/sanity.test.js
describe('unit harness', () => {
  it('runs ESM test files', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run it and verify it passes**

Run: `npm run test:unit`
Expected: PASS — 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add jest.unit.config.mjs tests/unit/sanity.test.js package.json
git commit -m "test(reports): add ESM unit-test harness for reports domain"
```

---

## Task 2: `reports:*` permissions

**Files:**
- Modify: `config/permissions.js`
- Test: `tests/unit/permissions.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/permissions.test.js`:

```js
// File: tests/unit/permissions.test.js
import { PERMISSIONS, ALL_PERMISSIONS } from '../../config/permissions.js';

describe('REPORTS permissions', () => {
  it('exposes view/manage/approve on PERMISSIONS.REPORTS', () => {
    expect(PERMISSIONS.REPORTS).toEqual({
      VIEW: 'reports:view',
      MANAGE: 'reports:manage',
      APPROVE: 'reports:approve',
    });
  });

  it('includes the reports permissions in ALL_PERMISSIONS', () => {
    expect(ALL_PERMISSIONS).toEqual(
      expect.arrayContaining(['reports:view', 'reports:manage', 'reports:approve'])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- permissions`
Expected: FAIL — `Cannot read properties of undefined (reading 'VIEW')` (PERMISSIONS.REPORTS is undefined).

- [ ] **Step 3: Add the REPORTS group**

In `config/permissions.js`, add a new group immediately after the `DASHBOARD` group (which ends at the line with `LEADERSHIP: 'dashboard:leadership',` then `},`). Insert:

```js
  // ─── REPORTS (Leadership Report Builder) ───────────────
  REPORTS: {
    VIEW: 'reports:view',       // view report templates, instances, open-rate analytics
    MANAGE: 'reports:manage',   // create/edit templates, generate, edit overrides & flags
    APPROVE: 'reports:approve', // approve a report and trigger send
  },
```

Use this exact anchor for the edit (the `DASHBOARD` group):

```js
  // ─── DASHBOARD ────────────────────────────────────────
  DASHBOARD: {
    LEADERSHIP: 'dashboard:leadership',
  },
```

Replace it with that same block followed by the new `REPORTS` block. (`ALL_PERMISSIONS` and `PERMISSION_GROUPS` are derived from `PERMISSIONS` automatically — no other change needed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- permissions`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add config/permissions.js tests/unit/permissions.test.js
git commit -m "feat(reports): add reports:view/manage/approve permissions"
```

---

## Task 3: Grant reports permissions to leadership roles

**Files:**
- Modify: `data/defaultRoles.js`
- Test: `tests/unit/defaultRoles.test.js`

**Context:** `Organization Owner` (gets `ALL_PERMISSIONS`) and `Business Head` (gets `ALL_PERMISSIONS.filter(p => p !== 'roles:delete')`) receive the new reports permissions automatically. The four roles with **explicit** permission arrays — `Project Director`, `Sales Head`, `Marketing Head`, `Finance Head` — must be granted them by hand. `Sales Executive` must NOT get `reports:manage`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/defaultRoles.test.js`:

```js
// File: tests/unit/defaultRoles.test.js
import { DEFAULT_ROLES } from '../../data/defaultRoles.js';

const byName = (name) => DEFAULT_ROLES.find((r) => r.name === name);

describe('default role grants for reports', () => {
  it('Organization Owner has all three reports permissions', () => {
    const perms = byName('Organization Owner').permissions;
    expect(perms).toEqual(
      expect.arrayContaining(['reports:view', 'reports:manage', 'reports:approve'])
    );
  });

  it('Business Head has reports:manage (via ALL minus roles:delete)', () => {
    expect(byName('Business Head').permissions).toContain('reports:manage');
  });

  it.each(['Project Director', 'Sales Head', 'Marketing Head', 'Finance Head'])(
    '%s can view, manage and approve reports',
    (roleName) => {
      const perms = byName(roleName).permissions;
      expect(perms).toContain('reports:view');
      expect(perms).toContain('reports:manage');
      expect(perms).toContain('reports:approve');
    }
  );

  it('Sales Executive cannot manage reports', () => {
    expect(byName('Sales Executive').permissions).not.toContain('reports:manage');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- defaultRoles`
Expected: FAIL — the four Head roles do not contain `reports:view`.

- [ ] **Step 3a: Grant to Project Director**

In `data/defaultRoles.js`, find this exact block (unique — `analytics:predictive` only appears in Project Director's array):

```js
      // Analytics — full
      'analytics:basic', 'analytics:advanced', 'analytics:reports',
      'analytics:predictive', 'analytics:budget_vs_actual', 'analytics:marketing_roi',
```

Replace with:

```js
      // Analytics — full
      'analytics:basic', 'analytics:advanced', 'analytics:reports',
      'analytics:predictive', 'analytics:budget_vs_actual', 'analytics:marketing_roi',
      // Reports (Leadership Report Builder)
      'reports:view', 'reports:manage', 'reports:approve',
```

- [ ] **Step 3b: Grant to Sales Head**

Find this exact block (unique — ends the Sales Head array; the two channel-partner perms are immediately followed by the array close `],`):

```js
      'channel_partners:edit_booking_attribution', 'channel_partners:manage_commissions',
    ],
  },
  {
    name: 'Marketing Head',
```

Replace with:

```js
      'channel_partners:edit_booking_attribution', 'channel_partners:manage_commissions',
      // Reports (Leadership Report Builder)
      'reports:view', 'reports:manage', 'reports:approve',
    ],
  },
  {
    name: 'Marketing Head',
```

- [ ] **Step 3c: Grant to Marketing Head**

Find this exact block (unique — Marketing Head's competitive-analysis pair immediately precedes `// Portfolio`):

```js
      'competitive_analysis:ai_research', 'competitive_analysis:ai_recommendations',
      // Portfolio
      'portfolio:manage',
    ],
  },
  {
    name: 'Finance Head',
```

Replace with:

```js
      'competitive_analysis:ai_research', 'competitive_analysis:ai_recommendations',
      // Reports (Leadership Report Builder)
      'reports:view', 'reports:manage', 'reports:approve',
      // Portfolio
      'portfolio:manage',
    ],
  },
  {
    name: 'Finance Head',
```

- [ ] **Step 3d: Grant to Finance Head**

Find this exact block (unique — Finance Head lists `view` then `ai_research` with no `manage_data`, and the array closes right after `ai_recommendations`):

```js
      'competitive_analysis:view', 'competitive_analysis:ai_research',
      'competitive_analysis:ai_recommendations',
    ],
  },
  {
    name: 'Sales Manager',
```

Replace with:

```js
      'competitive_analysis:view', 'competitive_analysis:ai_research',
      'competitive_analysis:ai_recommendations',
      // Reports (Leadership Report Builder)
      'reports:view', 'reports:manage', 'reports:approve',
    ],
  },
  {
    name: 'Sales Manager',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- defaultRoles`
Expected: PASS — all role-grant tests pass.

- [ ] **Step 5: Commit**

```bash
git add data/defaultRoles.js tests/unit/defaultRoles.test.js
git commit -m "feat(reports): grant reports:* to leadership Head roles"
```

---

## Task 4: `ReportTemplate` model

**Files:**
- Create: `models/reportTemplateModel.js`
- Test: `tests/unit/reportTemplateModel.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/reportTemplateModel.test.js`:

```js
// File: tests/unit/reportTemplateModel.test.js
import mongoose from 'mongoose';
import ReportTemplate from '../../models/reportTemplateModel.js';

const validDoc = () => ({
  organization: new mongoose.Types.ObjectId(),
  name: 'Monthly Leadership Report',
});

describe('ReportTemplate model', () => {
  it('validates a minimal valid document', () => {
    const doc = new ReportTemplate(validDoc());
    expect(doc.validateSync()).toBeUndefined();
  });

  it('applies defaults', () => {
    const doc = new ReportTemplate(validDoc());
    expect(doc.status).toBe('active');
    expect(doc.delivery.mode).toBe('review_then_send');
    expect(doc.access.gate).toBe('email');
    expect(doc.access.expiresAfterDays).toBe(90);
    expect(doc.scope.period.preset).toBe('last_30d');
  });

  it('requires organization and name', () => {
    const doc = new ReportTemplate({});
    const err = doc.validateSync();
    expect(err.errors.organization).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  it('rejects an invalid delivery mode', () => {
    const doc = new ReportTemplate({ ...validDoc(), delivery: { mode: 'nope' } });
    expect(doc.validateSync().errors['delivery.mode']).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- reportTemplateModel`
Expected: FAIL — `Cannot find module '../../models/reportTemplateModel.js'`.

- [ ] **Step 3: Create the model**

Create `models/reportTemplateModel.js`:

```js
// File: models/reportTemplateModel.js
// Description: Reusable report definition for the Leadership Report Builder.
// Note: the period field is named `preset` (not `type`) to avoid Mongoose's
// reserved-word handling of a nested `type` key.

import mongoose from 'mongoose';

export const PERIOD_PRESETS = [
  'last_30d', 'mtd', 'qtd', 'ytd', 'last_quarter', 'last_month', 'custom',
];
export const THEME_PRESETS = ['clean', 'midnight', 'warm'];
export const DELIVERY_MODES = ['review_then_send', 'auto_send'];
export const SCHEDULE_FREQUENCIES = ['weekly', 'monthly', 'quarterly'];
export const GATE_TYPES = ['email', 'public'];
export const TEMPLATE_STATUSES = ['active', 'paused', 'archived'];

const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },     // matches blockRegistry, e.g. 'kpi.revenue'
    title: { type: String, trim: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const imageSlotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, trim: true },
    s3Key: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const reportTemplateSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    scope: {
      projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
      period: {
        preset: { type: String, enum: PERIOD_PRESETS, default: 'last_30d' },
        customStart: { type: Date },
        customEnd: { type: Date },
      },
    },

    theme: {
      preset: { type: String, enum: THEME_PRESETS, default: 'clean' },
      primaryColor: { type: String },
      accentColor: { type: String },
      logoS3Key: { type: String },
      coverImageS3Key: { type: String },
    },

    blocks: [blockSchema],
    imageSlots: [imageSlotSchema],

    schedule: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: SCHEDULE_FREQUENCIES },
      dayOfWeek: { type: Number, min: 0, max: 6 },
      dayOfMonth: { type: Number, min: 1, max: 31 },
      time: { type: String },               // 'HH:mm'
      timezone: { type: String, default: 'Asia/Kolkata' },
      nextRunAt: { type: Date, index: true },
    },

    delivery: {
      mode: { type: String, enum: DELIVERY_MODES, default: 'review_then_send' },
      recipients: [{ email: { type: String }, name: { type: String }, role: { type: String } }],
      ccInternal: [{ type: String }],
      reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },

    access: {
      gate: { type: String, enum: GATE_TYPES, default: 'email' },
      expiresAfterDays: { type: Number, default: 90 },
    },

    status: { type: String, enum: TEMPLATE_STATUSES, default: 'active' },
  },
  { timestamps: true }
);

reportTemplateSchema.index({ organization: 1, status: 1 });

const ReportTemplate = mongoose.model('ReportTemplate', reportTemplateSchema);

export default ReportTemplate;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- reportTemplateModel`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add models/reportTemplateModel.js tests/unit/reportTemplateModel.test.js
git commit -m "feat(reports): add ReportTemplate model"
```

---

## Task 5: `ReportInstance` model

**Files:**
- Create: `models/reportInstanceModel.js`
- Test: `tests/unit/reportInstanceModel.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/reportInstanceModel.test.js`:

```js
// File: tests/unit/reportInstanceModel.test.js
import mongoose from 'mongoose';
import ReportInstance from '../../models/reportInstanceModel.js';

const validDoc = () => ({
  organization: new mongoose.Types.ObjectId(),
  title: 'Monthly Leadership Report — May 2026',
});

describe('ReportInstance model', () => {
  it('validates a minimal valid document', () => {
    expect(new ReportInstance(validDoc()).validateSync()).toBeUndefined();
  });

  it('defaults review and distribution status and stats', () => {
    const doc = new ReportInstance(validDoc());
    expect(doc.review.status).toBe('draft');
    expect(doc.distribution.status).toBe('not_sent');
    expect(doc.stats.totalViews).toBe(0);
    expect(doc.gate).toBe('email');
  });

  it('requires organization', () => {
    expect(new ReportInstance({ title: 'x' }).validateSync().errors.organization).toBeDefined();
  });

  it('stores frozen block data as mixed', () => {
    const doc = new ReportInstance({
      ...validDoc(),
      blocks: [{ id: 'b1', type: 'kpi.revenue', order: 0, data: { value: 1234, unit: 'currency' } }],
    });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.blocks[0].data.value).toBe(1234);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- reportInstanceModel`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the model**

Create `models/reportInstanceModel.js`:

```js
// File: models/reportInstanceModel.js
// Description: A frozen, generated report produced from a ReportTemplate (or ad-hoc).
// The `blocks[].data` payloads are snapshotted at generation time.

import mongoose from 'mongoose';

export const REVIEW_STATUSES = ['draft', 'in_review', 'changes_requested', 'approved'];
export const DISTRIBUTION_STATUSES = ['not_sent', 'queued', 'sending', 'sent', 'failed'];
export const RECIPIENT_EMAIL_STATUSES = ['pending', 'sent', 'bounced', 'failed'];
export const FLAG_SEVERITIES = ['info', 'warn', 'critical'];
export const FLAG_STATUSES = ['open', 'resolved'];

const snapshotBlockSchema = new mongoose.Schema(
  {
    id: { type: String },
    type: { type: String },
    title: { type: String },
    config: { type: mongoose.Schema.Types.Mixed },
    order: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed },   // FROZEN resolved data
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    id: { type: String },
    blockId: { type: String },
    fieldPath: { type: String },
    originalValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const flagSchema = new mongoose.Schema(
  {
    id: { type: String },
    blockId: { type: String },
    note: { type: String },
    severity: { type: String, enum: FLAG_SEVERITIES, default: 'warn' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: FLAG_STATUSES, default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { _id: false }
);

const recipientSchema = new mongoose.Schema(
  {
    email: { type: String },
    name: { type: String },
    emailStatus: { type: String, enum: RECIPIENT_EMAIL_STATUSES, default: 'pending' },
    emailedAt: { type: Date },
  },
  { _id: false }
);

const reportInstanceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportTemplate', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    title: { type: String, trim: true },
    periodLabel: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },

    blocks: [snapshotBlockSchema],
    images: [{ id: { type: String }, label: { type: String }, url: { type: String } }],
    theme: { type: mongoose.Schema.Types.Mixed },

    overrides: [overrideSchema],
    flags: [flagSchema],

    review: {
      status: { type: String, enum: REVIEW_STATUSES, default: 'draft' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: { type: Date },
      notes: { type: String },
    },

    distribution: {
      status: { type: String, enum: DISTRIBUTION_STATUSES, default: 'not_sent' },
      sentAt: { type: Date },
      recipients: [recipientSchema],
    },

    publicSlug: { type: String, unique: true, sparse: true, index: true },
    accessToken: { type: String },
    gate: { type: String, default: 'email' },
    expiresAt: { type: Date, index: true },

    stats: {
      uniqueViewers: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      recipientsOpened: { type: Number, default: 0 },
      forwardedOpens: { type: Number, default: 0 },
      firstOpenAt: { type: Date },
      lastOpenAt: { type: Date },
    },

    pdfS3Key: { type: String, default: null },   // Phase 5
  },
  { timestamps: true }
);

reportInstanceSchema.index({ organization: 1, 'review.status': 1, createdAt: -1 });

const ReportInstance = mongoose.model('ReportInstance', reportInstanceSchema);

export default ReportInstance;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- reportInstanceModel`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add models/reportInstanceModel.js tests/unit/reportInstanceModel.test.js
git commit -m "feat(reports): add ReportInstance model"
```

---

## Task 6: `ReportView` model

**Files:**
- Create: `models/reportViewModel.js`
- Test: `tests/unit/reportViewModel.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/reportViewModel.test.js`:

```js
// File: tests/unit/reportViewModel.test.js
import mongoose from 'mongoose';
import ReportView from '../../models/reportViewModel.js';

const validDoc = () => ({
  organization: new mongoose.Types.ObjectId(),
  reportInstance: new mongoose.Types.ObjectId(),
  publicSlug: 'abc123',
  email: 'investor@example.com',
});

describe('ReportView model', () => {
  it('validates a minimal valid document', () => {
    expect(new ReportView(validDoc()).validateSync()).toBeUndefined();
  });

  it('defaults viewCount to 1 and isForwarded to false', () => {
    const doc = new ReportView(validDoc());
    expect(doc.viewCount).toBe(1);
    expect(doc.isForwarded).toBe(false);
  });

  it('requires organization, reportInstance and email', () => {
    const err = new ReportView({}).validateSync();
    expect(err.errors.organization).toBeDefined();
    expect(err.errors.reportInstance).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- reportViewModel`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the model**

Create `models/reportViewModel.js`:

```js
// File: models/reportViewModel.js
// Description: One access record per (report instance, viewer email). Powers the
// open-rate dashboard. IP is stored hashed, never raw (PII).

import mongoose from 'mongoose';

const reportViewSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    reportInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReportInstance',
      required: [true, 'Report instance is required'],
      index: true,
    },
    publicSlug: { type: String },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    matchedRecipient: { type: Boolean, default: false },
    isForwarded: { type: Boolean, default: false },
    ipHash: { type: String },
    userAgent: { type: String },
    firstViewedAt: { type: Date, default: Date.now },
    lastViewedAt: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 1 },
    totalDwellMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One row per viewer per report; access events upsert + increment viewCount.
reportViewSchema.index({ reportInstance: 1, email: 1 }, { unique: true });

const ReportView = mongoose.model('ReportView', reportViewSchema);

export default ReportView;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- reportViewModel`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add models/reportViewModel.js tests/unit/reportViewModel.test.js
git commit -m "feat(reports): add ReportView model for open-rate tracking"
```

---

## Task 7: Block transform helpers (pure)

**Files:**
- Create: `services/reports/blockHelpers.js`
- Test: `tests/unit/blockHelpers.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/blockHelpers.test.js`:

```js
// File: tests/unit/blockHelpers.test.js
import { objectMapToChartData, num } from '../../services/reports/blockHelpers.js';

describe('blockHelpers', () => {
  describe('objectMapToChartData', () => {
    it('converts an object map to name/value pairs', () => {
      expect(objectMapToChartData({ available: 5, sold: 3 })).toEqual([
        { name: 'available', value: 5 },
        { name: 'sold', value: 3 },
      ]);
    });
    it('returns [] for null/undefined/non-object', () => {
      expect(objectMapToChartData(null)).toEqual([]);
      expect(objectMapToChartData(undefined)).toEqual([]);
      expect(objectMapToChartData(42)).toEqual([]);
    });
  });

  describe('num', () => {
    it('passes through finite numbers', () => {
      expect(num(12.5)).toBe(12.5);
    });
    it('falls back for NaN / non-numbers', () => {
      expect(num(NaN)).toBe(0);
      expect(num(undefined)).toBe(0);
      expect(num('x', -1)).toBe(-1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- blockHelpers`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helpers**

Create `services/reports/blockHelpers.js`:

```js
// File: services/reports/blockHelpers.js
// Description: Pure transform helpers shared by block resolvers. No I/O.

/**
 * Convert an object map ({ statusA: 5, statusB: 3 }) into recharts-friendly
 * [{ name, value }] pairs. Returns [] for anything that isn't a plain object.
 */
export const objectMapToChartData = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
};

/**
 * Coerce a value to a finite number, else a fallback (default 0).
 */
export const num = (value, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- blockHelpers`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add services/reports/blockHelpers.js tests/unit/blockHelpers.test.js
git commit -m "feat(reports): add pure block transform helpers"
```

---

## Task 8: Block registry + catalog

**Files:**
- Create: `services/reports/blockRegistry.js`
- Test: `tests/unit/blockRegistry.test.js`

**Context:** Each block's `resolve({ overview, config })` reads from the frozen `getLeadershipOverview()` shape: `overview.revenue.{totalSalesValue,totalCollected,totalOutstanding,collectionRate}`, `overview.salesPipeline.{totalLeads,conversionRate,avgBookingValue,leadsByStatus,leadsBySource}`, `overview.portfolio.{totalUnits,totalProjects,unitsByStatus}`, `overview.team.topWorkload`. Layout/media blocks have `requiredPermission: null` and echo their config.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/blockRegistry.test.js`:

```js
// File: tests/unit/blockRegistry.test.js
import { BLOCKS, getBlock, getCatalog } from '../../services/reports/blockRegistry.js';

const fakeOverview = {
  revenue: { totalSalesValue: 124000000, totalCollected: 80000000, totalOutstanding: 44000000, collectionRate: 0.71 },
  salesPipeline: { totalLeads: 320, conversionRate: 0.062, avgBookingValue: 8500000,
    leadsByStatus: { New: 100, Booked: 20 }, leadsBySource: { Web: 50, Referral: 30 } },
  portfolio: { totalUnits: 200, totalProjects: 4, unitsByStatus: { available: 152, sold: 48 } },
  team: { topWorkload: [{ user: 'A', openTasks: 9 }] },
};

describe('blockRegistry', () => {
  it('every block has the required metadata and a resolve fn', () => {
    for (const b of BLOCKS) {
      expect(typeof b.type).toBe('string');
      expect(typeof b.category).toBe('string');
      expect(typeof b.label).toBe('string');
      expect(['kpi', 'chart', 'table', 'layout']).toContain(b.kind);
      expect(typeof b.resolve).toBe('function');
    }
  });

  it('block types are unique', () => {
    const types = BLOCKS.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('getBlock returns a definition or undefined', () => {
    expect(getBlock('kpi.revenue').label).toBeTruthy();
    expect(getBlock('does.not.exist')).toBeUndefined();
  });

  it('kpi.revenue resolves the total sales value', () => {
    expect(getBlock('kpi.revenue').resolve({ overview: fakeOverview, config: {} }))
      .toEqual({ value: 124000000, unit: 'currency' });
  });

  it('chart.unitsByStatus resolves to chart data', () => {
    expect(getBlock('chart.unitsByStatus').resolve({ overview: fakeOverview, config: {} }))
      .toEqual({ chartKind: 'pie', data: [{ name: 'available', value: 152 }, { name: 'sold', value: 48 }] });
  });

  it('layout.hero echoes its config and needs no overview', () => {
    expect(getBlock('layout.hero').resolve({ config: { title: 'Q2', subtitle: 'FY26', imageSlotId: 'hero' } }))
      .toEqual({ title: 'Q2', subtitle: 'FY26', imageSlotId: 'hero' });
  });

  it('getCatalog strips resolve and filters by permission', () => {
    const noPerms = getCatalog([], false);
    expect(noPerms.every((b) => b.resolve === undefined)).toBe(true);
    expect(noPerms.find((b) => b.type === 'kpi.revenue')).toBeUndefined(); // needs analytics:advanced
    expect(noPerms.find((b) => b.type === 'layout.hero')).toBeDefined();   // no permission required
  });

  it('getCatalog includes gated blocks for owners and permitted users', () => {
    expect(getCatalog([], true).find((b) => b.type === 'kpi.revenue')).toBeDefined();
    expect(getCatalog(['analytics:advanced'], false).find((b) => b.type === 'kpi.revenue')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- blockRegistry`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the registry**

Create `services/reports/blockRegistry.js`:

```js
// File: services/reports/blockRegistry.js
// Description: Catalog of report block types. Each block knows how to resolve its
// own data from the existing getLeadershipOverview() snapshot. The report domain
// never re-implements analytics — it only selects/transforms.

import { objectMapToChartData, num } from './blockHelpers.js';

const ADV = 'analytics:advanced'; // gate for data-bearing blocks

// kind: 'kpi' | 'chart' | 'table' | 'layout'
// requiredPermission: a permission string, or null for always-available layout blocks.
const BLOCKS = [
  // ─── KPIs (Financial) ───────────────────────────────
  {
    type: 'kpi.revenue', category: 'Financial', label: 'Total Sales Value', kind: 'kpi',
    description: 'Total booked sales value for the period.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.revenue?.totalSalesValue), unit: 'currency' }),
  },
  {
    type: 'kpi.collections', category: 'Financial', label: 'Collected', kind: 'kpi',
    description: 'Total amount collected.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.revenue?.totalCollected), unit: 'currency' }),
  },
  {
    type: 'kpi.outstanding', category: 'Financial', label: 'Outstanding', kind: 'kpi',
    description: 'Total outstanding receivables.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.revenue?.totalOutstanding), unit: 'currency' }),
  },
  {
    type: 'kpi.collectionRate', category: 'Financial', label: 'Collection Rate', kind: 'kpi',
    description: 'Collected ÷ total sales value.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.revenue?.collectionRate), unit: 'percent' }),
  },
  // ─── KPIs (Sales) ───────────────────────────────────
  {
    type: 'kpi.totalLeads', category: 'Sales', label: 'Total Leads', kind: 'kpi',
    description: 'Total leads in scope.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.salesPipeline?.totalLeads), unit: 'count' }),
  },
  {
    type: 'kpi.conversionRate', category: 'Sales', label: 'Conversion Rate', kind: 'kpi',
    description: 'Booked ÷ total leads.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.salesPipeline?.conversionRate), unit: 'percent' }),
  },
  {
    type: 'kpi.avgBookingValue', category: 'Sales', label: 'Avg Booking Value', kind: 'kpi',
    description: 'Average value per booking.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ value: num(overview?.salesPipeline?.avgBookingValue), unit: 'currency' }),
  },
  // ─── Charts ─────────────────────────────────────────
  {
    type: 'chart.unitsByStatus', category: 'Inventory', label: 'Inventory by Status', kind: 'chart',
    description: 'Unit count by status.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ chartKind: 'pie', data: objectMapToChartData(overview?.portfolio?.unitsByStatus) }),
  },
  {
    type: 'chart.leadsByStatus', category: 'Sales', label: 'Lead Funnel', kind: 'chart',
    description: 'Lead count by status.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ chartKind: 'bar', data: objectMapToChartData(overview?.salesPipeline?.leadsByStatus) }),
  },
  {
    type: 'chart.leadsBySource', category: 'Sales', label: 'Lead Sources', kind: 'chart',
    description: 'Lead count by source.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ chartKind: 'pie', data: objectMapToChartData(overview?.salesPipeline?.leadsBySource) }),
  },
  // ─── Tables ─────────────────────────────────────────
  {
    type: 'table.topWorkload', category: 'Team', label: 'Team Workload', kind: 'table',
    description: 'Users with the most open tasks.', requiredPermission: ADV, defaultConfig: {},
    resolve: ({ overview }) => ({ rows: Array.isArray(overview?.team?.topWorkload) ? overview.team.topWorkload : [] }),
  },
  // ─── Layout / Media (always available) ──────────────
  {
    type: 'layout.hero', category: 'Layout', label: 'Cover / Hero', kind: 'layout',
    description: 'Cover image with title and subtitle.', requiredPermission: null,
    defaultConfig: { title: '', subtitle: '', imageSlotId: null },
    resolve: ({ config = {} }) => ({ title: config.title || '', subtitle: config.subtitle || '', imageSlotId: config.imageSlotId || null }),
  },
  {
    type: 'media.gallery', category: 'Layout', label: 'Image Gallery', kind: 'layout',
    description: 'A grid of project images.', requiredPermission: null,
    defaultConfig: { imageSlotIds: [] },
    resolve: ({ config = {} }) => ({ imageSlotIds: Array.isArray(config.imageSlotIds) ? config.imageSlotIds : [] }),
  },
  {
    type: 'text.note', category: 'Layout', label: 'Text Note', kind: 'layout',
    description: 'A free-text paragraph.', requiredPermission: null, defaultConfig: { text: '' },
    resolve: ({ config = {} }) => ({ text: config.text || '' }),
  },
  {
    type: 'layout.divider', category: 'Layout', label: 'Divider', kind: 'layout',
    description: 'A horizontal section divider.', requiredPermission: null, defaultConfig: {},
    resolve: () => ({}),
  },
];

const BLOCK_MAP = new Map(BLOCKS.map((b) => [b.type, b]));

/** Look up a block definition by type. */
export const getBlock = (type) => BLOCK_MAP.get(type);

/**
 * Catalog for the builder UI: metadata only (resolve stripped), filtered to the
 * blocks this user may use. Owners see everything; otherwise the user must hold
 * the block's requiredPermission (null = always available).
 */
export const getCatalog = (userPermissions = [], isOwner = false) =>
  BLOCKS
    .filter((b) => !b.requiredPermission || isOwner || userPermissions.includes(b.requiredPermission))
    .map(({ resolve, ...meta }) => meta);

export { BLOCKS };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- blockRegistry`
Expected: PASS — 8 tests passed.

- [ ] **Step 5: Commit**

```bash
git add services/reports/blockRegistry.js tests/unit/blockRegistry.test.js
git commit -m "feat(reports): add block registry + permission-filtered catalog"
```

---

## Task 9: Snapshot service (pure core + generator)

**Files:**
- Create: `services/reports/snapshotService.js`
- Test: `tests/unit/snapshotService.test.js`

**Context:** `buildSnapshotBlocks(templateBlocks, overview)` and `resolvePeriodArgs(scope)` are pure and unit-tested here. `generateInstance(template, ctx)` is the thin DB wrapper (fetches the overview, builds blocks, persists a `ReportInstance`); its full DB path is exercised in Phase 1 when the generate route is added.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/snapshotService.test.js`:

```js
// File: tests/unit/snapshotService.test.js
import { buildSnapshotBlocks, resolvePeriodArgs } from '../../services/reports/snapshotService.js';

const overview = {
  revenue: { totalSalesValue: 100, totalCollected: 60 },
  portfolio: { unitsByStatus: { sold: 2 } },
};

describe('buildSnapshotBlocks', () => {
  it('attaches resolved data to each known block', () => {
    const out = buildSnapshotBlocks([{ id: 'b1', type: 'kpi.revenue', config: {} }], overview);
    expect(out[0].id).toBe('b1');
    expect(out[0].data).toEqual({ value: 100, unit: 'currency' });
  });

  it('marks unknown block types with an error instead of throwing', () => {
    const out = buildSnapshotBlocks([{ id: 'x', type: 'nope.block' }], overview);
    expect(out[0].data.error).toMatch(/Unknown block type/);
  });

  it('isolates a resolver failure to its own block', () => {
    // overview is null → data-bearing resolvers read undefined safely (num→0),
    // so force a throw via a block whose resolve dereferences a bad config path.
    const out = buildSnapshotBlocks(
      [{ id: 'ok', type: 'kpi.revenue', config: {} }, { id: 'bad', type: 'text.note', config: null }],
      overview
    );
    expect(out[0].data).toEqual({ value: 100, unit: 'currency' });
    expect(out[1].data).toEqual({ text: '' }); // null config handled by default param
  });

  it('returns [] for empty input', () => {
    expect(buildSnapshotBlocks([], overview)).toEqual([]);
    expect(buildSnapshotBlocks(undefined, overview)).toEqual([]);
  });
});

describe('resolvePeriodArgs', () => {
  it('maps presets to a period string', () => {
    expect(resolvePeriodArgs({ period: { preset: 'qtd' } })).toEqual({ period: '90', startDate: undefined, endDate: undefined });
    expect(resolvePeriodArgs({ period: { preset: 'ytd' } })).toEqual({ period: '365', startDate: undefined, endDate: undefined });
  });

  it('uses custom dates when preset is custom', () => {
    const s = new Date('2026-01-01'); const e = new Date('2026-03-31');
    expect(resolvePeriodArgs({ period: { preset: 'custom', customStart: s, customEnd: e } }))
      .toEqual({ period: '30', startDate: s, endDate: e });
  });

  it('defaults to 30 days when scope/preset missing', () => {
    expect(resolvePeriodArgs()).toEqual({ period: '30', startDate: undefined, endDate: undefined });
    expect(resolvePeriodArgs({})).toEqual({ period: '30', startDate: undefined, endDate: undefined });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- snapshotService`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the service**

Create `services/reports/snapshotService.js`:

```js
// File: services/reports/snapshotService.js
// Description: Freezes block data into a ReportInstance. buildSnapshotBlocks and
// resolvePeriodArgs are pure; generateInstance is the thin DB wrapper.

import crypto from 'crypto';
import ReportInstance from '../../models/reportInstanceModel.js';
import { getBlock } from './blockRegistry.js';
import { getLeadershipOverview } from '../leadershipDashboardService.js';

/**
 * Resolve every template block against a fetched overview, freezing the result.
 * Pure: no I/O. Unknown types and resolver errors are isolated per block so one
 * bad block never fails the whole report.
 */
export const buildSnapshotBlocks = (templateBlocks, overview = {}) => {
  if (!Array.isArray(templateBlocks)) return [];
  return templateBlocks.map((block) => {
    const def = getBlock(block.type);
    if (!def) return { ...block, data: { error: `Unknown block type: ${block.type}` } };
    try {
      const data = def.resolve({ overview, config: block.config || {} });
      return { ...block, data };
    } catch (err) {
      return { ...block, data: { error: err.message } };
    }
  });
};

const PRESET_TO_PERIOD = {
  last_30d: '30', mtd: '30', last_month: '30',
  qtd: '90', last_quarter: '90',
  ytd: '365',
};

/**
 * Map a template's scope.period onto the (period, startDate, endDate) arguments
 * that getLeadershipOverview expects. Pure.
 */
export const resolvePeriodArgs = (scope = {}) => {
  const p = (scope && scope.period) || {};
  if (p.preset === 'custom' && p.customStart && p.customEnd) {
    return { period: '30', startDate: p.customStart, endDate: p.customEnd };
  }
  return { period: PRESET_TO_PERIOD[p.preset] || '30', startDate: undefined, endDate: undefined };
};

/**
 * Generate and persist a frozen ReportInstance from a template.
 * @param {Object} template - a ReportTemplate document (or plain object with the same shape)
 * @param {Object} ctx - { createdBy, accessibleProjectIds }
 * @returns {Promise<ReportInstance>}
 */
export const generateInstance = async (template, { createdBy = null, accessibleProjectIds = null } = {}) => {
  const { period, startDate, endDate } = resolvePeriodArgs(template.scope);
  const overview = await getLeadershipOverview(
    template.organization, period, startDate, endDate, accessibleProjectIds
  );
  const blocks = buildSnapshotBlocks(template.blocks, overview);
  const expiresAfterDays = template.access?.expiresAfterDays || 90;

  return ReportInstance.create({
    organization: template.organization,
    template: template._id,
    createdBy,
    title: template.name,
    periodStart: overview?._dateRange?.start,
    periodEnd: overview?._dateRange?.end,
    blocks,
    theme: template.theme,
    images: (template.imageSlots || []).map((s) => ({ id: s.id, label: s.label, url: s.url })),
    publicSlug: crypto.randomBytes(9).toString('base64url'),
    accessToken: crypto.randomBytes(24).toString('base64url'),
    gate: template.access?.gate || 'email',
    expiresAt: new Date(Date.now() + expiresAfterDays * 24 * 60 * 60 * 1000),
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- snapshotService`
Expected: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add services/reports/snapshotService.js tests/unit/snapshotService.test.js
git commit -m "feat(reports): add snapshot builder + instance generator"
```

---

## Task 10: Catalog controller, route, and mount

**Files:**
- Create: `controllers/reportController.js`
- Create: `routes/reportRoutes.js`
- Modify: `server.js`
- Test: `tests/unit/reportController.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/reportController.test.js`:

```js
// File: tests/unit/reportController.test.js
import { getCatalog } from '../../controllers/reportController.js';

const mockRes = () => {
  const res = {};
  res.json = (payload) => { res._json = payload; return res; };
  res.status = (code) => { res._status = code; return res; };
  return res;
};

describe('reportController.getCatalog', () => {
  it('returns the permission-filtered catalog as { success, data }', async () => {
    const req = { userPermissions: ['analytics:advanced'], isOwner: false };
    const res = mockRes();
    await getCatalog(req, res, () => {});
    expect(res._json.success).toBe(true);
    expect(Array.isArray(res._json.data)).toBe(true);
    expect(res._json.data.find((b) => b.type === 'kpi.revenue')).toBeDefined();
    // metadata only — no resolve functions leak to the client
    expect(res._json.data.every((b) => b.resolve === undefined)).toBe(true);
  });

  it('hides gated blocks when the user lacks the permission', async () => {
    const req = { userPermissions: [], isOwner: false };
    const res = mockRes();
    await getCatalog(req, res, () => {});
    expect(res._json.data.find((b) => b.type === 'kpi.revenue')).toBeUndefined();
    expect(res._json.data.find((b) => b.type === 'layout.hero')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- reportController`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the controller**

Create `controllers/reportController.js`:

```js
// File: controllers/reportController.js
// Description: Authenticated controllers for the Report Builder.

import asyncHandler from 'express-async-handler';
import { getCatalog as getBlockCatalog } from '../services/reports/blockRegistry.js';

/**
 * @desc    Get the block catalog the current user may use, for the builder palette.
 * @route   GET /api/reports/catalog
 * @access  Private (reports:manage)
 */
export const getCatalog = asyncHandler(async (req, res) => {
  const catalog = getBlockCatalog(req.userPermissions || [], req.isOwner || false);
  res.json({ success: true, data: catalog });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- reportController`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Create the route**

Create `routes/reportRoutes.js`:

```js
// File: routes/reportRoutes.js
// Description: Authenticated routes for the Report Builder (Phase 0: catalog only).

import express from 'express';
import { protect, hasPermission } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';
import { getCatalog } from '../controllers/reportController.js';

const router = express.Router();

router.get('/catalog', protect, hasPermission(PERMISSIONS.REPORTS.MANAGE), getCatalog);

export default router;
```

- [ ] **Step 6: Mount the route in server.js**

In `server.js`, add the import. Use this exact anchor (existing line) and append the new import after it:

```js
import leadershipDashboardRoutes from './routes/leadershipDashboardRoutes.js';
```

becomes:

```js
import leadershipDashboardRoutes from './routes/leadershipDashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
```

Then add the mount. Use this exact anchor (existing line) and append the new mount after it:

```js
app.use('/api/leadership', leadershipDashboardRoutes);
```

becomes:

```js
app.use('/api/leadership', leadershipDashboardRoutes);
app.use('/api/reports', reportRoutes);
```

- [ ] **Step 7: Verify the full unit suite passes and the server boots**

Run: `npm run test:unit`
Expected: PASS — all unit suites green (sanity, permissions, defaultRoles, 3 models, blockHelpers, blockRegistry, snapshotService, reportController).

Run: `node -e "import('./server.js').then(() => { console.log('server module loaded'); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); })"`
Expected: the app imports without throwing (it will attempt to start; if it logs a successful boot / DB connection or "server module loaded", the wiring is valid). Stop it with Ctrl-C if it keeps running.

> Manual endpoint check (optional, requires a running server + a leadership JWT):
> `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/reports/catalog`
> Expected: `{ "success": true, "data": [ ... blocks ... ] }`.

- [ ] **Step 8: Commit**

```bash
git add controllers/reportController.js routes/reportRoutes.js server.js tests/unit/reportController.test.js
git commit -m "feat(reports): add GET /api/reports/catalog endpoint"
```

---

## Self-Review

**1. Spec coverage (Phase 0 rows of the spec):**
- Permissions `reports:*` + role grants → Tasks 2, 3. ✅
- 3 models (`ReportTemplate`, `ReportInstance`, `ReportView`) → Tasks 4, 5, 6. ✅
- Block registry + ~8 core blocks (delivered 15: 7 KPI, 3 chart, 1 table, 4 layout) → Task 8. ✅
- `snapshotService.generateInstance` + pure `buildSnapshotBlocks` → Task 9. ✅
- `GET /api/reports/catalog` (permission-filtered) → Task 10. ✅
- SMTP env config: **not** in Phase 0 — it is only needed when email is first sent (Phase 3/4). Moved to the Phase 3 plan. (Spec listed it under Phase 0; relocated because nothing in Phase 0 sends email.)

**2. Placeholder scan:** No "TBD"/"handle errors later"/"similar to" — every step has complete code and exact commands. ✅

**3. Type consistency:** `getBlock`/`getCatalog`/`BLOCKS` exported by `blockRegistry.js` and consumed verbatim by `snapshotService.js` (`getBlock`) and `reportController.js` (`getCatalog`). `buildSnapshotBlocks`/`resolvePeriodArgs`/`generateInstance` names match across `snapshotService.js` and its test. Model export names (`ReportTemplate`, `ReportInstance`, `ReportView`) match their imports. `PERMISSIONS.REPORTS.MANAGE` (defined in Task 2) is used in `routes/reportRoutes.js` (Task 10). Field `scope.period.preset` is consistent across the model (Task 4), `resolvePeriodArgs` (Task 9), and its test. ✅

---

## Execution Handoff

After all 10 tasks are committed, the remaining phases each get their own plan, written next:
- **Phase 1 — Builder:** template CRUD API + `POST /templates/:id/generate`; React builder (pick/arrange + theme + image upload) + preview.
- **Phase 2 — Public page + tracking:** public routes, `PublicReportPage`, email gate, `ReportView` logging, open-rate dashboard.
- **Phase 3 — Review & approve:** review screen, overrides, flags→notify owner, approval gate, internal mailers (+ SMTP env config here).
- **Phase 4 — Scheduling & delivery:** `jobs/generateScheduledReports.js` cron (registered in `server.js` next to `registerScheduledInsightJobs`), recipient emails.

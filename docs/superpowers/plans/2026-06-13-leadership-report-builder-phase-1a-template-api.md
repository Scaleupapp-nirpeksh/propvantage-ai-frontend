# Leadership Report Builder — Phase 1a (Template API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend the report builder needs — report-template CRUD, an ad-hoc "generate now" endpoint (reusing the Phase 0 snapshot service), and an image-upload endpoint (reusing the existing S3 service) — under the existing `reports:*` permissions.

**Architecture:** Extends the Phase 0 `reports` domain. Pure payload validation (`services/reports/templateValidation.js`) is TDD'd with the existing unit harness; thin controllers orchestrate Mongoose + the snapshot/S3 services and follow the repo's established controller conventions (org-scoped `findOne`, `{ success, data }` envelope, `asyncHandler` errors). Routes are added to the Phase 0 `routes/reportRoutes.js`, refactored to `router.use(protect)`.

**Tech Stack:** Node.js (ESM), Express, Mongoose 8, `express-async-handler`, `multer` (memory storage), Jest 29 (`npm run test:unit`).

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-backend`. Paths below are relative to that repo root.

**Depends on:** Phase 0 (merged to `main`): `reports:view/manage/approve` permissions, `ReportTemplate`/`ReportInstance` models (with exported enum consts), `services/reports/blockRegistry.js` (`getBlock`), `services/reports/snapshotService.js` (`generateInstance`), `services/s3Service.js` (`uploadFileToS3`), and `routes/reportRoutes.js` (currently only `GET /catalog`).

**Scope note:** Phase 1 is split into **1a (this plan — backend API)** and **1b (builder UI — next plan)**. 1a produces independently testable software: working template CRUD + generate + upload endpoints with green unit tests on the pure validation layer and import/`node --check` verification of the wiring.

**Testing reality:** The repo has no integration-test (DB) harness; like Phase 0, we TDD the pure logic (`validateTemplatePayload`) and verify the thin DB controllers via `node --check` + a live module import + a documented manual smoke test. Introducing `mongodb-memory-server` for full controller integration tests is deliberately out of scope here (avoids a new heavyweight dev-dependency and binary download); it's noted as a possible future task.

---

## File Structure

**New files:**
- `services/reports/templateValidation.js` — pure `validateTemplatePayload(body, opts)`.
- `controllers/reportTemplateController.js` — template CRUD + `generateTemplateInstance`.
- `tests/unit/templateValidation.test.js` — unit tests for the validator.

**Modified files:**
- `controllers/reportController.js` — add `uploadReportImage` (alongside existing `getCatalog`).
- `routes/reportRoutes.js` — refactor to `router.use(protect)`; add uploads, template CRUD, and generate routes.

---

## Task 1: Template payload validation (pure)

**Files:**
- Create: `services/reports/templateValidation.js`
- Test: `tests/unit/templateValidation.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/templateValidation.test.js`:

```js
// File: tests/unit/templateValidation.test.js
import { validateTemplatePayload } from '../../services/reports/templateValidation.js';

const fullValid = {
  name: 'Monthly Leadership Report',
  blocks: [
    { id: 'b1', type: 'kpi.revenue', config: {} },
    { id: 'b2', type: 'layout.hero', config: { title: 'Q2' } },
  ],
  theme: { preset: 'clean' },
  access: { gate: 'email' },
  delivery: { mode: 'review_then_send' },
  schedule: { frequency: 'monthly' },
  scope: { period: { preset: 'mtd' } },
};

describe('validateTemplatePayload', () => {
  it('accepts a full valid payload', () => {
    expect(validateTemplatePayload(fullValid)).toEqual({ valid: true, errors: [] });
  });

  it('requires name on create (non-partial)', () => {
    const r = validateTemplatePayload({ blocks: [] });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('name is required');
  });

  it('allows a partial update without name', () => {
    expect(validateTemplatePayload({ theme: { preset: 'midnight' } }, { partial: true }).valid).toBe(true);
  });

  it('rejects a non-array blocks field', () => {
    const r = validateTemplatePayload({ name: 'X', blocks: 'nope' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('blocks must be an array'))).toBe(true);
  });

  it('rejects an unknown block type', () => {
    const r = validateTemplatePayload({ name: 'X', blocks: [{ id: 'b1', type: 'kpi.unknown' }] });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('kpi.unknown') && e.includes('not a known block type'))).toBe(true);
  });

  it('requires id and type on each block', () => {
    const r = validateTemplatePayload({ name: 'X', blocks: [{ config: {} }] });
    expect(r.errors).toContain('blocks[0].id is required');
    expect(r.errors).toContain('blocks[0].type is required');
  });

  it('rejects bad enum values', () => {
    const r = validateTemplatePayload({
      name: 'X',
      theme: { preset: 'neon' },
      access: { gate: 'open' },
      delivery: { mode: 'blast' },
      schedule: { frequency: 'daily' },
      scope: { period: { preset: 'forever' } },
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.startsWith('theme.preset'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('access.gate'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('delivery.mode'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('schedule.frequency'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('scope.period.preset'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- templateValidation`
Expected: FAIL — `Cannot find module '../../services/reports/templateValidation.js'`.

- [ ] **Step 3: Create the validator**

Create `services/reports/templateValidation.js`:

```js
// File: services/reports/templateValidation.js
// Description: Pure validation for report-template create/update payloads. No I/O.

import { getBlock } from './blockRegistry.js';
import {
  THEME_PRESETS, GATE_TYPES, DELIVERY_MODES, SCHEDULE_FREQUENCIES, PERIOD_PRESETS,
} from '../../models/reportTemplateModel.js';

/**
 * Validate a report-template payload.
 * @param {object} body
 * @param {{ partial?: boolean }} [opts] - partial=true skips required-field checks (for PATCH/PUT updates)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateTemplatePayload = (body = {}, { partial = false } = {}) => {
  const errors = [];

  // name — required on create
  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name is required');
    } else if (body.name.length > 200) {
      errors.push('name must be 200 characters or fewer');
    }
  }

  // blocks — optional, but if present must be an array of {id, known type}
  if (body.blocks !== undefined) {
    if (!Array.isArray(body.blocks)) {
      errors.push('blocks must be an array');
    } else {
      body.blocks.forEach((b, i) => {
        if (!b || typeof b !== 'object') { errors.push(`blocks[${i}] must be an object`); return; }
        if (!b.id || typeof b.id !== 'string') errors.push(`blocks[${i}].id is required`);
        if (!b.type || typeof b.type !== 'string') errors.push(`blocks[${i}].type is required`);
        else if (!getBlock(b.type)) errors.push(`blocks[${i}].type "${b.type}" is not a known block type`);
      });
    }
  }

  // enum fields — only checked when present
  const enumCheck = (value, allowed, label) => {
    if (value !== undefined && !allowed.includes(value)) {
      errors.push(`${label} must be one of: ${allowed.join(', ')}`);
    }
  };
  enumCheck(body.theme?.preset, THEME_PRESETS, 'theme.preset');
  enumCheck(body.access?.gate, GATE_TYPES, 'access.gate');
  enumCheck(body.delivery?.mode, DELIVERY_MODES, 'delivery.mode');
  enumCheck(body.schedule?.frequency, SCHEDULE_FREQUENCIES, 'schedule.frequency');
  enumCheck(body.scope?.period?.preset, PERIOD_PRESETS, 'scope.period.preset');

  return { valid: errors.length === 0, errors };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- templateValidation`
Expected: PASS — 7 tests passed.

- [ ] **Step 5: Commit**

```bash
git add services/reports/templateValidation.js tests/unit/templateValidation.test.js
git commit -m "feat(reports): add pure report-template payload validation" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Template CRUD + generate controller

**Files:**
- Create: `controllers/reportTemplateController.js`

**Context:** Thin orchestration over Mongoose + Phase 0 services, matching the repo's controller idioms (`asyncHandler`; org-scoped `findOne({ _id, organization })`; `res.status(404); throw new Error(...)`; `{ success, data, message }` / list `{ success, data: { templates, pagination } }`). Not unit-tested (no DB harness); verified by `node --check` + import in Task 4 and the manual smoke test.

- [ ] **Step 1: Create the controller**

Create `controllers/reportTemplateController.js`:

```js
// File: controllers/reportTemplateController.js
// Description: CRUD + ad-hoc generation for report templates (Leadership Report Builder).

import asyncHandler from 'express-async-handler';
import ReportTemplate from '../models/reportTemplateModel.js';
import { validateTemplatePayload } from '../services/reports/templateValidation.js';
import { generateInstance } from '../services/reports/snapshotService.js';

/**
 * @desc    List report templates for the org (paginated)
 * @route   GET /api/reports/templates
 * @access  Private (reports:view)
 */
export const getTemplates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
  const query = { organization: req.user.organization };
  if (status) query.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
  const skip = (pageNum - 1) * limitNum;

  const [templates, total] = await Promise.all([
    ReportTemplate.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .limit(limitNum)
      .skip(skip),
    ReportTemplate.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);
  res.json({
    success: true,
    data: {
      templates,
      pagination: {
        total, currentPage: pageNum, totalPages,
        hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, limit: limitNum,
      },
    },
  });
});

/**
 * @desc    Get a single report template
 * @route   GET /api/reports/templates/:id
 * @access  Private (reports:view)
 */
export const getTemplateById = asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!template) { res.status(404); throw new Error('Report template not found'); }
  res.json({ success: true, data: template });
});

/**
 * @desc    Create a report template
 * @route   POST /api/reports/templates
 * @access  Private (reports:manage)
 */
export const createTemplate = asyncHandler(async (req, res) => {
  const { valid, errors } = validateTemplatePayload(req.body, { partial: false });
  if (!valid) { res.status(400); throw new Error(`Validation error: ${errors.join('; ')}`); }

  const template = await ReportTemplate.create({
    ...req.body,
    organization: req.user.organization,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json({ success: true, data: template, message: 'Report template created' });
});

/**
 * @desc    Update a report template
 * @route   PUT /api/reports/templates/:id
 * @access  Private (reports:manage)
 */
export const updateTemplate = asyncHandler(async (req, res) => {
  const { valid, errors } = validateTemplatePayload(req.body, { partial: true });
  if (!valid) { res.status(400); throw new Error(`Validation error: ${errors.join('; ')}`); }

  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!template) { res.status(404); throw new Error('Report template not found'); }

  // Apply only provided fields; never let the client move the doc to another org or spoof createdBy.
  const immutable = new Set(['organization', 'createdBy', '_id', 'createdAt', 'updatedAt']);
  Object.keys(req.body).forEach((key) => {
    if (!immutable.has(key) && req.body[key] !== undefined) template[key] = req.body[key];
  });
  template.updatedBy = req.user._id;

  const updated = await template.save();
  res.json({ success: true, data: updated, message: 'Report template updated' });
});

/**
 * @desc    Delete a report template
 * @route   DELETE /api/reports/templates/:id
 * @access  Private (reports:manage)
 */
export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!template) { res.status(404); throw new Error('Report template not found'); }
  await ReportTemplate.deleteOne({ _id: template._id });
  res.json({ success: true, message: `Report template '${template.name}' deleted` });
});

/**
 * @desc    Generate a report instance now (ad-hoc / preview) from a template
 * @route   POST /api/reports/templates/:id/generate
 * @access  Private (reports:manage)
 */
export const generateTemplateInstance = asyncHandler(async (req, res) => {
  const template = await ReportTemplate.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!template) { res.status(404); throw new Error('Report template not found'); }

  const instance = await generateInstance(template, {
    createdBy: req.user._id,
    accessibleProjectIds: req.accessibleProjectIds,
  });
  res.status(201).json({ success: true, data: instance, message: 'Report generated' });
});
```

- [ ] **Step 2: Syntax check**

Run: `node --check controllers/reportTemplateController.js`
Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add controllers/reportTemplateController.js
git commit -m "feat(reports): add report-template CRUD + generate controller" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Image upload controller

**Files:**
- Modify: `controllers/reportController.js` (add `uploadReportImage` next to existing `getCatalog`)

- [ ] **Step 1: Add the handler**

In `controllers/reportController.js`, add the import for the S3 service at the top (after the existing imports):

```js
import { uploadFileToS3 } from '../services/s3Service.js';
```

Then append this exported handler at the end of the file (after `getCatalog`):

```js
/**
 * @desc    Upload an image for use in a report template/instance (hero, gallery, logo)
 * @route   POST /api/reports/uploads   (multipart/form-data, field name 'file')
 * @access  Private (reports:manage)
 */
export const uploadReportImage = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded (expected form field "file")'); }
  const { url, s3Key } = await uploadFileToS3(req.file, `reports/${req.user.organization}`);
  res.status(201).json({ success: true, data: { url, s3Key } });
});
```

- [ ] **Step 2: Syntax check**

Run: `node --check controllers/reportController.js`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add controllers/reportController.js
git commit -m "feat(reports): add report image upload endpoint (S3)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire the routes

**Files:**
- Modify: `routes/reportRoutes.js` (replace the Phase 0 file contents)

**Context:** Phase 0 created `routes/reportRoutes.js` with a single inline-`protect` `/catalog` route. Refactor to `router.use(protect)` (cleaner now that there are many routes) and add uploads, template CRUD, and generate. Static/specific routes (`/catalog`, `/uploads`, `/templates`) are declared before the parameterized `/templates/:id` routes.

- [ ] **Step 1: Replace the route file**

Replace the entire contents of `routes/reportRoutes.js` with:

```js
// File: routes/reportRoutes.js
// Description: Authenticated routes for the Leadership Report Builder.

import express from 'express';
import multer from 'multer';
import { protect, hasPermission } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/permissions.js';
import { getCatalog, uploadReportImage } from '../controllers/reportController.js';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateTemplateInstance,
} from '../controllers/reportTemplateController.js';

const router = express.Router();

// Memory storage → req.file.buffer streamed to S3 (10MB cap), mirrors routes/fileRoutes.js
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

// Block catalog for the builder palette
router.get('/catalog', hasPermission(PERMISSIONS.REPORTS.MANAGE), getCatalog);

// Image upload (hero/gallery/logo)
router.post('/uploads', hasPermission(PERMISSIONS.REPORTS.MANAGE), upload.single('file'), uploadReportImage);

// Template CRUD
router
  .route('/templates')
  .get(hasPermission(PERMISSIONS.REPORTS.VIEW), getTemplates)
  .post(hasPermission(PERMISSIONS.REPORTS.MANAGE), createTemplate);

router
  .route('/templates/:id')
  .get(hasPermission(PERMISSIONS.REPORTS.VIEW), getTemplateById)
  .put(hasPermission(PERMISSIONS.REPORTS.MANAGE), updateTemplate)
  .delete(hasPermission(PERMISSIONS.REPORTS.MANAGE), deleteTemplate);

// Ad-hoc generate (preview / on-demand)
router.post('/templates/:id/generate', hasPermission(PERMISSIONS.REPORTS.MANAGE), generateTemplateInstance);

export default router;
```

(The `app.use('/api/reports', reportRoutes)` mount in `server.js` from Phase 0 is unchanged.)

- [ ] **Step 2: Verify wiring without booting the server**

Run each and confirm:
- `node --check routes/reportRoutes.js` → exit 0.
- `node --input-type=module -e "import('./routes/reportRoutes.js').then(() => console.log('reportRoutes import OK')).catch((e) => { console.error(e); process.exit(1); })"` → prints `reportRoutes import OK` (resolves all controller/service imports; does NOT boot a server). If it errors or hangs >10s, that's a real wiring problem — fix before continuing.
- `node --check controllers/reportTemplateController.js controllers/reportController.js services/reports/templateValidation.js` → exit 0.

- [ ] **Step 3: Run the full unit suite (no regressions)**

Run: `npm run test:unit`
Expected: PASS — all suites green, including the new `templateValidation` suite and the unchanged `reportController` (catalog) suite.

- [ ] **Step 4: Commit**

```bash
git add routes/reportRoutes.js
git commit -m "feat(reports): wire template CRUD, generate, and upload routes" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Manual smoke test (documented; requires a running server + leadership JWT)

**Files:** none (verification only).

This confirms the DB controllers (which have no automated coverage) actually work end-to-end. Run it once after Tasks 1–4. If a running backend + token isn't available in this environment, record that this step is deferred to the implementer's environment and proceed.

- [ ] **Step 1: Start the backend** (in a separate shell): `npm run server` (needs the `.env` with `MONGO_URI`, `JWT_SECRET`, and AWS S3 vars already present in the repo).

- [ ] **Step 2: Obtain a JWT** for a user with a leadership role (`reports:manage`), e.g. via `POST /api/auth/login`. Export it: `TOKEN=<jwt>`.

- [ ] **Step 3: Exercise the endpoints** (expect the documented responses):

```bash
BASE=http://localhost:3000/api/reports
# Catalog (sanity — from Phase 0):
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/catalog" | head -c 200      # → {"success":true,"data":[...]}

# Create a template:
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Report","blocks":[{"id":"b1","type":"kpi.revenue","config":{}}]}' \
  "$BASE/templates"                                                          # → 201 {"success":true,"data":{...,"_id":"<ID>"}}

# List templates:
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/templates" | head -c 300    # → {"success":true,"data":{"templates":[...],"pagination":{...}}}

# Generate an instance from the template (uses live analytics):
curl -s -X POST -H "Authorization: Bearer $TOKEN" "$BASE/templates/<ID>/generate" | head -c 400
#   → 201 {"success":true,"data":{"blocks":[{"type":"kpi.revenue","data":{"value":<num>,"unit":"currency"}}],"publicSlug":"...",...}}

# Validation rejection (unknown block type → 400):
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Bad","blocks":[{"id":"x","type":"nope.block"}]}' "$BASE/templates"   # → 400
```

- [ ] **Step 4:** Confirm: catalog returns blocks; create returns 201 with an `_id`; list includes it; generate returns an instance whose `blocks[].data` carries real numbers from the leadership overview and a `publicSlug`; the unknown-type create returns 400. Record results.

---

## Self-Review

**1. Spec coverage (Phase 1 backend half):**
- Template CRUD API → Tasks 2, 4. ✅
- `POST /templates/:id/generate` (reuses Phase 0 `generateInstance`) → Tasks 2, 4. ✅
- Image upload (reuses `s3Service`) → Tasks 3, 4. ✅
- Permission gating (`reports:view` for reads, `reports:manage` for writes/generate/upload) → Task 4. ✅
- (Builder UI, template-list UI, nav, routing, `reportAPI` → **Phase 1b**, next plan. Not in scope here.)

**2. Placeholder scan:** No TBD/"handle later" — every step has complete code or exact commands. The manual smoke test (Task 5) is a documented verification, not a placeholder. ✅

**3. Type/name consistency:** `validateTemplatePayload` (Task 1) is imported and called in `reportTemplateController.js` (Task 2) and nowhere else. Controller exports `getTemplates/getTemplateById/createTemplate/updateTemplate/deleteTemplate/generateTemplateInstance` — all six imported by name in `routes/reportRoutes.js` (Task 4). `uploadReportImage` exported from `reportController.js` (Task 3), imported in the route (Task 4). Enum consts (`THEME_PRESETS`, `GATE_TYPES`, `DELIVERY_MODES`, `SCHEDULE_FREQUENCIES`, `PERIOD_PRESETS`) are Phase 0 exports of `reportTemplateModel.js` — confirmed exported there. `generateInstance` and `getBlock` are Phase 0 exports — confirmed. `uploadFileToS3(file, folder) → {url, s3Key}` — confirmed signature. `PERMISSIONS.REPORTS.VIEW/MANAGE` exist from Phase 0. ✅

**4. Convention match:** Controllers use `asyncHandler`, org-scoped `findOne`, `res.status(404); throw`, and the `{ success, data, message }` envelope — matching `projectController.js`. Route file uses `router.use(protect)` + `router.route(...)` + `hasPermission(...)` — matching `projectRoutes.js`. Multer memory storage + 10MB cap mirrors `fileRoutes.js`. ✅

---

## Execution Handoff

After 1a is implemented and merged, **Phase 1b (Builder UI)** is the next plan: `reportAPI` in `src/services/api.js`; a `canAccess.reports()` gate + a **Reports** nav item in `DashboardLayout`; routes in `App.js`; a `ReportTemplateListPage`; a `ReportBlockRenderer` (shared with the Phase 2 public page); and the three-pane `ReportTemplateBuilder` (palette from `GET /catalog`, `@dnd-kit/sortable` reorder canvas with live preview, per-block config panel, theme picker, image upload via `POST /uploads`, save via the CRUD endpoints, and "Generate preview" via `POST /templates/:id/generate`). Frontend TDD targets the pure pieces (catalog grouping util, builder-state reducer) and a light RTL test of the block renderer.

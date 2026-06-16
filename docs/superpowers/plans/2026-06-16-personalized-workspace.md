# Personalized "My Workspace" Dashboards — v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each user build a personal dashboard of saved, filtered "cards" across Leads, Sales, Payments, Tasks, and Channel Partners — authored via a curated builder or natural language, rendered as a live list or a metric, optionally shared with teammates/roles.

**Architecture:** A backend **Query Engine** runs a validated, viewer-scoped **Query Plan** against a per-module **Field Catalog** (an allow-list of real + derived fields). The curated builder and an NL→QueryPlan compiler (Claude tool-use) are two front-doors to that one engine. Cards/layout live in two new Mongo collections (`WorkspaceCard`, `WorkspaceLayout`); a React **/workspace** page (default landing) renders a dnd-kit board of list/metric cards built from the existing `DataTable`/`KPICard` components.

**Tech Stack:** Backend — Node/Express (ESM), MongoDB/Mongoose, Joi, `@anthropic-ai/sdk` (`claude-sonnet-4-6`), Jest (`npm run test:unit`), `mongodb-memory-server`. Frontend — React 18, MUI 5, React Context, Axios, `@dnd-kit`, Recharts, notistack.

**How this plan is organized:** Tasks are grouped into four parts and numbered sequentially. Execute in order — Part A (engine + catalog foundation) → Part B (models, the other four catalogs, card/layout API, sharing) → Part C (natural language) → Part D (frontend). Within each part, every task is bite-sized TDD: write the failing test, run it (RED), implement, run it (GREEN), commit. The spec this plan implements is `docs/superpowers/specs/2026-06-16-personalized-workspace-design.md`.

**Cross-region contracts (stable across all parts):**
- **QueryPlan** = `{ module:'leads'|'sales'|'payments'|'tasks'|'channelPartners', logic:'AND', filters:[{field,op,value}], sort:{field,dir}|null, limit, nlSource }`.
- **Operators** = `is, in, notIn, gt, lt, gte, lte, between, lastNDays, isEmpty, isNotEmpty, contains`.
- **FieldDescriptor** = `{ key, label, type, operators, enumValues?, displayable, defaultColumn?, derived?, addFields?(), toMatch(op,value,viewerCtx) }`.
- **CatalogModule** = `{ module, label, baseModel, fields, scope(viewerCtx) }`; resolved via `getCatalog(module)`.
- **Engine**: `runQueryPlan(plan, viewerCtx, opts)` → `{rows,total}` (list) or `{value,breakdown}` (metric).
- **ViewerContext** = `{ organization, userId, accessibleProjectIds, isOwner, permissions }`, always built from the authenticated request — scoping is never taken from the plan.

---


## Part A — Backend: Query Engine & Field Catalog Foundation

### Task 1: QueryPlan Joi schema + validation helper (`queryPlanSchema.js`)

Define the canonical `QueryPlan` contract as a Joi schema and a `validateQueryPlan(plan)` helper. This is the seam every other region depends on, so the operator enum, module enum, and `limit` cap (default 50, max 200) must be exact. Pure logic, DB-free, runs under `jest.unit.config.mjs`.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/operators.js`
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/queryPlanSchema.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceQueryPlanSchema.test.js`

**Steps**

1. [ ] Write the failing test. Create `tests/unit/workspaceQueryPlanSchema.test.js`:

```js
// tests/unit/workspaceQueryPlanSchema.test.js
// Validates the canonical QueryPlan contract shared by builder, NL, and engine.
import { validateQueryPlan, MODULES } from '../../services/workspace/queryPlanSchema.js';
import { OPERATORS } from '../../services/workspace/operators.js';

const basePlan = (over = {}) => ({
  module: 'leads',
  logic: 'AND',
  filters: [{ field: 'status', op: 'is', value: 'New' }],
  sort: { field: 'createdAt', dir: 'desc' },
  limit: 50,
  nlSource: null,
  ...over,
});

describe('validateQueryPlan', () => {
  it('accepts a minimal valid leads plan and returns the coerced value', () => {
    const { error, value } = validateQueryPlan(basePlan());
    expect(error).toBeUndefined();
    expect(value.module).toBe('leads');
    expect(value.logic).toBe('AND');
    expect(value.filters[0]).toEqual({ field: 'status', op: 'is', value: 'New' });
  });

  it('exposes the exact module enum', () => {
    expect(MODULES).toEqual(['leads', 'sales', 'payments', 'tasks', 'channelPartners']);
  });

  it('exposes the exact operator enum', () => {
    expect(Object.values(OPERATORS)).toEqual([
      'is', 'in', 'notIn', 'gt', 'lt', 'gte', 'lte',
      'between', 'lastNDays', 'isEmpty', 'isNotEmpty', 'contains',
    ]);
  });

  it('defaults limit to 50 when omitted', () => {
    const { value } = validateQueryPlan(basePlan({ limit: undefined }));
    expect(value.limit).toBe(50);
  });

  it('caps limit at 200', () => {
    const { error } = validateQueryPlan(basePlan({ limit: 500 }));
    expect(error).toBeDefined();
    expect(error.message).toMatch(/limit/);
  });

  it('rejects an unknown module', () => {
    const { error } = validateQueryPlan(basePlan({ module: 'invoices' }));
    expect(error).toBeDefined();
    expect(error.message).toMatch(/module/);
  });

  it('rejects an unknown operator', () => {
    const { error } = validateQueryPlan(basePlan({ filters: [{ field: 'status', op: 'like', value: 'x' }] }));
    expect(error).toBeDefined();
    expect(error.message).toMatch(/op/);
  });

  it('rejects a logic value other than AND (v1 is AND-only)', () => {
    const { error } = validateQueryPlan(basePlan({ logic: 'OR' }));
    expect(error).toBeDefined();
  });

  it('requires at least one filter', () => {
    const { error } = validateQueryPlan(basePlan({ filters: [] }));
    expect(error).toBeDefined();
    expect(error.message).toMatch(/filters/);
  });

  it('allows sort to be null', () => {
    const { error } = validateQueryPlan(basePlan({ sort: null }));
    expect(error).toBeUndefined();
  });

  it('rejects a sort dir other than asc/desc', () => {
    const { error } = validateQueryPlan(basePlan({ sort: { field: 'createdAt', dir: 'up' } }));
    expect(error).toBeDefined();
  });

  it('strips unknown top-level keys', () => {
    const { value } = validateQueryPlan(basePlan({ evil: 'rm -rf' }));
    expect(value.evil).toBeUndefined();
  });
});
```

2. [ ] Run the test — expect FAIL (modules do not exist yet):

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryPlanSchema.test.js
```

Expected: `Cannot find module '../../services/workspace/queryPlanSchema.js'` / suite fails.

3. [ ] Implement the operator constants. Create `services/workspace/operators.js`:

```js
// File: services/workspace/operators.js
// Description: Canonical operator enum for Workspace Query Plans + a generic
// helper that turns a (field, op, value) triple into a Mongo match fragment for
// the common cases. Field-specific catalogs may override via their own toMatch.

/**
 * The exact, ordered operator key set shared across the builder UI, the NL
 * compiler, and the query engine. Order is contract — tests assert it.
 */
export const OPERATORS = Object.freeze({
  IS: 'is',
  IN: 'in',
  NOT_IN: 'notIn',
  GT: 'gt',
  LT: 'lt',
  GTE: 'gte',
  LTE: 'lte',
  BETWEEN: 'between',
  LAST_N_DAYS: 'lastNDays',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
  CONTAINS: 'contains',
});

/** Array form used by Joi `.valid(...)` and by FieldDescriptor.operators lists. */
export const OPERATOR_LIST = Object.freeze(Object.values(OPERATORS));

/**
 * Generic (field, op, value) -> Mongo match fragment for a *physical* path.
 * Catalog fields whose stored path differs from `key` pass `path`; derived
 * fields generally implement their own toMatch and do not call this.
 *
 * @param {string} path  Mongo document path to match against.
 * @param {string} op    One of OPERATOR_LIST.
 * @param {*} value      The user-supplied value.
 * @returns {object}     A Mongo match fragment, e.g. { status: { $gte: 15 } }.
 */
export const buildMatch = (path, op, value) => {
  switch (op) {
    case OPERATORS.IS:
      return { [path]: value };
    case OPERATORS.IN:
      return { [path]: { $in: Array.isArray(value) ? value : [value] } };
    case OPERATORS.NOT_IN:
      return { [path]: { $nin: Array.isArray(value) ? value : [value] } };
    case OPERATORS.GT:
      return { [path]: { $gt: value } };
    case OPERATORS.LT:
      return { [path]: { $lt: value } };
    case OPERATORS.GTE:
      return { [path]: { $gte: value } };
    case OPERATORS.LTE:
      return { [path]: { $lte: value } };
    case OPERATORS.BETWEEN: {
      const [min, max] = Array.isArray(value) ? value : [value, value];
      return { [path]: { $gte: min, $lte: max } };
    }
    case OPERATORS.LAST_N_DAYS: {
      const since = new Date(Date.now() - Number(value) * 24 * 60 * 60 * 1000);
      return { [path]: { $gte: since } };
    }
    case OPERATORS.IS_EMPTY:
      return { $or: [{ [path]: null }, { [path]: { $exists: false } }] };
    case OPERATORS.IS_NOT_EMPTY:
      return { [path]: { $nin: [null] }, [`${path}`]: { $exists: true, $ne: null } };
    case OPERATORS.CONTAINS:
      return { [path]: { $regex: String(value), $options: 'i' } };
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
};
```

4. [ ] Implement the Joi schema + helper. Create `services/workspace/queryPlanSchema.js`:

```js
// File: services/workspace/queryPlanSchema.js
// Description: Joi schema + validateQueryPlan() for the canonical Workspace
// Query Plan. Single source of truth for allowed modules, operators, limit cap.

import Joi from 'joi';
import { OPERATOR_LIST } from './operators.js';

/** The five queryable modules. Order is contract — tests assert it. */
export const MODULES = Object.freeze([
  'leads',
  'sales',
  'payments',
  'tasks',
  'channelPartners',
]);

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

const filterSchema = Joi.object({
  field: Joi.string().trim().min(1).required(),
  op: Joi.string()
    .valid(...OPERATOR_LIST)
    .required(),
  // value is intentionally permissive (any) — per-field type/op validity is
  // enforced by the catalog in the engine, not here.
  value: Joi.any(),
}).prefs({ presence: 'optional' });

const sortSchema = Joi.object({
  field: Joi.string().trim().min(1).required(),
  dir: Joi.string().valid('asc', 'desc').required(),
});

export const queryPlanSchema = Joi.object({
  module: Joi.string()
    .valid(...MODULES)
    .required(),
  // v1 is AND-only; the field exists so OR/grouping can land later without a
  // data migration.
  logic: Joi.string().valid('AND').default('AND'),
  filters: Joi.array().items(filterSchema).min(1).required(),
  sort: sortSchema.allow(null).default(null),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  nlSource: Joi.string().allow(null, '').default(null),
}).prefs({ stripUnknown: true, abortEarly: true, convert: true });

/**
 * Validate (and coerce defaults on) a Query Plan.
 * @param {object} plan Raw plan from the builder or the NL compiler.
 * @returns {{ value: object, error: (Joi.ValidationError|undefined) }}
 */
export const validateQueryPlan = (plan) => {
  const { value, error } = queryPlanSchema.validate(plan);
  return { value, error };
};
```

5. [ ] Run the test — expect PASS:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryPlanSchema.test.js
```

Expected: all assertions green.

6. [ ] Commit:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/operators.js services/workspace/queryPlanSchema.js tests/unit/workspaceQueryPlanSchema.test.js && git commit -m "feat(workspace): QueryPlan Joi schema + operator constants

Canonical Query Plan contract (modules, operators, limit cap 50/200, AND-only)
shared by the curated builder, NL compiler, and query engine.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Operators-backed Leads Field Catalog (`leadsCatalog.js`)

Build the Leads catalog from the **real** Lead model fields. Concrete fields: `status` (enum), `source` (enum incl. `'Channel Partner'`/`'Management'`), `assignedTo` (ref) plus derived `assignedToMe` (boolean vs `viewerCtx.userId`), `score` (number), `createdAt` (date), and the two headline derived fields `daysSinceLastCPFollowUp` and `daysInCurrentStatus`.

**Derivation assumption (documented in code):** the Lead model has **no dedicated CP-follow-up timestamp** (verified against `models/leadModel.js` and `models/interactionModel.js`). `daysSinceLastCPFollowUp` is therefore derived in an aggregation `$addFields` stage as *days since the most recent of:* the latest `channelPartnerAttribution.history[].at` entry, else `engagementMetrics.lastInteractionDate`, else `createdAt`. `daysInCurrentStatus` is derived from `statusChangedAt` (a real, hook-maintained field). Both are pure date arithmetic done server-side so they need no `$lookup`. DB-free unit test (we exercise `toMatch` and the `addFields()` pipeline shapes directly, not against Mongo).

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/leadsCatalog.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceLeadsCatalog.test.js`

**Steps**

1. [ ] Write the failing test. Create `tests/unit/workspaceLeadsCatalog.test.js`:

```js
// tests/unit/workspaceLeadsCatalog.test.js
// Unit-tests each Leads FieldDescriptor's toMatch() + the derived addFields()
// pipeline shapes. DB-free — asserts the Mongo fragments/stages directly.
import mongoose from 'mongoose';
import { leadsCatalog } from '../../services/workspace/catalogs/leadsCatalog.js';
import { OPERATORS } from '../../services/workspace/operators.js';

const field = (key) => leadsCatalog.fields.find((f) => f.key === key);
const viewer = (over = {}) => ({
  organization: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  accessibleProjectIds: null,
  isOwner: true,
  permissions: [],
  ...over,
});

describe('leadsCatalog', () => {
  it('is the leads module bound to the Lead base model', () => {
    expect(leadsCatalog.module).toBe('leads');
    expect(leadsCatalog.baseModel).toBe('Lead');
  });

  describe('status (enum)', () => {
    const f = () => field('status');
    it('carries the real Lead status enum', () => {
      expect(f().type).toBe('enum');
      expect(f().enumValues).toEqual([
        'pending', 'New', 'Qualified', 'Site Visit Completed',
        'Negotiating', 'Booked', 'Lost', 'Revived',
      ]);
    });
    it('toMatch is -> { status: value }', () => {
      expect(f().toMatch(OPERATORS.IS, 'New', viewer())).toEqual({ status: 'New' });
    });
    it('toMatch in -> { status: { $in: [...] } }', () => {
      expect(f().toMatch(OPERATORS.IN, ['New', 'Qualified'], viewer()))
        .toEqual({ status: { $in: ['New', 'Qualified'] } });
    });
  });

  describe('source (enum incl. Channel Partner / Management)', () => {
    const f = () => field('source');
    it('carries the real source enum', () => {
      expect(f().enumValues).toEqual([
        'Channel Partner', 'Management', 'Direct', 'Referral', 'Marketing', 'Cold Calling',
      ]);
    });
    it('toMatch is -> { source: "Channel Partner" }', () => {
      expect(f().toMatch(OPERATORS.IS, 'Channel Partner', viewer()))
        .toEqual({ source: 'Channel Partner' });
    });
  });

  describe('assignedTo (ref)', () => {
    const f = () => field('assignedTo');
    it('is a ref and casts the value to an ObjectId for `is`', () => {
      const id = new mongoose.Types.ObjectId();
      expect(f().type).toBe('ref');
      const frag = f().toMatch(OPERATORS.IS, id.toString(), viewer());
      expect(frag.assignedTo).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(frag.assignedTo.toString()).toBe(id.toString());
    });
    it('isEmpty -> unassigned leads', () => {
      const frag = f().toMatch(OPERATORS.IS_EMPTY, null, viewer());
      expect(frag).toEqual({ $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] });
    });
  });

  describe('assignedToMe (derived boolean)', () => {
    const f = () => field('assignedToMe');
    it('is derived and not directly displayable as a column', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('boolean');
    });
    it('true -> matches assignedTo === viewer.userId', () => {
      const v = viewer();
      const frag = f().toMatch(OPERATORS.IS, true, v);
      expect(frag.assignedTo.toString()).toBe(v.userId.toString());
    });
    it('false -> matches assignedTo !== viewer.userId', () => {
      const v = viewer();
      const frag = f().toMatch(OPERATORS.IS, false, v);
      expect(frag.assignedTo.$ne.toString()).toBe(v.userId.toString());
    });
  });

  describe('score (number)', () => {
    const f = () => field('score');
    it('gte -> { score: { $gte: 80 } }', () => {
      expect(f().toMatch(OPERATORS.GTE, 80, viewer())).toEqual({ score: { $gte: 80 } });
    });
    it('between -> { score: { $gte, $lte } }', () => {
      expect(f().toMatch(OPERATORS.BETWEEN, [40, 60], viewer()))
        .toEqual({ score: { $gte: 40, $lte: 60 } });
    });
  });

  describe('createdAt (date)', () => {
    const f = () => field('createdAt');
    it('lastNDays -> { createdAt: { $gte: <date> } }', () => {
      const frag = f().toMatch(OPERATORS.LAST_N_DAYS, 7, viewer());
      expect(frag.createdAt.$gte).toBeInstanceOf(Date);
      const ageMs = Date.now() - frag.createdAt.$gte.getTime();
      expect(ageMs).toBeGreaterThan(6.9 * 864e5);
      expect(ageMs).toBeLessThan(7.1 * 864e5);
    });
  });

  describe('daysInCurrentStatus (derived from statusChangedAt)', () => {
    const f = () => field('daysInCurrentStatus');
    it('declares an addFields stage computing days from statusChangedAt', () => {
      const stages = f().addFields();
      expect(stages).toHaveLength(1);
      const set = stages[0].$addFields.daysInCurrentStatus;
      expect(set).toEqual({
        $dateDiff: {
          startDate: { $ifNull: ['$statusChangedAt', '$createdAt'] },
          endDate: '$$NOW',
          unit: 'day',
        },
      });
    });
    it('gte -> { daysInCurrentStatus: { $gte: 15 } }', () => {
      expect(f().toMatch(OPERATORS.GTE, 15, viewer()))
        .toEqual({ daysInCurrentStatus: { $gte: 15 } });
    });
  });

  describe('daysSinceLastCPFollowUp (headline derived field)', () => {
    const f = () => field('daysSinceLastCPFollowUp');
    it('is derived, numeric, displayable, sortable', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('number');
      expect(f().displayable).toBe(true);
    });
    it('addFields computes lastCPFollowUpAt then days-since with documented fallback chain', () => {
      const stages = f().addFields();
      expect(stages).toHaveLength(2);
      // Stage 1: most-recent CP-history timestamp, falling back to last
      // interaction, then createdAt.
      expect(stages[0].$addFields.__lastCPFollowUpAt).toEqual({
        $ifNull: [
          { $max: '$channelPartnerAttribution.history.at' },
          { $ifNull: ['$engagementMetrics.lastInteractionDate', '$createdAt'] },
        ],
      });
      // Stage 2: integer day delta to now.
      expect(stages[1].$addFields.daysSinceLastCPFollowUp).toEqual({
        $dateDiff: { startDate: '$__lastCPFollowUpAt', endDate: '$$NOW', unit: 'day' },
      });
    });
    it('gte 15 -> { daysSinceLastCPFollowUp: { $gte: 15 } }', () => {
      expect(f().toMatch(OPERATORS.GTE, 15, viewer()))
        .toEqual({ daysSinceLastCPFollowUp: { $gte: 15 } });
    });
  });

  it('marks the default display columns', () => {
    const cols = leadsCatalog.fields.filter((f) => f.defaultColumn).map((f) => f.key);
    expect(cols).toEqual(
      expect.arrayContaining(['status', 'source', 'score', 'daysSinceLastCPFollowUp']),
    );
  });
});
```

2. [ ] Run the test — expect FAIL:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js
```

Expected: `Cannot find module '../../services/workspace/catalogs/leadsCatalog.js'`.

3. [ ] Implement the catalog. Create `services/workspace/catalogs/leadsCatalog.js`:

```js
// File: services/workspace/catalogs/leadsCatalog.js
// Description: Field Catalog for the Leads module — the allow-list of
// queryable/derived fields that drive the Workspace builder, NL compiler, and
// query engine. Each FieldDescriptor owns its own toMatch(); derived fields
// additionally declare addFields() aggregation stages.
//
// DERIVATION NOTE (daysSinceLastCPFollowUp): the Lead model has NO dedicated
// "last CP follow-up" timestamp (verified against models/leadModel.js and
// models/interactionModel.js). We derive it from the most recent
// channelPartnerAttribution.history[].at entry (CP actions are appended there),
// falling back to engagementMetrics.lastInteractionDate, then createdAt. This
// keeps the mapper co-located with the catalog and avoids a cross-collection
// $lookup. If a first-class CP-follow-up timestamp is added later, only this
// file changes.

import mongoose from 'mongoose';
import { OPERATORS, buildMatch } from '../operators.js';

const { ObjectId } = mongoose.Types;

// Real enums copied from models/leadModel.js (kept in sync via unit tests).
export const LEAD_STATUS_VALUES = [
  'pending', 'New', 'Qualified', 'Site Visit Completed',
  'Negotiating', 'Booked', 'Lost', 'Revived',
];
export const LEAD_SOURCE_VALUES = [
  'Channel Partner', 'Management', 'Direct', 'Referral', 'Marketing', 'Cold Calling',
];

const toObjectId = (v) => (v instanceof ObjectId ? v : new ObjectId(String(v)));

/** @type {import('../catalogs/index.js').FieldDescriptor[]} */
const fields = [
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    enumValues: LEAD_STATUS_VALUES,
    operators: [OPERATORS.IS, OPERATORS.IN, OPERATORS.NOT_IN],
    displayable: true,
    defaultColumn: true,
    toMatch: (op, value) => buildMatch('status', op, value),
  },
  {
    key: 'source',
    label: 'Source',
    type: 'enum',
    enumValues: LEAD_SOURCE_VALUES,
    operators: [OPERATORS.IS, OPERATORS.IN, OPERATORS.NOT_IN],
    displayable: true,
    defaultColumn: true,
    toMatch: (op, value) => buildMatch('source', op, value),
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    type: 'ref',
    operators: [OPERATORS.IS, OPERATORS.IN, OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY],
    displayable: true,
    defaultColumn: false,
    toMatch: (op, value) => {
      if (op === OPERATORS.IS_EMPTY || op === OPERATORS.IS_NOT_EMPTY) {
        return buildMatch('assignedTo', op, value);
      }
      if (op === OPERATORS.IN) {
        return { assignedTo: { $in: (Array.isArray(value) ? value : [value]).map(toObjectId) } };
      }
      return { assignedTo: toObjectId(value) };
    },
  },
  {
    key: 'assignedToMe',
    label: 'Assigned to me',
    type: 'boolean',
    operators: [OPERATORS.IS],
    displayable: false,
    derived: true,
    // Resolves against the viewer at query time — never the card author.
    toMatch: (op, value, viewerCtx) => {
      const me = toObjectId(viewerCtx.userId);
      return value === false ? { assignedTo: { $ne: me } } : { assignedTo: me };
    },
  },
  {
    key: 'score',
    label: 'Score',
    type: 'number',
    operators: [
      OPERATORS.IS, OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE, OPERATORS.BETWEEN,
    ],
    displayable: true,
    defaultColumn: true,
    toMatch: (op, value) => buildMatch('score', op, value),
  },
  {
    key: 'createdAt',
    label: 'Created',
    type: 'date',
    operators: [
      OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE,
      OPERATORS.BETWEEN, OPERATORS.LAST_N_DAYS,
    ],
    displayable: true,
    defaultColumn: false,
    toMatch: (op, value) => buildMatch('createdAt', op, value),
  },
  {
    key: 'daysInCurrentStatus',
    label: 'Days in current status',
    type: 'number',
    operators: [OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE, OPERATORS.BETWEEN],
    displayable: true,
    defaultColumn: false,
    derived: true,
    addFields: () => [
      {
        $addFields: {
          daysInCurrentStatus: {
            $dateDiff: {
              startDate: { $ifNull: ['$statusChangedAt', '$createdAt'] },
              endDate: '$$NOW',
              unit: 'day',
            },
          },
        },
      },
    ],
    toMatch: (op, value) => buildMatch('daysInCurrentStatus', op, value),
  },
  {
    key: 'daysSinceLastCPFollowUp',
    label: 'Days since last CP follow-up',
    type: 'number',
    operators: [OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE, OPERATORS.BETWEEN],
    displayable: true,
    defaultColumn: true,
    derived: true,
    addFields: () => [
      {
        $addFields: {
          // Most recent CP action timestamp; documented fallback chain.
          __lastCPFollowUpAt: {
            $ifNull: [
              { $max: '$channelPartnerAttribution.history.at' },
              { $ifNull: ['$engagementMetrics.lastInteractionDate', '$createdAt'] },
            ],
          },
        },
      },
      {
        $addFields: {
          daysSinceLastCPFollowUp: {
            $dateDiff: { startDate: '$__lastCPFollowUpAt', endDate: '$$NOW', unit: 'day' },
          },
        },
      },
    ],
    toMatch: (op, value) => buildMatch('daysSinceLastCPFollowUp', op, value),
  },
];

/**
 * Catalog module object. `scope(viewerCtx)` returns the base $match: always the
 * org boundary, plus project scoping unless the viewer has full access
 * (accessibleProjectIds === null).
 * @type {import('../catalogs/index.js').CatalogModule}
 */
export const leadsCatalog = {
  module: 'leads',
  label: 'Leads',
  baseModel: 'Lead',
  fields,
  scope: (viewerCtx) => {
    const match = { organization: toObjectId(viewerCtx.organization) };
    if (Array.isArray(viewerCtx.accessibleProjectIds)) {
      match.project = { $in: viewerCtx.accessibleProjectIds.map(toObjectId) };
    }
    return match;
  },
};

export default leadsCatalog;
```

4. [ ] Run the test — expect PASS:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js
```

Expected: all green, including the two derived-field `addFields` shape assertions.

5. [ ] Commit:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/leadsCatalog.js tests/unit/workspaceLeadsCatalog.test.js && git commit -m "feat(workspace): Leads field catalog with derived CP-follow-up + status-age fields

Allow-list of queryable Lead fields (status, source, assignedTo, score, createdAt)
plus derived assignedToMe, daysInCurrentStatus (from statusChangedAt) and the
headline daysSinceLastCPFollowUp (from CP attribution history with a documented
fallback chain). Each field owns its toMatch(); derived fields declare addFields().

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Catalog registry (`catalogs/index.js`) with `getCatalog`

A single registry that maps a module key to its catalog module and throws on unknown/unregistered modules. Leads is wired now; the other four modules are registered by their owning regions later (the registry tolerates a registered module whose catalog is not yet imported by failing loudly only when *requested*). DB-free unit test.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceCatalogRegistry.test.js`

**Steps**

1. [ ] Write the failing test. Create `tests/unit/workspaceCatalogRegistry.test.js`:

```js
// tests/unit/workspaceCatalogRegistry.test.js
import { getCatalog, listCatalogModules } from '../../services/workspace/catalogs/index.js';
import { leadsCatalog } from '../../services/workspace/catalogs/leadsCatalog.js';

describe('catalog registry', () => {
  it('returns the leads catalog by module key', () => {
    expect(getCatalog('leads')).toBe(leadsCatalog);
  });

  it('lists the currently registered modules (leads is wired in this region)', () => {
    expect(listCatalogModules()).toContain('leads');
  });

  it('throws a clear error for an unknown module', () => {
    expect(() => getCatalog('invoices')).toThrow(/Unknown or unregistered module: invoices/);
  });

  it('throws for a missing module key', () => {
    expect(() => getCatalog()).toThrow(/module is required/);
  });
});
```

2. [ ] Run the test — expect FAIL:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceCatalogRegistry.test.js
```

Expected: `Cannot find module '../../services/workspace/catalogs/index.js'`.

3. [ ] Implement the registry. Create `services/workspace/catalogs/index.js`:

```js
// File: services/workspace/catalogs/index.js
// Description: Catalog registry. Maps a module key -> its CatalogModule. Leads
// is wired in this region; sales/payments/tasks/channelPartners are added by
// their owning regions (import their catalog and add a line below).
//
// Shared type shapes (JSDoc, for editor help only — this is plain ESM):
//
// @typedef {Object} FieldDescriptor
// @property {string} key
// @property {string} label
// @property {'string'|'number'|'date'|'enum'|'ref'|'boolean'} type
// @property {string[]} operators
// @property {string[]} [enumValues]
// @property {boolean} displayable
// @property {boolean} [defaultColumn]
// @property {boolean} [derived]
// @property {() => object[]} [addFields]   aggregation stages for a derived field
// @property {(op: string, value: *, viewerCtx: object) => object} toMatch
//
// @typedef {Object} CatalogModule
// @property {string} module
// @property {string} label
// @property {string} baseModel
// @property {FieldDescriptor[]} fields
// @property {(viewerCtx: object) => object} scope

import { leadsCatalog } from './leadsCatalog.js';

const REGISTRY = {
  leads: leadsCatalog,
  // sales: salesCatalog,                 // added by the Sales region
  // payments: paymentsCatalog,           // added by the Payments region
  // tasks: tasksCatalog,                 // added by the Tasks region
  // channelPartners: channelPartnersCatalog, // added by the CP region
};

/** @returns {string[]} the module keys currently wired into the registry. */
export const listCatalogModules = () => Object.keys(REGISTRY);

/**
 * Resolve a module's catalog.
 * @param {string} module One of the registered module keys.
 * @returns {CatalogModule}
 * @throws if module is missing or not registered.
 */
export const getCatalog = (module) => {
  if (!module) throw new Error('module is required');
  const catalog = REGISTRY[module];
  if (!catalog) throw new Error(`Unknown or unregistered module: ${module}`);
  return catalog;
};

export default getCatalog;
```

4. [ ] Run the test — expect PASS:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceCatalogRegistry.test.js
```

Expected: all green.

5. [ ] Commit:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/index.js tests/unit/workspaceCatalogRegistry.test.js && git commit -m "feat(workspace): catalog registry with getCatalog(module)

Maps module keys to CatalogModules; leads wired now, other four modules left as
documented registration points for their owning regions. Throws on unknown module.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Query engine (`queryEngine.js`) — list + metric modes, viewer-scoped

`runQueryPlan(plan, viewerCtx)` resolves the catalog, builds the base `$match` from `catalog.scope(viewerCtx)`, adds `addFields()` stages **only** for derived fields referenced by filters/sort, builds the filter `$match` via each field's `toMatch`, then either sorts+limits (list → `{ rows, total }`) or runs `$count`/`$group` (metric → `{ value, breakdown }`). Scoping comes from `viewerCtx`, never the plan.

This is the one region task that needs a real database, so the test seeds leads across two orgs/projects in an in-memory Mongo. `mongodb-memory-server` is **not yet a dependency** (verified) — Step 1 adds it. The test lives in `tests/unit/` (matched by `jest.unit.config.mjs`) but connects mongoose to the in-memory server itself.

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/package.json` (add `mongodb-memory-server` devDependency)
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/queryEngine.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceQueryEngine.test.js`

**Steps**

1. [ ] Add the in-memory Mongo dev dependency (real install — it is not present):

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm install --save-dev mongodb-memory-server@^10.1.2
```

Expected: `package.json` `devDependencies` now lists `mongodb-memory-server`; `package-lock.json` updated.

2. [ ] Write the failing test. Create `tests/unit/workspaceQueryEngine.test.js`:

```js
// tests/unit/workspaceQueryEngine.test.js
// Engine integration test against an in-memory Mongo. Seeds leads across two
// orgs/projects and asserts: cross-org isolation, project-access scoping, a
// derived-field filter (daysSinceLastCPFollowUp gte 15), and metric count mode.
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Lead from '../../models/leadModel.js';
import { runQueryPlan } from '../../services/workspace/queryEngine.js';

jest.setTimeout(60000);

let mongod;
const ORG_A = new mongoose.Types.ObjectId();
const ORG_B = new mongoose.Types.ObjectId();
const PROJ_A1 = new mongoose.Types.ObjectId();
const PROJ_A2 = new mongoose.Types.ObjectId();
const USER_A = new mongoose.Types.ObjectId();

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seedLead = (over) => Lead.create({
  firstName: 'Seed',
  phone: '9000000000',
  organization: ORG_A,
  project: PROJ_A1,
  source: 'Channel Partner',
  status: 'New',
  ...over,
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Org A / Project A1 — stale CP lead: last CP history 20 days ago.
  await seedLead({
    project: PROJ_A1, assignedTo: USER_A, score: 90,
    channelPartnerAttribution: {
      viaChannelPartner: true,
      history: [{ at: daysAgo(40), action: 'tagged' }, { at: daysAgo(20), action: 'note' }],
    },
  });
  // Org A / Project A1 — fresh CP lead: last CP history 3 days ago.
  await seedLead({
    project: PROJ_A1, score: 50,
    channelPartnerAttribution: { viaChannelPartner: true, history: [{ at: daysAgo(3), action: 'note' }] },
  });
  // Org A / Project A2 — stale, but in a project USER_A cannot access.
  await seedLead({
    project: PROJ_A2, score: 70,
    channelPartnerAttribution: { viaChannelPartner: true, history: [{ at: daysAgo(30), action: 'note' }] },
  });
  // Org B — different tenant, very stale; must never leak into Org A queries.
  await seedLead({
    organization: ORG_B, project: new mongoose.Types.ObjectId(), score: 99,
    channelPartnerAttribution: { viaChannelPartner: true, history: [{ at: daysAgo(99), action: 'note' }] },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const ownerViewer = (org) => ({
  organization: org, userId: USER_A, accessibleProjectIds: null, isOwner: true, permissions: [],
});
const scopedViewer = (org, projectIds) => ({
  organization: org, userId: USER_A, accessibleProjectIds: projectIds, isOwner: false, permissions: [],
});

const stalePlan = (over = {}) => ({
  module: 'leads',
  logic: 'AND',
  filters: [{ field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 }],
  sort: { field: 'daysSinceLastCPFollowUp', dir: 'desc' },
  limit: 50,
  nlSource: null,
  ...over,
});

describe('runQueryPlan — list mode', () => {
  it('(a) cross-org isolation: an Org A owner never sees Org B rows', async () => {
    const { rows, total } = await runQueryPlan(stalePlan(), ownerViewer(ORG_A));
    expect(total).toBe(2); // two stale CP leads in Org A (PROJ_A1 + PROJ_A2)
    rows.forEach((r) => expect(r.organization.toString()).toBe(ORG_A.toString()));
  });

  it('(b) project-access scoping: a user limited to PROJ_A1 only sees that project', async () => {
    const { rows, total } = await runQueryPlan(stalePlan(), scopedViewer(ORG_A, [PROJ_A1.toString()]));
    expect(total).toBe(1);
    expect(rows[0].project.toString()).toBe(PROJ_A1.toString());
  });

  it('(c) derived filter daysSinceLastCPFollowUp gte 15 returns the right rows, sorted desc', async () => {
    const { rows } = await runQueryPlan(stalePlan(), ownerViewer(ORG_A));
    expect(rows.every((r) => r.daysSinceLastCPFollowUp >= 15)).toBe(true);
    // newest-stale-first: PROJ_A2 (30d) ahead of PROJ_A1 stale (20d)
    expect(rows[0].daysSinceLastCPFollowUp).toBeGreaterThanOrEqual(rows[1].daysSinceLastCPFollowUp);
  });

  it('respects accessibleProjectIds: [] (no access) -> no rows', async () => {
    const { rows, total } = await runQueryPlan(stalePlan(), scopedViewer(ORG_A, []));
    expect(total).toBe(0);
    expect(rows).toEqual([]);
  });
});

describe('runQueryPlan — metric (count) mode', () => {
  it('(d) returns a count value for the stale-CP plan under the viewer scope', async () => {
    const { value } = await runQueryPlan(
      stalePlan(),
      ownerViewer(ORG_A),
      { renderMode: 'metric', metricConfig: { agg: 'count', field: null } },
    );
    expect(value).toBe(2);
  });

  it('metric count honours project scoping', async () => {
    const { value } = await runQueryPlan(
      stalePlan(),
      scopedViewer(ORG_A, [PROJ_A1.toString()]),
      { renderMode: 'metric', metricConfig: { agg: 'count', field: null } },
    );
    expect(value).toBe(1);
  });
});
```

3. [ ] Run the test — expect FAIL:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryEngine.test.js
```

Expected: `Cannot find module '../../services/workspace/queryEngine.js'`.

4. [ ] Implement the engine. Create `services/workspace/queryEngine.js`:

```js
// File: services/workspace/queryEngine.js
// Description: The Workspace query engine. Compiles a validated Query Plan into a
// Mongo aggregation pipeline, ALWAYS re-scoped to the viewer (org +
// accessibleProjectIds via catalog.scope), and runs it in list or metric mode.
//
//   runQueryPlan(plan, viewerCtx)                                   -> { rows, total }
//   runQueryPlan(plan, viewerCtx, { renderMode:'metric', metricConfig }) -> { value, breakdown }
//
// Security: scoping is taken from viewerCtx (built from the authenticated req in
// the controller), NEVER from the plan. Derived fields are materialised only
// when referenced by a filter or sort, keeping pipelines minimal.

import mongoose from 'mongoose';
import { validateQueryPlan } from './queryPlanSchema.js';
import { getCatalog } from './catalogs/index.js';

/** Build a field-key -> FieldDescriptor lookup for a catalog. */
const indexFields = (catalog) => {
  const map = new Map();
  catalog.fields.forEach((f) => map.set(f.key, f));
  return map;
};

/** Keys referenced by the plan's filters + sort (the only derived fields we add). */
const referencedKeys = (plan) => {
  const keys = new Set(plan.filters.map((f) => f.field));
  if (plan.sort?.field) keys.add(plan.sort.field);
  return keys;
};

/**
 * Run a Query Plan under a viewer's scope.
 * @param {object} plan Raw or validated Query Plan (§3.3).
 * @param {object} viewerCtx { organization, userId, accessibleProjectIds, isOwner, permissions }.
 * @param {object} [opts] { renderMode:'list'|'metric', metricConfig:{ agg, field } }.
 * @returns {Promise<{rows:object[], total:number}|{value:number, breakdown:object[]}>}
 */
export const runQueryPlan = async (plan, viewerCtx, opts = {}) => {
  const { value: validPlan, error } = validateQueryPlan(plan);
  if (error) throw new Error(`Invalid query plan: ${error.message}`);

  const catalog = getCatalog(validPlan.module);
  const byKey = indexFields(catalog);

  // Every referenced field must be in the catalog allow-list.
  referencedKeys(validPlan).forEach((key) => {
    if (!byKey.has(key)) throw new Error(`Unknown field for module ${validPlan.module}: ${key}`);
  });

  const Model = mongoose.model(catalog.baseModel);
  const pipeline = [];

  // 1) Base scope ($match): org + project-access (from the viewer, not the plan).
  pipeline.push({ $match: catalog.scope(viewerCtx) });

  // 2) addFields() for derived fields referenced by filters/sort (dedup by key).
  const added = new Set();
  referencedKeys(validPlan).forEach((key) => {
    const f = byKey.get(key);
    if (f?.derived && typeof f.addFields === 'function' && !added.has(key)) {
      pipeline.push(...f.addFields());
      added.add(key);
    }
  });

  // 3) Filter $match: AND of each field's toMatch fragment.
  if (validPlan.filters.length) {
    const frags = validPlan.filters.map((flt) =>
      byKey.get(flt.field).toMatch(flt.op, flt.value, viewerCtx),
    );
    pipeline.push({ $match: frags.length === 1 ? frags[0] : { $and: frags } });
  }

  const renderMode = opts.renderMode || 'list';

  // ---- Metric mode --------------------------------------------------------
  if (renderMode === 'metric') {
    const agg = opts.metricConfig?.agg || 'count';
    const field = opts.metricConfig?.field || null;
    if (agg === 'count') {
      const res = await Model.aggregate([...pipeline, { $count: 'value' }]);
      return { value: res[0]?.value || 0, breakdown: [] };
    }
    // sum/avg over a numeric catalog field (near extension per design §3.5).
    if ((agg === 'sum' || agg === 'avg') && field) {
      const accumulator = agg === 'sum' ? { $sum: `$${field}` } : { $avg: `$${field}` };
      const res = await Model.aggregate([
        ...pipeline,
        { $group: { _id: null, value: accumulator } },
      ]);
      return { value: res[0]?.value || 0, breakdown: [] };
    }
    throw new Error(`Unsupported metric aggregation: ${agg}`);
  }

  // ---- List mode ----------------------------------------------------------
  if (validPlan.sort) {
    pipeline.push({ $sort: { [validPlan.sort.field]: validPlan.sort.dir === 'asc' ? 1 : -1 } });
  }

  // Total before limit (clone the scope+derived+filter stages, count them).
  const countPipeline = [...pipeline.filter((s) => !s.$sort), { $count: 'total' }];
  const [countRes, rows] = await Promise.all([
    Model.aggregate(countPipeline),
    Model.aggregate([...pipeline, { $limit: validPlan.limit }]),
  ]);

  return { rows, total: countRes[0]?.total || 0 };
};

export default runQueryPlan;
```

5. [ ] Run the test — expect PASS:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryEngine.test.js
```

Expected: all six assertions green — cross-org isolation (total 2), project scoping (total 1), `[]`-access (total 0), derived filter + desc sort, and both metric-count cases (2 and 1).

6. [ ] Run the whole workspace unit suite to confirm nothing regressed:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryPlanSchema.test.js tests/unit/workspaceLeadsCatalog.test.js tests/unit/workspaceCatalogRegistry.test.js tests/unit/workspaceQueryEngine.test.js
```

Expected: 4 suites pass.

7. [ ] Commit:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add package.json package-lock.json services/workspace/queryEngine.js tests/unit/workspaceQueryEngine.test.js && git commit -m "feat(workspace): viewer-scoped query engine (list + metric modes)

runQueryPlan compiles a validated Query Plan into a Mongo aggregation re-scoped
to the viewer (org + accessibleProjectIds via catalog.scope), materialising
derived fields only when referenced. List mode returns { rows, total }; metric
mode returns { value, breakdown } (count, with sum/avg extension). Adds
mongodb-memory-server for the seeded cross-org/project + derived-field tests.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```


## Part B — Backend: Models, Module Catalogs, Card/Layout API & Sharing

### Task 5: `WorkspaceCard` model

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/models/workspaceCardModel.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceCardModel.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceCardModel.test.js`:
```js
// tests/unit/workspaceCardModel.test.js
import mongoose from 'mongoose';
import WorkspaceCard, { WORKSPACE_MODULES, RENDER_MODES } from '../../models/workspaceCardModel.js';

const valid = (over = {}) => ({
  organization: new mongoose.Types.ObjectId(),
  ownerId: new mongoose.Types.ObjectId(),
  title: 'Stale CP leads',
  module: 'leads',
  ...over,
});

describe('WorkspaceCard model', () => {
  it('exports the five modules and two render modes', () => {
    expect(WORKSPACE_MODULES).toEqual(['leads', 'sales', 'payments', 'tasks', 'channelPartners']);
    expect(RENDER_MODES).toEqual(['list', 'metric']);
  });

  it('validates a minimal valid document', () => {
    expect(new WorkspaceCard(valid()).validateSync()).toBeUndefined();
  });

  it('requires organization, ownerId, title and module', () => {
    const err = new WorkspaceCard({}).validateSync();
    expect(err.errors.organization).toBeDefined();
    expect(err.errors.ownerId).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.module).toBeDefined();
  });

  it('defaults renderMode=list, visibility=private, metricConfig.agg=count, metricConfig.field=null', () => {
    const doc = new WorkspaceCard(valid());
    expect(doc.renderMode).toBe('list');
    expect(doc.visibility).toBe('private');
    expect(doc.metricConfig.agg).toBe('count');
    expect(doc.metricConfig.field).toBeNull();
    expect(doc.sharedWithUsers).toEqual([]);
    expect(doc.sharedWithRoles).toEqual([]);
  });

  it('rejects an unknown module', () => {
    expect(new WorkspaceCard(valid({ module: 'bogus' })).validateSync().errors.module).toBeDefined();
  });

  it('rejects an unknown renderMode and an unknown metricConfig.agg', () => {
    expect(new WorkspaceCard(valid({ renderMode: 'chart' })).validateSync().errors.renderMode).toBeDefined();
    expect(
      new WorkspaceCard(valid({ metricConfig: { agg: 'median' } })).validateSync().errors['metricConfig.agg']
    ).toBeDefined();
  });

  it('rejects an unknown visibility', () => {
    expect(new WorkspaceCard(valid({ visibility: 'public' })).validateSync().errors.visibility).toBeDefined();
  });

  it('stores queryPlan as mixed (arbitrary shape accepted)', () => {
    const doc = new WorkspaceCard(valid({
      queryPlan: { module: 'leads', logic: 'AND', filters: [{ field: 'source', op: 'is', value: 'Channel Partner' }], sort: null, limit: 50 },
    }));
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.queryPlan.filters[0].field).toBe('source');
  });
});
```

- [ ] **Run the test — expect FAIL** (module does not exist yet):
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceCardModel
```
Expect: `Cannot find module '../../models/workspaceCardModel.js'`.

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/models/workspaceCardModel.js`:
```js
// File: models/workspaceCardModel.js
// Description: A saved, filtered query ("card") over one module, rendered as a
//   live list or a metric. Cards are shareable, so they live in their own
//   collection rather than User.preferences. See workspace design spec §5.

import mongoose from 'mongoose';

export const WORKSPACE_MODULES = ['leads', 'sales', 'payments', 'tasks', 'channelPartners'];
export const RENDER_MODES = ['list', 'metric'];
export const METRIC_AGGS = ['count', 'sum', 'avg'];
export const VISIBILITIES = ['private', 'shared'];

const metricConfigSchema = new mongoose.Schema(
  {
    agg: { type: String, enum: METRIC_AGGS, default: 'count' },
    field: { type: String, default: null },
  },
  { _id: false }
);

const workspaceCardSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    module: {
      type: String,
      enum: WORKSPACE_MODULES,
      required: [true, 'Module is required'],
    },
    // Validated §3.3 Query Plan. Stored as Mixed; shape is enforced by
    // services/workspace/queryPlanSchema.js at write time in the controller.
    queryPlan: { type: mongoose.Schema.Types.Mixed, default: {} },
    renderMode: { type: String, enum: RENDER_MODES, default: 'list' },
    metricConfig: { type: metricConfigSchema, default: () => ({}) },
    visibility: { type: String, enum: VISIBILITIES, default: 'private' },
    sharedWithUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharedWithRoles: [{ type: String, trim: true }], // role names, e.g. 'Sales Manager'
  },
  { timestamps: true }
);

// The two hot read paths: "my cards" and "shared-to-me" lookups are org-scoped.
workspaceCardSchema.index({ organization: 1, ownerId: 1 });
workspaceCardSchema.index({ organization: 1, visibility: 1 });

const WorkspaceCard = mongoose.model('WorkspaceCard', workspaceCardSchema);

export default WorkspaceCard;
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceCardModel
```
Expect: all assertions green.

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add models/workspaceCardModel.js tests/unit/workspaceCardModel.test.js && git commit -m "feat(workspace): WorkspaceCard model with module/render/visibility enums

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `WorkspaceLayout` model

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/models/workspaceLayoutModel.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceLayoutModel.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceLayoutModel.test.js`:
```js
// tests/unit/workspaceLayoutModel.test.js
import mongoose from 'mongoose';
import WorkspaceLayout, { CARD_SIZES } from '../../models/workspaceLayoutModel.js';

const valid = (over = {}) => ({
  organization: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  ...over,
});

describe('WorkspaceLayout model', () => {
  it('exports the three card sizes', () => {
    expect(CARD_SIZES).toEqual(['sm', 'md', 'lg']);
  });

  it('validates a minimal valid document with empty items', () => {
    const doc = new WorkspaceLayout(valid());
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.items).toEqual([]);
  });

  it('requires organization and userId', () => {
    const err = new WorkspaceLayout({}).validateSync();
    expect(err.errors.organization).toBeDefined();
    expect(err.errors.userId).toBeDefined();
  });

  it('validates an item with cardId + order and defaults size to md', () => {
    const doc = new WorkspaceLayout(valid({
      items: [{ cardId: new mongoose.Types.ObjectId(), order: 0 }],
    }));
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.items[0].size).toBe('md');
  });

  it('requires cardId on each item', () => {
    const doc = new WorkspaceLayout(valid({ items: [{ order: 0 }] }));
    expect(doc.validateSync().errors['items.0.cardId']).toBeDefined();
  });

  it('rejects an invalid item size', () => {
    const doc = new WorkspaceLayout(valid({
      items: [{ cardId: new mongoose.Types.ObjectId(), order: 0, size: 'xl' }],
    }));
    expect(doc.validateSync().errors['items.0.size']).toBeDefined();
  });

  it('declares a unique index on userId', () => {
    const userIndex = WorkspaceLayout.schema.indexes().find(
      ([keys]) => keys.userId === 1 && Object.keys(keys).length === 1
    );
    expect(userIndex).toBeDefined();
    expect(userIndex[1].unique).toBe(true);
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceLayoutModel
```
Expect: `Cannot find module '../../models/workspaceLayoutModel.js'`.

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/models/workspaceLayoutModel.js`:
```js
// File: models/workspaceLayoutModel.js
// Description: One personal board layout per user — the ordered, sized list of
//   cards a user has pinned. Always personal, even when it references a shared
//   card. See workspace design spec §5.

import mongoose from 'mongoose';

export const CARD_SIZES = ['sm', 'md', 'lg'];

const layoutItemSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkspaceCard',
      required: [true, 'cardId is required'],
    },
    order: { type: Number, default: 0 },
    size: { type: String, enum: CARD_SIZES, default: 'md' },
  },
  { _id: false }
);

const workspaceLayoutSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true, // one layout per user
    },
    items: { type: [layoutItemSchema], default: [] },
  },
  { timestamps: true }
);

const WorkspaceLayout = mongoose.model('WorkspaceLayout', workspaceLayoutSchema);

export default WorkspaceLayout;
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceLayoutModel
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add models/workspaceLayoutModel.js tests/unit/workspaceLayoutModel.test.js && git commit -m "feat(workspace): WorkspaceLayout model (one per user, sized board items)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Sales catalog (`salesCatalog.js`)

Real fields from `models/salesModel.js`: `status` (enum), `bookingDate` (date), `salePrice` (number), `channelPartner` (ref Organization), plus derived `daysInCurrentStatus`. `FieldDescriptor.toMatch(op, value, viewerCtx)` returns a Mongo match fragment; derived fields also expose `addFields()` returning an aggregation `$addFields` stage that materializes the derived key before matching (the engine pipelines `addFields → match`).

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/salesCatalog.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/salesCatalog.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/salesCatalog.test.js`:
```js
// tests/unit/salesCatalog.test.js
import mongoose from 'mongoose';
import salesCatalog from '../../services/workspace/catalogs/salesCatalog.js';

const field = (key) => salesCatalog.fields.find((f) => f.key === key);
const viewerCtx = { organization: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), accessibleProjectIds: [], isOwner: true, permissions: [] };

describe('salesCatalog', () => {
  it('declares module=sales, label, and baseModel=Sale', () => {
    expect(salesCatalog.module).toBe('sales');
    expect(salesCatalog.label).toBe('Sales / Bookings');
    expect(salesCatalog.baseModel).toBe('Sale');
  });

  it('exposes status as an enum mirroring the Sale model', () => {
    const f = field('status');
    expect(f.type).toBe('enum');
    expect(f.enumValues).toEqual(['Pending Approval', 'Booked', 'Agreement Signed', 'Registered', 'Completed', 'Cancelled']);
    expect(f.operators).toEqual(expect.arrayContaining(['is', 'in', 'notIn']));
  });

  describe('toMatch', () => {
    it('status is → equality', () => {
      expect(field('status').toMatch('is', 'Booked', viewerCtx)).toEqual({ status: 'Booked' });
    });
    it('status in → $in', () => {
      expect(field('status').toMatch('in', ['Booked', 'Registered'], viewerCtx))
        .toEqual({ status: { $in: ['Booked', 'Registered'] } });
    });
    it('status notIn → $nin', () => {
      expect(field('status').toMatch('notIn', ['Cancelled'], viewerCtx))
        .toEqual({ status: { $nin: ['Cancelled'] } });
    });
    it('salePrice gte → $gte (number coerced)', () => {
      expect(field('salePrice').toMatch('gte', '5000000', viewerCtx)).toEqual({ salePrice: { $gte: 5000000 } });
    });
    it('salePrice between → $gte/$lte', () => {
      expect(field('salePrice').toMatch('between', [1000000, 5000000], viewerCtx))
        .toEqual({ salePrice: { $gte: 1000000, $lte: 5000000 } });
    });
    it('bookingDate lastNDays → $gte a cutoff Date', () => {
      const frag = field('bookingDate').toMatch('lastNDays', 30, viewerCtx);
      expect(frag.bookingDate.$gte).toBeInstanceOf(Date);
      const ageMs = Date.now() - frag.bookingDate.$gte.getTime();
      expect(ageMs).toBeGreaterThanOrEqual(29 * 86400000);
      expect(ageMs).toBeLessThanOrEqual(31 * 86400000);
    });
    it('channelPartner is → ObjectId-cast equality', () => {
      const id = new mongoose.Types.ObjectId();
      expect(field('channelPartner').toMatch('is', id.toString(), viewerCtx))
        .toEqual({ channelPartner: new mongoose.Types.ObjectId(id.toString()) });
    });
    it('channelPartner isNotEmpty → $ne null', () => {
      expect(field('channelPartner').toMatch('isNotEmpty', null, viewerCtx))
        .toEqual({ channelPartner: { $ne: null } });
    });
  });

  describe('derived daysInCurrentStatus', () => {
    const f = () => field('daysInCurrentStatus');
    it('is derived and number-typed', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('number');
    });
    it('addFields() emits a $addFields stage computing whole days since updatedAt', () => {
      const stage = f().addFields();
      expect(stage).toHaveProperty('$addFields.daysInCurrentStatus');
      const expr = stage.$addFields.daysInCurrentStatus;
      expect(expr.$dateDiff).toMatchObject({ startDate: '$updatedAt', unit: 'day' });
    });
    it('toMatch operates on the derived key', () => {
      expect(f().toMatch('gte', 15, viewerCtx)).toEqual({ daysInCurrentStatus: { $gte: 15 } });
    });
  });

  it('scope(viewerCtx) returns org match for an owner (no project narrowing)', () => {
    expect(salesCatalog.scope(viewerCtx)).toEqual({ organization: viewerCtx.organization });
  });

  it('scope(viewerCtx) narrows to accessible projects for a non-owner', () => {
    const a = new mongoose.Types.ObjectId();
    const ctx = { ...viewerCtx, isOwner: false, accessibleProjectIds: [a.toString()] };
    expect(salesCatalog.scope(ctx)).toEqual({
      organization: ctx.organization,
      project: { $in: [new mongoose.Types.ObjectId(a.toString())] },
    });
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- salesCatalog
```
Expect: `Cannot find module '../../services/workspace/catalogs/salesCatalog.js'`.

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/salesCatalog.js`:
```js
// File: services/workspace/catalogs/salesCatalog.js
// Description: Field catalog for the Sales/Bookings module. An allow-list of
//   filterable/selectable fields, each with a toMatch() mapper. Derived fields
//   (daysInCurrentStatus) are aggregation-backed via addFields(). Co-located
//   with the model so model changes surface in these unit tests. Spec §3.1.

import mongoose from 'mongoose';

const SALE_STATUSES = ['Pending Approval', 'Booked', 'Agreement Signed', 'Registered', 'Completed', 'Cancelled'];

const num = (v) => (typeof v === 'number' ? v : Number(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const daysAgo = (n) => new Date(Date.now() - num(n) * 24 * 60 * 60 * 1000);

// Shared comparison builder for number/date scalar operators on a literal field.
const cmp = (path) => (op, value) => {
  switch (op) {
    case 'is': return { [path]: value };
    case 'in': return { [path]: { $in: value } };
    case 'notIn': return { [path]: { $nin: value } };
    case 'gt': return { [path]: { $gt: num(value) } };
    case 'lt': return { [path]: { $lt: num(value) } };
    case 'gte': return { [path]: { $gte: num(value) } };
    case 'lte': return { [path]: { $lte: num(value) } };
    case 'between': return { [path]: { $gte: num(value[0]), $lte: num(value[1]) } };
    case 'isEmpty': return { [path]: { $in: [null, undefined] } };
    case 'isNotEmpty': return { [path]: { $ne: null } };
    default: throw new Error(`Unsupported operator '${op}' for field '${path}'`);
  }
};

const fields = [
  {
    key: 'status', label: 'Status', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: SALE_STATUSES,
    displayable: true, defaultColumn: true,
    toMatch(op, value) {
      if (op === 'is') return { status: value };
      if (op === 'in') return { status: { $in: value } };
      if (op === 'notIn') return { status: { $nin: value } };
      throw new Error(`Unsupported operator '${op}' for field 'status'`);
    },
  },
  {
    key: 'bookingDate', label: 'Booking Date', type: 'date',
    operators: ['gt', 'lt', 'gte', 'lte', 'between', 'lastNDays'],
    displayable: true, defaultColumn: true,
    toMatch(op, value) {
      if (op === 'lastNDays') return { bookingDate: { $gte: daysAgo(value) } };
      const c = cmp('bookingDate')(op, value);
      // dates: coerce raw scalars to Date objects
      if (c.bookingDate && typeof c.bookingDate === 'object') {
        for (const k of Object.keys(c.bookingDate)) c.bookingDate[k] = new Date(c.bookingDate[k]);
      }
      return c;
    },
  },
  {
    key: 'salePrice', label: 'Sale Price', type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'between'],
    displayable: true, defaultColumn: true,
    toMatch: cmp('salePrice'),
  },
  {
    key: 'channelPartner', label: 'Channel Partner', type: 'ref',
    operators: ['is', 'in', 'isEmpty', 'isNotEmpty'],
    displayable: true,
    toMatch(op, value) {
      if (op === 'is') return { channelPartner: oid(value) };
      if (op === 'in') return { channelPartner: { $in: value.map(oid) } };
      if (op === 'isEmpty') return { channelPartner: { $in: [null, undefined] } };
      if (op === 'isNotEmpty') return { channelPartner: { $ne: null } };
      throw new Error(`Unsupported operator '${op}' for field 'channelPartner'`);
    },
  },
  {
    key: 'daysInCurrentStatus', label: 'Days In Current Status', type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'between'],
    displayable: true, derived: true,
    // Whole days since the doc last changed (proxy for "time in current status",
    // since status changes bump updatedAt). Materialized before $match.
    addFields() {
      return {
        $addFields: {
          daysInCurrentStatus: {
            $dateDiff: { startDate: '$updatedAt', endDate: '$$NOW', unit: 'day' },
          },
        },
      };
    },
    toMatch: cmp('daysInCurrentStatus'),
  },
];

const salesCatalog = {
  module: 'sales',
  label: 'Sales / Bookings',
  baseModel: 'Sale',
  fields,
  // Viewer-scoped base match. Owners see the whole org; others are narrowed to
  // their accessible projects. accessibleProjectIds === null means owner.
  scope(viewerCtx) {
    const match = { organization: viewerCtx.organization };
    if (!viewerCtx.isOwner) {
      const ids = (viewerCtx.accessibleProjectIds || []).map(oid);
      match.project = { $in: ids };
    }
    return match;
  },
};

export default salesCatalog;
```

- [ ] **Register it — modify** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`. Add the import alongside the existing leads import and include it in the registry map (match the existing structure the foundation region created):
```js
// add near the other catalog imports
import salesCatalog from './salesCatalog.js';
```
```js
// add to the CATALOGS registry object (the map keyed by module)
const CATALOGS = {
  leads: leadsCatalog,
  sales: salesCatalog,
  // payments / tasks / channelPartners registered in later tasks
};
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- salesCatalog
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/salesCatalog.js services/workspace/catalogs/index.js tests/unit/salesCatalog.test.js && git commit -m "feat(workspace): sales catalog (status/bookingDate/salePrice/CP + derived daysInCurrentStatus)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Payments catalog (`paymentsCatalog.js`)

Real fields from `models/paymentTransactionModel.js`: `status` (enum), `paymentDate` (date), `amount` (number), `paymentMethod` (enum), plus derived `daysOverdue`. **Note:** `PaymentTransaction` has no due-date field (due dates live on `Installment`); to keep the mapper co-located and pure, `daysOverdue` here = whole days a *not-yet-settled* payment has been outstanding since `paymentDate` (0 once `completed`/`cleared`). Documented inline so a future model change surfaces in this test.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/paymentsCatalog.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/paymentsCatalog.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/paymentsCatalog.test.js`:
```js
// tests/unit/paymentsCatalog.test.js
import mongoose from 'mongoose';
import paymentsCatalog from '../../services/workspace/catalogs/paymentsCatalog.js';

const field = (key) => paymentsCatalog.fields.find((f) => f.key === key);
const viewerCtx = { organization: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), accessibleProjectIds: [], isOwner: true, permissions: [] };

describe('paymentsCatalog', () => {
  it('module=payments, baseModel=PaymentTransaction', () => {
    expect(paymentsCatalog.module).toBe('payments');
    expect(paymentsCatalog.baseModel).toBe('PaymentTransaction');
  });

  it('status enum mirrors the PaymentTransaction model', () => {
    expect(field('status').enumValues).toEqual(
      ['pending', 'processing', 'completed', 'cleared', 'bounced', 'cancelled', 'refunded']
    );
  });

  it('paymentMethod enum mirrors the model', () => {
    expect(field('paymentMethod').enumValues).toEqual(
      ['cash', 'cheque', 'bank_transfer', 'online_payment', 'card_payment', 'demand_draft', 'home_loan']
    );
  });

  describe('toMatch', () => {
    it('status in → $in', () => {
      expect(field('status').toMatch('in', ['pending', 'processing'], viewerCtx))
        .toEqual({ status: { $in: ['pending', 'processing'] } });
    });
    it('paymentMethod is → equality', () => {
      expect(field('paymentMethod').toMatch('is', 'cheque', viewerCtx)).toEqual({ paymentMethod: 'cheque' });
    });
    it('amount gte → $gte (coerced)', () => {
      expect(field('amount').toMatch('gte', '250000', viewerCtx)).toEqual({ amount: { $gte: 250000 } });
    });
    it('paymentDate lastNDays → $gte cutoff Date', () => {
      const frag = field('paymentDate').toMatch('lastNDays', 7, viewerCtx);
      expect(frag.paymentDate.$gte).toBeInstanceOf(Date);
    });
  });

  describe('derived daysOverdue', () => {
    const f = () => field('daysOverdue');
    it('is derived and number-typed', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('number');
    });
    it('addFields() computes 0 for settled payments, else days since paymentDate', () => {
      const stage = f().addFields();
      const expr = stage.$addFields.daysOverdue;
      expect(expr).toHaveProperty('$cond');
      // settled branch (then) is 0
      expect(expr.$cond.then).toBe(0);
      // unsettled branch (else) is a day diff from paymentDate
      expect(expr.$cond.else.$dateDiff).toMatchObject({ startDate: '$paymentDate', unit: 'day' });
    });
    it('toMatch operates on the derived key', () => {
      expect(f().toMatch('gt', 0, viewerCtx)).toEqual({ daysOverdue: { $gt: 0 } });
    });
  });

  it('scope narrows to accessible projects for non-owners', () => {
    const a = new mongoose.Types.ObjectId();
    const ctx = { ...viewerCtx, isOwner: false, accessibleProjectIds: [a.toString()] };
    expect(paymentsCatalog.scope(ctx)).toEqual({
      organization: ctx.organization,
      project: { $in: [new mongoose.Types.ObjectId(a.toString())] },
    });
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- paymentsCatalog
```

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/paymentsCatalog.js`:
```js
// File: services/workspace/catalogs/paymentsCatalog.js
// Description: Field catalog for the Payments module (PaymentTransaction). Spec §3.1.
//   NOTE: PaymentTransaction has no due date (those live on Installment), so the
//   derived `daysOverdue` here is "days a not-yet-settled payment has been
//   outstanding since paymentDate" (0 once completed/cleared). Kept pure + tested
//   so any model change is caught here.

import mongoose from 'mongoose';

const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'cleared', 'bounced', 'cancelled', 'refunded'];
const PAYMENT_METHODS = ['cash', 'cheque', 'bank_transfer', 'online_payment', 'card_payment', 'demand_draft', 'home_loan'];
const SETTLED = ['completed', 'cleared'];

const num = (v) => (typeof v === 'number' ? v : Number(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const daysAgo = (n) => new Date(Date.now() - num(n) * 24 * 60 * 60 * 1000);

const cmp = (path, isDate = false) => (op, value) => {
  const coerce = isDate ? (x) => new Date(x) : num;
  switch (op) {
    case 'is': return { [path]: value };
    case 'in': return { [path]: { $in: value } };
    case 'notIn': return { [path]: { $nin: value } };
    case 'gt': return { [path]: { $gt: coerce(value) } };
    case 'lt': return { [path]: { $lt: coerce(value) } };
    case 'gte': return { [path]: { $gte: coerce(value) } };
    case 'lte': return { [path]: { $lte: coerce(value) } };
    case 'between': return { [path]: { $gte: coerce(value[0]), $lte: coerce(value[1]) } };
    case 'isEmpty': return { [path]: { $in: [null, undefined] } };
    case 'isNotEmpty': return { [path]: { $ne: null } };
    default: throw new Error(`Unsupported operator '${op}' for field '${path}'`);
  }
};

const enumMatch = (path) => (op, value) => {
  if (op === 'is') return { [path]: value };
  if (op === 'in') return { [path]: { $in: value } };
  if (op === 'notIn') return { [path]: { $nin: value } };
  throw new Error(`Unsupported operator '${op}' for field '${path}'`);
};

const fields = [
  {
    key: 'status', label: 'Status', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: PAYMENT_STATUSES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('status'),
  },
  {
    key: 'paymentMethod', label: 'Payment Method', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: PAYMENT_METHODS,
    displayable: true, defaultColumn: true, toMatch: enumMatch('paymentMethod'),
  },
  {
    key: 'amount', label: 'Amount', type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'between'],
    displayable: true, defaultColumn: true, toMatch: cmp('amount'),
  },
  {
    key: 'paymentDate', label: 'Payment Date', type: 'date',
    operators: ['gt', 'lt', 'gte', 'lte', 'between', 'lastNDays'],
    displayable: true, defaultColumn: true,
    toMatch(op, value) {
      if (op === 'lastNDays') return { paymentDate: { $gte: daysAgo(value) } };
      return cmp('paymentDate', true)(op, value);
    },
  },
  {
    key: 'daysOverdue', label: 'Days Outstanding', type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'between'],
    displayable: true, derived: true,
    addFields() {
      return {
        $addFields: {
          daysOverdue: {
            $cond: {
              if: { $in: ['$status', SETTLED] },
              then: 0,
              else: { $dateDiff: { startDate: '$paymentDate', endDate: '$$NOW', unit: 'day' } },
            },
          },
        },
      };
    },
    toMatch: cmp('daysOverdue'),
  },
];

const paymentsCatalog = {
  module: 'payments',
  label: 'Payments',
  baseModel: 'PaymentTransaction',
  fields,
  scope(viewerCtx) {
    const match = { organization: viewerCtx.organization };
    if (!viewerCtx.isOwner) {
      match.project = { $in: (viewerCtx.accessibleProjectIds || []).map(oid) };
    }
    return match;
  },
};

export default paymentsCatalog;
```

- [ ] **Register it — modify** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`:
```js
import paymentsCatalog from './paymentsCatalog.js';
```
```js
// extend the CATALOGS map
  payments: paymentsCatalog,
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- paymentsCatalog
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/paymentsCatalog.js services/workspace/catalogs/index.js tests/unit/paymentsCatalog.test.js && git commit -m "feat(workspace): payments catalog (status/method/amount/date + derived daysOverdue)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Tasks catalog (`tasksCatalog.js`)

Real fields from `models/taskModel.js`: `status` / `priority` / `category` (enums), `dueDate` (date), plus derived `assignedToMe` (resolves against `viewerCtx.userId`) and derived `daysOverdue`. `status`/`category` enums are imported from the model so they never drift.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/tasksCatalog.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/tasksCatalog.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/tasksCatalog.test.js`:
```js
// tests/unit/tasksCatalog.test.js
import mongoose from 'mongoose';
import tasksCatalog from '../../services/workspace/catalogs/tasksCatalog.js';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES } from '../../models/taskModel.js';

const field = (key) => tasksCatalog.fields.find((f) => f.key === key);
const userId = new mongoose.Types.ObjectId();
const viewerCtx = { organization: new mongoose.Types.ObjectId(), userId, accessibleProjectIds: null, isOwner: true, permissions: [] };

describe('tasksCatalog', () => {
  it('module=tasks, baseModel=Task', () => {
    expect(tasksCatalog.module).toBe('tasks');
    expect(tasksCatalog.baseModel).toBe('Task');
  });

  it('status/priority/category enums are sourced from the Task model', () => {
    expect(field('status').enumValues).toEqual(TASK_STATUSES);
    expect(field('priority').enumValues).toEqual(TASK_PRIORITIES);
    expect(field('category').enumValues).toEqual(TASK_CATEGORIES);
  });

  describe('toMatch', () => {
    it('priority in → $in', () => {
      expect(field('priority').toMatch('in', ['Critical', 'High'], viewerCtx))
        .toEqual({ priority: { $in: ['Critical', 'High'] } });
    });
    it('category is → equality', () => {
      expect(field('category').toMatch('is', 'Payment & Collection', viewerCtx))
        .toEqual({ category: 'Payment & Collection' });
    });
    it('dueDate lastNDays → $gte cutoff', () => {
      expect(field('dueDate').toMatch('lastNDays', 3, viewerCtx).dueDate.$gte).toBeInstanceOf(Date);
    });
  });

  describe('derived assignedToMe', () => {
    const f = () => field('assignedToMe');
    it('is derived and boolean-typed', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('boolean');
    });
    it('is true → assignedTo == viewer userId', () => {
      expect(f().toMatch('is', true, viewerCtx)).toEqual({ assignedTo: new mongoose.Types.ObjectId(userId.toString()) });
    });
    it('is false → assignedTo != viewer userId', () => {
      expect(f().toMatch('is', false, viewerCtx)).toEqual({ assignedTo: { $ne: new mongoose.Types.ObjectId(userId.toString()) } });
    });
  });

  describe('derived daysOverdue', () => {
    const f = () => field('daysOverdue');
    it('addFields() is 0 for Completed/Cancelled or no dueDate, else days past dueDate', () => {
      const expr = f().addFields().$addFields.daysOverdue;
      expect(expr).toHaveProperty('$cond');
      expect(expr.$cond.then).toBe(0);
      expect(expr.$cond.else.$dateDiff).toMatchObject({ startDate: '$dueDate', unit: 'day' });
    });
    it('toMatch gt 0 → overdue filter', () => {
      expect(f().toMatch('gt', 0, viewerCtx)).toEqual({ daysOverdue: { $gt: 0 } });
    });
  });

  it('scope: owner → org only', () => {
    expect(tasksCatalog.scope(viewerCtx)).toEqual({ organization: viewerCtx.organization });
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tasksCatalog
```

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/tasksCatalog.js`:
```js
// File: services/workspace/catalogs/tasksCatalog.js
// Description: Field catalog for the Tasks module. Enums imported from the Task
//   model so they never drift. Derived: assignedToMe (resolves against the
//   viewer), daysOverdue. Spec §3.1. Tasks are org-scoped (no project field on
//   the model), so scope() is org-only.

import mongoose from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES } from '../../../models/taskModel.js';

const TERMINAL = ['Completed', 'Cancelled'];
const num = (v) => (typeof v === 'number' ? v : Number(v));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const daysAgo = (n) => new Date(Date.now() - num(n) * 24 * 60 * 60 * 1000);

const cmp = (path, isDate = false) => (op, value) => {
  const coerce = isDate ? (x) => new Date(x) : num;
  switch (op) {
    case 'gt': return { [path]: { $gt: coerce(value) } };
    case 'lt': return { [path]: { $lt: coerce(value) } };
    case 'gte': return { [path]: { $gte: coerce(value) } };
    case 'lte': return { [path]: { $lte: coerce(value) } };
    case 'between': return { [path]: { $gte: coerce(value[0]), $lte: coerce(value[1]) } };
    case 'isEmpty': return { [path]: { $in: [null, undefined] } };
    case 'isNotEmpty': return { [path]: { $ne: null } };
    default: throw new Error(`Unsupported operator '${op}' for field '${path}'`);
  }
};

const enumMatch = (path) => (op, value) => {
  if (op === 'is') return { [path]: value };
  if (op === 'in') return { [path]: { $in: value } };
  if (op === 'notIn') return { [path]: { $nin: value } };
  throw new Error(`Unsupported operator '${op}' for field '${path}'`);
};

const fields = [
  {
    key: 'status', label: 'Status', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: TASK_STATUSES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('status'),
  },
  {
    key: 'priority', label: 'Priority', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: TASK_PRIORITIES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('priority'),
  },
  {
    key: 'category', label: 'Category', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: TASK_CATEGORIES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('category'),
  },
  {
    key: 'dueDate', label: 'Due Date', type: 'date',
    operators: ['gt', 'lt', 'gte', 'lte', 'between', 'lastNDays', 'isEmpty', 'isNotEmpty'],
    displayable: true, defaultColumn: true,
    toMatch(op, value) {
      if (op === 'lastNDays') return { dueDate: { $gte: daysAgo(value) } };
      return cmp('dueDate', true)(op, value);
    },
  },
  {
    key: 'assignedToMe', label: 'Assigned To Me', type: 'boolean',
    operators: ['is'], displayable: false, derived: true,
    // Resolves against the requesting viewer (spec §3.1). No addFields needed —
    // it's a direct equality against assignedTo using viewerCtx.userId.
    toMatch(op, value, viewerCtx) {
      const me = oid(viewerCtx.userId);
      return value ? { assignedTo: me } : { assignedTo: { $ne: me } };
    },
  },
  {
    key: 'daysOverdue', label: 'Days Overdue', type: 'number',
    operators: ['gt', 'lt', 'gte', 'lte', 'between'],
    displayable: true, derived: true,
    addFields() {
      return {
        $addFields: {
          daysOverdue: {
            $cond: {
              if: {
                $or: [
                  { $in: ['$status', TERMINAL] },
                  { $eq: [{ $ifNull: ['$dueDate', null] }, null] },
                ],
              },
              then: 0,
              else: {
                $max: [0, { $dateDiff: { startDate: '$dueDate', endDate: '$$NOW', unit: 'day' } }],
              },
            },
          },
        },
      };
    },
    toMatch: cmp('daysOverdue'),
  },
];

const tasksCatalog = {
  module: 'tasks',
  label: 'Tasks',
  baseModel: 'Task',
  fields,
  scope(viewerCtx) {
    // Task has no project field; org is the only tenant boundary here.
    return { organization: viewerCtx.organization };
  },
};

export default tasksCatalog;
```

- [ ] **Register it — modify** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`:
```js
import tasksCatalog from './tasksCatalog.js';
```
```js
  tasks: tasksCatalog,
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tasksCatalog
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/tasksCatalog.js services/workspace/catalogs/index.js tests/unit/tasksCatalog.test.js && git commit -m "feat(workspace): tasks catalog (status/priority/category/dueDate + derived assignedToMe, daysOverdue)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Channel Partners catalog (`channelPartnersCatalog.js`)

Real fields from `models/channelPartnerModel.js`: `category` (enum), `status` (enum), `firmName` (string, `contains`), `approvedProjects` (array of refs). The CP registry is org-scoped (the developer org owns its CP records); no project narrowing — but `approvedProjects` can be filtered.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/channelPartnersCatalog.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/channelPartnersCatalog.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/channelPartnersCatalog.test.js`:
```js
// tests/unit/channelPartnersCatalog.test.js
import mongoose from 'mongoose';
import cpCatalog from '../../services/workspace/catalogs/channelPartnersCatalog.js';

const field = (key) => cpCatalog.fields.find((f) => f.key === key);
const viewerCtx = { organization: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId(), accessibleProjectIds: [], isOwner: false, permissions: [] };

describe('channelPartnersCatalog', () => {
  it('module=channelPartners, baseModel=ChannelPartner', () => {
    expect(cpCatalog.module).toBe('channelPartners');
    expect(cpCatalog.baseModel).toBe('ChannelPartner');
  });

  it('category and status enums mirror the model', () => {
    expect(field('category').enumValues).toEqual(['broker_firm', 'individual_agent', 'corporate', 'digital_aggregator']);
    expect(field('status').enumValues).toEqual(['active', 'suspended', 'blacklisted']);
  });

  describe('toMatch', () => {
    it('status is → equality', () => {
      expect(field('status').toMatch('is', 'active', viewerCtx)).toEqual({ status: 'active' });
    });
    it('category in → $in', () => {
      expect(field('category').toMatch('in', ['broker_firm', 'corporate'], viewerCtx))
        .toEqual({ category: { $in: ['broker_firm', 'corporate'] } });
    });
    it('firmName contains → case-insensitive regex', () => {
      const frag = field('firmName').toMatch('contains', 'realty', viewerCtx);
      expect(frag.firmName).toBeInstanceOf(RegExp);
      expect(frag.firmName.flags).toContain('i');
      expect('Prime Realty LLP').toMatch(frag.firmName);
    });
    it('approvedProjects is → membership match (cast ObjectId)', () => {
      const id = new mongoose.Types.ObjectId();
      expect(field('approvedProjects').toMatch('is', id.toString(), viewerCtx))
        .toEqual({ approvedProjects: new mongoose.Types.ObjectId(id.toString()) });
    });
    it('approvedProjects isEmpty → empty-array match', () => {
      expect(field('approvedProjects').toMatch('isEmpty', null, viewerCtx))
        .toEqual({ approvedProjects: { $size: 0 } });
    });
  });

  it('scope is org-only (CP registry is owned by the developer org)', () => {
    expect(cpCatalog.scope(viewerCtx)).toEqual({ organization: viewerCtx.organization });
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- channelPartnersCatalog
```

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/channelPartnersCatalog.js`:
```js
// File: services/workspace/catalogs/channelPartnersCatalog.js
// Description: Field catalog for the Channel Partners module. The CP registry is
//   owned by the developer org (no per-project tenant split), so scope() is
//   org-only. Spec §3.1.

import mongoose from 'mongoose';

const CP_CATEGORIES = ['broker_firm', 'individual_agent', 'corporate', 'digital_aggregator'];
const CP_STATUSES = ['active', 'suspended', 'blacklisted'];

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const enumMatch = (path) => (op, value) => {
  if (op === 'is') return { [path]: value };
  if (op === 'in') return { [path]: { $in: value } };
  if (op === 'notIn') return { [path]: { $nin: value } };
  throw new Error(`Unsupported operator '${op}' for field '${path}'`);
};

const fields = [
  {
    key: 'status', label: 'Status', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: CP_STATUSES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('status'),
  },
  {
    key: 'category', label: 'Category', type: 'enum',
    operators: ['is', 'in', 'notIn'], enumValues: CP_CATEGORIES,
    displayable: true, defaultColumn: true, toMatch: enumMatch('category'),
  },
  {
    key: 'firmName', label: 'Firm Name', type: 'string',
    operators: ['is', 'contains'], displayable: true, defaultColumn: true,
    toMatch(op, value) {
      if (op === 'is') return { firmName: value };
      if (op === 'contains') return { firmName: new RegExp(escapeRe(value), 'i') };
      throw new Error(`Unsupported operator '${op}' for field 'firmName'`);
    },
  },
  {
    key: 'approvedProjects', label: 'Approved Projects', type: 'ref',
    operators: ['is', 'in', 'isEmpty', 'isNotEmpty'], displayable: true,
    // Array membership: matching a single id matches docs whose array contains it.
    toMatch(op, value) {
      if (op === 'is') return { approvedProjects: oid(value) };
      if (op === 'in') return { approvedProjects: { $in: value.map(oid) } };
      if (op === 'isEmpty') return { approvedProjects: { $size: 0 } };
      if (op === 'isNotEmpty') return { approvedProjects: { $not: { $size: 0 } } };
      throw new Error(`Unsupported operator '${op}' for field 'approvedProjects'`);
    },
  },
];

const channelPartnersCatalog = {
  module: 'channelPartners',
  label: 'Channel Partners',
  baseModel: 'ChannelPartner',
  fields,
  scope(viewerCtx) {
    return { organization: viewerCtx.organization };
  },
};

export default channelPartnersCatalog;
```

- [ ] **Register it — modify** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/index.js`:
```js
import channelPartnersCatalog from './channelPartnersCatalog.js';
```
```js
  channelPartners: channelPartnersCatalog,
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- channelPartnersCatalog
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/channelPartnersCatalog.js services/workspace/catalogs/index.js tests/unit/channelPartnersCatalog.test.js && git commit -m "feat(workspace): channel partners catalog (category/status/firmName/approvedProjects)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Workspace controller + routes + server mount — catalog, preview, card CRUD

Builds `controllers/workspaceController.js` (catalog, preview, card create/list/update/delete), `routes/workspaceRoutes.js`, and the `server.js` mount. Tests follow the in-process idiom: mock the engine + catalog + schema + models with `jest.unstable_mockModule`, invoke handlers directly with a fake `req`/`res`.

A shared `viewerFromReq(req)` helper (used by every handler) builds the canonical ViewerContext from the auth-middleware request enhancements.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/routes/workspaceRoutes.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/server.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.crud.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.crud.test.js`:
```js
// tests/unit/workspaceController.crud.test.js
// In-process controller tests (repo idiom): mock models + engine, invoke handlers.
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ─── Mock collaborators ────────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();
jest.unstable_mockModule('../../models/workspaceCardModel.js', () => ({
  default: { create: mockCreate, find: mockFind, findOne: mockFindOne, deleteOne: mockDeleteOne },
  WORKSPACE_MODULES: ['leads', 'sales', 'payments', 'tasks', 'channelPartners'],
  RENDER_MODES: ['list', 'metric'],
}));

const mockGetCatalog = jest.fn();
jest.unstable_mockModule('../../services/workspace/catalogs/index.js', () => ({ getCatalog: mockGetCatalog }));

const mockValidate = jest.fn();
jest.unstable_mockModule('../../services/workspace/queryPlanSchema.js', () => ({ validateQueryPlan: mockValidate }));

const mockRun = jest.fn();
jest.unstable_mockModule('../../services/workspace/queryEngine.js', () => ({ runQueryPlan: mockRun }));

const {
  getCatalog, previewCard, createCard, listCards, updateCard, deleteCard,
} = await import('../../controllers/workspaceController.js');

// ─── Test helpers ──────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.json = (p) => { res._json = p; return res; };
  res.status = (c) => { res._status = c; return res; };
  return res;
};
const run = async (handler, req) => {
  const res = mockRes();
  let thrown = null;
  await handler(req, res, (e) => { thrown = e; }).catch((e) => { thrown = e; });
  return { res, thrown };
};
const ORG = new mongoose.Types.ObjectId();
const USER = new mongoose.Types.ObjectId();
const baseReq = (over = {}) => ({
  user: { _id: USER, organization: ORG, roleRef: { name: 'Sales Manager' } },
  userPermissions: ['sales:view'], userRoleLevel: 30, isOwner: false, accessibleProjectIds: [],
  params: {}, query: {}, body: {}, ...over,
});

beforeEach(() => {
  [mockCreate, mockFind, mockFindOne, mockDeleteOne, mockGetCatalog, mockValidate, mockRun].forEach((m) => m.mockReset());
});

describe('workspaceController — catalog & preview', () => {
  test('GET /catalog/:module returns the catalog as { success, data }', async () => {
    mockGetCatalog.mockReturnValue({
      module: 'sales', label: 'Sales / Bookings',
      fields: [{ key: 'status', label: 'Status', type: 'enum', operators: ['is'], enumValues: ['Booked'], displayable: true, toMatch() {}, addFields() {} }],
      scope() {},
    });
    const { res } = await run(getCatalog, baseReq({ params: { module: 'sales' } }));
    expect(res._json.success).toBe(true);
    expect(res._json.data.module).toBe('sales');
    // function props must NOT leak to the client
    expect(res._json.data.fields[0].toMatch).toBeUndefined();
    expect(res._json.data.fields[0].addFields).toBeUndefined();
    expect(res._json.data.scope).toBeUndefined();
    expect(res._json.data.fields[0].key).toBe('status');
  });

  test('GET /catalog/:module 400s on an unknown module', async () => {
    mockGetCatalog.mockReturnValue(null);
    const { res, thrown } = await run(getCatalog, baseReq({ params: { module: 'bogus' } }));
    expect(res._status).toBe(400);
    expect(thrown).toBeInstanceOf(Error);
  });

  test('POST /preview validates the plan then runs the engine with the viewer ctx', async () => {
    mockValidate.mockReturnValue({ valid: true, errors: [] });
    mockRun.mockResolvedValue({ rows: [{ _id: 'a' }], total: 1 });
    const plan = { module: 'sales', logic: 'AND', filters: [], sort: null, limit: 50 };
    const { res } = await run(previewCard, baseReq({ body: { queryPlan: plan, renderMode: 'list' } }));
    expect(mockValidate).toHaveBeenCalledWith(plan);
    const ctxArg = mockRun.mock.calls[0][1];
    expect(String(ctxArg.organization)).toBe(String(ORG));
    expect(String(ctxArg.userId)).toBe(String(USER));
    expect(ctxArg.isOwner).toBe(false);
    expect(res._json).toEqual({ success: true, data: { rows: [{ _id: 'a' }], total: 1 } });
  });

  test('POST /preview 400s when validation fails (never calls the engine)', async () => {
    mockValidate.mockReturnValue({ valid: false, errors: ['unknown field: bogus'] });
    const { res, thrown } = await run(previewCard, baseReq({ body: { queryPlan: { module: 'sales' } } }));
    expect(res._status).toBe(400);
    expect(thrown.message).toMatch(/unknown field/);
    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe('workspaceController — card CRUD', () => {
  test('POST /cards validates plan, stamps org+owner, returns 201', async () => {
    mockValidate.mockReturnValue({ valid: true, errors: [] });
    mockCreate.mockImplementation(async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc }));
    const body = { title: 'Stale CP', module: 'sales', queryPlan: { module: 'sales', logic: 'AND', filters: [] }, renderMode: 'list' };
    const { res } = await run(createCard, baseReq({ body }));
    expect(res._status).toBe(201);
    const created = mockCreate.mock.calls[0][0];
    expect(String(created.organization)).toBe(String(ORG));
    expect(String(created.ownerId)).toBe(String(USER));
    expect(created.title).toBe('Stale CP');
    expect(res._json.success).toBe(true);
  });

  test('POST /cards 400s when the plan is invalid', async () => {
    mockValidate.mockReturnValue({ valid: false, errors: ['bad'] });
    const { res, thrown } = await run(createCard, baseReq({ body: { title: 'x', module: 'sales', queryPlan: {} } }));
    expect(res._status).toBe(400);
    expect(thrown).toBeInstanceOf(Error);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('PUT /cards/:id updates owner-owned card and ignores immutable fields', async () => {
    const id = new mongoose.Types.ObjectId();
    const save = jest.fn().mockResolvedValue(true);
    const doc = { _id: id, organization: ORG, ownerId: USER, title: 'old', module: 'sales', save };
    mockFindOne.mockResolvedValue(doc);
    mockValidate.mockReturnValue({ valid: true, errors: [] });
    const { res } = await run(updateCard, baseReq({
      params: { id: id.toString() },
      body: { title: 'new', organization: new mongoose.Types.ObjectId(), ownerId: new mongoose.Types.ObjectId() },
    }));
    // findOne scoped to org + owner
    expect(mockFindOne).toHaveBeenCalledWith(expect.objectContaining({ _id: id.toString(), organization: ORG, ownerId: USER }));
    expect(doc.title).toBe('new');
    expect(String(doc.organization)).toBe(String(ORG)); // immutable preserved
    expect(String(doc.ownerId)).toBe(String(USER));     // immutable preserved
    expect(save).toHaveBeenCalled();
    expect(res._json.success).toBe(true);
  });

  test('PUT /cards/:id 404s when the card is not owned by the requester', async () => {
    mockFindOne.mockResolvedValue(null);
    const { res, thrown } = await run(updateCard, baseReq({ params: { id: new mongoose.Types.ObjectId().toString() }, body: { title: 'x' } }));
    expect(res._status).toBe(404);
    expect(thrown).toBeInstanceOf(Error);
  });

  test('DELETE /cards/:id removes an owner-owned card', async () => {
    const id = new mongoose.Types.ObjectId();
    mockFindOne.mockResolvedValue({ _id: id, organization: ORG, ownerId: USER, title: 'gone' });
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { res } = await run(deleteCard, baseReq({ params: { id: id.toString() } }));
    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: id });
    expect(res._json.success).toBe(true);
  });

  test('DELETE /cards/:id 404s when not owned', async () => {
    mockFindOne.mockResolvedValue(null);
    const { res } = await run(deleteCard, baseReq({ params: { id: new mongoose.Types.ObjectId().toString() } }));
    expect(res._status).toBe(404);
  });
});
```

- [ ] **Run the test — expect FAIL**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceController.crud
```
Expect: `Cannot find module '../../controllers/workspaceController.js'`.

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js` (CRUD + catalog + preview; sharing/data/layout handlers are added in Tasks 16–17):
```js
// File: controllers/workspaceController.js
// Description: Personalized Workspace — catalog, live preview, and card CRUD.
//   Cards are saved, validated Query Plans over one module; every run is
//   re-scoped to the requesting viewer (never the author). Spec §3, §5, §7.

import asyncHandler from 'express-async-handler';
import WorkspaceCard, { WORKSPACE_MODULES, RENDER_MODES } from '../models/workspaceCardModel.js';
import { getCatalog as getModuleCatalog } from '../services/workspace/catalogs/index.js';
import { validateQueryPlan } from '../services/workspace/queryPlanSchema.js';
import { runQueryPlan } from '../services/workspace/queryEngine.js';

// Canonical ViewerContext from the auth-middleware request enhancements.
// accessibleProjectIds === null means owner (all projects) — preserved as-is.
const viewerFromReq = (req) => ({
  organization: req.user.organization,
  userId: req.user._id,
  accessibleProjectIds: req.accessibleProjectIds,
  isOwner: req.isOwner || false,
  permissions: req.userPermissions || [],
});

// Strip function-valued descriptor props so the catalog is JSON-safe for the client.
const serializeCatalog = (catalog) => ({
  module: catalog.module,
  label: catalog.label,
  baseModel: catalog.baseModel,
  fields: catalog.fields.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    operators: f.operators,
    enumValues: f.enumValues,
    displayable: f.displayable,
    defaultColumn: f.defaultColumn || false,
    derived: f.derived || false,
  })),
});

/**
 * @desc    Field catalog that drives the builder UI for one module
 * @route   GET /api/workspace/catalog/:module
 * @access  Private (protect)
 */
export const getCatalog = asyncHandler(async (req, res) => {
  const catalog = getModuleCatalog(req.params.module);
  if (!catalog) {
    res.status(400);
    throw new Error(`Unknown workspace module: '${req.params.module}'`);
  }
  res.json({ success: true, data: serializeCatalog(catalog) });
});

/**
 * @desc    Run a Query Plan without saving (builder live preview)
 * @route   POST /api/workspace/preview
 * @access  Private (protect)
 */
export const previewCard = asyncHandler(async (req, res) => {
  const { queryPlan } = req.body;
  const { valid, errors } = validateQueryPlan(queryPlan);
  if (!valid) {
    res.status(400);
    throw new Error(`Invalid query plan: ${errors.join('; ')}`);
  }
  const result = await runQueryPlan(queryPlan, viewerFromReq(req));
  res.json({ success: true, data: result });
});

/**
 * @desc    Create a card
 * @route   POST /api/workspace/cards
 * @access  Private (protect)
 */
export const createCard = asyncHandler(async (req, res) => {
  const { title, module, queryPlan, renderMode = 'list', metricConfig, visibility, sharedWithUsers, sharedWithRoles } = req.body;

  if (!WORKSPACE_MODULES.includes(module)) {
    res.status(400);
    throw new Error(`Unknown workspace module: '${module}'`);
  }
  if (!RENDER_MODES.includes(renderMode)) {
    res.status(400);
    throw new Error(`Unknown render mode: '${renderMode}'`);
  }
  const { valid, errors } = validateQueryPlan(queryPlan);
  if (!valid) {
    res.status(400);
    throw new Error(`Invalid query plan: ${errors.join('; ')}`);
  }

  const card = await WorkspaceCard.create({
    organization: req.user.organization,
    ownerId: req.user._id,
    title,
    module,
    queryPlan,
    renderMode,
    metricConfig,
    visibility,
    sharedWithUsers,
    sharedWithRoles,
  });
  res.status(201).json({ success: true, data: card, message: 'Card created' });
});

/**
 * @desc    Update a card (owner only)
 * @route   PUT /api/workspace/cards/:id
 * @access  Private (protect)
 */
export const updateCard = asyncHandler(async (req, res) => {
  // Owner-only: scope the lookup to org + ownerId, so a non-owner gets 404.
  const card = await WorkspaceCard.findOne({
    _id: req.params.id,
    organization: req.user.organization,
    ownerId: req.user._id,
  });
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }

  if (req.body.queryPlan !== undefined) {
    const { valid, errors } = validateQueryPlan(req.body.queryPlan);
    if (!valid) {
      res.status(400);
      throw new Error(`Invalid query plan: ${errors.join('; ')}`);
    }
  }

  const immutable = new Set(['organization', 'ownerId', '_id', 'createdAt', 'updatedAt']);
  Object.keys(req.body).forEach((key) => {
    if (!immutable.has(key) && req.body[key] !== undefined) card[key] = req.body[key];
  });

  const updated = await card.save();
  res.json({ success: true, data: updated, message: 'Card updated' });
});

/**
 * @desc    Delete a card (owner only)
 * @route   DELETE /api/workspace/cards/:id
 * @access  Private (protect)
 */
export const deleteCard = asyncHandler(async (req, res) => {
  const card = await WorkspaceCard.findOne({
    _id: req.params.id,
    organization: req.user.organization,
    ownerId: req.user._id,
  });
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }
  await WorkspaceCard.deleteOne({ _id: card._id });
  res.json({ success: true, message: `Card '${card.title}' deleted` });
});

// listCards, getCardData (Task 12) and getLayout/saveLayout (Task 13) are
// appended below in subsequent tasks.
```

- [ ] **Implement** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/routes/workspaceRoutes.js`:
```js
// File: routes/workspaceRoutes.js
// Description: Authenticated routes for the Personalized Workspace. All routes
//   require a valid token (protect). Per-module data permission is enforced by
//   the engine's viewer-scoped catalog, so these routes do not add module gates.

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCatalog,
  previewCard,
  createCard,
  listCards,
  updateCard,
  deleteCard,
  getCardData,
  getLayout,
  saveLayout,
} from '../controllers/workspaceController.js';

const router = express.Router();

router.use(protect);

router.get('/catalog/:module', getCatalog);
router.post('/preview', previewCard);

router.route('/cards').get(listCards).post(createCard);
router.route('/cards/:id').put(updateCard).delete(deleteCard);
router.post('/cards/:id/data', getCardData);

router.route('/layout').get(getLayout).put(saveLayout);

export default router;
```

> Note: `listCards`, `getCardData`, `getLayout`, `saveLayout` are implemented in Tasks 16–17. To keep this task's suite green in isolation, add the four handlers as stubs now (they will be replaced — TDD-first — in the next tasks):
```js
// Append to controllers/workspaceController.js (replaced with real impls in Tasks 16–17)
export const listCards = asyncHandler(async (req, res) => { res.json({ success: true, data: [] }); });
export const getCardData = asyncHandler(async (req, res) => { res.status(501); throw new Error('Not implemented'); });
export const getLayout = asyncHandler(async (req, res) => { res.json({ success: true, data: { items: [] } }); });
export const saveLayout = asyncHandler(async (req, res) => { res.status(501); throw new Error('Not implemented'); });
```

- [ ] **Mount the router — modify** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/server.js`. Add the import next to the other route imports (e.g. after the `reportRoutes` import on line 53):
```js
import workspaceRoutes from './routes/workspaceRoutes.js';
```
And add the mount in the Routes section (e.g. directly after `app.use('/api/reports', reportRoutes);` on line 190):
```js
app.use('/api/workspace', workspaceRoutes);
```

- [ ] **Run the test — expect PASS**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceController.crud
```

- [ ] **Sanity-check the server still boots (no import errors from the mount)**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && node --check server.js && node --check routes/workspaceRoutes.js && node --check controllers/workspaceController.js
```
Expect: no output (all parse clean).

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add controllers/workspaceController.js routes/workspaceRoutes.js server.js tests/unit/workspaceController.crud.test.js && git commit -m "feat(workspace): controller+routes for catalog/preview/card CRUD, mounted at /api/workspace

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Sharing — `GET /cards` visibility + `POST /cards/:id/data` recipient-scoped re-execution

Replaces the `listCards` and `getCardData` stubs with real logic.

- **`listCards`**: returns the user's own cards **plus** cards where `visibility:'shared'` AND (`sharedWithUsers` includes `userId` OR `sharedWithRoles` includes the user's current role name), all org-scoped.
- **`getCardData`**: loads the card org-scoped; the requester must be the owner OR a valid share recipient, else **403**; re-runs the saved plan under the **requester's** ViewerContext (never the owner's).

The proof test shows the same shared card returning **different rows for two recipients** by asserting the engine is called with each recipient's own `accessibleProjectIds`, and a non-recipient gets 403.

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.sharing.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.sharing.test.js`:
```js
// tests/unit/workspaceController.sharing.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

const mockFind = jest.fn();
const mockFindOne = jest.fn();
jest.unstable_mockModule('../../models/workspaceCardModel.js', () => ({
  default: { find: mockFind, findOne: mockFindOne },
  WORKSPACE_MODULES: ['leads', 'sales', 'payments', 'tasks', 'channelPartners'],
  RENDER_MODES: ['list', 'metric'],
}));
jest.unstable_mockModule('../../services/workspace/catalogs/index.js', () => ({ getCatalog: jest.fn() }));
jest.unstable_mockModule('../../services/workspace/queryPlanSchema.js', () => ({ validateQueryPlan: jest.fn() }));
const mockRun = jest.fn();
jest.unstable_mockModule('../../services/workspace/queryEngine.js', () => ({ runQueryPlan: mockRun }));

const { listCards, getCardData } = await import('../../controllers/workspaceController.js');

const mockRes = () => {
  const res = {};
  res.json = (p) => { res._json = p; return res; };
  res.status = (c) => { res._status = c; return res; };
  return res;
};
const run = async (handler, req) => {
  const res = mockRes();
  let thrown = null;
  await handler(req, res, (e) => { thrown = e; }).catch((e) => { thrown = e; });
  return { res, thrown };
};

const ORG = new mongoose.Types.ObjectId();
const OWNER = new mongoose.Types.ObjectId();
const RECIP_A = new mongoose.Types.ObjectId();
const RECIP_B = new mongoose.Types.ObjectId();
const STRANGER = new mongoose.Types.ObjectId();
const PROJ_A = new mongoose.Types.ObjectId();
const PROJ_B = new mongoose.Types.ObjectId();

const reqFor = (userId, over = {}) => ({
  user: { _id: userId, organization: ORG, roleRef: { name: 'Sales Manager' } },
  userPermissions: ['sales:view'], isOwner: false, accessibleProjectIds: [],
  params: {}, query: {}, body: {}, ...over,
});

beforeEach(() => { mockFind.mockReset(); mockFindOne.mockReset(); mockRun.mockReset(); });

describe('listCards — visibility', () => {
  test('queries own cards OR shared-to-me (by user id or current role name), org-scoped', async () => {
    mockFind.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    await run(listCards, reqFor(RECIP_A));
    const query = mockFind.mock.calls[0][0];
    expect(query.organization).toEqual(ORG);
    expect(query.$or).toEqual(expect.arrayContaining([
      { ownerId: RECIP_A },
      { visibility: 'shared', sharedWithUsers: RECIP_A },
      { visibility: 'shared', sharedWithRoles: 'Sales Manager' },
    ]));
  });
});

describe('getCardData — recipient-scoped re-execution + 403', () => {
  // One shared card owned by OWNER, shared with RECIP_A (by user) and the
  // "Sales Manager" role (which RECIP_B holds). Not shared with STRANGER.
  const sharedCard = () => ({
    _id: new mongoose.Types.ObjectId(),
    organization: ORG,
    ownerId: OWNER,
    module: 'sales',
    queryPlan: { module: 'sales', logic: 'AND', filters: [], sort: null, limit: 50 },
    visibility: 'shared',
    sharedWithUsers: [RECIP_A],
    sharedWithRoles: ['Sales Manager'],
  });

  test('recipient A (shared by user, access=PROJ_A) gets rows scoped to PROJ_A', async () => {
    mockFindOne.mockResolvedValue(sharedCard());
    mockRun.mockResolvedValue({ rows: [{ _id: 'a-row' }], total: 1 });
    const req = reqFor(RECIP_A, { params: { id: 'cardId' }, accessibleProjectIds: [PROJ_A.toString()] });
    const { res } = await run(getCardData, req);
    const ctx = mockRun.mock.calls[0][1];
    expect(String(ctx.userId)).toBe(String(RECIP_A));
    expect(ctx.accessibleProjectIds).toEqual([PROJ_A.toString()]); // recipient's own scope
    expect(res._json.data.rows).toEqual([{ _id: 'a-row' }]);
  });

  test('recipient B (shared by role, access=PROJ_B) re-runs under B scope → DIFFERENT rows', async () => {
    mockFindOne.mockResolvedValue(sharedCard());
    mockRun.mockResolvedValue({ rows: [{ _id: 'b-row' }], total: 1 });
    const req = reqFor(RECIP_B, { params: { id: 'cardId' }, accessibleProjectIds: [PROJ_B.toString()] });
    const { res } = await run(getCardData, req);
    const ctx = mockRun.mock.calls[0][1];
    expect(String(ctx.userId)).toBe(String(RECIP_B)); // NOT the owner
    expect(ctx.accessibleProjectIds).toEqual([PROJ_B.toString()]); // B's scope, not A's, not owner's
    expect(res._json.data.rows).toEqual([{ _id: 'b-row' }]);
  });

  test('owner can always read their own card data', async () => {
    mockFindOne.mockResolvedValue(sharedCard());
    mockRun.mockResolvedValue({ rows: [], total: 0 });
    const { res } = await run(getCardData, reqFor(OWNER, { params: { id: 'cardId' }, accessibleProjectIds: null, isOwner: true }));
    expect(res._json.success).toBe(true);
    expect(mockRun).toHaveBeenCalled();
  });

  test('a non-recipient gets 403 and the engine is never called', async () => {
    mockFindOne.mockResolvedValue(sharedCard());
    const req = reqFor(STRANGER, { params: { id: 'cardId' }, accessibleProjectIds: [PROJ_A.toString()] });
    const { res, thrown } = await run(getCardData, req);
    expect(res._status).toBe(403);
    expect(thrown).toBeInstanceOf(Error);
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('a private card is 403 for everyone except the owner', async () => {
    const priv = { ...sharedCard(), visibility: 'private', sharedWithUsers: [], sharedWithRoles: [] };
    mockFindOne.mockResolvedValue(priv);
    const { res } = await run(getCardData, reqFor(RECIP_A, { params: { id: 'cardId' }, accessibleProjectIds: [PROJ_A.toString()] }));
    expect(res._status).toBe(403);
  });

  test('404 when the card does not exist in the org', async () => {
    mockFindOne.mockResolvedValue(null);
    const { res } = await run(getCardData, reqFor(RECIP_A, { params: { id: 'missing' } }));
    expect(res._status).toBe(404);
  });
});
```

- [ ] **Run the test — expect FAIL** (stubs return `[]` / throw 501, assertions on `$or` / engine ctx / 403 fail):
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceController.sharing
```

- [ ] **Implement** — in `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`, replace the `listCards` and `getCardData` stubs with:
```js
/**
 * @desc    List the user's own cards + cards shared with them (by user or role)
 * @route   GET /api/workspace/cards
 * @access  Private (protect)
 */
export const listCards = asyncHandler(async (req, res) => {
  const roleName = req.user.roleRef?.name;
  const orClauses = [
    { ownerId: req.user._id },
    { visibility: 'shared', sharedWithUsers: req.user._id },
  ];
  if (roleName) {
    orClauses.push({ visibility: 'shared', sharedWithRoles: roleName });
  }
  const cards = await WorkspaceCard.find({
    organization: req.user.organization,
    $or: orClauses,
  }).sort({ updatedAt: -1 });
  res.json({ success: true, data: cards });
});

// Is this requester allowed to read this card's data?
//  - owner: always
//  - shared card: recipient by explicit user id OR by current role name
const canReadCard = (card, req) => {
  if (String(card.ownerId) === String(req.user._id)) return true;
  if (card.visibility !== 'shared') return false;
  const byUser = (card.sharedWithUsers || []).some((u) => String(u) === String(req.user._id));
  const roleName = req.user.roleRef?.name;
  const byRole = Boolean(roleName) && (card.sharedWithRoles || []).includes(roleName);
  return byUser || byRole;
};

/**
 * @desc    Run a saved card under the REQUESTING viewer's scope (never the owner's)
 * @route   POST /api/workspace/cards/:id/data
 * @access  Private (protect) — owner or valid share recipient only
 */
export const getCardData = asyncHandler(async (req, res) => {
  const card = await WorkspaceCard.findOne({
    _id: req.params.id,
    organization: req.user.organization,
  });
  if (!card) {
    res.status(404);
    throw new Error('Card not found');
  }
  if (!canReadCard(card, req)) {
    res.status(403);
    throw new Error('You do not have access to this card');
  }
  // Re-execute under the requester's ViewerContext — sharing can never widen
  // a recipient beyond data they could already see (spec §3.4).
  const result = await runQueryPlan(card.queryPlan, viewerFromReq(req));
  res.json({ success: true, data: result });
});
```
Remove the now-replaced `listCards`/`getCardData` stub lines added in Task 11.

- [ ] **Run the test — expect PASS** (and re-run the CRUD suite to confirm no regression):
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceController
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add controllers/workspaceController.js tests/unit/workspaceController.sharing.test.js && git commit -m "feat(workspace): shared-card visibility + recipient-scoped card data (403 for non-recipients)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Layout endpoints — `GET /layout` + `PUT /layout`

Replaces the `getLayout` and `saveLayout` stubs. `GET /layout` returns the caller's layout (empty `items` if none yet). `PUT /layout` upserts the caller's layout, accepting an `items` array of `{ cardId, order, size }`, org+user-scoped (a user can only write their own layout).

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.layout.test.js`

- [ ] **Write the failing test** `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceController.layout.test.js`:
```js
// tests/unit/workspaceController.layout.test.js
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Card model is imported by the controller module; stub it so import resolves.
jest.unstable_mockModule('../../models/workspaceCardModel.js', () => ({
  default: {}, WORKSPACE_MODULES: ['leads', 'sales', 'payments', 'tasks', 'channelPartners'], RENDER_MODES: ['list', 'metric'],
}));
jest.unstable_mockModule('../../services/workspace/catalogs/index.js', () => ({ getCatalog: jest.fn() }));
jest.unstable_mockModule('../../services/workspace/queryPlanSchema.js', () => ({ validateQueryPlan: jest.fn() }));
jest.unstable_mockModule('../../services/workspace/queryEngine.js', () => ({ runQueryPlan: jest.fn() }));

const mockLayoutFindOne = jest.fn();
const mockLayoutFindOneAndUpdate = jest.fn();
jest.unstable_mockModule('../../models/workspaceLayoutModel.js', () => ({
  default: { findOne: mockLayoutFindOne, findOneAndUpdate: mockLayoutFindOneAndUpdate },
  CARD_SIZES: ['sm', 'md', 'lg'],
}));

const { getLayout, saveLayout } = await import('../../controllers/workspaceController.js');

const mockRes = () => {
  const res = {};
  res.json = (p) => { res._json = p; return res; };
  res.status = (c) => { res._status = c; return res; };
  return res;
};
const run = async (handler, req) => {
  const res = mockRes();
  let thrown = null;
  await handler(req, res, (e) => { thrown = e; }).catch((e) => { thrown = e; });
  return { res, thrown };
};
const ORG = new mongoose.Types.ObjectId();
const USER = new mongoose.Types.ObjectId();
const baseReq = (over = {}) => ({
  user: { _id: USER, organization: ORG }, params: {}, query: {}, body: {}, ...over,
});

beforeEach(() => { mockLayoutFindOne.mockReset(); mockLayoutFindOneAndUpdate.mockReset(); });

describe('getLayout', () => {
  test('returns the existing layout for the user', async () => {
    const items = [{ cardId: new mongoose.Types.ObjectId(), order: 0, size: 'lg' }];
    mockLayoutFindOne.mockResolvedValue({ organization: ORG, userId: USER, items });
    const { res } = await run(getLayout, baseReq());
    expect(mockLayoutFindOne).toHaveBeenCalledWith({ organization: ORG, userId: USER });
    expect(res._json.success).toBe(true);
    expect(res._json.data.items).toBe(items);
  });

  test('returns an empty layout (items: []) when none exists yet', async () => {
    mockLayoutFindOne.mockResolvedValue(null);
    const { res } = await run(getLayout, baseReq());
    expect(res._json).toEqual({ success: true, data: { items: [] } });
  });
});

describe('saveLayout', () => {
  test('upserts the caller layout with the provided items (org+user scoped)', async () => {
    const items = [
      { cardId: new mongoose.Types.ObjectId().toString(), order: 0, size: 'md' },
      { cardId: new mongoose.Types.ObjectId().toString(), order: 1, size: 'sm' },
    ];
    mockLayoutFindOneAndUpdate.mockResolvedValue({ organization: ORG, userId: USER, items });
    const { res } = await run(saveLayout, baseReq({ body: { items } }));
    const [filter, update, opts] = mockLayoutFindOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ userId: USER });
    expect(update.$set.organization).toEqual(ORG);
    expect(update.$set.items).toEqual(items);
    expect(opts).toMatchObject({ upsert: true, new: true });
    expect(res._json.success).toBe(true);
  });

  test('400s when items is not an array', async () => {
    const { res, thrown } = await run(saveLayout, baseReq({ body: { items: 'nope' } }));
    expect(res._status).toBe(400);
    expect(thrown).toBeInstanceOf(Error);
    expect(mockLayoutFindOneAndUpdate).not.toHaveBeenCalled();
  });

  test('400s when an item is missing cardId', async () => {
    const { res } = await run(saveLayout, baseReq({ body: { items: [{ order: 0, size: 'md' }] } }));
    expect(res._status).toBe(400);
  });

  test('400s when an item has an invalid size', async () => {
    const { res } = await run(saveLayout, baseReq({
      body: { items: [{ cardId: new mongoose.Types.ObjectId().toString(), order: 0, size: 'xl' }] },
    }));
    expect(res._status).toBe(400);
  });
});
```

- [ ] **Run the test — expect FAIL** (stubs return `{items:[]}` / throw 501):
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceController.layout
```

- [ ] **Implement** — in `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`, add the layout-model import at the top alongside the others:
```js
import WorkspaceLayout, { CARD_SIZES } from '../models/workspaceLayoutModel.js';
```
…and replace the `getLayout` / `saveLayout` stubs with:
```js
/**
 * @desc    Get the requesting user's personal board layout
 * @route   GET /api/workspace/layout
 * @access  Private (protect)
 */
export const getLayout = asyncHandler(async (req, res) => {
  const layout = await WorkspaceLayout.findOne({
    organization: req.user.organization,
    userId: req.user._id,
  });
  res.json({ success: true, data: layout || { items: [] } });
});

/**
 * @desc    Save card order/sizes for the requesting user (upsert; own layout only)
 * @route   PUT /api/workspace/layout
 * @access  Private (protect)
 */
export const saveLayout = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error('items must be an array');
  }
  for (const item of items) {
    if (!item || !item.cardId) {
      res.status(400);
      throw new Error('Each layout item requires a cardId');
    }
    if (item.size !== undefined && !CARD_SIZES.includes(item.size)) {
      res.status(400);
      throw new Error(`Invalid card size: '${item.size}'`);
    }
  }
  const layout = await WorkspaceLayout.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { organization: req.user.organization, userId: req.user._id, items } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.json({ success: true, data: layout, message: 'Layout saved' });
});
```
Remove the `getLayout`/`saveLayout` stub lines from Task 11.

- [ ] **Run the test — expect PASS** (and re-run the whole workspace controller set + the model/catalog suites to confirm the region is green end-to-end):
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspace
```
Expect: `workspaceCardModel`, `workspaceLayoutModel`, `salesCatalog`, `paymentsCatalog`, `tasksCatalog`, `channelPartnersCatalog`, `workspaceController.crud`, `workspaceController.sharing`, `workspaceController.layout` all pass.

- [ ] **Sanity-check parse**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && node --check controllers/workspaceController.js && node --check routes/workspaceRoutes.js
```

- [ ] **Commit**:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add controllers/workspaceController.js tests/unit/workspaceController.layout.test.js && git commit -m "feat(workspace): GET/PUT /layout (per-user upsert, item shape validation)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

I've written the plan region. Here is the summary of what I produced and the key findings that shaped it.

## What I delivered
A markdown fragment of bite-sized TDD tasks **numbered Task 5 → Task 13**, covering: `WorkspaceCard` + `WorkspaceLayout` models, the four module catalogs I own (Sales, Payments, Tasks, Channel Partners) with registration edits to `catalogs/index.js`, the `workspaceController.js` + `workspaceRoutes.js` + `server.js` mount, the sharing/card-data endpoint, and the layout endpoints. Every task has a Files block then checkbox steps: failing test → run (FAIL) → full real implementation code → run (PASS) → real `git commit`.

## Key convention findings (verified against the real backend, not just the truncated JSON)
- **Test command is `npm run test:unit`** (`jest.unit.config.mjs`, matches `tests/unit/**/*.test.js`, `testEnvironment: 'node'`, DB-free). I used this for every task.
- **Model tests use `new Model(doc).validateSync()`** with no DB (pattern from `amenityModel.test.js`, `reportInstanceModel.test.js`).
- **The "regression" suite hits a live HTTP server via `node-fetch`** (`tests/regression/_lib/api.js`/`setup.js`) and skips without one; **supertest is a devDependency but is not actually used anywhere.** So the repo's real idiom for controller "integration" tests is in-process: mock collaborators with `jest.unstable_mockModule`, build a fake `req` + capturing `res`, invoke the exported handler directly (exactly as `reportController.test.js` and `28-sp4-partner-access-scope.test.js` do). I wrote the CRUD/sharing/layout tests this way so they run under `npm run test:unit`.
- **Controllers**: `express-async-handler`, `export const fn = asyncHandler(...)`, envelope `res.json({ success, data, message })`, `res.status(4xx); throw new Error(...)`, org-scope via `req.user.organization`, immutable-field guard on update (from `reportTemplateController.js`).
- **Routes**: `router.use(protect)` then handlers; `hasPermission(PERMISSIONS.X.Y)` where gated. Per spec §7, the workspace routes use `protect` only (module-level permission is enforced by the engine's viewer-scoped catalog from the foundation region). Mount added in `server.js` as `app.use('/api/workspace', workspaceRoutes)` right after the reports mount.
- **Auth/ViewerContext mapping**: `req.user._id`, `req.user.organization`, `req.isOwner`, `req.accessibleProjectIds` (null = owner/all-projects), `req.userPermissions`, and **role name for sharing = `req.user.roleRef?.name`** (confirmed in `authMiddleware.js` + `roleModel.js`).
- **Exact model enums** pulled from source: Sale `status`, `channelPartner` (ref Organization), `salePrice`, `bookingDate`; PaymentTransaction `status`/`paymentMethod`/`amount`/`paymentDate`; Task `status`/`priority`/`category`/`dueDate` (and I import `TASK_STATUSES`/`TASK_PRIORITIES`/`TASK_CATEGORIES` from the model so enums never drift); ChannelPartner `category`/`status`/`firmName`/`approvedProjects`.

## Two design calls worth flagging
- **Payments `daysOverdue`**: `PaymentTransaction` has no due-date (due dates live on `Installment`). To keep the mapper pure and co-located/unit-tested per spec §9, I defined it as "whole days a not-yet-settled payment has been outstanding since `paymentDate` (0 once completed/cleared)" via a `$cond`+`$dateDiff` `$addFields` stage, documented inline.
- **Tasks scope** is org-only (no `project` field on the Task model), unlike Sales/Payments which narrow by `accessibleProjectIds`.

I followed the canonical shared contracts exactly (ViewerContext, QueryPlan, FieldDescriptor with `toMatch(op,value,viewerCtx)` + `addFields()`, Catalog `scope(viewerCtx)`, and the foundation engine imports `runQueryPlan`/`getCatalog`/`validateQueryPlan`). The sharing test explicitly proves the same shared card yields different rows for two recipients by asserting `runQueryPlan` is called with each recipient's own `userId`/`accessibleProjectIds` (never the owner's), and that a non-recipient gets 403 with the engine never invoked.
agentId: afbef49abd397034b (use SendMessage with to: 'afbef49abd397034b' to continue this agent)
<usage>subagent_tokens: 146880
tool_uses: 31
duration_ms: 649691</usage>


## Part C — Backend: Natural-Language → Query Plan

### Task 14: NL→QueryPlan service — failing test for a valid leads plan

**Files**
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js` (Create)
- Create (next task): `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/nlToQueryPlan.js`

This task writes the first failing test only. The service file does not exist yet, so the import fails — that is the expected RED.

- [ ] **Write the failing test.** Mirrors the repo's injectable-client idiom (`tests/unit/agentService.test.js`): a fake Anthropic client whose `messages.create` returns a scripted queue, passed in via the `client` dep. The mock returns a single forced `tool_use` for `emit_query_plan`.

  Create `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js`:

  ```js
  // tests/unit/workspaceNlToQueryPlan.test.js
  import { jest } from '@jest/globals';
  import { nlToQueryPlan } from '../../services/workspace/nlToQueryPlan.js';

  const viewerCtx = { organization: 'org1', accessibleProjectIds: null, userPermissions: [], isOwner: true };

  // Fake Anthropic client: messages.create returns a scripted queue (matches agentService.test.js style).
  const fakeClient = (responses) => {
    const queue = [...responses];
    const create = jest.fn(async () => queue.shift());
    return { messages: { create }, create };
  };

  // A response shaped like a forced single-tool call to emit_query_plan.
  const planResponse = (plan) => ({
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'qp1', name: 'emit_query_plan', input: plan }],
  });

  describe('nlToQueryPlan', () => {
    it('compiles a valid leads sentence into a validated plan with nlSource set', async () => {
      const text = "leads where the channel partner hasn't followed up in 15 days";
      const client = fakeClient([
        planResponse({
          module: 'leads',
          logic: 'AND',
          filters: [{ field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 }],
          sort: { field: 'daysSinceLastCPFollowUp', dir: 'desc' },
          limit: 50,
        }),
      ]);

      const { plan, clarification } = await nlToQueryPlan(text, { module: 'leads', viewerCtx, client });

      expect(clarification).toBeNull();
      expect(plan).not.toBeNull();
      expect(plan.module).toBe('leads');
      expect(plan.filters[0]).toEqual({ field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 });
      expect(plan.sort).toEqual({ field: 'daysSinceLastCPFollowUp', dir: 'desc' });
      expect(plan.nlSource).toBe(text);
      // forced tool output: tool_choice names the single tool
      expect(client.create).toHaveBeenCalledTimes(1);
      const callArg = client.create.mock.calls[0][0];
      expect(callArg.tool_choice).toEqual({ type: 'tool', name: 'emit_query_plan' });
      expect(callArg.tools[0].name).toBe('emit_query_plan');
    });
  });
  ```

- [ ] **Run — expect FAIL.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlToQueryPlan
  ```
  Expected: FAIL — `Cannot find module '../../services/workspace/nlToQueryPlan.js'` (module not yet created). RED confirmed.

- [ ] **Commit the failing test.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add tests/unit/workspaceNlToQueryPlan.test.js && git commit -m "test(workspace): failing test for nlToQueryPlan valid leads plan

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 15: NL→QueryPlan service — implement to GREEN (valid plan path)

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/nlToQueryPlan.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js` (already created in Task 14)

Implements the service so the Task 14 test passes. Matches the repo's Anthropic usage exactly (see `controllers/reportAgentController.js` lines 9–20 for the lazy/quote-tolerant client, `services/reports/agent/agentService.js` line 94 for the `messages.create({ model, max_tokens, system, tools, messages })` call and the `resp.content` `tool_use`/`text` block filtering). Model id matches the repo's `claude-sonnet-4-6`. Forced structured output via `tool_choice: { type: 'tool', name: 'emit_query_plan' }`.

- [ ] **Write the implementation.** Create `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/nlToQueryPlan.js`:

  ```js
  // File: services/workspace/nlToQueryPlan.js
  // Description: Compiles a natural-language sentence into a validated Query Plan using Claude
  // (Anthropic) with forced single-tool output. Best-effort & safe: never throws on a bad/unmappable
  // model result — returns { plan: null, clarification } so the caller can ask the user to refine.
  // The model may ONLY reference fields/operators present in the module catalog (injected as vocab);
  // the result is re-validated against the catalog AND the Joi schema before it is ever returned.
  import Anthropic from '@anthropic-ai/sdk';
  import { validateQueryPlan, MODULES } from './queryPlanSchema.js';
  import { getCatalog, listCatalogModules } from './catalogs/index.js';

  // Match the repo's model env convention (controllers/reportAgentController.js, narrativeService.js).
  // NOTE: repo standard is 'claude-sonnet-4-6'; kept overridable via env for parity with other AI features.
  const MODEL = process.env.WORKSPACE_NL_MODEL || 'claude-sonnet-4-6';
  const MAX_TOKENS = Number(process.env.WORKSPACE_NL_MAX_TOKENS) || 1024;
  const DEFAULT_LIMIT = 50;

  // Lazy + quote/whitespace-tolerant client, identical to the report agent / narrative service:
  // build at call time so env loaded after import is seen, and strip stray quotes the deploy's
  // .env writer may wrap the key in (ANTHROPIC_API_KEY='"sk-ant-…"' would otherwise 401).
  let _client = null;
  const getClient = () => {
    if (_client) return _client;
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim().replace(/^['"]+|['"]+$/g, '');
    if (apiKey) _client = new Anthropic({ apiKey });
    return _client;
  };

  // Build a compact, model-facing vocabulary for one module from its catalog FieldDescriptors.
  const moduleVocab = (moduleKey) => {
    const catalog = getCatalog(moduleKey);
    if (!catalog) return null;
    const fields = catalog.fields.map((f) => {
      const entry = { key: f.key, label: f.label, type: f.type, operators: f.operators };
      if (Array.isArray(f.enumValues) && f.enumValues.length) entry.enumValues = f.enumValues;
      return entry;
    });
    return { module: moduleKey, fields };
  };

  // Vocab for the target module, or for all registered modules when none is specified.
  const buildVocab = (moduleKey) => {
    if (moduleKey) {
      const v = moduleVocab(moduleKey);
      return v ? [v] : [];
    }
    return listCatalogModules().map(moduleVocab).filter(Boolean);
  };

  const SYSTEM_PROMPT = [
    'You convert a user\'s plain-English request into a structured Query Plan for a real-estate CRM.',
    'You MUST call the emit_query_plan tool exactly once. Reference ONLY fields and operators that appear',
    'in the provided FIELD VOCABULARY for the relevant module — never invent a field key or use an operator',
    'a field does not list. Each filter\'s "field" must be a field "key"; each "op" must be one of that',
    'field\'s "operators". Combine conditions with logic "AND". For enum fields use one of the listed',
    'enumValues. If the request cannot be expressed with the available fields/operators, OR it is too',
    'ambiguous to map confidently, set "needsClarification" true and put a short, specific question in',
    '"clarification" instead of guessing. Keep "limit" reasonable (default 50). Use "sort": null if no',
    'ordering is implied.',
  ].join(' ');

  // The single forced-output tool. Its input schema mirrors the QueryPlan contract, plus a
  // clarification escape hatch the model can take instead of emitting a (wrong) plan.
  const emitQueryPlanTool = (vocab) => ({
    name: 'emit_query_plan',
    description: 'Emit the compiled Query Plan (or request clarification). FIELD VOCABULARY: '
      + JSON.stringify(vocab),
    input_schema: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: MODULES, description: 'Target module.' },
        logic: { type: 'string', enum: ['AND'], description: 'Always "AND" in v1.' },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string', description: 'A field key from the vocabulary.' },
              op: { type: 'string', description: 'An operator the field allows.' },
              value: { description: 'The comparison value (string | number | boolean | array | null).' },
            },
            required: ['field', 'op'],
          },
        },
        sort: {
          type: ['object', 'null'],
          properties: {
            field: { type: 'string' },
            dir: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        limit: { type: 'number' },
        needsClarification: { type: 'boolean', description: 'True if the request cannot be mapped confidently.' },
        clarification: { type: 'string', description: 'A short question to the user when needsClarification is true.' },
      },
      required: ['module', 'filters'],
    },
  });

  // Validate every filter/sort field exists in the catalog and each op is allowed for that field.
  // Returns null on success, or a human-readable reason string on the first violation.
  const catalogViolation = (plan, moduleKey) => {
    const catalog = getCatalog(moduleKey);
    if (!catalog) return `Unknown module "${moduleKey}".`;
    const byKey = new Map(catalog.fields.map((f) => [f.key, f]));
    for (const f of plan.filters || []) {
      const fd = byKey.get(f.field);
      if (!fd) return `I don't have a field called "${f.field}" for ${moduleKey}.`;
      if (!fd.operators.includes(f.op)) {
        return `The "${fd.label}" field can't use "${f.op}" (allowed: ${fd.operators.join(', ')}).`;
      }
    }
    if (plan.sort && plan.sort.field) {
      if (!byKey.has(plan.sort.field)) return `I can't sort by "${plan.sort.field}" for ${moduleKey}.`;
    }
    return null;
  };

  /**
   * Compile NL text into a validated Query Plan.
   * @param {string} text - the user's plain-English request.
   * @param {object} [opts]
   * @param {string} [opts.module] - target module; if omitted the model also picks the module.
   * @param {object} [opts.viewerCtx] - viewer scope (reserved; the plan is viewer-scoped at run time, not here).
   * @param {object} [opts.client] - injected Anthropic client (tests pass a fake); defaults to a real lazy client.
   * @returns {Promise<{ plan: object|null, clarification: string|null }>}
   */
  export const nlToQueryPlan = async (text, { module, viewerCtx, client } = {}) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return { plan: null, clarification: 'Please type what you want to see.' };

    const anthropic = client || getClient();
    if (!anthropic) return { plan: null, clarification: 'AI is not configured (ANTHROPIC_API_KEY missing).' };

    const vocab = buildVocab(module);
    if (!vocab.length) return { plan: null, clarification: `I don't recognize the module "${module}".` };

    const tool = emitQueryPlanTool(vocab);

    let resp;
    try {
      resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: [tool],
        tool_choice: { type: 'tool', name: 'emit_query_plan' }, // force the single structured output
        messages: [{ role: 'user', content: trimmed }],
      });
    } catch (err) {
      return { plan: null, clarification: `I couldn't reach the AI service (${err.message}). Try the builder.` };
    }

    const blocks = Array.isArray(resp?.content) ? resp.content : [];
    const toolUse = blocks.find((b) => b.type === 'tool_use' && b.name === 'emit_query_plan');
    if (!toolUse || !toolUse.input || typeof toolUse.input !== 'object') {
      const text2 = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
      return { plan: null, clarification: text2 || "I couldn't turn that into a filter. Could you rephrase?" };
    }

    const out = toolUse.input;
    if (out.needsClarification) {
      return { plan: null, clarification: out.clarification || 'Could you add a bit more detail?' };
    }

    // Assemble a candidate plan in the canonical shape; the module is the requested one or the model's choice.
    const candidate = {
      module: module || out.module,
      logic: 'AND',
      filters: Array.isArray(out.filters) ? out.filters : [],
      sort: out.sort && out.sort.field ? { field: out.sort.field, dir: out.sort.dir === 'asc' ? 'asc' : 'desc' } : null,
      limit: Number.isFinite(out.limit) ? out.limit : DEFAULT_LIMIT,
      nlSource: trimmed,
    };

    // 1) Shape/whitelist validation via the shared Joi schema.
    const { value, error } = validateQueryPlan(candidate);
    if (error) {
      return { plan: null, clarification: "I couldn't build a valid filter from that — try the builder, or rephrase." };
    }
    // 2) Catalog validation: every field exists and every op is allowed for that field.
    const violation = catalogViolation(value, value.module);
    if (violation) return { plan: null, clarification: violation };

    return { plan: { ...value, nlSource: trimmed }, clarification: null };
  };

  export default { nlToQueryPlan };
  ```

- [ ] **Run — expect PASS.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlToQueryPlan
  ```
  Expected: PASS — the valid-leads test goes GREEN (1 passing).

- [ ] **Commit.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/nlToQueryPlan.js && git commit -m "feat(workspace): nlToQueryPlan compiles NL into a validated Query Plan via Claude tool-use

Uses the repo's lazy/quote-tolerant Anthropic client + claude-sonnet-4-6, forced
emit_query_plan tool output, and re-validates against the Joi schema and field catalog.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 16: NL→QueryPlan service — clarification on unknown field (no throw)

**Files**
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js` (Modify — add a case)
- Implemented by: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/nlToQueryPlan.js` (already handles this via `catalogViolation`)

Adds the "unknown field → clarification, not throw" case. The service already covers it (Task 15), so this is a confirming test — it must go RED only if the behavior regresses; with the current implementation it should pass immediately after being added. Write it, run it, confirm GREEN.

- [ ] **Add the failing/confirming test.** Append inside the `describe('nlToQueryPlan', …)` block in `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js`:

  ```js
    it('returns a clarification (not a throw) when the model references an unknown field', async () => {
      const client = fakeClient([
        planResponse({
          module: 'leads',
          logic: 'AND',
          filters: [{ field: 'totallyMadeUpField', op: 'is', value: 'x' }],
          sort: null,
          limit: 50,
        }),
      ]);

      const result = await nlToQueryPlan('leads with a made up field', { module: 'leads', viewerCtx, client });

      expect(result.plan).toBeNull();
      expect(typeof result.clarification).toBe('string');
      expect(result.clarification.length).toBeGreaterThan(0);
      expect(result.clarification).toMatch(/totallyMadeUpField/);
    });
  ```

- [ ] **Run — expect PASS** (behavior already implemented in Task 15; this guards it).
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlToQueryPlan
  ```
  Expected: PASS — 2 passing. If the unknown-field path ever throws or returns a non-null plan, this test goes RED.

- [ ] **Commit.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add tests/unit/workspaceNlToQueryPlan.test.js && git commit -m "test(workspace): nlToQueryPlan returns clarification for unknown field

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 17: NL→QueryPlan service — clarification on disallowed operator for a field

**Files**
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js` (Modify — add a case)
- Implemented by: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/nlToQueryPlan.js` (already handles this via `catalogViolation`)

Adds the "operator not allowed for that field → clarification" case. Uses a numeric/date field (`daysSinceLastCPFollowUp`) with a string-only operator (`contains`) that the field's `operators` list does not include, so `catalogViolation` must reject it.

- [ ] **Add the test.** Append inside the `describe('nlToQueryPlan', …)` block in `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlToQueryPlan.test.js`:

  ```js
    it('returns a clarification when the operator is not allowed for the field', async () => {
      // `contains` is a string-only operator; a numeric/date field like daysSinceLastCPFollowUp
      // does not list it, so the catalog check must reject the plan rather than run it.
      const client = fakeClient([
        planResponse({
          module: 'leads',
          logic: 'AND',
          filters: [{ field: 'daysSinceLastCPFollowUp', op: 'contains', value: 15 }],
          sort: null,
          limit: 50,
        }),
      ]);

      const result = await nlToQueryPlan('leads cp follow up contains 15', { module: 'leads', viewerCtx, client });

      expect(result.plan).toBeNull();
      expect(typeof result.clarification).toBe('string');
      expect(result.clarification).toMatch(/contains/);
    });
  ```

  > Note (catalog dependency): this assumes the `leads` catalog's `daysSinceLastCPFollowUp` FieldDescriptor lists numeric/date operators (`gt, lt, gte, lte, between`) and **not** `contains` (consistent with the Leads catalog defined earlier in this plan). If `contains` were ever added to it, swap the test's operator for any other key absent from that field's `operators`.

- [ ] **Run — expect PASS** (guards the operator-allow-list check from Task 15).
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlToQueryPlan
  ```
  Expected: PASS — 3 passing.

- [ ] **Commit.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add tests/unit/workspaceNlToQueryPlan.test.js && git commit -m "test(workspace): nlToQueryPlan returns clarification for disallowed operator

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 18: Endpoint wiring — failing test for `postNlToQueryPlan` controller

**Files**
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlController.test.js` (Create)
- Modify (next task): `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`

Writes a controller-level test mirroring the repo's `mockRes()` idiom (`tests/unit/reportController.test.js`). The handler must read `{ text, module }` from `req.body`, build `viewerCtx` from the request, call the service, and return `res.json({ success, data: { plan, clarification } })`. To keep the test DB- and SDK-free, the controller's NL service dependency is injected via `jest.unstable_mockModule` (matching the repo's ESM-mock approach in `tests/unit/resolveReportData.test.js`).

`postNlToQueryPlan` does not exist yet, so the import/handler call fails — expected RED.

- [ ] **Write the failing test.** Create `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlController.test.js`:

  ```js
  // tests/unit/workspaceNlController.test.js
  import { jest } from '@jest/globals';

  // Mock the NL service (ESM) so the controller test never touches the Anthropic SDK.
  // Matches the repo's jest.unstable_mockModule approach (tests/unit/resolveReportData.test.js).
  const nlToQueryPlan = jest.fn();
  jest.unstable_mockModule('../../services/workspace/nlToQueryPlan.js', () => ({
    nlToQueryPlan,
    default: { nlToQueryPlan },
  }));

  const { postNlToQueryPlan } = await import('../../controllers/workspaceController.js');

  const mockRes = () => {
    const res = {};
    res.json = (payload) => { res._json = payload; return res; };
    res.status = (code) => { res._status = code; return res; };
    return res;
  };

  const baseReq = (body) => ({
    body,
    user: { _id: 'u1', organization: 'org1', role: 'Sales Manager' },
    accessibleProjectIds: ['p1'],
    userPermissions: ['leads:read'],
    isOwner: false,
  });

  describe('workspaceController.postNlToQueryPlan', () => {
    beforeEach(() => nlToQueryPlan.mockReset());

    it('returns 200 with a plan for a good sentence', async () => {
      const plan = {
        module: 'leads', logic: 'AND',
        filters: [{ field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 }],
        sort: null, limit: 50, nlSource: 'cp not followed up in 15 days',
      };
      nlToQueryPlan.mockResolvedValue({ plan, clarification: null });

      const req = baseReq({ text: 'cp not followed up in 15 days', module: 'leads' });
      const res = mockRes();
      await postNlToQueryPlan(req, res, () => {});

      expect(res._json.success).toBe(true);
      expect(res._json.data.plan).toEqual(plan);
      expect(res._json.data.clarification).toBeNull();
      // service was called with the body text/module and a viewer context derived from the request
      const [textArg, opts] = nlToQueryPlan.mock.calls[0];
      expect(textArg).toBe('cp not followed up in 15 days');
      expect(opts.module).toBe('leads');
      expect(opts.viewerCtx).toMatchObject({ organization: 'org1' });
    });

    it('returns 200 with a clarification (plan null) for an unmappable sentence', async () => {
      nlToQueryPlan.mockResolvedValue({ plan: null, clarification: 'Which project did you mean?' });

      const req = baseReq({ text: 'show me the good ones', module: 'leads' });
      const res = mockRes();
      await postNlToQueryPlan(req, res, () => {});

      expect(res._json.success).toBe(true);
      expect(res._json.data.plan).toBeNull();
      expect(res._json.data.clarification).toBe('Which project did you mean?');
    });
  });
  ```

- [ ] **Run — expect FAIL.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlController
  ```
  Expected: FAIL — `postNlToQueryPlan` is `undefined` (not exported yet), so the handler call throws `TypeError: postNlToQueryPlan is not a function`. RED confirmed.

- [ ] **Commit the failing test.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add tests/unit/workspaceNlController.test.js && git commit -m "test(workspace): failing test for postNlToQueryPlan controller

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```

---

### Task 19: Endpoint wiring — implement `postNlToQueryPlan` and add the route

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js` (additive — add handler + import)
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/routes/workspaceRoutes.js` (additive — add route)
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceNlController.test.js` (from Task 18)

Implements the handler to GREEN and wires the route. The controller and routes files ALREADY EXIST from Part B; these are additive edits. The handler uses `express-async-handler` (repo standard) and the `res.json({ success, data })` shape. It builds `viewerCtx` via `viewerFromReq(req)` — the helper **already defined at the top of `workspaceController.js` by Part B (Task 11)**.

> **Dependency note:** `viewerFromReq(req)` is the shared helper defined in `workspaceController.js` by Part B and used by all the other workspace handlers. It returns the canonical ViewerContext `{ organization, userId, accessibleProjectIds, isOwner, permissions }` from the auth-middleware request enhancements. Reuse it — do **not** redefine it. (For reference, its Part B definition is:)
> ```js
> const viewerFromReq = (req) => ({
>   organization: req.user.organization,
>   userId: req.user._id,
>   accessibleProjectIds: req.accessibleProjectIds,
>   isOwner: req.isOwner || false,
>   permissions: req.userPermissions || [],
> });
> ```

- [ ] **Add the import + handler to the controller.** In `/Users/nirpekshnandan/My Products/propvantage-ai-backend/controllers/workspaceController.js`, add the service import near the top with the other imports:

  ```js
  import { nlToQueryPlan } from '../services/workspace/nlToQueryPlan.js';
  ```

  and append the handler (uses the existing `asyncHandler` import and the `viewerFromReq(req)` helper already in this file from Part B):

  ```js
  /**
   * @desc  Compile a natural-language request into a validated Query Plan (authoring assist).
   *        Never executes model output — returns the plan for the builder to show/edit, or a
   *        clarification when the text can't be mapped to the module's catalog.
   * @route POST /api/workspace/nl-to-queryplan   body: { text, module? }
   * @access Private
   */
  export const postNlToQueryPlan = asyncHandler(async (req, res) => {
    const { text, module } = req.body || {};
    if (!text || !String(text).trim()) {
      res.status(400);
      throw new Error('A text prompt is required.');
    }
    const viewerCtx = viewerFromReq(req);
    const { plan, clarification } = await nlToQueryPlan(String(text), { module, viewerCtx });
    res.json({ success: true, data: { plan, clarification } });
  });
  ```

- [ ] **Add the route.** In `/Users/nirpekshnandan/My Products/propvantage-ai-backend/routes/workspaceRoutes.js`, import the new handler with the others and register it (additive; sits alongside the existing `/catalog/:module`, `/preview`, `/cards` routes, all already behind the file's `protect` middleware):

  ```js
  import { postNlToQueryPlan } from '../controllers/workspaceController.js';
  ```
  ```js
  router.post('/nl-to-queryplan', postNlToQueryPlan);
  ```

  > If the controller handlers are imported as a namespace (e.g. `import * as workspaceController from '../controllers/workspaceController.js'`) in this file, instead register: `router.post('/nl-to-queryplan', workspaceController.postNlToQueryPlan);` — match the file's existing import style.

- [ ] **Run — expect PASS.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspaceNlController
  ```
  Expected: PASS — both controller cases GREEN (2 passing).

- [ ] **Run the full unit suite to confirm no regressions across the region.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- workspace
  ```
  Expected: PASS — `workspaceNlToQueryPlan` (3) + `workspaceNlController` (2) all green.

- [ ] **Commit.**
  ```bash
  cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add controllers/workspaceController.js routes/workspaceRoutes.js && git commit -m "feat(workspace): POST /api/workspace/nl-to-queryplan endpoint

Adds postNlToQueryPlan (express-async-handler) that builds viewerCtx from the
request, calls nlToQueryPlan, and returns { success, data: { plan, clarification } };
registers the additive route on the existing workspace router.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
  ```


## Part D — Frontend: Workspace UI

### Task 20: Add `workspaceAPI` to the API service

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/services/api.js`

**Steps**

- [ ] Implement: in `src/services/api.js`, add a new exported module object directly **after** the `searchAPI`/`amenityAPI` block (around line 575, before the `salesAPI` section comment) so it sits with the other top-level API modules. Match the existing `export const xAPI = { ... }` style exactly:

```js
// =============================================================================
// PERSONALIZED WORKSPACE SERVICES (/api/workspace)
// Cards = saved, filtered queries over one module, rendered as list or metric.
// All responses are wrapped { success, data, message } — unwrap res.data.data.
// =============================================================================
export const workspaceAPI = {
  // Field catalog that drives the FilterBuilder UI (fields, operators, enumValues).
  getCatalog: (module) => api.get(`/workspace/catalog/${module}`),

  // Compile a natural-language sentence into a validated Query Plan.
  // → { plan, clarification }
  nlToQueryPlan: (text, module) =>
    api.post('/workspace/nl-to-queryplan', { text, module }),

  // Run a Query Plan WITHOUT saving (builder live preview).
  // opts: { renderMode:'list'|'metric', metricConfig:{ agg, field } }
  // → { rows, total } (list) or { value, breakdown } (metric)
  preview: (plan, opts = {}) =>
    api.post('/workspace/preview', { ...plan, ...opts }),

  // List the user's own + shared-with-them cards.
  getCards: () => api.get('/workspace/cards'),
  createCard: (payload) => api.post('/workspace/cards', payload),
  updateCard: (id, payload) => api.put(`/workspace/cards/${id}`, payload),
  deleteCard: (id) => api.delete(`/workspace/cards/${id}`),

  // Run a saved card under the viewer's own scope.
  // → { rows, total } (list) or { value, breakdown } (metric)
  getCardData: (id) => api.post(`/workspace/cards/${id}/data`),

  // Personal layout (card order + sizes).
  getLayout: () => api.get('/workspace/layout'),
  saveLayout: (items) => api.put('/workspace/layout', { items }),
};
```

- [ ] Verify: run a syntax/compile check — `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && npx eslint src/services/api.js`. Expect no new errors for the added block. (The repo has no api.js test; this module is a thin axios wrapper exercised end-to-end in Task 31.)
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/services/api.js && git commit -m "$(cat <<'EOF'
feat(workspace): add workspaceAPI service module

Adds catalog, nl-to-queryplan, preview, card CRUD, card data, and
layout methods to src/services/api.js matching the existing module
style. All call /api/workspace and unwrap the standard
{ success, data, message } envelope at the call site.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: Role-based starter cards definitions

> Built before the board so the empty-state and `WorkspaceContext` can both import it. Pure data + one helper — no React.

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/starterCards.js`
- Create (test): `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/starterCards.test.js`

**Steps**

- [ ] Write test first (the repo has a real util-test culture — `src/utils/*.test.js`, `src/pages/reports/builderState.test.js`):

```js
// src/pages/workspace/starterCards.test.js
import { STARTER_CARDS, getStarterCardsForRole } from './starterCards';

describe('starterCards', () => {
  it('every starter card is a valid QueryPlan-bearing definition', () => {
    Object.values(STARTER_CARDS).flat().forEach((card) => {
      expect(typeof card.title).toBe('string');
      expect(['leads', 'sales', 'payments', 'tasks', 'channelPartners']).toContain(card.module);
      expect(['list', 'metric']).toContain(card.renderMode);
      expect(card.queryPlan.module).toBe(card.module);
      expect(card.queryPlan.logic).toBe('AND');
      expect(Array.isArray(card.queryPlan.filters)).toBe(true);
    });
  });

  it('maps a known role to its starter set', () => {
    const cards = getStarterCardsForRole('Sales Manager');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.map((c) => c.title)).toContain('Stale CP leads');
  });

  it('falls back to a generic set for an unknown role', () => {
    const cards = getStarterCardsForRole('Some Future Role');
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
  });
});
```

- [ ] Run (expect failure — module missing): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/pages/workspace/starterCards.test.js --watchAll=false`
- [ ] Implement:

```js
// src/pages/workspace/starterCards.js
// Role-based starter card definitions for the Workspace empty state.
// Each definition mirrors the WorkspaceCard create payload (minus ownership/ids):
// { title, module, queryPlan, renderMode, metricConfig }.
// queryPlan shape (see workspace spec §3.3):
//   { module, logic:'AND', filters:[{field,op,value}], sort:{field,dir}|null, limit, nlSource }

const plan = (module, filters, sort = null, limit = 50) => ({
  module,
  logic: 'AND',
  filters,
  sort,
  limit,
  nlSource: null,
});

const listCard = (title, module, filters, sort, limit) => ({
  title,
  module,
  renderMode: 'list',
  metricConfig: { agg: 'count', field: null },
  queryPlan: plan(module, filters, sort, limit),
});

const metricCard = (title, module, filters) => ({
  title,
  module,
  renderMode: 'metric',
  metricConfig: { agg: 'count', field: null },
  queryPlan: plan(module, filters, null, 1),
});

// Generic fallback set — useful to any persona.
const GENERIC = [
  listCard(
    'My open leads',
    'leads',
    [{ field: 'assignedToMe', op: 'is', value: true }],
    { field: 'daysInCurrentStatus', dir: 'desc' },
  ),
  listCard(
    'My tasks due soon',
    'tasks',
    [
      { field: 'assignedToMe', op: 'is', value: true },
      { field: 'dueDate', op: 'lastNDays', value: 7 },
    ],
    { field: 'dueDate', dir: 'asc' },
  ),
];

// Map of role name → starter card definitions.
export const STARTER_CARDS = {
  'Sales Manager': [
    listCard(
      'Stale CP leads',
      'leads',
      [
        { field: 'source', op: 'is', value: 'Channel Partner' },
        { field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 },
      ],
      { field: 'daysSinceLastCPFollowUp', dir: 'desc' },
    ),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
    listCard(
      "My team's site visits this week",
      'leads',
      [
        { field: 'status', op: 'is', value: 'Site Visit Scheduled' },
        { field: 'followUpDate', op: 'lastNDays', value: 7 },
      ],
      { field: 'followUpDate', dir: 'asc' },
    ),
  ],
  'Sales Head': [
    metricCard('Open leads', 'leads', [
      { field: 'status', op: 'notIn', value: ['Booked', 'Lost'] },
    ]),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
  'Finance Head': [
    listCard(
      'Overdue payments',
      'payments',
      [{ field: 'daysOverdue', op: 'gt', value: 0 }],
      { field: 'daysOverdue', dir: 'desc' },
    ),
    listCard(
      'Payments due this week',
      'payments',
      [{ field: 'dueDate', op: 'lastNDays', value: 7 }],
      { field: 'dueDate', dir: 'asc' },
    ),
  ],
  'Finance Manager': [
    listCard(
      'Overdue payments',
      'payments',
      [{ field: 'daysOverdue', op: 'gt', value: 0 }],
      { field: 'daysOverdue', dir: 'desc' },
    ),
  ],
  'Business Head': [
    metricCard('Bookings pending approval', 'sales', [
      { field: 'status', op: 'is', value: 'Pending Approval' },
    ]),
    metricCard('Overdue payments', 'payments', [
      { field: 'daysOverdue', op: 'gt', value: 0 },
    ]),
  ],
  'Project Director': [
    metricCard('Open leads', 'leads', [
      { field: 'status', op: 'notIn', value: ['Booked', 'Lost'] },
    ]),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
  'Sales Executive': [
    listCard(
      'My open leads',
      'leads',
      [{ field: 'assignedToMe', op: 'is', value: true }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
    listCard(
      'My stale leads',
      'leads',
      [
        { field: 'assignedToMe', op: 'is', value: true },
        { field: 'daysInCurrentStatus', op: 'gte', value: 10 },
      ],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
};

/**
 * Resolve the starter card definitions for a role name, falling back to a
 * generic set when the role has no curated starters.
 * @param {string} roleName
 * @returns {Array<object>}
 */
export const getStarterCardsForRole = (roleName) => {
  if (roleName && STARTER_CARDS[roleName]) return STARTER_CARDS[roleName];
  return GENERIC;
};
```

- [ ] Run (expect pass): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/pages/workspace/starterCards.test.js --watchAll=false`. Expect 3 passing tests.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/starterCards.js src/pages/workspace/starterCards.test.js && git commit -m "$(cat <<'EOF'
feat(workspace): role-based starter card definitions

Adds STARTER_CARDS map (role -> card defs) + getStarterCardsForRole
fallback, used by the Workspace empty state. Each def carries a valid
AND-only QueryPlan. Covered by a unit test.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: `WorkspaceContext` — cards, layout, shared-with-me, CRUD/layout actions

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/context/WorkspaceContext.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/App.js`

**Steps**

- [ ] Implement the context, following the `ProjectContext.js` idiom (gate fetch on `isAuthenticated`, `useCallback` loaders, `useXContext` hook that throws if no provider, `enqueueSnackbar` on error):

```js
// src/context/WorkspaceContext.js
import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { workspaceAPI } from '../services/api';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [cards, setCards] = useState([]);          // all cards: owned + shared-with-me
  const [layout, setLayout] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const userId = user?._id || user?.id;

  // Cards I own vs cards shared TO me (the "Shared with me" tray source).
  const ownedCards = useMemo(
    () => cards.filter((c) => String(c.ownerId) === String(userId)),
    [cards, userId],
  );
  const sharedWithMe = useMemo(
    () => cards.filter((c) => String(c.ownerId) !== String(userId)),
    [cards, userId],
  );

  const loadCards = useCallback(async () => {
    try {
      const res = await workspaceAPI.getCards();
      setCards(res.data?.data || []);
    } catch {
      setCards([]);
      enqueueSnackbar('Failed to load your workspace cards', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const loadLayout = useCallback(async () => {
    try {
      const res = await workspaceAPI.getLayout();
      setLayout(res.data?.data || { items: [] });
    } catch {
      setLayout({ items: [] });
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCards(), loadLayout()]);
    setLoading(false);
  }, [loadCards, loadLayout]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    refresh();
  }, [isAuthenticated, refresh]);

  // ── Card CRUD ──────────────────────────────────────────────────────────────
  const createCard = useCallback(async (payload) => {
    try {
      const res = await workspaceAPI.createCard(payload);
      const created = res.data?.data;
      if (created) setCards((prev) => [...prev, created]);
      enqueueSnackbar('Card created', { variant: 'success' });
      return created;
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to create card', { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  const updateCard = useCallback(async (id, payload) => {
    try {
      const res = await workspaceAPI.updateCard(id, payload);
      const updated = res.data?.data;
      if (updated) setCards((prev) => prev.map((c) => (c._id === id ? updated : c)));
      enqueueSnackbar('Card updated', { variant: 'success' });
      return updated;
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update card', { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  const deleteCard = useCallback(async (id) => {
    const prevCards = cards;
    const prevLayout = layout;
    // optimistic removal from cards + layout
    setCards((prev) => prev.filter((c) => c._id !== id));
    setLayout((prev) => ({ ...prev, items: (prev.items || []).filter((it) => it.cardId !== id) }));
    try {
      await workspaceAPI.deleteCard(id);
      enqueueSnackbar('Card deleted', { variant: 'success' });
    } catch (err) {
      setCards(prevCards);
      setLayout(prevLayout);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete card', { variant: 'error' });
      throw err;
    }
  }, [cards, layout, enqueueSnackbar]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const saveLayout = useCallback(async (items) => {
    const prev = layout;
    setLayout({ items }); // optimistic
    try {
      const res = await workspaceAPI.saveLayout(items);
      if (res.data?.data) setLayout(res.data.data);
    } catch (err) {
      setLayout(prev);
      enqueueSnackbar('Failed to save board layout', { variant: 'error' });
      throw err;
    }
  }, [layout, enqueueSnackbar]);

  // Add a card to my personal board (used by SharedWithMeTray + suggested cards).
  const addToBoard = useCallback((cardId, size = 'md') => {
    const items = layout.items || [];
    if (items.some((it) => it.cardId === cardId)) return Promise.resolve();
    const next = [...items, { cardId, order: items.length, size }];
    return saveLayout(next);
  }, [layout, saveLayout]);

  const removeFromBoard = useCallback((cardId) => {
    const next = (layout.items || []).filter((it) => it.cardId !== cardId);
    return saveLayout(next.map((it, i) => ({ ...it, order: i })));
  }, [layout, saveLayout]);

  const value = useMemo(() => ({
    cards,
    ownedCards,
    sharedWithMe,
    layout,
    loading,
    refresh,
    createCard,
    updateCard,
    deleteCard,
    saveLayout,
    addToBoard,
    removeFromBoard,
  }), [
    cards, ownedCards, sharedWithMe, layout, loading, refresh,
    createCard, updateCard, deleteCard, saveLayout, addToBoard, removeFromBoard,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};

export default WorkspaceContext;
```

- [ ] Implement: wire the provider in `src/App.js`. Add the import beside the other context imports (after line 17, `import { ProjectProvider } from './context/ProjectContext';`):

```js
import { WorkspaceProvider } from './context/WorkspaceContext';
```

Then nest it inside the provider tree in the `App` component (it depends on `useAuth` + `useSnackbar`, both already above it). Change the existing block (around lines 1769–1781):

```jsx
        <AuthProvider>
          <ProjectProvider>
            <WorkspaceProvider>
              <ChatProvider>
                <CoachMarkProvider flows={FLOWS}>
                  <Router>
                    <Suspense fallback={<LoadingFallback message="Loading PropVantage AI..." />}>
                      <AppRoutes />
                    </Suspense>
                  </Router>
                </CoachMarkProvider>
              </ChatProvider>
            </WorkspaceProvider>
          </ProjectProvider>
        </AuthProvider>
```

- [ ] Verify: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && npx eslint src/context/WorkspaceContext.js src/App.js`. Expect no new errors. (Runtime wiring is verified in Task 31.)
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/context/WorkspaceContext.js src/App.js && git commit -m "$(cat <<'EOF'
feat(workspace): WorkspaceContext + provider wiring

Adds WorkspaceContext (cards, owned/sharedWithMe split, layout,
CRUD + layout actions, optimistic updates, notistack errors) following
the ProjectContext idiom, and mounts WorkspaceProvider in App.js inside
the existing provider tree.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 23: Routing, nav item, and default landing on `/workspace`

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/App.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/components/layout/DashboardLayout.js`

> `WorkspacePage` is created in Task 24; this task only references it. Order is fine because the lazy import is not evaluated until the route renders, and we land the page component in the very next task before any manual run.

**Steps**

- [ ] Implement: add the lazy import in `src/App.js`. Place it with the dashboard imports (after line 45, the `ProjectDirectorDashboard` import) so it reads as a primary landing surface:

```js
// Personalized Workspace (default landing) - new
const WorkspacePage = React.lazy(() => import('./pages/workspace/WorkspacePage'));
```

- [ ] Implement: add the `/workspace` route. Insert it immediately **before** the `/dashboard` route (around line 507), matching the existing `ProtectedRoute` + `DashboardLayout` + `Suspense` idiom:

```jsx
      {/* ========================================= */}
      {/* PERSONALIZED WORKSPACE (default landing)  */}
      {/* ========================================= */}

      <Route path="/workspace" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading your workspace..." />}>
              <WorkspacePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
```

- [ ] Implement: make `DashboardRouter` default to `/workspace` while keeping all 5 role dashboards reachable. The 5 dashboards stay reachable because the nav "Dashboard" item still points at `/dashboard` (which renders `DashboardRouter`); we add an early redirect for the *bare* default so a fresh post-login user lands on the workspace. Edit `DashboardRouter` (line 344) — change the developer-org default to redirect to `/workspace` instead of computing a role dashboard, but preserve the role-dashboard computation for when it is explicitly wanted.

Replace the body of `DashboardRouter` so the **post-login default** (the `/dashboard` index with no role intent) sends users to the workspace, while the role dashboards remain directly routable. Concretely, keep `getDashboardComponent` intact and add the redirect at the top, gated so it only fires for the implicit landing:

```jsx
const DashboardRouter = () => {
  const { user, roleLevel, isOwner, checkPerm, isChannelPartnerOrg } = useAuth();

  // Redirect channel partner org users away from the developer dashboard
  if (isChannelPartnerOrg) return <Navigate to="/partner/dashboard" replace />;

  // NEW: "My Workspace" is the default landing for developer-org users.
  // The 5 role dashboards remain reachable via their own routes / the nav
  // "Dashboards" group below; this only changes the implicit landing target.
  return <Navigate to="/workspace" replace />;

  // (role-dashboard computation retained below for reference / direct routes)
  // eslint-disable-next-line no-unreachable
  const getDashboardComponent = () => { /* ...unchanged... */ };
  return getDashboardComponent();
};
```

> Keep the existing `getDashboardComponent` function body exactly as-is below the early return (it stays in the file). To make the 5 dashboards reachable as first-class destinations, add explicit routes in the next step.

- [ ] Implement: add explicit role-dashboard routes so each of the 5 dashboards is reachable by URL (and from nav). Add the imports already exist (lines 41–45). Insert these routes right after the `/dashboard` route:

```jsx
      {/* The 5 role dashboards — reachable directly (nav "Dashboards" group). */}
      <Route path="/dashboards/business-head" element={
        <ProtectedRoute><DashboardLayout>
          <Suspense fallback={<LoadingFallback />}><BusinessHeadDashboard /></Suspense>
        </DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboards/project-director" element={
        <ProtectedRoute><DashboardLayout>
          <Suspense fallback={<LoadingFallback />}><ProjectDirectorDashboard /></Suspense>
        </DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboards/sales-manager" element={
        <ProtectedRoute><DashboardLayout>
          <Suspense fallback={<LoadingFallback />}><SalesManagerDashboard /></Suspense>
        </DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboards/finance-head" element={
        <ProtectedRoute><DashboardLayout>
          <Suspense fallback={<LoadingFallback />}><FinanceHeadDashboard /></Suspense>
        </DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboards/sales-executive" element={
        <ProtectedRoute><DashboardLayout>
          <Suspense fallback={<LoadingFallback />}><SalesExecutiveDashboard /></Suspense>
        </DashboardLayout></ProtectedRoute>
      } />
```

- [ ] Implement: add the "My Workspace" nav item to the **MAIN** section of `getNavigationItems` in `src/components/layout/DashboardLayout.js`. First add an icon import — confirm `Dashboard` is already imported from `@mui/icons-material` at the top of the file; add `ViewQuilt` to that same import (it is the board/workspace glyph and is not already used). Then edit the MAIN section (lines 106–118) so it lists Workspace first, then the role-dashboard launcher:

```js
    // MAIN
    {
      section: 'MAIN',
      items: [
        {
          id: 'workspace',
          title: 'My Workspace',
          icon: ViewQuilt,
          path: '/workspace',
          requiredAccess: () => true,
        },
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: Dashboard,
          path: '/dashboard',
          requiredAccess: () => true,
        },
      ],
    },
```

- [ ] Verify (automated): the repo ships `src/App.test.js`. Run the existing app smoke test to confirm the route tree still compiles and renders: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/App.test.js --watchAll=false`. Expect it to pass (no crash from the new routes/imports).
- [ ] Verify (lint): `npx eslint src/App.js src/components/layout/DashboardLayout.js`. Expect no new errors (the `no-unreachable` on the retained `getDashboardComponent` is suppressed inline).
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/App.js src/components/layout/DashboardLayout.js && git commit -m "$(cat <<'EOF'
feat(workspace): /workspace route, default landing, and nav item

Adds the lazy /workspace route under ProtectedRoute+DashboardLayout,
redirects the implicit /dashboard landing to /workspace, exposes the 5
role dashboards at explicit /dashboards/* routes, and adds a "My
Workspace" item to the MAIN nav section.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 24: `WorkspacePage` shell + empty state with suggested cards

**Files**
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/WorkspacePage.js`

> Imports `WorkspaceBoard` (Task 25), `CardBuilderDialog` (Task 27), and `SharedWithMeTray` (Task 29). To keep this task runnable in isolation, create lightweight stub files first (each a default-exporting component returning `null`); the later tasks replace them with full implementations.

**Steps**

- [ ] Implement: create stub files so `WorkspacePage` compiles now (replaced fully in later tasks):

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace"
for f in WorkspaceBoard CardBuilderDialog SharedWithMeTray WorkspaceCardView; do
  printf "import React from 'react';\n// Stub — implemented in a later task.\nconst %s = () => null;\nexport default %s;\n" "$f" "$f" > "$f.js"
done
```

- [ ] Implement `src/pages/workspace/WorkspacePage.js`, following the `PageHeader` + actions + content idiom from `LeadsListPage.js` / `NotificationPreferencesPage.js`:

```jsx
// src/pages/workspace/WorkspacePage.js
import React, { useState } from 'react';
import {
  Box, Button, Paper, Typography, Grid, Stack, Chip, Skeleton,
} from '@mui/material';
import { Add, ViewQuilt, AutoAwesome, Refresh } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PageHeader } from '../../components/common';
import { getStarterCardsForRole } from './starterCards';
import WorkspaceBoard from './WorkspaceBoard';
import CardBuilderDialog from './CardBuilderDialog';
import SharedWithMeTray from './SharedWithMeTray';

const WorkspacePage = () => {
  const { user } = useAuth();
  const {
    ownedCards, layout, loading, refresh, createCard, addToBoard,
  } = useWorkspace();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const boardCount = (layout.items || []).length;
  const starters = getStarterCardsForRole(user?.role);

  // Create the suggested starter cards and place them on the board.
  const handleSeedStarters = async () => {
    setSeeding(true);
    try {
      for (const def of starters) {
        const created = await createCard({
          title: def.title,
          module: def.module,
          queryPlan: def.queryPlan,
          renderMode: def.renderMode,
          metricConfig: def.metricConfig,
          visibility: 'private',
          sharedWithUsers: [],
          sharedWithRoles: [],
        });
        if (created?._id) await addToBoard(created._id, def.renderMode === 'metric' ? 'sm' : 'md');
      }
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="My Workspace"
        subtitle="Your saved, filtered views across every module"
        icon={ViewQuilt}
        actions={
          <>
            <Button
              startIcon={<Refresh />}
              onClick={refresh}
              sx={{ textTransform: 'none' }}
            >
              Refresh all
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setBuilderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Add card
            </Button>
          </>
        }
      />

      <SharedWithMeTray />

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rounded" height={240} />
            </Grid>
          ))}
        </Grid>
      ) : boardCount === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: (t) => `1px dashed ${t.palette.divider}`,
            borderRadius: 3,
            p: { xs: 3, sm: 6 },
            textAlign: 'center',
          }}
        >
          <ViewQuilt sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            Build your workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
            Pin saved, filtered views from any module. Start from a suggestion for
            your role, or build your own with the filter builder or plain English.
          </Typography>

          {starters.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 3 }}
            >
              {starters.map((s) => (
                <Chip key={s.title} label={s.title} variant="outlined" />
              ))}
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleSeedStarters}
              disabled={seeding || starters.length === 0}
              sx={{ textTransform: 'none' }}
            >
              {seeding ? 'Adding…' : 'Add suggested cards'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setBuilderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Build my own
            </Button>
          </Stack>
        </Paper>
      ) : (
        <WorkspaceBoard />
      )}

      <CardBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        card={null}
      />
    </Box>
  );
};

export default WorkspacePage;
```

- [ ] Verify (manual): start the dev server (`cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && npm start`), log in, and confirm:
  - Navigating to `/workspace` shows the "My Workspace" header with **Refresh all** and **Add card** buttons.
  - With no cards on the board, the dashed empty-state panel appears with role-appropriate suggestion chips and the **Add suggested cards** / **Build my own** buttons.
  - The left nav shows **My Workspace** in the MAIN section, and post-login you land on `/workspace`.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/WorkspacePage.js src/pages/workspace/WorkspaceBoard.js src/pages/workspace/CardBuilderDialog.js src/pages/workspace/SharedWithMeTray.js src/pages/workspace/WorkspaceCardView.js && git commit -m "$(cat <<'EOF'
feat(workspace): WorkspacePage shell + role-based empty state

Adds WorkspacePage (PageHeader, Add card, Refresh all, shared tray,
board/empty-state switch). Empty state offers role starter cards via
getStarterCardsForRole and seeds them onto the board. Adds stub modules
for board/dialog/tray/card view (filled in subsequent tasks).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 25: `WorkspaceBoard` — sortable grid via `@dnd-kit`

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/WorkspaceBoard.js`

> Reuses the exact `@dnd-kit/sortable` idiom from `src/components/reports/BuilderCanvas.js` (`DndContext` + `SortableContext` + `PointerSensor activationConstraint distance:5` + `closestCenter`) and `SortableBlockItem.js` (`useSortable` + `CSS.Transform.toString`).

**Steps**

- [ ] Implement: replace the stub `src/pages/workspace/WorkspaceBoard.js`:

```jsx
// src/pages/workspace/WorkspaceBoard.js
import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkspace } from '../../context/WorkspaceContext';
import WorkspaceCardView from './WorkspaceCardView';

// Map a card size to a responsive column span (12-col grid).
const SIZE_SPAN = {
  sm: { xs: 12, sm: 6, md: 4, lg: 3 },
  md: { xs: 12, sm: 6, md: 6, lg: 4 },
  lg: { xs: 12, sm: 12, md: 8, lg: 6 },
};

// Flexbox basis (%) per size at the md+ breakpoint — keeps dnd hit-areas simple.
const SIZE_BASIS = { sm: '25%', md: '33.333%', lg: '50%' };

const SortableCard = ({ item, card }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.cardId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1,
        boxSizing: 'border-box',
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: { xs: '100%', sm: '50%', md: SIZE_BASIS[item.size] || SIZE_BASIS.md },
        minWidth: { xs: '100%', sm: 320 },
      }}
    >
      <WorkspaceCardView
        card={card}
        size={item.size}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </Box>
  );
};

const WorkspaceBoard = () => {
  const { cards, layout, saveLayout } = useWorkspace();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Build the ordered, resolved list of { item, card } the board renders.
  const cardById = useMemo(() => {
    const map = new Map();
    cards.forEach((c) => map.set(c._id, c));
    return map;
  }, [cards]);

  const orderedItems = useMemo(
    () =>
      [...(layout.items || [])]
        .sort((a, b) => a.order - b.order)
        .filter((it) => cardById.has(it.cardId)),
    [layout.items, cardById],
  );

  const [activeIds, setActiveIds] = useState(orderedItems.map((it) => it.cardId));

  // Keep local order in sync when layout changes from elsewhere.
  React.useEffect(() => {
    setActiveIds(orderedItems.map((it) => it.cardId));
  }, [orderedItems]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeIds.indexOf(active.id);
    const newIndex = activeIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeIds, oldIndex, newIndex);
    setActiveIds(reordered);

    // Persist new order, preserving each item's size.
    const sizeByCard = new Map(orderedItems.map((it) => [it.cardId, it.size]));
    const nextItems = reordered.map((cardId, i) => ({
      cardId,
      order: i,
      size: sizeByCard.get(cardId) || 'md',
    }));
    saveLayout(nextItems);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activeIds} strategy={rectSortingStrategy}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', m: -1 }}>
          {activeIds.map((cardId) => {
            const item = orderedItems.find((it) => it.cardId === cardId);
            const card = cardById.get(cardId);
            if (!item || !card) return null;
            return <SortableCard key={cardId} item={item} card={card} />;
          })}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default WorkspaceBoard;
```

> `SIZE_SPAN` is exported-in-spirit for reference; the board uses a flex-wrap layout (not MUI `Grid`) because `@dnd-kit` sortable hit-testing is simpler with uniform flex children. Sizes still drive `flexBasis`.

- [ ] Verify (manual): with at least 2 cards on the board (seed from the empty state or add via the dialog in Task 27), confirm:
  - Cards render in a wrapping grid.
  - Grabbing a card's drag handle (from `WorkspaceCardView`, Task 26) and dropping it on another card reorders them.
  - Reloading the page preserves the new order (proves `saveLayout` persisted).
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/WorkspaceBoard.js && git commit -m "$(cat <<'EOF'
feat(workspace): sortable card board via @dnd-kit

Implements WorkspaceBoard using the repo's @dnd-kit/sortable idiom
(DndContext + SortableContext + useSortable + arrayMove). Reorders
cards on drop and persists order/size through saveLayout. Card size
maps to flex-basis.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 26: `WorkspaceCardView` — per-card data fetch, list/metric render, 3-dots menu

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/WorkspaceCardView.js`

> Uses `DataTable` for list mode and `KPICard` for metric mode (exact props confirmed). Columns are derived from the card's module catalog (`displayable` / `defaultColumn` fields), fetched once and cached per module. Row click navigates to that module's detail route.

**Steps**

- [ ] Implement: replace the stub `src/pages/workspace/WorkspaceCardView.js`:

```jsx
// src/pages/workspace/WorkspaceCardView.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardHeader, IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Tooltip, Chip, Divider,
} from '@mui/material';
import {
  MoreVert, Refresh, Edit, Share, RemoveCircleOutline, DeleteOutline,
  DragIndicator, ListAlt, ShowChart,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { workspaceAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DataTable, KPICard } from '../../components/common';
import CardBuilderDialog from './CardBuilderDialog';
import SharingSettings from './SharingSettings';
import { getModuleCatalog, detailRouteFor } from './catalogCache';

const WorkspaceCardView = ({ card, size = 'md', dragHandleProps }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { deleteCard, removeFromBoard } = useWorkspace();

  const [result, setResult] = useState(null); // { rows, total } | { value, breakdown }
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [menuEl, setMenuEl] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isMetric = card.renderMode === 'metric';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workspaceAPI.getCardData(card._id);
      setResult(res.data?.data || null);
    } catch (err) {
      setResult(isMetric ? { value: 0 } : { rows: [], total: 0 });
      enqueueSnackbar(`"${card.title}" failed to load`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [card._id, card.title, isMetric, enqueueSnackbar]);

  // Catalog drives the displayable columns for list mode.
  const loadCatalog = useCallback(async () => {
    if (isMetric) return;
    try {
      const cat = await getModuleCatalog(card.module);
      setCatalog(cat);
    } catch {
      setCatalog(null);
    }
  }, [card.module, isMetric]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Build DataTable columns from catalog displayable fields (defaultColumn first).
  const columns = useMemo(() => {
    if (!catalog) return [];
    const fields = (catalog.fields || []).filter((f) => f.displayable);
    const ordered = [
      ...fields.filter((f) => f.defaultColumn),
      ...fields.filter((f) => !f.defaultColumn),
    ].slice(0, 6);
    return ordered.map((f) => ({
      id: f.key,
      label: f.label,
      sortable: false,
      render: (val) => {
        if (val === null || val === undefined || val === '') return '-';
        if (f.type === 'date') return new Date(val).toLocaleDateString();
        if (typeof val === 'object') return val.name || val.title || val.firmName || '-';
        return String(val);
      },
    }));
  }, [catalog]);

  const handleRowClick = (row) => {
    const route = detailRouteFor(card.module, row._id);
    if (route) navigate(route);
  };

  const total = isMetric ? undefined : result?.total ?? (result?.rows?.length || 0);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Tooltip title="Drag to reorder">
            <IconButton size="small" sx={{ cursor: 'grab', touchAction: 'none' }} {...(dragHandleProps || {})}>
              <DragIndicator fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        title={card.title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700, noWrap: true }}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <Chip
              size="small"
              icon={isMetric ? <ShowChart sx={{ fontSize: 14 }} /> : <ListAlt sx={{ fontSize: 14 }} />}
              label={card.module}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {!isMetric && total !== undefined && (
              <Chip size="small" label={total} color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            )}
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadData}><Refresh fontSize="small" /></IconButton>
            </Tooltip>
            <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ flex: 1, pt: 1, '&:last-child': { pb: 2 } }}>
        {isMetric ? (
          <KPICard
            title={card.title}
            value={loading ? 0 : (result?.value ?? 0)}
            loading={loading}
            subtitle={result?.breakdown ? `${result.breakdown.length} segments` : undefined}
            onClick={loadData}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={result?.rows || []}
            loading={loading}
            onRowClick={handleRowClick}
            emptyState={{
              title: 'No matching records',
              description: 'Nothing matches this card right now.',
            }}
            elevation={0}
            sx={{ boxShadow: 'none', border: 'none' }}
          />
        )}
      </CardContent>

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={() => setMenuEl(null)}>
        <MenuItem onClick={() => { setEditOpen(true); setMenuEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setShareOpen(true); setMenuEl(null); }}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { removeFromBoard(card._id); setMenuEl(null); }}>
          <ListItemIcon><RemoveCircleOutline fontSize="small" /></ListItemIcon>
          <ListItemText>Remove from board</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { deleteCard(card._id); setMenuEl(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <CardBuilderDialog open={editOpen} onClose={() => setEditOpen(false)} card={card} />
      <SharingSettings open={shareOpen} onClose={() => setShareOpen(false)} card={card} />
    </Card>
  );
};

export default WorkspaceCardView;
```

- [ ] Implement: create the small catalog cache + detail-route helper used above — `src/pages/workspace/catalogCache.js`:

```js
// src/pages/workspace/catalogCache.js
// Module catalogs rarely change within a session; cache them to avoid refetching
// per card. Also maps a module + row id to its existing detail route.
import { workspaceAPI } from '../../services/api';

const _cache = new Map();           // module -> catalog object
const _inflight = new Map();        // module -> Promise

export const getModuleCatalog = async (module) => {
  if (_cache.has(module)) return _cache.get(module);
  if (_inflight.has(module)) return _inflight.get(module);

  const p = workspaceAPI.getCatalog(module)
    .then((res) => {
      const cat = res.data?.data || null;
      if (cat) _cache.set(module, cat);
      _inflight.delete(module);
      return cat;
    })
    .catch((err) => {
      _inflight.delete(module);
      throw err;
    });

  _inflight.set(module, p);
  return p;
};

// Existing detail routes per module (see src/App.js route table).
const DETAIL_ROUTE = {
  leads: (id) => `/leads/${id}`,
  sales: (id) => `/sales/${id}`,
  payments: (id) => `/payments/plans/${id}`,
  tasks: (id) => `/tasks/${id}`,
  channelPartners: (id) => `/channel-partners/${id}`,
};

export const detailRouteFor = (module, id) => {
  if (!id) return null;
  const fn = DETAIL_ROUTE[module];
  return fn ? fn(id) : null;
};
```

- [ ] Verify (manual): with a list card and a metric card on the board:
  - List card shows a `DataTable` with columns derived from the module's displayable fields and a count badge in the header; clicking a row navigates to that module's detail page (e.g. `/leads/<id>`).
  - Metric card shows a `KPICard` with the count value.
  - The **Refresh** icon re-fetches (watch the network tab hit `POST /api/workspace/cards/:id/data`).
  - The 3-dots menu shows **Edit**, **Share**, **Remove from board**, **Delete**; "Remove from board" drops it from the grid but keeps it in cards; "Delete" removes it entirely.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/WorkspaceCardView.js src/pages/workspace/catalogCache.js && git commit -m "$(cat <<'EOF'
feat(workspace): WorkspaceCardView (list/metric render + card menu)

Fetches card data via getCardData (mount + manual refresh), renders
list mode with DataTable (columns from catalog displayable/defaultColumn
fields, row click -> module detail route) or metric mode with KPICard.
Header has drag handle, refresh, count badge, and an Edit/Share/Remove/
Delete menu. Adds a session catalog cache + detail-route helper.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 27: `CardBuilderDialog` — module step, Builder/NL tabs, live preview, render mode, save

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/CardBuilderDialog.js`

> `FilterBuilder` (Task 28) and `NLInput` (Task 31a) are imported here. Create thin stubs first so this compiles, then fill them in the next tasks.

**Steps**

- [ ] Implement: create stubs for the two child components so the dialog compiles now:

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace"
printf "import React from 'react';\nconst FilterBuilder = () => null;\nexport default FilterBuilder;\n" > FilterBuilder.js
printf "import React from 'react';\nconst NLInput = () => null;\nexport default NLInput;\n" > NLInput.js
```

- [ ] Implement: replace the stub `src/pages/workspace/CardBuilderDialog.js`. Match the repo's MUI Dialog idiom (`<Dialog open onClose maxWidth fullWidth>` + `DialogTitle`/`DialogContent`/`DialogActions`) from `LeadDetailPage.js`:

```jsx
// src/pages/workspace/CardBuilderDialog.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  ToggleButtonGroup, ToggleButton, Typography, Divider, Paper, CircularProgress,
} from '@mui/material';
import { ListAlt, ShowChart } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceAPI } from '../../services/api';
import { getModuleCatalog } from './catalogCache';
import FilterBuilder from './FilterBuilder';
import NLInput from './NLInput';

const MODULES = [
  { value: 'leads', label: 'Leads' },
  { value: 'sales', label: 'Sales / Bookings' },
  { value: 'payments', label: 'Payments' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'channelPartners', label: 'Channel Partners' },
];

const emptyPlan = (module) => ({
  module,
  logic: 'AND',
  filters: [],
  sort: null,
  limit: 50,
  nlSource: null,
});

const CardBuilderDialog = ({ open, onClose, card }) => {
  const { createCard, updateCard, addToBoard } = useWorkspace();
  const isEdit = Boolean(card?._id);

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('leads');
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [tab, setTab] = useState(0); // 0 = Builder, 1 = Ask in words
  const [plan, setPlan] = useState(emptyPlan('leads'));
  const [renderMode, setRenderMode] = useState('list');
  const [metricField, setMetricField] = useState(null);
  const [preview, setPreview] = useState(null); // { rows, total } | { value }
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hydrate when opening (create vs edit).
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setTitle(card.title || '');
      setModule(card.module);
      setPlan(card.queryPlan || emptyPlan(card.module));
      setRenderMode(card.renderMode || 'list');
      setMetricField(card.metricConfig?.field || null);
    } else {
      setTitle('');
      setModule('leads');
      setPlan(emptyPlan('leads'));
      setRenderMode('list');
      setMetricField(null);
    }
    setTab(0);
    setPreview(null);
  }, [open, isEdit, card]);

  // Load the catalog for the chosen module.
  useEffect(() => {
    if (!open || !module) return;
    let cancelled = false;
    setCatalogLoading(true);
    getModuleCatalog(module)
      .then((cat) => { if (!cancelled) setCatalog(cat); })
      .catch(() => { if (!cancelled) setCatalog(null); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [open, module]);

  const handleModuleChange = (next) => {
    setModule(next);
    setPlan(emptyPlan(next)); // reset filters when module changes
    setPreview(null);
    setMetricField(null);
  };

  // Live preview: run the current plan without saving.
  const runPreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const opts = renderMode === 'metric'
        ? { renderMode, metricConfig: { agg: 'count', field: metricField } }
        : { renderMode };
      const res = await workspaceAPI.preview({ ...plan, module }, opts);
      setPreview(res.data?.data || null);
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }, [plan, module, renderMode, metricField]);

  // Re-run preview when plan/renderMode change (debounced lightly).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(runPreview, 400);
    return () => clearTimeout(t);
  }, [open, runPreview]);

  const previewCount = renderMode === 'metric'
    ? (preview?.value ?? '—')
    : (preview?.total ?? preview?.rows?.length ?? '—');

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: title.trim() || 'Untitled card',
        module,
        queryPlan: { ...plan, module },
        renderMode,
        metricConfig: { agg: 'count', field: renderMode === 'metric' ? metricField : null },
      };
      if (isEdit) {
        await updateCard(card._id, payload);
      } else {
        const created = await createCard({
          ...payload,
          visibility: 'private',
          sharedWithUsers: [],
          sharedWithRoles: [],
        });
        if (created?._id) await addToBoard(created._id, renderMode === 'metric' ? 'sm' : 'md');
      }
      onClose();
    } catch {
      /* error already surfaced via context snackbar */
    } finally {
      setSaving(false);
    }
  };

  const numericFields = (catalog?.fields || []).filter((f) => f.type === 'number');

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit card' : 'New card'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Step 1 — title + module */}
          <Grid item xs={12} sm={7}>
            <TextField
              label="Card title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. Stale CP leads"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Module</InputLabel>
              <Select
                value={module}
                label="Module"
                onChange={(e) => handleModuleChange(e.target.value)}
                disabled={isEdit}
              >
                {MODULES.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Step 2 — Builder / Ask in words */}
          <Grid item xs={12}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 1, minHeight: 40 }}>
              <Tab label="Builder" sx={{ minHeight: 40, textTransform: 'none' }} />
              <Tab label="Ask in words" sx={{ minHeight: 40, textTransform: 'none' }} />
            </Tabs>

            {catalogLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={22} />
              </Box>
            ) : tab === 0 ? (
              <FilterBuilder catalog={catalog} plan={plan} onChange={setPlan} />
            ) : (
              <NLInput
                module={module}
                onPlan={(nextPlan) => { setPlan({ ...nextPlan, module }); setTab(0); }}
              />
            )}
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Render mode */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Show as</Typography>
            <ToggleButtonGroup
              value={renderMode}
              exclusive
              size="small"
              onChange={(e, v) => v && setRenderMode(v)}
              sx={{ display: 'block', mt: 0.5 }}
            >
              <ToggleButton value="list"><ListAlt sx={{ fontSize: 16, mr: 0.5 }} /> List</ToggleButton>
              <ToggleButton value="metric"><ShowChart sx={{ fontSize: 16, mr: 0.5 }} /> Metric</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          {renderMode === 'metric' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Aggregate (count by default)</InputLabel>
                <Select
                  value={metricField || ''}
                  label="Aggregate (count by default)"
                  onChange={(e) => setMetricField(e.target.value || null)}
                >
                  <MenuItem value="">Count of records</MenuItem>
                  {numericFields.map((f) => (
                    <MenuItem key={f.key} value={f.key}>Sum of {f.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Live preview */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
                {previewing
                  ? <CircularProgress size={16} />
                  : <Typography variant="body2" color="text.secondary">{previewCount} matching</Typography>}
              </Box>
              {renderMode === 'metric' ? (
                <Typography variant="h4" fontWeight={800}>{preview?.value ?? '—'}</Typography>
              ) : (
                <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
                  {(preview?.rows || []).slice(0, 5).map((r, i) => (
                    <Typography key={r._id || i} variant="body2" noWrap sx={{ py: 0.25 }}>
                      • {r.firstName || r.title || r.name || r._id}
                      {r.lastName ? ` ${r.lastName}` : ''}
                    </Typography>
                  ))}
                  {(!preview || (preview.rows || []).length === 0) && !previewing && (
                    <Typography variant="body2" color="text.secondary">No matching records.</Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
          {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Create card')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CardBuilderDialog;
```

- [ ] Verify (manual, deferred to full flow): the dialog opens from **Add card**. Module dropdown lists the 5 modules; choosing one loads its catalog (Builder tab populates in Task 28). The render-mode toggle switches List/Metric; selecting Metric reveals the aggregate dropdown. The preview panel shows a "N matching" count. (Full Builder/NL behavior verified in Tasks 30–31.)
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/CardBuilderDialog.js src/pages/workspace/FilterBuilder.js src/pages/workspace/NLInput.js && git commit -m "$(cat <<'EOF'
feat(workspace): CardBuilderDialog (module step, tabs, preview, save)

Adds the card builder dialog: pick module (loads catalog), Builder vs
Ask-in-words tabs, render-mode toggle (list/metric) with count/sum
metricConfig, debounced live preview via workspaceAPI.preview, and
create/update + auto-add-to-board on save. Adds FilterBuilder/NLInput
stubs (filled next).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 28: `FilterBuilder` — catalog-driven field/operator/value rows (AND-only)

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/FilterBuilder.js`
- Create (test): `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/filterBuilder.helpers.test.js`

> The catalog response per module is `{ module, label, fields:[{key,label,type,operators,enumValues?,displayable,defaultColumn?,derived?}] }`. Operator keys: `is,in,notIn,gt,lt,gte,lte,between,lastNDays,isEmpty,isNotEmpty,contains`. The builder emits a QueryPlan.

**Steps**

- [ ] Write a test first for the pure helpers (value-shape + operator labels), consistent with the repo's util-test culture:

```js
// src/pages/workspace/filterBuilder.helpers.test.js
import { OP_LABELS, opNeedsValue, defaultValueForField } from './FilterBuilder';

describe('FilterBuilder helpers', () => {
  it('labels every supported operator key', () => {
    ['is', 'in', 'notIn', 'gt', 'lt', 'gte', 'lte', 'between', 'lastNDays', 'isEmpty', 'isNotEmpty', 'contains']
      .forEach((op) => expect(OP_LABELS[op]).toBeTruthy());
  });

  it('isEmpty / isNotEmpty take no value', () => {
    expect(opNeedsValue('isEmpty')).toBe(false);
    expect(opNeedsValue('isNotEmpty')).toBe(false);
    expect(opNeedsValue('is')).toBe(true);
  });

  it('defaults a sensible value per field type/operator', () => {
    expect(defaultValueForField({ type: 'number' }, 'gte')).toBe(0);
    expect(defaultValueForField({ type: 'date' }, 'lastNDays')).toBe(7);
    expect(defaultValueForField({ type: 'enum', enumValues: ['A', 'B'] }, 'in')).toEqual([]);
    expect(defaultValueForField({ type: 'string' }, 'contains')).toBe('');
  });
});
```

- [ ] Run (expect failure): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/pages/workspace/filterBuilder.helpers.test.js --watchAll=false`
- [ ] Implement: replace the stub `src/pages/workspace/FilterBuilder.js` (exports the helpers used by the test + the component):

```jsx
// src/pages/workspace/FilterBuilder.js
import React from 'react';
import {
  Box, Button, IconButton, FormControl, InputLabel, Select, MenuItem,
  TextField, Typography, Chip, Stack,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';

// Human labels for the canonical operator keys (workspace spec §3.2).
export const OP_LABELS = {
  is: 'is',
  in: 'is any of',
  notIn: 'is none of',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  between: 'between',
  lastNDays: 'in the last N days',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  contains: 'contains',
};

// Operators that don't need a value input.
export const opNeedsValue = (op) => op !== 'isEmpty' && op !== 'isNotEmpty';

// Sensible default value when a field/operator is first chosen.
export const defaultValueForField = (field, op) => {
  if (!opNeedsValue(op)) return null;
  if (op === 'lastNDays') return 7;
  if (op === 'between') return [null, null];
  if (op === 'in' || op === 'notIn') return [];
  switch (field?.type) {
    case 'number': return 0;
    case 'boolean': return true;
    case 'date': return '';
    default: return '';
  }
};

const FilterBuilder = ({ catalog, plan, onChange }) => {
  const fields = catalog?.fields || [];

  const updateFilters = (filters) => onChange({ ...plan, filters });

  const addRow = () => {
    const first = fields[0];
    if (!first) return;
    const op = (first.operators || [])[0] || 'is';
    updateFilters([
      ...(plan.filters || []),
      { field: first.key, op, value: defaultValueForField(first, op) },
    ]);
  };

  const removeRow = (idx) =>
    updateFilters((plan.filters || []).filter((_, i) => i !== idx));

  const patchRow = (idx, patch) =>
    updateFilters((plan.filters || []).map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const fieldFor = (key) => fields.find((f) => f.key === key);

  const onFieldChange = (idx, key) => {
    const f = fieldFor(key);
    const op = (f?.operators || [])[0] || 'is';
    patchRow(idx, { field: key, op, value: defaultValueForField(f, op) });
  };

  const onOpChange = (idx, op) => {
    const row = plan.filters[idx];
    const f = fieldFor(row.field);
    patchRow(idx, { op, value: defaultValueForField(f, op) });
  };

  const renderValueInput = (row, idx) => {
    const f = fieldFor(row.field);
    if (!opNeedsValue(row.op)) return null;

    // enum / ref → dropdown(s) from enumValues
    if ((f?.type === 'enum' || f?.type === 'ref') && Array.isArray(f.enumValues)) {
      const multi = row.op === 'in' || row.op === 'notIn';
      return (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Value</InputLabel>
          <Select
            multiple={multi}
            value={multi ? (row.value || []) : (row.value ?? '')}
            label="Value"
            onChange={(e) => patchRow(idx, { value: e.target.value })}
            renderValue={(v) => (Array.isArray(v) ? v.join(', ') : v)}
          >
            {f.enumValues.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (row.op === 'lastNDays' || f?.type === 'number') {
      return (
        <TextField
          size="small"
          type="number"
          label={row.op === 'lastNDays' ? 'Days' : 'Value'}
          value={row.value ?? ''}
          onChange={(e) => patchRow(idx, { value: e.target.value === '' ? '' : Number(e.target.value) })}
          sx={{ width: 140 }}
        />
      );
    }

    if (f?.type === 'date') {
      return (
        <TextField
          size="small"
          type="date"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={row.value || ''}
          onChange={(e) => patchRow(idx, { value: e.target.value })}
          sx={{ width: 180 }}
        />
      );
    }

    if (f?.type === 'boolean') {
      return (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Value</InputLabel>
          <Select
            value={row.value === undefined ? true : row.value}
            label="Value"
            onChange={(e) => patchRow(idx, { value: e.target.value })}
          >
            <MenuItem value={true}>Yes</MenuItem>
            <MenuItem value={false}>No</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // string default
    return (
      <TextField
        size="small"
        label="Value"
        value={row.value ?? ''}
        onChange={(e) => patchRow(idx, { value: e.target.value })}
        sx={{ minWidth: 180 }}
      />
    );
  };

  if (!catalog) {
    return <Typography variant="body2" color="text.secondary">Choose a module to load its fields.</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }} spacing={1}>
        <Typography variant="caption" color="text.secondary">
          All conditions must match
        </Typography>
        <Chip label="AND" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
      </Stack>

      <Stack spacing={1.5}>
        {(plan.filters || []).map((row, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={row.field}
                label="Field"
                onChange={(e) => onFieldChange(idx, e.target.value)}
              >
                {fields.map((f) => (
                  <MenuItem key={f.key} value={f.key}>
                    {f.label}{f.derived ? ' ·' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={row.op}
                label="Operator"
                onChange={(e) => onOpChange(idx, e.target.value)}
              >
                {(fieldFor(row.field)?.operators || []).map((op) => (
                  <MenuItem key={op} value={op}>{OP_LABELS[op] || op}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderValueInput(row, idx)}

            <IconButton size="small" onClick={() => removeRow(idx)} sx={{ ml: 'auto' }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        size="small"
        startIcon={<Add />}
        onClick={addRow}
        disabled={fields.length === 0}
        sx={{ mt: 1.5, textTransform: 'none' }}
      >
        Add condition
      </Button>
    </Box>
  );
};

export default FilterBuilder;
```

- [ ] Run (expect pass): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/pages/workspace/filterBuilder.helpers.test.js --watchAll=false`. Expect 3 passing tests.
- [ ] Verify (manual): in the builder dialog with module = Leads, click **Add condition**: a Field/Operator/Value row appears. The Field dropdown lists the catalog fields (derived fields marked with `·`); the Operator dropdown shows only that field's allowed operators; the Value input adapts (enum → dropdown of `enumValues`, number → numeric, date → date picker, `lastNDays` → a Days number, `isEmpty`/`isNotEmpty` → no value). Building `source is Channel Partner` + `daysSinceLastCPFollowUp >= 15` updates the live preview count.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/FilterBuilder.js src/pages/workspace/filterBuilder.helpers.test.js && git commit -m "$(cat <<'EOF'
feat(workspace): catalog-driven FilterBuilder (AND-only)

Adds FilterBuilder: field/operator/value rows sourced from the module
catalog, with per-type value inputs (enum dropdown from enumValues,
number, date, lastNDays, boolean, string) and operator lists restricted
to each field's allowed operators. Emits a QueryPlan. Pure helpers
(OP_LABELS/opNeedsValue/defaultValueForField) unit-tested.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 29: `NLInput` (Ask in words) + `SharingSettings` + `SharedWithMeTray`

**Files**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/NLInput.js`
- Create: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/SharingSettings.js`
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/SharedWithMeTray.js`

**Steps**

- [ ] Implement `src/pages/workspace/NLInput.js` (text → `workspaceAPI.nlToQueryPlan`; on `plan` call `onPlan` so the dialog populates the Builder; on `clarification` show the message):

```jsx
// src/pages/workspace/NLInput.js
import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Typography, CircularProgress } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { workspaceAPI } from '../../services/api';

const NLInput = ({ module, onPlan }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [error, setError] = useState(null);

  const handleCompile = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setClarification(null);
    setError(null);
    try {
      const res = await workspaceAPI.nlToQueryPlan(text.trim(), module);
      const data = res.data?.data || {};
      if (data.clarification) {
        setClarification(data.clarification);
      } else if (data.plan) {
        // Hand the compiled plan to the dialog; it switches to the Builder tab
        // so the user can review/edit ("here's the filter I built — edit it").
        onPlan({ ...data.plan, nlSource: text.trim() });
      } else {
        setError('Could not understand that. Try rephrasing.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compile your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Describe what you want to see and we’ll build the filter. You can edit it after.
      </Typography>
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`e.g. "leads where the channel partner hasn't followed up in 15 days"`}
        fullWidth
        multiline
        minRows={2}
        size="small"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCompile();
        }}
      />
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          onClick={handleCompile}
          disabled={loading || !text.trim()}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Building…' : 'Build filter'}
        </Button>
        <Typography variant="caption" color="text.disabled">⌘/Ctrl + Enter</Typography>
      </Box>

      {clarification && (
        <Alert severity="info" sx={{ mt: 2 }}>{clarification}</Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default NLInput;
```

- [ ] Implement `src/pages/workspace/SharingSettings.js` (private vs shared; pick users from `userAPI.getUsers` and/or roles from `rolesAPI.getRoles`, falling back to a static role list; saves via `updateCard`). Match the MUI Dialog idiom + the `userAPI.getUsers` unwrap (`res.data?.data?.users || res.data?.data || res.data`):

```jsx
// src/pages/workspace/SharingSettings.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  FormControl, InputLabel, Select, MenuItem, Chip, ToggleButtonGroup,
  ToggleButton, Typography, OutlinedInput, CircularProgress,
} from '@mui/material';
import { Lock, Public } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';
import { userAPI, rolesAPI } from '../../services/api';

// Static fallback role names (used if rolesAPI is unavailable).
const FALLBACK_ROLES = [
  'Business Head', 'Project Director', 'Sales Head', 'Sales Manager',
  'Sales Executive', 'Finance Head', 'Finance Manager',
];

const SharingSettings = ({ open, onClose, card }) => {
  const { updateCard } = useWorkspace();

  const [visibility, setVisibility] = useState('private');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(FALLBACK_ROLES);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !card) return;
    setVisibility(card.visibility || 'private');
    setSelectedUsers(card.sharedWithUsers || []);
    setSelectedRoles(card.sharedWithRoles || []);

    let cancelled = false;
    setLoading(true);
    Promise.all([
      userAPI.getUsers({ status: 'active', limit: 200 }),
      rolesAPI.getRoles().catch(() => null),
    ])
      .then(([uRes, rRes]) => {
        if (cancelled) return;
        const uList = uRes.data?.data?.users || uRes.data?.data || uRes.data || [];
        setUsers(Array.isArray(uList) ? uList : []);
        const rList = rRes?.data?.data || rRes?.data || null;
        if (Array.isArray(rList) && rList.length) {
          setRoles(rList.map((r) => r.name).filter(Boolean));
        }
      })
      .catch(() => { /* keep fallbacks */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, card]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(card._id, {
        visibility,
        sharedWithUsers: visibility === 'shared' ? selectedUsers : [],
        sharedWithRoles: visibility === 'shared' ? selectedRoles : [],
      });
      onClose();
    } catch {
      /* surfaced by context */
    } finally {
      setSaving(false);
    }
  };

  const userLabel = (id) => {
    const u = users.find((x) => x._id === id);
    return u ? `${u.firstName} ${u.lastName || ''}`.trim() : id;
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share "{card?.title}"</DialogTitle>
      <DialogContent dividers>
        <ToggleButtonGroup
          value={visibility}
          exclusive
          size="small"
          onChange={(e, v) => v && setVisibility(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="private"><Lock sx={{ fontSize: 16, mr: 0.5 }} /> Private</ToggleButton>
          <ToggleButton value="shared"><Public sx={{ fontSize: 16, mr: 0.5 }} /> Shared</ToggleButton>
        </ToggleButtonGroup>

        {visibility === 'shared' && (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={22} /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Recipients see this card re-run under their own access — sharing never exposes data they couldn’t already see.
              </Typography>

              <FormControl size="small" fullWidth>
                <InputLabel>Share with users</InputLabel>
                <Select
                  multiple
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e.target.value)}
                  input={<OutlinedInput label="Share with users" />}
                  renderValue={(ids) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {ids.map((id) => <Chip key={id} size="small" label={userLabel(id)} />)}
                    </Box>
                  )}
                >
                  {users.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.firstName} {u.lastName} {u.role ? `· ${u.role}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Share with roles</InputLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(e.target.value)}
                  input={<OutlinedInput label="Share with roles" />}
                  renderValue={(vals) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vals.map((r) => <Chip key={r} size="small" label={r} />)}
                    </Box>
                  )}
                >
                  {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
          {saving ? 'Saving…' : 'Save sharing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharingSettings;
```

- [ ] Implement `src/pages/workspace/SharedWithMeTray.js` (lists `sharedWithMe` from context, each with **Add to my board**; hidden when empty):

```jsx
// src/pages/workspace/SharedWithMeTray.js
import React from 'react';
import {
  Box, Paper, Typography, Chip, Button, Stack, Tooltip,
} from '@mui/material';
import { Inbox, AddCircleOutline, CheckCircle } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';

const SharedWithMeTray = () => {
  const { sharedWithMe, layout, addToBoard } = useWorkspace();

  if (!sharedWithMe || sharedWithMe.length === 0) return null;

  const onBoard = (id) => (layout.items || []).some((it) => it.cardId === id);

  return (
    <Paper
      elevation={0}
      sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 2, mb: 3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Inbox sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="subtitle2" fontWeight={700}>Shared with me</Typography>
        <Chip size="small" label={sharedWithMe.length} sx={{ height: 20, fontSize: '0.65rem' }} />
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
        {sharedWithMe.map((card) => {
          const added = onBoard(card._id);
          return (
            <Paper
              key={card._id}
              variant="outlined"
              sx={{ p: 1.5, minWidth: 220, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{card.title}</Typography>
                <Typography variant="caption" color="text.secondary">{card.module}</Typography>
              </Box>
              {added ? (
                <Tooltip title="Already on your board">
                  <CheckCircle color="success" sx={{ fontSize: 20 }} />
                </Tooltip>
              ) : (
                <Button
                  size="small"
                  startIcon={<AddCircleOutline />}
                  onClick={() => addToBoard(card._id, card.renderMode === 'metric' ? 'sm' : 'md')}
                  sx={{ textTransform: 'none', flexShrink: 0 }}
                >
                  Add
                </Button>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default SharedWithMeTray;
```

- [ ] Verify (manual):
  - **NL:** In the builder, open **Ask in words**, type *"leads where the channel partner hasn't followed up in 15 days"*, click **Build filter**. On success the dialog jumps to the **Builder** tab pre-filled with the compiled conditions (editable); the preview updates. If the backend returns a clarification, an info alert shows it.
  - **Sharing:** From a card's 3-dots → **Share**, switch to **Shared**, pick a role and/or user, save. Confirm the card's `visibility` persists (reopen the dialog).
  - **Tray:** As a recipient user (shared by role/user), confirm the card appears under **Shared with me** with an **Add** button; clicking it places the card on the board and the button flips to the "already on board" check.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/NLInput.js src/pages/workspace/SharingSettings.js src/pages/workspace/SharedWithMeTray.js && git commit -m "$(cat <<'EOF'
feat(workspace): NL input, sharing settings, shared-with-me tray

Adds NLInput (nl-to-queryplan -> populate builder / show clarification),
SharingSettings (private vs shared with users from userAPI and roles
from rolesAPI w/ static fallback, persisted via updateCard), and
SharedWithMeTray (non-owned cards from context with Add-to-board).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 30: Workspace smoke test (render + empty state)

**Files**
- Create (test): `/Users/nirpekshnandan/My Products/propvantage-ai-frontend/src/pages/workspace/WorkspacePage.test.js`

> The repo uses `@testing-library/react`. This is a lightweight render smoke test that mocks the context + API so it runs without a backend, mirroring the spirit of the existing component tests (e.g. `ReportTemplateListPage.columns.test.js`, `ReportBlockRenderer.test.js`).

**Steps**

- [ ] Write the test:

```jsx
// src/pages/workspace/WorkspacePage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the API module so no network calls fire.
jest.mock('../../services/api', () => ({
  workspaceAPI: {
    getCards: jest.fn(() => Promise.resolve({ data: { data: [] } })),
    getLayout: jest.fn(() => Promise.resolve({ data: { data: { items: [] } } })),
    createCard: jest.fn(),
    saveLayout: jest.fn(),
  },
}));

// Mock contexts to a deterministic, signed-in Sales Manager with an empty board.
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', role: 'Sales Manager' } }),
}));
jest.mock('../../context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    ownedCards: [],
    sharedWithMe: [],
    layout: { items: [] },
    loading: false,
    refresh: jest.fn(),
    createCard: jest.fn(),
    addToBoard: jest.fn(),
  }),
}));

// Stub heavy children so the smoke test stays focused on the page shell.
jest.mock('./WorkspaceBoard', () => () => <div data-testid="board" />);
jest.mock('./CardBuilderDialog', () => () => null);
jest.mock('./SharedWithMeTray', () => () => null);

import WorkspacePage from './WorkspacePage';

describe('WorkspacePage', () => {
  it('renders the header and the role-based empty state', () => {
    render(
      <MemoryRouter>
        <WorkspacePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('My Workspace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add card/i })).toBeInTheDocument();
    // Empty-state CTA + a Sales Manager starter suggestion chip.
    expect(screen.getByRole('button', { name: /add suggested cards/i })).toBeInTheDocument();
    expect(screen.getByText('Stale CP leads')).toBeInTheDocument();
  });
});
```

- [ ] Run (expect pass): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test src/pages/workspace/WorkspacePage.test.js --watchAll=false`. Expect 1 passing test.
- [ ] Commit:
```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && git add src/pages/workspace/WorkspacePage.test.js && git commit -m "$(cat <<'EOF'
test(workspace): WorkspacePage render + empty-state smoke test

Mocks api + contexts and asserts the page renders its header, Add card
action, and the role-based empty state (suggested cards + a Sales
Manager starter chip).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 31: End-to-end manual verification

**Files**
- None (verification only).

**Steps**

- [ ] Run the full frontend test suite to confirm nothing regressed: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && CI=true npx react-scripts test --watchAll=false`. Expect all existing suites plus the new `starterCards`, `filterBuilder.helpers`, and `WorkspacePage` tests to pass.
- [ ] Start the dev server (the real start script in `package.json` is `react-scripts start`): `cd "/Users/nirpekshnandan/My Products/propvantage-ai-frontend" && npm start`. (Ensure the backend is reachable at `REACT_APP_API_URL`, default `http://localhost:3000/api`.)
- [ ] **Default landing:** Log in as a developer-org user. **Expected:** you are redirected to `/workspace`; the left nav MAIN section shows **My Workspace** (highlighted) above **Dashboard**.
- [ ] **Empty state + starters:** On a fresh account with no layout items. **Expected:** the dashed empty-state panel renders with role-appropriate suggestion chips and **Add suggested cards** / **Build my own**. Click **Add suggested cards**. **Expected:** the starter cards (e.g. for Sales Manager: "Stale CP leads", "Bookings pending approval") are created and appear on the board, each showing data or a "no matching records" state.
- [ ] **Add a card via Builder:** Click **Add card** → set title "My open leads", module **Leads**, **Builder** tab → **Add condition** → field `assignedToMe`, operator `is`, value `Yes` (or the catalog's boolean control). **Expected:** the live **Preview** shows a matching count; click **Create card**. The card appears on the board as a list with a count badge; clicking a row navigates to `/leads/<id>`.
- [ ] **Add a card via NL:** **Add card** → module **Leads** → **Ask in words** → type *"leads where the channel partner hasn't followed up in 15 days"* → **Build filter**. **Expected:** the dialog switches to **Builder** pre-filled with `source is Channel Partner` and `daysSinceLastCPFollowUp >= 15` (editable); preview count updates; **Create card** pins it.
- [ ] **List ↔ Metric:** Open a card's 3-dots → **Edit** → toggle **Metric** → optionally pick **Sum of <numeric field>** (else Count) → **Save changes**. **Expected:** the card re-renders as a `KPICard` showing the aggregate value. Toggle back to **List** and confirm it returns to the table.
- [ ] **Manual refresh:** Click a card's **Refresh** icon. **Expected:** a `POST /api/workspace/cards/:id/data` request fires (visible in the network panel) and the card re-renders with current data; **Refresh all** in the page header reloads cards + layout.
- [ ] **Drag to reorder:** Grab one card's drag handle and drop it before another. **Expected:** the order changes immediately; reload the page and confirm the new order persisted (a `PUT /api/workspace/layout` was sent).
- [ ] **Share to a role:** On a card → 3-dots → **Share** → **Shared** → select a role (e.g. "Sales Executive") and/or a specific user → **Save sharing**. **Expected:** dialog closes with a success toast; reopening shows the saved visibility/recipients.
- [ ] **Recipient sees it (cross-user):** Log in as a user matching the shared role/user. **Expected:** the card appears in the **Shared with me** tray with an **Add** button; data shown is re-scoped to that recipient (they only see records they could already access). Click **Add**. **Expected:** the card moves onto their board and the tray button flips to the "already on board" check.
- [ ] **Remove vs delete:** As the owner, use **Remove from board** on one card (it disappears from the grid but remains available, e.g. still reachable as a shared card), then **Delete** on another (it is removed entirely and disappears from recipients' trays/boards on their next load).
- [ ] No code changes; nothing to commit for this task.

---

**Region notes for assembly:** Tasks are numbered 22–33 as instructed (renumber on merge). Backend Query Plan / catalog / card / layout contracts are consumed exactly as specified via `workspaceAPI`. Two helper modules not called out in the brief were added because the components require them and they keep the code real and DRY: `src/pages/workspace/catalogCache.js` (session catalog cache + module→detail-route map, used by `WorkspaceCardView` and `CardBuilderDialog`) and the in-file pure helpers in `FilterBuilder.js` (exported for unit testing). The stub-then-fill ordering (Tasks 26→27→28, 29→30→31) keeps every task individually compilable.
agentId: ab91ae55f52d1a8d0 (use SendMessage with to: 'ab91ae55f52d1a8d0' to continue this agent)
<usage>subagent_tokens: 173158
tool_uses: 29
duration_ms: 532282</usage>

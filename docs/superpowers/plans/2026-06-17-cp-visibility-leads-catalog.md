# Channel-Partner Visibility (Leads Catalog) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface lead-level channel-partner data in the Workspace Leads catalog — show the CP firm(s) + CP-side agent + internal owner per row, and filter on "has CP / no CP", CP attribution status, and a CP-only "days since CP follow-up".

**Architecture:** All changes are in the **backend** repo `/Users/nirpekshnandan/My Products/propvantage-ai-backend`. Extend `services/workspace/catalogs/leadsCatalog.js` with three new fields + a semantic fix, and teach the query engine (`services/workspace/queryEngine.js`) to resolve **array** refs (a lead's multiple CP firms/agents) into one joined `<field>_label`. No new collections, no Lead write-path changes, **no frontend change** (the workspace card view already renders `<field>_label ?? value ?? '—'` generically). Spec: `propvantage-ai-frontend/docs/superpowers/specs/2026-06-17-cp-visibility-leads-catalog-design.md`.

**Tech Stack:** Node/Express (ESM), MongoDB/Mongoose aggregation, Jest (`npm run test:unit`), `mongodb-memory-server` for DB tests. Work on branch `main` (already checked out) in the backend repo — do NOT create a branch.

---

### Task 1: Make `daysSinceLastCPFollowUp` CP-only + add `daysSinceLastActivity`

**Files:**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/leadsCatalog.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceLeadsCatalog.test.js`

Today `daysSinceLastCPFollowUp` falls back to `engagementMetrics.lastInteractionDate` → `createdAt`, so non-CP leads get a misleading number. Make it **CP-only** (null when no CP history) and add a separate general `daysSinceLastActivity` that keeps the old fallback semantics.

- [ ] **Step 1: Update the `daysSinceLastCPFollowUp` test to CP-only shape.** In `tests/unit/workspaceLeadsCatalog.test.js`, find the `describe('daysSinceLastCPFollowUp ...')` block whose test asserts the two-stage `addFields` with `__lastCPFollowUpAt` using the `$ifNull` fallback chain. Replace that stage-shape assertion with the CP-only shape and update the label assertion:

```js
  describe('daysSinceLastCPFollowUp (CP-only, headline derived field)', () => {
    const f = () => field('daysSinceLastCPFollowUp');
    it('is derived, numeric, displayable, sortable', () => {
      expect(f().derived).toBe(true);
      expect(f().type).toBe('number');
      expect(f().displayable).toBe(true);
    });
    it('addFields uses ONLY the max CP history timestamp (no fallback)', () => {
      const stages = f().addFields();
      expect(stages).toHaveLength(2);
      expect(stages[0].$addFields.__lastCPFollowUpAt).toEqual({
        $max: '$channelPartnerAttribution.history.at',
      });
      expect(stages[1].$addFields.daysSinceLastCPFollowUp).toEqual({
        $dateDiff: { startDate: '$__lastCPFollowUpAt', endDate: '$$NOW', unit: 'day' },
      });
    });
    it('gte 20 -> { daysSinceLastCPFollowUp: { $gte: 20 } }', () => {
      expect(f().toMatch(OPERATORS.GTE, 20, viewer()))
        .toEqual({ daysSinceLastCPFollowUp: { $gte: 20 } });
    });
  });

  describe('daysSinceLastActivity (general, with fallback)', () => {
    const f = () => field('daysSinceLastActivity');
    it('exists, derived, numeric, displayable', () => {
      expect(f()).toBeDefined();
      expect(f().derived).toBe(true);
      expect(f().type).toBe('number');
      expect(f().displayable).toBe(true);
    });
    it('addFields takes the max of CP history, last interaction, status change, created', () => {
      const stages = f().addFields();
      expect(stages).toHaveLength(2);
      expect(stages[0].$addFields.__lastActivityAt).toEqual({
        $max: [
          { $max: '$channelPartnerAttribution.history.at' },
          '$engagementMetrics.lastInteractionDate',
          '$statusChangedAt',
          '$createdAt',
        ],
      });
      expect(stages[1].$addFields.daysSinceLastActivity).toEqual({
        $dateDiff: { startDate: '$__lastActivityAt', endDate: '$$NOW', unit: 'day' },
      });
    });
  });
```

If the existing file already has a `daysSinceLastCPFollowUp` describe block, REPLACE it with the two blocks above (don't duplicate). Keep the rest of the test file unchanged.

- [ ] **Step 2: Run the test to verify it fails.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js`
Expected: FAIL — the current `daysSinceLastCPFollowUp.addFields()` still has the `$ifNull` fallback, and `daysSinceLastActivity` does not exist yet.

- [ ] **Step 3: Change `daysSinceLastCPFollowUp` to CP-only and add `daysSinceLastActivity`.** In `leadsCatalog.js`, replace the `daysSinceLastCPFollowUp` field's `addFields` (lines ~140–159) and its `label`, then add the new `daysSinceLastActivity` field immediately after it. The field becomes:

```js
  {
    key: 'daysSinceLastCPFollowUp',
    label: 'Days since CP follow-up',
    type: 'number',
    operators: [OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE, OPERATORS.BETWEEN],
    displayable: true,
    defaultColumn: true,
    derived: true,
    // CP-ONLY: days since the most recent channel-partner action. NULL when the
    // lead has no CP history (no fallback) — so "stale CP" filters only match
    // genuine CP leads, and non-CP leads render "—".
    addFields: () => [
      { $addFields: { __lastCPFollowUpAt: { $max: '$channelPartnerAttribution.history.at' } } },
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
  {
    key: 'daysSinceLastActivity',
    label: 'Days since last activity',
    type: 'number',
    operators: [OPERATORS.GT, OPERATORS.LT, OPERATORS.GTE, OPERATORS.LTE, OPERATORS.BETWEEN],
    displayable: true,
    defaultColumn: false,
    derived: true,
    // General staleness: most recent of CP action, internal interaction, status
    // change, or creation. ($max ignores nulls.)
    addFields: () => [
      {
        $addFields: {
          __lastActivityAt: {
            $max: [
              { $max: '$channelPartnerAttribution.history.at' },
              '$engagementMetrics.lastInteractionDate',
              '$statusChangedAt',
              '$createdAt',
            ],
          },
        },
      },
      {
        $addFields: {
          daysSinceLastActivity: {
            $dateDiff: { startDate: '$__lastActivityAt', endDate: '$$NOW', unit: 'day' },
          },
        },
      },
    ],
    toMatch: (op, value) => buildMatch('daysSinceLastActivity', op, value),
  },
```

Also update the file's top "DERIVATION NOTE" comment (lines 7–14) to say `daysSinceLastCPFollowUp` is CP-only (no fallback) and `daysSinceLastActivity` is the general fallback field.

- [ ] **Step 4: Run the test to verify it passes.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/leadsCatalog.js tests/unit/workspaceLeadsCatalog.test.js && git commit -m "feat(workspace): CP-only daysSinceLastCPFollowUp + general daysSinceLastActivity

daysSinceLastCPFollowUp now uses only the max CP history timestamp (null when no
CP touch), so 'stale CP' filters match genuine CP leads. Adds daysSinceLastActivity
(max of CP/internal/status/created) for the general-staleness lens.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add `cpStatus`, `channelPartner`, `cpAgent` catalog fields

**Files:**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/catalogs/leadsCatalog.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceLeadsCatalog.test.js`

Add the three CP fields. `channelPartner` and `cpAgent` are **array refs** (resolved to joined labels by the engine in Task 3); their only filters are emptiness ("has CP / no CP"). `cpStatus` is a normal enum filter.

- [ ] **Step 1: Write failing tests.** Append inside the top-level `describe('leadsCatalog', ...)` in `tests/unit/workspaceLeadsCatalog.test.js`:

```js
  describe('cpStatus (enum)', () => {
    const f = () => field('cpStatus');
    it('carries the real attribution status enum', () => {
      expect(f().type).toBe('enum');
      expect(f().enumValues).toEqual(['tagged', 'pending', 'approved', 'rejected']);
    });
    it('is -> { "channelPartnerAttribution.status": value }', () => {
      expect(f().toMatch(OPERATORS.IS, 'pending', viewer()))
        .toEqual({ 'channelPartnerAttribution.status': 'pending' });
    });
    it('lifts the nested status to a top-level cpStatus for display', () => {
      expect(f().addFields()).toEqual([
        { $addFields: { cpStatus: '$channelPartnerAttribution.status' } },
      ]);
    });
  });

  describe('channelPartner (array ref)', () => {
    const f = () => field('channelPartner');
    it('is an array ref to ChannelPartner.firmName, displayable', () => {
      expect(f().type).toBe('ref');
      expect(f().refArray).toBe(true);
      expect(f().refModel).toBe('ChannelPartner');
      expect(f().refPath).toBe('channelPartnerAttribution.partners.channelPartner');
      expect(f().refLabelFields).toEqual(['firmName']);
      expect(f().displayable).toBe(true);
    });
    it('isNotEmpty -> a CP is tagged (partners.0 exists)', () => {
      expect(f().toMatch(OPERATORS.IS_NOT_EMPTY, null, viewer()))
        .toEqual({ 'channelPartnerAttribution.partners.0': { $exists: true } });
    });
    it('isEmpty -> no CP tagged', () => {
      expect(f().toMatch(OPERATORS.IS_EMPTY, null, viewer()))
        .toEqual({ 'channelPartnerAttribution.partners.0': { $exists: false } });
    });
  });

  describe('cpAgent (array ref)', () => {
    const f = () => field('cpAgent');
    it('is an array ref to User, displayable', () => {
      expect(f().type).toBe('ref');
      expect(f().refArray).toBe(true);
      expect(f().refModel).toBe('User');
      expect(f().refPath).toBe('channelPartnerAttribution.partners.agentUser');
      expect(f().refLabelFields).toEqual(['firstName', 'lastName']);
      expect(f().displayable).toBe(true);
    });
    it('isNotEmpty -> some partner has an agentUser', () => {
      expect(f().toMatch(OPERATORS.IS_NOT_EMPTY, null, viewer())).toEqual({
        'channelPartnerAttribution.partners': { $elemMatch: { agentUser: { $ne: null } } },
      });
    });
  });
```

- [ ] **Step 2: Run to verify it fails.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js`
Expected: FAIL — `cpStatus`/`channelPartner`/`cpAgent` are `undefined`.

- [ ] **Step 3: Add the fields.** In `leadsCatalog.js`, add an exported enum constant near the other enums (after `LEAD_SOURCE_VALUES`):

```js
export const CP_ATTRIBUTION_STATUS_VALUES = ['tagged', 'pending', 'approved', 'rejected'];
```

Then add these three field objects to the `fields` array (e.g. right after the `assignedTo` field):

```js
  {
    key: 'cpStatus',
    label: 'CP status',
    type: 'enum',
    enumValues: CP_ATTRIBUTION_STATUS_VALUES,
    operators: [OPERATORS.IS, OPERATORS.IN, OPERATORS.NOT_IN],
    displayable: true,
    defaultColumn: false,
    derived: true,
    // The value lives at a nested path; lift it to a top-level `cpStatus` so it
    // renders as a column. Filtering still targets the nested path (toMatch).
    addFields: () => [{ $addFields: { cpStatus: '$channelPartnerAttribution.status' } }],
    toMatch: (op, value) => buildMatch('channelPartnerAttribution.status', op, value),
  },
  {
    key: 'channelPartner',
    label: 'Channel Partner',
    type: 'ref',
    refArray: true,
    refModel: 'ChannelPartner',
    refPath: 'channelPartnerAttribution.partners.channelPartner',
    refLabelFields: ['firmName'],
    operators: [OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY],
    displayable: true,
    defaultColumn: true,
    // "has CP / no CP" via array-element existence (viaChannelPartner can be stale).
    toMatch: (op) => ({
      'channelPartnerAttribution.partners.0': { $exists: op === OPERATORS.IS_NOT_EMPTY },
    }),
  },
  {
    key: 'cpAgent',
    label: 'CP Agent',
    type: 'ref',
    refArray: true,
    refModel: 'User',
    refPath: 'channelPartnerAttribution.partners.agentUser',
    refLabelFields: ['firstName', 'lastName'],
    operators: [OPERATORS.IS_EMPTY, OPERATORS.IS_NOT_EMPTY],
    displayable: true,
    defaultColumn: false,
    toMatch: (op) =>
      op === OPERATORS.IS_NOT_EMPTY
        ? { 'channelPartnerAttribution.partners': { $elemMatch: { agentUser: { $ne: null } } } }
        : { 'channelPartnerAttribution.partners': { $not: { $elemMatch: { agentUser: { $ne: null } } } } },
  },
```

- [ ] **Step 4: Run to verify it passes.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceLeadsCatalog.test.js`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/catalogs/leadsCatalog.js tests/unit/workspaceLeadsCatalog.test.js && git commit -m "feat(workspace): add channelPartner, cpAgent, cpStatus fields to Leads catalog

channelPartner + cpAgent are array refs (engine joins firm/agent names into a
label); both filter on emptiness ('has CP / no CP'). cpStatus filters the
attribution status enum.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Engine — array-ref label resolution + integration test

**Files:**
- Modify: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/services/workspace/queryEngine.js`
- Test: `/Users/nirpekshnandan/My Products/propvantage-ai-backend/tests/unit/workspaceQueryEngine.test.js`

The engine's `buildDisplayStages` already resolves single refs (`if (f.type === 'ref' && f.refModel)`). Add an **array-ref** branch (for fields with `refArray: true`) that `$lookup`s all referenced docs at `f.refPath` and joins their labels with ", ".

- [ ] **Step 1: Write the failing integration test.** Append a new `describe` block to `tests/unit/workspaceQueryEngine.test.js` (reuse the file's existing in-memory Mongo + ORG_A/PROJ_A1 setup; import the models at the top of the file if not already imported):

```js
import ChannelPartner from '../../models/channelPartnerModel.js';
// (User is already imported by the display-materialization tests added earlier.)

describe('runQueryPlan — channel-partner array-ref labels + CP-only staleness', () => {
  let CP_A; let CP_B; let CP_AGENT;
  beforeAll(async () => {
    CP_AGENT = await User.create({
      organization: ORG_A, firstName: 'Cee', lastName: 'Pee', email: `cpagent-${Date.now()}@x.com`,
    });
    CP_A = await ChannelPartner.create({ organization: ORG_A, firmName: 'Acme Realty' });
    CP_B = await ChannelPartner.create({ organization: ORG_A, firmName: 'BlueKey' });

    // Stale CP lead, 2 partners, last CP touch 25 days ago, one partner has an agentUser.
    await Lead.create({
      firstName: 'CPLead', phone: '9111111111', organization: ORG_A, project: PROJ_A1,
      source: 'Channel Partner', status: 'New',
      channelPartnerAttribution: {
        viaChannelPartner: true, status: 'approved',
        partners: [
          { channelPartner: CP_A._id, agentUser: CP_AGENT._id },
          { channelPartner: CP_B._id },
        ],
        history: [{ at: daysAgo(40), action: 'tagged' }, { at: daysAgo(25), action: 'note' }],
      },
    });
    // Non-CP lead: no partners, no CP history.
    await Lead.create({
      firstName: 'DirectLead', phone: '9222222222', organization: ORG_A, project: PROJ_A1,
      source: 'Direct', status: 'New',
    });
  });

  const cpStalePlan = {
    module: 'leads', logic: 'AND',
    filters: [
      { field: 'channelPartner', op: 'isNotEmpty', value: null },
      { field: 'daysSinceLastCPFollowUp', op: 'gte', value: 20 },
    ],
    sort: { field: 'daysSinceLastCPFollowUp', dir: 'desc' }, limit: 50, nlSource: null,
  };

  it('resolves multiple CP firms into a joined channelPartner_label', async () => {
    const { rows } = await runQueryPlan(cpStalePlan, ownerViewer(ORG_A));
    const row = rows.find((r) => r.firstName === 'CPLead');
    expect(row).toBeTruthy();
    expect(row.channelPartner_label).toBe('Acme Realty, BlueKey');
    expect(row.cpAgent_label).toBe('Cee Pee');
    expect(row.daysSinceLastCPFollowUp).toBeGreaterThanOrEqual(20);
    // internal temp lookup arrays are stripped
    expect(row.__channelPartner_docs).toBeUndefined();
    expect(row.__cpAgent_docs).toBeUndefined();
  });

  it('excludes non-CP leads (channelPartner isNotEmpty) and CP-only stale is null for them', async () => {
    const { rows } = await runQueryPlan(cpStalePlan, ownerViewer(ORG_A));
    expect(rows.some((r) => r.firstName === 'DirectLead')).toBe(false);
  });

  it('channelPartner isEmpty matches the non-CP lead', async () => {
    const plan = { ...cpStalePlan, filters: [{ field: 'channelPartner', op: 'isEmpty', value: null }], sort: null };
    const { rows } = await runQueryPlan(plan, ownerViewer(ORG_A));
    expect(rows.some((r) => r.firstName === 'DirectLead')).toBe(true);
    expect(rows.some((r) => r.firstName === 'CPLead')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryEngine.test.js`
Expected: FAIL — `channelPartner_label`/`cpAgent_label` are undefined (engine doesn't resolve array refs yet).

- [ ] **Step 3: Add the array-ref branch to `buildDisplayStages`.** In `queryEngine.js`, inside the `for (const f of fields)` loop in `buildDisplayStages`, add this branch BEFORE the existing single-ref branch, and guard the single-ref branch so it does not also fire for array refs:

```js
    // Fix: resolve ARRAY ref fields (e.g. a lead's multiple CP firms/agents) to a joined label.
    if (f.type === 'ref' && f.refArray && f.refPath) {
      const coll = mongoose.model(f.refModel).collection.collectionName;
      const docsAlias = `__${f.key}_docs`;                 // __-prefixed → stripped by final cleanup
      const labelFields = f.refLabelFields || ['name'];
      const perDoc = {
        $trim: {
          input: {
            $reduce: {
              input: labelFields.map((lf) => ({ $ifNull: [`$$d.${lf}`, ''] })),
              initialValue: '',
              in: { $concat: ['$$value', ' ', '$$this'] },
            },
          },
        },
      };
      stages.push(
        { $lookup: { from: coll, localField: f.refPath, foreignField: '_id', as: docsAlias } },
        {
          $addFields: {
            [`${f.key}_label`]: {
              $trim: {
                input: {
                  $reduce: {
                    input: { $map: { input: `$${docsAlias}`, as: 'd', in: perDoc } },
                    initialValue: '',
                    in: {
                      $cond: [
                        { $eq: ['$$value', ''] },
                        '$$this',
                        { $concat: ['$$value', ', ', '$$this'] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      );
      continue; // handled as an array ref; skip the single-ref branch below
    }
```

And change the existing single-ref branch condition from `if (f.type === 'ref' && f.refModel) {` to:

```js
    if (f.type === 'ref' && f.refModel && !f.refArray) {
```

(Leave the single-ref body, the derived-field branch, and everything else unchanged.)

- [ ] **Step 4: Run to verify it passes.**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspaceQueryEngine.test.js`
Expected: PASS — including the joined `channelPartner_label` "Acme Realty, BlueKey" and `cpAgent_label` "Cee Pee".

- [ ] **Step 5: Run the full workspace suite (no regressions).**

Run: `cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && npm run test:unit -- tests/unit/workspace tests/unit/salesCatalog.test.js tests/unit/paymentsCatalog.test.js tests/unit/tasksCatalog.test.js tests/unit/channelPartnersCatalog.test.js 2>&1 | tail -15`
Expected: all suites pass. (Confirm the earlier engine display-materialization test still passes with the CP-only `daysSinceLastCPFollowUp` — its seeded leads have CP history, so they still get a number.)

- [ ] **Step 6: Commit.**

```bash
cd "/Users/nirpekshnandan/My Products/propvantage-ai-backend" && git add services/workspace/queryEngine.js tests/unit/workspaceQueryEngine.test.js && git commit -m "feat(workspace): engine resolves array-ref labels (CP firms / CP agents)

buildDisplayStages now \$lookups array refs at refPath and joins the referenced
docs' labels with ', ' into <field>_label (single-ref path unchanged). Enables
the Leads card to show Channel Partner + CP Agent columns.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes for the executor
- **No frontend changes.** The workspace card view already renders `row[<key>_label] ?? value ?? '—'`, so the new `channelPartner`/`cpAgent` columns and labels appear automatically once the catalog + engine ship. The builder's field dropdown and enum/value inputs are catalog-driven, so `cpStatus` (enum) and the emptiness filters work without UI changes. (Filtering by a *specific* CP firm is intentionally NOT included — it needs a ref picker, a separate follow-up.)
- After all three tasks pass, deploy is the usual: push backend `main` → EC2 (GitHub Actions `deploy.yml`), then live-verify on the demo org by building a "Stale CP leads ≥20d" card and confirming Channel Partner + CP Agent + Assigned To columns populate with names and the days value is CP-only.

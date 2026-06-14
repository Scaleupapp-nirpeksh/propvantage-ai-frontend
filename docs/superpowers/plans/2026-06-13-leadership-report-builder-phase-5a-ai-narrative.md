# Leadership Report Builder — Phase 5a (AI Narrative Block) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "AI Narrative" report block that asks the LLM to write a concise, executive summary of the report's figures, rendered inline like any other block.

**Architecture:** A new `ai.narrative` block in the registry whose async `resolve()` builds a compact facts string from the leadership overview (pure) and calls a `narrativeService` (mirrors the existing `services/ai/insightNarrator.js` OpenAI usage, best-effort). Because resolvers are now async, `buildSnapshotBlocks` becomes async (`Promise.all`). The block is permission-gated (`ai:insights`) so it only appears for permitted users. The frontend renderer gains a styled case for the narrative.

**Tech Stack:** Node.js (ESM), OpenAI SDK (`openai`, already a dep), Mongoose, Jest; React 18 + MUI v5.

**Repos:** backend `/Users/nirpekshnandan/My Products/propvantage-ai-backend`, frontend `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`. Each task says which.

**Depends on:** Phase 0 `blockRegistry` (`getBlock`, `getCatalog`, `BLOCKS`), `snapshotService.buildSnapshotBlocks`/`generateInstance`; `services/ai/insightNarrator.js` (OpenAI pattern to mirror); `ai:insights` permission (Phase 0); frontend `ReportBlockRenderer`.

**Pattern (verbatim from `insightNarrator.js`):** `import OpenAI from 'openai'; const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); const MODEL = process.env.COPILOT_MODEL || 'gpt-4o'; await openai.chat.completions.create({ model, messages:[{role,content}], temperature, max_tokens });` → `response.choices?.[0]?.message?.content`.

---

## File Structure

**Backend new:** `services/reports/narrativeService.js` (pure `buildFacts`, async `generateNarrative`); `tests/unit/narrativeService.test.js`.
**Backend modified:** `services/reports/blockRegistry.js` (+`ai.narrative` block), `services/reports/snapshotService.js` (async `buildSnapshotBlocks`), `tests/unit/snapshotService.test.js` + `tests/unit/blockRegistry.test.js` (await), `tests/unit/snapshotBuilder`… (see Task 2).
**Frontend modified:** `src/components/reports/ReportBlockRenderer.js` (+`ai.narrative` case).

---

## Task 1: Narrative service (pure facts + LLM call)

**Repo:** backend. **Files:** create `services/reports/narrativeService.js`, `tests/unit/narrativeService.test.js`.

- [ ] **Step 1: Write the failing test** (only the PURE `buildFacts` is unit-tested; `generateNarrative` makes a network call and is verified by smoke):

```js
// File: tests/unit/narrativeService.test.js
import { buildFacts } from '../../services/reports/narrativeService.js';

describe('buildFacts', () => {
  it('summarizes the key overview figures into a compact string', () => {
    const facts = buildFacts({
      revenue: { totalSalesValue: 124000000, totalCollected: 80000000, totalOutstanding: 44000000, collectionRate: 0.71 },
      salesPipeline: { totalLeads: 320, conversionRate: 0.062, avgBookingValue: 8500000 },
      portfolio: { totalUnits: 200, totalProjects: 4 },
    });
    expect(facts).toContain('Total sales value: 124000000');
    expect(facts).toContain('Collection rate: 71%');
    expect(facts).toContain('Total leads: 320');
    expect(facts).toContain('Conversion rate: 6.2%');
  });
  it('tolerates a missing/partial overview', () => {
    expect(typeof buildFacts({})).toBe('string');
    expect(typeof buildFacts(undefined)).toBe('string');
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- narrativeService`.

- [ ] **Step 3: Implement**

```js
// File: services/reports/narrativeService.js
// Description: Generates a short executive narrative of a report's figures.
// Mirrors services/ai/insightNarrator.js (OpenAI). Best-effort: never throws.

import OpenAI from 'openai';

const MODEL = process.env.COPILOT_MODEL || 'gpt-4o';
const MAX_TOKENS = Number(process.env.REPORT_NARRATIVE_MAX_TOKENS) || 300;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const pct = (n) => `${Math.round((Number(n) || 0) * 1000) / 10}%`;
const num = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/** Build a compact, factual summary string from the leadership overview. Pure. */
export const buildFacts = (overview = {}) => {
  const o = overview || {};
  const r = o.revenue || {};
  const s = o.salesPipeline || {};
  const p = o.portfolio || {};
  const lines = [
    `Total sales value: ${num(r.totalSalesValue)}`,
    `Collected: ${num(r.totalCollected)}; Outstanding: ${num(r.totalOutstanding)}; Collection rate: ${pct(r.collectionRate)}`,
    `Total leads: ${num(s.totalLeads)}; Conversion rate: ${pct(s.conversionRate)}; Avg booking value: ${num(s.avgBookingValue)}`,
    `Projects: ${num(p.totalProjects)}; Units: ${num(p.totalUnits)}`,
  ];
  return lines.join('\n');
};

/**
 * Generate a 3–5 sentence narrative. Best-effort: returns { text, error? }.
 * @param {string} facts - output of buildFacts
 * @param {string} [focus] - optional creator hint
 */
export const generateNarrative = async (facts, focus) => {
  if (!openai) return { text: '', error: 'AI not configured (OPENAI_API_KEY missing)' };
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a real-estate analytics assistant. Write a concise 3–5 sentence executive summary of the report figures for senior leadership. Use ONLY the numbers provided; never invent data. Plain prose, no markdown, no headings, currency in INR context.' },
        { role: 'user', content: `${focus ? `Focus area: ${focus}\n` : ''}Report figures:\n${facts}` },
      ],
      temperature: 0.3,
      max_tokens: MAX_TOKENS,
    });
    return { text: (response.choices?.[0]?.message?.content || '').trim() };
  } catch (err) {
    return { text: '', error: err.message };
  }
};

export default { buildFacts, generateNarrative };
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- narrativeService` → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add services/reports/narrativeService.js tests/unit/narrativeService.test.js
git commit -m "feat(reports): add AI narrative service (facts + LLM summary)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Make snapshot resolvers async

**Repo:** backend. **Files:** modify `services/reports/snapshotService.js`, `tests/unit/snapshotService.test.js`.

**Context:** Resolvers are now async (the AI block awaits an LLM call). `buildSnapshotBlocks` must `await` each resolver. Existing synchronous resolvers keep working (awaiting a non-promise yields the value).

- [ ] **Step 1: Update the test first** (it must now await). In `tests/unit/snapshotService.test.js`, change the `buildSnapshotBlocks` describe block so each call is awaited and the test fns are async. Replace the existing `describe('buildSnapshotBlocks', ...)` block with:

```js
describe('buildSnapshotBlocks', () => {
  it('attaches resolved data to each known block', async () => {
    const out = await buildSnapshotBlocks([{ id: 'b1', type: 'kpi.revenue', config: {} }], overview);
    expect(out[0].id).toBe('b1');
    expect(out[0].data).toEqual({ value: 100, unit: 'currency' });
  });
  it('marks unknown block types with an error instead of throwing', async () => {
    const out = await buildSnapshotBlocks([{ id: 'x', type: 'nope.block' }], overview);
    expect(out[0].data.error).toMatch(/Unknown block type/);
  });
  it('handles a block with null config without throwing, in isolation from siblings', async () => {
    const out = await buildSnapshotBlocks(
      [{ id: 'ok', type: 'kpi.revenue', config: {} }, { id: 'bad', type: 'text.note', config: null }],
      overview
    );
    expect(out[0].data).toEqual({ value: 100, unit: 'currency' });
    expect(out[1].data).toEqual({ text: '' });
  });
  it('returns [] for empty input', async () => {
    expect(await buildSnapshotBlocks([], overview)).toEqual([]);
    expect(await buildSnapshotBlocks(undefined, overview)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- snapshotService` (the sync impl returns Promises, so `out[0].id` is undefined → failures).

- [ ] **Step 3: Make `buildSnapshotBlocks` async** in `services/reports/snapshotService.js`:

```js
export const buildSnapshotBlocks = async (templateBlocks, overview = {}) => {
  if (!Array.isArray(templateBlocks)) return [];
  return Promise.all(templateBlocks.map(async (block) => {
    const def = getBlock(block.type);
    if (!def) return { ...block, data: { error: `Unknown block type: ${block.type}` } };
    try {
      const data = await def.resolve({ overview, config: block.config || {} });
      return { ...block, data };
    } catch (err) {
      return { ...block, data: { error: err.message } };
    }
  }));
};
```

And in `generateInstance`, await the call:

```js
  const blocks = await buildSnapshotBlocks(template.blocks, overview);
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- snapshotService` → PASS (the 4 buildSnapshotBlocks tests + resolvePeriodArgs tests).

- [ ] **Step 5: Commit**

```bash
git add services/reports/snapshotService.js tests/unit/snapshotService.test.js
git commit -m "refactor(reports): await async block resolvers in snapshot builder" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Register the AI Narrative block

**Repo:** backend. **Files:** modify `services/reports/blockRegistry.js`, `tests/unit/blockRegistry.test.js`.

- [ ] **Step 1: Add a test.** In `tests/unit/blockRegistry.test.js`, add:

```js
  it('exposes an ai.narrative block gated on ai:insights, returning text', async () => {
    const def = getBlock('ai.narrative');
    expect(def).toBeDefined();
    expect(def.requiredPermission).toBe('ai:insights');
    expect(def.kind).toBe('narrative');
    // With no OPENAI_API_KEY in the test env, resolve returns a best-effort empty text.
    const out = await def.resolve({ overview: fakeOverview, config: {} });
    expect(out).toHaveProperty('text');
    // catalog hides it without the permission, shows it with it
    expect(getCatalog([], false).find((b) => b.type === 'ai.narrative')).toBeUndefined();
    expect(getCatalog(['ai:insights'], false).find((b) => b.type === 'ai.narrative')).toBeDefined();
  });
```

(The existing "every block has a resolve fn" loop test still holds — `ai.narrative.resolve` is an async function, still `typeof === 'function'`.)

- [ ] **Step 2: Run → fail.** `npm run test:unit -- blockRegistry`.

- [ ] **Step 3: Add the block.** In `services/reports/blockRegistry.js`, add the import at the top:

```js
import { buildFacts, generateNarrative } from './narrativeService.js';
```

Add this entry to the `BLOCKS` array (in a new "AI" section, before the Layout section):

```js
  // ─── AI ─────────────────────────────────────────────
  {
    type: 'ai.narrative', category: 'AI', label: 'AI Narrative', kind: 'narrative',
    description: 'An AI-written executive summary of this report’s figures.',
    requiredPermission: 'ai:insights', defaultConfig: { focus: '' },
    resolve: async ({ overview, config }) => generateNarrative(buildFacts(overview), config?.focus),
  },
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- blockRegistry` → PASS. Then full `npm run test:unit` → all green (the catalog/snapshot suites still pass with the new async block).

- [ ] **Step 5: Commit**

```bash
git add services/reports/blockRegistry.js tests/unit/blockRegistry.test.js
git commit -m "feat(reports): add AI Narrative block to the catalog" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Render the narrative (frontend)

**Repo:** frontend. **Files:** modify `src/components/reports/ReportBlockRenderer.js`.

- [ ] **Step 1: Add a render case + test.** In `src/components/reports/ReportBlockRenderer.test.js`, add:

```js
  it('renders an AI narrative block', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', title: 'Summary', data: { text: 'Revenue is up 12%.' } }} />
    );
    expect(screen.getByText('Revenue is up 12%.')).toBeInTheDocument();
  });
  it('renders a friendly fallback when the narrative is empty', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', data: { text: '', error: 'AI not configured' } }} />
    );
    expect(screen.getByText(/narrative is unavailable/i)).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="ReportBlockRenderer"`.

- [ ] **Step 3: Add the render branch.** In `src/components/reports/ReportBlockRenderer.js`, add `AutoAwesome` to the `@mui/icons-material` import (add the import line if none exists):

```js
import { AutoAwesome } from '@mui/icons-material';
```

Add this branch just before the `text.note` branch (so it's matched first):

```js
  if (type === 'ai.narrative') {
    const text = data?.text;
    return (
      <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderLeft: `3px solid ${theme.palette.primary.main}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, color: 'primary.main' }}>
          <AutoAwesome fontSize="small" />
          <Typography variant="caption" fontWeight={700}>{title || 'AI Summary'}</Typography>
        </Box>
        {text
          ? <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
          : <Typography variant="body2" color="text.secondary">The AI narrative is unavailable for this report.</Typography>}
      </Box>
    );
  }
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="ReportBlockRenderer"` → PASS. Then `CI=false npm run build` → compiles.

- [ ] **Step 5: Commit**

```bash
git add src/components/reports/ReportBlockRenderer.js src/components/reports/ReportBlockRenderer.test.js
git commit -m "feat(reports): render the AI Narrative block" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Verify + smoke

- [ ] **Step 1: Backend** `npm run test:unit` → all green. **Frontend** `CI=false npm run build` → compiles.
- [ ] **Step 2: Manual smoke** (server running with `OPENAI_API_KEY` set; a leadership user with `ai:insights`): in the builder, the palette shows an **AI** category with **AI Narrative**; add it, Save, **Generate preview** → the block fills with an AI-written paragraph summarizing the figures (or the friendly fallback if `OPENAI_API_KEY` is unset). Confirm the block also renders on the public page. Record results. (Defer if no key/server.)

---

## Self-Review

**Spec coverage:** AI-written narrative block reusing the existing LLM pattern → Tasks 1,3 ✅; rendered inline + on the public page (the renderer is shared) → Task 4 ✅; permission-gated (`ai:insights`) so it only appears for permitted creators → Task 3 ✅; async resolvers enabled without breaking existing blocks → Task 2 ✅.
**Placeholder scan:** complete code + exact commands; `generateNarrative` (network) verified by smoke, `buildFacts` unit-tested. ✅
**Type/name consistency:** `buildFacts`/`generateNarrative` (Task 1) used by the registry (Task 3); `buildSnapshotBlocks` async (Task 2) awaited in `generateInstance` and tests; renderer branch keys on `type==='ai.narrative'`. The async `buildSnapshotBlocks` change is the one cross-cutting edit — `generateInstance` already `await`ed it via the new `await`. ✅
**Robustness:** `generateNarrative` never throws (best-effort) and degrades to a friendly fallback when the key is missing or the call fails; `buildFacts` is pure; the block is the only async resolver but the builder handles any resolver uniformly.

---

## Execution Handoff

Next Phase 5 items (independent): **5b** PDF export/attachment, **5c** per-recipient unique links, **5d** OTP gate. Each has its own plan.

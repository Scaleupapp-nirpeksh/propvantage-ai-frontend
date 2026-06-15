# Leads Refactor — Phase 6 (frontend): List Display + Funnel Rename + statusConfig — Implementation Plan

> **For agentic workers:** Mostly mechanical edits. Verify with `npm run build`.

**Goal:** Update the central status config to the new 7-status set (+ a priority config), strip Hot/Warm/Cold from the All-Leads list (show status + priority instead, per #22), and rename the Leads **"Pipeline" → "Funnel"** in the nav, page title, and command palette (#19) — leaving the separate Sales Pipeline untouched and keeping the `/leads/pipeline` URL. Also lands a tiny carried-over defensive fix from Phase 5.

**Repo:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend` (branch `feature/leads-developer-ready`).

**Files:** `src/constants/statusConfig.js`, `src/pages/leads/LeadsListPage.js`, `src/pages/leads/LeadsPipelinePage.js`, `src/components/layout/DashboardLayout.js`, `src/components/navigation/CommandPalette.js`, `src/pages/leads/LeadDetailPage.js` (one-line fix).

---

## Task 1: statusConfig — new lead statuses + priority config (+ carried fix)

**Files:** `src/constants/statusConfig.js`, `src/pages/leads/LeadDetailPage.js`

- [ ] **Step 1: Replace `LEAD_STATUS`** (currently the old 9 statuses) with the new set. `HourglassEmpty` and `PlayArrow` are already imported.

Find:
```js
// Lead statuses
export const LEAD_STATUS = {
  'New':                  { label: 'New',                  color: 'info',    icon: FiberNew },
  'Contacted':            { label: 'Contacted',            color: 'warning', icon: Phone },
  'Qualified':            { label: 'Qualified',            color: 'primary', icon: ThumbUp },
  'Site Visit Scheduled': { label: 'Site Visit Scheduled', color: 'info',    icon: Schedule },
  'Site Visit Completed': { label: 'Site Visit Completed', color: 'primary', icon: LocationOn },
  'Negotiating':          { label: 'Negotiating',          color: 'warning', icon: Handshake },
  'Booked':               { label: 'Booked',               color: 'success', icon: CheckCircle },
  'Lost':                 { label: 'Lost',                 color: 'error',   icon: Cancel },
  'Unqualified':          { label: 'Unqualified',          color: 'default', icon: Block },
};
```
Replace with:
```js
// Lead statuses (2026-06 refactor). Internal terminal value stays 'Booked';
// the UI labels it "Booking". 'pending' is the CP intake-queue state.
export const LEAD_STATUS = {
  'pending':              { label: 'Pending Review',       color: 'default',   icon: HourglassEmpty },
  'New':                  { label: 'New',                  color: 'info',      icon: FiberNew },
  'Qualified':            { label: 'Qualified',            color: 'primary',   icon: ThumbUp },
  'Site Visit Completed': { label: 'Site Visit Completed', color: 'primary',   icon: LocationOn },
  'Negotiating':          { label: 'Negotiating',          color: 'warning',   icon: Handshake },
  'Booked':               { label: 'Booking',              color: 'success',   icon: CheckCircle },
  'Lost':                 { label: 'Lost',                 color: 'error',     icon: Cancel },
  'Revived':              { label: 'Revived',              color: 'secondary', icon: PlayArrow },
};

// Lead priority (2026-06 refactor — replaces Hot/Warm/Cold "temperature").
export const LEAD_PRIORITY = {
  'High':     { label: 'High',     color: 'error' },
  'Medium':   { label: 'Medium',   color: 'warning' },
  'Low':      { label: 'Low',      color: 'info' },
  'Very Low': { label: 'Very Low', color: 'default' },
};
```
(If `Phone`/`Schedule`/`Block` become unused imports elsewhere in the file, leave them — they're used by other status maps. Only remove an import if the build flags it as unused-error.)

- [ ] **Step 2: If there's a `getStatusConfig`/`STATUS_CONFIG` aggregate at the bottom**, add a `priority` entry mapping to `LEAD_PRIORITY` (so `getStatusConfig('priority', p)` works) — only if such an aggregate exists; otherwise skip.

- [ ] **Step 3: Carried fix** — in `src/pages/leads/LeadDetailPage.js`, make the CP summary prop defensive. Find `attribution={lead.channelPartnerAttribution}` and change to `attribution={lead?.channelPartnerAttribution}`.

- [ ] **Step 4: Commit** (`feat(leads): statusConfig new lead statuses + priority config` + co-author trailer).

---

## Task 2: All-Leads list — status + priority, no temperature

**Files:** `src/pages/leads/LeadsListPage.js`

- [ ] **Step 1: Update the local constants near the top.**
- Replace the hardcoded `LEAD_SOURCES` array with `['Channel Partner', 'Management', 'Direct', 'Referral', 'Marketing', 'Cold Calling']`.
- Replace `const PRIORITIES = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];` with `const PRIORITIES = ['High', 'Medium', 'Low', 'Very Low'];`.
- `const LEAD_STATUSES = Object.keys(LEAD_STATUS);` stays, but for the STATUS filter options exclude the intake state: use `LEAD_STATUSES.filter(s => s !== 'pending')`.

- [ ] **Step 2: Remove the Hot/Warm/Cold temperature label.**
- Delete `getScoreLabel` (the function returning Hot/Warm/Moderate/Cold). Keep `getScoreColor` ONLY if you keep a colored score number; otherwise delete it too and render the score number plainly. In BOTH the table column render (~line 117) and the mobile card (~line 286–288), remove the `{getScoreLabel(lead.score)}` text. Keep the numeric score chip if desired but with NO temperature word.
- Import `LEAD_PRIORITY` from `../../constants/statusConfig` and render a **priority chip** for each lead: `<Chip label={lead.priority || 'Very Low'} color={(LEAD_PRIORITY[lead.priority]||{}).color || 'default'} size="small" />` — add it to the row (e.g. a small "Priority" column or next to the score) and to the mobile card. The Status chip already renders via the status config (now the new set).

- [ ] **Step 3: KPI relabel.** Find the `KPICard title="Hot Leads (90+)"` and relabel to `title="High Priority"` (keep whatever `value`/stat it currently uses; the label is what matters for #22). If a `Warning` icon import becomes unused, leave it (used elsewhere) unless the build errors.

- [ ] **Step 4: Build** `CI=true npm run build` → exit 0 (fix unused-var errors from removed helpers). **Commit** (`feat(leads): leads list shows status + priority, drops Hot/Warm/Cold` + trailer).

---

## Task 3: Funnel page — rename + new kanban columns

**Files:** `src/pages/leads/LeadsPipelinePage.js`

- [ ] **Step 1: Rename the title** (~line 812): `Sales Pipeline` → `Funnel`. And the help text (~line 1033): `How to use the Sales Pipeline` → `How to use the Funnel`.
- [ ] **Step 2: Rebuild the kanban stage columns.** Find the stages/columns config array (the 8-stage definition with New/Contacted/Qualified/Site Visit Scheduled/Site Visit Completed/Negotiating/Booked/Lost). Replace it with the new 7 columns (drop Contacted + Site Visit Scheduled, add Revived, label Booked as "Booking"):
```js
// id = the lead.status value used for grouping; title = the column header.
{ id: 'New',                  title: 'New Leads',            color: '#2196F3' },
{ id: 'Qualified',            title: 'Qualified',            color: '#4CAF50' },
{ id: 'Site Visit Completed', title: 'Site Visit Completed', color: '#673AB7' },
{ id: 'Negotiating',          title: 'Negotiating',          color: '#FF5722' },
{ id: 'Booked',               title: 'Booking',              color: '#4CAF50' },
{ id: 'Lost',                 title: 'Lost',                 color: '#757575' },
{ id: 'Revived',              title: 'Revived',              color: '#9C27B0' },
```
Keep the exact object shape the existing code expects (match the existing keys, e.g. `id`/`title`/`color`/`description` — read the current array and preserve its property names; only change the set of entries + the Booked title to "Booking"). If a drag-and-drop move sets a lead's status, ensure the target statuses are now from this set (the backend will reject illegal transitions with a 400 — acceptable).
- [ ] **Step 3: Build** → exit 0. **Commit** (`feat(leads): rename Leads Pipeline → Funnel + new status columns` + trailer).

---

## Task 4: Nav + command-palette rename

**Files:** `src/components/layout/DashboardLayout.js`, `src/components/navigation/CommandPalette.js`

- [ ] **Step 1:** In `DashboardLayout.js` (~line 142), the leads nav item:
```js
{ id: 'leads-pipeline', title: 'Pipeline', icon: TrendingUp, path: '/leads/pipeline' },
```
→ change `title: 'Pipeline'` to `title: 'Funnel'`. **Leave** the `sales-pipeline` item (~line 155) as "Pipeline". Leave the breadcrumb map at ~line 460 (`'pipeline': 'Pipeline'`) unchanged (it's shared with /sales/pipeline).
- [ ] **Step 2:** In `CommandPalette.js` (~line 20), the leads entry:
```js
{ label: 'Sales Pipeline', path: '/leads/pipeline', icon: TrendingUp, section: 'Pages' },
```
→ change `label` to `'Funnel'`. **Leave** the `/sales/pipeline` entry (~line 22) as "Sales Pipeline".
- [ ] **Step 3: Build** → exit 0. **Commit** (`feat(leads): nav + palette label Leads Pipeline → Funnel` + trailer).

---

## Task 5: Verification
- [ ] `CI=true npm run build` → exit 0.
- [ ] Manual (checkpoint): All-Leads list shows Status (new labels, "Booking" for Booked) + a Priority chip and NO Hot/Warm/Cold; the Leads nav item reads "Funnel"; the Funnel page title reads "Funnel" with 7 columns incl. Revived; Sales Pipeline is unchanged.

## Self-Review (planning)
- #19 (Pipeline→Funnel: nav, page, palette; Sales Pipeline untouched; URL kept), #22 (list: drop Hot/Warm/Cold, show status + priority), statusConfig central update (Booked→"Booking", +Revived, +pending, +LEAD_PRIORITY). Carried the Phase 5 `?.` fix.
- Placeholders: none. Implementer must read the actual pipeline stages array to preserve its property names.

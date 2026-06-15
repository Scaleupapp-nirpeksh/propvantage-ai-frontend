# Leads Refactor — Phase 5 (frontend): Lead Detail Page Redesign — Implementation Plan

> **For agentic workers:** Large React/MUI component redesign — a **target-spec** plan. Implement by reading the real file, verify with `npm run build`. Pure helper gets a Jest test.

**Goal:** Simplify `LeadDetailPage` per requirement #23 — a clean top bar (name, email, phone, source, priority, research links, status — no score/temperature), the AI profile summary directly below, three tabs (Overview · Property Requirements · Follow-up with Interactions nested), CP shown ONLY in its percentage card (remove the duplicate banner + the contact-info source duplication), and a working three-dots menu: **Edit Lead**, **Change Status** (quick dialog, only valid next transitions), **Assign / Reassign** (quick dialog) — removing the dead Call/Email/WhatsApp/View/Analytics/Generate-Report actions and all Hot/Warm/Cold.

**Repo:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend` (branch `feature/leads-developer-ready`).
**Backend contract (shipped):** `PATCH /api/leads/:id/status {status, note}` (enforces the state machine), `PUT /api/leads/:id/assign {assignedTo}`.

**Files:**
- Create: `src/utils/leadStatusMachine.js` (mirror of backend) + `src/utils/leadStatusMachine.test.js`.
- Modify: `src/services/api.js` (add `changeStatus`, `assignLead` to `leadAPI`), `src/pages/leads/LeadDetailPage.js` (the redesign).

---

## Task 1: Frontend status-machine mirror + api client

**Files:** Create `src/utils/leadStatusMachine.js`, `src/utils/leadStatusMachine.test.js`; Modify `src/services/api.js`

- [ ] **Step 1: Write the test**

```js
// src/utils/leadStatusMachine.test.js
import { LEAD_STATUSES, allowedNextStatuses, statusLabel } from './leadStatusMachine';

describe('frontend lead status machine (mirror of backend)', () => {
  it('lists the 7 funnel statuses (excludes the pending intake state)', () => {
    expect(LEAD_STATUSES).toEqual(['New', 'Qualified', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Revived']);
  });
  it('allowedNextStatuses matches the backend transitions', () => {
    expect(allowedNextStatuses('New')).toEqual(['Qualified', 'Lost']);
    expect(allowedNextStatuses('Qualified')).toEqual(['Site Visit Completed', 'Lost']);
    expect(allowedNextStatuses('Site Visit Completed')).toEqual(['Negotiating', 'Booked', 'Lost']);
    expect(allowedNextStatuses('Negotiating')).toEqual(['Booked', 'Lost']);
    expect(allowedNextStatuses('Lost')).toEqual(['Revived']);
    expect(allowedNextStatuses('Revived')).toEqual(['Site Visit Completed', 'Negotiating']);
    expect(allowedNextStatuses('Booked')).toEqual(['Lost']);
  });
  it('statusLabel renders Booked as "Booking", others unchanged', () => {
    expect(statusLabel('Booked')).toBe('Booking');
    expect(statusLabel('Qualified')).toBe('Qualified');
  });
});
```

- [ ] **Step 2: Run** `CI=true npx react-scripts test src/utils/leadStatusMachine.test.js --watchAll=false` → FAIL.

- [ ] **Step 3: Implement**

```js
// src/utils/leadStatusMachine.js
// Frontend mirror of backend utils/leadStatusMachine.js — drives the quick
// status-change menu so users only see valid next transitions. The internal
// terminal value stays 'Booked'; the UI labels it "Booking".

export const LEAD_STATUSES = ['New', 'Qualified', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Revived'];

export const LEAD_STATUS_TRANSITIONS = {
  New: ['Qualified', 'Lost'],
  Qualified: ['Site Visit Completed', 'Lost'],
  'Site Visit Completed': ['Negotiating', 'Booked', 'Lost'],
  Negotiating: ['Booked', 'Lost'],
  Booked: ['Lost'],
  Lost: ['Revived'],
  Revived: ['Site Visit Completed', 'Negotiating'],
};

export function allowedNextStatuses(from) {
  return LEAD_STATUS_TRANSITIONS[from] || [];
}

export function statusLabel(status) {
  return status === 'Booked' ? 'Booking' : status;
}
```

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Add to `leadAPI` in `src/services/api.js`** (inside the `export const leadAPI = { ... }` object):

```js
  changeStatus: (id, status, note) => api.patch(`/leads/${id}/status`, { status, note }),
  assignLead: (id, assignedTo) => api.put(`/leads/${id}/assign`, { assignedTo }),
```

- [ ] **Step 6: Commit** (`feat(leads): frontend status-machine mirror + changeStatus/assignLead api` + co-author trailer).

---

## Task 2: Redesign `LeadDetailPage.js`

**Files:** Modify `src/pages/leads/LeadDetailPage.js`. Read it fully first. Preserve data loading (`leadAPI.getLead`), the enrichment card, interactions/follow-up logic, the CP-proposed-status banner behavior, permissions (`canAccess`), and the Convert-to-Booking button (Phase 7 fixes its target — leave it pointing where it does).

### 2.1 Top bar (replace the current `LeadHeader` content)
Show ONLY: avatar + **name**; a row of chips/links — **status** (use `statusLabel`, color from status config), **priority** chip (High/Medium/Low/Very Low — color: High=error, Medium=warning, Low=info, Very Low=default), **source** chip; **email** and **phone** (as text with icons); and **research links** — if `lead.enrichment?.sources?.linkedinUrl` (and/or companyWebsite) exist, render them as small clickable link chips (LinkedIn / Website). 
- **REMOVE**: the large Lead Score number + the `getScoreLabel`/`getScoreColor` "Hot/Warm/Moderate/Cold Lead" chip (delete those helpers if now unused), the key-metrics grid (budget/unit/project/created) — that data moves to the Property Requirements tab.
- Keep the Site-Visit aging chip only if you wish; it's optional. Do not show temperature anywhere.

### 2.2 Three-dots menu (replace the action list)
Menu items (in this order):
1. **Edit Lead** → `navigate(\`/leads/${lead._id}/edit\`)` (use the existing edit route the page already knows).
2. **Change Status** → opens a small dialog: a Select populated by `allowedNextStatuses(lead.status).map(statusLabel)` (value = raw status), an optional "Note" field, and a Save that calls `leadAPI.changeStatus(lead._id, status, note)`, then `onRefresh()` + success snackbar. If the allowed list is empty (e.g. terminal), show "No further transitions available."
3. **Assign / Reassign** → opens a dialog: an Autocomplete of org users (fetch via `userAPI.getUsers({limit:200})`, same robust envelope handling as the wizard, fallback to current user), preselected to the current assignee; Save calls `leadAPI.assignLead(lead._id, userId)`, then `onRefresh()` + snackbar.
- **REMOVE** the Call / Send Email / WhatsApp / View Analytics / Generate Report items and their handlers (`handleCall`/`handleEmail`/`handleWhatsApp` and the two no-op handlers). Drop now-unused imports.

### 2.3 AI Profile Summary
Keep `<LeadEnrichmentCard lead={lead} onRefresh={onRefresh} />` rendered **directly below the top bar**, above the tabs (it's the "lead profile summary").

### 2.4 Tabs (replace the 4 tabs with 3)
1. **Overview** — concise: Lead Management essentials (assigned-to, created/updated, current status + priority), the **Channel Partner percentage card** (`<ChannelPartnerAttributionSummary attribution={lead.channelPartnerAttribution} />`) — this is the ONLY place CP appears now — and (optionally) the existing AI Insights talking-points content folded in as a card. **Remove** the duplicate Contact Information card (contact is in the top bar) and the duplicate Lead-Score card.
2. **Property Requirements** — the existing Property Requirements card content: budget range, unit type, project, floor preference (category label), facing, preferred amenities (chips), timeline. (This is the data removed from the top-bar key-metrics grid.)
3. **Follow-up** — the existing Follow-up management (current/scheduled follow-up + schedule dialog) AND the **Interactions** section nested in the same tab (the add-interaction form + interaction history that currently live in the separate Interactions tab). Use the new follow-up type options if the schedule dialog has a type select (call/email/meeting/text).

### 2.5 De-duplicate Channel Partner
- **Remove** the top-level CP banner card (the one rendered above the tabs when `channelPartnerAttribution.partners[0].channelPartner` exists) — its info now lives only in the Overview CP percentage card.
- Keep the **CP-proposed-status** banner (the accept/reject proposal UI) — that's a distinct, actionable element, not a duplicate.

### 2.6 Verify
- `npm run build` and `CI=true npm run build` → exit 0. Remove dead helpers/imports (getScoreLabel/getScoreColor, the removed handlers) so eslint-no-unused doesn't error. Warnings OK.
- **Commit** (`feat(leads): redesign lead detail page (clean top bar, 3 tabs, quick status/assign)` + co-author trailer).

---

## Task 3: Verification
- [ ] `CI=true npx react-scripts test src/utils/leadStatusMachine.test.js --watchAll=false` → pass.
- [ ] `npm run build` → succeeds.
- [ ] Manual (checkpoint): open a lead detail — top bar shows name/email/phone/source/priority/status (+research links if present), NO temperature; AI summary below; 3 tabs; CP only in the Overview percentage card; three-dots has Edit / Change Status (only valid next statuses) / Assign — and changing status + reassigning both persist and refresh.

## Self-Review (planning)
- Covers #23: simplified top bar ✓, AI summary placement ✓, Property Requirements tab ✓, Follow-up+Interactions ✓, CP de-dup (percentage card only) ✓, three-dots working Edit/Change-Status/Assign with dead actions removed ✓, no Hot/Warm/Cold ✓. Also #22-adjacent (no temperature). Convert-to-booking target fix is Phase 7. Status menu uses only valid next transitions (your choice).
- Placeholders: none.
- Consistency: `allowedNextStatuses`/`statusLabel` shared; `changeStatus`/`assignLead` match backend routes (`PATCH /:id/status`, `PUT /:id/assign`).

# Leads Refactor — Phase 4 (frontend): 3-Tab Create/Edit Wizard — Implementation Plan

> **For agentic workers:** This is a large React component refactor (CRA, MUI). It does not fit bite-sized TDD; it is a **target-spec** plan. Implement against the spec by reading the real files, then verify with `npm run build` (CRA compile + lint catches undefined refs / bad imports). Pure helpers get Jest unit tests.

**Goal:** Collapse the lead create/edit wizard from 4 tabs to **3** (Contact Information · Requirements · Lead Summary and Follow up), align every field to the new backend model (6 sources + source-detail toggle, Cr budget ladder with no min/max, category floors, 2 budget sources, occupancy-timeline→auto-priority, amenity catalog with "+ add", mandatory assignment, follow-up types Call/Email/Meeting/Text, "Follow-up Agenda"), remove the dead fields (priority dropdown, initial status, preferred location, special requirements, multi-project), and move project + assignment + notes into Requirements and research-sources into Contact.

**Repo:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend` (branch `feature/leads-developer-ready`). **Backend contract** (already shipped on the backend branch): `POST /api/leads` forces `status:'New'` and derives priority from `requirements.timeline` (ignores client priority/status); accepts `sourceDetail:{text, management:{contactName,note}}`; `budget.budgetSource ∈ {self_funded, bank_loan}`; `followUpType ∈ {call,email,meeting,text,...}`; `GET/POST /api/amenities` for the catalog.

**Files:**
- Create: `src/utils/leadForm.js` (pure: budget-range↔numbers, timeline→priority) + `src/utils/leadForm.test.js`.
- Modify: `src/pages/leads/CreateLeadPage.js` (reference implementation), `src/pages/leads/EditLeadPage.js` (mirror), `src/services/api.js` (add `amenityAPI`).

---

## Task 1: Shared pure helpers + tests

**Files:** Create `src/utils/leadForm.js`, `src/utils/leadForm.test.js`

- [ ] **Step 1: Write the test**

```js
// src/utils/leadForm.test.js
import { BUDGET_RANGES, budgetRangeToNumbers, TIMELINE_PRIORITY, priorityFromTimeline } from './leadForm';

describe('lead form helpers', () => {
  it('budget ladder starts at 1-5Cr, steps by 5Cr to 50Cr, then 50Cr+', () => {
    expect(BUDGET_RANGES[0]).toBe('₹1Cr - ₹5Cr');
    expect(BUDGET_RANGES).toContain('₹6Cr - ₹10Cr');
    expect(BUDGET_RANGES).toContain('₹46Cr - ₹50Cr');
    expect(BUDGET_RANGES[BUDGET_RANGES.length - 1]).toBe('₹50Cr+');
  });
  it('budgetRangeToNumbers maps to rupee min/max (1Cr = 1e7)', () => {
    expect(budgetRangeToNumbers('₹1Cr - ₹5Cr')).toEqual({ min: 10000000, max: 50000000 });
    expect(budgetRangeToNumbers('₹6Cr - ₹10Cr')).toEqual({ min: 60000000, max: 100000000 });
    expect(budgetRangeToNumbers('₹50Cr+')).toEqual({ min: 500000000, max: null });
    expect(budgetRangeToNumbers('nonsense')).toEqual({ min: '', max: '' });
  });
  it('priorityFromTimeline: immediate/1-3 → High, 3-6 → Medium, 6-12 → Low, 12+ → Very Low', () => {
    expect(priorityFromTimeline('immediate')).toBe('High');
    expect(priorityFromTimeline('1-3_months')).toBe('High');
    expect(priorityFromTimeline('3-6_months')).toBe('Medium');
    expect(priorityFromTimeline('6-12_months')).toBe('Low');
    expect(priorityFromTimeline('12+_months')).toBe('Very Low');
    expect(priorityFromTimeline('')).toBe('Very Low');
  });
});
```

- [ ] **Step 2: Run** `CI=true npx react-scripts test src/utils/leadForm.test.js --watchAll=false` → FAIL (module missing).

- [ ] **Step 3: Implement**

```js
// src/utils/leadForm.js
// Pure helpers shared by the lead create/edit wizard (2026-06 refactor).

// Budget ladder: 1-5Cr, then 5Cr steps to 50Cr, then 50Cr+. (1Cr = 10,000,000.)
export const BUDGET_RANGES = [
  '₹1Cr - ₹5Cr',
  '₹6Cr - ₹10Cr',
  '₹11Cr - ₹15Cr',
  '₹16Cr - ₹20Cr',
  '₹21Cr - ₹25Cr',
  '₹26Cr - ₹30Cr',
  '₹31Cr - ₹35Cr',
  '₹36Cr - ₹40Cr',
  '₹41Cr - ₹45Cr',
  '₹46Cr - ₹50Cr',
  '₹50Cr+',
];

const CR = 10000000;
const BUDGET_RANGE_NUMBERS = {
  '₹1Cr - ₹5Cr': { min: 1 * CR, max: 5 * CR },
  '₹6Cr - ₹10Cr': { min: 6 * CR, max: 10 * CR },
  '₹11Cr - ₹15Cr': { min: 11 * CR, max: 15 * CR },
  '₹16Cr - ₹20Cr': { min: 16 * CR, max: 20 * CR },
  '₹21Cr - ₹25Cr': { min: 21 * CR, max: 25 * CR },
  '₹26Cr - ₹30Cr': { min: 26 * CR, max: 30 * CR },
  '₹31Cr - ₹35Cr': { min: 31 * CR, max: 35 * CR },
  '₹36Cr - ₹40Cr': { min: 36 * CR, max: 40 * CR },
  '₹41Cr - ₹45Cr': { min: 41 * CR, max: 45 * CR },
  '₹46Cr - ₹50Cr': { min: 46 * CR, max: 50 * CR },
  '₹50Cr+': { min: 50 * CR, max: null },
};

export const budgetRangeToNumbers = (range) => BUDGET_RANGE_NUMBERS[range] || { min: '', max: '' };

// Occupancy timeline → priority (mirrors backend utils/leadPriority.js).
export const TIMELINE_PRIORITY = {
  immediate: 'High',
  '1-3_months': 'High',
  '3-6_months': 'Medium',
  '6-12_months': 'Low',
  '12+_months': 'Very Low',
};

export const priorityFromTimeline = (timeline) => TIMELINE_PRIORITY[timeline] || 'Very Low';
```

- [ ] **Step 4: Run the test** → PASS. **Commit** (`feat(leads): wizard pure helpers (budget ladder, timeline→priority)` + co-author trailer).

---

## Task 2: api.js — add `amenityAPI`

**Files:** Modify `src/services/api.js`

- [ ] Add, immediately after the `export const leadAPI = { ... };` block (around line 558):

```js
// Org-scoped amenity catalog (2026-06 refactor) — powers the wizard autocomplete + "+ add".
export const amenityAPI = {
  getAmenities: () => api.get('/amenities'),
  createAmenity: (name) => api.post('/amenities', { name }),
  getAmenityDemand: () => api.get('/amenities/demand'),
};
```
- [ ] Verify it's exported and `api` (the axios instance) is the same one `leadAPI` uses. **Commit** (`feat(leads): amenityAPI client`).

---

## Task 3: CreateLeadPage — the 3-tab refactor (reference implementation)

**Files:** Modify `src/pages/leads/CreateLeadPage.js`

Read the file first. Apply ALL of the following. Verify with `npm run build` at the end.

### 3.1 Constants
- Replace `LEAD_SOURCES` with `['Channel Partner', 'Management', 'Direct', 'Referral', 'Marketing', 'Cold Calling']`.
- **Delete** `LEAD_PRIORITIES` (no priority dropdown) and the create-time use of `LEAD_STATUSES` (no initial status). Keep `PROPERTY_TYPES`, `TIMELINE_OPTIONS`, `FACING_DIRECTIONS`.
- Replace `BUDGET_RANGES` + `extractBudgetNumbers` usage by importing `BUDGET_RANGES`, `budgetRangeToNumbers`, `priorityFromTimeline` from `../../utils/leadForm` (delete the local `BUDGET_RANGES` array and local `extractBudgetNumbers`).
- Replace `FLOOR_PREFERENCES` with category-only labels: `[{value:'any',label:'Any Floor'},{value:'low',label:'Lower Floors'},{value:'medium',label:'Mid Floors'},{value:'high',label:'Higher Floors'}]`.
- Replace `BUDGET_SOURCES` with `[{value:'self_funded',label:'Self Funded'},{value:'bank_loan',label:'Bank Loan'}]`.
- Replace `FOLLOW_UP_TYPES` with `[{value:'call',label:'Call'},{value:'email',label:'Email'},{value:'meeting',label:'Meeting'},{value:'text',label:'Text'}]` (lowercase values — backend enum is lowercase).
- Replace `STEPS` with 3 entries: `Contact Information` (icon Person), `Requirements` (icon Home), `Lead Summary and Follow up` (icon Schedule). Remove the `Lead Details` step.

### 3.2 formData
- Remove `sourceDetails`; add `sourceDetail: { text: '', management: { contactName: '', note: '' } }` and `addSourceDetails: false` (the single toggle).
- Remove `priority`, `status`, `preferredLocation`, `interestedProjects`, and `requirements.floor.specific`, `requirements.specialRequirements`.
- `budget.budgetSource` default → `'self_funded'`; remove the min/max text inputs (keep `budget.min/max` in state, set them from the range via `budgetRangeToNumbers`).
- `followUpType` default → `'call'`. Keep `assignedTo` (default `user?.id || ''`), `project`, `notes`, research-sources, channelPartnerAttribution.

### 3.3 Validation (replace the three validators with two)
- `validateContactInfo`: keep firstName/phone/email/source checks (lastName optional is fine). Add: if `source === 'Channel Partner'` and the toggle is on, require ≥1 partner with shares summing to 100 (reuse existing CP validation if present).
- `validateRequirements`: require `project` (moved here), `budgetRange`, `requirements.timeline` (now drives priority — required), and `assignedTo` (mandatory assignment). Keep the property-types check if you keep that field.
- **Delete** `validateLeadDetails`. Update the step-index→validator wiring (step 0 → contact, step 1 → requirements, step 2 → no blocking validation / summary).

### 3.4 Tab 0 — Contact Information
- Fields: First/Last name, Phone, Email, **Source** (Select with the 6 sources).
- Replace the standalone "Source Details" text field AND the old CP-only toggle with ONE toggle **"Add source details"** (`formData.addSourceDetails`). When ON, render conditionally on `source`:
  - `Channel Partner` → the existing `<ChannelPartnerAttributionFields .../>` (firm + agent + share %).
  - `Management` → two fields bound to `sourceDetail.management`: "Promoter / investor / management contact" (contactName) and an optional "Note".
  - any other source → a single multiline "Source details" text bound to `sourceDetail.text`.
- **Move the Research Sources accordion here** (LinkedIn / company / article URLs) — it currently lives in the old Lead Details step.

### 3.5 Tab 1 — Requirements
- **Project** (single-select Autocomplete, **required**) — moved here from Lead Details. Remove the "Additional Interested Projects" multi-select entirely.
- Property types (keep), Unit type (keep).
- **Budget range** (Select from `BUDGET_RANGES`); on change set `budget.min/max` via `budgetRangeToNumbers`. **Remove the Minimum/Maximum Budget number inputs.**
- **Budget Source** (Select, 2 options).
- **Floor** (Select, category-only labels). Remove the "Specific Floor" number input.
- **Occupancy Timeline** (Select from `TIMELINE_OPTIONS`, **required**). Directly beneath it render a live **priority badge**: a `<Chip>` showing `priorityFromTimeline(formData.requirements.timeline)` with a helper caption like "Priority is set automatically from the occupancy timeline." (Colors: High=error, Medium=warning, Low=info, Very Low=default.)
- Facing (keep).
- **Amenities**: MUI Autocomplete `freeSolo multiple`, options loaded from `amenityAPI.getAmenities()` (load in the initial-data effect into a `catalogAmenities` state). When the user types a value not in the catalog and confirms, call `amenityAPI.createAmenity(value)` and add it to both the selection and the local catalog (so it appears for everyone next time). Selected values are stored in `requirements.amenities` (string[]). Show a small "+ Add \"X\"" affordance via the freeSolo create option.
- **Remove** Preferred Location and Special Requirements fields.
- **Assign To** (single-select Autocomplete from `salesTeam`, **required**) — moved here.
- **Notes** (multiline, optional) — moved here, placed at the bottom.

### 3.6 Tab 2 — Lead Summary and Follow up
- A read-only summary of the captured data (name, source (+detail), project, budget range, timeline + derived priority, assignee, amenities).
- Follow-up: keep the "Schedule follow-up" toggle; **Follow-up Type** Select (call/email/meeting/text); date/time; and rename the "Follow-up Notes" field label to **"Follow-up Agenda"** (keep the state key `followUpNotes`).

### 3.7 Payload (`leadData` in handleSubmit)
- **Remove** `priority` and `status` from the payload (backend forces New + derives priority).
- Replace `sourceDetails` with `sourceDetail: formData.addSourceDetails ? { text: formData.sourceDetail.text.trim() || undefined, management: source === 'Management' ? { contactName: ..., note: ... } : undefined } : undefined`. (Only send what's relevant to the chosen source. CP details still go via `channelPartnerAttribution` as today.)
- `budget`: `{ min, max }` from `budgetRangeToNumbers(formData.budgetRange)` (max may be null for 50Cr+); `budgetSource: formData.budget.budgetSource`; drop the manual min/max.
- `requirements`: drop `floor.specific` and `specialRequirements`; keep timeline (required), unitType, floor.preference, facing, amenities.
- `assignedTo: formData.assignedTo` (required — no `|| undefined`).
- `followUpSchedule.followUpType`: send the lowercase value as-is.
- Keep the channelPartnerAttribution block, enrichment block, qualificationStatus, engagementMetrics as today.

### 3.8 Verify
- `npm run build` → compiles with no errors. Fix any undefined refs (e.g. leftover `LEAD_PRIORITIES`, `extractBudgetNumbers`, `sourceDetails`, removed fields).
- **Commit** (`feat(leads): CreateLeadPage 3-tab wizard aligned to new model` + co-author trailer).

---

## Task 4: EditLeadPage — mirror the structure

**Files:** Modify `src/pages/leads/EditLeadPage.js`

Apply the SAME constant set, 3-tab structure, source-detail toggle, budget ladder, category floors, 2 budget sources, occupancy-timeline→priority badge, amenity catalog, mandatory **Assign To** (this page currently lacks it — add it), follow-up types, and "Follow-up Agenda". Differences from Create:
- Pre-populate from the loaded lead (including `sourceDetail`, `addSourceDetails` = whether any source detail / CP attribution exists).
- EditLeadPage MAY keep a **Status** select, but populate it from the new 7-status set and note that the backend enforces valid transitions (a 400 surfaces as a form error). (Full quick-status UX is Phase 5; here just don't send a removed status.)
- Map `budget.min/max` back to the matching `budgetRange` on load (find the range whose numbers match, else leave blank).
- Payload mirrors Task 3.7 (no priority; sourceDetail; derived budget; lowercase followUpType; assignedTo required).
- `npm run build` → clean. **Commit** (`feat(leads): EditLeadPage mirrors 3-tab wizard + Assign To` + co-author trailer).

---

## Task 5: Verification
- [ ] `CI=true npx react-scripts test src/utils/leadForm.test.js --watchAll=false` → pass.
- [ ] `npm run build` → succeeds (no eslint/compile errors).
- [ ] Manual (checkpoint): `npm start`, open Create Lead — confirm 3 tabs; the 6 sources; toggle reveals CP/Management/free-text per source; budget ladder (no min/max); category floors; timeline shows a live priority chip; amenities autocomplete + add-new; Assign To required; follow-up types Call/Email/Meeting/Text; "Follow-up Agenda"; submit creates a lead (status New, priority from timeline).

## Self-Review (planning)
- Covers #2 (sources), #3 (toggle + CP/Management detail), #4/#5 (budget ladder, no min/max), #7 (category floors), #8 (2 budget sources), #9 (timeline→priority, no priority dropdown), #10 (no location), #11 (amenity "+ add"; no special requirements), #12 (no initial status), #13/#20 (Assign To required, in Requirements), #14 (3 tabs; project+notes+assign in Requirements; research in Contact; Lead Details removed), #15 (tab rename), #16 (follow-up types), #17 ("Follow-up Agenda"). Detail page quick-status/assign + list/funnel + convert-to-booking + search bar are later phases.
- Placeholders: none — exact constants/payload given; JSX wiring is the implementer's, guided by the field map.

# Leads Refactor — Phase 7 (frontend): Search Bar Wiring + Convert-to-Booking Hardening — Implementation Plan

> **For agentic workers:** Verify with `npm run build`. The convert-to-booking blank page can't be reproduced headlessly (needs a running stack + auth) — this phase HARDENS the most likely causes; final confirmation is a manual checkpoint.

**Goal (two parts):**
1. **#1 Search:** turn the Cmd+K palette into a real natural-language-ish entity search wired to `GET /api/search` — live grouped results (Leads/Projects/Units/People) that navigate on select, dropping the static quick-**actions** list. (Optional "Ask AI" row routing to the copilot.)
2. **#18 Convert-to-Booking:** harden the lead→sale handoff so it can't land on an empty/blank form — direct-fetch the lead if it isn't in the preloaded list, and fix the permission mismatch so the button and its target route agree.

**Repo:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend` (branch `feature/leads-developer-ready`). Backend `GET /api/search?q=` is shipped (returns `{success, query, results:{leads,projects,units,people:[{type,id,label,sublabel,url}]}, total}`).

**Files:** `src/services/api.js`, `src/components/navigation/CommandPalette.js`, `src/pages/sales/CreateSalePage.js`, and (one line) `src/App.js` or the detail-page button guard.

---

## Task 1: api.js — `searchAPI`

- [ ] Add after `leadAPI` (or near it) in `src/services/api.js`:
```js
// Global entity search (2026-06 refactor) — backs the Cmd+K search bar.
export const searchAPI = {
  search: (q, params = {}) => api.get('/search', { params: { q, ...params } }),
};
```
- [ ] **Commit** (`feat(search): searchAPI client` + co-author trailer).

---

## Task 2: CommandPalette — wire live entity search

**Files:** `src/components/navigation/CommandPalette.js`

Read the file first. Today it filters two static arrays (`PAGES`, `ACTIONS`) locally. Change it to a real search:

- [ ] **2.1** Remove the `ACTIONS` array and all rendering of an "Actions" group (per #1: "I don't need to show any action"). KEEP `PAGES` but use it only as a small secondary "Go to page" group (navigating to a page by name is search, not an action).
- [ ] **2.2** Add state: `const [results, setResults] = useState({leads:[],projects:[],units:[],people:[]})`, `const [searching, setSearching] = useState(false)`. On `query` change, **debounce ~250ms** and when `query.trim().length >= 2` call `searchAPI.search(query)`; set `results` from `res.data.results` (guard envelope: `res?.data?.results || {leads:[],projects:[],units:[],people:[]}`). Clear results when query < 2 chars. Cancel/ignore stale responses (track a request id or use an AbortController; simplest: a ref counter so only the latest query's results are applied).
- [ ] **2.3** Render grouped results in this order, each group with a header and its items showing `label` + muted `sublabel`: **Leads**, **Projects**, **Units**, **People**, then a **Pages** group from the local `PAGES` filtered by `query`. Each result row, on click/Enter, does `navigate(item.url)` (for entity results) or `navigate(page.path)` (for pages) and closes the palette. Skip entity groups that are empty. Keep the existing keyboard up/down/Enter selection working across the flattened visible list.
- [ ] **2.4** Update the input placeholder to `"Search leads, projects, people…"`. Show a small spinner/"Searching…" while `searching`, and an "No results for ‘<query>’" empty state when a ≥2-char query returns nothing.
- [ ] **2.5 (optional Ask-AI row):** if the app has a copilot route/entry, add a final row `Ask AI: "<query>"` that routes there with the query (e.g. navigate to the copilot page or open the copilot panel). If no obvious copilot route exists, OMIT this row (do not invent one) and note it in the report.
- [ ] **2.6 Build** `CI=true npm run build` → exit 0 (remove now-unused ACTIONS-related imports). **Commit** (`feat(search): Cmd+K palette does live entity search via /api/search` + trailer).

---

## Task 3: Convert-to-Booking hardening

**Files:** `src/pages/sales/CreateSalePage.js`, and the permission guard (`src/App.js`)

- [ ] **3.1 Direct-fetch fallback for the lead.** In `CreateSalePage.js`, the `leadId` hydration effect (~lines 3251–3275) only pre-fills if the lead is found in the preloaded `leads` list (`leads.find(...)`); if it isn't (e.g. the lead is filtered out of `getLeads({limit:1000})`, or assigned to another user), it silently no-ops → empty customer step. Add a fallback: when `leadIdParam` is set but `sourceLead` is not found in `leads`, call `leadAPI.getLead(leadIdParam)`, and on success use that lead for `setSelectedCustomer(...)` + the same CP-attribution hydration. Guard with the existing `hydratedFromLead` flag and a try/catch (non-fatal). Keep it from looping (only attempt the direct fetch once).

Sketch (adapt to the actual code):
```js
useEffect(() => {
  if (hydratedFromLead) return;
  const leadIdParam = searchParams.get('leadId');
  if (!leadIdParam) return;
  // Wait for the list to load before deciding it's "not in the list".
  if (loading.leads) return;

  const applyLead = (sourceLead) => {
    if (!sourceLead) return;
    setSelectedCustomer(sourceLead);
    if (sourceLead.channelPartnerAttribution?.viaChannelPartner === true) {
      const cleanPartners = (sourceLead.channelPartnerAttribution.partners || [])
        .filter((p) => p && p.channelPartner)
        .map((p) => ({
          channelPartner: p.channelPartner?._id || p.channelPartner,
          agent: p.agent?._id || p.agent || null,
          agentUser: p.agentUser?._id || p.agentUser || null,
          sharePct: Number(p.sharePct) || 0,
        }));
      setChannelPartnerAttribution({ viaChannelPartner: true, partners: cleanPartners });
    }
    setHydratedFromLead(true);
  };

  const inList = (leads || []).find((l) => String(l._id) === String(leadIdParam));
  if (inList) { applyLead(inList); return; }

  // Not in the preloaded list — fetch it directly.
  let cancelled = false;
  (async () => {
    try {
      const res = await leadAPI.getLead(leadIdParam);
      const lead = res?.data?.data || res?.data;
      if (!cancelled) applyLead(lead);
    } catch (e) {
      console.warn('[CreateSale] could not load source lead', leadIdParam, e?.message);
      if (!cancelled) setHydratedFromLead(true); // stop retrying
    }
  })();
  return () => { cancelled = true; };
}, [leads, searchParams, hydratedFromLead, loading.leads]);
```
(Use the file's actual `loading` shape — it's `loading.leads`.)

- [ ] **3.2 Permission-guard alignment.** The Convert-to-Booking button on the lead detail page is shown to `canAccess.leadManagement()` users, but the `/sales/create` route (`src/App.js` ~line 832) requires `canAccess.salesPipeline()`. A lead-manager without sales-pipeline access is bounced. Align them: change the `/sales/create` route guard to allow EITHER, e.g.:
```js
<ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.leadManagement()}>
```
(Only widen this one route; do not touch other sales routes. If `canAccess.leadManagement` doesn't exist, use the same predicate the detail-page Convert button uses — read it from `LeadDetailPage.js` — so the button and route always agree.)

- [ ] **3.3 Build** `CI=true npm run build` → exit 0. **Commit** (`fix(leads): robust lead→sale hydration + aligned convert-to-booking permission` + trailer).

---

## Task 4: Verification
- [ ] `CI=true npm run build` → exit 0.
- [ ] Manual (checkpoint, needs running stack): (a) Cmd+K, type a lead name → grouped live results → selecting navigates to the lead; typing a status keyword (e.g. "qualified") surfaces matching leads; no quick-action buttons. (b) From a lead detail, "Convert to Booking" lands on the sale form WITH the customer pre-selected (and CP attribution inherited) — no blank/empty page.

## Self-Review (planning)
- #1: live entity search wired to `/api/search`, grouped results, navigates on select, static ACTIONS removed, pages kept as nav. #18: direct-fetch fallback removes the empty-form failure mode; permission alignment removes the bounce. The blank-page root cause (if a render crash) can only be confirmed live — flagged honestly; ask the user what they observe if it persists.
- Placeholders: none (Ask-AI row is explicitly optional/omittable).

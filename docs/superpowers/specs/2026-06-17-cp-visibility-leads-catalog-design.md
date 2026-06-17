# Channel-Partner Visibility in the Leads Workspace Catalog — Design Spec

**Date:** 2026-06-17
**Status:** Draft for review
**Phase:** 1 of 3 of the "CP + leadership lens" enhancement (this spec = CP visibility on Leads rows). Phases 2 (group-by rollups) and 3 (CP de-tagging workflow) are scoped at the end as future work, not built here.
**Repos:** `propvantage-ai-backend` (engine + Leads catalog), `propvantage-ai-frontend` (no UI change required beyond what already ships — columns/labels render generically).

---

## 1. Problem & Intent

A Business/Site/Org Head wants to answer questions like *"which channel-partner leads haven't been followed up in 20 days, and who is on them (the CP firm and our internal owner) so I can chase the right person?"* The data exists on the `Lead` (`channelPartnerAttribution.partners[]` + `assignedTo`), but the Workspace **Leads catalog** doesn't expose channel-partner fields, so a card can't show *which* CP or filter on CP presence/staleness precisely.

**Goal (this phase):** add lead-level channel-partner fields to the Leads catalog so users can build cards that **show the CP firm(s) + CP-side agent + internal owner per row** and **filter on "has a CP tagged", CP attribution status, and a CP-only "days since CP follow-up."** Combined with the existing AND filter builder, this delivers the 20/30/45-day escalation and "who to chase" views.

### Success criteria
- A Leads card can display columns: **Channel Partner** (firm name, joined when multiple), **CP Agent** (CP-side user), **CP status**, **Days since CP follow-up**, and **Assigned To** (internal owner, already resolved to a name).
- A user can build (pure AND): `has a CP tagged` **AND** `Days since CP follow-up ≥ 20` → the stale-CP list, showing CP + owner.
- "Days since CP follow-up" means **CP-side only** (no fallback to internal/created date); it is null/blank for leads with no CP touch, so the filter only matches genuine CP leads.

### Non-goals (this phase)
- Filtering by a **specific** CP firm (needs a ref **picker** in the builder — same gap as the existing `assignedTo` ref-picker note; until then CP filtering is "has CP / no CP" + status + stale-days).
- **Per-partner** granularity (a lead with N CPs stays one row; staleness = most recent CP touch across partners).
- **Group-by / rollups** (phase 2) and the **de-tagging action** (phase 3).

---

## 2. Approach

Extend the **Leads catalog** and add **array-ref label resolution** to the query engine. No new collections, no Lead write-path changes. This reuses the catalog + engine + frontend rendering already shipped; the only genuinely new engine capability is resolving an **array** of refs (a lead's multiple CP firms/agents) into one joined label, alongside the single-ref resolution that already exists for `assignedTo`.

*(Rejected alternatives: a denormalized `cpSummary` on the Lead maintained by hooks — premature optimization, needs backfill; per-partner row explosion — deferred to phase 3 with the de-tag action.)*

---

## 3. Data Sources (verified in `models/leadModel.js`)

- `channelPartnerAttribution.viaChannelPartner` (Boolean) and `channelPartnerAttribution.partners[]` — each entry: `channelPartner` (ref `ChannelPartner` → `firmName`), `agentUser` (ref `User`), `agent` (ref `ChannelPartnerAgent`), `sharePct`.
- `channelPartnerAttribution.status` enum: `tagged | pending | approved | rejected`.
- `channelPartnerAttribution.history[]` — `{ at, by, action, note }`; `max(history.at)` = last CP-side touch.
- `assignedTo` (ref `User`) — internal owner (exec/manager).
- `engagementMetrics.lastInteractionDate`, `statusHistory[].changedAt` — internal-side activity (used only for the optional general-staleness field).

---

## 4. New / Changed Leads Catalog Fields

| Key | Label | Type | Operators (filter) | Display | Mongo source |
|---|---|---|---|---|---|
| `channelPartner` | Channel Partner | ref (array) | `isEmpty`, `isNotEmpty` | yes (joined `firmName`s) | `channelPartnerAttribution.partners[].channelPartner` → `ChannelPartner.firmName` |
| `cpAgent` | CP Agent | ref (array) | — (display only) | yes (joined User names) | `partners[].agentUser` → `User.firstName/lastName` |
| `cpStatus` | CP status | enum | `is`, `in`, `notIn` | yes | `channelPartnerAttribution.status` |
| `daysSinceLastCPFollowUp` | Days since CP follow-up | number (derived) | `gt, lt, gte, lte, between` | yes | **CP-only** = `dateDiff(max(history.at), now)`; **null** when no CP history (no fallback) |
| `daysSinceLastActivity` | Days since last activity | number (derived) | `gt, lt, gte, lte, between` | yes | general staleness = `dateDiff(max(history.at, lastInteractionDate, statusChangedAt, createdAt), now)` |
| `assignedTo` | Assigned To | ref | (existing) | yes (name — already resolved) | `assignedTo` → `User` (unchanged) |

**Filter semantics:**
- `channelPartner isNotEmpty` ⇒ "has a CP tagged" via `{ 'channelPartnerAttribution.partners.0': { $exists: true } }`; `isEmpty` ⇒ `{ 'channelPartnerAttribution.partners.0': { $exists: false } }`. (Use array-element existence, not `viaChannelPartner`, which can be stale.)
- `cpStatus` filters `channelPartnerAttribution.status`.
- `daysSinceLastCPFollowUp` materialises only the CP history max; rows with no CP history get **null** (excluded by `≥ N`, shown as "—").

**Display:** `channelPartner` and `cpAgent` are **array refs**; the engine resolves each partner's `firmName` / user name and joins them (e.g. "Acme Realty, BlueKey"). `cpAgent` is display-only (no value picker needed).

---

## 5. Engine Change — array-ref label resolution

The engine already resolves single refs (`assignedTo` → `assignedTo_label`) via `$lookup` + a label expression, stripping the `__`-prefixed temp. Extend `buildDisplayStages` so a ref field marked as an **array ref** (a new descriptor flag, e.g. `refArray: true` with a nested `refPath` like `channelPartnerAttribution.partners.channelPartner`) is resolved by:
1. `$lookup` from the ref model's collection using the array of ids at `refPath` (localField = the nested array path; MongoDB matches across the array) into a `__<key>_docs` temp.
2. `$addFields` `<key>_label` = the `firmName`/name of each looked-up doc joined with ", " (e.g. `$reduce`/`$concat` over the docs, or `$reduce` building a comma-joined string), trimmed.
3. The `__<key>_docs` temp is stripped by the existing `__`-prefix cleanup; `<key>_label` survives and the frontend (already) prefers it.

Single-ref resolution stays as-is. The frontend `WorkspaceCardView` needs no change — it already renders `row[`${key}_label`] ?? value ?? '—'`.

**Semantic fix to `daysSinceLastCPFollowUp`:** change its `addFields()` to use **only** `max(channelPartnerAttribution.history.at)` (no `$ifNull` fallback to `lastInteractionDate`/`createdAt`), so non-CP leads yield `null`. Update its unit test accordingly. Introduce `daysSinceLastActivity` as the general field that keeps the old fallback behaviour (renamed honestly).

---

## 6. Example cards this enables (pure AND)

- **Stale CP leads (chase list):** `channelPartner isNotEmpty` AND `daysSinceLastCPFollowUp gte 20` → columns: Channel Partner, CP Agent, Assigned To, Days since CP follow-up, Status. Sort by days desc.
- **De-tag candidates (warn the CP):** same with `gte 45`.
- **Hot leads going cold:** `score gte 80` AND `daysSinceLastCPFollowUp gte 15`.
- **CP leads still pending approval:** `cpStatus is pending`.

---

## 7. Testing

- **Backend unit (engine):** seed a `ChannelPartner` (firmName) + a `User` (CP agent) + leads with `channelPartnerAttribution.partners` referencing them and `history[].at` values; assert (a) `channelPartner_label` is the joined firm name(s); (b) `cpAgent_label` resolves; (c) `daysSinceLastCPFollowUp` is the CP-only day delta and is **null** for a lead with no CP history; (d) `channelPartner isNotEmpty/isEmpty` filters correctly; (e) a multi-partner lead joins both firm names. Update the existing `daysSinceLastCPFollowUp` test to the CP-only (no-fallback) semantics.
- **Backend unit (catalog):** the new fields exist with the right types/operators/enums; `cpStatus` enum matches the model.
- **Frontend:** no new logic; confirm build + the existing `WorkspaceCardView` smoke test still pass (label rendering already covered).
- **Live:** build a "Stale CP leads ≥20d" card on the demo org and confirm Channel Partner + CP Agent + Assigned To columns populate with names and the days value is CP-only.

---

## 8. Future phases (scoped, not built here)

- **Phase 2 — Group-by rollups:** extend metric mode with a `groupBy` dimension (e.g. CP firm, assignee, status) returning a breakdown (`{ label, value }[]`) rendered as a small table/bar — e.g. "stale-lead count per CP firm." Engine `$group` + a new render mode + builder UI.
- **Phase 3 — CP de-tagging workflow:** add a `removed` lifecycle to `channelPartnerAttribution` (status/`removedAt`/`removedBy` + a `removed` history action) and a `PATCH /api/leads/:id/partners/:cpId/untag` endpoint with permissions + audit, surfaced as an action on the stale-CP card. Per-partner granularity likely lands here.

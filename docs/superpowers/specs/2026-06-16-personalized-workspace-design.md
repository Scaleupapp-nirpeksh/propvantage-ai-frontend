# Personalized "My Workspace" Dashboards — Design Spec

**Date:** 2026-06-16
**Status:** Draft for review
**Repos:** `propvantage-ai-frontend` (React 18 + MUI + Context), `propvantage-ai-backend` (Node/Express + MongoDB/Mongoose)

---

## 1. Problem & Intent

Every persona in PropVantage cares about a different daily slice of the system. A sales manager wants leads where the channel partner's last follow-up was ≥15 days ago; a finance user wants bookings stuck in a payment state; a CP manager wants their team's stale prospects. Today the app ships **5 hardcoded role dashboards** and list pages whose filters live only in the URL — there is no way for a user to assemble and keep their own "what I care about" view across modules.

**Goal:** let each user build a personal **Workspace** of saved, filtered **Cards** drawn from any module, authored either through a curated filter builder or natural language, and optionally share cards with teammates or a role.

### Success criteria
- A user can express the example query — *"leads where the channel partner's last follow-up was ≥15 days ago"* — both by building it (curated fields + smart operators) and by typing it in plain English, and pin the result as a card.
- A card renders as a **live list** or a **metric**, and the user can arrange cards on a personal board.
- "My Workspace" is the default landing page; the 5 role dashboards remain available.
- Every query is automatically scoped to the viewer's org, accessible projects, and permissions — including for shared cards.

### Non-goals (v1)
- Inline actions from cards (logging follow-ups, status changes) — v1 is **view + drill to detail** only.
- OR / nested boolean logic in the filter builder (schema leaves room; AND-only for v1).
- Auto-refresh on an interval — v1 is **on-load + manual refresh**.
- Admin-published role templates as a managed feature (sharing to roles covers the near-term need; managed templates are a later phase).

---

## 2. Core Concept — Two Front-Doors, One Engine

A **Card** is a saved, filtered query over **one module** (Leads, Sales/Bookings, Payments, Tasks, Channel Partners), rendered as a **list** or a **metric**. Cards are authored two ways, both of which produce the *same* artifact — a validated **Query Plan**:

1. **Curated builder** — field → operator → value rows, including derived/relative fields.
2. **Natural language** — the user types a sentence; Claude compiles it into a Query Plan; the user previews and edits before saving.

This shared Query Plan is the seam that keeps NL safe, explainable, and editable, and lets both authoring modes (and the reporting NLI agent) run through one engine.

---

## 3. The Query Engine (Backend — the heart)

A single server-side module:

```
run(queryPlan, module, viewerContext) -> { rows } | { value, breakdown }
```

### 3.1 Field Catalog (per module)
A declarative registry. For each module it lists the filterable/selectable fields, each declaring:
- `key`, `label`, `type` (`string | number | date | enum | ref | boolean`)
- `operators` allowed for that field
- `enumValues` (for enum fields — pulled from existing model enums, e.g. Lead status)
- a **mapper**: how the field + operator + value becomes a Mongo aggregation fragment

**Derived fields** are first-class catalog entries implemented as aggregation stages — this is what powers the headline example:
- `daysSinceLastCPFollowUp` (Leads) — from follow-up / status history
- `daysInCurrentStatus` (Leads, Sales)
- `assignedToMe` (Leads, Tasks) — resolves against `viewerContext.userId`
- `daysOverdue` (Payments, Tasks)
- `commissionPending` (Sales/CP)

The catalog is an **allow-list**: only registered fields are queryable. "Reaches any data" is achieved by *growing the catalog*, not by arbitrary collection access. New fields are a small, safe, reviewable addition.

### 3.2 Operators (v1)
`is / in / notIn`, `>`, `<`, `>=`, `<=`, `between`, `lastNDays`, `isEmpty / isNotEmpty`, `contains` (string). Conditions combined with **AND**. Query Plan schema reserves a `logic` field so `OR`/grouping can be added later without a data migration.

### 3.3 Query Plan shape
```jsonc
{
  "module": "leads",
  "logic": "AND",
  "filters": [
    { "field": "source", "op": "is", "value": "Channel Partner" },
    { "field": "daysSinceLastCPFollowUp", "op": ">=", "value": 15 }
  ],
  "sort": { "field": "daysSinceLastCPFollowUp", "dir": "desc" },
  "limit": 50,
  "nlSource": "leads where the CP hasn't followed up in 15 days"  // optional, for traceability
}
```

### 3.4 Security & scoping (critical)
Every run is re-scoped to the **viewer**, never the author:
- `organization = viewerContext.organization`
- project filter from `viewerContext.accessibleProjectIds` (skipped for owners)
- module-level permission check (a user can only build/run cards over data they can already access)

A **shared card re-executes under each recipient's own scope**, so sharing can never expose data a recipient couldn't already see. This reuses the existing `authMiddleware` request enhancements (`req.userPermissions`, `req.accessibleProjectIds`, `req.isOwner`).

### 3.5 Render modes
- **list** → engine returns rows (projected to the columns the catalog marks displayable); frontend renders with the existing `DataTable`, with a count badge.
- **metric** → engine returns an aggregate (`count` for v1; `sum`/`avg` over a numeric field as a near extension) plus an optional small breakdown; frontend renders with the existing `KPICard`.

---

## 4. Natural-Language Layer

`POST /api/workspace/nl-to-queryplan` → `{ text, module? }`
- Claude (`@anthropic-ai/sdk`, already wired) is given the relevant module's Field Catalog as a structured schema/tool and must return a Query Plan referencing only catalog fields.
- The result is **validated against the catalog**; unknown fields/operators trigger a clarification rather than a guess.
- The user always sees the compiled filter and can edit it in the curated builder before saving. NL is an **authoring assist**, not a live black box.
- **Shared infrastructure:** this is the same catalog + plan + engine the reporting NLI agent uses (see noted reporting direction) — built once, consumed by both.

---

## 5. Data Model (new collections)

Cards are shareable, so they live in their own collections rather than `User.preferences`.

### `WorkspaceCard`
```jsonc
{
  "_id": "ObjectId",
  "organization": "ObjectId",      // tenant boundary
  "ownerId": "ObjectId",           // creator
  "title": "string",
  "module": "leads | sales | payments | tasks | channelPartners",
  "queryPlan": { /* §3.3 */ },
  "renderMode": "list | metric",
  "metricConfig": { "agg": "count", "field": null },   // for metric mode
  "visibility": "private | shared",
  "sharedWithUsers": ["ObjectId"],
  "sharedWithRoles": ["string"],   // role names, e.g. "Sales Manager"
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `WorkspaceLayout` (one per user)
```jsonc
{
  "organization": "ObjectId",
  "userId": "ObjectId",
  "items": [ { "cardId": "ObjectId", "order": 0, "size": "sm | md | lg" } ]
}
```

A card shared **to** a user appears in a **"Shared with me"** tray; the user explicitly adds it to their layout. The layout is always personal, even when it references a shared card. Deleting/un-sharing a card removes it from recipients' trays and layouts gracefully.

---

## 6. Frontend

- **Routing:** new route `/workspace`; `DashboardRouter` defaults post-login to it. The 5 role dashboards remain reachable from nav (`getNavigationItems`).
- **Board:** a grid of cards arranged with `@dnd-kit` (already a dependency); order/size persisted to `WorkspaceLayout`.
- **Cards:** list cards reuse `DataTable`; metric cards reuse `KPICard`. Each card fetches its own data via `POST /api/workspace/cards/:id/data` (or runs its plan).
- **Card Builder dialog:**
  - Step 1: choose module (drives catalog fetch).
  - Step 2: two tabs — **Builder** (field/operator/value rows from the catalog) and **Ask in words** (NL input → compiled plan shown in the Builder).
  - **Live preview** of matching rows/metric before saving.
  - Choose render mode → save → sharing settings (private / specific users / roles).
- **Empty state:** seed **role-based starter cards** so a new user lands on something useful immediately (e.g. Sales Manager → "Stale CP leads", "Bookings pending approval", "My team's site visits this week").
- **State:** a `WorkspaceContext` (consistent with existing Context-based architecture) or per-card fetch hooks; cards refresh on load + manual refresh button (per card and board-level).

---

## 7. API Surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/workspace/catalog/:module` | Field catalog that drives the builder UI |
| POST | `/api/workspace/nl-to-queryplan` | Compile NL text → validated Query Plan |
| POST | `/api/workspace/preview` | Run a Query Plan without saving (builder live preview) |
| GET | `/api/workspace/cards` | List the user's own + shared-with-them cards |
| POST | `/api/workspace/cards` | Create a card |
| PUT | `/api/workspace/cards/:id` | Update a card (owner only) |
| DELETE | `/api/workspace/cards/:id` | Delete a card (owner only) |
| POST | `/api/workspace/cards/:id/data` | Run a saved card under the viewer's scope |
| GET | `/api/workspace/layout` | Get the user's layout |
| PUT | `/api/workspace/layout` | Save card order/sizes |

All endpoints protected by existing `protect` + permission middleware. Card data endpoints re-scope to the viewer (§3.4).

---

## 8. Phasing

1. **Engine + catalog (all 5 modules)** — Query Plan schema, catalog registry, aggregation mappers incl. derived fields, viewer-scoped execution, unit tests on scoping/derived fields.
2. **Curated builder + board** — `/workspace`, card CRUD, layout, dnd arrangement, list/metric render, preview, role-based starter cards.
3. **Sharing** — visibility model, "Shared with me" tray, recipient-scoped re-execution.
4. **Natural language** — `nl-to-queryplan`, validation/clarification loop, "Ask in words" tab; align with reporting NLI agent.

---

## 9. Risks & Open Questions

- **Catalog maintenance:** derived fields couple to model internals (follow-up/status history). Keep mappers co-located with the catalog and unit-tested so model changes surface fast.
- **Query cost:** derived/aggregation fields can be heavy. Cap `limit`, index the underlying fields, and consider a short server cache keyed on `(plan, viewerScope)` if needed.
- **NL trust:** mitigated by always compiling to an editable plan and validating against the catalog; never execute raw model output.
- **Metric aggregations beyond count:** v1 ships `count`; `sum`/`avg` are a small near extension — confirm whether needed at launch.
- **Sharing to roles vs users churn:** when a user changes role or leaves, role-shared cards should resolve dynamically at read time (by current role), not be denormalized onto recipients.
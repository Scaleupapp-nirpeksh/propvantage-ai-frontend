# Unified "My View" with Standard Toggle (Theme C) — Design Spec

**Date:** 2026-06-17
**Status:** Approved ("go ahead")
**Scope:** Frontend only. Collapses the two separate landings (My View board + role Dashboard) into one page with a mode toggle, and surfaces dashboard-derived suggested cards. Themes B (layout/density) and D (Projects/forecast catalogs, field-picker) are separate.

## Decisions (approved)
- Standard mode **reuses the existing role dashboard inline** (no rebuild).
- Second mode is labelled **"Standard"** → toggle reads `[ My View | Standard ]`.
- Dashboard insights surface as **suggested cards** in My View — empty state **and** a "+ Suggested" affordance when the board already has cards.

## Design

### One page, one nav item
`/workspace` ("My View") is the single home. A slim **segmented toggle** sits at the top of the page: `[ My View | Standard ]`.
- **My View** (default): the existing personal board — `SharedWithMeTray` + empty-state/suggested + `WorkspaceBoard` + "Add card".
- **Standard**: renders the user's **role dashboard inline** via a new `RoleDashboard` component. Each mode renders its own heading, so there's no double header (in Standard mode the My View `PageHeader` title/actions are hidden; the toggle stays visible in a slim bar, and the role dashboard shows its own "Executive Dashboard"/etc. header below).

### `RoleDashboard` component (extraction)
Create `src/pages/workspace/RoleDashboard.js` containing the role→dashboard selection currently inside `App.js`'s `DashboardRouter.getDashboardComponent()` (roleLevel / `isOwner` / `checkPerm` / legacy `user.role` → `BusinessHeadDashboard` | `ProjectDirectorDashboard` | `SalesManagerDashboard` | `FinanceHeadDashboard` | `SalesExecutiveDashboard`). Import those dashboards there (lazy or direct, matching App.js). `WorkspacePage` Standard mode renders `<RoleDashboard />`.

### Toggle state + persistence
- Source of truth on load: `?view=` query param (`my` | `standard`); else `localStorage['pv.viewMode']`; else default `my`.
- Toggling updates **both** the `?view=` query (via `useSearchParams`, `replace`) and `localStorage['pv.viewMode']`, so the choice sticks and is shareable.

### Routing + nav cleanup (`App.js`, `DashboardLayout.js`)
- **Remove** the separate "Dashboard" nav item from `getNavigationItems` (keep the single "My View" item → `/workspace`).
- `/dashboard` route → `<Navigate to="/workspace?view=standard" replace />` (preserves logo / 404 / `navigate('/dashboard')` links → they land in Standard mode). `DashboardRouter` is no longer used for `/dashboard`; its CP-org guard moves into `WorkspacePage`.
- **Channel-partner-org guard:** `WorkspacePage` redirects `isChannelPartnerOrg` users to `/partner/dashboard` (mirrors the old `DashboardRouter` guard) so CP users never see the developer board.
- Root `/` redirect stays `→ /workspace` (Theme A). Post-login default stays `/workspace`.

### Suggested cards (dashboard-derived)
Extend `src/pages/workspace/starterCards.js`:
- Add a `metricSumCard(title, module, field, filters)` helper (`metricConfig:{agg:'sum', field}`) — the backend supports sum/avg over a catalog numeric field.
- Add a **dashboard-derived suggested set** the engine can produce today, curated per role + generic, e.g.:
  - *Revenue booked (90d)* — sales, metric **sum** `salePrice`, `bookingDate lastNDays 90`.
  - *Bookings (30d)* — sales, metric count, `status is Booked` + `bookingDate lastNDays 30`.
  - *Payments received (30d)* — payments, metric count, `status in [completed, cleared]` + `paymentDate lastNDays 30`.
  - *Stale CP leads (20d)* — leads, list, `channelPartner isNotEmpty` + `daysSinceLastCPFollowUp gte 20`.
  - *Overdue tasks* — tasks, list, `daysOverdue gt 0`, sort `daysOverdue desc` (avoids a future-date window, which `lastNDays` can't express).
  - (Project-/forecast-based KPIs are **not** expressible yet — they remain in Standard mode; Theme D adds them.)
- Surface: keep the empty-state "Add suggested cards"; add a compact **"+ Suggested"** button (My View mode, when `boardCount > 0`) opening a small picker listing suggested cards **not already on the board**, each with an Add action (reuse `createCard` + `addToBoard`).

## Non-goals
- No forecast/Projects cards (Theme D). No per-card sizing/scroll (Theme B). No backend changes. No URL rename.

## Testing / verification
- `CI=true npm run build` compiles; ESLint clean on touched files.
- Live (demo org): single "My View" nav item; toggle switches between the board and the role dashboard inline; choice persists across reload (`?view=` + localStorage); `/dashboard` redirects to `/workspace?view=standard`; "+ Suggested" adds a dashboard-derived card; CP-org user is redirected to `/partner/dashboard`.

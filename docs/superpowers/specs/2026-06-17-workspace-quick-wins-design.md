# Workspace Quick Wins (Theme A) — Design Spec

**Date:** 2026-06-17
**Status:** Approved (user said "go ahead")
**Scope:** Frontend-only polish bundle for the workspace. Part of a larger feedback set; Themes B (board layout/density), C (unified "My View" + toggle), and D (Projects/forecast catalogs + field-picker) are separate, later specs.

## Changes

1. **Rename "My Workspace" → "My View"** (label-only; the `/workspace` route is unchanged to avoid breaking the landing/deep-links).
   - `DashboardLayout.js` nav item title → "My View".
   - `WorkspacePage.js` `PageHeader` title → "My View"; empty-state heading "Build your workspace" → "Build your view" (keep the helper copy).

2. **Card Builder opens on the natural-language tab by default, renamed "Describe the Cards".**
   - `CardBuilderDialog.js`: rename the "Ask in words" tab label → "Describe the Cards".
   - Default the active tab to the NL tab **when creating a new card** (`!card`/no existing plan); when **editing** an existing card, default to the **Builder** tab (the filter already exists).

3. **Row → detail navigation fix (item 4).** Verified the route map: `leads`→`/leads/:leadId`, `sales`→`/sales/:saleId`, `tasks`→`/tasks/:taskId`, `channelPartners`→`/channel-partners/:id` are all **correct** with `row._id`. **Only `payments` is wrong:** `/payments/plans/:saleId` expects a *sale* id but receives the PaymentTransaction `_id`. Fix: for payments, navigate to `/payments/plans/${row.sale}` (the transaction's `sale` ref; the engine returns full docs so `row.sale` is present). If `row.sale` is missing, no-op.
   - Implementation: `detailRouteFor(module, row)` takes the **row** (not just id); payments uses `row.sale`, all others use `row._id`. Update the `WorkspaceCardView` call site accordingly.

4. **Shrink the AI Copilot FAB (item 8).** In `src/components/copilot/CopilotFAB.js`, reduce the floating button + icon size (icon `fontSize: 24` → smaller; button dimensions reduced proportionally). Label/behavior unchanged ("just shrink it").

## Non-goals
- No URL/route rename. No backend changes. No board-layout, unified-view, Projects/forecast, or field-picker work (Themes B/C/D).

## Testing / verification
- `CI=true npm run build` compiles; ESLint clean on touched files.
- Live (demo org): nav + header read "My View"; opening "Add card" shows the "Describe the Cards" tab first; a payments list-card row opens the correct sale's payment plan; leads/sales/tasks/CP rows open their detail pages; the AI FAB is visibly smaller.

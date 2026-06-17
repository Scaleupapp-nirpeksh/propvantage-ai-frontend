# Insight Cards (Theme D3) — Design Spec

**Date:** 2026-06-17
**Status:** Approved (4 sources, rich card)
**Scope:** A new workspace card type that surfaces the backend's existing **predictive + budget analytics** as forecast/insight cards. No new ML — it normalizes four existing services into one card renderer.

## Sources (v1 — all four)
| Source key | Backed by | Headline | Bands | Series | Bullets |
|---|---|---|---|---|---|
| `salesForecast` | `generateSalesForecast` (service, already exported) | Total forecasted bookings | Pessimistic / Realistic / Optimistic (scenarios) | monthly `forecastedSales` | `insights` + `recommendations` |
| `revenueProjection` | `calculateRevenueProjection` (extract→service) | Total projected revenue (₹) | scenarios | monthly `projectedRevenue` | derived assumptions note |
| `leadConversion` | `calculateLeadConversionProbabilities` (extract→service) | Conversion probability (%) | High / Medium / Low prob counts | — | summary counts + top-lead note |
| `budgetVsActual` | `calculateBudgetVsActual` (service, already exported) | Revenue actual (₹) | Target / Actual / Variance% | revenue monthly trend if present | `summary.overallStatus` + alerts |

## Normalized payload (one shape, one renderer)
```
{
  kind: 'forecast' | 'comparison',
  headline: { label, value, format },          // format: 'currency'|'number'|'percent'
  bands: [ { label, value, format, tone? } ],  // forecast→3 scenarios; comparison→target/actual/variance
  confidence: { label, level } | null,         // level: 'high'|'medium'|'low'
  series: [ { label, value } ] | null,         // monthly points for the sparkline
  bullets: [ string ],                         // insights / recommendations / status notes (max ~4)
  asOf: ISO string,
  scope: { period, projectId|null, projectLabel? }
}
```

## Backend (`propvantage-ai-backend`)
1. **DRY refactor:** move `calculateRevenueProjection` and `calculateLeadConversionProbabilities` from `controllers/predictiveController.js` into `services/predictiveAnalyticsService.js` and export them; update the controller to import them. Behavior unchanged (the controller keeps passing the same args). This makes them reusable by the workspace insight service.
2. **`services/workspace/insightSources.js`** (new) — a registry keyed by source. Each entry: `{ key, label, kind, params, permission, run(viewerCtx, cfg) → normalizedPayload }`.
   - `params` declares the controls a source accepts: `period` (`3_months|6_months|12_months` for forecast/revenue; `current_year|current_month|ytd` for budget) or `timeframe` (`7_days|30_days|90_days` for leadConversion), plus `projectScope` (always).
   - `run` calls the underlying service with `{ organizationId: viewerCtx.organization, projectId: cfg.projectId || null, ... }` and maps the result into the normalized payload.
3. **Scoping + permission (in the controller, before `run`):**
   - Gate insight cards by `PERMISSIONS.ANALYTICS.PREDICTIVE` (budget source: `ANALYTICS.ADVANCED` if distinct — else PREDICTIVE). If the viewer lacks it → 403.
   - If `cfg.projectId` is set and the viewer is **not** an owner, require it ∈ `accessibleProjectIds` (else 403). Org-wide (`projectId:null`) is allowed for permission-holders (mirrors the existing predictive endpoints, which are management-gated and org-wide).
4. **Model (`models/workspaceCardModel.js`):**
   - Add `'insight'` to `RENDER_MODES`.
   - Add `insightConfig: { source: String, period: String, projectId: ObjectId|null }` (sub-schema, `_id:false`, defaults `{}`).
5. **Controller wiring (`controllers/workspaceController.js`):**
   - `createCard`/`updateCard`: when `renderMode==='insight'`, accept + persist `insightConfig` (validate `source` ∈ registry, `period`/`timeframe` ∈ that source's allowed values). Insight cards have **no queryPlan** — skip query-plan validation for this mode (store an empty/sentinel plan so existing list/metric paths are unaffected).
   - `getCardData`: branch `renderMode==='insight'` → permission/scope check → `insightSources[source].run(viewerCtx, insightConfig)` → return normalized payload.
   - `previewCard`: accept `{ renderMode:'insight', insightConfig }` and run the same path (no card needed) so the builder previews live.
   - New `GET /api/workspace/insight-sources` → returns the registry metadata (key, label, kind, params + allowed values) for the builder. No secrets/functions leak (serialize like the catalog endpoint).
6. **Tests:** `insightSources.test.js` (each source's `run` maps a mocked service result to the normalized shape; bad source/param rejected); controller tests (insight create persists `insightConfig`; `getCardData` insight branch calls the right source + enforces permission/project scope; `previewCard` insight path); model test (`insight` render mode + `insightConfig` accepted). Refactor: existing predictive controller behavior stays green.

## Frontend (`propvantage-ai-frontend`)
1. **`CardBuilderDialog.js`:** add **Insight** as a third "Show as" option. When selected:
   - Hide the Builder/NL tabs, filter, columns + sort (insights aren't query-plan based).
   - Show an **Insight source** Select (from `GET /workspace/insight-sources`), a **Period/Timeframe** Select (per the source's `params`), and a **Project** Select (All projects / specific — reuse the app's project list).
   - Preview calls `workspaceAPI.preview({ renderMode:'insight', insightConfig })` and renders a compact `InsightCardView`.
   - Save payload: `{ title, renderMode:'insight', insightConfig }` (no module/queryPlan/columns).
2. **`InsightCardView.js`** (new): renders the normalized payload — big **headline** (formatted by `format`), a row of **bands** (scenario/comparison mini-stats, variance tinted by tone), a **confidence** chip, a small **sparkline** from `series` (lightweight inline SVG or existing chart util), and up to ~4 **bullets**. Loading + error states like `WorkspaceCardView`.
3. **`WorkspaceCardView.js`:** when `card.renderMode==='insight'`, render `<InsightCardView>` (fed by `getCardData`) instead of the list/metric branches. The card header (title, refresh, menu, share, delete) stays shared. Insight cards have no row-click/detail route.
4. **`catalogCache.js`:** small fetch+cache for `getInsightSources()` (mirror `getModuleCatalog`).

## Non-goals
- No inventory-turnover source (deferred). No new prediction math. No editing the predictive algorithms. No per-band drill-through. No scheduling/refresh cadence beyond the existing manual/on-load refresh. Insight cards are not shareable-to-CP-orgs (management-only, same as the analytics endpoints).

## Testing / verification
- Backend: full workspace + predictive unit suites green (incl. new insight tests + unchanged refactored controller).
- Frontend: `CI=true npm run build` compiles; ESLint clean.
- Live (demo org, as a management user): create a **Sales forecast** insight card (period 6 months, All projects) → headline forecasted bookings + 3 scenario bands + confidence + sparkline + insight bullets render; create a **Budget vs actual** card → target/actual/variance bands with on-track/at-risk tone; refresh works; delete cleans up.

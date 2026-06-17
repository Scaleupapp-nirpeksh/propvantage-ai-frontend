# Chart Cards — Design Spec

**Date:** 2026-06-17
**Status:** Approved (bar/line/funnel/pie; NL + builder form + suggestions)
**Scope:** A new workspace card type that renders a **grouped aggregation** as a chart. Reuses the governed catalog + query engine (filters), adds a **group-by + measure** capability, and renders via recharts. Authorable by describing it, a builder form, or a suggestion.

## Data model
A chart card carries BOTH a query plan (module + filters, reused as-is) AND a chart config:
- `renderMode: 'chart'`
- `chartConfig: { chartType: 'bar'|'line'|'funnel'|'pie', groupBy: <fieldKey>, agg: 'count'|'sum', metricField: <numericFieldKey>|null, timeBucket: 'month'|null }`

## Backend (`propvantage-ai-backend`)
### Engine — grouped aggregation (`services/workspace/queryEngine.js`)
Add a `renderMode === 'chart'` branch after the shared base pipeline (scope + filter-referenced derived `addFields` + filter `$match`):
1. Resolve `groupBy` field `f` from the catalog (must exist + be **groupable**, see below; else throw).
2. Materialize the group key by reusing `buildDisplayStages([f], new Set())` — this lifts derived fields (e.g. `city`) and produces `${key}_label` for single-ref fields (e.g. `project`). Group key:
   - single-ref (`f.type==='ref' && f.refModel && !f.refArray`) → `$${f.key}_label`
   - date **with** `timeBucket:'month'` → `{ $dateToString: { format: '%Y-%m', date: `$${f.key}` } }`
   - otherwise → `$${f.key}` (enum/string/derived-lifted/date-raw)
3. Accumulator: `count` → `{ $sum: 1 }`; `sum` → `{ $sum: '$'+metricField }` (require `metricField` numeric & in catalog).
4. `$group` by the key → `$sort`: date/line by `_id` asc; bar/funnel/pie by `value` desc. Cap `$limit: 50` buckets.
5. Return `{ buckets: [{ key, value }] }` (coerce null/empty `_id` → `'—'`).

**Groupable** = `type ∈ {enum, string, date}` OR (`type==='ref' && refModel && !refArray`). Array-ref + number fields are not groupable. Compute this in `serializeCatalog` as a per-field `groupable` boolean for the builder.

### Plan schema / model
- `models/workspaceCardModel.js`: add `'chart'` to `RENDER_MODES`; add `chartConfigSchema` ({ _id:false }: `chartType, groupBy, agg(default 'count'), metricField(default null), timeBucket(default null)`) + `chartConfig` field. `queryPlanSchema.js` unchanged (chartConfig travels as an engine opt + a card field, like `metricConfig`).

### Controller (`controllers/workspaceController.js`)
- `previewCard` / `getCardData`: when `renderMode==='chart'`, pass `opts={ renderMode:'chart', chartConfig }` to `runQueryPlan` (preview reads `req.body.chartConfig`; getCardData reads `card.chartConfig`). Validate `chartConfig` (known chartType; `groupBy` in catalog + groupable; `agg==='sum'` ⇒ `metricField` numeric & in catalog) → 400 otherwise.
- `createCard` / `updateCard`: persist `chartConfig` for chart cards (validate as above). Chart cards DO have a queryPlan (module + filters), validated normally.

### NL compiler (`services/workspace/nlToQueryPlan.js`)
Extend the `emit_query_plan` tool input schema with an optional `chart` object: `{ chartType, groupBy, agg, metricField, timeBucket }`. System-prompt addition: if the user asks for a chart/funnel/bar/line/trend/breakdown/“by X”, populate `chart` (pick the chartType; `groupBy` from the vocabulary; `agg`+`metricField` for sums; `timeBucket:'month'` for date group-bys). Extend `catalogViolation` to validate `chart.groupBy`/`chart.metricField` against the catalog. Controller `postNlToQueryPlan` returns `{ plan, chart, clarification }`.

### Tests
- `workspaceQueryEngine.test.js`: chart mode groups correctly (count by enum; sum by numeric; month-bucket by date; ref label group); respects scope + filters; caps buckets; unknown/non-groupable groupBy throws.
- `workspaceCardModel.test.js`: `'chart'` render mode + `chartConfig` persist.
- `workspaceController.crud.test.js`: chart create persists chartConfig; preview/getCardData chart branch calls engine with chart opts; invalid chartConfig → 400.
- NL test: a “funnel of leads by status” sentence emits a `chart` block; bad groupBy rejected.

## Frontend (`propvantage-ai-frontend`)
- **`ChartCardRenderer`**: add a **funnel** type (recharts `FunnelChart`/`Funnel`/`LabelList`); keep bar/line/area/pie. Accepts the existing `{ chartType, data, xKey, yKeys, title }` shape.
- **`ChartCardView`** (new, or branch in `WorkspaceCardView`): on `renderMode==='chart'`, fetch `getCardData` → `{ buckets }`, map to `data=[{ label:key, value }]`, render via `ChartCardRenderer` (`xKey:'label'`, `yKeys:['value']`). Header/refresh/menu/share/delete stay shared; no row-click.
- **`CardBuilderDialog`**: add **Chart** as a 4th "Show as" mode. Chart mode keeps the module + filter/NL builder (so users can filter the data set) and adds: **chart type** toggle (bar/line/funnel/pie), **group by** select (catalog fields where `groupable`), **measure** (Count, or Sum of <numeric field>), and (for date group-by) a month bucket default. Live preview renders the chart. NL path: when the compiler returns a `chart` block, switch to Chart mode and prefill chartType/groupBy/measure. Save payload: `{ title, module, queryPlan, renderMode:'chart', chartConfig }`.
- **Suggestions (`starterCards.js` + `SuggestedCardsDialog`)**: add a few chart starters (e.g. *Leads by status* [funnel], *Leads by source* [pie], *Bookings by month* [line, sum salePrice], *Revenue by project* [bar, sum salePrice]) wherever the module fields support them.
- **`api.js` / `catalogCache.js`**: `previewChart`/preview already posts the body; add a `previewChart(plan, chartConfig)` helper (posts `{ queryPlan, renderMode:'chart', chartConfig }`).

## Non-goals
- No multi-series charts (single measure per chart). No stacked/grouped bars. No custom colors/axis config. No scatter/heatmap. No drill-through from a bar to the underlying rows (later). Array-ref + numeric group-bys not supported. Top-50 buckets (logged cap, no pagination).

## Testing / verification
- Backend: full workspace unit suite green incl. new chart-engine/controller/NL tests.
- Frontend: `CI=true npm run build` compiles; ESLint clean; workspace smoke tests green.
- Live (demo org): describe "funnel chart of leads by status" → a funnel card with the pipeline stages renders; build "bookings revenue by month (line)" via the form; add a suggested chart; all persist + refresh; delete cleans up.

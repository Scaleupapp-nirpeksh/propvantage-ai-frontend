# Card Columns Picker + Sort Control (Theme D2) — Design Spec

**Date:** 2026-06-17
**Status:** Approved (scope: columns picker + sort)
**Scope:** Let users choose which fields become columns in a **list** card, and the card's sort. Frontend-heavy + one small backend field. (Other #9 extras — open-all-in-module, threshold colors, metric→list drill — are deferred.)

## Behavior
In the Card Builder (LIST render mode only):
- **Columns checklist:** show the module catalog's `displayable` fields as checkboxes, beside the live preview. Pre-checked = the catalog's `defaultColumn` fields (today's behavior). The checked set becomes the card's columns, in catalog order. (Matches the #9 ask: see the available fields, tick the ones you want, only those go into the card.)
- **Sort control:** a field `Select` (the catalog's displayable fields) + an asc/desc toggle → sets `queryPlan.sort = { field, dir }`. "None" clears sort.
- Metric mode: hide both (no columns; list sort N/A).
- Edit mode: pre-fill the checklist from `card.columns` (else defaults) and the sort control from `card.queryPlan.sort`.

## Backend (`propvantage-ai-backend`)
- `models/workspaceCardModel.js`: add `columns: { type: [String], default: [] }` (array of catalog field keys).
- `controllers/workspaceController.js`: `createCard` and `updateCard` accept `columns` from the body (passthrough alongside the existing fields; `columns` is mutable on update). No validation beyond array-of-strings (unknown keys are harmless — the frontend only offers real catalog keys, and rendering ignores keys absent from a row).
- **No engine change:** the engine already materializes every `displayable` field (incl. derived + ref `_label`) onto list rows, so any checkable column already has a value.
- Tests: `workspaceCardModel.test.js` — `columns` defaults to `[]` and accepts a string array; `workspaceController.crud.test.js` — create persists `columns`, update can change it.
- **Sort needs no backend change** — `queryPlan.sort` already flows through `runQueryPlan` (validated by the Joi schema; applied in list mode).

## Frontend (`propvantage-ai-frontend`)
- `CardBuilderDialog.js` (list mode):
  - A **Columns** section (checklist of `catalog.fields.filter(f => f.displayable)`, label each by `f.label`; initial checked = `card.columns?.length ? card.columns : displayable.filter(defaultColumn).map(key)`). State `columns: string[]`.
  - A **Sort** section: field `Select` (displayable fields + a "None" option) + asc/desc `ToggleButtonGroup`; writes into the `plan.sort`. Initialize from `plan.sort`.
  - Save payload includes `columns`; `queryPlan` already carries `sort`. Reset `columns`/sort appropriately on open (new vs edit) and when the module changes (reset to that module's defaults).
- `WorkspaceCardView.js`: when list mode and `card.columns?.length`, build the `DataTable` columns from those keys — for each key, find the catalog field for its `label`, and reuse the existing cell `render` (which prefers `row[`${key}_label`] ?? value, with date formatting + em-dash). Else, keep today's default-column logic. (Catalog is already fetched here.)

## Non-goals
- No open-all-in-module, threshold colors, or metric→list drill (later). No column drag-reorder (checklist order = catalog order for v1). No backend column validation.

## Testing / verification
- Backend: workspace unit suite green incl. new `columns` model + controller tests.
- Frontend: `CI=true npm run build` compiles; ESLint clean.
- Live (demo org): build a Leads list card, tick a custom column set (e.g. add "Days since CP follow-up", drop "Score") + set Sort = "Days since CP follow-up desc" → saved card shows exactly those columns in that sort order; editing the card re-opens with the same selection.

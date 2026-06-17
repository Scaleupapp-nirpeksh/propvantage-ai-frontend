# Projects Catalog (Theme D1) — Design Spec

**Date:** 2026-06-17
**Status:** Approved
**Scope:** Add **Projects** as a 6th queryable Workspace module. Mirrors the existing catalog pattern. D2 (field picker) and D3 (forecast cards) are separate.

## New `projects` module — fields (from `models/projectModel.js`)

| Key | Label | Type | Operators | Display | Source |
|---|---|---|---|---|---|
| `name` | Name | string | `contains`, `is` | ✓ defaultColumn | `name` |
| `status` | Status | enum | `is`, `in`, `notIn` | ✓ defaultColumn | `status` — `['planning','pre-launch','launched','under-construction','completed','on-hold']` |
| `type` | Type | enum | `is`, `in`, `notIn` | ✓ | `type` — `['apartment','villa','plot','commercial']` |
| `city` | City | string (derived display) | `is`, `contains` | ✓ defaultColumn | `location.city` — `toMatch` targets `location.city`; **lifted** to top-level `city` via `addFields:[{ $addFields: { city: '$location.city' } }]` + `derived:true` (same pattern as `cpStatus`) so it renders as a column |
| `totalUnits` | Total Units | number | `gt,lt,gte,lte,between` | ✓ | `totalUnits` |
| `targetRevenue` | Target Revenue | number | `gt,lt,gte,lte,between` | ✓ | `targetRevenue` |
| `launchDate` | Launch Date | date | `gt,lt,gte,lte,between,lastNDays` | ✓ | `launchDate` |
| `expectedCompletionDate` | Expected Completion | date | `gt,lt,gte,lte,between` | ✓ | `expectedCompletionDate` |
| `createdAt` | Created | date | `gt,lt,gte,lte,between,lastNDays` | — | `createdAt` (schema has `timestamps:true`) |

Exported enum constants: `PROJECT_STATUS_VALUES`, `PROJECT_TYPE_VALUES`.

## Scoping nuance (important)
For every other module, `scope` filters a `project` field by `accessibleProjectIds`. **Projects rows ARE the projects**, so `projectsCatalog.scope(viewerCtx)` returns:
```js
{ organization: <orgId> }                                  // owners (accessibleProjectIds === null)
{ organization: <orgId>, _id: { $in: accessibleProjectIds } }  // non-owners
```
(Filter on the project's own `_id`, not a `project` field.)

## Cross-cutting changes (adding a 6th module)
**Backend** (`propvantage-ai-backend`):
- `services/workspace/catalogs/projectsCatalog.js` — new (fields above; `baseModel: 'Project'`; the `_id`-based scope).
- `services/workspace/catalogs/index.js` — import + register `projects: projectsCatalog`.
- `services/workspace/queryPlanSchema.js` — add `'projects'` to the `MODULES` array (now 6).
- `models/workspaceCardModel.js` — add `'projects'` to `WORKSPACE_MODULES` (the `module` enum).
- Tests: new `tests/unit/projectsCatalog.test.js` (toMatch shapes incl. enum, `city` lift `addFields`, `_id`-based scope); **update** the existing exact-array assertions: `workspaceQueryPlanSchema.test.js` (`MODULES` now 6) and `workspaceCardModel.test.js` (module enum now 6); confirm `workspaceCatalogRegistry.test.js` still passes. Add an engine integration test (`workspaceQueryEngine.test.js`) seeding a couple of `Project` docs and asserting: a `projects` list query returns them org-scoped, `city` is lifted onto rows, and non-owner `_id` scoping limits results.

**Frontend** (`propvantage-ai-frontend`):
- `src/pages/workspace/CardBuilderDialog.js` — add `{ value: 'projects', label: 'Projects' }` to the `MODULES` const (line ~16).
- `src/pages/workspace/catalogCache.js` — add `projects: (row) => /projects/${row._id}` to `DETAIL_ROUTE` (the `/projects/:projectId` route already exists).

## Non-goals
- No cross-collection derived fields (e.g. "% sold" needs Sales). No forecast cards (D3). No field picker (D2). No board/layout changes.

## Testing / verification
- Backend: full workspace unit suite green (incl. new projects tests + updated MODULES/enum assertions).
- Frontend: `CI=true npm run build` compiles; ESLint clean.
- Live (demo org): "Projects" appears in the Add-card module dropdown; building a Projects card (e.g. `status is launched`) shows Name/Status/Type/City/Total Units/Target Revenue columns with real data; clicking a row opens `/projects/:id`.

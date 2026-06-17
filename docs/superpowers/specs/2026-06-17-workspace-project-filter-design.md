# Workspace Project Filter (global switcher → My View) — Design Spec

**Date:** 2026-06-17
**Status:** Approved (global switcher filters the whole board)
**Scope:** Make the existing global "All Projects" switcher (`ProjectContext.activeProjectId`) refocus the entire My View board on the selected project. "All Projects" = current behavior. Access stays server-enforced; the selection can only ever *narrow*, never widen.

## Backend (`propvantage-ai-backend`)
1. **Viewer context** (`controllers/workspaceController.js`): `viewerFromReq` adds `scopeProjectId: req.body?.scopeProjectId || null`. (Both `previewCard` and `getCardData` are POST, so the id rides in the body.)
2. **Per-catalog project field**: add `projectField` to the project-scoped catalogs — `leads`/`sales`/`payments` → `'project'`; `projects` → `'_id'`. `tasks` and `channelPartners` have no `projectField` (org-scoped) and are unaffected by the selection.
3. **Engine narrowing** (`services/workspace/queryEngine.js`): after `const baseMatch = catalog.scope(viewerCtx)` and before pushing the `$match`, apply the global selection **only if allowed**:
   ```
   const pid = viewerCtx.scopeProjectId;
   if (pid && catalog.projectField) {
     const ok = viewerCtx.isOwner
       || viewerCtx.accessibleProjectIds == null
       || (viewerCtx.accessibleProjectIds || []).map(String).includes(String(pid));
     if (ok) {
       try { baseMatch[catalog.projectField] = new mongoose.Types.ObjectId(String(pid)); }
       catch { /* malformed id → ignore, keep access scope */ }
     }
     // not allowed → ignore the selection; the access-scoped match stands (no leak)
   }
   ```
   This *overrides* the `{ $in: accessibleProjectIds }` with the single chosen project (a subset of access), so it can only narrow. Invalid/inaccessible selections are ignored, never widening.
4. **No schema/model change.** `scopeProjectId` is a transient request scope, not part of the saved card.
5. **Tests** (`workspaceQueryEngine.test.js`): with `scopeProjectId` set to an accessible project, rows narrow to that project (leads + sales); an owner can narrow to one project; a `scopeProjectId` the non-owner can't access is ignored (results = full access scope, never the forbidden project); `projects` module narrows by `_id`; `tasks` ignores it.

## Frontend (`propvantage-ai-frontend`)
- **`api.js`**: `getCardData(id, scopeProjectId)` → `POST /workspace/cards/:id/data` with body `{ scopeProjectId }`.
- **`WorkspaceCardView.js`**: read `activeProjectId` from `useProjectContext()`; pass it to `getCardData`; include it in `loadData`'s deps so each card **refetches when the switcher changes**. (Insight cards keep their own per-card project picker and are unaffected — they don't run through the catalog scope.)
- No builder change: the global filter is a *view* overlay on the board; the Card Builder still previews the card's own definition (all-access) so users build filters against the full set.

## Behavior summary
- Owner selects Project X → board shows only X (X is within "all").
- Multi-project user selects an accessible X → board shows only X.
- User selects "All Projects" → today's behavior (all accessible projects).
- Tasks / Channel-Partner cards are org-scoped and show the same data regardless of the selection (they have no project dimension).
- A stale/forbidden selection can never reveal a project the user lacks access to.

## Non-goals
- No per-card project field (separate, deferred). No board-level "filtered to X" chip (the switcher already shows the active project). No change to insight cards' own project picker. No persistence of the selection per card (it's a live view overlay; `activeProjectId` already persists in localStorage globally).

## Testing / verification
- Backend: full workspace unit suite green incl. new scopeProjectId narrowing + no-leak tests.
- Frontend: `CI=true npm run build` + workspace smoke tests green.
- Live: as a multi-project user, switch the banner to one project → list/metric card counts drop to that project; switch back to All → counts restore; a tasks card is unchanged. (If owner/single-project on the demo, verify counts change for at least one project-scoped card.)

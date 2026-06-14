# PropVantage Report Agent — Design Spec

**Date:** 2026-06-14
**Status:** Approved (brainstorming) → ready for implementation planning
**Repos:** `propvantage-ai-frontend` (UI) + `propvantage-ai-backend` (engine, metrics, data)
**Supersedes the builder UI from:** `2026-06-13-leadership-report-builder-design.md` (the engine/instance/schedule/public layers are reused and extended)

---

## 1. Goal

Replace the drag-and-drop Leadership Report **builder** with a **conversational agent**. A user describes the report they want in plain English; Claude composes it from the organization's *real* data — scoped to the project(s) they choose — and they refine it by chat plus light one-tap controls. The agent saves a reusable **report definition**; scheduling/delivery remain in the existing separate screen. Everything is built in the platform's existing design system.

**Primary users:** business heads / site heads / leadership (the report creators). Stakeholders/recipients consume the generated public report (unchanged audience).

## 2. Decisions locked in brainstorming (2026-06-14)

1. **Scope of v1:** full build in one push — agent + project scoping + expanded metric library.
2. **Output:** the conversation produces a **saved, reusable report definition**. Cadence/recipients are set in the **separate** scheduling screen (not in the conversation).
3. **Project scoping:** a report targets **one project, the whole portfolio, or a side-by-side comparison** — always bounded by the creator's project access.
4. **Workspace layout:** **report canvas is the full-screen star; a chat dock drives it** (validated mockup, "direction B").
5. **Editing model:** **chat + lightweight one-tap controls** on blocks (tweak / flag-number / reorder / show-hide / retitle). No drag-and-drop.
6. **Design control over the report:** **curated** — theme preset (Clean/Midnight/Warm), brand accent color + logo, cover image, and per-block reorder/show-hide/retitle. Not a full free-form design tool.
7. **Engine:** **hybrid** — Claude turns the conversation into a validated report definition (structured output) AND uses read-only data tools to ground proposals and write the narrative.
8. **Design-system sync (hard requirement):** the agent UI and the rendered report use the app's existing design language (Inter, blue `#1e88e5` / gold `#ffb300` MUI theme, existing components/spacing).
9. **Numbers integrity (hard rule):** Claude never authors figures. The definition references metric IDs only; the backend resolves real numbers; Claude only labels/narrates resolved values.

## 3. Non-goals (v1)

- No free-form visual design tool (per-pixel colors/fonts/CSS).
- No change to the scheduling/delivery model (separate screen; reuse the existing engine + recent schedule-visibility improvements).
- No new stakeholder-facing consumption surface beyond the existing public one-pager.
- The agent does **not** set cadence/recipients conversationally (explicitly deferred to the schedule screen).

## 4. Architecture overview

```
User ⇄ Report Agent UI (canvas + chat dock, MUI)
              │  POST /reports/agent/message { sessionId, message, definition }
              ▼
        Agent service (backend, Anthropic SDK)
          ├─ structured output → validated ReportDefinition (patch)
          └─ read-only tools → list_projects · get_metric_catalog · get_data_preview
              │
              ▼
        Metric library (block resolvers) ── reads existing analytics services
              │  (scope-aware: project | portfolio | compare, access-bounded)
              ▼
        Live preview (resolve definition → blocks, no persist)
              │
        Save → ReportDefinition persisted (extends reportTemplate)
              │
        Generate → ReportInstance (frozen snapshot)  →  Public one-pager (themed, branded)
              │
        Schedule & send (separate screen, existing engine)
```

Reused from the existing system (do **not** rebuild): `reportInstanceModel`, `snapshotService` (extended), `viewTracking`, `reviewState`, `scheduleHelper`, `deliveryService`, `publicReportController`/routes, `generateScheduledReports` job, `ReportBlockRenderer`, `reportThemes`, the public page, and the schedule/delivery UI.

## 5. Data model — the Report Definition (source of truth)

Extend the existing `reportTemplateModel` (it already has `blocks[]`, `theme`, `schedule`, `delivery`, `access`, `scope`). Make the dormant/loose fields real:

- **`blocks[]`** — `{ id, type, title?, config{}, order }`. `type` is a metric/layout block id from the registry. (Already exists.)
- **`scope`** — `{ mode: 'project' | 'portfolio' | 'compare', projectIds: [ObjectId] , period: { preset|custom } }`. Today `scope.projects` exists but is dead — activate it and add `mode`. For `portfolio`, `projectIds` is empty/ignored (means "all accessible"). For `compare`, 2+ `projectIds`.
- **`design`** — `{ themePreset: 'clean'|'midnight'|'warm', accentColor?, logoKey?, coverImageKey? }`. Reuse the existing `theme.{preset, primaryColor/accentColor, logoS3Key, coverImageS3Key}` fields (currently unused) — wire them through the renderer (the `reportThemes` work already made preset real; extend it to honor `accentColor`/logo/cover).
- **`schedule` / `delivery` / `access`** — unchanged; owned by the separate scheduling screen.

`ReportInstance` (the frozen snapshot) is unchanged structurally; it stores resolved blocks + the resolved scope (add `scope` provenance so a frozen report records exactly which projects it covered).

## 6. Metric library (expanded block registry)

The block registry (`services/reports/blockRegistry.js`) is Claude's vocabulary. Today it exposes ~10 data blocks off one org-wide overview. Expand it to surface metrics the system **already computes** but never exposed. Each block is a **resolver** `({ overview, comparison, scope, config }) => data` over existing services — no new analytics math where it already exists.

New/expanded block groups (each scope-aware):
- **Financial+:** targets & budget-vs-actual, achievement rate, collection efficiency (`budgetVsActualService`); revenue projections/forecasts with confidence (`predictiveAnalyticsService`).
- **Sales+:** monthly/period sales time-series & velocity, months-to-sellout, per-salesperson performance (`salesController`/`leadershipDashboardService`).
- **Leads+:** funnel by stage with conversion, lead scoring/grade distribution, source ROI / cost-per-lead (`leadScoringController`, `analyticsController`, `budgetVsActualService`).
- **Inventory+:** unit status/price/area stats, BHK/tower/floor mix, occupancy (`unitController`, `getTowerAnalytics`).
- **Channel partners:** CP leaderboard, direct-vs-CP volume split, commission gross/TDS/net/pending (`cpAnalyticsService`, partnership/commission services). *(Skip the deprecated `commissionController`.)*
- **Payments+:** payment-method mix, overdue/aging buckets, due-soon (`paymentController`).
- **Per-project comparison:** side-by-side rollups + auto alerts (`getLeadershipProjectComparison`, which already accepts `projectIds`).

Layout/media blocks (hero, gallery, note, divider) stay. The catalog endpoint continues to filter by permission.

## 7. Project scoping

- `generateInstance(template, { createdBy, accessibleProjectIds })` computes an **effective project set** = `intersect(template.scope.projectIds, accessibleProjectIds)` (empty `scope.projectIds` + `portfolio` mode → all accessible). Scoping can **never widen** access.
- `portfolio`/`project` modes pass the effective set as the existing 5th arg to `getLeadershipOverview` (the project filter primitive already exists: `buildProjectFilter`).
- `compare` mode calls `getLeadershipProjectComparison(org, effectiveProjectIds)` and feeds comparison blocks.
- The resolved effective set is stored on the `ReportInstance` for provenance.
- Scheduled generations (no live user) resolve scope from `template.scope`, bounded by `template.createdBy`'s access.

## 8. Agent engine (backend, hybrid)

New module `services/reports/agent/` using `@anthropic-ai/sdk` (model `claude-sonnet-4-6`, overridable via env). Per user message:

1. **Inputs:** conversation history + the current `ReportDefinition` + the user's accessible projects.
2. **Tools (read-only):**
   - `list_projects()` → projects the user can access.
   - `get_metric_catalog()` → available blocks/metrics (the registry, permission-filtered).
   - `get_data_preview({ scope, period, metricIds })` → resolved real numbers for grounding + narrative + anomaly flagging.
3. **Structured output:** Claude returns an updated `ReportDefinition` (full or patch) + an assistant chat message. The definition is **validated** (`templateValidation`, extended for `scope.mode`/`projectIds` as valid org projects, known block types, design tokens) before acceptance; invalid → Claude is re-prompted with the validation error.
4. **Response:** `{ definition, reply, previewBlocks }`. The UI re-renders the canvas from `previewBlocks` (resolved live, not persisted).

**Numbers integrity:** the definition only ever references metric IDs + scope/period. Real numbers are resolved server-side (preview + final snapshot). The narrative block is produced by Claude **from `get_data_preview` output**, never free-handed. System prompt enforces "use only provided figures."

**Endpoints:** `POST /reports/agent/message` (drive the conversation), `POST /reports/templates/:id/preview` (resolve a definition → blocks without persisting), plus existing save (`PUT /reports/templates/:id`) and generate. Conversation state: persist a lightweight `reportAgentSession` document (transcript + working definition, keyed to the draft/template id) so refinement survives reloads.

## 9. Workspace UI (frontend, layout B)

New route/page **`ReportAgentPage`** replaces the builder route. Built from existing primitives (`ReportBlockRenderer`, `reportThemes`, MUI theme).

- **Canvas (center, the star):** live report preview rendered by `ReportBlockRenderer` with the chosen theme/brand. Re-renders from `previewBlocks` after each agent turn.
- **Chat dock (bottom):** message history + composer; persistent integrity reminder line. Sends to `/reports/agent/message`.
- **Top bar:** report name (editable) · **Scope** chip (project picker / portfolio / compare) · **Period** chip · **Theme** picker · **Save** · **Schedule & send** (opens existing delivery dialog).
- **Curated design + edit controls** (chat OR one tap): theme preset, brand accent color, logo, cover image; per-block reorder (move up/down), show/hide, retitle, and **flag-number** (reuses the existing flag/override flow).
- **Retire:** `BlockPalette`, `BuilderCanvas`, `SortableBlockItem`, `BlockConfigPanel`, `@dnd-kit` usage (drag-drop builder). Keep `ReportBlockRenderer`, `ThemePicker` (repurposed into the design controls), `ImageUploader`, `OverrideDialog`, `FlagDialog`.

## 10. Generated report page (public one-pager)

- Renders the saved definition: themed (Clean/Midnight/Warm — already real), branded (accent/logo/cover), ordered. On-brand, interactive, link works (the approval-gate fix already shipped).
- **Image serving fix (required):** the `propvantage` S3 bucket blocks public reads, so report images currently 403 on the public page. Serve report images via a **backend image proxy** (`GET /public/reports/:slug/image/:key` streaming from S3) — durable (no expiry, survives emailed-then-viewed-later), no bucket policy change. (Presigned URLs rejected: they expire; CloudFront: heavier, optional later.)

## 11. Numbers integrity & review

- Architectural guarantee (§8): figures only ever come from resolved metrics.
- Keep the existing **flag/override review flow** for human correction; "flag a number" is one tap on the canvas. The "hold for review then send" delivery mode (separate screen) is unchanged.

## 12. Error handling

- **Per-block resolver isolation** (existing pattern): one failing metric yields a friendly per-block error, never breaks the report.
- **Agent tool errors** degrade gracefully — Claude reports "couldn't load X" rather than failing the turn.
- **Spec validation** rejects invalid definitions; the agent self-corrects from the validation message.
- **Narrative** is best-effort (never blocks a report); on LLM error the block shows the existing "unavailable" fallback.
- **Scope/access:** an out-of-access projectId is dropped (intersection), never errors.

## 13. Testing

- **Unit (backend):** each metric resolver (incl. scope filtering + access-bound intersection + compare mode); definition validation (scope.mode, projectIds, block types, design tokens); scope-intersection helper.
- **Agent:** prompt → expected definition shape; **numbers-integrity** (assert no figure appears in a definition; narrative only contains preview-provided numbers); tool-error handling; re-prompt on invalid definition.
- **UI:** `ReportBlockRenderer` per theme (exists); canvas one-tap controls (reorder/hide/retitle/flag); scope picker.
- **E2E:** describe → agent builds → refine by chat + one tap → save → generate → public view (image proxy serves images; theme/brand applied).

## 14. Implementation phasing (for the plan)

"Everything in one push" is large; the plan should sequence it so each phase is independently testable:

- **P1 — Data foundation:** activate project scoping (`scope.mode/projectIds` through `generateInstance`/`getLeadershipOverview`, access-bounded, provenance on instance) + expand the block registry with the new resolvers. Tests per resolver + scope.
- **P2 — Agent engine:** Anthropic agent service, tools (`list_projects`/`get_metric_catalog`/`get_data_preview`), structured `ReportDefinition` output + validation, `/reports/agent/message` + `/preview`, session persistence. Numbers-integrity tests.
- **P3 — Workspace UI:** `ReportAgentPage` (canvas + chat dock, MUI), scope/period/theme controls, curated design + one-tap block controls, live preview; retire the drag-drop builder.
- **P4 — Report page + images:** backend image proxy; wire accent/logo/cover into the renderer + public page.
- **P5 — Integration:** e2e, retire dead builder components, docs.

## 15. File touch-points (initial map)

**Backend:** `services/reports/blockRegistry.js` (+ new resolver modules per group), `services/reports/snapshotService.js` (scope), `services/leadershipDashboardService.js` (scope plumbing already present), `services/reports/agent/*` (new), `services/reports/templateValidation.js` (scope/design), `controllers/reportAgentController.js` (new) + `routes`, `models/reportTemplateModel.js` (scope.mode/design), `models/reportInstanceModel.js` (scope provenance), `controllers/publicReportController.js` (image proxy route), `services/s3Service.js` (presigned/stream helper).

**Frontend:** `src/pages/reports/ReportAgentPage.js` (new, replaces `ReportTemplateBuilder`), `src/components/reports/` (chat dock, scope picker, design controls; retire palette/canvas/sortable), `src/components/reports/ReportBlockRenderer.js` + `src/utils/reportThemes.js` (accent/logo/cover), `src/pages/public/PublicReportPage.js` (image proxy URLs), `src/services/api.js` (`reportAgentAPI`), `src/App.js` (route swap).

## 16. Risks / open questions

- **Agent latency/cost** on each turn (tool calls + structured output) — mitigate with a single grounded turn (one `get_data_preview`), small model where adequate, and caching the catalog.
- **Metric breadth vs. correctness** — only surface metrics whose underlying service is trustworthy (e.g., skip deprecated commission controller; flag any hard-coded/assumed values from `predictiveAnalyticsService`).
- **Compare-mode rendering** — needs comparison-aware block variants (side-by-side); keep the set small in v1 (KPIs + a couple charts).
- **Image proxy auth** — public reports are gated; the image proxy must honor the same gate (only serve images for an accessible/approved report).

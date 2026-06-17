# Home / Welcome Page ("Ask anything") — Design Spec

**Date:** 2026-06-17
**Status:** Approved (thin intent router + reuse Copilot & NL→QueryPlan; new default landing at `/`; confirm-chip for actions)
**Goal:** A Claude-style home that greets the user (time-of-day + name + title), asks "what do you want to do today?", and routes a free-text request to one of three outcomes — **action** (navigate to create/edit), **data** (render an addable My-View card inline), or **question** (answer via the existing Copilot). Results stack on the page so the user can build several cards in one sitting.

## Reuse map (already built)
- **Copilot** (`aiCopilotService.js`, GPT-4o; `useCopilotChat`, `src/components/copilot/cards/CardRenderer.js`) → answers general questions; reused verbatim for `kind:'question'`.
- **NL→QueryPlan** (`services/workspace/nlToQueryPlan.js`, Claude Sonnet 4.6; catalog vocab + `catalogViolation`) → the validated-plan substrate reused for `kind:'data'`.
- **Workspace card pipeline** (`workspaceAPI.preview/createCard/addToBoard`, `WorkspaceContext.cards`, `SuggestedCardsDialog` dedup-by-title) → render + Add to My View + dedup.
- **Create/edit routes** (`/leads/create`, `/projects/create`, `/sales/create`, `/tasks/create`, module list pages) → action targets.
- **Identity** (`AuthContext`: `user.firstName`, `user.roleRef?.name`) → greeting.

## Backend
### New intent router — `POST /api/home/intent`
- Route: new `routes/homeRoutes.js` mounted at `/api/home` (under `protect`); controller `controllers/homeController.js`; service `services/home/intentRouter.js`.
- Body: `{ text }`. One Claude Sonnet 4.6 call, forced single tool `route_intent` (reuses `buildVocab`/catalog vocab from the workspace NL service so data plans are valid). Returns `{ success, data }` where `data` is one of:
  - **action**: `{ kind:'action', entity:'lead'|'project'|'sale'|'task'|'payment'|'channelPartner', mode:'create'|'open', label }`. (The frontend maps entity+mode → route; backend does not need to know routes.)
  - **data**: `{ kind:'data', card: { title, module, renderMode:'list'|'metric', queryPlan:{module,logic:'AND',filters,sort,limit,nlSource}, metricConfig:{agg,field} } }`. `queryPlan` is validated with the existing schema + `catalogViolation`; on validation failure the router degrades the result to `kind:'question'`.
  - **question**: `{ kind:'question', text }` (echoed; the frontend calls the Copilot).
  - **clarify**: `{ kind:'clarify', clarification }`.
- Classification rules (system prompt): create/edit/"take me to" → **action**; "show/list/count/which/top/stale … records" → **data** (pick module + compile filters; `renderMode:'metric'` when the ask is a single number — how many / total / revenue — else `list`); analysis / "why" / "how is business" / open-ended → **question**; ambiguous → **clarify**. Reference ONLY catalog fields/operators (same guard as NL→QueryPlan).
- Never throws on a bad request — returns `clarify` or `question`. Permission/scope: none added here; the *data* card later runs through the workspace engine which is already viewer-scoped + access-enforced. Actions just navigate (target pages do their own auth).
- **Tests** (`tests/unit/homeIntentRouter.test.js`): mock the Anthropic client; assert each `kind` maps through; a data result with an invalid field degrades to `question`; an unknown module is rejected. (Follow the `workspaceNlToQueryPlan.test.js` mocking idiom.)

## Frontend
### Routing
- `App.js`: `/` → new `HomePage` (was `Navigate to /workspace`). My View stays at `/workspace` and in the nav. `/dashboard` redirect unchanged. Add a **Home** nav item (top of MAIN) pointing to `/`.

### `HomePage` (`src/pages/home/HomePage.js`)
- **Greeting:** time-of-day (`<12 morning`, `<17 afternoon`, `<21 evening`, else `night`) → "Good {tod}, {firstName}". Subtitle = `user.roleRef?.name` (the org title; org *name* deferred). **Repeat visits:** a localStorage counter `pv.home.visits` — first ever (or first of the day) shows the time-of-day greeting + "What do you want to do today?"; a returning user shows "Welcome back, {firstName}" + "What do you want to do next?". (Headline + prompt copy switch on the counter.)
- **Composer:** a large input (`What do you want to do today?`), Enter to submit; a row of quick-action chips (Create lead / Create project / Log a sale / New task) that fire the same flow with canned text, and 2–3 example data prompts.
- **Submit → `homeAPI.intent(text)`**, then append a result to a session `results[]` list rendered below the composer (newest last; the page scrolls — multiple results stack):
  - **action** → an `ActionResult` chip-card: "Create a new lead" + a primary button → `navigate(routeFor(entity, mode))`. (Never auto-navigates — confirm first.)
  - **data** → a `HomeDataCard`: runs `workspaceAPI.preview(card.queryPlan, { renderMode, metricConfig })`, renders the list/metric exactly like a My-View card (reuse the render bits from `WorkspaceCardView` — extract a small presentational `<CardBody>` or replicate the list/metric block), with an **Add to My View** button.
  - **question** → a `QuestionResult`: calls `copilotAPI.chat({ message:text })` and renders the answer via the existing copilot `CardRenderer` + text (reuse `useCopilotChat` or a thin call).
  - **clarify** → a `ClarifyResult`: shows the clarification text + lets the user rephrase.
- **Add to My View + dedup:** on Add, compare the new card to `WorkspaceContext.cards`: a **match** = same `module` AND equal normalized filter set (sorted `{field,op,value}`), OR identical title. If a match exists → show "You already have a similar card '{title}'." with **Update it** (`updateCard(existingId, {queryPlan, renderMode, metricConfig})`) vs **Add new** (`createCard` + `addToBoard`). No match → `createCard` + `addToBoard` directly. After success the button becomes "Added ✓ · Open My View".
- **`routeFor(entity, mode)`** map: lead→`/leads/create`|`/leads`, project→`/projects/create`|`/projects`, sale→`/sales/create`|`/sales`, task→`/tasks/create`|`/tasks`, payment→`/payments`, channelPartner→`/channel-partners`.

### API (`src/services/api.js`)
- `homeAPI = { intent: (text) => api.post('/home/intent', { text }) }`.

## Behavior summary / examples
- "create a lead" → action chip → /leads/create.
- "leads with no follow-up in 30 days" → data card (list) + Add to My View; if a near-identical card exists → offer Update.
- "what's our revenue this month?" / "how is business?" → Copilot answer inline.
- Returning later → "Welcome back, Nirpeksh … what do you want to do next?".

## Non-goals (v1)
- No multi-turn conversation memory on Home (each submit is one-shot; the Copilot keeps its own thread when invoked). No org-name in the greeting (no field; role title only). No edit-by-name resolution (edit intents without a clear record → treated as `open` the module or `data`). No new card types beyond list/metric (charts were removed). No server-side persistence of Home results (session-only). No voice/mic.

## Testing / verification
- Backend: `homeIntentRouter` unit tests green; full workspace suite unaffected.
- Frontend: `CI=true npm run build` + workspace smoke tests green; add a `HomePage` render smoke test (greeting + composer present).
- Live (demo): greeting shows name + role; "create a lead" → confirm chip → routes; "stale CP leads" → inline card + Add to My View (and Update-existing path when a twin exists); "how is business this month?" → Copilot answer inline; reload → "Welcome back".

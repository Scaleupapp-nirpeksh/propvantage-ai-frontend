# Leadership Report Builder & Distribution — Design Spec

- **Date:** 2026-06-13
- **Author:** nirpeksh@scaleupapp.club (with Claude Code)
- **Status:** Draft — awaiting user review
- **Scope:** Phases 0–4 (full feature through scheduling & delivery). Phase 5 noted as future.
- **Repos:** `propvantage-ai-frontend` (React 18 + MUI 5), `propvantage-ai-backend` (Node/Express + MongoDB/Mongoose)

---

## 1. Summary

Leadership roles (Business Head, Project Director, Sales/Marketing/Finance Head) can compose a **reusable report template** by picking data blocks from a catalog of metrics the platform already computes, arranging them on a themed one-pager, and dropping in project photos. On a **schedule** (weekly / monthly / quarterly) — or on demand — the system **freezes a snapshot** of the chosen data into a report instance, routes it through a **review & approval** step (where reviewers can override values or flag bad data to its owner), then emails stakeholders a link to a **beautiful, hosted, public one-pager**. Viewers pass a lightweight **email gate**, which lets the creator see an **open-rate dashboard** — who opened, how often, and who merely forwarded it.

The platform already computes essentially all the needed data (`GET /leadership/overview` returns the full org snapshot) and already has the heavy infrastructure: nodemailer email service, node-cron scheduler, S3 image upload, public-route patterns, and an in-app notification system. This feature is mostly a new, cohesive **`reports` domain** that assembles those pieces, plus a builder UI and a public render page.

## 2. Goals & non-goals

**Goals**
1. Let leadership build reusable report templates by selecting from existing data, with low effort and guaranteed-polished output.
2. Let creators upload project images that the system places into a beautified layout.
3. Generate and deliver reports on a weekly/monthly/quarterly schedule (and on demand) to stakeholder emails via a shareable link.
4. Track engagement per person via an email-gated public page (opens, repeat views, forwarders).
5. Provide a pre-send review step: inspect every value, override or flag incorrect data, notify the right owners, and approve before sending — with internal "ready for review" / "sent" mailers.

**Non-goals (this spec)**
- Editing source CRM data from the report screen (overrides live on the snapshot only; flags route owners to the source module).
- A freeform design canvas (we use pick-and-arrange within a fixed, polished theme).
- PDF generation, OTP-verified gating, per-recipient unique links, and an AI-written narrative block — all **Phase 5** (designed-for, not built now).
- New analytics computation — we reuse existing analytics services via a block catalog.

## 3. Confirmed design decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Output medium | **Hosted web one-pager + shareable link** (PDF later) | Matches "reporting website", "link", and open-rate tracking. |
| 2 | Open tracking | **Email-gated public page** | One link; viewer enters email to view → attributes opens to people and catches forwarders. |
| 3 | Template control | **Pick & arrange blocks within a theme** (drag-reorder via `@dnd-kit`) | Guarantees "lovely" output with low effort; `@dnd-kit` is already a dependency. |
| 4 | "Correct on the go" | **Override in snapshot + flag owner** | Never silently mutates CRM data; gives both inline correction and a route to fix the source. |
| 5 | Architecture | **A — snapshot-first report domain + public React page** | Maximum reuse, clean separation, phaseable. |
| 6 | Delivery default | **review-then-send** (auto-send available per template) | Matches the emphasis on reviewing before sending. |

## 4. Roles & permissions

New permissions added to `config/permissions.js` and granted in `data/defaultRoles.js`:

- `reports:manage` — create/edit/delete templates, generate instances, edit overrides. Granted to: Organization Owner, Business Head, Project Director, Sales Head, Marketing Head, Finance Head.
- `reports:approve` — approve a report and trigger/queue send. Granted to: Owner, Business Head (others configurable per org).
- `reports:view` — view report instances and open-rate analytics. Granted to the above plus, optionally, managers.

Enforced with the existing `hasPermission()` middleware. The builder route and nav item are gated client-side via `PermissionGate` / `useAuth().checkPerm('reports:manage')`. Public render endpoints are unauthenticated but protected by an unguessable slug + token, rate limiting, and expiry checks.

## 5. Architecture overview

```
┌────────────────────────── BACKEND (new "reports" domain) ──────────────────────────┐
│                                                                                     │
│  config/permissions.js (+ reports:*)        data/defaultRoles.js (grants)           │
│                                                                                     │
│  models/reportTemplateModel.js   models/reportInstanceModel.js   models/reportViewModel.js
│                                                                                     │
│  services/reports/blockRegistry.js  ── resolve() per block ──▶ EXISTING analytics   │
│     (catalog of block types)                                   services / controllers│
│  services/reports/snapshotService.js (freeze blocks → instance)                     │
│  services/reports/deliveryService.js (email recipients) ──▶ utils/emailService.js   │
│                                                                                     │
│  controllers/reportController.js          controllers/publicReportController.js     │
│  routes/reportRoutes.js  (protect + perms)  routes/publicReportRoutes.js  (no auth) │
│  jobs/generateScheduledReports.js (node-cron) ─ registered in server.js             │
└─────────────────────────────────────────────────────────────────────────────────────┘
        ▲ authenticated API                              ▲ public API (slug + email gate)
        │                                                │
┌───────┴──────────────── FRONTEND ──────────────┐  ┌───┴──────────────────────────────┐
│ pages/reports/ (inside DashboardLayout)         │  │ pages/public/PublicReportPage.js │
│  • TemplateListPage / ReportTemplateBuilder     │  │  (PublicRoute, no dashboard shell)│
│  • ReportInstanceListPage                       │  │  email gate → renders snapshot    │
│  • ReportReviewPage (override / flag / approve) │  │  reuses KPICard / ChartCard       │
│  • ReportAnalyticsPage (open-rate)              │  └───────────────────────────────────┘
│  reuses common/{KPICard,ChartCard,DataTable,PageHeader}; services/api.js → reportAPI │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Snapshot-first principle:** a report instance stores the *resolved data* at generation time. The public page and review page both render from that frozen snapshot — so what a reviewer approves is exactly what stakeholders see, historical reports never drift, and the public page is fast (no live analytics calls per view).

## 6. Data model

All models are organization-scoped (`organization` ref, indexed) consistent with every existing model.

### 6.1 `ReportTemplate`
```js
{
  organization: ObjectId,            // ref Organization, required, indexed
  name: String,
  description: String,
  createdBy: ObjectId, updatedBy: ObjectId,   // ref User

  scope: {
    projects: [ObjectId] | null,     // null = all accessible projects
    period: { type: 'last_30d'|'mtd'|'qtd'|'ytd'|'last_quarter'|'last_month'|'custom',
              customStart: Date, customEnd: Date }
  },

  theme: {
    preset: 'clean'|'midnight'|'warm',     // owns spacing/typography/color
    primaryColor: String, accentColor: String,
    logoS3Key: String, coverImageS3Key: String
  },

  blocks: [{
    id: String,                      // stable client id
    type: String,                    // matches blockRegistry, e.g. 'kpi.revenue'
    title: String,                   // optional display override
    config: Object,                  // per-type (metric, chartKind, limit, columns, compare)
    order: Number
  }],

  imageSlots: [{ id, label, s3Key, url }],   // template-default images

  schedule: {
    enabled: Boolean,
    frequency: 'weekly'|'monthly'|'quarterly',
    dayOfWeek: Number, dayOfMonth: Number,   // per frequency
    time: String,                            // 'HH:mm'
    timezone: String,                        // default 'Asia/Kolkata'
    nextRunAt: Date                          // indexed; computed on save
  },

  delivery: {
    mode: 'review_then_send'|'auto_send',    // default 'review_then_send'
    recipients: [{ email: String, name: String, role: String }],  // stakeholders
    ccInternal: [String],                    // internal emails
    reviewers: [ObjectId]                    // ref User, who may approve
  },

  access: { gate: 'email'|'public', expiresAfterDays: Number },   // 'email' default; 'email_otp' is Phase 5

  status: 'active'|'paused'|'archived',
  createdAt, updatedAt
}
```

### 6.2 `ReportInstance` (a frozen run)
```js
{
  organization: ObjectId,
  template: ObjectId | null,         // null = ad-hoc
  createdBy: ObjectId,
  title: String, periodLabel: String,
  periodStart: Date, periodEnd: Date,

  blocks: [{ id, type, title, config, order, data: Object }],   // data = FROZEN snapshot
  images: [{ id, label, url }],      // resolved public/pre-signed urls
  theme: Object,                     // frozen copy

  overrides: [{ id, blockId, fieldPath, originalValue, newValue, reason,
                by: ObjectId, at: Date }],
  flags: [{ id, blockId, note, severity: 'info'|'warn'|'critical',
            assignedTo: ObjectId, status: 'open'|'resolved',
            createdBy: ObjectId, createdAt, resolvedAt }],

  review: { status: 'draft'|'in_review'|'changes_requested'|'approved',
            submittedBy, reviewedBy, approvedBy, approvedAt, notes },

  distribution: {
    status: 'not_sent'|'queued'|'sending'|'sent'|'failed',
    sentAt: Date,
    recipients: [{ email, name, emailStatus: 'pending'|'sent'|'bounced'|'failed', emailedAt }]
  },

  publicSlug: String,                // unique, indexed, unguessable
  accessToken: String,               // secondary secret embedded in link
  gate: 'email'|'public',
  expiresAt: Date,                   // indexed

  stats: {                           // denormalized rollup from ReportView
    uniqueViewers: Number, totalViews: Number,
    recipientsOpened: Number, forwardedOpens: Number,
    firstOpenAt: Date, lastOpenAt: Date
  },

  pdfS3Key: String | null,           // Phase 5
  createdAt, updatedAt
}
```

### 6.3 `ReportView` (one row per viewer; separate collection for scale)
```js
{
  organization: ObjectId,
  reportInstance: ObjectId,          // indexed
  publicSlug: String,
  email: String,                     // entered at the gate
  matchedRecipient: Boolean,         // email ∈ instance.distribution.recipients
  isForwarded: Boolean,              // !matchedRecipient
  ipHash: String, userAgent: String, // ipHash = hashed, not raw IP (PII)
  firstViewedAt: Date, lastViewedAt: Date,
  viewCount: Number,
  totalDwellMs: Number               // optional, via heartbeat
}
// Upsert key: (reportInstance, email) → increment viewCount on repeat.
```

## 7. Block catalog (the reuse mechanism)

`services/reports/blockRegistry.js` exports an array of block definitions. Each block knows how to fetch its own data from **existing** analytics services — the report domain never reimplements analytics.

```js
{
  type: 'kpi.revenue',
  category: 'Financial',
  label: 'Total Revenue',
  description: 'Total booked revenue for the period, with prior-period comparison.',
  defaultConfig: { compare: true },
  requiredPermission: 'analytics:advanced',     // builder hides blocks the user can't see
  resolve: async ({ organization, projects, period, config }) => {
    // calls existing budgetVsActual / analytics service, returns frozen-ready data
    return { value, trend, series /* … */ };
  }
}
```

- `GET /api/reports/catalog` returns the catalog **without** `resolve` (so the builder can render the palette), filtered to blocks the requesting user has permission for.
- The snapshot generator iterates a template's `blocks[]`, calls each `resolve()`, and stores the returned object as `block.data`.

**v1 catalog (all backed by existing endpoints/services):**

| Category | Blocks |
|----------|--------|
| KPI | Revenue, Units Sold, Collections (collected/outstanding/overdue), Collection Rate, Total Leads, Conversion Rate, Avg Booking Value, Target-vs-Actual % |
| Charts | Monthly Sales Trend, Revenue by Project, Lead Funnel, Lead Sources, Inventory Status, Budget-vs-Actual, Sales Forecast (predictive endpoints) |
| Tables | Top Performers, Project Comparison, Overdue Payments, Recent Bookings |
| Construction | Overall Progress, Milestones by Phase |
| Channel Partners | Commission Summary, CP Volume |
| Media/Layout | Hero/Cover, Image Gallery, Free-text Note, Divider |
| AI (Phase 5) | AI Narrative (reuses existing AIInsight pipeline) |

Most KPI/chart/table blocks can be served from the single `GET /leadership/overview` response (portfolio, sales, leads, payments, units, construction, CP, tasks, team), with the budget/predictive endpoints covering the rest.

## 8. Snapshot generation

`services/reports/snapshotService.js → generateInstance(template, { adHoc })`:
1. Resolve project scope & period from the template (respecting `req.accessibleProjectIds` for the creator/scheduler context).
2. For each block, call `blockRegistry[type].resolve(...)`; collect `{...block, data}`. Per-block try/catch — a failed block is marked `data: { error: true }` rather than failing the whole run.
3. Resolve image slot S3 keys to URLs.
4. Create a `ReportInstance` with `review.status='draft'`, a unique `publicSlug` + `accessToken`, and `expiresAt = now + template.access.expiresAfterDays`.
5. Return the instance. Callers: ad-hoc "Generate now" (Phase 1) and the cron job (Phase 4).

## 9. Frontend

### 9.1 Builder — `pages/reports/ReportTemplateBuilder.js` (`/reports/templates/:id/edit`)
Three-pane layout: **palette** (catalog grouped by category + image uploader + theme picker) · **live preview canvas** (drag-to-reorder with `@dnd-kit`, reusing `KPICard`/`ChartCard` for true-to-life preview) · **block config** (per-type settings). "Generate preview" calls `POST /templates/:id/generate` to render real data. Gated by `reports:manage`.

### 9.2 Public one-pager — `pages/public/PublicReportPage.js` (`/r/:slug`)
Registered as a **PublicRoute** outside `DashboardLayout`. Flow: fetch gate meta → email form → on submit, fetch + render the frozen snapshot (hero, KPI row, chart sections, gallery, footer). Reuses `KPICard`/`ChartCard`; ships a print stylesheet (enables Phase-5 PDF). Mobile-responsive; theme-driven.

### 9.3 Review screen — `pages/reports/ReportReviewPage.js` (`/reports/:id/review`)
Renders the snapshot in "review mode." Hovering any value reveals **Override** (`{original,new,reason}` saved to the instance) and **Flag** (note + assign owner → notification + email). A side panel lists open flags and a per-block correctness checklist. Actions: **Approve & schedule send**, **Request changes**, **Notify reviewers**.

### 9.4 Lists & analytics
- `ReportTemplateListPage` (`/reports/templates`) — templates with status, schedule, last run.
- `ReportInstanceListPage` (`/reports`) — instances with review/distribution status chips.
- `ReportAnalyticsPage` (`/reports/:id`) — open-rate dashboard: recipients table (sent/opened/#views/last seen), forwarders list, unique/total opens, open timeline. Reuses `DataTable`/`ChartCard`.

### 9.5 API & nav
- Add a `reportAPI` object to `src/services/api.js` following the existing per-domain pattern (raw axios; no React Query).
- Add a **Reports** nav item under the INTELLIGENCE section in `DashboardLayout.js`, gated by `canAccess`/`checkPerm('reports:manage')`.
- Repurpose the existing **Schedule dialog** UI from `AnalyticsReportsCenter.js` (frequency/format/recipients) for the template schedule config rather than rebuilding it.

## 10. Backend API surface

**Authenticated — `/api/reports` (`protect` + permission):**
- `GET /catalog` — block catalog (permission-filtered) · `reports:manage`
- `GET|POST /templates`, `GET|PUT|DELETE /templates/:id` · `reports:manage`
- `POST /templates/:id/generate` — generate an instance now (preview/ad-hoc) · `reports:manage`
- `GET /instances`, `GET /instances/:id` · `reports:view`
- `POST /instances/:id/overrides`, `POST /instances/:id/flags`, `PATCH /instances/:id/flags/:flagId` · `reports:manage`
- `POST /instances/:id/submit-review`, `POST /instances/:id/approve`, `POST /instances/:id/request-changes` · approve needs `reports:approve`
- `POST /instances/:id/send` — manual send · `reports:approve`
- `GET /instances/:id/analytics` — open-rate · `reports:view`
- Image upload reuses existing `POST /api/files/upload` (tag `resourceType: 'ReportTemplate'|'ReportInstance'`).

**Public — `/api/public/reports` (no auth; slug + token + rate-limited):**
- `GET /:slug` — returns branding + gate type + expiry status only (no data).
- `POST /:slug/access` — body `{ email }` → upsert `ReportView`, mark matched/forwarded, return the snapshot JSON + set a short-lived view cookie.
- `POST /:slug/heartbeat` — optional dwell tracking.
- (Phase 5) `POST /:slug/request-otp`.

## 11. Review & approval workflow (state machine)

```
draft ──submit-review──▶ in_review ──approve──▶ approved ──send──▶ (distribution: sent)
                              │
                              └──request-changes──▶ changes_requested ──(edit/regenerate)──▶ in_review
```
- Overrides and flags are editable while `in_review`/`changes_requested`; locked at `approved`.
- Flagging an item creates an in-app notification + email to `assignedTo` (the data owner) via existing services.
- On `submit-review`: notify the template's `reviewers` ("Report ready for review"). On `approve`+send: notify creator/ccInternal ("Report approved & sent").

## 12. Scheduling & delivery

- **`jobs/generateScheduledReports.js`** (node-cron) registered in `server.js`, mirroring the existing `jobs/generateScheduledInsights.js` pattern. Runs hourly: find `ReportTemplate`s with `schedule.enabled && nextRunAt <= now`; for each, `generateInstance()`, then recompute `nextRunAt`.
  - `delivery.mode === 'auto_send'` → approve automatically and send.
  - `delivery.mode === 'review_then_send'` (default) → set `in_review` and notify reviewers.
  - Per-template try/catch so one failure can't poison the batch (existing pattern).
- **`services/reports/deliveryService.js`** emails each recipient the public link via `utils/emailService.js` with a new branded template ("Your {Project} {Monthly} report is ready"); records per-recipient `emailStatus`.
- Frequencies: weekly (`dayOfWeek`+time), monthly (`dayOfMonth`+time), quarterly (first day of quarter+time); all timezone-aware.

## 13. Tracking / open-rate

- `POST /api/public/reports/:slug/access` upserts a `ReportView` keyed on `(instance, email)`, increments `viewCount`, and sets `matchedRecipient`/`isForwarded` by comparing the entered email to `distribution.recipients`.
- A denormalized `instance.stats` rollup (unique viewers, total views, recipients-opened, forwarded-opens, first/last open) is updated on each access for fast dashboard reads.
- The creator's analytics page shows: recipient table (sent → opened? → #views → last seen), forwarders, and an opens-over-time chart — directly answering "who's taking it seriously."

## 14. Security & privacy

- Public endpoints unauthenticated but require an **unguessable `publicSlug` + `accessToken`**; rate-limited (reuse existing limiter middleware); reject if `expiresAt` passed or template archived.
- The gate email is captured as soft-PII; store **hashed IP** (not raw). Snapshots may contain sensitive financials — `expiresAfterDays` defaults to 90; expired links return 410.
- Snapshots are immutable post-approval; overrides are audited (`by`/`at`/`reason`).
- Block catalog is permission-filtered so a creator cannot snapshot data their role can't otherwise see; the scheduler resolves data in the template owner's access context.
- SMTP secrets via env (`EMAIL_*`); never client-exposed.

## 15. Reuse map (existing assets this feature builds on)

| Need | Reuse | Location |
|------|-------|----------|
| Metrics/data | `GET /leadership/overview`, budget-vs-actual, predictive, payments stats | existing controllers/services |
| Email send + templates + retry | `utils/emailService.js` (nodemailer) | backend |
| Scheduling | node-cron + `jobs/generateScheduledInsights.js` pattern, registered in `server.js` | backend |
| Image upload/storage | `multer` + `services/s3Service.js` + `models/fileModel.js` + `POST /api/files/upload` | backend |
| Public route pattern | invitation / partnership public routes (no `protect`) | backend |
| Notifications | `services/notificationService.js` + Socket.IO + NotificationBell | both |
| RBAC | `hasPermission()`, `config/permissions.js`, `data/defaultRoles.js` | backend |
| UI components | `KPICard`, `ChartCard`, `DataTable`, `PageHeader`, `PermissionGate` | `src/components/common/` |
| Charts | Recharts | frontend |
| Drag-reorder | `@dnd-kit` (already a dependency) | frontend |
| Schedule dialog UI | `AnalyticsReportsCenter.js` (repurpose) | frontend |
| API layer | per-domain object in `src/services/api.js` (raw axios) | frontend |

## 16. Phasing

| Phase | Deliverable | Key work |
|-------|-------------|----------|
| **0 — Foundations** | Internals ready | Configure SMTP env; add `reports:*` permissions + role grants; create 3 models; build `blockRegistry` with ~8 core blocks; `snapshotService.generateInstance()`; `GET /catalog`. |
| **1 — Builder** | Leader composes & previews a one-pager | Template CRUD API + UI (pick/arrange + theme + image upload via existing file API); `POST /templates/:id/generate`; preview render. |
| **2 — Public page + tracking** | Shareable tracked link | Public routes + `PublicReportPage` + email gate; `ReportView` logging + stats rollup; open-rate analytics page. |
| **3 — Review & approve** | Governed send | Review screen; overrides; flags→notify owner; review state machine + approve gate; internal "ready for review"/"sent" mailers. |
| **4 — Scheduling & delivery** | Hands-off recurring reports | `generateScheduledReports` cron; weekly/monthly/quarterly; `deliveryService` recipient emails; auto-send vs review-then-send. |
| **5 — Future** | Enhancements | PDF export/attachment; OTP gate; per-recipient unique links; AI Narrative block; richer block catalog. |

## 17. Testing strategy

- **Backend (Jest, existing setup):** `snapshotService` freezes block data correctly and isolates per-block failures; block `resolve()` functions return expected shapes (mock analytics services); permission gates on every authenticated route; public access logs/dedupes `ReportView` and computes matched/forwarded correctly; expiry/rate-limit behavior; cron selects due templates and advances `nextRunAt`; review state-machine transitions (illegal transitions rejected).
- **Frontend:** builder add/reorder/configure blocks; preview renders from generated instance; review override/flag actions hit the API; public page gate → render path; analytics table reflects view data.
- **Manual smoke:** create template → generate → review (override + flag) → approve → send to a test email → open via gate → confirm open-rate dashboard updates.

## 18. Assumptions & open questions

- **Assumed:** v1 gate is soft email capture (no verification); OTP deferred to Phase 5. Delivery defaults to review-then-send per template. Link expiry default 90 days. Quarterly = first day of calendar quarter. Reviewers default to the template creator if none specified.
- **Open (can resolve during planning):** exact default role grants for `reports:approve` (Business Head only, or also Sales/Finance Head?); whether managers get `reports:view`; whether ad-hoc (non-template) instances are exposed in v1 UI or only via "generate preview".

## 19. Out of scope

PDF generation, OTP gating, per-recipient links, AI-written narrative, editing source CRM data from the report, a freeform design canvas, and any new analytics computation. (PDF, OTP, per-recipient links, and AI narrative are explicitly Phase 5.)

# Email-to-Ticket Support System — Design Spec

**Date:** 2026-06-17
**Status:** Draft for review
**Goal:** Clients email a per-org helpdesk address with a category-prefixed subject. The platform ingests the email, opens a **ticket**, auto-replies with a ticket number + a public live-status link, and internally creates a **task assigned to the relevant department head** (sales/legal/CRM/finance). As the team works and replies, the client is emailed and the public status page updates — so weekend mail never gets silently lost.

## Reuse map (≈80% exists)
- **Outbound email:** `utils/emailService.js` `sendEmail()` (nodemailer) — auto-reply + client updates.
- **Internal work item:** `models/taskModel.js` — `category`, status state-machine, `activityLog`, `comments`, `watchers`, SLA, `linkedEntity` (polymorphic). The ticket's internal task IS a Task.
- **Dept-head resolution + alerts:** role names (`Sales Head`, `Finance Head`, `Marketing Head`, `Business Head`) + `services/notificationService.js` (`createNotification`, `notifyUsersWithPermission`).
- **Public no-login page:** `routes/publicReportRoutes.js` + `controllers/publicReportController.js` + `src/pages/public/PublicReportPage.js` — token/slug + optional email-gate + rate-limit. Fork for the ticket status page.
- **Real-time (internal):** Socket.IO already wired (`socket/socketHandler.js`, JWT-auth per connection).
- **In-app notifications:** `models/notificationModel.js` (+ TTL), bell badge.

## Architecture & flow
```
Client ──email──▶ helpdesk address ──▶ Inbound provider ──webhook──▶ /api/support/inbound
   ▲                                                                      │ (verify sig, dedup, route to org)
   │ auto-reply + updates (sendEmail)                                     ▼
   │                                                            new ticket? ── yes ─▶ SupportTicket + linked Task(assignee=dept head)
   │                                                                 │ no (reply)        │ notify head + watchers (in-app)
   │                                                                 ▼                   ▼
   └──────────────── public status page  ◀── poll/socket ── append inbound msg     team works task (existing tracking)
                     /t/:token (no login)                   to existing ticket      "Reply to client" ─▶ email + public msg
```

## Inbound ingestion (provider-abstracted)
- **Endpoint:** `POST /api/support/inbound/:provider` — unauthenticated, **signature-verified per provider**, rate-limited (reuse the public-route limiter pattern), body-size capped.
- **Adapter layer:** `services/support/inbound/<provider>.js` each normalize to a canonical shape `{ to, from, fromName, subject, text, html, messageId, inReplyTo, references[], attachments[], spamScore? }`. Providers: `mailgun`, `sendgrid` (managed parse, recommended), `ses` (S3+SNS/Lambda → webhook, all-AWS alt). The rest of the system only sees the canonical shape, so the provider is swappable.
- **Multi-tenant routing:** map the recipient address → org. Default model: platform subdomain `helpdesk.prop-vantage.com` with per-org local-part (`25south@helpdesk.prop-vantage.com`); a `SupportInbox` record maps `address → organization`. (Phase 2: custom per-org domains with verified MX.)
- **Guards:** dedup by `messageId` (skip re-delivery); ignore auto-responders/`no-reply`/`mailer-daemon` and mail with `Auto-Submitted`/`Precedence: bulk`; drop if spamScore high; strip the auto-reply’s own address to prevent loops.

## Data model (net-new + one reuse)
**`models/supportTicketModel.js`** (new):
- `organization`, `ticketNumber` (per-org sequence → display `TKT-000123`), `publicToken` (`crypto.randomBytes`, like report tokens), `category` (org-configurable; default `sales|legal|crm|finance|other`), `subject`, `status` (`new|assigned|in_progress|waiting_on_client|resolved|closed` — mirrors/derives from the linked Task), `priority`.
- `client`: `{ email, name }`. `source`: `email`. `originalMessageId`, `lastInboundMessageId`.
- `messages[]`: `{ direction:'inbound'|'outbound'|'internal', visibility:'public'|'internal', from, body, html, at, authorUserId?, attachments[] }` — the client thread (public) + internal notes interleaved, filtered by visibility for the public page.
- `linkedTaskId` (the internal Task), `assigneeUserId` (denormalized head), `lastClientNotifiedAt`, `closedAt`.
- Indexes: `{ organization, status }`, `{ organization, ticketNumber }` unique, `{ publicToken }` unique.

**Internal task = a `Task`** (reused): `category` set, `linkedEntity = { entityType:'SupportTicket', entityId }`, `assignedTo = dept head`, `assignedBy = system`, watchers = head + team. Task status changes drive ticket status + client emails. (Keeps the team in the tooling they already use.)

**`models/supportRoutingModel.js`** (new, per-org config): `category → { roleName | assigneeUserId }` with a **fallback queue** (e.g. CRM Head/admin) for unmatched/unknown subjects. Seed defaults; add **`Legal Head`** and **`CRM Head`** roles (the enum has Sales/Finance/Marketing/Business heads only) or map them to existing roles via this table.

## Category detection (subject prefix + AI fallback)
1. Parse the subject: leading token before `-`/`:` (case-insensitive, fuzzy: `legal`, `Legal Issue`, `sales`) → category.
2. If no clean prefix, **AI fallback**: classify subject+body into the org's configured categories using the existing Anthropic setup (forced single tool, constrained enum — mirrors `nlToQueryPlan`); low-confidence → fallback queue. Educate clients via the auto-reply footer ("prefix your subject with sales/legal/crm…").

## Threading (replies stay on one ticket)
- Outbound mail sets `Reply-To` to the threaded address and includes `[TKT-000123]` in the subject; store `originalMessageId`.
- On inbound: if `inReplyTo`/`references` matches a known message, OR the subject carries `[TKT-####]` → append as a `public/inbound` message to that ticket, set status `→ in_progress`/reopen if closed, notify the assignee; else open a new ticket.

## Outbound: auto-reply, client updates, public vs internal
- **Auto-reply (immediate):** "We've received your request — **TKT-000123** — track it here: `https://app/t/<token>`." Branded via existing templates.
- **Public vs internal:** team members add **internal task comments** (private) freely; to update the client they use an explicit **"Reply to client"** action on the ticket → sends an email + appends a `public/outbound` message + bumps the status page. Status transitions (`→ in progress`, `→ resolved/closed`) optionally trigger a templated client email. **Debounce** (e.g., one status email per transition; coalesce rapid changes) to avoid email storms.

## Public status page (client-facing)
- **Backend:** `GET /api/public/tickets/:token` (meta + status), `GET …/timeline` (public messages + status history) — reuse the report public-controller patterns (token validation, optional email-gate, rate-limit, view logging). Never expose internal notes/assignee PII beyond a generic "our team".
- **Frontend:** `src/pages/public/PublicTicketPage.js` (fork of `PublicReportPage`): header (TKT-#, subject, status badge, opened/updated), a **timeline** of public messages + status changes, attachments, and a "reply" hint (replying happens by email, threaded).
- **"Real-time":** v1 = short-poll (~20s + on focus) since sockets require auth; Phase 2 = a token-scoped Socket.IO namespace for true push to the public page.

## Notifications (internal)
- Add `notificationModel` types: `ticket_created`, `ticket_assigned`, `ticket_client_reply`, `ticket_status_changed`.
- On create/assign → notify the dept head (+ team via `notifyUsersWithPermission`); on client reply → notify assignee + watchers.

## Permissions & internal UI
- New `support:view|view_all|reply|assign|configure` permissions (or reuse task perms for the work item + a thin `support:reply`). Dept heads + their team + admins see tickets in their category; configure mapping = admin only.
- **Internal UI:** a **Support / Tickets** section (list filtered by category/status/assignee) + a **ticket detail** (client thread, internal notes, "Reply to client", link to the underlying Task). The day-to-day work continues in the existing task tracker; the ticket detail is the client-comms surface.
- (Tie-in: tickets are tasks, so they already show up in the workspace/My-View task queries and the new Home "what should I focus on".)

## Security / abuse / edge cases
- Webhook signature verification (per provider) + IP allow-list where available; reject unsigned.
- Attachment size/type caps; store to S3 (reuse existing storage if present) and virus-scan or restrict types; never execute.
- Public token entropy ≥ 96 bits; tokens are unguessable; optional email-gate for sensitive orgs.
- Loop protection (auto-reply suppression, `Auto-Submitted` header check); per-sender rate cap.
- Inbound failures → dead-letter + admin alert (don't silently drop — the whole point is "nothing gets missed").

## Phasing (each phase independently shippable)
1. **Internal core:** `SupportTicket` + routing config + category→head + linked Task + auto-reply, exercised by a temporary "ingest from pasted email / test endpoint". Validates the loop with no external dependency.
2. **Real inbound:** provider adapter + webhook + multi-tenant routing + dedup/threading.
3. **Client-facing:** public status page + "Reply to client" + status/update emails.
4. **Polish:** AI category fallback, admin config UI (helpdesk address, mapping, canned responses), real-time public push, SLA/escalation (auto-escalate unanswered weekend tickets Monday AM).

## Non-goals (v1)
- No full multi-channel (WhatsApp/SMS) ingestion. No client login/portal accounts (token link only). No rich agent collision-detection. No per-message read receipts on the public page. Custom per-tenant inbound domains deferred to Phase 2.

## Open decisions for review
1. Inbound provider: managed parse (recommended) vs SES — confirm before Phase 2.
2. Helpdesk addressing: platform subdomain `<org>@helpdesk.prop-vantage.com` (recommended) vs each org's own domain forwarding.
3. Categories per org + whether to add real `Legal Head`/`CRM Head` roles or map to existing.
4. Public page gate: open link vs email-OTP (reuse report gate) — likely open link for low friction.

## Testing / verification (when built)
- Unit: category parser (+ AI fallback), threading matcher, routing resolver, ticket/task status sync, dedup.
- Integration: simulated provider webhook → ticket+task+auto-reply; client reply → threaded; status change → client email + public timeline.
- Live: end-to-end with a real test inbox; public page updates; weekend-missed scenario (escalation).

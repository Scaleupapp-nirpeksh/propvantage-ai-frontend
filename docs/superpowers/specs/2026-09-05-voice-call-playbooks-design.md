# Voice Call Playbooks — Design

**Date:** 2026-09-05 · **Status:** Approved (founder) · **Scope:** backend engine + admin UI, v1

## 1. Problem

The AI voice agent (shipped 2026-09-05) has one hard-coded situation: a new lead is created → the agent calls to qualify and book a site visit. A developer's business has many situations that justify a call — a missed follow-up, tomorrow's site visit, an instalment falling due, a milestone reached, a booked buyer to welcome, a lead gone quiet — and each needs different timing, a different objective, different allowed actions, and different escalation. Today none of that is configurable; the organization cannot make the agent work for its own process.

## 2. Concept: Call Playbooks

A **playbook** is an org-owned configuration object:

> **When** *[trigger]* happens, **for** *[audience]*, **call them** *[timing, retries]* **to** *[objective]*, **using** *[allowed actions]*, **and hand over** *[on these conditions, to these people]*.

Playbooks are created from a **template library**, switched on/off individually, and edited by roles holding `voice:manage_playbooks` (default: Organization Owner, Business Head). The voice engine (assistant, tools, transcripts, post-call pipeline) is unchanged; playbooks decide *when* it dials and *what* it pursues.

## 3. v1 scope

Templates shipped and enabled-capable in v1:

1. **New enquiry qualification** — trigger `lead.created`; the existing flow, now editable.
2. **Missed follow-up rescue** — trigger `lead.followUpMissed` (follow-up date passed by N hours, default 24).
3. **Site-visit reminder** — trigger `lead.siteVisitReminder` (visit scheduled; call N hours before, default 20).
4. **Payment reminder** — trigger `installment.due` (instalment due in N days, default 3; status pending/due).

Defined but not shipped in v1 (phase 2): overdue collection, post-booking welcome, milestone update, stale-lead revival. Also `manual` — any playbook can be run on demand from a lead page.

Org-wide guardrails (set on `Organization.voiceAgent`): **cooldown** — no more than one AI call to the same person in 3 days across all playbooks; **hard window** — never outside 09:00–21:00 IST. A playbook may narrow these, and may override only with `overrideOrgGuardrails: true` (top-tier roles).

## 4. Data model

**`CallPlaybook`** — organization, templateKey, name, description, enabled, `trigger { type, params }`, `audience { projects[], minScore, statuses[], skipIfHumanContactHours }`, `timing { window{start,end}, delayMinutes, retry{maxAttempts, afterHours}, overrideOrgGuardrails }`, `objective { purpose, openingLine, mustAsk[], mustNotSay[], extraInstructions }`, `tools[]` (subset of voice actions), `handover { conditions[], notifyAssigned, notifyRoles[] }`, createdBy/updatedBy.

**`CallJob`** — organization, playbook, lead, entityType/entityId (Lead | Installment | Sale | ConstructionMilestone), `dedupKey` (unique per org), scheduledFor, status (`scheduled | calling | completed | no_answer | failed | cancelled | skipped`), attempts, maxAttempts, lastSession, outcome, reason.

**Extensions** — `CallSession.playbook`, `CallSession.callJob`; `Interaction.aiGenerated` (so "human contact" checks ignore AI calls); `Organization.voiceAgent.cooldownDays`, `.hardWindow`.

## 5. Engine (`services/voice/playbooks/`)

- **templates.js** — the library (trigger, default timing, objective text, tools, handover).
- **triggerScanner.js** — hourly per enabled playbook per org: date-based scans (`lead.followUpMissed`, `lead.siteVisitReminder`, `installment.due`) create `CallJob`s with dedup keys (`fu:<lead>:<dueISO>`, `sv:<lead>:<visitISO>`, `inst:<installment>:due`). Event-driven triggers (`lead.created`) call `enqueueForEvent(type, entity)` from existing code paths.
- **dispatcher.js** — every minute: drain jobs with `scheduledFor <= now`; per job check playbook enabled, org agent enabled, lead phone / doNotCall, audience filters, hard window + playbook window (reschedule to next window open if outside), cooldown (skip), skip-if-human-contact (skip), monthly minute budget (defer); then `startOutboundCall({ playbook, callJob })`.
- **prompt integration** — the base assistant prompt carries a `THIS CALL'S MISSION` section and an `{{openingLine}}` first message, both filled per call from the playbook (`callMission`, `openingLine`, `allowedActions`, `mustAsk`, `mustNotSay`). Allowed tools are also enforced server-side in `handleToolCalls` (disallowed tool → "not available on this call").
- **post-call** — job completes with the session outcome; no answer / voicemail → retry after `retry.afterHours` up to `maxAttempts`, else `no_answer`; handover conditions raise a Critical task + notification to assigned exec and configured roles.

## 6. API

`/api/voice/playbooks` — list, create (from template or blank), get, update, delete, toggle; `/templates`; `/:id/test-call { phone }`; `/:id/stats`. `/api/voice/jobs` — list upcoming/recent (filter by playbook/status), cancel. `POST /api/voice/calls { leadId, playbookId? }` — manual run. Permissions: `voice:manage_playbooks` (configure; Owner and Business Head by default). Manual calls stay gated by `leads:update`; viewing by `leads:view`.

## 7. UI

Settings → Voice Agent gains tabs: **Overview** (existing), **Playbooks** (list with on/off, trigger summary, month stats; *New from template*; editor with the six plain-language sections and *Test on my number*), **Scheduled calls** (job queue with cancel). Lead page: *Call with AI* becomes a split button with a playbook picker.

## 8. Non-goals (v1)

Visual workflow builder; per-playbook voice/persona; inbound call routing; SMS/WhatsApp follow-through; A/B testing of scripts.

## 9. Testing

Unit (DB-free): template validation, dedup-key generation, window/cooldown/retry arithmetic, mission-prompt rendering, tool allow-list enforcement. Scanner/dispatcher run against mocked models. Manual: each v1 template test-called from the editor.

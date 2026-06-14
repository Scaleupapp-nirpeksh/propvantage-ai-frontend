# Leadership Report Builder — Phase 4a (Scheduling & Delivery API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the email infrastructure, then generate reports on a weekly/monthly/quarterly schedule (cron) and email the approved report's public link to stakeholders — auto-send or review-then-send per template — with per-recipient delivery status.

**Architecture:** Repairs `utils/emailService.js` (installs `nodemailer`+`date-fns`, fixes the `createTransport` typo, adds a generic `sendEmail`). A pure `computeNextRunAt` schedules templates; a `deliveryService` emails recipients (best-effort, per-recipient status) and sets `distribution.recipients` so Phase 2 open-tracking can attribute opens. A `node-cron` job (mirroring `jobs/generateScheduledInsights.js`) generates due instances and routes them to auto-send or review. A manual `POST /instances/:id/send` covers the review-then-send path after approval.

**Tech Stack:** Node.js (ESM), Express, Mongoose 8, `node-cron`, `nodemailer`, `date-fns`, Jest 29.

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-backend`. Paths relative to that root.

**Depends on:** `ReportTemplate` (`schedule`, `delivery.{mode,recipients,reviewers}`, `access.expiresAfterDays`); `ReportInstance` (`distribution.{status,recipients}`, `review.status`, `publicSlug`); `services/reports/snapshotService.generateInstance`; `reviewState.nextReviewStatus`; `notificationService`; `utils/emailService.js`.

**Scope note:** Phase 4 = **4a (this — backend)** + **4b (schedule/delivery UI)**. 4a produces testable software: a working (repaired) email path, a TDD'd scheduler, and delivery + cron + manual-send wiring.

**SECRETS:** `EMAIL_*` go in the **gitignored** `.env` (and on the server's env) — NEVER in code, this plan, or a commit. The controller/agent must not print or hardcode them.

**Patterns (verbatim from the repo):**
- Cron job: `import cron from 'node-cron'; cron.schedule(EXPR, () => fn().catch(...), { timezone: TZ });` registered by a `registerX()` fn called in `server.js` startup.
- Email send: ensure `transporter`, then `transporter.sendMail({ from:{name,address}, to, subject, html, text })` inside a retry loop over `EMAIL_CONFIG.maxRetries`.
- Email config: `EMAIL_SERVICE` (default `gmail`), `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_NAME`, `EMAIL_FROM_EMAIL`.

---

## File Structure

**New files:**
- `services/reports/scheduleHelper.js` — pure `computeNextRunAt(schedule, fromDate)`.
- `tests/unit/scheduleHelper.test.js`
- `services/reports/deliveryService.js` — `sendReportToRecipients(instance)`.
- `jobs/generateScheduledReports.js` — cron registration + run loop.

**Modified files:**
- `package.json` — add `nodemailer`, `date-fns` deps (+ `npm install`).
- `utils/emailService.js` — fix `createTransport` typo; add `export const sendEmail`.
- `controllers/reportReviewController.js` — add `sendReport` (manual send).
- `routes/reportRoutes.js` — add `POST /instances/:id/send`.
- `controllers/reportTemplateController.js` — compute `schedule.nextRunAt` on create/update.
- `server.js` — register the cron job.

---

## Task 1: Repair the email service

**Files:** Modify `package.json`, `utils/emailService.js`

- [ ] **Step 1: Add the missing deps.** `utils/emailService.js` imports `nodemailer` and `date-fns`, neither of which is installed.

```bash
npm install nodemailer@^6.9.14 date-fns@^3.6.0
```
Verify they're now in `package.json` `dependencies` and under `node_modules/`.

- [ ] **Step 2: Fix the transporter typo.** In `utils/emailService.js`, the call is `nodemailer.createTransporter(config)` — nodemailer's method is `createTransport`. Change line ~68:

```js
    transporter = nodemailer.createTransporter(config);
```
to:
```js
    transporter = nodemailer.createTransport(config);
```

- [ ] **Step 3: Add a generic `sendEmail`.** Append to `utils/emailService.js` (before the `export default {...}` block), mirroring the existing transporter-ensure + retry pattern:

```js
/**
 * Generic email send with retry. Used by the report delivery service.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || !html) throw new Error('sendEmail requires to, subject, and html');
  if (!transporter) transporter = createTransporter();
  if (!transporter) throw new Error('Email service not available');

  const emailOptions = {
    from: { name: EMAIL_CONFIG.from.name, address: EMAIL_CONFIG.from.email },
    to, subject, html, text: text || '',
  };

  let lastError = null;
  for (let attempt = 1; attempt <= EMAIL_CONFIG.maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail(emailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      lastError = error;
      if (attempt < EMAIL_CONFIG.maxRetries) {
        await new Promise((r) => setTimeout(r, EMAIL_CONFIG.retryDelay));
      }
    }
  }
  throw new Error(`Failed to send email after ${EMAIL_CONFIG.maxRetries} attempts: ${lastError?.message}`);
};
```

Also add `sendEmail` to the `export default { ... }` object at the bottom of the file (alongside the existing exports).

- [ ] **Step 4: Add a unit test that the module loads + exports `sendEmail`.**

Create `tests/unit/emailService.smoke.test.js`:

```js
// File: tests/unit/emailService.smoke.test.js
// Verifies the email module imports cleanly (deps installed, no createTransport typo).
// Does NOT send a real email (no creds in the test env).
import { sendEmail } from '../../utils/emailService.js';

describe('emailService', () => {
  it('imports without throwing and exposes sendEmail', () => {
    expect(typeof sendEmail).toBe('function');
  });
  it('rejects a call missing required fields', async () => {
    await expect(sendEmail({ to: '', subject: '', html: '' })).rejects.toThrow();
  });
});
```

- [ ] **Step 5: Run.** `npm run test:unit -- emailService.smoke` → PASS (2 tests). (If it fails with "Cannot find module 'nodemailer'/'date-fns'", Step 1 didn't install; re-run.)

- [ ] **Step 6: Configure the local `.env`** (the CONTROLLER does this by hand — do NOT put values in a subagent prompt or any committed file). Add to `/Users/nirpekshnandan/My Products/propvantage-ai-backend/.env`:

```
EMAIL_SERVICE=gmail
EMAIL_USER=<gmail address>
EMAIL_PASS=<gmail app password>
EMAIL_FROM_NAME=PropVantage AI
EMAIL_FROM_EMAIL=<gmail address>
```

(`.env` is gitignored — verified. The same vars must be set on the server's environment for production sends.)

- [ ] **Step 7: Commit** (code only — `.env` is gitignored and excluded):

```bash
git add package.json package-lock.json utils/emailService.js tests/unit/emailService.smoke.test.js
git commit -m "fix(email): install nodemailer/date-fns, fix createTransport, add sendEmail" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Schedule helper (pure, TDD)

**Files:** Create `services/reports/scheduleHelper.js`, `tests/unit/scheduleHelper.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: tests/unit/scheduleHelper.test.js
import { computeNextRunAt } from '../../services/reports/scheduleHelper.js';

// All assertions use a fixed `from` so the helper stays deterministic/pure.
describe('computeNextRunAt', () => {
  it('weekly: next occurrence of dayOfWeek at time (strictly future)', () => {
    // from = Wed 2026-06-10 09:00 local; weekly Mon (1) 08:00 → Mon 2026-06-15 08:00
    const from = new Date(2026, 5, 10, 9, 0, 0);
    const next = computeNextRunAt({ frequency: 'weekly', dayOfWeek: 1, time: '08:00' }, from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(0);
  });

  it('monthly: next dayOfMonth at time (rolls to next month when past)', () => {
    const from = new Date(2026, 5, 20, 9, 0, 0); // Jun 20
    const next = computeNextRunAt({ frequency: 'monthly', dayOfMonth: 1, time: '07:30' }, from);
    expect(next.getMonth()).toBe(6); // July
    expect(next.getDate()).toBe(1);
    expect(next.getHours()).toBe(7);
    expect(next.getMinutes()).toBe(30);
  });

  it('quarterly: first day of the next calendar quarter at time', () => {
    const from = new Date(2026, 4, 5, 9, 0, 0); // May (Q2) → next quarter starts Jul 1
    const next = computeNextRunAt({ frequency: 'quarterly', time: '09:00' }, from);
    expect(next.getMonth()).toBe(6); // July
    expect(next.getDate()).toBe(1);
  });

  it('returns null when frequency is missing/unknown', () => {
    expect(computeNextRunAt({ frequency: 'daily' }, new Date(2026, 0, 1))).toBeNull();
    expect(computeNextRunAt({}, new Date(2026, 0, 1))).toBeNull();
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- scheduleHelper` → module not found.

- [ ] **Step 3: Implement**

```js
// File: services/reports/scheduleHelper.js
// Pure scheduling math for report templates. No I/O, no Date.now (caller passes `from`).

const parseTime = (time) => {
  const [h, m] = String(time || '09:00').split(':').map((n) => parseInt(n, 10));
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
};

/**
 * Compute the next run timestamp for a schedule, strictly after `from`.
 * @param {{ frequency, dayOfWeek?, dayOfMonth?, time? }} schedule
 * @param {Date} from
 * @returns {Date|null}
 */
export const computeNextRunAt = (schedule = {}, from = new Date(0)) => {
  const { frequency } = schedule;
  const { h, m } = parseTime(schedule.time);

  if (frequency === 'weekly') {
    const target = ((schedule.dayOfWeek ?? 1) % 7 + 7) % 7;
    const next = new Date(from.getFullYear(), from.getMonth(), from.getDate(), h, m, 0, 0);
    let delta = (target - next.getDay() + 7) % 7;
    if (delta === 0 && next <= from) delta = 7;
    next.setDate(next.getDate() + delta);
    return next;
  }

  if (frequency === 'monthly') {
    const day = Math.min(Math.max(schedule.dayOfMonth ?? 1, 1), 28);
    let next = new Date(from.getFullYear(), from.getMonth(), day, h, m, 0, 0);
    if (next <= from) next = new Date(from.getFullYear(), from.getMonth() + 1, day, h, m, 0, 0);
    return next;
  }

  if (frequency === 'quarterly') {
    const q = Math.floor(from.getMonth() / 3);     // 0..3
    let startMonth = (q + 1) * 3;                   // first month of next quarter
    let year = from.getFullYear();
    if (startMonth > 11) { startMonth = 0; year += 1; }
    return new Date(year, startMonth, 1, h, m, 0, 0);
  }

  return null;
};
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- scheduleHelper` → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add services/reports/scheduleHelper.js tests/unit/scheduleHelper.test.js
git commit -m "feat(reports): add pure schedule next-run helper" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Delivery service

**Files:** Create `services/reports/deliveryService.js`

**Context:** Emails the approved report's public link to each recipient (best-effort — one bad address never aborts the batch), records per-recipient `emailStatus`, and sets `distribution.recipients` so Phase 2 attributes opens. Recipients come from the template's `delivery.recipients`.

- [ ] **Step 1: Create the service**

```js
// File: services/reports/deliveryService.js
// Description: Emails an approved report's public link to its stakeholders.

import ReportTemplate from '../../models/reportTemplateModel.js';
import { sendEmail } from '../../utils/emailService.js';

const publicUrl = (slug) => {
  const base = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3001').replace(/\/$/, '');
  return `${base}/r/${slug}`;
};

const buildHtml = ({ reportTitle, periodLabel, link, orgName }) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#1e88e5;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:13px;opacity:.85">${orgName || 'PropVantage AI'}</div>
      <div style="font-size:20px;font-weight:700">${reportTitle || 'Report'}</div>
      ${periodLabel ? `<div style="font-size:13px;opacity:.9">${periodLabel}</div>` : ''}
    </div>
    <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      <p>A new report is ready for you to review.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${link}" style="background:#1e88e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600">View report</a>
      </p>
      <p style="font-size:12px;color:#777">If the button doesn't work, paste this link into your browser:<br>${link}</p>
    </div>
  </div>`;

/**
 * Send the report's public link to the template's recipients.
 * Sets instance.distribution.recipients + per-recipient emailStatus and distribution.status.
 * @returns {Promise<{ sent: number, failed: number, total: number }>}
 */
export const sendReportToRecipients = async (instance) => {
  const template = instance.template ? await ReportTemplate.findById(instance.template).select('delivery name organization') : null;
  const recipients = (template?.delivery?.recipients || []).filter((r) => r && r.email);

  if (recipients.length === 0) {
    instance.distribution.status = 'sent';
    instance.distribution.sentAt = new Date();
    instance.distribution.recipients = [];
    await instance.save();
    return { sent: 0, failed: 0, total: 0 };
  }

  const link = publicUrl(instance.publicSlug);
  instance.distribution.status = 'sending';
  await instance.save();

  const results = [];
  for (const r of recipients) {
    const rec = { email: r.email, name: r.name, emailStatus: 'pending', emailedAt: null };
    try {
      await sendEmail({
        to: r.email,
        subject: `${instance.title || 'Your report'} is ready`,
        html: buildHtml({ reportTitle: instance.title, periodLabel: instance.periodLabel, link, orgName: template?.name }),
        text: `${instance.title || 'Your report'} is ready. View it: ${link}`,
      });
      rec.emailStatus = 'sent';
      rec.emailedAt = new Date();
    } catch (err) {
      rec.emailStatus = 'failed';
    }
    results.push(rec);
  }

  instance.distribution.recipients = results;
  const anySent = results.some((r) => r.emailStatus === 'sent');
  instance.distribution.status = anySent ? 'sent' : 'failed';
  if (anySent) instance.distribution.sentAt = new Date();
  await instance.save();

  return {
    sent: results.filter((r) => r.emailStatus === 'sent').length,
    failed: results.filter((r) => r.emailStatus === 'failed').length,
    total: results.length,
  };
};
```

- [ ] **Step 2: Syntax check.** `node --check services/reports/deliveryService.js` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add services/reports/deliveryService.js
git commit -m "feat(reports): add report delivery service (email recipients)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Manual send endpoint

**Files:** Modify `controllers/reportReviewController.js`, `routes/reportRoutes.js`

- [ ] **Step 1: Add the controller.** Append to `controllers/reportReviewController.js`:

```js
import { sendReportToRecipients } from '../services/reports/deliveryService.js';

/**
 * @desc    Send an approved report's public link to its stakeholders
 * @route   POST /api/reports/instances/:id/send
 * @access  Private (reports:approve)
 */
export const sendReport = asyncHandler(async (req, res) => {
  const instance = await findOwned(req);
  if (instance.review?.status !== 'approved') {
    res.status(409); throw new Error('Only approved reports can be sent');
  }
  const summary = await sendReportToRecipients(instance);
  res.json({ success: true, data: { distribution: instance.distribution }, message: `Sent to ${summary.sent}/${summary.total} recipients`, summary });
});
```

- [ ] **Step 2: Add the route.** In `routes/reportRoutes.js`, add `sendReport` to the `reportReviewController` import, and add (after the existing review routes):

```js
router.post('/instances/:id/send', hasPermission(PERMISSIONS.REPORTS.APPROVE), sendReport);
```

- [ ] **Step 3: Verify.** `node --check controllers/reportReviewController.js routes/reportRoutes.js` → exit 0; `node --input-type=module -e "import('./routes/reportRoutes.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK.

- [ ] **Step 4: Commit**

```bash
git add controllers/reportReviewController.js routes/reportRoutes.js
git commit -m "feat(reports): add manual send endpoint for approved reports" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Compute nextRunAt on template save

**Files:** Modify `controllers/reportTemplateController.js`

- [ ] **Step 1: Import the helper** at the top:

```js
import { computeNextRunAt } from '../services/reports/scheduleHelper.js';
```

- [ ] **Step 2: Set nextRunAt in `createTemplate`** (after building, before responding — easiest: set on the doc before `create`, or recompute after). Replace the `ReportTemplate.create({...})` call so the schedule's next run is computed when enabled:

```js
  const data = { ...req.body, organization: req.user.organization, createdBy: req.user._id, updatedBy: req.user._id };
  if (data.schedule?.enabled) {
    data.schedule.nextRunAt = computeNextRunAt(data.schedule, new Date());
  }
  const template = await ReportTemplate.create(data);
```

- [ ] **Step 3: Recompute in `updateTemplate`** — after applying fields and before `template.save()`, add:

```js
  if (template.schedule?.enabled) {
    template.schedule.nextRunAt = computeNextRunAt(template.schedule, new Date());
  } else if (template.schedule) {
    template.schedule.nextRunAt = undefined;
  }
```

- [ ] **Step 4: Verify.** `node --check controllers/reportTemplateController.js` → exit 0; `npm run test:unit` → all green (no regressions).

- [ ] **Step 5: Commit**

```bash
git add controllers/reportTemplateController.js
git commit -m "feat(reports): compute schedule nextRunAt on template save" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Cron job + registration

**Files:** Create `jobs/generateScheduledReports.js`; modify `server.js`

**Context:** Mirrors `jobs/generateScheduledInsights.js`. Runs hourly; finds due templates; generates an instance; advances `nextRunAt`; routes per `delivery.mode`. Per-template try/catch.

- [ ] **Step 1: Create the job**

```js
// File: jobs/generateScheduledReports.js
// Description: node-cron — generate scheduled report instances and route them
//   to auto-send or review. Mirrors jobs/generateScheduledInsights.js.

import cron from 'node-cron';
import ReportTemplate from '../models/reportTemplateModel.js';
import { generateInstance } from '../services/reports/snapshotService.js';
import { computeNextRunAt } from '../services/reports/scheduleHelper.js';
import { sendReportToRecipients } from '../services/reports/deliveryService.js';
import { notifyUsersWithPermission } from '../services/notificationService.js';

const REPORTS_CRON = process.env.REPORT_SCHEDULE_CRON || '0 * * * *'; // hourly
const TZ = process.env.INSIGHT_DEFAULT_TIMEZONE || 'Asia/Kolkata';

export async function runDueReports(now = new Date()) {
  const due = await ReportTemplate.find({
    status: 'active',
    'schedule.enabled': true,
    'schedule.nextRunAt': { $lte: now },
  });

  const summary = { due: due.length, generated: 0, autoSent: 0, queuedForReview: 0, failed: [] };

  for (const template of due) {
    try {
      const instance = await generateInstance(template, { createdBy: template.createdBy, accessibleProjectIds: null });
      summary.generated++;

      template.schedule.nextRunAt = computeNextRunAt(template.schedule, now);
      await template.save();

      if (template.delivery?.mode === 'auto_send') {
        instance.review.status = 'approved';
        instance.review.approvedAt = now;
        await instance.save();
        await sendReportToRecipients(instance);
        summary.autoSent++;
      } else {
        instance.review.status = 'in_review';
        await instance.save();
        await notifyUsersWithPermission({
          organizationId: template.organization,
          permission: 'reports:approve',
          type: 'report_ready_for_review',
          title: 'A scheduled report is ready for review',
          message: `${instance.title || 'A report'} was generated on schedule and awaits approval.`,
          actionUrl: `/reports/generated/${instance._id}/review`,
          relatedEntity: { entityType: 'ReportInstance', entityId: instance._id, displayLabel: instance.title || 'Report' },
        });
        summary.queuedForReview++;
      }
    } catch (err) {
      summary.failed.push({ templateId: String(template._id), error: err.message });
    }
  }

  console.log('[generateScheduledReports]', JSON.stringify(summary));
  return summary;
}

export function registerScheduledReportJobs() {
  cron.schedule(REPORTS_CRON, () => {
    runDueReports().catch((err) => console.error('[generateScheduledReports] fatal:', err.message));
  }, { timezone: TZ });
  console.log(`[generateScheduledReports] cron registered (cron='${REPORTS_CRON}', tz='${TZ}')`);
}

export default { registerScheduledReportJobs, runDueReports };
```

- [ ] **Step 2: Register in server.js.** Add the import next to the existing `registerScheduledInsightJobs` import:

```js
import { registerScheduledReportJobs } from './jobs/generateScheduledReports.js';
```

In the startup block where `registerScheduledInsightJobs()` is called (inside its `try`), add right after it:

```js
    registerScheduledReportJobs();
```

- [ ] **Step 3: Verify.** `node --check jobs/generateScheduledReports.js server.js` → exit 0; `node --input-type=module -e "import('./jobs/generateScheduledReports.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK. `npm run test:unit` → all green.

- [ ] **Step 4: Commit**

```bash
git add jobs/generateScheduledReports.js server.js
git commit -m "feat(reports): add scheduled report cron (generate + route to send/review)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Verify + manual smoke (documented)

- [ ] **Step 1: Full unit suite.** `npm run test:unit` → all green (incl. `scheduleHelper` + `emailService.smoke`; expect ~70 tests).

- [ ] **Step 2: Manual smoke** (server running with `EMAIL_*` set; a template with `delivery.recipients` including a real test inbox; an approved instance):

```bash
# Configure a template's schedule + recipients (via the API or 4b UI), then:
ID=<approvedInstanceId>; TOKEN=<jwt-with-reports:approve>
curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/reports/instances/$ID/send | head -c 200
#   → {"success":true,"message":"Sent to 1/1 recipients","data":{"distribution":{"status":"sent",...}}}
# Check the test inbox for the "… is ready" email with a /r/<slug> link.
# Cron: temporarily set REPORT_SCHEDULE_CRON='* * * * *' and a template nextRunAt in the past, watch the logs for [generateScheduledReports].
```

- [ ] **Step 3:** Confirm: `sendReport` on an approved report returns a per-recipient summary and the recipient receives the email; a non-approved send → 409; the cron generates a due template's instance and either sends (auto) or queues for review. Record results. (Defer if email creds/server unavailable — the smoke suite verifies the module loads.)

---

## Self-Review

**1. Spec coverage (Phase 4 backend):** email-infra fix (deps + typo + `sendEmail`) → Task 1 ✅; weekly/monthly/quarterly scheduling (`computeNextRunAt`, nextRunAt on save) → Tasks 2,5 ✅; cron generation + route to auto-send/review → Task 6 ✅; email the link to stakeholders with per-recipient status → Tasks 3,4 ✅; sets `distribution.recipients` for Phase 2 attribution → Task 3 ✅.

**2. Placeholder scan:** complete code + exact commands; `.env` values intentionally omitted (secrets); manual smoke is explicit verification. ✅

**3. Type/name consistency:** `computeNextRunAt` (Task 2) used by template controller (Task 5) + cron (Task 6). `sendEmail` (Task 1) used by `deliveryService` (Task 3). `sendReportToRecipients` (Task 3) used by `sendReport` (Task 4) + cron (Task 6). `generateInstance`/`notifyUsersWithPermission`/`nextReviewStatus` exist. `ReportTemplate.delivery.recipients`/`ReportInstance.distribution` subschemas exist (Phase 0). ✅

**4. Convention match:** cron mirrors `generateScheduledInsights`; email send mirrors `sendInvitationEmail`; controllers use `asyncHandler` + `{success,data}` + org-scoped `findOwned`; 409 for illegal sends. ✅

**Security/robustness:** secrets only in gitignored `.env` / server env. Delivery is best-effort per recipient (one bad address ≠ batch failure). Auto-send is gated by the template owner's explicit `delivery.mode='auto_send'`. `computeNextRunAt` is pure/deterministic. Cron uses per-template try/catch.

---

## Execution Handoff

After 4a, **Phase 4b (Schedule/Delivery UI)**: extend the builder state with `schedule`+`delivery`; a "Schedule & delivery" dialog (frequency/day/time/timezone, mode, a recipients editor); and a "Send to stakeholders" action on the approved review screen calling `POST /instances/:id/send`. After 4b, the full feature is live end-to-end: build → review → approve → schedule/auto-deliver → track opens.

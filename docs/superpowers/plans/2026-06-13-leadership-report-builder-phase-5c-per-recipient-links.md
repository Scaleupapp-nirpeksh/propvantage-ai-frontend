# Leadership Report Builder — Phase 5c (Per-Recipient Unique Links) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each stakeholder a unique tokenized link so their opens are attributed precisely with no email gate, while the plain shared link keeps working with the gate.

**Architecture:** At send time, `deliveryService` mints a per-recipient token (stored on `distribution.recipients[].token`) and emails each recipient `/r/:slug?t=<token>`. The public access endpoint accepts a `token` that resolves to a known recipient (attributed as `matchedRecipient`, no email needed); without a token it falls back to the Phase 2 email gate. The public page auto-opens when a token is in the URL.

**Tech Stack:** Node.js (ESM), Mongoose, `crypto`; React 18, react-router.

**Repos:** backend `/Users/nirpekshnandan/My Products/propvantage-ai-backend`, frontend `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`.

**Depends on:** Phase 2 `publicReportController` (`accessPublicReport`), `viewTracking` (`classifyViewer`), `reportViewModel`; Phase 4 `deliveryService`; Phase 0 `reportInstanceModel` (`distribution.recipients` subschema); frontend `PublicReportPage`, `publicReportAPI`.

---

## File Structure

**Backend modified:** `models/reportInstanceModel.js` (`token` on recipient), `services/reports/viewTracking.js` (+`pickRecipientByToken`), `tests/unit/viewTracking.test.js`, `services/reports/deliveryService.js` (mint token + per-recipient link), `controllers/publicReportController.js` (token path).
**Frontend modified:** `src/services/api.js` (`access` takes a body), `src/pages/public/PublicReportPage.js` (token auto-open).

---

## Task 1: Recipient token + lookup helper (TDD)

**Repo:** backend. **Files:** modify `models/reportInstanceModel.js`, `services/reports/viewTracking.js`, `tests/unit/viewTracking.test.js`.

- [ ] **Step 1: Add the model field.** In `models/reportInstanceModel.js`, in `recipientSchema`, add a `token` field:

```js
const recipientSchema = new mongoose.Schema(
  {
    email: { type: String },
    name: { type: String },
    emailStatus: { type: String, enum: RECIPIENT_EMAIL_STATUSES, default: 'pending' },
    emailedAt: { type: Date },
    token: { type: String },
  },
  { _id: false }
);
```

- [ ] **Step 2: Write the failing test.** In `tests/unit/viewTracking.test.js`, add:

```js
import { pickRecipientByToken } from '../../services/reports/viewTracking.js';

describe('pickRecipientByToken', () => {
  const recipients = [{ email: 'a@x.com', token: 't1' }, { email: 'b@x.com', token: 't2' }];
  it('finds a recipient by exact token', () => {
    expect(pickRecipientByToken(recipients, 't2')).toEqual({ email: 'b@x.com', token: 't2' });
  });
  it('returns null for a missing/empty token', () => {
    expect(pickRecipientByToken(recipients, 'nope')).toBeNull();
    expect(pickRecipientByToken(recipients, '')).toBeNull();
    expect(pickRecipientByToken(undefined, 't1')).toBeNull();
  });
});
```

- [ ] **Step 3: Implement** in `services/reports/viewTracking.js` (append):

```js
/** Find a recipient by their unique token, or null. Pure. */
export const pickRecipientByToken = (recipients, token) => {
  if (!token) return null;
  return (recipients || []).find((r) => r && r.token && r.token === token) || null;
};
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- viewTracking` → PASS (adds 2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/reportInstanceModel.js services/reports/viewTracking.js tests/unit/viewTracking.test.js
git commit -m "feat(reports): add per-recipient token + lookup helper" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Mint tokens + per-recipient links in delivery

**Repo:** backend. **Files:** modify `services/reports/deliveryService.js`.

- [ ] **Step 1: Import crypto** at the top:

```js
import crypto from 'crypto';
```

- [ ] **Step 2: Mint a token per recipient and use a per-recipient link.** In `sendReportToRecipients`, inside the `for (const r of recipients)` loop, replace the `rec` construction + `link` usage so each recipient gets a unique token and link:

```js
  const baseLink = publicUrl(instance.publicSlug);
  // (remove the single `const link = publicUrl(...)` above the loop if present)
  ...
  for (const r of recipients) {
    const token = crypto.randomBytes(12).toString('base64url');
    const link = `${baseLink}?t=${token}`;
    const rec = { email: r.email, name: r.name, emailStatus: 'pending', emailedAt: null, token };
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
```

(Ensure the earlier `const link = publicUrl(instance.publicSlug);` line above the loop is removed — the link is now per-recipient. The empty-recipients early-return path is unchanged.)

- [ ] **Step 3: Verify.** `node --check services/reports/deliveryService.js` → exit 0; `npm run test:unit` → green (no unit test covers deliveryService directly; this confirms no regressions).

- [ ] **Step 4: Commit**

```bash
git add services/reports/deliveryService.js
git commit -m "feat(reports): mint per-recipient tokens + unique links on send" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Token path in public access

**Repo:** backend. **Files:** modify `controllers/publicReportController.js`.

- [ ] **Step 1: Import the helper.** Add to the existing `viewTracking` import:

```js
import { classifyViewer, computeInstanceStats, pickRecipientByToken } from '../services/reports/viewTracking.js';
```

- [ ] **Step 2: Add the token branch in `accessPublicReport`.** Replace the block that validates email + classifies the viewer (from the `const { email } = req.body...` line through the `classifyViewer(...)` call) with:

```js
  const { email, token } = req.body || {};
  const recipients = (instance.distribution?.recipients || []);

  let normEmail, matchedRecipient, isForwarded;
  if (token) {
    const recipient = pickRecipientByToken(recipients, token);
    if (!recipient) { res.status(401); throw new Error('This report link is invalid'); }
    normEmail = String(recipient.email || '').toLowerCase().trim();
    matchedRecipient = true;
    isForwarded = false;
  } else {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      res.status(400); throw new Error('A valid email is required to view this report');
    }
    normEmail = String(email).toLowerCase().trim();
    const recipientEmails = recipients.map((r) => r.email);
    ({ matchedRecipient, isForwarded } = classifyViewer(normEmail, recipientEmails));
  }
  const now = new Date();
```

(The rest of the handler — the `ReportView.findOneAndUpdate` upsert keyed on `normEmail`, the stats recompute, and the response — is unchanged. The approval/expiry guards earlier in the handler stay.)

- [ ] **Step 3: Verify.** `node --check controllers/publicReportController.js` → exit 0; `node --input-type=module -e "import('./routes/publicReportRoutes.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK; `npm run test:unit` → green.

- [ ] **Step 4: Commit**

```bash
git add controllers/publicReportController.js
git commit -m "feat(reports): accept per-recipient token in public access" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Frontend — auto-open with a token

**Repo:** frontend. **Files:** modify `src/services/api.js`, `src/pages/public/PublicReportPage.js`.

- [ ] **Step 1: Let `access` take a body.** In `src/services/api.js`, change `publicReportAPI.access`:

```js
  access: (slug, body) => publicApi.post(`/public/reports/${slug}/access`, body),
```

- [ ] **Step 2: Auto-open on token.** In `src/pages/public/PublicReportPage.js`:
  - Add `useSearchParams` to the react-router import: `import { useParams, useSearchParams } from 'react-router-dom';`
  - Read the token: after `const { slug } = useParams();` add `const [searchParams] = useSearchParams(); const token = searchParams.get('t');`
  - Replace `handleSubmit` to use a body, and add a token auto-open. Change the access call in `handleSubmit`:

```js
      const res = await publicReportAPI.access(slug, { email });
```
  - After the existing `loadMeta` effect, add a token effect that opens the report without the gate:

```js
  useEffect(() => {
    if (!token || status === 'viewing') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await publicReportAPI.access(slug, { token });
        if (!cancelled) { setReport(res.data?.data || null); setStatus('viewing'); }
      } catch (err) {
        // Invalid/expired token → fall back to the email gate (status stays 'gate' once meta loads).
      }
    })();
    return () => { cancelled = true; };
  }, [token, slug, status]);
```

(When a valid token is present the viewer never sees the gate; when it's absent or invalid they get the normal email gate.)

- [ ] **Step 3: Verify.** `CI=false npm run build` → compiles.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.js src/pages/public/PublicReportPage.js
git commit -m "feat(reports): auto-open public report from a per-recipient token" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Verify + smoke

- [ ] **Step 1: Backend** `npm run test:unit` → green. **Frontend** `CI=false npm run build` → compiles.
- [ ] **Step 2: Manual smoke:** approve a report with a recipient (real inbox) → **Send to stakeholders** → the email link now ends `?t=<token>`. Opening it goes **straight to the report** (no gate) and the open-rate dashboard shows that recipient as **Recipient** (matched). Opening the plain `/r/:slug` (no token) still shows the email gate. A tampered `?t=garbage` → falls back to the gate. Record results.

---

## Self-Review

**Spec coverage:** per-recipient unique links with precise, gate-free attribution → Tasks 2,3,4 ✅; plain shared link still gated → Task 3 (fallback) ✅; token stored per recipient → Task 1 ✅.
**Placeholder scan:** complete code + exact commands; `pickRecipientByToken` unit-tested; access/delivery verified by `node --check` + smoke. ✅
**Type/name consistency:** `pickRecipientByToken` (Task 1) used by `accessPublicReport` (Task 3); `recipient.token` minted in delivery (Task 2), stored via the model field (Task 1), resolved in access (Task 3); `publicReportAPI.access(slug, body)` (Task 4) called with `{email}` or `{token}` consistently. ✅
**Security:** tokens are 96-bit `crypto.randomBytes` (unguessable); an invalid token returns 401 and the page degrades to the email gate (no info leak); approval + expiry guards run before token resolution. A token identifies a recipient but does not bypass approval/expiry.

---

## Execution Handoff

Remaining Phase 5: **5d** OTP-verified gate.

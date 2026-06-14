# Leadership Report Builder — Phase 5d (OTP-Verified Gate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optionally require an emailed one-time code before a viewer can open a report (opt-in per template), for trustworthy attribution.

**Architecture:** A new `email_otp` gate type. When a template's `access.gate === 'email_otp'`, the public flow requires: enter email → backend emails a 6-digit code (hashed + TTL-stored in a new `ReportOtp` collection) → enter code → verified → snapshot. The soft email gate (`email`) and per-recipient token (5c, bypasses OTP) are unchanged. Pure OTP helpers are TDD'd.

**Tech Stack:** Node.js (ESM), Mongoose (TTL index), `crypto`; React 18, MUI v5.

**Repos:** backend `/Users/nirpekshnandan/My Products/propvantage-ai-backend`, frontend `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`.

**Depends on:** Phase 0 `reportTemplateModel` (`GATE_TYPES`, `access.gate`), `reportInstanceModel` (`gate`); Phase 2 `publicReportController`, `publicReportRoutes`; Phase 4 `emailService.sendEmail`; Phase 5c `accessPublicReport` token branch; frontend `PublicReportPage`, `publicReportAPI`, `ScheduleDeliveryDialog`, `builderState`.

---

## File Structure

**Backend new:** `models/reportOtpModel.js`; `services/reports/otp.js` (pure helpers) + `tests/unit/otp.test.js`.
**Backend modified:** `models/reportTemplateModel.js` (`'email_otp'` in `GATE_TYPES`) + `tests/unit/reportTemplateModel.test.js`; `controllers/publicReportController.js` (`requestOtp` + enforce); `routes/publicReportRoutes.js` (request-otp route).
**Frontend modified:** `src/pages/reports/builderState.js` (`access` state) + test; `src/components/reports/ScheduleDeliveryDialog.js` (gate selector); `src/services/api.js` (`requestOtp`); `src/pages/public/PublicReportPage.js` (OTP step).

---

## Task 1: OTP gate type + pure helpers (TDD)

**Repo:** backend. **Files:** modify `models/reportTemplateModel.js` + its test; create `services/reports/otp.js`, `tests/unit/otp.test.js`.

- [ ] **Step 1: Add `'email_otp'` to `GATE_TYPES`.** In `models/reportTemplateModel.js`:

```js
export const GATE_TYPES = ['email', 'email_otp', 'public'];
```

(`ReportInstance.gate` imports `GATE_TYPES`, so it inherits the new value automatically.)

- [ ] **Step 2: Write OTP helper tests**

```js
// File: tests/unit/otp.test.js
import { generateOtp, hashOtp, verifyOtp } from '../../services/reports/otp.js';

describe('otp helpers', () => {
  it('generateOtp returns a 6-digit string', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });
  it('hashOtp is deterministic and not the plaintext', () => {
    expect(hashOtp('123456')).toBe(hashOtp('123456'));
    expect(hashOtp('123456')).not.toBe('123456');
  });
  it('verifyOtp matches only the correct code', () => {
    const h = hashOtp('123456');
    expect(verifyOtp('123456', h)).toBe(true);
    expect(verifyOtp('000000', h)).toBe(false);
    expect(verifyOtp('', h)).toBe(false);
  });
});
```

- [ ] **Step 3: Implement** `services/reports/otp.js`:

```js
// File: services/reports/otp.js
// Pure-ish OTP helpers. generateOtp uses randomness; hash/verify are deterministic.

import crypto from 'crypto';

/** A 6-digit numeric code as a string (cryptographically random). */
export const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/** SHA-256 of the code — never store the plaintext. */
export const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

/** Constant-ish check that a code matches a stored hash. */
export const verifyOtp = (code, hash) => !!code && !!hash && hashOtp(code) === hash;

export default { generateOtp, hashOtp, verifyOtp };
```

- [ ] **Step 4: Add a model test** in `tests/unit/reportTemplateModel.test.js`:

```js
  it('accepts the email_otp gate', () => {
    const doc = new ReportTemplate({ ...validDoc(), access: { gate: 'email_otp' } });
    expect(doc.validateSync()).toBeUndefined();
  });
```

- [ ] **Step 5: Run → pass.** `npm run test:unit -- "otp|reportTemplateModel"` → green.

- [ ] **Step 6: Commit**

```bash
git add models/reportTemplateModel.js services/reports/otp.js tests/unit/otp.test.js tests/unit/reportTemplateModel.test.js
git commit -m "feat(reports): add email_otp gate type + OTP helpers" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: OTP store model

**Repo:** backend. **Files:** create `models/reportOtpModel.js`, `tests/unit/reportOtpModel.test.js`.

- [ ] **Step 1: Write the failing test**

```js
// File: tests/unit/reportOtpModel.test.js
import mongoose from 'mongoose';
import ReportOtp from '../../models/reportOtpModel.js';

describe('ReportOtp model', () => {
  it('validates a minimal doc and defaults attempts to 0', () => {
    const doc = new ReportOtp({
      organization: new mongoose.Types.ObjectId(),
      reportInstance: new mongoose.Types.ObjectId(),
      email: 'a@b.com', codeHash: 'abc', expiresAt: new Date(),
    });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.attempts).toBe(0);
  });
  it('requires reportInstance, email, codeHash, expiresAt', () => {
    const err = new ReportOtp({}).validateSync();
    expect(err.errors.reportInstance).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.codeHash).toBeDefined();
    expect(err.errors.expiresAt).toBeDefined();
  });
});
```

- [ ] **Step 2: Run → fail.** `npm run test:unit -- reportOtpModel`.

- [ ] **Step 3: Implement**

```js
// File: models/reportOtpModel.js
// Description: Short-lived one-time codes for the email_otp report gate. TTL-expired.

import mongoose from 'mongoose';

const reportOtpSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    reportInstance: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportInstance', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reportOtpSchema.index({ reportInstance: 1, email: 1 }, { unique: true });
reportOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

const ReportOtp = mongoose.model('ReportOtp', reportOtpSchema);
export default ReportOtp;
```

- [ ] **Step 4: Run → pass.** `npm run test:unit -- reportOtpModel` → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add models/reportOtpModel.js tests/unit/reportOtpModel.test.js
git commit -m "feat(reports): add ReportOtp model (TTL-expired one-time codes)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: request-otp + enforce in access

**Repo:** backend. **Files:** modify `controllers/publicReportController.js`, `routes/publicReportRoutes.js`.

- [ ] **Step 1: Imports.** Add to `controllers/publicReportController.js`:

```js
import ReportOtp from '../models/reportOtpModel.js';
import { generateOtp, hashOtp, verifyOtp } from '../services/reports/otp.js';
import { sendEmail } from '../utils/emailService.js';
```

- [ ] **Step 2: Add the `requestOtp` handler** (export):

```js
/**
 * @desc    Public: request a one-time code for an email_otp-gated report
 * @route   POST /api/public/reports/:slug/request-otp   body: { email }
 * @access  Public
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const instance = await ReportInstance.findOne({ publicSlug: req.params.slug });
  // Never reveal whether a slug exists / is approved; respond 200 regardless.
  if (!instance || instance.review?.status !== 'approved' || isExpired(instance)) {
    return res.json({ success: true, data: { sent: true } });
  }
  if ((instance.gate || 'email') !== 'email_otp') {
    return res.json({ success: true, data: { otpRequired: false } });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    res.status(400); throw new Error('A valid email is required');
  }
  const normEmail = String(email).toLowerCase().trim();
  const code = generateOtp();
  await ReportOtp.findOneAndUpdate(
    { reportInstance: instance._id, email: normEmail },
    { $set: { organization: instance.organization, codeHash: hashOtp(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  try {
    await sendEmail({
      to: normEmail,
      subject: `Your code to view “${instance.title || 'the report'}”`,
      html: `<p>Your one-time code is <b style="font-size:20px;letter-spacing:2px">${code}</b>.</p><p>It expires in 10 minutes.</p>`,
      text: `Your one-time code is ${code}. It expires in 10 minutes.`,
    });
  } catch (err) { /* best-effort; still 200 so we don't leak send failures */ }
  res.json({ success: true, data: { sent: true } });
});
```

- [ ] **Step 3: Enforce OTP in `accessPublicReport`.** In the email branch (the `else` that handles `email` without a token), AFTER computing `normEmail` and BEFORE the `ReportView.findOneAndUpdate` upsert, add an OTP check gated on the instance's gate:

```js
  if ((instance.gate || 'email') === 'email_otp' && !token) {
    const { otp } = req.body || {};
    const otpDoc = await ReportOtp.findOne({ reportInstance: instance._id, email: normEmail });
    const ok = otpDoc && otpDoc.expiresAt > new Date() && (otpDoc.attempts || 0) < 6 && verifyOtp(otp, otpDoc.codeHash);
    if (!ok) {
      if (otpDoc) { otpDoc.attempts = (otpDoc.attempts || 0) + 1; await otpDoc.save(); }
      res.status(401); throw new Error('Invalid or expired code');
    }
    await ReportOtp.deleteOne({ _id: otpDoc._id }); // consume on success
  }
```

(Place this so it runs for the email-gate path only; the token path of 5c skips OTP by design — a per-recipient token is itself proof of identity.)

- [ ] **Step 4: Add the route.** In `routes/publicReportRoutes.js`, import `requestOtp` and add (rate-limited like the others):

```js
router.post('/:slug/request-otp', reportViewLimiter, requestOtp);
```

- [ ] **Step 5: Verify.** `node --check controllers/publicReportController.js routes/publicReportRoutes.js` → exit 0; `node --input-type=module -e "import('./routes/publicReportRoutes.js').then(()=>console.log('OK')).catch(e=>{console.error(e);process.exit(1)})"` → OK; `npm run test:unit` → green.

- [ ] **Step 6: Commit**

```bash
git add controllers/publicReportController.js routes/publicReportRoutes.js
git commit -m "feat(reports): add OTP request + verification on the public gate" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Builder access (gate) state + selector

**Repo:** frontend. **Files:** modify `src/pages/reports/builderState.js` + test, `src/components/reports/ScheduleDeliveryDialog.js`, `src/pages/reports/ReportTemplateBuilder.js`.

- [ ] **Step 1: Add `access` to builder state (TDD).** In `builderState.test.js` add inside `describe('builderReducer', ...)`:

```js
  it('has an access gate default and merges access patches', () => {
    expect(initialBuilderState.access.gate).toBe('email');
    const s = builderReducer(initialBuilderState, actions.setAccess({ gate: 'email_otp' }));
    expect(s.access.gate).toBe('email_otp');
  });
```

In `builderState.js`: add to `initialBuilderState` (after `delivery`):

```js
  access: { gate: 'email', expiresAfterDays: 90 },
```

Add `SET_ACCESS: 'SET_ACCESS'` to `T`; `setAccess: (patch) => ({ type: T.SET_ACCESS, patch })` to `actions`; the reducer case:

```js
    case T.SET_ACCESS:
      return { ...state, access: { ...state.access, ...action.patch } };
```

In `templateToBuilderState` add `access: { ...initialBuilderState.access, ...(template.access || {}) },`; in `buildTemplatePayload` add `access: state.access,`.

- [ ] **Step 2: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="builderState"` → green.

- [ ] **Step 3: Add a gate selector to the dialog.** In `src/components/reports/ScheduleDeliveryDialog.js`, extend the props to `{ open, schedule, delivery, access = {}, onScheduleChange, onDeliveryChange, onAccessChange, onClose }` and add (just above the recipients section):

```jsx
        <TextField select fullWidth size="small" label="Viewer access" value={access.gate || 'email'}
          onChange={(e) => onAccessChange({ gate: e.target.value })} sx={{ mb: 2 }}>
          <MenuItem value="email">Email gate (enter email to view)</MenuItem>
          <MenuItem value="email_otp">Email + one-time code (more secure)</MenuItem>
        </TextField>
```

- [ ] **Step 4: Wire it in the builder.** In `src/pages/reports/ReportTemplateBuilder.js`, pass `access` + `onAccessChange` to the dialog:

```jsx
        access={state.access}
        onAccessChange={(patch) => dispatch(actions.setAccess(patch))}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/reports/builderState.js src/pages/reports/builderState.test.js src/components/reports/ScheduleDeliveryDialog.js src/pages/reports/ReportTemplateBuilder.js
git commit -m "feat(reports): let creators choose the email/OTP viewer gate" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: OTP step on the public page

**Repo:** frontend. **Files:** modify `src/services/api.js`, `src/pages/public/PublicReportPage.js`.

- [ ] **Step 1: API.** In `publicReportAPI` add:

```js
  requestOtp: (slug, email) => publicApi.post(`/public/reports/${slug}/request-otp`, { email }),
```

- [ ] **Step 2: OTP flow in the gate.** In `src/pages/public/PublicReportPage.js`, add an `otp` + `codeSent` state and adapt the gate submit when `meta.gate === 'email_otp'`:
  - Add state: `const [otp, setOtp] = useState(''); const [codeSent, setCodeSent] = useState(false);`
  - Replace `handleSubmit` so that for an OTP gate the first submit requests a code and the second submits email+otp:

```js
  const isOtp = meta?.gate === 'email_otp';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true); setError(null);
    try {
      if (isOtp && !codeSent) {
        await publicReportAPI.requestOtp(slug, email);
        setCodeSent(true);
      } else {
        const res = await publicReportAPI.access(slug, isOtp ? { email, otp } : { email });
        setReport(res.data?.data || null);
        setStatus('viewing');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the report. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };
```

  - In the gate form JSX, after the email `TextField`, add the code field + adjust the button label:

```jsx
              {isOtp && codeSent && (
                <TextField fullWidth size="small" label="6-digit code" value={otp}
                  onChange={(e) => setOtp(e.target.value)} sx={{ mb: 2 }} inputProps={{ inputMode: 'numeric', maxLength: 6 }} />
              )}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button fullWidth type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Please wait…' : (isOtp && !codeSent ? 'Send code' : 'View report')}
              </Button>
```

(The instruction text "Enter your email to view this report." can stay; for OTP the flow naturally becomes email → code.)

- [ ] **Step 3: Verify build.** `CI=false npm run build` → compiles.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.js src/pages/public/PublicReportPage.js
git commit -m "feat(reports): OTP step on the public report gate" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verify + smoke

- [ ] **Step 1: Backend** `npm run test:unit` → green. **Frontend** `CI=false npm run build` → compiles.
- [ ] **Step 2: Manual smoke** (backend running with `EMAIL_*` set): in the builder's **Schedule & delivery** dialog set **Viewer access = Email + one-time code**, Save → approve → open `/r/:slug` → enter email → **Send code** → the inbox receives a 6-digit code → enter it → **View report** renders. A wrong/expired code → "Invalid or expired code"; a soft-`email` template still works without a code; a per-recipient `?t=` link still bypasses the gate entirely. Record results.

---

## Self-Review

**Spec coverage:** OTP-verified gate, opt-in per template → Tasks 1–5 ✅; creator chooses email vs email+OTP → Task 4 ✅; codes are short-lived + hashed + single-use → Tasks 1,2,3 ✅; token (5c) bypasses OTP by design → Task 3 ✅.
**Placeholder scan:** complete code + exact commands; OTP helpers + model + builder-state additions unit-tested; controller/public-flow verified by `node --check` + smoke. ✅
**Type/name consistency:** `generateOtp`/`hashOtp`/`verifyOtp` (Task 1) used in the controller (Task 3); `ReportOtp` (Task 2) used in the controller (Task 3); `'email_otp'` in `GATE_TYPES` (Task 1) drives both the controller enforcement and the builder selector (Task 4); `publicReportAPI.requestOtp` (Task 5) hits the new route (Task 3); `access(slug, body)` (5c) carries `{email, otp}`. ✅
**Security:** codes are `crypto.randomInt` 6-digit, stored only as SHA-256, TTL-expired (10 min) + consumed on success, with an attempt cap (6); `request-otp` always returns 200 (no slug/recipient enumeration); rate-limited; approval + expiry guards run first. OTP applies only to the `email_otp` gate; soft-email and token paths are unaffected.

---

## Execution Handoff

This completes the planned Phase 5 set (5a AI Narrative, 5b PDF export, 5c per-recipient links, 5d OTP gate). After these, the Leadership Report Builder has the full feature plus all four enhancements.

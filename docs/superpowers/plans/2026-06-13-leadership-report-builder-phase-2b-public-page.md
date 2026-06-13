# Leadership Report Builder — Phase 2b (Public Page + Open-Rate UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the report at a public URL behind an email gate (reusing `ReportBlockRenderer`), surface the shareable link in the builder after "Generate", and give the creator a generated-reports list + per-report open-rate dashboard.

**Architecture:** A bare public route `/r/:slug` (no auth wrapper, no dashboard chrome — mirrors `/pitch/hubtown`) renders the snapshot returned by the Phase 2a public endpoints, called through a dedicated **interceptor-free** axios instance (so the auth interceptor's 401-refresh never fires for anonymous viewers). Authenticated instance/analytics endpoints are consumed via `reportAPI`. The block UI reuses the existing `ReportBlockRenderer` (which now receives `kind` from the server-enriched public payload).

**Tech Stack:** React 18, MUI v5, Recharts (via the renderer), axios, Jest + RTL (`react-scripts test`), `react-router-dom`.

**Repo for ALL tasks:** `/Users/nirpekshnandan/My Products/propvantage-ai-frontend`. Paths relative to that root.

**Depends on:** Phase 2a endpoints — `GET /api/public/reports/:slug`, `POST /api/public/reports/:slug/access`, `GET /api/reports/instances`, `GET /api/reports/instances/:id/analytics`. Phase 1b's `ReportBlockRenderer`, `reportAPI`, `reportShareUrl` (new here), shared components.

**Test command (CRA):** `CI=true npm test -- --watchAll=false --testPathPattern="<name>"`; build: `CI=false npm run build`.

**Conventions (verbatim):**
- Bare public route in `App.js`: `<Route path="/pitch/hubtown" element={<Suspense fallback={<LoadingFallback .../>}><PitchLandingPage /></Suspense>} />` — NO `PublicRoute`/`ProtectedRoute`/`DashboardLayout`. The root `<ThemeProvider>` still wraps it, so `useTheme()` in `ReportBlockRenderer` works.
- `reportAPI` is a named export on the shared `api` instance; the public API uses a SEPARATE `axios.create` (no interceptors).
- Shared components: `import { PageHeader, KPICard, DataTable, EmptyState } from '../../components/common';`

---

## File Structure

**New files:**
- `src/utils/reportShare.js` — pure `reportShareUrl(slug, origin)`, `viewerLabel(view)`.
- `src/utils/reportShare.test.js`
- `src/pages/public/PublicReportPage.js` — the gated public one-pager.
- `src/pages/reports/ReportInstanceListPage.js` — generated reports + open counts.
- `src/pages/reports/ReportInstanceAnalyticsPage.js` — per-report open-rate dashboard.

**Modified files:**
- `src/services/api.js` — add `publicReportAPI` (bare axios) + instance methods on `reportAPI`.
- `src/App.js` — bare `/r/:slug` route + protected `/reports/generated` and `/reports/generated/:id`.
- `src/pages/reports/ReportTemplateListPage.js` — header button to "Generated reports".
- `src/pages/reports/ReportTemplateBuilder.js` — surface the share link after Generate.

---

## Task 1: API additions

**Files:** Modify `src/services/api.js`

- [ ] **Step 1: Add a bare public axios instance + `publicReportAPI`.** Near the top where `api` is created (after the `api` instance + interceptors), add a separate instance with NO interceptors:

```js
// Interceptor-free instance for PUBLIC endpoints (anonymous viewers have no token;
// must not trigger the auth 401-refresh flow on the shared `api` instance).
const publicApi = axios.create({ baseURL: BASE_URL, timeout: 30000 });

export const publicReportAPI = {
  getMeta: (slug) => publicApi.get(`/public/reports/${slug}`),
  access: (slug, email) => publicApi.post(`/public/reports/${slug}/access`, { email }),
};
```

- [ ] **Step 2: Add instance methods to `reportAPI`.** Inside the existing `reportAPI` object (from Phase 1b), add:

```js
  // Generated instances + open-rate analytics
  listInstances: (params = {}) => api.get('/reports/instances', { params }),
  getInstance: (id) => api.get(`/reports/instances/${id}`),
  getInstanceAnalytics: (id) => api.get(`/reports/instances/${id}/analytics`),
```

- [ ] **Step 3: Verify.** `node -e "const s=require('fs').readFileSync('src/services/api.js','utf8'); if(!(s.includes('publicReportAPI')&&s.includes('listInstances')&&s.includes('publicApi'))) throw new Error('missing'); console.log('ok')"`.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.js
git commit -m "feat(reports): add publicReportAPI + instance/analytics API methods" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Share util (pure, TDD)

**Files:** Create `src/utils/reportShare.js`, `src/utils/reportShare.test.js`

- [ ] **Step 1: Write the failing test**

```js
// File: src/utils/reportShare.test.js
import { reportShareUrl, viewerLabel } from './reportShare';

describe('reportShareUrl', () => {
  it('builds a /r/:slug URL from an explicit origin', () => {
    expect(reportShareUrl('abc123', 'https://app.prop-vantage.com')).toBe('https://app.prop-vantage.com/r/abc123');
  });
  it('returns empty string for a missing slug', () => {
    expect(reportShareUrl('', 'https://x.com')).toBe('');
    expect(reportShareUrl(undefined, 'https://x.com')).toBe('');
  });
});

describe('viewerLabel', () => {
  it('labels matched recipients vs forwarded', () => {
    expect(viewerLabel({ matchedRecipient: true })).toBe('Recipient');
    expect(viewerLabel({ matchedRecipient: false })).toBe('Forwarded');
  });
});
```

- [ ] **Step 2: Run → fail.** `CI=true npm test -- --watchAll=false --testPathPattern="reportShare"`.

- [ ] **Step 3: Implement**

```js
// File: src/utils/reportShare.js
// Pure helpers for sharing/displaying public reports.

/** Build the public report URL for a slug. `origin` defaults to the current window. */
export const reportShareUrl = (slug, origin = (typeof window !== 'undefined' ? window.location.origin : '')) =>
  slug ? `${origin}/r/${slug}` : '';

/** Human label for a viewer row. */
export const viewerLabel = (view) => (view && view.matchedRecipient ? 'Recipient' : 'Forwarded');
```

- [ ] **Step 4: Run → pass.** `CI=true npm test -- --watchAll=false --testPathPattern="reportShare"` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/reportShare.js src/utils/reportShare.test.js
git commit -m "feat(reports): add report share/view-label utils" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Public report page + route

**Files:** Create `src/pages/public/PublicReportPage.js`; modify `src/App.js`

- [ ] **Step 1: Implement the page**

```js
// File: src/pages/public/PublicReportPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Container, Paper, TextField, Button, Typography, CircularProgress, Stack, Alert,
} from '@mui/material';
import { Lock, Summarize } from '@mui/icons-material';
import { publicReportAPI } from '../../services/api';
import ReportBlockRenderer from '../../components/reports/ReportBlockRenderer';

const PublicReportPage = () => {
  const { slug } = useParams();
  const [status, setStatus] = useState('loading'); // loading | gate | viewing | error
  const [meta, setMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadMeta = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await publicReportAPI.getMeta(slug);
      setMeta(res.data?.data || null);
      setStatus('gate');
    } catch (err) {
      setError(err.response?.status === 410
        ? 'This report link has expired.'
        : (err.response?.data?.message || 'Report not found.'));
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true); setError(null);
    try {
      const res = await publicReportAPI.access(slug, email);
      setReport(res.data?.data || null);
      setStatus('viewing');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the report. Check your email and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
  }

  if (status === 'error') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
        <Alert severity="warning" sx={{ maxWidth: 480 }}>{error}</Alert>
      </Box>
    );
  }

  if (status === 'gate') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2, bgcolor: 'background.default' }}>
        <Paper elevation={0} sx={{ p: 4, maxWidth: 420, width: '100%', border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Summarize color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h6" fontWeight={700}>{meta?.title || 'Report'}</Typography>
            {meta?.periodLabel && <Typography variant="body2" color="text.secondary">{meta.periodLabel}</Typography>}
            <Typography variant="body2" color="text.secondary">
              <Lock sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
              Enter your email to view this report.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                fullWidth type="email" size="small" label="Your email" required
                value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
              />
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button fullWidth type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Opening…' : 'View report'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // status === 'viewing'
  const blocks = (report?.blocks || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="md">
        <Stack spacing={2.5}>
          {blocks.map((block) => (
            <ReportBlockRenderer key={block.id} block={block} images={report?.images || []} />
          ))}
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ pt: 2 }}>
            Generated by PropVantage AI{report?.periodLabel ? ` · ${report.periodLabel}` : ''}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default PublicReportPage;
```

- [ ] **Step 2: Add the bare route in `App.js`.** Add the lazy import near the other page imports:

```js
const PublicReportPage = React.lazy(() => import('./pages/public/PublicReportPage'));
```

Add the route alongside the other fully-public routes (next to `/pitch/hubtown`), with NO `PublicRoute`/`ProtectedRoute`/`DashboardLayout` wrapper:

```jsx
{/* PUBLIC SHARED REPORT — fully public, email-gated inside the page */}
<Route path="/r/:slug" element={
  <Suspense fallback={<LoadingFallback section="report" message="Loading report..." />}>
    <PublicReportPage />
  </Suspense>
} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/public/PublicReportPage.js src/App.js
git commit -m "feat(reports): add public email-gated report page at /r/:slug" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Surface the share link in the builder

**Files:** Modify `src/pages/reports/ReportTemplateBuilder.js`

- [ ] **Step 1: Capture the slug + show the link.** Add the import at the top:

```js
import { reportShareUrl } from '../../utils/reportShare';
```

Add state near the other `useState` hooks:

```js
  const [shareSlug, setShareSlug] = useState(null);
```

In `handleGenerate`, after `setPreviewBlocks(res.data?.data?.blocks || []);`, also capture the slug:

```js
      setShareSlug(res.data?.data?.publicSlug || null);
```

Add a share-link banner just above the `<Grid container ...>` (so it shows after a successful generate):

```jsx
      {shareSlug && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(reportShareUrl(shareSlug))}>
              Copy link
            </Button>
          }
        >
          Shareable link: <a href={reportShareUrl(shareSlug)} target="_blank" rel="noreferrer">{reportShareUrl(shareSlug)}</a>
        </Alert>
      )}
```

(`Alert` and `Button` are already imported in the builder.)

- [ ] **Step 2: Verify build compiles** (done in Task 6); for now confirm no syntax error by eye (imports resolve).

- [ ] **Step 3: Commit**

```bash
git add src/pages/reports/ReportTemplateBuilder.js
git commit -m "feat(reports): surface shareable public link after generate" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Generated-reports list + open-rate dashboard

**Files:** Create `src/pages/reports/ReportInstanceListPage.js`, `src/pages/reports/ReportInstanceAnalyticsPage.js`; modify `src/App.js`, `src/pages/reports/ReportTemplateListPage.js`

- [ ] **Step 1: Implement the generated-reports list**

```js
// File: src/pages/reports/ReportInstanceListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Button } from '@mui/material';
import { Summarize, ArrowBack } from '@mui/icons-material';
import { PageHeader, DataTable, EmptyState } from '../../components/common';
import { reportAPI } from '../../services/api';

const ReportInstanceListPage = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.listInstances({ limit: 100 });
      setInstances(res.data?.data?.instances || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const columns = [
    { id: 'title', label: 'Report' },
    { id: 'periodLabel', label: 'Period', render: (r) => r.periodLabel || '—' },
    { id: 'opens', label: 'Unique opens', render: (r) => r.stats?.uniqueViewers ?? 0 },
    { id: 'views', label: 'Total views', render: (r) => r.stats?.totalViews ?? 0 },
    {
      id: 'review', label: 'Status',
      render: (r) => <Chip size="small" variant="outlined" label={r.review?.status || 'draft'} />,
    },
    { id: 'createdAt', label: 'Generated', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Generated Reports"
        subtitle="Every generated report and how many stakeholders opened it"
        icon={Summarize}
        loading={loading}
        actions={<Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Templates</Button>}
      />
      {!loading && instances.length === 0 ? (
        <EmptyState icon={Summarize} title="No reports generated yet"
          description="Open a template and click “Generate preview” to produce a shareable, tracked report." />
      ) : (
        <DataTable columns={columns} rows={instances} loading={loading} rowKey="_id"
          onRowClick={(row) => navigate(`/reports/generated/${row._id}`)} />
      )}
    </Box>
  );
};

export default ReportInstanceListPage;
```

- [ ] **Step 2: Implement the per-report analytics dashboard**

```js
// File: src/pages/reports/ReportInstanceAnalyticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Button, Chip, Alert, Link as MuiLink } from '@mui/material';
import { ArrowBack, OpenInNew, People, Visibility, MarkEmailRead, ForwardToInbox } from '@mui/icons-material';
import { PageHeader, KPICard, DataTable, EmptyState } from '../../components/common';
import { reportAPI } from '../../services/api';
import { reportShareUrl, viewerLabel } from '../../utils/reportShare';

const ReportInstanceAnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getInstanceAnalytics(id);
      setData(res.data?.data || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const stats = data?.stats || {};
  const shareUrl = reportShareUrl(data?.publicSlug);

  const columns = [
    { id: 'email', label: 'Viewer' },
    { id: 'status', label: 'Type', render: (r) => <Chip size="small" variant="outlined"
        color={r.matchedRecipient ? 'success' : 'default'} label={viewerLabel(r)} /> },
    { id: 'viewCount', label: 'Views', render: (r) => r.viewCount ?? 0 },
    { id: 'lastViewedAt', label: 'Last opened', render: (r) => (r.lastViewedAt ? new Date(r.lastViewedAt).toLocaleString('en-IN') : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title={data?.title || 'Report analytics'}
        subtitle="Who opened this report, and how often"
        loading={loading}
        actions={
          <>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports/generated')}>Back</Button>
            {shareUrl && <Button startIcon={<OpenInNew />} href={shareUrl} target="_blank" rel="noreferrer">Open public page</Button>}
          </>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {shareUrl && (
        <Alert severity="info" sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(shareUrl)}>Copy</Button>}>
          Shareable link: <MuiLink href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</MuiLink>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={6} md={3}><KPICard title="Unique opens" value={stats.uniqueViewers ?? 0} icon={People} color="primary" loading={loading} /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Total views" value={stats.totalViews ?? 0} icon={Visibility} color="info" loading={loading} /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Recipients opened" value={stats.recipientsOpened ?? 0} icon={MarkEmailRead} color="success" loading={loading} /></Grid>
        <Grid item xs={6} md={3}><KPICard title="Forwarded opens" value={stats.forwardedOpens ?? 0} icon={ForwardToInbox} color="warning" loading={loading} /></Grid>
      </Grid>

      {!loading && (data?.views || []).length === 0 ? (
        <EmptyState icon={Visibility} title="No opens yet"
          description="Share the link above. Each viewer who enters their email will appear here." />
      ) : (
        <DataTable columns={columns} rows={data?.views || []} loading={loading} rowKey="email" />
      )}
    </Box>
  );
};

export default ReportInstanceAnalyticsPage;
```

- [ ] **Step 3: Add routes in `App.js`.** Lazy imports:

```js
const ReportInstanceListPage = React.lazy(() => import('./pages/reports/ReportInstanceListPage'));
const ReportInstanceAnalyticsPage = React.lazy(() => import('./pages/reports/ReportInstanceAnalyticsPage'));
```

Routes (alongside the other `/reports` routes, requiring `reports:view`):

```jsx
<Route path="/reports/generated" element={
  <ProtectedRoute requiredPermission="reports:view">
    <DashboardLayout><Suspense fallback={<LoadingFallback />}><ReportInstanceListPage /></Suspense></DashboardLayout>
  </ProtectedRoute>
} />
<Route path="/reports/generated/:id" element={
  <ProtectedRoute requiredPermission="reports:view">
    <DashboardLayout><Suspense fallback={<LoadingFallback />}><ReportInstanceAnalyticsPage /></Suspense></DashboardLayout>
  </ProtectedRoute>
} />
```

**Route-order note:** these must be declared BEFORE any `/reports/templates/:id/edit`-style catch is irrelevant (paths are distinct), but ensure `/reports/generated` is declared before a hypothetical `/reports/:something` wildcard (there is none today). Declaring all three `/reports/*` literal routes in any order is safe.

- [ ] **Step 4: Link to it from the template list.** In `src/pages/reports/ReportTemplateListPage.js`, add a secondary action button in the `PageHeader` `actions` (next to "New Template"):

```jsx
<Button onClick={() => navigate('/reports/generated')}>Generated reports</Button>
```

(Wrap the two buttons in a `<Stack direction="row" spacing={1}>` if not already; `Stack` import from `@mui/material`.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/reports/ReportInstanceListPage.js src/pages/reports/ReportInstanceAnalyticsPage.js src/App.js src/pages/reports/ReportTemplateListPage.js
git commit -m "feat(reports): add generated-reports list + open-rate dashboard" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Verify (tests + build + manual smoke)

- [ ] **Step 1: Unit tests.** `CI=true npm test -- --watchAll=false --testPathPattern="reportShare|reportCatalog|builderState|ReportBlockRenderer"` → all green (reportShare 3 + the Phase-1 suites).

- [ ] **Step 2: Build.** `CI=false npm run build` → "Compiled successfully" (no ERRORS; warnings OK).

- [ ] **Step 3: Manual smoke** (Phase 2a backend running; logged in as a leadership user):
  - In the builder, **Generate preview** → a green "Shareable link" banner with `/r/:slug` appears; click **Copy link**.
  - Open `/r/:slug` in a logged-out/incognito window → email gate shows the report title; enter an email → the one-pager renders (KPIs/charts/hero/images) via the shared renderer.
  - Reload and enter the same email again → still renders (view count increments server-side, not a new viewer).
  - Back in the app: **Reports → Generated reports** lists the report with "Unique opens" ≥ 1; open it → the analytics dashboard shows the KPI tiles and a viewer row (your email, "Forwarded" since no recipients are set pre-Phase-4), plus the share link and "Open public page".
  Record results.

- [ ] **Step 4: Final commit** (only if Step 3 surfaced small fixes).

---

## Self-Review

**1. Spec coverage (Phase 2 frontend):** public hosted one-pager + email gate → Task 3 ✅; reuses `ReportBlockRenderer` → Task 3 ✅; shareable link surfaced → Task 4 ✅; open-rate dashboard (who opened / how often / forwarders) → Task 5 ✅; generated-reports list → Task 5 ✅. (Per-recipient links, OTP → Phase 5; recipient emailing → Phase 4.)

**2. Placeholder scan:** complete code + exact commands; manual smoke is explicit verification. ✅

**3. Type/name consistency:** `publicReportAPI.getMeta/access` (Task 1) consumed by `PublicReportPage` (Task 3). `reportAPI.listInstances/getInstanceAnalytics` (Task 1) consumed by the list/analytics pages (Task 5). `reportShareUrl`/`viewerLabel` (Task 2) used in the builder (Task 4) and analytics page (Task 5). `ReportBlockRenderer` prop `{ block, images }` — the public payload provides `block.kind` (server-enriched in 2a) so the renderer's `kind` switch works. KPICard/DataTable/PageHeader/EmptyState props match the captured signatures. ✅

**4. Convention match:** bare public route mirrors `/pitch/hubtown`; protected routes use `requiredPermission="reports:view"` + DashboardLayout + Suspense; interceptor-free axios for anonymous calls; raw `useState`/`useEffect`/`useCallback` fetch pattern. ✅

**Known limitations (documented):** the public page is not unit-tested (RTL of the gate→render flow with a mocked bare-axios is brittle); covered by build + manual smoke. The shared `api` 401-refresh is avoided via the separate `publicApi` instance. Pre-Phase-4, all opens show as "Forwarded" because instances have no recipient list yet — expected; attribution sharpens once Phase 4 sets `distribution.recipients`.

---

## Execution Handoff

After 2b, **Phase 2 is complete** — a leader can generate a report, share a tracked public link, and see who opened it. Next is **Phase 3 (Review & approve):** the review screen (overrides + flag-to-owner), the `review` state machine + approval gate (and gating public visibility on `approved`), and the internal "ready for review"/"sent" mailers.

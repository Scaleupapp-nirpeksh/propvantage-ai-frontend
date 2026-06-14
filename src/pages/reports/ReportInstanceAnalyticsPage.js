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

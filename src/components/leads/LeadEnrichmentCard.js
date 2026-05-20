// File: src/components/leads/LeadEnrichmentCard.js
// Description: Read-only AI enrichment card for the lead detail page.
//   Renders the enrichment.status lifecycle (idle / pending / researching /
//   completed / failed) and hosts the re-run / add-sources dialog.

import React, { useState } from 'react';
import {
  Card, CardContent, Typography, Box, Stack, Chip, Button, CircularProgress,
  Alert, Link, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { AutoAwesome, Refresh, OpenInNew } from '@mui/icons-material';
import { leadAPI } from '../../services/api';

const CATEGORY_COLORS = {
  seniority: 'primary',
  industry: 'info',
  employer_scale: 'secondary',
  wealth: 'success',
  other: 'default',
};

const emptySources = (enrichment) => ({
  linkedinUrl: enrichment.sources?.linkedinUrl || '',
  companyWebsite: enrichment.sources?.companyWebsite || '',
  articleUrls: (enrichment.sources?.articleUrls || []).length
    ? [...enrichment.sources.articleUrls]
    : [''],
});

const LeadEnrichmentCard = ({ lead, onRefresh }) => {
  const enrichment = lead?.enrichment || {};
  const status = enrichment.status || 'idle';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState(emptySources(enrichment));

  const openDialog = () => {
    setSources(emptySources(enrichment));
    setError('');
    setDialogOpen(true);
  };

  const setArticle = (i, val) => {
    setSources((prev) => {
      const next = [...prev.articleUrls];
      next[i] = val;
      return { ...prev, articleUrls: next };
    });
  };

  const addArticle = () =>
    setSources((prev) => ({ ...prev, articleUrls: [...prev.articleUrls, ''] }));

  const submitEnrichment = async () => {
    const cleanArticles = sources.articleUrls.map((u) => u.trim()).filter(Boolean);
    const payload = {
      linkedinUrl: sources.linkedinUrl.trim(),
      companyWebsite: sources.companyWebsite.trim(),
      articleUrls: cleanArticles,
    };
    if (!payload.linkedinUrl && !payload.companyWebsite && !cleanArticles.length) {
      setError('Enter at least one URL.');
      return;
    }
    try {
      setSubmitting(true);
      await leadAPI.enrichLead(lead._id, payload);
      setDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start research.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <AutoAwesome color="primary" />
            AI Enrichment
          </Typography>
          {status === 'completed' && (
            <Button size="small" startIcon={<Refresh />} onClick={openDialog}>
              Re-run research
            </Button>
          )}
        </Box>

        {status === 'idle' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No research sources provided. Add a LinkedIn profile, company website,
              or news article and the AI will build a short brief on this lead.
            </Typography>
            <Button variant="outlined" size="small" onClick={openDialog}>
              Add sources
            </Button>
          </Box>
        )}

        {(status === 'pending' || status === 'researching') && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={22} />
              <Typography variant="body2" color="text.secondary">
                Researching… this usually takes about 30 seconds.
              </Typography>
            </Box>
            {/* Recovery affordance: if a job is stuck (e.g. the server restarted
                mid-research), the user can still re-trigger it from here. */}
            <Button size="small" startIcon={<Refresh />} onClick={openDialog}>
              Taking too long? Re-run research
            </Button>
          </Box>
        )}

        {status === 'failed' && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {enrichment.error || 'Research failed.'}
            </Alert>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={openDialog}>
              Retry
            </Button>
          </Box>
        )}

        {status === 'completed' && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {enrichment.summary || 'No summary was generated.'}
            </Typography>

            {enrichment.signals?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {enrichment.signals.map((sig, i) => (
                  <Chip
                    key={i}
                    label={sig.label}
                    size="small"
                    color={CATEGORY_COLORS[sig.category] || 'default'}
                  />
                ))}
              </Box>
            )}

            {enrichment.sourcesUsed?.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Links used
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {enrichment.sourcesUsed.map((s, i) => (
                    <Link
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <OpenInNew sx={{ fontSize: 14 }} />
                      {s.label}
                    </Link>
                  ))}
                </Stack>
              </Box>
            )}

            {enrichment.researchedAt && (
              <Typography variant="caption" color="text.secondary">
                Generated {new Date(enrichment.researchedAt).toLocaleString()}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Research sources</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="LinkedIn profile URL"
              fullWidth
              value={sources.linkedinUrl}
              onChange={(e) => setSources((p) => ({ ...p, linkedinUrl: e.target.value }))}
              placeholder="https://www.linkedin.com/in/..."
            />
            <TextField
              label="Company website URL"
              fullWidth
              value={sources.companyWebsite}
              onChange={(e) => setSources((p) => ({ ...p, companyWebsite: e.target.value }))}
              placeholder="https://company.com"
            />
            {sources.articleUrls.map((url, i) => (
              <TextField
                key={i}
                label={`News article URL ${i + 1}`}
                fullWidth
                value={url}
                onChange={(e) => setArticle(i, e.target.value)}
                placeholder="https://..."
              />
            ))}
            <Button size="small" onClick={addArticle} sx={{ alignSelf: 'flex-start' }}>
              + Add another article
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitEnrichment} disabled={submitting}>
            {submitting ? 'Starting…' : 'Run research'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LeadEnrichmentCard;

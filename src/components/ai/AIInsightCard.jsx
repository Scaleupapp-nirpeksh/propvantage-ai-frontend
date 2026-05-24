// File: src/components/ai/AIInsightCard.jsx
// Description: SP5 — the orchestrator. Wraps an AI insight surface with all
//   the lifecycle states: loading / fresh / fallback / insufficient_data /
//   scheduled_placeholder / quota_exceeded / error. Embedded inside each
//   dashboard card; standalone on the Insights page.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, CircularProgress, Typography, Stack, Button, IconButton, Tooltip,
} from '@mui/material';
import { AutoAwesome, Refresh, ErrorOutline, InfoOutlined } from '@mui/icons-material';
import { cpInsightsAPI } from '../../services/api';
import AINarrative from './AINarrative';
import AICitationsPanel from './AICitationsPanel';
import AIConfidenceBadge from './AIConfidenceBadge';
import AIGenerateNowButton from './AIGenerateNowButton';
import AIScheduledPlaceholder from './AIScheduledPlaceholder';

// Surface → display name for the header.
const SURFACE_TITLE = {
  pipeline_health:           'Pipeline insights',
  commission_overview:       'Commission insights',
  agent_performance:         'Agent insights',
  developer_performance:     'Developer insights',
  commission_reconciliation: 'Reconciliation insights',
  weekly_digest:             'Weekly digest',
  monthly_digest:            'Monthly digest',
};

const SCHEDULED_SURFACES = new Set(['weekly_digest', 'monthly_digest']);

const formatRelative = (iso) => {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = now - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
};

const AIInsightCard = ({ surface, range, compact = true, embedded = false, quotaExhausted = false }) => {
  const [state, setState] = useState('loading');
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const res = await cpInsightsAPI.get(surface, range ? { range } : undefined);
      const data = res.data?.data;
      setInsight(data);

      if (!data) {
        setState('error');
        setError('Empty insight response from server.');
        return;
      }
      if (data.validationResult?.failureReason === 'insufficient_data') {
        setState('insufficient_data');
      } else if (!data.narrative && SCHEDULED_SURFACES.has(surface)) {
        setState('scheduled_placeholder');
      } else if (data.confidence === 'fallback') {
        setState('fallback');
      } else {
        setState('fresh');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'ai_quota_exceeded') {
        setState('quota_exceeded');
        setError(data);
      } else {
        setState('error');
        setError(err.response?.data?.message || err.message || 'Failed to load insight');
      }
    }
  }, [surface, range]);

  useEffect(() => { load(); }, [load]);

  // ─── Render helpers ──────────────────────────────────────────────────────

  const Header = () => (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      <AutoAwesome sx={{ fontSize: 18, color: 'primary.main' }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>
        {SURFACE_TITLE[surface] || 'AI insights'}
      </Typography>
      {insight?.confidence && <AIConfidenceBadge level={insight.confidence} />}
      {insight?.generatedAt && (
        <Tooltip title={new Date(insight.generatedAt).toLocaleString()}>
          <Typography variant="caption" color="text.secondary">{formatRelative(insight.generatedAt)}</Typography>
        </Tooltip>
      )}
      <Tooltip title="Refresh from cache">
        <IconButton size="small" onClick={load}><Refresh sx={{ fontSize: 16 }} /></IconButton>
      </Tooltip>
    </Stack>
  );

  const Footer = () => (
    <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center', justifyContent: 'flex-end' }}>
      <AIGenerateNowButton
        surface={surface}
        body={range ? { range } : undefined}
        onGenerated={(fresh) => { setInsight(fresh); setState(fresh?.confidence === 'fallback' ? 'fallback' : 'fresh'); }}
        quotaExhausted={quotaExhausted}
      />
    </Stack>
  );

  const Content = () => {
    switch (state) {
      case 'loading':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} /><Typography variant="caption" color="text.secondary">Loading insight…</Typography>
          </Box>
        );

      case 'fresh':
      case 'fallback':
        return (
          <>
            <AINarrative narrative={insight.narrative} compact={compact} />
            <AICitationsPanel citations={insight.citations} />
          </>
        );

      case 'insufficient_data':
        return (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <InfoOutlined sx={{ color: 'text.secondary', mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Not enough data to summarise yet. Add more prospects or activity — check back soon.
            </Typography>
          </Box>
        );

      case 'scheduled_placeholder':
        return <AIScheduledPlaceholder surface={surface} nextRunAt={insight?.expiresAt} />;

      case 'quota_exceeded':
        return (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <ErrorOutline color="warning" sx={{ mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Daily AI quota reached.{error?.resetsAt ? ` Resets at ${new Date(error.resetsAt).toLocaleString()}.` : ''}
            </Typography>
            <Button size="small" sx={{ mt: 1, textTransform: 'none' }} onClick={load}>Retry</Button>
          </Box>
        );

      case 'error':
      default:
        return (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <ErrorOutline color="error" sx={{ mb: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Could not load AI commentary — {String(error || 'unknown error')}
            </Typography>
            <Button size="small" sx={{ mt: 1, textTransform: 'none' }} onClick={load}>Retry</Button>
          </Box>
        );
    }
  };

  // Embedded mode: render as a Box (no outer Card chrome). Used inside other
  // dashboard cards that already have their own borders.
  const Wrapper = embedded ? Box : Card;
  const wrapperProps = embedded
    ? { sx: { mt: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' } }
    : { variant: 'outlined' };
  const InnerWrapper = embedded ? Box : CardContent;

  return (
    <Wrapper {...wrapperProps}>
      <InnerWrapper>
        <Header />
        <Content />
        {(state === 'fresh' || state === 'fallback') && <Footer />}
      </InnerWrapper>
    </Wrapper>
  );
};

export default AIInsightCard;

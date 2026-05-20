// File: src/pages/competitive-analysis/CompetitivePerformancePage.js
// Description: Competitive Performance Scorecard — pick a project, see how it
//   benchmarks against the market and competitors. Verified pillars render
//   instantly; the AI verdict + market-demand block is polled in.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Autocomplete, TextField, Chip,
  LinearProgress, CircularProgress, Alert, Table, TableBody, TableCell,
  TableHead, TableRow, Link, Stack, Divider,
} from '@mui/material';
import { TrendingUp, Speed, Inventory2, Place, Insights, EmojiObjects } from '@mui/icons-material';
import { projectAPI, competitiveAnalysisAPI } from '../../services/api';

const inr = (n) =>
  n === null || n === undefined
    ? '—'
    : n >= 1e7
    ? `₹${(n / 1e7).toFixed(2)} Cr`
    : n >= 1e5
    ? `₹${(n / 1e5).toFixed(1)} L`
    : `₹${Math.round(n).toLocaleString('en-IN')}`;

const pct = (n) => (n === null || n === undefined ? '—' : `${n}%`);

const CONFIDENCE_COLOR = { High: 'success', Medium: 'warning', Low: 'error' };

const AI_POLL_INTERVAL_MS = 4000;

const SectionCard = ({ icon, title, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {icon}
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const CompetitivePerformancePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [ai, setAi] = useState(null);
  const [aiState, setAiState] = useState('idle'); // idle | loading | done | failed

  useEffect(() => {
    projectAPI
      .getProjects()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => setProjects([]));
  }, []);

  const fetchScorecard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    setScorecard(null);
    setAi(null);
    setAiState('idle');
    try {
      const res = await competitiveAnalysisAPI.getScorecard(projectId);
      setScorecard(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load the scorecard.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchScorecard();
  }, [fetchScorecard]);

  // Poll the AI block once the scorecard is loaded
  useEffect(() => {
    if (!projectId || !scorecard) return;
    let cancelled = false;
    let timer;

    const poll = async () => {
      try {
        const res = await competitiveAnalysisAPI.getScorecardAnalysis(projectId);
        if (cancelled) return;
        if (res.data.status === 'completed') {
          setAi(res.data.data);
          setAiState('done');
        } else {
          setAiState('loading');
          timer = setTimeout(poll, AI_POLL_INTERVAL_MS);
        }
      } catch (e) {
        if (!cancelled) setAiState('failed');
      }
    };

    setAiState('loading');
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, scorecard]);

  const selectedProject = projects.find((p) => p._id === projectId) || null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Competitive Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        How your project benchmarks against the market and competitors.
      </Typography>

      <Autocomplete
        sx={{ maxWidth: 420, mb: 3 }}
        options={projects}
        value={selectedProject}
        getOptionLabel={(o) => o.name || ''}
        isOptionEqualToValue={(o, v) => o._id === v._id}
        onChange={(e, val) =>
          navigate(val ? `/competitive-analysis/scorecard/${val._id}` : '/competitive-analysis/scorecard')
        }
        renderInput={(params) => <TextField {...params} label="Select a project" />}
      />

      {!projectId && (
        <Alert severity="info">Pick a project to see its competitive performance scorecard.</Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {scorecard && (
        <>
          {/* AI verdict banner */}
          <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="overline">AI Verdict</Typography>
              {aiState === 'loading' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={18} color="inherit" />
                  <Typography variant="body1">Analysing your position…</Typography>
                </Box>
              )}
              {aiState === 'failed' && (
                <Typography variant="body2">
                  AI analysis is unavailable right now — the verified scorecard below is unaffected.
                </Typography>
              )}
              {aiState === 'done' && ai && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {ai.verdict}
                  </Typography>
                  {ai.recommendations?.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {ai.recommendations.map((r, i) => (
                        <Typography key={i} variant="body2" sx={{ display: 'flex', gap: 1 }}>
                          <EmojiObjects sx={{ fontSize: 18 }} />
                          {r}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {scorecard.meta && !scorecard.meta.hasCompetitorData && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              No competitors are tracked in {scorecard.meta.locality || 'this locality'}. Pricing,
              inventory and positioning comparisons will be limited — add competitors or run AI research.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Pricing */}
            <Grid item xs={12} md={6}>
              <SectionCard icon={<TrendingUp color="primary" />} title="Pricing">
                <Typography variant="body2" color="text.secondary">
                  Your ₹/sqft
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {scorecard.pricing.yourAvgPsf
                    ? `₹${Math.round(scorecard.pricing.yourAvgPsf).toLocaleString('en-IN')}`
                    : '—'}
                </Typography>
                {scorecard.pricing.yourPercentile !== null && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {scorecard.pricing.yourPercentile}th percentile of the micro-market
                      {scorecard.pricing.premiumDiscountPct !== null &&
                        ` · ${scorecard.pricing.premiumDiscountPct >= 0 ? '+' : ''}${scorecard.pricing.premiumDiscountPct}% vs market avg`}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, scorecard.pricing.yourPercentile)}
                      sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Market ₹/sqft — min {scorecard.pricing.market?.min ?? '—'} · median{' '}
                  {scorecard.pricing.market?.median ?? '—'} · max {scorecard.pricing.market?.max ?? '—'}
                  {' '}({scorecard.pricing.competitorCount} competitors)
                </Typography>
                {(scorecard.pricing.byUnitType?.length ?? 0) > 0 && (
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Unit type</TableCell>
                        <TableCell align="right">You</TableCell>
                        <TableCell align="right">Market avg</TableCell>
                        <TableCell align="right">Δ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scorecard.pricing.byUnitType.map((r) => (
                        <TableRow key={r.unitType}>
                          <TableCell>{r.unitType}</TableCell>
                          <TableCell align="right">{r.yourPsf ?? '—'}</TableCell>
                          <TableCell align="right">{r.marketPsf?.avg ?? '—'}</TableCell>
                          <TableCell align="right">{pct(r.deltaPct)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </Grid>

            {/* Velocity */}
            <Grid item xs={12} md={6}>
              <SectionCard icon={<Speed color="primary" />} title="Sales Velocity">
                {scorecard.velocity.totalUnits === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No units recorded for this project.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <b>{scorecard.velocity.soldUnits}</b> of {scorecard.velocity.totalUnits} units
                      sold ({pct(scorecard.velocity.percentSold)})
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, scorecard.velocity.percentSold || 0)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">
                      Pace: {scorecard.velocity.unitsPerMonth ?? '—'} units/month
                      {scorecard.velocity.projectedSelloutDate &&
                        ` · projected sell-out ${scorecard.velocity.projectedSelloutDate}`}
                    </Typography>
                    <Typography variant="body2">
                      Revenue: {inr(scorecard.velocity.revenueAchieved)} of{' '}
                      {inr(scorecard.velocity.targetRevenue)} ({pct(scorecard.velocity.revenuePercent)})
                    </Typography>
                    {scorecard.velocity.unitsPerMonth === null && (
                      <Typography variant="caption" color="text.secondary">
                        No sales recorded yet — pace and sell-out projection unavailable.
                      </Typography>
                    )}
                  </Stack>
                )}
              </SectionCard>
            </Grid>

            {/* Inventory */}
            <Grid item xs={12} md={6}>
              <SectionCard icon={<Inventory2 color="primary" />} title="Inventory Mix">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Months of inventory: <b>{scorecard.inventory.monthsOfInventory ?? '—'}</b>
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Unit type</TableCell>
                      <TableCell align="right">Your unsold</TableCell>
                      <TableCell align="right">Competing supply</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const yourUnsold = scorecard.inventory.yourUnsoldByType ?? [];
                      const competingSupply = scorecard.inventory.competingSupplyByType ?? [];
                      const types = [
                        ...new Set([
                          ...yourUnsold.map((r) => r.unitType),
                          ...competingSupply.map((r) => r.unitType),
                        ]),
                      ];
                      return types.map((t) => {
                        const yours = yourUnsold.find((r) => r.unitType === t);
                        const mkt = competingSupply.find((r) => r.unitType === t);
                        return (
                          <TableRow key={t}>
                            <TableCell>{t}</TableCell>
                            <TableCell align="right">{yours?.count ?? 0}</TableCell>
                            <TableCell align="right">{mkt?.availableCount ?? '—'}</TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </SectionCard>
            </Grid>

            {/* Positioning */}
            <Grid item xs={12} md={6}>
              <SectionCard icon={<Place color="primary" />} title="Positioning">
                <Typography variant="body2">
                  Your project — status <b>{scorecard.positioning.your.status || '—'}</b>,{' '}
                  {scorecard.positioning.your.totalUnits || '—'} units
                </Typography>
                <Divider sx={{ my: 1 }} />
                {scorecard.positioning.competitors.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No competitors tracked in this locality.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Competitor</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Possession</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scorecard.positioning.competitors.map((c, i) => (
                        <TableRow key={c.name || i}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.projectStatus || '—'}</TableCell>
                          <TableCell>{c.possession || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </Grid>

            {/* Demand */}
            <Grid item xs={12}>
              <SectionCard icon={<Insights color="primary" />} title="Demand — supply vs interest">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Your demand (leads)</Typography>
                    <Typography variant="body2">
                      {scorecard.demand.yourLeads.total} total leads ·{' '}
                      {scorecard.demand.yourLeads.last30d} in the last 30 days
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {(scorecard.demand.yourLeads.qualityMix ?? []).map((q) => (
                        <Chip key={q.grade} size="small" label={`${q.grade}: ${q.count}`} />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Market demand (AI web research)</Typography>
                    {aiState === 'loading' && (
                      <Typography variant="body2" color="text.secondary">
                        Researching micro-market demand…
                      </Typography>
                    )}
                    {aiState === 'failed' && (
                      <Typography variant="body2" color="text.secondary">
                        Market-demand research unavailable.
                      </Typography>
                    )}
                    {aiState === 'done' && ai && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            size="small"
                            label={`Signal: ${ai.marketDemand.signal}`}
                            color="primary"
                          />
                          <Chip
                            size="small"
                            label={`Confidence: ${ai.marketDemand.confidenceLabel} (${ai.marketDemand.confidence})`}
                            color={CONFIDENCE_COLOR[ai.marketDemand.confidenceLabel] || 'default'}
                          />
                        </Box>
                        <Typography variant="body2">{ai.marketDemand.summary}</Typography>
                        {ai.marketDemand.sources?.length > 0 && (
                          <Stack spacing={0.25} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Sources
                            </Typography>
                            {ai.marketDemand.sources.map((s, i) => (
                              <Link
                                key={s.url || i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="caption"
                              >
                                {s.title}
                              </Link>
                            ))}
                          </Stack>
                        )}
                      </>
                    )}
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            {/* Leaderboard */}
            <Grid item xs={12}>
              <SectionCard icon={<TrendingUp color="primary" />} title="Competitor Leaderboard">
                {scorecard.leaderboard.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No competitors tracked in this locality.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Developer</TableCell>
                        <TableCell align="right">₹/sqft</TableCell>
                        <TableCell align="right">Δ vs you</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scorecard.leaderboard.map((c) => (
                        <TableRow key={c.competitorId} hover>
                          <TableCell>{c.threatRank}</TableCell>
                          <TableCell>
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() =>
                                navigate(`/competitive-analysis/competitors/${c.competitorId}`)
                              }
                            >
                              {c.name}
                            </Link>
                          </TableCell>
                          <TableCell>{c.developer}</TableCell>
                          <TableCell align="right">{c.avgPsf ?? '—'}</TableCell>
                          <TableCell align="right">{pct(c.deltaPsfPct)}</TableCell>
                          <TableCell>{c.projectStatus || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CompetitivePerformancePage;

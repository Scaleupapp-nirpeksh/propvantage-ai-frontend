// File: src/pages/competitive-analysis/AIAnalysisPage.js
// AI Analysis & Recommendations — project selector + 8 analysis type tabs

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AutoGraph,
  Refresh,
  CheckCircle,
  PriorityHigh,
  TrendingUp,
  TrendingDown,
  ArrowBack,
  AccessTime,
  CachedOutlined,
  Lightbulb,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI, projectAPI } from '../../services/api';
import { PageHeader, EmptyState } from '../../components/common';
import { fmtCurrency } from '../../utils/formatters';
import { formatDistanceToNow } from 'date-fns';

const ANALYSIS_TYPES = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'pricing_recommendations', label: 'Pricing' },
  { value: 'revenue_planning', label: 'Revenue' },
  { value: 'absorption_rate', label: 'Absorption' },
  { value: 'demand_supply_gap', label: 'Demand-Supply' },
  { value: 'launch_timing', label: 'Launch Timing' },
  { value: 'optimal_unit_mix', label: 'Unit Mix' },
  { value: 'marketing_strategy', label: 'Marketing' },
];

const PRIORITY_COLORS = {
  critical: '#d32f2f',
  high: '#ed6c02',
  medium: '#eab308',
  low: '#1976d2',
};

const SEGMENT_LABELS = {
  budget: 'Budget',
  affordable: 'Affordable',
  mid_segment: 'Mid Segment',
  premium: 'Premium',
  luxury: 'Luxury',
  ultra_luxury: 'Ultra Luxury',
};

const DEMAND_COLORS = {
  high: '#43a047',
  medium: '#fb8c00',
  low: '#e53935',
};

// ─── Recommendation Card ────────────────────────────────────────────────────
const RecommendationCard = ({ rec }) => {
  const pColor = PRIORITY_COLORS[rec.priority] || '#757575';
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip label={rec.category} size="small" variant="outlined" />
          <Chip
            label={rec.priority}
            size="small"
            sx={{ bgcolor: alpha(pColor, 0.1), color: pColor, fontWeight: 600, textTransform: 'capitalize' }}
          />
          {rec.confidenceScore != null && (
            <Chip label={`${rec.confidenceScore}% confidence`} size="small" variant="outlined" />
          )}
        </Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>{rec.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{rec.description}</Typography>
        {rec.estimatedImpact && (
          <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
            Impact: {rec.estimatedImpact}
          </Typography>
        )}
        {rec.actionItems?.length > 0 && (
          <List dense disablePadding>
            {rec.actionItems.map((item, idx) => (
              <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary={item} primaryTypographyProps={{ variant: 'caption' }} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Market Positioning Card ────────────────────────────────────────────────
const MarketPositioningCard = ({ positioning }) => {
  if (!positioning) return null;
  const percentile = positioning.pricePercentile || 0;
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Market Positioning</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {positioning.segment && (
            <Chip label={SEGMENT_LABELS[positioning.segment] || positioning.segment} color="primary" size="small" />
          )}
          <Chip label={`${percentile}th percentile`} size="small" variant="outlined" />
        </Box>
        {/* Percentile bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Budget</Typography>
            <Typography variant="caption" color="text.secondary">Ultra Luxury</Typography>
          </Box>
          <Box sx={{ position: 'relative', height: 8, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Box
              sx={{
                position: 'absolute', left: `${percentile}%`, top: -4,
                width: 16, height: 16, borderRadius: '50%', bgcolor: 'primary.main',
                transform: 'translateX(-50%)',
              }}
            />
          </Box>
        </Box>
        {positioning.narrative && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{positioning.narrative}</Typography>
        )}
        <Grid container spacing={2}>
          {positioning.advantages?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={600} color="success.main" sx={{ display: 'block', mb: 0.5 }}>
                Competitive Advantages
              </Typography>
              {positioning.advantages.map((a, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 14, color: 'success.main', mt: 0.25 }} />
                  <Typography variant="caption">{a}</Typography>
                </Box>
              ))}
            </Grid>
          )}
          {positioning.disadvantages?.length > 0 && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight={600} color="error.main" sx={{ display: 'block', mb: 0.5 }}>
                Competitive Disadvantages
              </Typography>
              {positioning.disadvantages.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                  <TrendingDown sx={{ fontSize: 14, color: 'error.main', mt: 0.25 }} />
                  <Typography variant="caption">{d}</Typography>
                </Box>
              ))}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ─── Analysis Results Renderer ──────────────────────────────────────────────
const AnalysisResults = ({ analysisType, results }) => {
  if (!results) return null;

  switch (analysisType) {
    case 'comprehensive':
      return <ComprehensiveView results={results} />;
    case 'pricing_recommendations':
      return <PricingView results={results} />;
    case 'revenue_planning':
      return <RevenueView results={results} />;
    case 'absorption_rate':
      return <AbsorptionView results={results} />;
    case 'demand_supply_gap':
      return <DemandSupplyGapView results={results} />;
    case 'launch_timing':
      return <LaunchTimingView results={results} />;
    case 'optimal_unit_mix':
      return <UnitMixView results={results} />;
    case 'marketing_strategy':
      return <MarketingView results={results} />;
    default:
      return <Typography color="text.secondary">Unknown analysis type</Typography>;
  }
};

// ─── Comprehensive View ─────────────────────────────────────────────────────
const ComprehensiveView = ({ results }) => (
  <Grid container spacing={2}>
    {results.pricing && (
      <Grid item xs={12} sm={6} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Pricing</Typography>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {fmtCurrency(results.pricing.optimalPricePerSqft)}/sqft
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Range: {fmtCurrency(results.pricing.range?.min)} - {fmtCurrency(results.pricing.range?.max)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    )}
    {results.absorption && (
      <Grid item xs={12} sm={6} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Absorption</Typography>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {results.absorption.monthlySales} units/mo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sell-out in {results.absorption.timeToSellOut} months
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    )}
    {results.launchTiming && (
      <Grid item xs={12} sm={6} md={4}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Launch Timing</Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {results.launchTiming.recommended}
            </Typography>
            <Typography variant="caption" color="text.secondary">{results.launchTiming.reason}</Typography>
          </CardContent>
        </Card>
      </Grid>
    )}
    {results.unitMix?.length > 0 && (
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Recommended Unit Mix</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {results.unitMix.map((u, i) => (
                <Chip
                  key={i}
                  label={`${u.unitType}: ${u.percentage}%`}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    )}
    {results.marketing && (
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Marketing</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Target: {results.marketing.targetBuyer}
            </Typography>
            {results.marketing.usps?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {results.marketing.usps.map((usp, i) => (
                  <Chip key={i} label={usp} size="small" variant="outlined" color="primary" />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    )}
  </Grid>
);

// ─── Pricing View ───────────────────────────────────────────────────────────
const PricingView = ({ results }) => {
  const op = results.optimalPricing;
  if (!op) return null;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Optimal Price Per Sqft</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {fmtCurrency(op.pricePerSqft?.recommended)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Range: {fmtCurrency(op.pricePerSqft?.range?.min)} - {fmtCurrency(op.pricePerSqft?.range?.max)}
            </Typography>
            {op.pricePerSqft?.confidence && (
              <Chip label={`${op.pricePerSqft.confidence}% confidence`} size="small" sx={{ mt: 1 }} variant="outlined" />
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Floor Rise & Premiums</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {op.floorRiseCharge && (
                <Typography variant="body2">Floor Rise: {fmtCurrency(op.floorRiseCharge.recommended)}/floor</Typography>
              )}
              {op.facingPremiums?.parkFacing && (
                <Typography variant="body2">Park Facing: {fmtCurrency(op.facingPremiums.parkFacing.recommended)}</Typography>
              )}
              {op.facingPremiums?.roadFacing && (
                <Typography variant="body2">Road Facing: {fmtCurrency(op.facingPremiums.roadFacing.recommended)}</Typography>
              )}
              {op.facingPremiums?.cornerUnit && (
                <Typography variant="body2">Corner Unit: {fmtCurrency(op.facingPremiums.cornerUnit.recommended)}</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Other Charges</Typography>
            <Grid container spacing={2}>
              {op.parkingCharges && (
                <>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Covered Parking</Typography>
                    <Typography variant="body2" fontWeight={600}>{fmtCurrency(op.parkingCharges.covered)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Open Parking</Typography>
                    <Typography variant="body2" fontWeight={600}>{fmtCurrency(op.parkingCharges.open)}</Typography>
                  </Grid>
                </>
              )}
              {op.clubMembership && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Club Membership</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtCurrency(op.clubMembership)}</Typography>
                </Grid>
              )}
              {op.maintenanceDeposit && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Maintenance Deposit</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtCurrency(op.maintenanceDeposit)}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ─── Revenue View ───────────────────────────────────────────────────────────
const RevenueView = ({ results }) => {
  const rt = results.revenueTargets;
  if (!rt) return null;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Total Project Revenue</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {fmtCurrency(rt.totalProjectRevenue)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {rt.revenuePerUnitType?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Revenue by Unit Type</Typography>
              {rt.revenuePerUnitType.map((u, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < rt.revenuePerUnitType.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{u.unitType}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.count} units × {fmtCurrency(u.avgPrice)} avg
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="primary.main">{fmtCurrency(u.revenue)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
      {rt.priceEscalationStrategy && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Price Escalation Strategy</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.entries(rt.priceEscalationStrategy).map(([phase, data]) => (
                  <Card key={phase} variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {phase.replace(/(\d)/, ' $1')}
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="primary.main">
                        {fmtCurrency(data.pricePerSqft)}/sqft
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{data.duration}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// ─── Absorption View ────────────────────────────────────────────────────────
const AbsorptionView = ({ results }) => {
  const ab = results.absorption;
  if (!ab) return null;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Predicted Monthly Sales</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {ab.predictedMonthlySales} units
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Time to Sell Out</Typography>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {ab.timeToSellOut?.months || ab.timeToSellOut} months
            </Typography>
            {ab.timeToSellOut?.confidence && (
              <Chip label={`${ab.timeToSellOut.confidence}% confidence`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
            )}
          </CardContent>
        </Card>
      </Grid>
      {ab.priceSensitivity?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Price Sensitivity</Typography>
              {ab.priceSensitivity.map((ps, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: i < ab.priceSensitivity.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600}>{fmtCurrency(ps.pricePoint)}/sqft</Typography>
                  <Typography variant="body2">{ps.estimatedMonthlySales} units/mo</Typography>
                  <Typography variant="body2" color="text.secondary">{ps.timeToSellOut} months</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// ─── Demand-Supply Gap View ─────────────────────────────────────────────────
const DemandSupplyGapView = ({ results }) => {
  const ds = results.demandSupply;
  if (!ds) return null;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 1 }}>
          Overall Assessment: <strong style={{ textTransform: 'capitalize' }}>{ds.overallAssessment}</strong>
        </Alert>
      </Grid>
      {ds.byUnitType?.map((u, i) => (
        <Grid item xs={12} sm={6} key={i}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{u.unitType}</Typography>
                <Chip
                  label={`Demand: ${u.demandIndicator}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(DEMAND_COLORS[u.demandIndicator] || '#757575', 0.1),
                    color: DEMAND_COLORS[u.demandIndicator] || '#757575',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">Supply: {u.supply?.toLocaleString('en-IN')} units</Typography>
              <Typography variant="caption" color="text.secondary">{u.gap}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {ds.saturationIndicators && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Saturation Indicators</Typography>
              {Object.entries(ds.saturationIndicators).map(([key, val]) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{val}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// ─── Launch Timing View ─────────────────────────────────────────────────────
const LaunchTimingView = ({ results }) => {
  const lt = results.launchTiming;
  if (!lt) return null;
  return (
    <Grid container spacing={2}>
      {lt.recommendedLaunchWindow && (
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderColor: 'primary.main', borderWidth: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Recommended Launch Window</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {lt.recommendedLaunchWindow.quarter} {lt.recommendedLaunchWindow.year}
              </Typography>
              <Typography variant="body2" color="text.secondary">{lt.recommendedLaunchWindow.reason}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
      {lt.seasonalFactors?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Seasonal Factors</Typography>
              {lt.seasonalFactors.map((sf, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < lt.seasonalFactors.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600}>{sf.period}</Typography>
                  <Chip
                    label={sf.demandLevel}
                    size="small"
                    sx={{
                      bgcolor: alpha(DEMAND_COLORS[sf.demandLevel] || '#757575', 0.1),
                      color: DEMAND_COLORS[sf.demandLevel] || '#757575',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300 }}>{sf.reason}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
      {lt.competitorPipeline?.length > 0 && (
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Competitor Pipeline</Typography>
              {lt.competitorPipeline.map((cp, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {cp.status?.replace(/_/g, ' ')}: {cp.count} projects
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{cp.implication}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
      {lt.preLaunchStrategy && (
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Pre-Launch Strategy</Typography>
              <Typography variant="body2">Duration: {lt.preLaunchStrategy.duration}</Typography>
              <Typography variant="body2">Price Discount: {lt.preLaunchStrategy.priceDiscount}%</Typography>
              <Typography variant="body2">Target Bookings: {lt.preLaunchStrategy.targetBookings}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// ─── Unit Mix View ──────────────────────────────────────────────────────────
const UnitMixView = ({ results }) => {
  const um = results.unitMix;
  if (!um) return null;
  return (
    <Grid container spacing={2}>
      {um.recommended?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Recommended Unit Mix</Typography>
              {um.recommended.map((u, i) => (
                <Box key={i} sx={{ py: 1.5, borderBottom: i < um.recommended.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>{u.unitType}</Typography>
                    <Chip label={`${u.percentage}% (${u.count} units)`} size="small" color="primary" variant="outlined" />
                  </Box>
                  {u.carpetAreaRange && (
                    <Typography variant="caption" color="text.secondary">
                      Carpet: {u.carpetAreaRange.min}-{u.carpetAreaRange.max} sqft
                      {u.pricePerSqftRange && ` | ${fmtCurrency(u.pricePerSqftRange.min)}-${fmtCurrency(u.pricePerSqftRange.max)}/sqft`}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{u.rationale}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
      {um.marketDemandSignals?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Market Demand Signals</Typography>
              {um.marketDemandSignals.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Lightbulb sx={{ fontSize: 18, color: 'warning.main', mt: 0.25 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{s.signal}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Source: {s.source} | Impact: {s.impact}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// ─── Marketing View ─────────────────────────────────────────────────────────
const MarketingView = ({ results }) => {
  const mk = results.marketing;
  if (!mk) return null;
  return (
    <Grid container spacing={2}>
      {mk.usps?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Unique Selling Points</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {mk.usps.map((u, i) => <Chip key={i} label={u} size="small" variant="outlined" color="primary" />)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
      {mk.targetBuyerPersona && (
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Target Buyer Persona</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{mk.targetBuyerPersona.demographics}</Typography>
              {mk.targetBuyerPersona.motivations?.length > 0 && (
                <>
                  <Typography variant="caption" fontWeight={600} color="success.main">Motivations</Typography>
                  <List dense disablePadding>
                    {mk.targetBuyerPersona.motivations.map((m, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <TrendingUp sx={{ fontSize: 12, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={m} primaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              {mk.targetBuyerPersona.concerns?.length > 0 && (
                <>
                  <Typography variant="caption" fontWeight={600} color="warning.main" sx={{ mt: 1, display: 'block' }}>Concerns</Typography>
                  <List dense disablePadding>
                    {mk.targetBuyerPersona.concerns.map((c, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <PriorityHigh sx={{ fontSize: 12, color: 'warning.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={c} primaryTypographyProps={{ variant: 'caption' }} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
      {mk.keySellingPoints?.length > 0 && (
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Key Selling Points</Typography>
              <List dense disablePadding>
                {mk.keySellingPoints.map((ksp, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText primary={ksp} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}
      {mk.channelRecommendations?.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Channel Recommendations</Typography>
              {mk.channelRecommendations.map((ch, i) => {
                const pColor = PRIORITY_COLORS[ch.priority] || '#757575';
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < mk.channelRecommendations.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight={600}>{ch.channel}</Typography>
                    <Chip
                      label={ch.priority}
                      size="small"
                      sx={{ bgcolor: alpha(pColor, 0.1), color: pColor, fontWeight: 600, textTransform: 'capitalize' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300 }}>{ch.reason}</Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      )}
      {mk.pricingNarrative && (
        <Grid item xs={12}>
          <Alert severity="info" icon={<Lightbulb />}>
            <Typography variant="body2">{mk.pricingNarrative}</Typography>
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const AIAnalysisPage = () => {
  const { projectId: urlProjectId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(urlProjectId || '');
  const [analysisType, setAnalysisType] = useState(0); // tab index
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's projects for the selector
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectAPI.getProjects({ limit: 100 });
        setProjects(res.data?.data || res.data?.projects || []);
      } catch {
        enqueueSnackbar('Failed to load projects', { variant: 'error' });
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [enqueueSnackbar]);

  // Auto-load analysis if projectId in URL
  useEffect(() => {
    if (urlProjectId) {
      setSelectedProject(urlProjectId);
    }
  }, [urlProjectId]);

  const fetchAnalysis = useCallback(async (projId, type) => {
    if (!projId) return;
    try {
      setLoading(true);
      setAnalysis(null);
      const typeValue = ANALYSIS_TYPES[type]?.value || 'comprehensive';
      const res = await competitiveAnalysisAPI.getAnalysis(projId, { type: typeValue });
      setAnalysis(res.data?.data || res.data);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to generate analysis';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const handleProjectChange = (e) => {
    const projId = e.target.value;
    setSelectedProject(projId);
    setAnalysis(null);
    if (projId) {
      navigate(`/competitive-analysis/analysis/${projId}`, { replace: true });
      fetchAnalysis(projId, analysisType);
    }
  };

  const handleTabChange = (_, newValue) => {
    setAnalysisType(newValue);
    if (selectedProject) {
      fetchAnalysis(selectedProject, newValue);
    }
  };

  const handleRefresh = async () => {
    if (!selectedProject) return;
    try {
      setRefreshing(true);
      const typeValue = ANALYSIS_TYPES[analysisType]?.value || 'comprehensive';
      const res = await competitiveAnalysisAPI.refreshAnalysis(selectedProject, { type: typeValue });
      setAnalysis(res.data?.data || res.data);
      enqueueSnackbar('Analysis refreshed', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Refresh failed', { variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-load on mount if we have a project from URL
  useEffect(() => {
    if (urlProjectId && !loadingProjects) {
      fetchAnalysis(urlProjectId, 0);
    }
  }, [urlProjectId, loadingProjects, fetchAnalysis]);

  const currentTypeValue = ANALYSIS_TYPES[analysisType]?.value || 'comprehensive';

  return (
    <Box>
      <PageHeader
        title="AI Analysis"
        subtitle="AI-powered competitive analysis and recommendations"
        actions={
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/competitive-analysis')}>
            Back to Dashboard
          </Button>
        }
      />

      {/* Project Selector */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Select Your Project</Typography>
          <TextField
            select
            label="Project"
            value={selectedProject}
            onChange={handleProjectChange}
            size="small"
            fullWidth
            disabled={loadingProjects}
            sx={{ maxWidth: 500 }}
          >
            <MenuItem value="">Select a project...</MenuItem>
            {projects.map(p => (
              <MenuItem key={p._id} value={p._id}>
                {p.name || p.projectName} {p.location?.area ? `— ${p.location.area}` : ''}
              </MenuItem>
            ))}
          </TextField>
          {loadingProjects && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
        </CardContent>
      </Card>

      {/* Analysis Type Tabs */}
      {selectedProject && (
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={analysisType}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {ANALYSIS_TYPES.map((t, i) => (
              <Tab key={t.value} label={t.label} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: 'auto', borderRadius: 1 }} />
          <AutoGraph sx={{ fontSize: 48, color: 'primary.main', mb: 1, animation: 'pulse 1.5s infinite' }} />
          <Typography variant="body1" color="text.secondary">
            Generating AI analysis... This may take 10-20 seconds.
          </Typography>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </Box>
      )}

      {/* No project selected */}
      {!selectedProject && !loading && (
        <EmptyState
          icon={AutoGraph}
          title="Select a project to analyze"
          description="Choose one of your projects from the dropdown above to generate AI-powered competitive analysis and recommendations."
        />
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <Box>
          {/* Cache / Meta Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              icon={analysis.fromCache ? <CachedOutlined sx={{ fontSize: 16 }} /> : <AutoGraph sx={{ fontSize: 16 }} />}
              label={analysis.fromCache ? 'From Cache' : 'Freshly Generated'}
              size="small"
              color={analysis.fromCache ? 'default' : 'success'}
              variant="outlined"
            />
            {analysis.analysisScope?.competitorCount != null && (
              <Chip label={`${analysis.analysisScope.competitorCount} competitors analyzed`} size="small" variant="outlined" />
            )}
            {analysis.metadata?.generationTimeMs && (
              <Chip
                icon={<AccessTime sx={{ fontSize: 14 }} />}
                label={`${(analysis.metadata.generationTimeMs / 1000).toFixed(1)}s`}
                size="small"
                variant="outlined"
              />
            )}
            {analysis.metadata?.dataQuality && (
              <Chip
                label={`Data quality: ${analysis.metadata.dataQuality}`}
                size="small"
                color={analysis.metadata.dataQuality === 'high' ? 'success' : analysis.metadata.dataQuality === 'medium' ? 'warning' : 'error'}
                variant="outlined"
              />
            )}
            {analysis.expiresAt && (
              <Typography variant="caption" color="text.secondary">
                Expires {formatDistanceToNow(new Date(analysis.expiresAt), { addSuffix: true })}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>

          {/* Data Quality Warning */}
          {(analysis.metadata?.dataQuality === 'low' || analysis.metadata?.dataQuality === 'very_low') && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Data quality is {analysis.metadata.dataQuality}. Add more competitor data for more accurate recommendations.
            </Alert>
          )}

          {/* Market Positioning */}
          <MarketPositioningCard positioning={analysis.marketPositioning || analysis.results?.marketPositioning} />

          {/* Analysis Type-Specific Results */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Analysis Results</Typography>
            <AnalysisResults analysisType={currentTypeValue} results={analysis.results} />
          </Box>

          {/* Recommendations */}
          {(analysis.recommendations?.length > 0 || analysis.results?.recommendations?.length > 0) && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                Recommendations ({(analysis.recommendations || analysis.results?.recommendations || []).length})
              </Typography>
              {(analysis.recommendations || analysis.results?.recommendations || [])
                .sort((a, b) => {
                  const order = { critical: 0, high: 1, medium: 2, low: 3 };
                  return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
                })
                .map((rec, idx) => (
                  <RecommendationCard key={idx} rec={rec} />
                ))
              }
            </Box>
          )}

          {/* Metadata Footer */}
          {analysis.metadata && (
            <Card sx={{ mt: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {analysis.metadata.model && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Model</Typography>
                      <Typography variant="body2">{analysis.metadata.model}</Typography>
                    </Box>
                  )}
                  {analysis.createdAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Generated</Typography>
                      <Typography variant="body2">
                        {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  )}
                  {analysis.metadata.competitorDataFreshness && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Data Freshness</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                        <Chip label={`Fresh: ${analysis.metadata.competitorDataFreshness.freshCount}`} size="small"
                          sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontSize: '0.65rem', height: 20 }} />
                        <Chip label={`Aging: ${analysis.metadata.competitorDataFreshness.recentCount}`} size="small"
                          sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', fontSize: '0.65rem', height: 20 }} />
                        <Chip label={`Stale: ${analysis.metadata.competitorDataFreshness.staleCount}`} size="small"
                          sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontSize: '0.65rem', height: 20 }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AIAnalysisPage;
